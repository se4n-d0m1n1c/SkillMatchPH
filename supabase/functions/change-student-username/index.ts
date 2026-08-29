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
    const authorization = request.headers.get('Authorization');
    if (!authorization) return json({ error: 'Authentication required' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: 'Server authentication is not configured' }, 500);

    const { username, password } = await request.json();
    const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : '';
    if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(normalizedUsername) || typeof password !== 'string' || password.length === 0) {
      return json({ error: 'A valid username and current password are required' }, 400);
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user?.email) return json({ error: 'Invalid or expired session' }, 401);

    const verifier = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: passwordError } = await verifier.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (passwordError) return json({ error: 'Current password is incorrect' }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await adminClient.rpc('change_student_username_after_verification', {
      target_user_id: user.id,
      requested_username: normalizedUsername,
    });
    if (error) return json({ error: error.message }, 400);

    return json(data?.[0] ?? { username: normalizedUsername });
  } catch (error) {
    console.error('change-student-username:', error);
    return json({ error: 'Unable to change username' }, 500);
  }
});
