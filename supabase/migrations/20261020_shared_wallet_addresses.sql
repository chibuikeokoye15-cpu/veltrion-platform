-- Configure the user's supplied public Trust Wallet receiving addresses for BTC and ETH.
-- These are SHARED wallet addresses, not unique per-customer addresses. Incoming transfers
-- must be reconciled by an authorized operator before any ledger credit. This migration
-- intentionally does NOT auto-credit deposits or claim a transfer belongs to a user.
-- Run only after schema.sql and 20261015_customer_deposit_addresses.sql have been reviewed/applied.
alter table public.deposit_addresses alter column user_id drop not null;
drop policy if exists "customers read own deposit addresses or staff read all" on public.deposit_addresses;
drop policy if exists "enabled deposit addresses visible" on public.deposit_addresses;
create policy "customers read assigned or shared enabled addresses" on public.deposit_addresses for select to authenticated
using ((enabled = true and (user_id is null or user_id = (select auth.uid()))) or public.is_staff());

update public.deposit_addresses set address='bc1qpphyazca48tc3e45k6fy0aedwz0l8784n06ap3', qr_payload='bc1qpphyazca48tc3e45k6fy0aedwz0l8784n06ap3', minimum_amount=500, enabled=true where user_id is null and asset_symbol='BTC' and network_code='BITCOIN_MAINNET' and fiat_currency='USD';
insert into public.deposit_addresses(user_id,asset_symbol,network_code,address,qr_payload,minimum_amount,fiat_currency,enabled)
select null,'BTC','BITCOIN_MAINNET','bc1qpphyazca48tc3e45k6fy0aedwz0l8784n06ap3','bc1qpphyazca48tc3e45k6fy0aedwz0l8784n06ap3',500,'USD',true
where not exists(select 1 from public.deposit_addresses where user_id is null and asset_symbol='BTC' and network_code='BITCOIN_MAINNET' and fiat_currency='USD');
update public.deposit_addresses set address='0xF8d42DB78D31E5d99CEc83bA7A180698E72518aB', qr_payload='ethereum:0xF8d42DB78D31E5d99CEc83bA7A180698E72518aB', minimum_amount=500, enabled=true where user_id is null and asset_symbol='ETH' and network_code='ETHEREUM_MAINNET' and fiat_currency='USD';
insert into public.deposit_addresses(user_id,asset_symbol,network_code,address,qr_payload,minimum_amount,fiat_currency,enabled)
select null,'ETH','ETHEREUM_MAINNET','0xF8d42DB78D31E5d99CEc83bA7A180698E72518aB','ethereum:0xF8d42DB78D31E5d99CEc83bA7A180698E72518aB',500,'USD',true
where not exists(select 1 from public.deposit_addresses where user_id is null and asset_symbol='ETH' and network_code='ETHEREUM_MAINNET' and fiat_currency='USD');
