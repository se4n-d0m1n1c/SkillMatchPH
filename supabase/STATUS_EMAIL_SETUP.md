# Student approval and rejection emails

When an administrator approves or rejects a student, `notify-student-status`
emails that student. The status change is saved first and never depends on the
email succeeding.

## Choosing a transport

The function picks a transport from whichever secrets exist, preferring the mail
account you already use:

| Order | Transport | Secrets | Notes |
|---|---|---|---|
| 1 | **SMTP** | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Reuses your existing mail account. **Port 465 only.** |
| 2 | Resend | `RESEND_API_KEY` | HTTP fallback if no SMTP secrets are set |

With neither configured, the function answers `email_not_configured`, records
nothing, and the admin page offers a Retry.

### Why port 465 and not 587

Supabase's [Edge Function limits](https://supabase.com/docs/guides/functions/limits) state:

> Outgoing connections to ports `25` and `587` are not allowed.

Your Supabase Auth SMTP settings probably use 587. That works for Supabase's own
auth servers, but **an Edge Function cannot use 587 or 25**. Implicit TLS on
**465** is permitted, and [Supabase's own issue on this](https://github.com/supabase/supabase/issues/21977)
contains working code sending mail from Gmail SMTP on 465.

Check your provider's 465 endpoint before starting. Gmail, Brevo, Mailjet, and
Zoho all offer one. If your provider is 587-only, use the Resend fallback.

## Setup (dashboard)

You do not need the CLI for any of this.

1. **Add the secrets.** Dashboard → **Edge Functions** → **Manage secrets** (also
   under Project Settings → Edge Functions). Add:
   - `SMTP_HOST` — for example `smtp.gmail.com`
   - `SMTP_PORT` — `465`
   - `SMTP_USER` — the full mailbox address, for example `skillmatchph76@gmail.com`
   - `SMTP_PASS` — the mailbox password or app password
2. **Note the credentials are not shared.** Supabase Auth stores its SMTP
   password securely and will not show it to you. Copy the same values from your
   mail provider into these secrets.
3. **Apply the migration** so repeat approvals cannot send twice. SQL Editor →
   paste and run `supabase/student_status_emails.sql`.
4. **Deploy the function.** Dashboard → Edge Functions → create or edit
   `notify-student-status`, paste `index.ts`, and deploy. (CLI equivalent:
   `supabase functions deploy notify-student-status`.)
5. **Approve a pending test student** in Admin → Students and check the inbox.

Optional secrets:

| Secret | Purpose | Default |
|---|---|---|
| `STATUS_EMAIL_FROM` | Sender header | the `SMTP_USER` address |
| `SITE_URL` | Origin used in the email buttons | `https://skill-match-ph.vercel.app` |

## Sender address caveats

- With SMTP, the sender **must be the authenticated mailbox**. Mail servers
  reject or rewrite a `From` they do not own, which is why the default is
  `SMTP_USER`. On Gmail this is enforced strictly.
- With Resend, the default `onboarding@resend.dev` only delivers to the Resend
  account owner. Verify a domain and set `STATUS_EMAIL_FROM` to reach students.
- If your mailbox uses two-factor authentication (Gmail, for example), you need
  an **app password**, not your normal login password.

## Behaviour

- **Approve** sends a welcome message with the student's username and a sign-in link.
- **Reject** sends a notice pointing to `skillmatchph76@gmail.com` for follow-up.
- The edit modal's status dropdown triggers the same email, so changing status
  there is equivalent to using the Approve/Reject buttons.
- `student_status_emails` records each delivered notification with a unique
  `(student_id, status)` pair, so approving twice sends one email. Reject then
  approve **does** send twice, because that is a new decision.
- Nothing is recorded when a send fails, so the same notification can be retried.
- The admin page shows a dismissible banner with a **Retry** button on failure,
  including when no mail settings are configured yet.

## Security

The function requires a signed-in session (`verify_jwt = true`) and then confirms
the caller's profile role is `admin` before doing anything. The student's address
is read with the service role and never exposed to the browser. Ledger rows are
readable by administrators only and written solely by the function. The mailbox
password lives only in Edge Function secrets.

## Verification status

The function passes a syntax check and the frontend build is clean. **Delivery
has not been tested**, because that needs your mail credentials and a real
mailbox. The checklist below is outstanding work — run it before your defence.

## Release tests

- Approve a pending student: one email arrives, naming the correct student.
- Approve the same student again: no second email and no error banner.
- Reject a student: rejection wording arrives with the support address.
- Reject then approve: two emails, one per decision.
- Change status through the edit modal: the matching email arrives.
- No mail secrets set: banner explains it is not configured, status still saves,
  and Retry sends the email after the secrets are added.
- Wrong mailbox password: banner reports the mail server rejected the message.
- Provider only supports 587: delivery fails; switch to the Resend fallback.
- Signed-out or non-admin caller: 401 or 403, and nothing is sent.
