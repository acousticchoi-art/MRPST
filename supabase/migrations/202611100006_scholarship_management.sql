-- Student registry foundation and scholarship award/disbursement workflow.
do $$ begin create type public.mrpst_student_status as enum ('active','leave','graduated','withdrawn'); exception when duplicate_object then null; end $$;
do $$ begin create type public.mrpst_scholarship_status as enum ('draft','submitted','approved','rejected','completed','cancelled'); exception when duplicate_object then null; end $$;

create table if not exists public.students(
 id uuid primary key default gen_random_uuid(),
 student_number text not null unique,
 full_name text not null,
 full_name_my text,
 full_name_en text,
 gender text check(gender in ('female','male','unspecified')),
 date_of_birth date,
 admission_year integer check(admission_year between 1950 and 2200),
 program text,
 cohort text,
 student_status public.mrpst_student_status not null default 'active',
 phone text,
 email text,
 guardian_name text,
 guardian_phone text,
 notes text,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists students_name_idx on public.students(full_name);
create index if not exists students_status_idx on public.students(student_status);

create table if not exists public.scholarship_awards(
 id uuid primary key default gen_random_uuid(),
 award_number bigint generated always as identity unique,
 student_id uuid not null references public.students(id) on delete restrict,
 fund_id uuid not null references public.finance_funds(id) on delete restrict,
 academic_year integer not null check(academic_year between 2000 and 2200),
 scholarship_name text not null,
 purpose text,
 original_currency char(3) not null default 'MMK' check(original_currency ~ '^[A-Z]{3}$'),
 original_amount numeric(18,2) not null check(original_amount>0),
 exchange_rate numeric(18,6) not null default 1 check(exchange_rate>0),
 base_amount numeric(18,2) generated always as (round(original_amount*exchange_rate,2)) stored,
 status public.mrpst_scholarship_status not null default 'draft',
 created_by uuid not null references auth.users(id),
 submitted_by uuid references auth.users(id),
 submitted_at timestamptz,
 approved_by uuid references auth.users(id),
 approved_at timestamptz,
 rejection_reason text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists scholarship_awards_student_idx on public.scholarship_awards(student_id,academic_year);
create index if not exists scholarship_awards_status_idx on public.scholarship_awards(status);

create table if not exists public.scholarship_disbursements(
 id uuid primary key default gen_random_uuid(),
 award_id uuid not null references public.scholarship_awards(id) on delete restrict,
 installment_no integer not null check(installment_no>0),
 scheduled_date date,
 paid_date date,
 original_currency char(3) not null check(original_currency ~ '^[A-Z]{3}$'),
 original_amount numeric(18,2) not null check(original_amount>0),
 exchange_rate numeric(18,6) not null check(exchange_rate>0),
 base_amount numeric(18,2) generated always as (round(original_amount*exchange_rate,2)) stored,
 journal_entry_id uuid not null unique references public.journal_entries(id) on delete restrict,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(award_id,installment_no)
);
create index if not exists scholarship_disbursements_award_idx on public.scholarship_disbursements(award_id);

alter table public.students enable row level security;
alter table public.scholarship_awards enable row level security;
alter table public.scholarship_disbursements enable row level security;

create policy "Finance read students" on public.students for select to authenticated using(public.mrpst_can_manage_finance());
create policy "Finance manage students" on public.students for all to authenticated using(public.mrpst_can_manage_finance()) with check(public.mrpst_can_manage_finance() and created_by=auth.uid());
create policy "Finance read scholarship awards" on public.scholarship_awards for select to authenticated using(public.mrpst_can_manage_finance());
create policy "Finance create scholarship awards" on public.scholarship_awards for insert to authenticated with check(public.mrpst_can_manage_finance() and created_by=auth.uid() and status='draft');
create policy "Finance update draft scholarship awards" on public.scholarship_awards for update to authenticated using(public.mrpst_can_manage_finance() and status in ('draft','rejected')) with check(public.mrpst_can_manage_finance() and status in ('draft','rejected'));
create policy "Finance read scholarship disbursements" on public.scholarship_disbursements for select to authenticated using(public.mrpst_can_manage_finance());

grant select,insert,update,delete on public.students to authenticated;
grant select,insert,update on public.scholarship_awards to authenticated;
grant select on public.scholarship_disbursements to authenticated;

create or replace function public.mrpst_submit_scholarship_award(target_award uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.mrpst_can_manage_finance() then raise exception 'Finance permission required'; end if;
 update public.scholarship_awards set status='submitted',submitted_by=auth.uid(),submitted_at=now(),rejection_reason=null,updated_at=now()
 where id=target_award and status in ('draft','rejected');
 if not found then raise exception 'Only draft or rejected awards can be submitted'; end if;
end; $$;

create or replace function public.mrpst_review_scholarship_award(target_award uuid,approve boolean,reason text default null)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not(public.mrpst_is_active_user(auth.uid()) and (public.mrpst_has_role(auth.uid(),'super_admin') or public.mrpst_has_role(auth.uid(),'administrator'))) then raise exception 'Approval permission required'; end if;
 update public.scholarship_awards set status=case when approve then 'approved'::public.mrpst_scholarship_status else 'rejected'::public.mrpst_scholarship_status end,
 approved_by=case when approve then auth.uid() else null end,approved_at=case when approve then now() else null end,
 rejection_reason=case when approve then null else nullif(trim(reason),'') end,updated_at=now()
 where id=target_award and status='submitted';
 if not found then raise exception 'Only submitted scholarship awards can be reviewed'; end if;
end; $$;

create or replace function public.mrpst_create_scholarship_award(
 p_student_id uuid,p_fund_id uuid,p_academic_year integer,p_name text,p_purpose text,
 p_currency char(3),p_amount numeric,p_exchange_rate numeric
) returns uuid language plpgsql security definer set search_path=public as $$
declare new_award uuid;
begin
 if not public.mrpst_can_manage_finance() then raise exception 'Finance permission required'; end if;
 if not exists(select 1 from public.students where id=p_student_id and student_status='active') then raise exception 'Select an active student'; end if;
 if not exists(select 1 from public.finance_funds where id=p_fund_id and fund_type='scholarship' and is_active) then raise exception 'Select the active scholarship fund'; end if;
 if p_academic_year not between 2000 and 2200 or nullif(trim(p_name),'') is null then raise exception 'Academic year and scholarship name are required'; end if;
 if p_amount is null or p_amount<=0 or p_exchange_rate is null or p_exchange_rate<=0 then raise exception 'Amount and exchange rate must be positive'; end if;
 if p_currency is null or p_currency !~ '^[A-Z]{3}$' then raise exception 'Invalid currency'; end if;
 insert into public.scholarship_awards(student_id,fund_id,academic_year,scholarship_name,purpose,original_currency,original_amount,exchange_rate,created_by)
 values(p_student_id,p_fund_id,p_academic_year,trim(p_name),nullif(trim(p_purpose),''),p_currency,p_amount,p_exchange_rate,auth.uid()) returning id into new_award;
 return new_award;
end; $$;

create or replace function public.mrpst_refresh_scholarship_status(target_award uuid)
returns void language plpgsql security definer set search_path=public as $$
declare a public.scholarship_awards%rowtype; paid numeric(18,2);
begin
 if not public.mrpst_can_manage_finance() then raise exception 'Finance permission required'; end if;
 select * into a from public.scholarship_awards where id=target_award for update;
 if not found or a.status<>'approved' then return; end if;
 select coalesce(sum(d.base_amount),0) into paid from public.scholarship_disbursements d join public.journal_entries j on j.id=d.journal_entry_id where d.award_id=target_award and j.status='posted';
 if paid>=a.base_amount then update public.scholarship_awards set status='completed',updated_at=now() where id=target_award; end if;
end; $$;

-- Function privileges are applied after every RPC has been created.

-- Remaining award balances use only posted disbursements.
create or replace view public.scholarship_award_balances with (security_invoker=true) as
select a.id as award_id,a.award_number,a.student_id,s.student_number,s.full_name,a.fund_id,a.academic_year,a.scholarship_name,a.original_currency,a.original_amount,a.exchange_rate,a.base_amount,a.status,
 coalesce(sum(case when j.status='posted' then d.base_amount else 0 end),0)::numeric(18,2) as paid_amount,
 (a.base_amount-coalesce(sum(case when j.status='posted' then d.base_amount else 0 end),0))::numeric(18,2) as remaining_amount
from public.scholarship_awards a join public.students s on s.id=a.student_id
left join public.scholarship_disbursements d on d.award_id=a.id
left join public.journal_entries j on j.id=d.journal_entry_id
group by a.id,s.student_number,s.full_name;
grant select on public.scholarship_award_balances to authenticated;

-- Harden student editing permissions and reserve pending scholarship installments.
drop policy if exists "Finance manage students" on public.students;
create policy "Finance insert students" on public.students for insert to authenticated
 with check(public.mrpst_can_manage_finance() and created_by=auth.uid());
create policy "Finance update students" on public.students for update to authenticated
 using(public.mrpst_can_manage_finance()) with check(public.mrpst_can_manage_finance());
create policy "Finance delete students" on public.students for delete to authenticated
 using(public.mrpst_can_manage_finance());

create or replace function public.mrpst_create_scholarship_disbursement(
 p_award_id uuid,p_installment_no integer,p_paid_date date,p_currency char(3),p_amount numeric,p_exchange_rate numeric,p_cash_account uuid,p_expense_account uuid
) returns uuid language plpgsql security definer set search_path=public as $$
declare a public.scholarship_awards%rowtype; new_entry uuid; new_disbursement uuid; base numeric(18,2); committed numeric(18,2);
begin
 if not public.mrpst_can_manage_finance() then raise exception 'Finance permission required'; end if;
 select * into a from public.scholarship_awards where id=p_award_id for update;
 if not found or a.status<>'approved' then raise exception 'Scholarship award must be approved'; end if;
 if p_installment_no is null or p_installment_no<=0 or p_paid_date is null then raise exception 'Installment number and payment date are required'; end if;
 if p_amount is null or p_amount<=0 or p_exchange_rate is null or p_exchange_rate<=0 then raise exception 'Amount and exchange rate must be positive'; end if;
 if p_currency is null or p_currency !~ '^[A-Z]{3}$' then raise exception 'Invalid currency'; end if;
 if not exists(select 1 from public.finance_accounts where id=p_cash_account and account_type='asset' and is_active) then raise exception 'Select an active cash/bank account'; end if;
 if not exists(select 1 from public.finance_accounts where id=p_expense_account and account_type='expense' and code='5300' and is_active) then raise exception 'Select the active scholarship expense account'; end if;
 if exists(select 1 from public.finance_periods where p_paid_date between starts_on and ends_on and is_closed) then raise exception 'The fiscal period is closed'; end if;
 base:=round(p_amount*p_exchange_rate,2);
 select coalesce(sum(d.base_amount),0) into committed
 from public.scholarship_disbursements d join public.journal_entries j on j.id=d.journal_entry_id
 where d.award_id=p_award_id and j.status in ('submitted','approved','posted');
 if committed+base>a.base_amount then raise exception 'Disbursement exceeds the approved scholarship amount, including pending installments'; end if;
 insert into public.journal_entries(entry_date,description,reference_no,fund_id,created_by,status,submitted_by,submitted_at)
 values(p_paid_date,'장학금 지급: '||a.scholarship_name,'SCHOLARSHIP-'||a.award_number::text||'-'||p_installment_no::text,a.fund_id,auth.uid(),'submitted',auth.uid(),now()) returning id into new_entry;
 insert into public.journal_lines(entry_id,line_no,account_id,description,debit,credit)
 values(new_entry,1,p_expense_account,'장학금 지급',base,0),(new_entry,2,p_cash_account,'장학금 지급',0,base);
 insert into public.scholarship_disbursements(award_id,installment_no,paid_date,original_currency,original_amount,exchange_rate,journal_entry_id,created_by)
 values(p_award_id,p_installment_no,p_paid_date,p_currency,p_amount,p_exchange_rate,new_entry,auth.uid()) returning id into new_disbursement;
 insert into public.finance_audit_log(entry_id,actor_id,action,details)
 values(new_entry,auth.uid(),'scholarship_disbursement_submitted',jsonb_build_object('award_id',p_award_id,'disbursement_id',new_disbursement,'base_amount',base));
 return new_disbursement;
end; $$;

revoke all on function public.mrpst_submit_scholarship_award(uuid) from public;
revoke all on function public.mrpst_review_scholarship_award(uuid,boolean,text) from public;
revoke all on function public.mrpst_create_scholarship_award(uuid,uuid,integer,text,text,char,numeric,numeric) from public;
revoke all on function public.mrpst_create_scholarship_disbursement(uuid,integer,date,char,numeric,numeric,uuid,uuid) from public;
revoke all on function public.mrpst_refresh_scholarship_status(uuid) from public;
grant execute on function public.mrpst_submit_scholarship_award(uuid) to authenticated;
grant execute on function public.mrpst_review_scholarship_award(uuid,boolean,text) to authenticated;
grant execute on function public.mrpst_create_scholarship_award(uuid,uuid,integer,text,text,char,numeric,numeric) to authenticated;
grant execute on function public.mrpst_create_scholarship_disbursement(uuid,integer,date,char,numeric,numeric,uuid,uuid) to authenticated;
grant execute on function public.mrpst_refresh_scholarship_status(uuid) to authenticated;
