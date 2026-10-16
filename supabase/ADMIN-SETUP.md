# VELTRION Supabase setup notes

The original `supabase/schema.sql` has already been run in the project described by the owner. **Do not run it again.**

## Add the admin/ledger migration

After reviewing the SQL, paste and run `supabase/migrations/20261015_admin_ledger_notifications.sql` in the VELTRION project's Supabase SQL Editor. This adds an append-only balance ledger, role-checked RPCs for adjustments and notifications, customer list access for staff, and customer balance summaries. It does not move funds, create wallet addresses, or verify blockchain transactions.

The separate `20261015_customer_deposit_addresses.sql` migration changes the address table to require a customer-specific address. Run it only after reviewing the current `deposit_addresses` rows. It intentionally stops if rows exist without `user_id`.

## Grant first admin access

1. Register your own account through the site's signup page after the auth integration is deployed and configured.
2. In Supabase Dashboard → Authentication → Users, find your user and copy its UUID.
3. In SQL Editor, run this statement after replacing the placeholder with that UUID:

```sql
update public.profiles
set role = 'admin'
where id = 'REPLACE-WITH-YOUR-AUTH-USER-UUID';
```

Verify that exactly one row was updated. Never set a role based on user-supplied signup metadata. Protect the admin account with a unique password and MFA.

## Vercel environment variables

- `VITE_SUPABASE_URL`: Supabase project's API URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key.

These are browser-facing values. Never use a Supabase secret/service-role key in `VITE_` variables or frontend code.

## Still required before real-money operations

Use a trusted server-side blockchain/payment provider to assign and monitor addresses, validate network and transaction hash, enforce confirmation thresholds, prevent duplicate credits, and manage secure withdrawals. Production financial features also require legal/compliance review, robust ledger reconciliation, rate limiting, monitoring, backups, and security testing. Never ask customers for seed phrases or private keys.
