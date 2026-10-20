-- VELTRION joint-account foundation and audited administrator top-ups.
-- Apply in Supabase SQL Editor after reviewing the existing schema. Does not move funds.
create table if not exists public.joint_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  created_by uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'active' check (status in ('active','suspended','closed')),
  created_at timestamptz not null default now()
);
create table if not exists public.joint_account_members (
  joint_account_id uuid not null references public.joint_accounts(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  member_role text not null default 'member' check (member_role in ('owner','member')),
  status text not null default 'active' check (status in ('invited','active','revoked')),
  joined_at timestamptz,
  invited_email text,
  created_at timestamptz not null default now(),
  primary key (joint_account_id,user_id)
);
create table if not exists public.joint_balance_ledger (
  id uuid primary key default gen_random_uuid(),
  joint_account_id uuid not null references public.joint_accounts(id) on delete restrict,
  attributed_user_id uuid references public.profiles(id) on delete restrict,
  asset_symbol text not null check (asset_symbol ~ '^[A-Z0-9]{2,12}$'),
  amount numeric(36,18) not null check (amount <> 0),
  entry_type text not null check (entry_type in ('admin_credit','admin_debit','deposit_credit','withdrawal_debit','adjustment')),
  reason text not null check (length(trim(reason)) between 3 and 500),
  idempotency_key text unique,
  created_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists joint_ledger_account_asset_idx on public.joint_balance_ledger(joint_account_id,asset_symbol,created_at desc);
alter table public.joint_accounts enable row level security;
alter table public.joint_account_members enable row level security;
alter table public.joint_balance_ledger enable row level security;
drop policy if exists "members read their joint accounts" on public.joint_accounts;
create policy "members read their joint accounts" on public.joint_accounts for select to authenticated using (public.is_staff() or exists(select 1 from public.joint_account_members m where m.joint_account_id=id and m.user_id=(select auth.uid()) and m.status='active'));
drop policy if exists "members read joint membership" on public.joint_account_members;
create policy "members read joint membership" on public.joint_account_members for select to authenticated using (public.is_staff() or user_id=(select auth.uid()) or exists(select 1 from public.joint_account_members m where m.joint_account_id=joint_account_members.joint_account_id and m.user_id=(select auth.uid()) and m.status='active'));
drop policy if exists "members read joint ledger" on public.joint_balance_ledger;
create policy "members read joint ledger" on public.joint_balance_ledger for select to authenticated using (public.is_staff() or exists(select 1 from public.joint_account_members m where m.joint_account_id=joint_balance_ledger.joint_account_id and m.user_id=(select auth.uid()) and m.status='active'));

create or replace function public.create_joint_account(p_name text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if (select auth.uid()) is null then raise exception 'Sign in required'; end if;
 if not exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='customer') then raise exception 'Customer account required'; end if;
 if p_name is null or length(trim(p_name)) not between 2 and 120 then raise exception 'Joint account name must be 2-120 characters'; end if;
 insert into public.joint_accounts(name,created_by) values(trim(p_name),(select auth.uid())) returning id into v_id;
 insert into public.joint_account_members(joint_account_id,user_id,member_role,status,joined_at) values(v_id,(select auth.uid()),'owner','active',now());
 insert into public.audit_events(actor_id,event_type,target_type,target_id,metadata) values((select auth.uid()),'joint_account_created','joint_account',v_id::text,jsonb_build_object('name',trim(p_name)));
 return v_id;
end; $$;

create or replace function public.admin_list_joint_accounts()
returns table(id uuid,name text,status text,member_count bigint,created_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.is_staff() then raise exception 'Not authorized'; end if;
 return query select a.id,a.name,a.status,count(m.user_id) filter(where m.status='active'),a.created_at from public.joint_accounts a left join public.joint_account_members m on m.joint_account_id=a.id group by a.id order by a.created_at desc;
end; $$;

create or replace function public.admin_adjust_joint_balance(
 p_joint_account_id uuid,p_attributed_user_id uuid,p_asset_symbol text,p_amount numeric,p_reason text,p_idempotency_key text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_label text; v_type text;
begin
 if not public.is_staff() then raise exception 'Not authorized'; end if;
 if not exists(select 1 from public.joint_accounts a where a.id=p_joint_account_id and a.status='active') then raise exception 'Active joint account not found'; end if;
 if p_attributed_user_id is null or not exists(select 1 from public.joint_account_members m where m.joint_account_id=p_joint_account_id and m.user_id=p_attributed_user_id and m.status='active') then raise exception 'Selected customer must be an active member of this joint account'; end if;
 if p_asset_symbol is null or p_asset_symbol !~ '^[A-Z0-9]{2,12}$' then raise exception 'Invalid asset symbol'; end if;
 if p_amount is null or p_amount=0 or abs(p_amount)>1000000000000000 then raise exception 'Invalid adjustment amount'; end if;
 if p_reason is null or length(trim(p_reason)) not between 3 and 500 then raise exception 'A reason between 3 and 500 characters is required'; end if;
 if p_idempotency_key is not null then select id into v_id from public.joint_balance_ledger where idempotency_key=p_idempotency_key; if v_id is not null then return v_id; end if; end if;
 select coalesce(nullif(trim(p.display_name),''),u.email,'Joint account member') into v_label from public.profiles p join auth.users u on u.id=p.id where p.id=p_attributed_user_id;
 v_type:=case when p_amount>0 then 'admin_credit' else 'admin_debit' end;
 insert into public.joint_balance_ledger(joint_account_id,attributed_user_id,asset_symbol,amount,entry_type,reason,idempotency_key,created_by,metadata)
 values(p_joint_account_id,p_attributed_user_id,p_asset_symbol,p_amount,v_type,trim(p_reason),p_idempotency_key,(select auth.uid()),jsonb_build_object('display_label',case when p_amount>0 then 'Admin top-up on behalf of '||v_label else 'Admin adjustment on behalf of '||v_label end,'credited_customer_id',p_attributed_user_id)) returning id into v_id;
 insert into public.audit_events(actor_id,event_type,target_type,target_id,metadata) values((select auth.uid()),'joint_balance_adjustment','joint_account',p_joint_account_id::text,jsonb_build_object('ledger_id',v_id,'asset',p_asset_symbol,'amount',p_amount,'attributed_user_id',p_attributed_user_id,'attributed_customer',v_label,'reason',trim(p_reason)));
 insert into public.notifications(user_id,kind,title,body) values(p_attributed_user_id,'account','Joint account balance updated','An administrator recorded a balance entry on your joint account. Please review the joint account ledger for the attribution and details.');
 return v_id;
end; $$;
revoke all on function public.create_joint_account(text) from public,anon;
revoke all on function public.admin_list_joint_accounts() from public,anon;
revoke all on function public.admin_adjust_joint_balance(uuid,uuid,text,numeric,text,text) from public,anon;
grant execute on function public.create_joint_account(text) to authenticated;
grant execute on function public.admin_list_joint_accounts() to authenticated;
grant execute on function public.admin_adjust_joint_balance(uuid,uuid,text,numeric,text,text) to authenticated;
comment on table public.joint_balance_ledger is 'Append-only joint account ledger. Admin entries explicitly record the member on whose behalf a top-up was entered; this is an accounting record, not proof of custody.';
create or replace function public.admin_list_joint_members(p_joint_account_id uuid)
returns table(user_id uuid,email text,display_name text)
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.is_staff() then raise exception 'Not authorized'; end if;
 return query select p.id,u.email::text,p.display_name from public.joint_account_members m join public.profiles p on p.id=m.user_id join auth.users u on u.id=p.id where m.joint_account_id=p_joint_account_id and m.status='active' order by p.created_at;
end; $$;
revoke all on function public.admin_list_joint_members(uuid) from public,anon;
grant execute on function public.admin_list_joint_members(uuid) to authenticated;
