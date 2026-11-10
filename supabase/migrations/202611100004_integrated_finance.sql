-- Integrated fund-based double-entry accounting for MRPST.
do $$ begin create type public.mrpst_fund_type as enum ('general','special','scholarship'); exception when duplicate_object then null; end $$;
do $$ begin create type public.mrpst_account_type as enum ('asset','liability','net_asset','income','expense'); exception when duplicate_object then null; end $$;
do $$ begin create type public.mrpst_entry_status as enum ('draft','submitted','approved','rejected','posted'); exception when duplicate_object then null; end $$;
create table if not exists public.finance_funds(id uuid primary key default gen_random_uuid(),code text not null unique,name_en text not null,name_my text,name_ko text,fund_type public.mrpst_fund_type not null,currency_code text not null default 'MMK' check(currency_code ~ '^[A-Z]{3}$'),is_active boolean not null default true,created_at timestamptz not null default now());
create table if not exists public.finance_accounts(id uuid primary key default gen_random_uuid(),code text not null unique,name_en text not null,name_my text,name_ko text,account_type public.mrpst_account_type not null,parent_id uuid references public.finance_accounts(id) on delete restrict,is_active boolean not null default true,created_at timestamptz not null default now());
create table if not exists public.finance_periods(id uuid primary key default gen_random_uuid(),name text not null,starts_on date not null,ends_on date not null,is_closed boolean not null default false,created_at timestamptz not null default now(),check(ends_on>=starts_on),unique(starts_on,ends_on));
create table if not exists public.journal_entries(id uuid primary key default gen_random_uuid(),entry_no bigint generated always as identity unique,entry_date date not null,description text not null,reference_no text,fund_id uuid not null references public.finance_funds(id) on delete restrict,department_id uuid references public.departments(id) on delete set null,status public.mrpst_entry_status not null default 'draft',created_by uuid not null references auth.users(id),submitted_by uuid references auth.users(id),submitted_at timestamptz,approved_by uuid references auth.users(id),approved_at timestamptz,posted_by uuid references auth.users(id),posted_at timestamptz,rejection_reason text,correction_of uuid references public.journal_entries(id) on delete restrict,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.journal_lines(id uuid primary key default gen_random_uuid(),entry_id uuid not null references public.journal_entries(id) on delete restrict,line_no integer not null,account_id uuid not null references public.finance_accounts(id) on delete restrict,description text,debit numeric(18,2) not null default 0 check(debit>=0),credit numeric(18,2) not null default 0 check(credit>=0),created_at timestamptz not null default now(),check((debit>0 and credit=0) or (credit>0 and debit=0)),unique(entry_id,line_no));
create table if not exists public.finance_audit_log(id bigint generated always as identity primary key,entry_id uuid references public.journal_entries(id) on delete set null,actor_id uuid references auth.users(id) on delete set null,action text not null,details jsonb not null default '{}'::jsonb,created_at timestamptz not null default now());
create index if not exists journal_entries_date_status_idx on public.journal_entries(entry_date,status);
create index if not exists journal_entries_fund_idx on public.journal_entries(fund_id);
create index if not exists journal_lines_entry_idx on public.journal_lines(entry_id);
create or replace function public.mrpst_can_manage_finance() returns boolean language sql stable security definer set search_path=public as $$ select public.mrpst_is_active_user(auth.uid()) and (public.mrpst_has_role(auth.uid(),'super_admin') or public.mrpst_has_role(auth.uid(),'administrator') or public.mrpst_has_role(auth.uid(),'finance_officer')); $$;
create or replace function public.mrpst_approve_journal(target_entry uuid) returns void language plpgsql security definer set search_path=public as $$ begin if not(public.mrpst_is_active_user(auth.uid()) and (public.mrpst_has_role(auth.uid(),'super_admin') or public.mrpst_has_role(auth.uid(),'administrator'))) then raise exception 'Approval permission required'; end if; update public.journal_entries set status='approved',approved_by=auth.uid(),approved_at=now(),updated_at=now() where id=target_entry and status='submitted'; if not found then raise exception 'Only submitted entries can be approved'; end if; insert into public.finance_audit_log(entry_id,actor_id,action) values(target_entry,auth.uid(),'approved'); end; $$;
create or replace function public.mrpst_post_journal(target_entry uuid) returns void language plpgsql security definer set search_path=public as $$ declare e public.journal_entries%rowtype; d numeric(18,2); c numeric(18,2); begin if not public.mrpst_can_manage_finance() then raise exception 'Finance permission required'; end if; select * into e from public.journal_entries where id=target_entry for update; if not found or e.status<>'approved' then raise exception 'Only approved entries can be posted'; end if; if exists(select 1 from public.finance_periods p where e.entry_date between p.starts_on and p.ends_on and p.is_closed) then raise exception 'Fiscal period is closed'; end if; select coalesce(sum(debit),0),coalesce(sum(credit),0) into d,c from public.journal_lines where entry_id=target_entry; if d<=0 or d<>c then raise exception 'Journal lines must balance and be greater than zero'; end if; update public.journal_entries set status='posted',posted_by=auth.uid(),posted_at=now(),updated_at=now() where id=target_entry; insert into public.finance_audit_log(entry_id,actor_id,action,details) values(target_entry,auth.uid(),'posted',jsonb_build_object('debit_total',d,'credit_total',c)); end; $$;
create or replace function public.mrpst_guard_posted_entry() returns trigger language plpgsql set search_path=public as $$ begin if old.status='posted' then raise exception 'Posted entries are immutable; create a correction entry'; end if; return new; end; $$;
drop trigger if exists journal_entries_immutable_after_post on public.journal_entries;
create trigger journal_entries_immutable_after_post before update or delete on public.journal_entries for each row execute function public.mrpst_guard_posted_entry();
create or replace function public.mrpst_guard_posted_lines() returns trigger language plpgsql set search_path=public as $$ declare target uuid; begin target:=coalesce(old.entry_id,new.entry_id); if exists(select 1 from public.journal_entries where id=target and status='posted') then raise exception 'Posted journal lines are immutable'; end if; if tg_op='DELETE' then return old; else return new; end if; end; $$;
drop trigger if exists journal_lines_immutable_after_post on public.journal_lines;
create trigger journal_lines_immutable_after_post before insert or update or delete on public.journal_lines for each row execute function public.mrpst_guard_posted_lines();
alter table public.finance_funds enable row level security; alter table public.finance_accounts enable row level security; alter table public.finance_periods enable row level security; alter table public.journal_entries enable row level security; alter table public.journal_lines enable row level security; alter table public.finance_audit_log enable row level security;
create policy "Finance read funds" on public.finance_funds for select to authenticated using(public.mrpst_can_manage_finance());
create policy "Finance admin manage funds" on public.finance_funds for all to authenticated using(public.mrpst_is_active_user(auth.uid()) and (public.mrpst_has_role(auth.uid(),'super_admin') or public.mrpst_has_role(auth.uid(),'administrator'))) with check(public.mrpst_is_active_user(auth.uid()) and (public.mrpst_has_role(auth.uid(),'super_admin') or public.mrpst_has_role(auth.uid(),'administrator')));
create policy "Finance read accounts" on public.finance_accounts for select to authenticated using(public.mrpst_can_manage_finance());
create policy "Finance admin manage accounts" on public.finance_accounts for all to authenticated using(public.mrpst_is_active_user(auth.uid()) and (public.mrpst_has_role(auth.uid(),'super_admin') or public.mrpst_has_role(auth.uid(),'administrator'))) with check(public.mrpst_is_active_user(auth.uid()) and (public.mrpst_has_role(auth.uid(),'super_admin') or public.mrpst_has_role(auth.uid(),'administrator')));
create policy "Finance read periods" on public.finance_periods for select to authenticated using(public.mrpst_can_manage_finance());
create policy "Finance admin manage periods" on public.finance_periods for all to authenticated using(public.mrpst_is_active_user(auth.uid()) and (public.mrpst_has_role(auth.uid(),'super_admin') or public.mrpst_has_role(auth.uid(),'administrator'))) with check(public.mrpst_is_active_user(auth.uid()) and (public.mrpst_has_role(auth.uid(),'super_admin') or public.mrpst_has_role(auth.uid(),'administrator')));
create policy "Finance read entries" on public.journal_entries for select to authenticated using(public.mrpst_can_manage_finance());
create policy "Finance create entries" on public.journal_entries for insert to authenticated with check(public.mrpst_can_manage_finance() and created_by=auth.uid() and status='draft');
create policy "Finance update entries" on public.journal_entries for update to authenticated using(public.mrpst_can_manage_finance() and status in ('draft','rejected')) with check(public.mrpst_can_manage_finance() and status in ('draft','submitted','rejected'));
create policy "Finance read lines" on public.journal_lines for select to authenticated using(public.mrpst_can_manage_finance());
create policy "Finance edit lines" on public.journal_lines for all to authenticated using(public.mrpst_can_manage_finance() and exists(select 1 from public.journal_entries e where e.id=entry_id and e.status in ('draft','rejected'))) with check(public.mrpst_can_manage_finance() and exists(select 1 from public.journal_entries e where e.id=entry_id and e.status in ('draft','rejected')));
create policy "Finance read audit" on public.finance_audit_log for select to authenticated using(public.mrpst_can_manage_finance());
grant select,insert,update,delete on public.finance_funds,public.finance_accounts,public.finance_periods,public.journal_entries,public.journal_lines to authenticated;
grant select on public.finance_audit_log to authenticated;
grant usage,select on all sequences in schema public to authenticated;
grant execute on function public.mrpst_can_manage_finance() to authenticated;
grant execute on function public.mrpst_approve_journal(uuid) to authenticated;
grant execute on function public.mrpst_post_journal(uuid) to authenticated;
insert into public.finance_funds(code,name_en,name_ko,fund_type,currency_code) values ('GENERAL','General Fund','일반 재정','general','MMK'),('SPECIAL','Special Projects Fund','특별 재정','special','MMK'),('SCHOLARSHIP','Scholarship Fund','장학금 재정','scholarship','MMK') on conflict(code) do nothing;
insert into public.finance_accounts(code,name_en,name_ko,account_type) values ('1000','Cash and Bank','현금 및 예금','asset'),('2000','Accounts Payable','미지급금','liability'),('3000','Fund Balance','기금 잔액','net_asset'),('4000','Donations and Contributions','후원금 및 기부금','income'),('4100','Tuition and Fees','등록금 및 수업료','income'),('5000','Program Expenses','사업비','expense'),('5100','Personnel Expenses','인건비','expense'),('5200','Administration Expenses','행정 운영비','expense'),('5300','Scholarship Expenses','장학금 지출','expense') on conflict(code) do nothing;

-- Atomic transaction creation and submission RPCs.
create or replace function public.mrpst_create_journal(
  p_entry_date date,p_description text,p_fund_id uuid,p_reference_no text,p_department_id uuid,p_lines jsonb
) returns uuid language plpgsql security definer set search_path=public as $$
declare new_id uuid; line_count integer; debit_total numeric(18,2); credit_total numeric(18,2);
begin
 if not public.mrpst_can_manage_finance() then raise exception 'Finance permission required'; end if;
 if p_entry_date is null or nullif(trim(p_description),'') is null then raise exception 'Date and description are required'; end if;
 if not exists(select 1 from public.finance_funds where id=p_fund_id and is_active) then raise exception 'Select an active fund'; end if;
 if exists(select 1 from public.finance_periods where p_entry_date between starts_on and ends_on and is_closed) then raise exception 'The fiscal period is closed'; end if;
 if jsonb_typeof(p_lines)<>'array' then raise exception 'Journal lines must be an array'; end if;
 select count(*),coalesce(sum((x->>'debit')::numeric),0),coalesce(sum((x->>'credit')::numeric),0)
 into line_count,debit_total,credit_total from jsonb_array_elements(p_lines) x;
 if line_count<2 or debit_total<=0 or debit_total<>credit_total then raise exception 'At least two balanced journal lines are required'; end if;
 if exists(select 1 from jsonb_array_elements(p_lines) x where (coalesce((x->>'debit')::numeric,0)>0 and coalesce((x->>'credit')::numeric,0)>0) or (coalesce((x->>'debit')::numeric,0)=0 and coalesce((x->>'credit')::numeric,0)=0) or coalesce((x->>'debit')::numeric,0)<0 or coalesce((x->>'credit')::numeric,0)<0) then raise exception 'Each line must contain either a positive debit or credit'; end if;
 if exists(select 1 from jsonb_array_elements(p_lines) x left join public.finance_accounts a on a.id=(x->>'account_id')::uuid where a.id is null or not a.is_active) then raise exception 'An account is invalid or inactive'; end if;
 insert into public.journal_entries(entry_date,description,reference_no,fund_id,department_id,created_by,status)
 values(p_entry_date,trim(p_description),nullif(trim(p_reference_no),''),p_fund_id,p_department_id,auth.uid(),'draft') returning id into new_id;
 insert into public.journal_lines(entry_id,line_no,account_id,description,debit,credit)
 select new_id,(row_number() over())::integer,(x->>'account_id')::uuid,nullif(x->>'description',''),coalesce((x->>'debit')::numeric,0),coalesce((x->>'credit')::numeric,0)
 from jsonb_array_elements(p_lines) x;
 insert into public.finance_audit_log(entry_id,actor_id,action,details) values(new_id,auth.uid(),'created',jsonb_build_object('debit_total',debit_total,'credit_total',credit_total));
 return new_id;
end; $$;

create or replace function public.mrpst_submit_journal(target_entry uuid) returns void
language plpgsql security definer set search_path=public as $$
declare d numeric(18,2); c numeric(18,2); e public.journal_entries%rowtype;
begin
 if not public.mrpst_can_manage_finance() then raise exception 'Finance permission required'; end if;
 select * into e from public.journal_entries where id=target_entry for update;
 if not found or e.status not in ('draft','rejected') then raise exception 'Only draft or rejected entries can be submitted'; end if;
 select coalesce(sum(debit),0),coalesce(sum(credit),0) into d,c from public.journal_lines where entry_id=target_entry;
 if d<=0 or d<>c then raise exception 'Journal lines must balance and be greater than zero'; end if;
 update public.journal_entries set status='submitted',submitted_by=auth.uid(),submitted_at=now(),rejection_reason=null,updated_at=now() where id=target_entry;
 insert into public.finance_audit_log(entry_id,actor_id,action) values(target_entry,auth.uid(),'submitted');
end; $$;

create or replace function public.mrpst_reject_journal(target_entry uuid,reason text) returns void
language plpgsql security definer set search_path=public as $$
begin
 if not(public.mrpst_is_active_user(auth.uid()) and (public.mrpst_has_role(auth.uid(),'super_admin') or public.mrpst_has_role(auth.uid(),'administrator'))) then raise exception 'Approval permission required'; end if;
 update public.journal_entries set status='rejected',rejection_reason=nullif(trim(reason),''),updated_at=now() where id=target_entry and status='submitted';
 if not found then raise exception 'Only submitted entries can be rejected'; end if;
 insert into public.finance_audit_log(entry_id,actor_id,action,details) values(target_entry,auth.uid(),'rejected',jsonb_build_object('reason',reason));
end; $$;

revoke all on function public.mrpst_create_journal(date,text,uuid,text,uuid,jsonb) from public;
revoke all on function public.mrpst_submit_journal(uuid) from public;
revoke all on function public.mrpst_reject_journal(uuid,text) from public;
grant execute on function public.mrpst_create_journal(date,text,uuid,text,uuid,jsonb) to authenticated;
grant execute on function public.mrpst_submit_journal(uuid) to authenticated;
grant execute on function public.mrpst_reject_journal(uuid,text) to authenticated;
