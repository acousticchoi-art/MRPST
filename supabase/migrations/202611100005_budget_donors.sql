-- MRPST budget planning and donor contribution ledger.
do $$ begin create type public.mrpst_budget_status as enum ('draft','submitted','approved','rejected'); exception when duplicate_object then null; end $$;

create table if not exists public.finance_budgets(
 id uuid primary key default gen_random_uuid(),
 fiscal_year integer not null check(fiscal_year between 2000 and 2200),
 title text not null,
 fund_id uuid not null references public.finance_funds(id) on delete restrict,
 status public.mrpst_budget_status not null default 'draft',
 created_by uuid not null references auth.users(id),
 submitted_by uuid references auth.users(id),
 submitted_at timestamptz,
 approved_by uuid references auth.users(id),
 approved_at timestamptz,
 rejection_reason text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(fiscal_year,fund_id)
);
create table if not exists public.finance_budget_lines(
 id uuid primary key default gen_random_uuid(),
 budget_id uuid not null references public.finance_budgets(id) on delete cascade,
 account_id uuid not null references public.finance_accounts(id) on delete restrict,
 planned_amount numeric(18,2) not null check(planned_amount>0),
 notes text,
 created_at timestamptz not null default now(),
 unique(budget_id,account_id)
);
create table if not exists public.finance_donors(
 id uuid primary key default gen_random_uuid(),
 donor_code text unique,
 display_name text not null,
 donor_type text not null default 'individual' check(donor_type in ('individual','organization','church')),
 email text,
 phone text,
 country text,
 notes text,
 is_active boolean not null default true,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.donor_contributions(
 id uuid primary key default gen_random_uuid(),
 donor_id uuid not null references public.finance_donors(id) on delete restrict,
 fund_id uuid not null references public.finance_funds(id) on delete restrict,
 contribution_date date not null,
 purpose text,
 reference_no text,
 original_currency char(3) not null default 'MMK' check(original_currency ~ '^[A-Z]{3}$'),
 original_amount numeric(18,2) not null check(original_amount>0),
 exchange_rate numeric(18,6) not null default 1 check(exchange_rate>0),
 base_amount numeric(18,2) generated always as (round(original_amount*exchange_rate,2)) stored,
 journal_entry_id uuid not null unique references public.journal_entries(id) on delete restrict,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create index if not exists finance_budgets_year_fund_idx on public.finance_budgets(fiscal_year,fund_id);
create index if not exists finance_budget_lines_budget_idx on public.finance_budget_lines(budget_id);
create index if not exists donor_contributions_date_idx on public.donor_contributions(contribution_date);
create index if not exists donor_contributions_donor_idx on public.donor_contributions(donor_id);

alter table public.finance_budgets enable row level security;
alter table public.finance_budget_lines enable row level security;
alter table public.finance_donors enable row level security;
alter table public.donor_contributions enable row level security;

create policy "Finance read budgets" on public.finance_budgets for select to authenticated using(public.mrpst_can_manage_finance());
create policy "Finance create budgets" on public.finance_budgets for insert to authenticated with check(public.mrpst_can_manage_finance() and created_by=auth.uid() and status='draft');
create policy "Finance edit draft budgets" on public.finance_budgets for update to authenticated using(public.mrpst_can_manage_finance() and status in ('draft','rejected')) with check(public.mrpst_can_manage_finance() and status in ('draft','rejected'));
create policy "Finance read budget lines" on public.finance_budget_lines for select to authenticated using(public.mrpst_can_manage_finance());
create policy "Finance edit draft budget lines" on public.finance_budget_lines for all to authenticated using(public.mrpst_can_manage_finance() and exists(select 1 from public.finance_budgets b where b.id=budget_id and b.status in ('draft','rejected'))) with check(public.mrpst_can_manage_finance() and exists(select 1 from public.finance_budgets b where b.id=budget_id and b.status in ('draft','rejected')));
create policy "Finance read donors" on public.finance_donors for select to authenticated using(public.mrpst_can_manage_finance());
create policy "Finance manage donors" on public.finance_donors for all to authenticated using(public.mrpst_can_manage_finance()) with check(public.mrpst_can_manage_finance());
create policy "Finance read contributions" on public.donor_contributions for select to authenticated using(public.mrpst_can_manage_finance());

grant select,insert,update,delete on public.finance_budgets,public.finance_budget_lines,public.finance_donors to authenticated;
grant select on public.donor_contributions to authenticated;

create or replace function public.mrpst_submit_budget(target_budget uuid) returns void
language plpgsql security definer set search_path=public as $$
declare b public.finance_budgets%rowtype; n integer;
begin
 if not public.mrpst_can_manage_finance() then raise exception 'Finance permission required'; end if;
 select * into b from public.finance_budgets where id=target_budget for update;
 if not found or b.status not in ('draft','rejected') then raise exception 'Only draft or rejected budgets can be submitted'; end if;
 select count(*) into n from public.finance_budget_lines where budget_id=target_budget;
 if n=0 then raise exception 'Add at least one budget line'; end if;
 update public.finance_budgets set status='submitted',submitted_by=auth.uid(),submitted_at=now(),rejection_reason=null,updated_at=now() where id=target_budget;
end; $$;

create or replace function public.mrpst_approve_budget(target_budget uuid,approve boolean,reason text default null) returns void
language plpgsql security definer set search_path=public as $$
begin
 if not(public.mrpst_is_active_user(auth.uid()) and (public.mrpst_has_role(auth.uid(),'super_admin') or public.mrpst_has_role(auth.uid(),'administrator'))) then raise exception 'Approval permission required'; end if;
 update public.finance_budgets set status=case when approve then 'approved'::public.mrpst_budget_status else 'rejected'::public.mrpst_budget_status end,approved_by=case when approve then auth.uid() else null end,approved_at=case when approve then now() else null end,rejection_reason=case when approve then null else nullif(trim(reason),'') end,updated_at=now() where id=target_budget and status='submitted';
 if not found then raise exception 'Only submitted budgets can be reviewed'; end if;
end; $$;

create or replace function public.mrpst_create_donation(
 p_donor_id uuid,p_fund_id uuid,p_date date,p_purpose text,p_reference text,
 p_currency char(3),p_amount numeric,p_exchange_rate numeric,p_cash_account uuid,p_income_account uuid
) returns uuid language plpgsql security definer set search_path=public as $$
declare new_entry uuid; new_donation uuid; base numeric(18,2); fund public.finance_funds%rowtype;
begin
 if not public.mrpst_can_manage_finance() then raise exception 'Finance permission required'; end if;
 if not exists(select 1 from public.finance_donors where id=p_donor_id and is_active) then raise exception 'Select an active donor'; end if;
 select * into fund from public.finance_funds where id=p_fund_id and is_active;
 if not found then raise exception 'Select an active fund'; end if;
 if p_amount is null or p_amount<=0 or p_exchange_rate is null or p_exchange_rate<=0 then raise exception 'Amount and exchange rate must be positive'; end if;
 if p_currency is null or p_currency !~ '^[A-Z]{3}$' then raise exception 'Invalid currency'; end if;
 if p_date is null or nullif(trim(p_purpose),'') is null then raise exception 'Date and purpose are required'; end if;
 if not exists(select 1 from public.finance_accounts where id=p_cash_account and account_type='asset' and is_active) then raise exception 'Select an active cash/bank asset account'; end if;
 if not exists(select 1 from public.finance_accounts where id=p_income_account and account_type='income' and is_active) then raise exception 'Select an active income account'; end if;
 if exists(select 1 from public.finance_periods where p_date between starts_on and ends_on and is_closed) then raise exception 'The fiscal period is closed'; end if;
 base:=round(p_amount*p_exchange_rate,2);
 insert into public.journal_entries(entry_date,description,reference_no,fund_id,created_by,status,submitted_by,submitted_at)
 values(p_date,'후원금: '||trim(p_purpose),nullif(trim(p_reference),''),p_fund_id,auth.uid(),'submitted',auth.uid(),now()) returning id into new_entry;
 insert into public.journal_lines(entry_id,line_no,account_id,description,debit,credit)
 values(new_entry,1,p_cash_account,'후원금 입금',base,0),(new_entry,2,p_income_account,trim(p_purpose),0,base);
 insert into public.donor_contributions(donor_id,fund_id,contribution_date,purpose,reference_no,original_currency,original_amount,exchange_rate,journal_entry_id,created_by)
 values(p_donor_id,p_fund_id,p_date,trim(p_purpose),nullif(trim(p_reference),''),p_currency,p_amount,p_exchange_rate,new_entry,auth.uid()) returning id into new_donation;
 insert into public.finance_audit_log(entry_id,actor_id,action,details) values(new_entry,auth.uid(),'donation_recorded',jsonb_build_object('donation_id',new_donation,'donor_id',p_donor_id,'original_amount',p_amount,'currency',p_currency,'base_amount',base));
 return new_donation;
end; $$;

revoke all on function public.mrpst_submit_budget(uuid) from public;
revoke all on function public.mrpst_approve_budget(uuid,boolean,text) from public;
revoke all on function public.mrpst_create_donation(uuid,uuid,date,text,text,char,numeric,numeric,uuid,uuid) from public;
grant execute on function public.mrpst_submit_budget(uuid) to authenticated;
grant execute on function public.mrpst_approve_budget(uuid,boolean,text) to authenticated;
grant execute on function public.mrpst_create_donation(uuid,uuid,date,text,text,char,numeric,numeric,uuid,uuid) to authenticated;

create or replace view public.finance_budget_vs_actual with (security_invoker=true) as
select b.id as budget_id,b.fiscal_year,b.fund_id,f.name_ko as fund_name_ko,f.name_en as fund_name_en,
       bl.id as budget_line_id,a.id as account_id,a.code as account_code,a.name_ko as account_name_ko,a.name_en as account_name_en,
       bl.planned_amount,
       coalesce(sum(case when je.status='posted' and je.entry_date>=make_date(b.fiscal_year,1,1) and je.entry_date<make_date(b.fiscal_year+1,1,1) then jl.debit-jl.credit else 0 end),0)::numeric(18,2) as actual_amount
from public.finance_budgets b
join public.finance_funds f on f.id=b.fund_id
join public.finance_budget_lines bl on bl.budget_id=b.id
join public.finance_accounts a on a.id=bl.account_id
left join public.journal_entries je on je.fund_id=b.fund_id
left join public.journal_lines jl on jl.entry_id=je.id and jl.account_id=a.id
where b.status='approved'
group by b.id,b.fiscal_year,b.fund_id,f.name_ko,f.name_en,bl.id,a.id,a.code,a.name_ko,a.name_en,bl.planned_amount;
grant select on public.finance_budget_vs_actual to authenticated;

-- Validate budget lines against expense accounts.
create or replace function public.mrpst_validate_budget_line()
returns trigger language plpgsql set search_path=public as $$
begin
 if not exists(select 1 from public.finance_accounts where id=new.account_id and account_type='expense' and is_active) then
  raise exception 'Budget lines must use an active expense account';
 end if;
 return new;
end; $$;
drop trigger if exists finance_budget_line_expense_only on public.finance_budget_lines;
create trigger finance_budget_line_expense_only before insert or update on public.finance_budget_lines
for each row execute function public.mrpst_validate_budget_line();

create or replace function public.mrpst_create_budget(p_year integer,p_title text,p_fund_id uuid,p_lines jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare new_budget uuid; line_count integer;
begin
 if not public.mrpst_can_manage_finance() then raise exception 'Finance permission required'; end if;
 if p_year not between 2000 and 2200 or nullif(trim(p_title),'') is null then raise exception 'Valid fiscal year and title are required'; end if;
 if not exists(select 1 from public.finance_funds where id=p_fund_id and is_active) then raise exception 'Select an active fund'; end if;
 if jsonb_typeof(p_lines)<>'array' then raise exception 'Budget lines must be an array'; end if;
 select count(*) into line_count from jsonb_array_elements(p_lines);
 if line_count=0 then raise exception 'Add at least one budget line'; end if;
 if exists(select 1 from jsonb_array_elements(p_lines) as items(value) where coalesce((value->>'planned_amount')::numeric,0)<=0) then raise exception 'Budget amounts must be positive'; end if;
 if exists(select 1 from jsonb_array_elements(p_lines) as items(value) left join public.finance_accounts a on a.id=(value->>'account_id')::uuid where a.id is null or a.account_type<>'expense' or not a.is_active) then raise exception 'Budget lines must use active expense accounts'; end if;
 insert into public.finance_budgets(fiscal_year,title,fund_id,created_by,status) values(p_year,trim(p_title),p_fund_id,auth.uid(),'draft') returning id into new_budget;
 insert into public.finance_budget_lines(budget_id,account_id,planned_amount,notes)
 select new_budget,(value->>'account_id')::uuid,(value->>'planned_amount')::numeric,nullif(value->>'notes','') from jsonb_array_elements(p_lines) as items(value);
 return new_budget;
end; $$;
revoke all on function public.mrpst_create_budget(integer,text,uuid,jsonb) from public;
grant execute on function public.mrpst_create_budget(integer,text,uuid,jsonb) to authenticated;

-- Donation receipt and its journal entry are created atomically in submitted state.

-- Recreate the journal RPC with explicit JSONB element aliases for PostgreSQL.
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
 select count(*),coalesce(sum((value->>'debit')::numeric),0),coalesce(sum((value->>'credit')::numeric),0)
 into line_count,debit_total,credit_total from jsonb_array_elements(p_lines) as items(value);
 if line_count<2 or debit_total<=0 or debit_total<>credit_total then raise exception 'At least two balanced journal lines are required'; end if;
 if exists(select 1 from jsonb_array_elements(p_lines) as items(value) where (coalesce((value->>'debit')::numeric,0)>0 and coalesce((value->>'credit')::numeric,0)>0) or (coalesce((value->>'debit')::numeric,0)=0 and coalesce((value->>'credit')::numeric,0)=0) or coalesce((value->>'debit')::numeric,0)<0 or coalesce((value->>'credit')::numeric,0)<0) then raise exception 'Each line must contain either a positive debit or credit'; end if;
 if exists(select 1 from jsonb_array_elements(p_lines) as items(value) left join public.finance_accounts a on a.id=(value->>'account_id')::uuid where a.id is null or not a.is_active) then raise exception 'An account is invalid or inactive'; end if;
 insert into public.journal_entries(entry_date,description,reference_no,fund_id,department_id,created_by,status)
 values(p_entry_date,trim(p_description),nullif(trim(p_reference_no),''),p_fund_id,p_department_id,auth.uid(),'draft') returning id into new_id;
 insert into public.journal_lines(entry_id,line_no,account_id,description,debit,credit)
 select new_id,(row_number() over())::integer,(value->>'account_id')::uuid,nullif(value->>'description',''),coalesce((value->>'debit')::numeric,0),coalesce((value->>'credit')::numeric,0)
 from jsonb_array_elements(p_lines) as items(value);
 insert into public.finance_audit_log(entry_id,actor_id,action,details) values(new_id,auth.uid(),'created',jsonb_build_object('debit_total',debit_total,'credit_total',credit_total));
 return new_id;
end; $$;
