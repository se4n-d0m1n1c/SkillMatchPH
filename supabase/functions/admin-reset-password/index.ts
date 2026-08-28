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
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: 'Server authentication is not configured' }, 500);
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) return json({ error: 'Invalid or expired session' }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (callerProfile?.role !== 'admin') return json({ error: 'Administrator access required' }, 403);

    const { userId, password } = await request.json();
    if (typeof userId !== 'string' || typeof password !== 'string') {
      return json({ error: 'A student and password are required' }, 400);
    }
    if (password.length < 8 || password.length > 128) {
      return json({ error: 'Password must be between 8 and 128 characters' }, 400);
    }

    const { data: targetProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (targetProfile?.role !== 'student') return json({ error: 'Student not found' }, 404);

    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, { password });
    if (updateError) return json({ error: updateError.message }, 400);

    return json({ success: true });
  } catch (error) {
    console.error('admin-reset-password:', error);
    return json({ error: 'Unable to change the password' }, 500);
  }
});
