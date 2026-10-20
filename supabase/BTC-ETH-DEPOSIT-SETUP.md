# VELTRION BTC and ETH deposit-address setup

## Current intended configuration
- BTC — Bitcoin mainnet — minimum USD-equivalent deposit: $500.
- ETH — Ethereum Mainnet — minimum USD-equivalent deposit: $500.
- Addresses are shared receiving addresses supplied by the project owner. Shared addresses do not identify the sender/customer by themselves.

## Apply the migration
The existing Supabase project already has `public.deposit_addresses` and the original `supabase/schema.sql` must **not** be rerun. Review and run only:

`supabase/migrations/20261021_configure_shared_btc_eth_addresses.sql`

This adds `user_id` as nullable to support shared addresses, restricts address reads to authenticated customers/staff, and upserts the two supplied records with `enabled = false`. It is intentionally safe by default.

## Verify before enabling
1. Open Trust Wallet using the owner's trusted device and verify the BTC receiving address character-by-character on Bitcoin mainnet.
2. Verify the ETH receiving address character-by-character on Ethereum Mainnet.
3. Do not enable either address if any character/network differs. Never share a recovery phrase or private key.
4. Only after verification, enable the two rows in Supabase SQL Editor:

```sql
update public.deposit_addresses
set enabled = true
where user_id is null
  and fiat_currency = 'USD'
  and (
    (asset_symbol = 'BTC' and network_code = 'BITCOIN_MAINNET'
     and address = 'bc1qpphyazca48tc3e45k6fy0aedwz0l8784n06ap3')
    or
    (asset_symbol = 'ETH' and network_code = 'ETHEREUM_MAINNET'
     and address = '0xF8d42DB78D31E5d99CEc83bA7A180698E72518aB')
  );
```

5. Refresh the customer dashboard and confirm only the intended BTC and ETH networks appear.

## Important production limitation
The displayed $500 minimum is a policy threshold in USD terms, not a fixed crypto amount. A production system must calculate the USD value at the relevant time and enforce the threshold in trusted server-side logic. This migration does not watch the blockchain, detect confirmations, attribute a shared-address payment to a customer, reconcile deposits, or credit balances. Shared-address deposits must be manually and independently reconciled before any ledger credit. Do not accept funds on the assumption that the website will detect or credit them automatically.
