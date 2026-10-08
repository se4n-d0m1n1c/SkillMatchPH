# Student email-link recovery deployment

Public account recovery replaces new administrator-contact requests. Existing requests and administrator assistance tools remain available. Signed-in username changes retain their existing password/cooldown flow.

## Deployment checklist

1. Review and apply `student_email_recovery.sql` before deploying its Edge Function. It supplies the service-role-only username recovery operation and transactional password-change notifications.
2. Run `supabase functions deploy complete-account-recovery`. Repository `config.toml` disables JWT gateway verification for this function. This endpoint is public because users do not yet have a session; it authenticates the single-use recovery token itself.
3. In Supabase Authentication → URL Configuration, set Site URL to the real web application origin (production: `https://skill-match-ph.vercel.app`). Allow the `/recover-account` redirect URL. Use a separate project/Site URL for local testing.
4. In Authentication → Email Templates → Reset Password, paste `email-templates/reset-password.html`. Suggested subject: `Recover your SkillMatchPH account`.
5. Keep `{{ .TokenHash }}` in the URL fragment. Do not substitute `{{ .ConfirmationURL }}`: the recovery page must hold the unused token until the student submits their new credential. The custom template uses Site URL, not the caller-provided redirect URL.
6. Configure working SMTP, recovery expiry, and email rate limits. Disable email-provider link tracking for recovery emails. Never log or forward recovery links.
7. Deploy the frontend and ensure `/recover-account` serves the SPA on direct navigation.

## Expected behavior

- Public request form accepts the registered email and shows a generic response rather than revealing whether an account exists.
- Email opens a recovery form, not an authenticated dashboard. The form offers either a password change or a username change.
- The server consumes the token only on submission, checks the recovered identity is a student, and applies the selected change. Ordinary session tokens cannot replace the email recovery token.
- The frontend does not receive or install recovery session tokens. The student signs in normally after success.
- Successful username and password changes appear in administrator notifications. Notification data must never contain a password, recovery token, or email link.
- Expired, already-used, or invalid links require a new request. A token may be consumed even when the subsequent update fails; request a fresh link before retrying.

## Release tests (run against a staging Supabase project)

- Valid student email: receive link; reset password; old password fails and new password works; one password notification appears.
- New recovery link: change username; new username works; username notification appears.
- Invalid/expired/reused token: no credential change and no success notification.
- Administrator email: recovery endpoint refuses student-only changes.
- Unknown email: request response does not disclose account existence.
- Username already taken / invalid input: safe error; follow fresh-link guidance if token was consumed.
- Open link in another browser or while another account is logged in: only the email-token owner may be changed.
- Ordinary session JWT or fabricated token: cannot call service-role recovery RPC.
- Existing signed-in username editor, administrator password reset, legacy contact requests, and signup eight-digit OTP remain functional.

Source inspection and local build/lint are not proof of SMTP delivery, deployed SQL behavior, or live token expiry. Run these staging tests before release.
