-- Reporting views for posted financial activity only.
-- All views use invoker permissions so underlying RLS remains effective.

create index if not exists journal_entries_status_date_fund_idx
  on public.journal_entries(status, entry_date, fund_id);
create index if not exists journal_lines_account_entry_idx
  on public.journal_lines(account_id, entry_id);
create index if not exists scholarship_disbursements_paid_date_idx
  on public.scholarship_disbursements(paid_date);

create or replace view public.finance_monthly_income_expense
with (security_invoker = true) as
select
  date_trunc('month', je.entry_date)::date as month,
  je.fund_id,
  f.code as fund_code,
  f.name_ko as fund_name_ko,
  f.name_en as fund_name_en,
  coalesce(sum(case when a.account_type = 'income' then jl.credit - jl.debit else 0 end), 0)::numeric(18,2) as income_amount,
  coalesce(sum(case when a.account_type = 'expense' then jl.debit - jl.credit else 0 end), 0)::numeric(18,2) as expense_amount
from public.journal_entries je
join public.journal_lines jl on jl.entry_id = je.id
join public.finance_accounts a on a.id = jl.account_id
join public.finance_funds f on f.id = je.fund_id
where je.status = 'posted'
  and a.account_type in ('income', 'expense')
group by date_trunc('month', je.entry_date)::date, je.fund_id, f.code, f.name_ko, f.name_en;

create or replace view public.finance_fund_account_balances
with (security_invoker = true) as
select
  je.fund_id,
  f.code as fund_code,
  f.name_ko as fund_name_ko,
  f.name_en as fund_name_en,
  a.id as account_id,
  a.code as account_code,
  a.name_ko as account_name_ko,
  a.name_en as account_name_en,
  a.account_type,
  coalesce(sum(jl.debit), 0)::numeric(18,2) as debit_total,
  coalesce(sum(jl.credit), 0)::numeric(18,2) as credit_total,
  coalesce(sum(case when a.account_type in ('asset','expense') then jl.debit - jl.credit else jl.credit - jl.debit end), 0)::numeric(18,2) as normal_balance
from public.journal_entries je
join public.journal_lines jl on jl.entry_id = je.id
join public.finance_accounts a on a.id = jl.account_id
join public.finance_funds f on f.id = je.fund_id
where je.status = 'posted'
group by je.fund_id, f.code, f.name_ko, f.name_en, a.id, a.code, a.name_ko, a.name_en, a.account_type;

create or replace view public.finance_donor_contribution_report
with (security_invoker = true) as
select
  dc.id as contribution_id,
  dc.contribution_date,
  dc.purpose,
  dc.reference_no,
  dc.original_currency,
  dc.original_amount,
  dc.exchange_rate,
  dc.base_amount,
  d.id as donor_id,
  d.donor_code,
  d.display_name as donor_name,
  d.donor_type,
  f.id as fund_id,
  f.code as fund_code,
  f.name_ko as fund_name_ko,
  f.name_en as fund_name_en,
  je.id as journal_entry_id,
  je.entry_no
from public.donor_contributions dc
join public.finance_donors d on d.id = dc.donor_id
join public.finance_funds f on f.id = dc.fund_id
join public.journal_entries je on je.id = dc.journal_entry_id
where je.status = 'posted';

create or replace view public.finance_scholarship_disbursement_report
with (security_invoker = true) as
select
  sd.id as disbursement_id,
  sd.award_id,
  sd.installment_no,
  sd.paid_date,
  sd.original_currency,
  sd.original_amount,
  sd.exchange_rate,
  sd.base_amount,
  sa.award_number,
  sa.academic_year,
  sa.scholarship_name,
  s.id as student_id,
  s.student_number,
  s.full_name as student_name,
  f.id as fund_id,
  f.code as fund_code,
  f.name_ko as fund_name_ko,
  f.name_en as fund_name_en,
  je.id as journal_entry_id,
  je.entry_no
from public.scholarship_disbursements sd
join public.scholarship_awards sa on sa.id = sd.award_id
join public.students s on s.id = sa.student_id
join public.finance_funds f on f.id = sa.fund_id
join public.journal_entries je on je.id = sd.journal_entry_id
where je.status = 'posted';

create or replace view public.finance_general_ledger
with (security_invoker = true) as
select
  je.id as journal_entry_id,
  je.entry_no,
  je.entry_date,
  je.description as entry_description,
  je.reference_no,
  je.fund_id,
  f.code as fund_code,
  f.name_ko as fund_name_ko,
  f.name_en as fund_name_en,
  jl.id as journal_line_id,
  jl.line_no,
  jl.description as line_description,
  a.id as account_id,
  a.code as account_code,
  a.name_ko as account_name_ko,
  a.name_en as account_name_en,
  a.account_type,
  jl.debit,
  jl.credit
from public.journal_entries je
join public.journal_lines jl on jl.entry_id = je.id
join public.finance_accounts a on a.id = jl.account_id
join public.finance_funds f on f.id = je.fund_id
where je.status = 'posted';

grant select on public.finance_monthly_income_expense to authenticated;
grant select on public.finance_fund_account_balances to authenticated;
grant select on public.finance_donor_contribution_report to authenticated;
grant select on public.finance_scholarship_disbursement_report to authenticated;
grant select on public.finance_general_ledger to authenticated;
