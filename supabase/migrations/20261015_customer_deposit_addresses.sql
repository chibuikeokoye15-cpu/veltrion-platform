-- VELTRION: migrate the initial shared-address table to customer-specific addresses.
-- Run only after reviewing the current schema. The VELTRION project was described as new.
-- This migration does not generate wallet addresses or verify blockchain transactions.

alter table public.deposit_addresses
  add column if not exists user_id uuid references public.profiles(id) on delete restrict;

-- The initial schema's unique constraint permits only one address per asset/network/currency.
-- Remove it so each customer can have their own address for each asset/network/currency.
alter table public.deposit_addresses
  drop constraint if exists deposit_addresses_asset_symbol_network_code_fiat_currency_key;

-- Because this is a new project and should have no production address rows yet, enforce ownership.
-- If any rows already exist, stop and review them before running this migration.
do $$
begin
  if exists (select 1 from public.deposit_addresses where user_id is null) then
    raise exception 'Existing deposit_addresses rows have no user_id. Review and assign them before enforcing per-customer address ownership.';
  end if;
end $$;

alter table public.deposit_addresses
  alter column user_id set not null;

create unique index if not exists deposit_addresses_customer_asset_network_currency_uidx
  on public.deposit_addresses(user_id, asset_symbol, network_code, fiat_currency);

create unique index if not exists deposit_addresses_asset_network_address_uidx
  on public.deposit_addresses(asset_symbol, network_code, lower(address));

drop policy if exists "enabled deposit addresses visible" on public.deposit_addresses;
drop policy if exists "customers read own deposit addresses or staff read all" on public.deposit_addresses;
create policy "customers read own deposit addresses or staff read all"
  on public.deposit_addresses for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());

-- Only a trusted server/admin process should insert or update deposit addresses.
-- No customer INSERT/UPDATE/DELETE policy is added.
