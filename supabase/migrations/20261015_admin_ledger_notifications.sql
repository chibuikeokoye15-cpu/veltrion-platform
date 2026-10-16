-- VELTRION admin operations foundation.
-- Run this migration in Supabase SQL Editor only after reviewing it.
-- It does not move cryptocurrency or verify blockchain deposits.

create table if not exists public.balance_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  asset_symbol text not null check (asset_symbol ~ '^[A-Z0-9]{2,12}$'),
  amount numeric(36,18) not null check (amount <> 0),
  entry_type text not null check (entry_type in ('admin_credit','admin_debit','deposit_credit','withdrawal_debit','withdrawal_reversal','adjustment')),
  reason text not null check (length(trim(reason)) between 3 and 500),
  reference text,
  idempotency_key text unique,
  created_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists balance_ledger_user_asset_created_idx
  on public.balance_ledger(user_id, asset_symbol, created_at desc);

alter table public.balance_ledger enable row level security;
drop policy if exists "customers read own ledger and staff read all" on public.balance_ledger;
create policy "customers read own ledger and staff read all"
  on public.balance_ledger for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());
-- No client insert/update/delete policies: ledger writes are via security-definer RPCs only.

create or replace function public.admin_adjust_balance(
  p_user_id uuid,
  p_asset_symbol text,
  p_amount numeric,
  p_reason text,
  p_idempotency_key text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_type text;
begin
  if not public.is_staff() then raise exception 'Not authorized'; end if;
  if p_user_id is null or not exists (select 1 from public.profiles p where p.id = p_user_id) then
    raise exception 'Customer account not found';
  end if;
  if p_asset_symbol is null or p_asset_symbol !~ '^[A-Z0-9]{2,12}$' then raise exception 'Invalid asset symbol'; end if;
  if p_amount is null or p_amount = 0 or abs(p_amount) > 1000000000000000 then raise exception 'Invalid adjustment amount'; end if;
  if p_reason is null or length(trim(p_reason)) < 3 or length(trim(p_reason)) > 500 then raise exception 'A reason between 3 and 500 characters is required'; end if;
  if p_idempotency_key is not null then
    select id into v_id from public.balance_ledger where idempotency_key = p_idempotency_key;
    if v_id is not null then return v_id; end if;
  end if;
  v_type := case when p_amount > 0 then 'admin_credit' else 'admin_debit' end;
  insert into public.balance_ledger(user_id, asset_symbol, amount, entry_type, reason, idempotency_key, created_by)
  values (p_user_id, p_asset_symbol, p_amount, v_type, trim(p_reason), p_idempotency_key, (select auth.uid()))
  returning id into v_id;
  insert into public.audit_events(actor_id,event_type,target_type,target_id,metadata)
  values ((select auth.uid()), 'balance_adjustment', 'profile', p_user_id::text,
    jsonb_build_object('ledger_id',v_id,'asset',p_asset_symbol,'amount',p_amount,'reason',trim(p_reason)));
  return v_id;
end;
$$;

create or replace function public.admin_send_notification(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_kind public.notification_kind default 'system'
) returns integer
language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  if not public.is_staff() then raise exception 'Not authorized'; end if;
  if p_title is null or length(trim(p_title)) not between 1 and 120 then raise exception 'Title must be 1-120 characters'; end if;
  if p_body is null or length(trim(p_body)) not between 1 and 4000 then raise exception 'Message must be 1-4000 characters'; end if;
  if p_user_id is not null then
    if not exists (select 1 from public.profiles p where p.id = p_user_id) then raise exception 'Customer account not found'; end if;
    insert into public.notifications(user_id,kind,title,body)
    values (p_user_id,p_kind,trim(p_title),trim(p_body));
    v_count := 1;
  else
    insert into public.notifications(user_id,kind,title,body)
    select p.id,p_kind,trim(p_title),trim(p_body) from public.profiles p where p.role = 'customer';
    get diagnostics v_count = row_count;
  end if;
  insert into public.audit_events(actor_id,event_type,target_type,target_id,metadata)
  values ((select auth.uid()), 'notification_sent', 'notification', coalesce(p_user_id::text,'all_customers'),
    jsonb_build_object('title',trim(p_title),'kind',p_kind,'recipient_count',v_count));
  return v_count;
end;
$$;

create or replace function public.admin_list_customers()
returns table(id uuid, email text, display_name text, role public.account_role, verification_status text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_staff() then raise exception 'Not authorized'; end if;
  return query
    select p.id, u.email::text, p.display_name, p.role, p.verification_status, p.created_at
    from public.profiles p join auth.users u on u.id = p.id
    where p.role = 'customer'
    order by p.created_at desc;
end;
$$;

create or replace function public.customer_asset_balances()
returns table(asset_symbol text, balance numeric)
language sql stable security definer set search_path = '' as $$
  select l.asset_symbol, sum(l.amount)::numeric as balance
  from public.balance_ledger l
  where l.user_id = (select auth.uid())
  group by l.asset_symbol
  having sum(l.amount) <> 0
  order by l.asset_symbol;
$$;

revoke all on function public.admin_adjust_balance(uuid,text,numeric,text,text) from public, anon;
revoke all on function public.admin_send_notification(uuid,text,text,public.notification_kind) from public, anon;
revoke all on function public.admin_list_customers() from public, anon;
revoke all on function public.customer_asset_balances() from public, anon;
grant execute on function public.admin_adjust_balance(uuid,text,numeric,text,text) to authenticated;
grant execute on function public.admin_send_notification(uuid,text,text,public.notification_kind) to authenticated;
grant execute on function public.admin_list_customers() to authenticated;
grant execute on function public.customer_asset_balances() to authenticated;

comment on table public.balance_ledger is 'Append-only customer balance ledger; not proof of crypto custody or available on-chain funds.';
