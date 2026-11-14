create or replace function public.mrpst_update_journal_draft(target_entry uuid,p_entry_date date,p_description text,p_fund_id uuid,p_reference_no text,p_lines jsonb)
returns void language plpgsql security definer set search_path=public as $function$
declare e public.journal_entries%rowtype; n integer; d numeric(18,2); c numeric(18,2);
begin
 if not public.mrpst_can_manage_finance() then raise exception 'Finance permission required'; end if;
 select * into e from public.journal_entries where id=target_entry for update;
 if not found or e.status not in ('draft','rejected') then raise exception 'Only draft or rejected entries can be edited'; end if;
 if p_entry_date is null or nullif(trim(p_description),'') is null then raise exception 'Date and description are required'; end if;
 if not exists(select 1 from public.finance_funds where id=p_fund_id and is_active) then raise exception 'Select an active fund'; end if;
 if exists(select 1 from public.finance_periods where p_entry_date between starts_on and ends_on and is_closed) then raise exception 'The fiscal period is closed'; end if;
 if jsonb_typeof(p_lines)<>'array' then raise exception 'Journal lines must be an array'; end if;
 select count(*),coalesce(sum((value->>'debit')::numeric),0),coalesce(sum((value->>'credit')::numeric),0) into n,d,c from jsonb_array_elements(p_lines) as items(value);
 if n<2 or d<=0 or d<>c then raise exception 'At least two balanced journal lines are required'; end if;
 if exists(select 1 from jsonb_array_elements(p_lines) as items(value) where (coalesce((value->>'debit')::numeric,0)>0 and coalesce((value->>'credit')::numeric,0)>0) or (coalesce((value->>'debit')::numeric,0)=0 and coalesce((value->>'credit')::numeric,0)=0) or coalesce((value->>'debit')::numeric,0)<0 or coalesce((value->>'credit')::numeric,0)<0) then raise exception 'Each line must contain either a positive debit or credit'; end if;
 if exists(select 1 from jsonb_array_elements(p_lines) as items(value) left join public.finance_accounts a on a.id=(value->>'account_id')::uuid where a.id is null or not a.is_active) then raise exception 'An account is invalid or inactive'; end if;
 update public.journal_entries set entry_date=p_entry_date,description=trim(p_description),reference_no=nullif(trim(p_reference_no),''),fund_id=p_fund_id,rejection_reason=null,updated_at=now() where id=target_entry;
 delete from public.journal_lines where entry_id=target_entry;
 insert into public.journal_lines(entry_id,line_no,account_id,description,debit,credit) select target_entry,(row_number() over())::integer,(value->>'account_id')::uuid,nullif(value->>'description',''),coalesce((value->>'debit')::numeric,0),coalesce((value->>'credit')::numeric,0) from jsonb_array_elements(p_lines) as items(value);
 insert into public.finance_audit_log(entry_id,actor_id,action,details) values(target_entry,auth.uid(),'draft_updated',jsonb_build_object('debit_total',d,'credit_total',c));
end;$function$;
create or replace function public.mrpst_delete_journal_draft(target_entry uuid)
returns void language plpgsql security definer set search_path=public as $function$
declare e public.journal_entries%rowtype;
begin
 if not public.mrpst_can_manage_finance() then raise exception 'Finance permission required'; end if;
 select * into e from public.journal_entries where id=target_entry for update;
 if not found or e.status not in ('draft','rejected') then raise exception 'Only draft or rejected entries can be deleted'; end if;
 if exists(select 1 from public.donor_contributions where journal_entry_id=target_entry) or exists(select 1 from public.scholarship_disbursements where journal_entry_id=target_entry) or exists(select 1 from public.journal_entries where correction_of=target_entry) then raise exception 'This entry is linked to a donation, scholarship payment, or correction and cannot be deleted'; end if;
 update public.finance_audit_log set entry_id=null,details=coalesce(details,'{}'::jsonb)||jsonb_build_object('deleted_entry',jsonb_build_object('id',e.id,'entry_no',e.entry_no,'entry_date',e.entry_date,'description',e.description,'fund_id',e.fund_id,'status',e.status)) where entry_id=target_entry;
 delete from public.journal_lines where entry_id=target_entry; delete from public.journal_entries where id=target_entry;
end;$function$;
create or replace function public.mrpst_update_budget_draft(target_budget uuid,p_year integer,p_title text,p_fund_id uuid,p_lines jsonb)
returns void language plpgsql security definer set search_path=public as $function$
declare b public.finance_budgets%rowtype; n integer;
begin
 if not public.mrpst_can_manage_finance() then raise exception 'Finance permission required'; end if;
 select * into b from public.finance_budgets where id=target_budget for update;
 if not found or b.status not in ('draft','rejected') then raise exception 'Only draft or rejected budgets can be edited'; end if;
 if p_year not between 2000 and 2200 or nullif(trim(p_title),'') is null then raise exception 'Valid fiscal year and title are required'; end if;
 if not exists(select 1 from public.finance_funds where id=p_fund_id and is_active) then raise exception 'Select an active fund'; end if;
 if jsonb_typeof(p_lines)<>'array' then raise exception 'Budget lines must be an array'; end if;
 select count(*) into n from jsonb_array_elements(p_lines); if n=0 then raise exception 'Add at least one budget line'; end if;
 if exists(select 1 from jsonb_array_elements(p_lines) as items(value) where coalesce((value->>'planned_amount')::numeric,0)<=0) then raise exception 'Budget amounts must be positive'; end if;
 if exists(select 1 from jsonb_array_elements(p_lines) as items(value) left join public.finance_accounts a on a.id=(value->>'account_id')::uuid where a.id is null or a.account_type<>'expense' or not a.is_active) then raise exception 'Budget lines must use active expense accounts'; end if;
 update public.finance_budgets set fiscal_year=p_year,title=trim(p_title),fund_id=p_fund_id,rejection_reason=null,updated_at=now() where id=target_budget;
 delete from public.finance_budget_lines where budget_id=target_budget;
 insert into public.finance_budget_lines(budget_id,account_id,planned_amount,notes) select target_budget,(value->>'account_id')::uuid,(value->>'planned_amount')::numeric,nullif(value->>'notes','') from jsonb_array_elements(p_lines) as items(value);
end;$function$;
create or replace function public.mrpst_delete_budget_draft(target_budget uuid)
returns void language plpgsql security definer set search_path=public as $function$
declare b public.finance_budgets%rowtype;
begin
 if not public.mrpst_can_manage_finance() then raise exception 'Finance permission required'; end if;
 select * into b from public.finance_budgets where id=target_budget for update;
 if not found or b.status not in ('draft','rejected') then raise exception 'Only draft or rejected budgets can be deleted'; end if;
 delete from public.finance_budgets where id=target_budget;
end;$function$;
revoke all on function public.mrpst_update_journal_draft(uuid,date,text,uuid,text,jsonb) from public;
revoke all on function public.mrpst_delete_journal_draft(uuid) from public;
revoke all on function public.mrpst_update_budget_draft(uuid,integer,text,uuid,jsonb) from public;
revoke all on function public.mrpst_delete_budget_draft(uuid) from public;
grant execute on function public.mrpst_update_journal_draft(uuid,date,text,uuid,text,jsonb) to authenticated;
grant execute on function public.mrpst_delete_journal_draft(uuid) to authenticated;
grant execute on function public.mrpst_update_budget_draft(uuid,integer,text,uuid,jsonb) to authenticated;
grant execute on function public.mrpst_delete_budget_draft(uuid) to authenticated;
