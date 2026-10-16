# VELTRION Supabase setup

## Current foundation
- `schema.sql` creates the initial database tables and row-level security policies.
- Customer signup/login is wired to Supabase Auth in the site code.
- The account page checks the signed-in user's profile.

## Browser environment variables
Set these in Vercel after the application code is ready:
- `VITE_SUPABASE_URL`: Supabase project URL (shown as the API URL in the Supabase dashboard).
- `VITE_SUPABASE_PUBLISHABLE_KEY`: the project's publishable key.

The publishable key is designed for browser use when row-level security is correctly configured. Never expose a secret key, service-role key, database password, wallet private key, or seed phrase in frontend code or any `VITE_*` variable.

## Before production
This is not a complete financial backend. Do not enable real deposits, withdrawals, investments, or customer balance credits until the platform has:
- server-side authorization and an audited admin bootstrap process;
- a double-entry ledger and concurrency-safe balance reservations;
- a wallet/blockchain provider, unique per-customer/per-asset/per-network address allocation, server-side transaction verification and confirmation thresholds;
- idempotent deposit processing and payout-provider integration;
- MFA, rate limits, audit logging, monitoring, legal/compliance review, and security testing.

The current `deposit_addresses` table in the initial schema still needs a migration to support multiple unique addresses per customer, asset and network. Do not treat its current rows as production deposit infrastructure.
