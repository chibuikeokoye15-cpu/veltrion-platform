# VELTRION repair audit — phase 1 working copy

This is a code-level repair package based on the project files available in this conversation. It has **not** been connected to the user's authenticated GitHub/Vercel accounts, and it has not been tested against the live production URL or Supabase project.

## Changes in this working copy

- Signup and login pages declare their intended page type for `assets/auth.js`.
- Authentication requires a verified `profiles.role`; missing profiles are not silently treated as customers.
- Customer login rejects administrator/compliance accounts and signs them out with a message directing them to the dedicated Admin Login page.
- `account.html` rejects staff roles rather than exposing the customer workspace to them.
- The admin console sends unauthenticated users to `admin-login.html` and checks the profile role before showing its workspace.
- Homepage and markets ticker CSS is scoped more explicitly so shared legacy `.ticker-track` styles do not override the coin ticker's dimensions and animation.
- Market Explorer has client-side asset search/filtering.
- Market-data fetches use CoinGecko's public endpoint and label preview data when live data cannot be obtained. The public endpoint may rate-limit; it is not a production-grade data service.
- Customer dashboard now queries enabled, customer-assigned rows from `public.deposit_addresses` and can display the address and QR image, when the customer-specific migration is applied and addresses are configured.
- Added `supabase/DEPOSIT-ADDRESS-SETUP.md` explaining where receiving addresses are stored and the checks required before configuration.

## Checks performed

- `node --check assets/app.js` — passed.
- `node --check assets/auth.js` — passed.
- `node --check assets/account.js` — passed.
- `node --check assets/admin.js` — passed.
- `npm install --no-audit --no-fund` timed out in this environment. Therefore a complete `npm run build` has **not** been verified here.

## Still required before production

- Complete the Vite build and test every HTML route in the production output.
- Test signup with a new test email and confirm Supabase creates both `auth.users` and a `public.profiles` row. Verify email-confirmation settings and redirect URLs.
- Test a customer account and the admin account independently; verify role policies in Supabase.
- Confirm `20261015_admin_ledger_notifications.sql` has been applied in the correct VELTRION Supabase project.
- Inspect existing `deposit_addresses` rows before running `20261015_customer_deposit_addresses.sql`; the migration intentionally stops if it finds unassigned existing rows.
- Enter the actual verified public wallet addresses only after the network and ownership are confirmed. The actual two address strings were not present in the project files available to this working copy.
- Add a real chain monitoring/verification integration and server-side idempotent crediting before any deposit is treated as paid. Do not credit balances based on user-submitted transaction hashes alone.
- Implement secure withdrawal review/approval and actual broadcast integration, MFA, audit/monitoring, rate limiting, abuse controls, legal/compliance review, and custody/treasury procedures before any live financial service.
- Replace browser-only demo features (newsletter, investment/transaction demonstrations) with real services or label/disable them clearly.

## Deployment caution

A Vercel deployment marked `Ready` only means the deployment completed; it does not prove application functionality. Do not accept real deposits or represent balances as funds held in custody until the remaining checks and controls are complete.


## Added after user confirmation: email-code registration
- Signup now moves to a six-digit code entry step and calls Supabase `verifyOtp` with `type: 'signup'`.
- Added a resend-code action and clear expiry/confidentiality wording. The email copy intentionally excludes the sentence asking recipients to ignore unsolicited mail.
- Added `supabase/EMAIL-OTP-SETUP.md` with the exact Confirm signup email template required (`{{ .Token }}`) and SMTP setup guidance.
- Password login remains email/password only after registration is verified; no OTP is requested on each normal login.
- `node --check` passed for app/auth/account/admin JavaScript. Dependency installation timed out, so Vite production build remains unverified. The email template must still be saved in the user's actual Supabase project and tested end-to-end.


## Follow-up live market feed fix
- Updated the market controller to refresh immediately, then every 60 seconds, and on tab visibility return.
- Added a CoinGecko-first request and Binance public market-data fallback for the supported crypto assets.
- Added request timeouts and clear UI status messages. When both providers fail, the UI says values are preview data and retries later.
- Verified JavaScript syntax with `node --check assets/app.js`.
- Still not verified: browser requests from the user's Vercel domain, API provider uptime/rate limits, or a full Vite production build. Those require a deployed browser test.


## Integrated live market API update (2026-10-17)
- Added a Vercel serverless endpoint at `api/market.js`. It fetches the eight configured crypto assets from CoinGecko and falls back to Binance public 24-hour ticker data. It returns explicit HTTP 503 if both providers fail and caches successful responses briefly at the edge.
- The browser now prefers same-origin `/api/market` to reduce browser CORS/provider access problems, with direct public-provider fallbacks. The existing status text continues to distinguish live data from illustrative preview values.
- Automated local checks: `node --check` passed for all JavaScript files; a mocked eight-asset integration test passed. A real CoinGecko connectivity test could not complete in this execution environment (`fetch failed`), and npm dependency installation timed out, so the Vite production build and actual Vercel deployment remain unverified.
- This API does not require a secret key. It is market-data infrastructure only; it does not verify blockchain deposits, custody funds, or process withdrawals.

## Final local validation pass (2026-10-17)
- Expanded `tests/market-api-smoke.mjs` to exercise both the primary CoinGecko response and the Binance fallback, reject unsupported HTTP methods, and confirm that failure of both providers returns HTTP 503 rather than fabricated quotes.
- Ran the expanded market API smoke test successfully.
- Ran `node --check` on every JavaScript/module file in `assets/`, `api/`, `tests/`, and `vite.config.js`; all passed.
- Retried dependency installation. It failed because this environment could not resolve `registry.npmjs.org` (`EAI_AGAIN`), so a production Vite build still cannot be honestly marked as passed.
- No authenticated GitHub, Vercel, or Supabase account access is available in this chat. No production deployment or real account signup has been performed from this environment.
