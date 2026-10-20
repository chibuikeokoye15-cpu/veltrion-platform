# VELTRION implementation status (working package)

## Included in this package
- Added `/api/candles` Vercel serverless endpoint with allow-listed pairs/intervals, timeouts, payload validation, short caching, Binance primary + Binance.US fallback, and honest HTTP 503 on provider failure.
- Market Explorer now requests the same-origin candle endpoint first, has direct-provider fallbacks, validates candle data, refreshes every 30 seconds, redraws on resize, and does not substitute invented candle data when providers fail. Candle and volume bars are drawn in the same canvas with green/red direction coding.
- Added SQL migration `supabase/migrations/20261020_joint_accounts_admin_topups.sql`: joint-account records, membership, read policies, customer joint-account creation RPC, staff joint-account list/member list RPCs, append-only joint ledger, audited admin top-up/debit RPC, and member notification. Joint admin top-ups explicitly record the member on whose behalf the top-up was made.
- Added customer dashboard UI to create a joint account and read its shared ledger, plus admin UI to choose a joint account/member and record an audited adjustment.
- Added SQL migration `supabase/migrations/20261020_shared_wallet_addresses.sql` to configure the supplied BTC and ETH public addresses as shared receiving addresses and show them to authenticated customers. Minimum is configured as USD 500 for each. This uses shared wallet addresses, so transaction attribution must be manually verified by staff; no deposit is automatically credited by this migration.
- Preserved the signup six-digit verification flow and email/password login implementation.

## Must be completed before accepting real deposits or using joint accounts for real funds
1. Verify the two public addresses against Trust Wallet character-by-character before applying the shared-address migration.
2. Apply migrations in order in the correct Supabase project: `20261015_admin_ledger_notifications.sql`, `20261015_customer_deposit_addresses.sql` (review existing rows first), `20261020_joint_accounts_admin_topups.sql`, then `20261020_shared_wallet_addresses.sql`. Do not run a migration blindly against a project with existing production data.
3. Joint account invitations, membership acceptance, revocation, and joint withdrawal approval are not fully implemented in this package; the UI says this plainly. Do not represent them as complete.
4. A real chain-monitoring service and idempotent server-side deposit-crediting/reconciliation workflow are still required. The shared wallet addresses alone cannot reliably determine which customer sent a transfer. Until a verified transaction is reviewed, do not credit a customer or joint account balance.
5. Review admin roles and RLS in Supabase. Protect admin accounts with MFA. Test with separate customer and admin accounts.
6. Configure Vercel environment variables and deploy through the connected repository; deployment is not performed from this package.
7. `npm run build` has not passed in this environment because Vite is not installed and dependency installation previously failed. Install dependencies in a network-enabled environment and run the build before deployment.

## Checks run in this workspace
- `node --check` for JavaScript files: expected to pass after the included patch; rerun on the final ZIP.
- Existing `tests/market-api-smoke.mjs`: validates the quote endpoint fallback/error behavior; this does not test live provider connectivity.
- No live Supabase, Vercel, GitHub, or production-browser test was performed here.
