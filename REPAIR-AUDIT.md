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
- Market-data fetches use one batched CoinGecko public API request for eight assets. Prices and 24-hour changes update on the homepage ticker, homepage asset cards, and Market Explorer, then refresh every 60 seconds. Values stay blank until real data is received; failures are reported honestly instead of showing sample quotes as current prices. The public endpoint can rate-limit and is not a production-grade data service.
- Customer dashboard now queries enabled, customer-assigned rows from `public.deposit_addresses` and can display the address and QR image, when the customer-specific migration is applied and addresses are configured.
- Added `supabase/DEPOSIT-ADDRESS-SETUP.md` explaining where receiving addresses are stored and the checks required before configuration.

## Checks performed

- `node --check assets/app.js` — passed.
- `node --check assets/auth.js` — passed.
- `node --check assets/account.js` — passed.
- `node --check assets/admin.js` — passed.
- `node --check assets/app.js` — passed after the live-feed changes.
- A live HTTP request to CoinGecko could not be tested in this environment because DNS/network access was unavailable.
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
