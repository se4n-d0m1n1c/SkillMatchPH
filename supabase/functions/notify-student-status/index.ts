import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Emails a student when an administrator approves or rejects their account.
 *
 * Supabase hosts this logic but its built-in sender only covers authentication
 * templates and refuses to send arbitrary message bodies, so delivery goes
 * through a transport chosen from whichever secrets are configured:
 *
 *  1. SMTP  - reuses the same mail account already configured for Supabase Auth
 *             emails. Supabase blocks outbound ports 25 and 587, so the
 *             connection must use implicit TLS on 465.
 *  2. Resend - HTTP fallback when no SMTP secrets are present.
 *
 * With neither configured the function reports email_not_configured and records
 * nothing, so the notification can be sent later without creating a duplicate.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

const SUPPORT_EMAIL = 'skillmatchph76@gmail.com';
const NOTIFY_STATUSES = ['approved', 'rejected'];

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const layout = (heading: string, accent: string, body: string) => `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f4f6fa;font-family:Arial,Helvetica,sans-serif;color:#172033">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
      <p style="margin:0 0 4px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b">SkillMatchPH</p>
      <h1 style="margin:0 0 16px;font-size:24px;color:${accent}">${heading}</h1>
      ${body}
      <p style="margin:28px 0 0;font-size:13px;color:#64748b">SkillMatchPH account support</p>
    </div>
  </body>
</html>`;

const button = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;padding:14px 22px;border-radius:8px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:bold">${label}</a></p>`;

const buildApprovedEmail = ({ firstName, username, siteUrl }) => ({
  subject: 'Your SkillMatchPH account has been approved',
  html: layout('Your account is approved', '#0f766e', `
      <p style="margin:0 0 12px;line-height:1.6">Hello ${escapeHtml(firstName)},</p>
      <p style="margin:0 0 12px;line-height:1.6">
        Good news — an administrator has reviewed and <strong>approved</strong> your SkillMatchPH account.
        You can now sign in and use the full assessment and program-matching tools.
      </p>
      <p style="margin:0 0 12px;line-height:1.6">
        Sign in with your username: <strong>${escapeHtml(username)}</strong>
      </p>
      ${button(`${siteUrl}/`, 'Sign in to SkillMatchPH')}
      <p style="margin:0;line-height:1.6">Once you are in, you can take the interest and aptitude assessment to see the college programs that fit you best.</p>
  `),
});

const buildRejectedEmail = ({ firstName, siteUrl }) => ({
  subject: 'Update on your SkillMatchPH account',
  html: layout('Your account was not approved', '#b91c1c', `
      <p style="margin:0 0 12px;line-height:1.6">Hello ${escapeHtml(firstName)},</p>
      <p style="margin:0 0 12px;line-height:1.6">
        An administrator reviewed your SkillMatchPH account application and was unable to approve it at this time.
      </p>
      <p style="margin:0 0 12px;line-height:1.6">
        If you believe this was a mistake, or your details need correcting, reply to
        <a href="mailto:${SUPPORT_EMAIL}?subject=SkillMatchPH%20Rejected%20Account%20Inquiry" style="color:#b91c1c;font-weight:bold">${SUPPORT_EMAIL}</a>
        and our team will look into it.
      </p>
      ${button(`${siteUrl}/`, 'Back to SkillMatchPH')}
  `),
});

const readSmtpConfig = () => {
  const hostname = Deno.env.get('SMTP_HOST');
  const username = Deno.env.get('SMTP_USER');
  const password = Deno.env.get('SMTP_PASS');
  if (!hostname || !username || !password) return null;

  return {
    hostname,
    // Implicit TLS. Supabase blocks outbound 25 and 587, so 465 is the only
    // usable submission port.
    port: Number(Deno.env.get('SMTP_PORT') || 465),
    username,
    password,
  };
};

const sendViaSmtp = async (smtp: NonNullable<ReturnType<typeof readSmtpConfig>>, message: { from: string; to: string; subject: string; html: string }) => {
  const { SMTPClient } = await import('https://deno.land/x/denomailer@1.6.0/mod.ts');
  const client = new SMTPClient({
    connection: {
      hostname: smtp.hostname,
      port: smtp.port,
      tls: true,
      auth: { username: smtp.username, password: smtp.password },
    },
  });

  try {
    await client.send({
      from: message.from,
      to: message.to,
      subject: message.subject,
      content: 'auto',
      html: message.html,
    });
  } finally {
    await client.close();
  }
};

