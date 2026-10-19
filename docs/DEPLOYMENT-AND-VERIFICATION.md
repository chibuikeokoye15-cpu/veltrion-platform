# VELTRION deployment and verification checklist

This repository contains the site and its Vercel market endpoint. The source checks are not a substitute for a live deployment test.

## Required Vercel environment variables

Set these for Production (and Preview if you test previews), then redeploy:

- `VITE_SUPABASE_URL` — the URL of the VELTRION Supabase project.
- `VITE_SUPABASE_PUBLISHABLE_KEY` — the project's publishable/anon key.

Never put a Supabase `service_role` key, wallet private key, seed phrase, or SMTP password in a `VITE_` variable or browser code.

## Vercel market endpoint

After deployment, open `https://YOUR-DEPLOYMENT-DOMAIN/api/market` in a browser. A successful response is JSON with `provider`, `updatedAt`, and eight entries in `data`. If both public providers are unavailable, HTTP 503 is expected; the website must label its fallback figures as illustrative rather than live. Check the browser console and Vercel function logs if the endpoint fails.

## Email code registration

In Supabase Authentication → Email Templates → Confirm signup, use the token template in `supabase/EMAIL-OTP-SETUP.md`, with `{{ .Token }}`. Add the exact deployed domain to the Supabase Auth URL configuration. Then test with a new email address: request code, verify it, confirm a profile row exists, sign out, and sign back in using only email and password.

## Admin and database

Confirm the correct migrations have been applied in the VELTRION project. The first administrator must be assigned manually to the verified user's UUID using the SQL procedure in `supabase/ADMIN-SETUP.md`. Do not grant staff access from signup metadata.

Test customer and administrator accounts separately. Confirm customer policies prevent reading other customers' records and only authorized staff can call administrative RPCs.

## Wallets and financial operations — not yet production-ready

Do not accept real deposits or promise automatic withdrawals from this code alone. A public receiving address and QR code do not prove a transaction has arrived. Before enabling live deposits, implement and test a chain-specific monitor, required confirmations, token-contract/network checks, duplicate-transaction prevention, amount matching, and idempotent ledger crediting. Before enabling withdrawals, implement secure review, available-balance reservation, destination/network validation, transaction signing in a secure custody system, broadcast tracking, reconciliation, and audit alerts. Never store seed phrases or private keys in this website or Supabase browser-accessible tables.
