# VELTRION production roadmap

## Included in this foundation
- Multi-page responsive static front-end prototype.
- Gold/blue SVG logo asset.
- Supabase/Postgres initial schema with customer profiles, enabled deposit-address configuration, deposits, withdrawal requests, notifications, investment product/position records, and audit events.
- Row-level security baseline; customer policies do not allow them to approve transactions.
- Environment variable template and deployment notes.

## Required before real customers or funds
1. Authentication integration, email verification, password reset, MFA for staff, rate limiting, bot protection, and session management.
2. Server-only privileged endpoints with strict admin authorization and audit logging.
3. Real market-data provider and visible timestamps/source; remove demo ticker values and label fallbacks.
4. Blockchain monitoring for each exact asset/network, confirmation policies, idempotency, reorg handling, wrong-network and underpayment workflows.
5. Double-entry ledger, immutable transaction history, reconciliation, concurrency-safe balance reservations, and withdrawal risk checks.
6. Admin setup through a secure manual procedure; never allow public signup to grant admin permissions.
7. Privacy notice, retention controls, user consent for analytics, terms, risk disclosures, and jurisdiction-specific legal/compliance review.
8. Security review and automated tests before enabling deposits or withdrawals.

Never invent user counts, live investor activity, verified status, or customer returns. Demo data must be visibly marked as demo. Never promise guaranteed daily profits or fabricate balances.
