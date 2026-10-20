# VELTRION — review of uploaded working package

Review date: 20 October 2026

## What was checked in this package
- JavaScript syntax check passed for every file in `assets/`, `api/`, `tests/`, and `vite.config.js`.
- `node tests/market-api-smoke.mjs` passed: CoinGecko success, Binance fallback, method guard, and HTTP 503 when both providers fail.
- The package contains the existing VELTRION multi-page frontend, Supabase client/auth files, customer account dashboard, admin dashboard, market endpoints, and SQL migration files.
- The Vercel configuration builds with `npm run build` and publishes `dist/`.

## What is not verified
- `npm install --no-audit --no-fund` timed out in this environment, so a Vite production build could not be completed here.
- No live Supabase login/signup, live database migration, GitHub push, Vercel deployment, or deployed-browser test was performed. Do not treat these as completed.
- The shared BTC/ETH addresses are included in the SQL migration but have not been independently verified against Trust Wallet. Verify every character and network before using them.
- Shared receiving addresses do not uniquely identify which customer paid. Deposits must not be automatically credited based on these addresses alone; reconcile transactions and confirmations manually until a server-side chain monitor and idempotent credit/reconciliation workflow is implemented and tested.
- Joint-account creation and admin adjustments are included, but invitations, invite acceptance, membership revocation, and joint withdrawal approval are not fully implemented. Do not use joint accounts for real funds yet.
- The contact page currently contains a placeholder support email (`veltrion.support@example.com`); replace it with an inbox controlled by the operator before launch.

## Important deployment safety
1. Do not rerun `supabase/schema.sql`; it is the base schema and the project already has existing objects.
2. Do not apply migrations blindly. Review the live schema and existing `deposit_addresses` records first, then apply only migrations that are needed, in a reviewed order.
3. Keep `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel's project environment settings. Never put service-role keys, database passwords, wallet private keys, or seed phrases in browser variables or files.
4. After migration and environment setup, deploy through the existing GitHub-connected Vercel project and verify signup, email code, login, customer dashboard, admin role checks, RLS, and market endpoints with separate test accounts.
5. Before any real-money service, complete security/MFA, operational monitoring, transaction reconciliation, withdrawal approval and broadcast, backup/recovery, and legal/compliance review.

## Operator action required
This workspace cannot sign in to your private GitHub, Supabase, or Vercel accounts, so it cannot push the code, apply SQL, or deploy on your behalf. This ZIP is a reviewed working copy; it is not proof of a production deployment.
