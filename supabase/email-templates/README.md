# SkillMatchPH Supabase email templates

## Confirm signup

Supabase Dashboard setup:

1. Open **Authentication → Email Templates → Confirm signup**.
2. Set subject to:

   ```text
   Your SkillMatchPH verification code
   ```

3. Copy the complete contents of `confirm-signup.html` into the message body.
4. Save the template.
5. Open **Authentication → Providers → Email** and enable **Confirm email**.
6. Keep your normal application Site URL configured under **Authentication → URL Configuration**.

The template uses Supabase's `{{ .Token }}` variable. Supabase replaces it with the project's eight-digit signup verification code, which the app submits through `verifyOtp({ type: 'signup' })`. Do not replace this variable with `{{ .ConfirmationURL }}`.

The header references the app icon at:

```text
https://skill-match-ph.vercel.app/email-logo.png
```

That file comes from `public/email-logo.png`, rendered from the existing `public/favicon.svg`. Deploy the app before sending test emails so Gmail and other email clients can load the public image URL.
