-- VELTRION shared BTC/ETH receiving addresses.
-- Safe for the currently observed state: public.deposit_addresses exists and is empty,
-- and it does not yet have a user_id column. This migration is idempotent.
-- Addresses are inserted DISABLED until the owner verifies each character and network
-- directly in Trust Wallet. This does not monitor the blockchain or credit balances.

begin;

alter table public.deposit_addresses
  add column if not exists user_id uuid references public.profiles(id) on delete restrict;

-- Shared addresses are allowed (user_id IS NULL). Customers can only read enabled
-- shared addresses or their own enabled assigned addresses. Anonymous reads are removed.
drop policy if exists "enabled deposit addresses visible" on public.deposit_addresses;
drop policy if exists "customers read own deposit addresses or staff read all" on public.deposit_addresses;
drop policy if exists "customers read assigned or shared enabled addresses" on public.deposit_addresses;
create policy "customers read assigned or shared enabled addresses"
  on public.deposit_addresses
  for select to authenticated
  using (
    (enabled = true and (user_id is null or user_id = (select auth.uid())))
    or public.is_staff()
  );

-- These are the public receiving addresses supplied by the project owner.
-- They intentionally remain disabled until manually verified in Trust Wallet.
insert into public.deposit_addresses
  (user_id, asset_symbol, network_code, address, memo_or_tag, qr_payload,
   minimum_amount, fiat_currency, enabled)
values
  (null, 'BTC', 'BITCOIN_MAINNET',
   'bc1qpphyazca48tc3e45k6fy0aedwz0l8784n06ap3', null,
   'bitcoin:bc1qpphyazca48tc3e45k6fy0aedwz0l8784n06ap3',
   500, 'USD', false),
  (null, 'ETH', 'ETHEREUM_MAINNET',
   '0xF8d42DB78D31E5d99CEc83bA7A180698E72518aB', null,
   'ethereum:0xF8d42DB78D31E5d99CEc83bA7A180698E72518aB',
   500, 'USD', false)
on conflict (asset_symbol, network_code, fiat_currency)
do update set
  user_id = null,
  address = excluded.address,
  memo_or_tag = excluded.memo_or_tag,
  qr_payload = excluded.qr_payload,
  minimum_amount = excluded.minimum_amount,
  enabled = false;

commit;
