import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
const authOptions = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: 'Recovery is not configured' }, 500);

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return json({ error: 'Request too large' }, 413);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid body');
    body = parsed;
  } catch {
    return json({ error: 'A JSON object is required' }, 400);
  }
  const { token_hash, action, password, username } = body;
  if (typeof token_hash !== 'string' || !token_hash || token_hash.length > 512 || /\s/.test(token_hash)) {
    return json({ error: 'Recovery token is required' }, 400);
  }
  if (action !== 'password' && action !== 'username') return json({ error: 'Choose password or username recovery' }, 400);
  const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : '';
  if (action === 'username' && !/^[a-z0-9][a-z0-9._-]{2,29}$/.test(normalizedUsername)) {
    return json({ error: 'Username must be 3-30 characters and use only letters, numbers, dots, underscores, or hyphens' }, 400);
  }
  if (action === 'password' && (typeof password !== 'string' || password.length < 8 || password.length > 128)) {
    return json({ error: 'Password must be between 8 and 128 characters' }, 400);
  }

  // Never forward caller Authorization: account identity comes ONLY from email token.
  const verifier = createClient(supabaseUrl, anonKey, { auth: authOptions });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: authOptions });
  let recoveryAccessToken: string | undefined;
  let consumed = false;
  try {
    const { data, error } = await verifier.auth.verifyOtp({ token_hash, type: 'recovery' });
    recoveryAccessToken = data.session?.access_token;
    if (error || !data.user || !recoveryAccessToken) {
      return json({ error: 'Recovery link is invalid, expired, or already used. Request a new link.', code: 'invalid_recovery_link' }, 401);
    }
    consumed = true;
    const userId = data.user.id;
    const { data: profile, error: profileError } = await admin.from('profiles').select('role').eq('id', userId).single();
    if (profileError || profile?.role !== 'student') {
      return json({ error: 'Student account required', code: 'student_required', tokenConsumed: true }, 403);
    }

    if (action === 'username') {
      const { data: result, error: updateError } = await admin.rpc('recover_student_username', {
        target_user_id: userId,
        requested_username: normalizedUsername,
      });
      if (updateError) {
        const safeErrors = ['That username is already in use', 'Choose a different username', 'Student account required'];
        const safeMessage = safeErrors.find((message) => updateError.message === message);
        return json({ error: safeMessage ?? 'Unable to recover username. Request a new link before retrying.', tokenConsumed: true }, safeMessage ? 400 : 500);
      }
      return json({ success: true, action, ...result?.[0] });
    }

    // Password notification is inserted by auth.users trigger in same transaction.
    const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password: password as string });
    if (updateError) {
      return json({ error: 'Unable to update password. Check password policy and request a new link before retrying.', tokenConsumed: true }, 400);
    }
    return json({ success: true, action });
  } catch {
    // Never log request, token, password, Auth response, or session objects.
    return json({ error: 'Unable to complete recovery. Request a new link before retrying.', tokenConsumed: consumed }, 500);
  } finally {
    if (recoveryAccessToken) {
      try {
        // Drop server-created refresh session; never expose session tokens to caller.
        const { error } = await admin.auth.admin.signOut(recoveryAccessToken, 'local');
        if (error) console.error('complete-account-recovery: session cleanup failed');
      } catch {
        console.error('complete-account-recovery: session cleanup failed');
      }
    }
  }
});
