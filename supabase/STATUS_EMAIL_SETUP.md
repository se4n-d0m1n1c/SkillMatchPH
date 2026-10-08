# Student approval and rejection emails

When an administrator approves or rejects a student, `notify-student-status`
emails that student. The status change is saved first and never depends on the
email succeeding.

## Why an outside mail service

Supabase hosts the function and can transport data, but it cannot deliver an
arbitrary custom message. Its built-in sender is limited to authentication
templates and is capped at roughly two messages per hour, and it refuses to
deliver to addresses outside the project team. Supabase's own guidance for
non-auth email is to call a provider from an Edge Function, which is what this
does.

## Setup

1. Create a free account at [resend.com](https://resend.com) and copy an API key.
2. Add the key as a function secret:
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxxxxxx
   ```
3. Apply the ledger migration so repeat approvals cannot send twice:
   ```text
   supabase/student_status_emails.sql
   ```
4. Deploy the function:
   ```bash
   supabase functions deploy notify-student-status
   ```
5. In **Admin → Students**, approve a pending test student. Check the inbox.

Optional secrets:

| Secret | Purpose | Default |
|---|---|---|
| `STATUS_EMAIL_FROM` | Sender address | `SkillMatchPH <onboarding@resend.dev>` |
| `SITE_URL` | Origin used in the email buttons | `https://skill-match-ph.vercel.app` |

## Sender address caveat

`onboarding@resend.dev` only delivers to the Resend account owner's own address.
That is fine for testing, but **real students will not receive anything until you
verify a domain in Resend** and set `STATUS_EMAIL_FROM` to an address on it, for
example `SkillMatchPH <no-reply@yourdomain.edu.ph>`.

The same trap exists on the Supabase side: without custom SMTP configured in
Authentication → Emails → SMTP Settings, Supabase Auth refuses to deliver
signup and recovery emails to anyone outside the project team. Configure both
before your defence, or students receive nothing at all.

## Behaviour

- **Approve** sends a welcome message with the student's username and a sign-in link.
- **Reject** sends a notice pointing to `skillmatchph76@gmail.com` for follow-up.
- The edit modal's status dropdown triggers the same email, so changing status
  there is equivalent to using the Approve/Reject buttons.
- `student_status_emails` records each delivered notification with a unique
  `(student_id, status)` pair, so approving twice sends one email. Changing a
  status and changing it back **does** send again, because that is a new decision.
- Nothing is recorded when a send fails, so the same notification can be retried.
- The admin page shows a dismissible banner with a **Retry** button when a send
  fails, including the case where no API key is configured yet.

## Security

The function requires a signed-in session (`verify_jwt = true`) and then confirms
the caller's profile role is `admin` before doing anything. The student's email
address is read with the service role, never exposed to the browser. Ledger rows
are readable by administrators only and are written solely by the function.

## Verification status

The frontend build and function syntax are checked locally. **Email delivery
itself has not been tested** — that needs the API key, the deployed function, and
a real mailbox. Treat the checklist below as outstanding work.

## Release tests

- Approve a pending student: one email arrives, wording names the correct student.
- Approve the same student again: no second email, no error banner.
- Reject a student: rejection wording arrives with the support address.
- Reject then approve: two emails, one per decision.
- Change status through the edit modal: the matching email arrives.
- No `RESEND_API_KEY` set: banner reports it is not configured, status still saves,
  and pressing Retry after adding the key sends the email.
- Invalid API key: banner reports the provider rejected the message.
- Signed-out or non-admin caller: function returns 401 or 403 and sends nothing.
