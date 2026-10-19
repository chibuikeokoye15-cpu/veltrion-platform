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
Authentication wiring is a foundation, not a complete financial platform. The admin page still contains demo-only behavior. Balances, ledger, deposits, unique customer deposit addresses, blockchain verification, withdrawals, payout processing, automated blockchain monitoring, secure withdrawal processing, compliance workflows, MFA and production security hardening are not yet complete. Do not accept customer funds or present demo balances/quotes as real.

## Current integration status

This package adds the initial Supabase auth flow, customer account views, and an authenticated administrator console backed by database RPCs for customer list access, ledger adjustments, and notifications. It is not a complete live-money crypto platform: blockchain deposit monitoring, address provisioning, secure payout processing, market data is now wired to CoinGecko with a Binance public-market fallback and a 60-second refresh loop, but live API access still needs end-to-end verification from the deployed domain; blockchain deposit monitoring, address provisioning, secure payout processing, and production security review still require provider/backend integration and testing.

See `supabase/ADMIN-SETUP.md` before applying the new migration or granting the first admin role. The original `supabase/schema.sql` has already been run in the owner's project; do not run it again.


## Email OTP registration setup (required)
The signup page now expects Supabase email OTP verification using `verifyOtp({ type: 'signup' })`. In the VELTRION Supabase project, open **Authentication → Email Templates → Confirm signup** and use a token-based template (not a confirmation-link template). Suggested subject: `Your VELTRION verification code`. Suggested body:

```html
<h2>Welcome to VELTRION</h2>
<p>Global Crypto Investment Platform</p>
<p>To complete your registration, enter this verification code on the official VELTRION website:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:8px">{{ .Token }}</p>
<p>This code expires after a limited time. For your account security, keep your code confidential and enter it only on the official VELTRION website.</p>
<p>Thank you for choosing VELTRION.</p>
<p><strong>VELTRION Team</strong><br>Global Crypto Investment Platform</p>
```

This template deliberately does not include the sentence asking recipients to ignore an email they did not request. The code is supplied by Supabase through `{{ .Token }}`; do not hard-code a sample code. Configure a verified custom SMTP provider/sender if you want branded, reliable delivery. Existing password login remains password-only after email verification. The code change is not production-verified until the Supabase template is saved and an end-to-end signup test succeeds.


## Live market feed update
- Attempts to retrieve BTC, ETH, USDT, BNB, SOL, XRP, DOGE and ADA prices and 24-hour changes from CoinGecko.
- If CoinGecko fails, tries Binance public 24-hour ticker data as a fallback. USDT is treated as a $1.00 peg in the Binance fallback only.
- Refreshes every 60 seconds and when a user returns to the tab.
- Clearly reports provider failure and labels the displayed figures as illustrative preview values rather than pretending stale numbers are live.
- This browser-side feed does not need a private API key. The live provider must still be tested from the actual Vercel deployment because browser/network policies and provider rate limits can vary.


### Live crypto market endpoint
The site includes a Vercel serverless endpoint at `api/market.js`. The browser requests `/api/market` first; the endpoint queries CoinGecko and falls back to Binance. No API key is required for this public-market endpoint. When both providers are unavailable, the endpoint returns HTTP 503 and the page labels its fallback values as illustrative rather than claiming they are live. Verify `/api/market` after deployment and confirm the page status says `Live prices connected`.

**Important:** a local mock test is not a production verification. The current execution environment could not reach CoinGecko and could not finish `npm install`, so run a production build and verify the deployed endpoint before accepting live-market functionality as complete. Supabase email template settings, environment variables, account permissions, and all real-money deposit/withdrawal infrastructure still require configuration and end-to-end testing in the actual accounts.
