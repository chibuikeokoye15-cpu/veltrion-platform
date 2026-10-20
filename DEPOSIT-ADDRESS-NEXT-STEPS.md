# Deposit address activation checklist

1. Review and apply `supabase/migrations/20261021_configure_shared_btc_eth_addresses.sql` to the existing VELTRION Supabase project. Do not rerun `supabase/schema.sql`.
2. Confirm the two rows exist and remain `enabled = false`.
3. Independently verify each receiving address and network in Trust Wallet.
4. Only after verification, enable the exact rows using the SQL in `supabase/BTC-ETH-DEPOSIT-SETUP.md`.
5. Test the authenticated account page and confirm BTC/Bitcoin Mainnet and ETH/Ethereum Mainnet render correctly.
6. Do not claim automatic deposit detection or balance crediting: blockchain monitoring, confirmation rules, USD valuation, underpayment review, duplicate-transaction handling, and reconciled ledger credit are not included in this migration.
