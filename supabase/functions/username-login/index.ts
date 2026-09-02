import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: 'Server authentication is not configured' }, 500);
    }

    const { username, password } = await request.json();
    const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : '';
    if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(normalizedUsername) || typeof password !== 'string') {
      return json({ error: 'Invalid username or password' }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (!profile) {
      // Keep unknown-user requests on the same Auth path as bad passwords to
      // reduce observable timing differences and preserve generic errors.
      await createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      }).auth.signInWithPassword({ email: 'invalid-login@invalid.local', password });
      return json({ error: 'Invalid username or password' }, 401);
    }

    const { data: account, error: accountError } = await adminClient.auth.admin.getUserById(profile.id);
    if (accountError || !account.user?.email) return json({ error: 'Invalid username or password' }, 401);
    if (!account.user.email_confirmed_at) {
      return json({ error: 'Please verify your email before signing in.' }, 403);
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await authClient.auth.signInWithPassword({
      email: account.user.email,
      password,
    });

    if (error || !data.session) return json({ error: 'Invalid username or password' }, 401);

    return json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (error) {
    console.error('username-login:', error);
    return json({ error: 'Unable to sign in' }, 500);
  }
});
