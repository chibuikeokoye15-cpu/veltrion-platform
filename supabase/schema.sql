-- VELTRION database foundation for Supabase/PostgreSQL.
-- Run in a fresh Supabase project after reviewing policies. Never store seed phrases/private keys.
create extension if not exists pgcrypto;

create type public.account_role as enum ('customer', 'admin', 'compliance');
create type public.deposit_status as enum ('pending', 'confirming', 'confirmed', 'rejected', 'underpaid', 'expired');
create type public.withdrawal_status as enum ('requested', 'under_review', 'approved', 'rejected', 'processing', 'completed', 'failed');
create type public.notification_kind as enum ('account', 'deposit', 'withdrawal', 'security', 'system');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  country_code text,
  preferred_language text not null default 'en',
  role public.account_role not null default 'customer',
  verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only a trusted server/admin should assign privileged roles. The client cannot update role.
create table public.deposit_addresses (
  id uuid primary key default gen_random_uuid(),
  asset_symbol text not null,
  network_code text not null,
  address text not null,
  memo_or_tag text,
  qr_payload text not null,
  minimum_amount numeric(28,10) not null default 500 check (minimum_amount > 0),
  fiat_currency text not null default 'USD' check (fiat_currency in ('USD','EUR')),
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  unique(asset_symbol, network_code, fiat_currency)
);

create table public.deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  address_id uuid not null references public.deposit_addresses(id) on delete restrict,
  asset_symbol text not null,
  network_code text not null,
  tx_hash text,
  amount_crypto numeric(36,18),
  amount_fiat numeric(18,2),
  fiat_currency text not null check (fiat_currency in ('USD','EUR')),
  confirmations integer not null default 0 check (confirmations >= 0),
  status public.deposit_status not null default 'pending',
  detected_at timestamptz,
  confirmed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (amount_crypto is null or amount_crypto > 0),
  check (amount_fiat is null or amount_fiat > 0)
);
create unique index deposits_chain_tx_unique on public.deposits(network_code, lower(tx_hash)) where tx_hash is not null;

create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  asset_symbol text not null,
  network_code text not null,
  destination_address text not null,
  amount_crypto numeric(36,18) not null check (amount_crypto > 0),
  status public.withdrawal_status not null default 'requested',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  review_note text,
  tx_hash text,
  completed_at timestamptz
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind public.notification_kind not null default 'system',
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.investment_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  min_amount numeric(18,2) not null default 500 check (min_amount >= 500),
  currency text not null default 'USD' check (currency in ('USD','EUR')),
  risk_disclosure text not null,
  terms_version text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.investment_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  product_id uuid not null references public.investment_products(id) on delete restrict,
  principal numeric(18,2) not null check (principal >= 500),
  currency text not null check (currency in ('USD','EUR')),
  status text not null default 'pending' check (status in ('pending','active','closed','cancelled')),
  accepted_terms_version text not null,
  opened_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute procedure public.touch_updated_at();
create trigger deposits_touch_updated_at before update on public.deposits for each row execute procedure public.touch_updated_at();

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','compliance'));
$$;

alter table public.profiles enable row level security;
alter table public.deposit_addresses enable row level security;
alter table public.deposits enable row level security;
alter table public.withdrawals enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_events enable row level security;
alter table public.investment_products enable row level security;
alter table public.investment_positions enable row level security;

create policy "profiles read own or staff" on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_staff());
create policy "profiles update own nonprivileged fields" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()) and role = 'customer');
create policy "enabled deposit addresses visible" on public.deposit_addresses for select to anon, authenticated using (enabled = true or public.is_staff());
create policy "deposits read own or staff" on public.deposits for select to authenticated using (user_id = (select auth.uid()) or public.is_staff());
create policy "customer submits own deposit record" on public.deposits for insert to authenticated with check (user_id = (select auth.uid()) and status = 'pending' and reviewed_by is null and confirmed_at is null);
create policy "withdrawals read own or staff" on public.withdrawals for select to authenticated using (user_id = (select auth.uid()) or public.is_staff());
create policy "customer requests own withdrawal" on public.withdrawals for insert to authenticated with check (user_id = (select auth.uid()) and status = 'requested' and reviewed_by is null and tx_hash is null);
create policy "notifications read own or staff" on public.notifications for select to authenticated using (user_id = (select auth.uid()) or public.is_staff());
create policy "customers mark own notifications read" on public.notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "staff reads audit events" on public.audit_events for select to authenticated using (public.is_staff());
create policy "enabled products visible" on public.investment_products for select to anon, authenticated using (enabled = true or public.is_staff());
create policy "positions read own or staff" on public.investment_positions for select to authenticated using (user_id = (select auth.uid()) or public.is_staff());

-- No client-side UPDATE policies for deposits, withdrawals, products, positions, or audit events.
-- Privileged changes must go through authenticated server-side functions with admin authorization,
-- balance/transaction checks, idempotency, and an immutable audit record.
-- IMPORTANT: after initial setup, assign the first admin role manually through the Supabase SQL editor
-- after verifying the user's auth UUID. Never let signup metadata set an admin role.
