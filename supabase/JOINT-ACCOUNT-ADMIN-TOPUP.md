# Joint account administrator top-ups

Run `migrations/20261020_joint_accounts_admin_topups.sql` in the VELTRION Supabase SQL Editor after reviewing the project and its existing data. The migration adds joint account tables and RPCs.

In Admin Console → Accounts & balances, select a joint account and an active member, choose the asset, enter an amount, and supply a reason. Positive amounts are admin credits; negative amounts are debits. The RPC validates staff access and membership, writes an append-only ledger row, records the selected member in metadata/audit log, and sends the selected member a notification.

The entry label is explicitly “Admin top-up on behalf of [member]” (or “Admin adjustment on behalf of [member]”), not a claim that the customer personally sent cryptocurrency. This is an accounting action and does not transfer crypto or prove custody.

Customer-facing creation currently creates the joint account and its owner membership only. Secure invitations, acceptance, revocation, joint withdrawal approval, and transaction-based deposit attribution still need implementation and testing before real-funds use.
