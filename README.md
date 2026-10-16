# VELTRION

VELTRION is a vivid, responsive digital-asset platform website prototype. The approved visual design is preserved while core account authentication is being connected to Supabase.

## Current implementation
- Static public pages and the existing visual design.
- Supabase Auth signup and password login wired in `assets/auth.js`.
- Authenticated account page in `account.html` that checks the user's Supabase profile.
- Initial database schema and row-level security policies in `supabase/schema.sql`.

## Local development
1. Install Node.js LTS.
2. Copy `.env.example` to `.env.local`.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.
4. Run `npm install`.
5. Run `npm run dev`.
6. Run `npm run build` to test the production build.

## Vercel
Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the project's Environment Variables before building. A new deployment is required for Vite environment variables to be included in the built browser bundle.

## Important limitations
Authentication wiring is a foundation, not a complete financial platform. The admin page still contains demo-only behavior. Balances, ledger, deposits, unique customer deposit addresses, blockchain verification, withdrawals, payout processing, live market prices, compliance workflows, MFA and production security hardening are not yet complete. Do not accept customer funds or present demo balances/quotes as real.

## Current integration status

This package adds the initial Supabase auth flow, customer account views, and an authenticated administrator console backed by database RPCs for customer list access, ledger adjustments, and notifications. It is not a complete live-money crypto platform: blockchain deposit monitoring, address provisioning, secure payout processing, live market data, and production security review still require provider/backend integration and testing.

See `supabase/ADMIN-SETUP.md` before applying the new migration or granting the first admin role. The original `supabase/schema.sql` has already been run in the owner's project; do not run it again.
