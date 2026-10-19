# VELTRION email OTP setup

1. In the VELTRION Supabase project, open Authentication → Email Templates → Confirm signup.
2. Change the subject to `Your VELTRION verification code`.
3. Replace the confirmation-link body with the token-based HTML below.
4. Save the template. The frontend uses `supabase.auth.verifyOtp({ email, token, type: 'signup' })`, so the email must contain `{{ .Token }}` rather than only `{{ .ConfirmationURL }}`.
5. For branded delivery, configure a verified sending domain and custom SMTP provider under Authentication settings. Keep SMTP credentials private; never place them in VITE_ environment variables or frontend files.
6. Test with a new email address: register, receive the six-digit code, verify it on the signup page, then sign out and sign in with email/password. Password login should not ask for a new code.

Suggested subject: `Your VELTRION verification code`

```html
<h2>Welcome to VELTRION</h2>
<p>Global Crypto Investment Platform</p>
<p>To complete your registration, enter this verification code on the official VELTRION website:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:8px">{{ .Token }}</p>
<p>This code expires after a limited time. For your account security, keep your code confidential and enter it only on the official VELTRION website.</p>
<p>Thank you for choosing VELTRION.</p>
<p><strong>VELTRION Team</strong><br>Global Crypto Investment Platform</p>
```

The email deliberately excludes the requested “ignore this email” sentence. The token length and expiry are governed by Supabase authentication settings. This setup does not itself configure SMS delivery.
