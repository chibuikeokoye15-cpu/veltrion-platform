# VELTRION deposit address setup — do not skip the checks

The customer dashboard now looks for enabled rows assigned to that customer's Supabase profile in `public.deposit_addresses`. It does not create wallet addresses, monitor blockchains, verify transfers, or credit balances automatically.

## Before adding an address

1. Open the **VELTRION** project in Supabase (not DFL Express).
2. Open **SQL Editor** and run this read-only check:

```sql
select id, user_id, asset_symbol, network_code, address, enabled
from public.deposit_addresses
order by created_at desc;
```

3. If rows already exist, stop and review them before running `supabase/migrations/20261015_customer_deposit_addresses.sql`. That migration deliberately fails if existing rows have no `user_id`, because assigning old shared addresses to customers automatically would be unsafe.
4. Confirm the customer-specific migration has succeeded. It adds `user_id` and enforces one address per customer/asset/network/currency.
5. Get the customer's profile UUID from **Authentication** / `public.profiles`. Never use an email address as `user_id`.

## Where to store the receiving address

The intended storage location is Supabase **Table Editor → `public.deposit_addresses`**. The schema intentionally does not permit customers to insert or edit receiving addresses from their own browser sessions. Use a reviewed, privileged administrative process (such as SQL Editor) to configure them.

Example template only — replace every placeholder with verified values. Do not run it as-is:

```sql
insert into public.deposit_addresses
  (user_id, asset_symbol, network_code, address, memo_or_tag, qr_payload, minimum_amount, fiat_currency, enabled)
values
  ('REPLACE_WITH_CUSTOMER_PROFILE_UUID', 'USDT', 'REPLACE_WITH_EXACT_NETWORK',
   'REPLACE_WITH_PUBLIC_RECEIVING_ADDRESS', null,
   'REPLACE_WITH_PUBLIC_RECEIVING_ADDRESS', 1, 'USD', true);
```

Use a different row for each customer/asset/network combination. Do not reuse an address across networks unless the wallet provider explicitly confirms it is valid for both. Do not invent a network code. Verify the address by checking it in the receiving wallet before enabling it.

## QR codes and real deposits

The customer page renders a QR image for the stored `qr_payload` and a copy-address button. QR rendering currently uses an external QR image service; the payload is a public receiving address, but it is still sent to that service. If that is not acceptable, replace it with an audited local QR library before production.

**A QR code is not proof of payment.** Before accepting real funds or crediting balances, implement chain monitoring, confirmation thresholds, duplicate transaction handling, reconciled ledger credits, withdrawal security, monitoring, and an incident-response process. The current platform is not ready to custody funds or offer real investment returns.

Never enter a wallet seed phrase, recovery phrase, or private key into this website, Supabase, GitHub, or Vercel.