const sendViaResend = async (apiKey: string, message: { from: string; to: string; subject: string; html: string }) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: message.from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Mail provider rejected the message (${response.status}): ${detail.slice(0, 200)}`);
  }
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Server authentication is not configured' }, 500);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization) return json({ error: 'Authentication required' }, 401);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'A JSON body is required' }, 400);
  }

  const studentId = typeof body.studentId === 'string' ? body.studentId : '';
  const status = typeof body.status === 'string' ? body.status : '';
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) return json({ error: 'A student id is required' }, 400);
  if (!NOTIFY_STATUSES.includes(status)) return json({ error: 'Status must be approved or rejected' }, 400);

  try {
    // Only a signed-in administrator may trigger a status notification.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller) return json({ error: 'Invalid or expired session' }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', caller.id).single();
    if (callerProfile?.role !== 'admin') return json({ error: 'Administrator access required' }, 403);

    const { data: student, error: studentError } = await admin
      .from('profiles')
      .select('id, role, first_name, username, status')
      .eq('id', studentId)
      .single();
    if (studentError || !student) return json({ error: 'Student not found' }, 404);
    if (student.role !== 'student') return json({ error: 'Student not found' }, 404);

    // Idempotency: never send the same notification twice for one account.
    const { data: alreadySent } = await admin
      .from('student_status_emails')
      .select('id, sent_at')
      .eq('student_id', studentId)
      .eq('status', status)
      .maybeSingle();
    if (alreadySent) {
      return json({ sent: false, reason: 'already_sent', sentAt: alreadySent.sent_at });
    }

    const smtp = readSmtpConfig();
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!smtp && !resendKey) {
      // Nothing recorded, so this can be sent later without a duplicate.
      return json({ sent: false, reason: 'email_not_configured' });
    }

    const { data: account, error: accountError } = await admin.auth.admin.getUserById(studentId);
    if (accountError || !account?.user?.email) return json({ error: 'Student email is unavailable' }, 404);

    const siteUrl = (Deno.env.get('SITE_URL') || 'https://skill-match-ph.vercel.app').replace(/\/$/, '');
    // Mail servers reject a sender they do not own, so the SMTP account address
    // is the safe default when nothing explicit is configured.
    const from = Deno.env.get('STATUS_EMAIL_FROM')
      || (smtp ? `SkillMatchPH <${smtp.username}>` : 'SkillMatchPH <onboarding@resend.dev>');

    const message = status === 'approved'
      ? buildApprovedEmail({ firstName: student.first_name || 'there', username: student.username || '', siteUrl })
      : buildRejectedEmail({ firstName: student.first_name || 'there', siteUrl });

    const payload = {
      from,
      to: account.user.email,
      subject: message.subject,
      html: message.html,
    };

    const transport = smtp ? 'smtp' : 'resend';
    try {
      if (smtp) {
        await sendViaSmtp(smtp, payload);
      } else {
        await sendViaResend(resendKey as string, payload);
      }
    } catch (sendError) {
      const detail = sendError instanceof Error ? sendError.message : 'unknown error';
      console.error(`notify-student-status: ${transport} delivery failed`, detail);
      return json({ sent: false, reason: 'provider_error', transport, detail }, 502);
    }

    // Recorded only after a confirmed send, so failures stay retryable.
    const { error: ledgerError } = await admin.from('student_status_emails').insert({
      student_id: studentId,
      status,
      recipient: account.user.email,
    });
    if (ledgerError && ledgerError.code !== '23505') {
      // The mail went out; a ledger problem must not be reported as a send failure.
      console.error('notify-student-status: ledger insert failed', ledgerError.message);
    }

    return json({ sent: true, status, transport, recipient: account.user.email });
  } catch (error) {
    console.error('notify-student-status:', error instanceof Error ? error.message : 'unknown error');
    return json({ error: 'Unable to send the status email' }, 500);
  }
});
