# VELTRION market terminal upgrade notes

## Included
- Replaced the small Markets landing section with a responsive market terminal layout.
- Added market cap and 24-hour volume metrics, volume comparison bars, searchable asset table, and a candlestick/volume chart with 15m, 1h, 4h and 1d intervals.
- Market metrics use the public CoinGecko endpoint and candles use Binance public klines. Provider failures are labelled rather than filled with fabricated market metrics.
- Added session-aware navigation using the existing Supabase client; account link appears when a session exists, and login/signup links are hidden while signed in.
- Added a compact support popover on site pages: starts after six seconds, dismisses automatically twelve seconds later, and remembers dismissal for the browser session.
- Preserved the existing signup/OTP logic and existing Supabase configuration names.

## Before production
1. The support email in the HTML is intentionally a clearly marked placeholder (`SUPPORT_EMAIL_CONFIGURE@example.com`). Replace it with an inbox you control. A made-up address will not receive messages.
2. Public market-data providers may rate-limit or block requests depending on browser/network conditions. For robust production use, route requests through a server-side market-data provider and respect its terms/rate limits.
3. Verify session routing, OTP signup, login, logout and account access in the actual Vercel deployment. This package was syntax-checked, but a full Vite production build could not be run in this environment because Vite dependencies were not installed and package installation timed out.
4. This is a market-information UI, not an execution venue. It does not execute trades or move funds.
