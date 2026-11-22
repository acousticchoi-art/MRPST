-- The school operates a straightforward cashbook, not a multi-stage accounting approval desk.
-- Keep an audit trail, but allow finance managers to correct saved entries.

drop trigger if exists journal_entries_immutable_after_post on public.journal_entries;
drop trigger if exists journal_lines_immutable_after_post on public.journal_lines;

create or replace function public.mrpst_save_simple_cashbook_entry(
  p_entry_date date,
  p_description text,
  p_fund_id uuid,
  p_debit_account uuid,
  p_credit_account uuid,
  p_amount numeric
) returns uuid language plpgsql security definer set search_path=public as $function$
declare entry_id uuid;
begin
 if not public.mrpst_can_manage_finance() then raise exception 'Finance permission required'; end if;
 if p_entry_date is null or nullif(trim(p_description),'') is null or p_amount is null or p_amount<=0 then raise exception 'Date, description, and a positive amount are required'; end if;
 if p_debit_account=p_credit_account then raise exception 'Select different cashbook accounts'; end if;
 if not exists(select 1 from public.finance_funds where id=p_fund_id and is_active) then raise exception 'Select an active fund'; end if;
 if exists(select 1 from public.finance_periods where p_entry_date between starts_on and ends_on and is_closed) then raise exception 'The fiscal period is closed'; end if;
 if exists(select 1 from public.finance_accounts where id in (p_debit_account,p_credit_account) and not is_active) or (select count(*) from public.finance_accounts where id in (p_debit_account,p_credit_account))<>2 then raise exception 'Select active accounts'; end if;
 insert into public.journal_entries(entry_date,description,fund_id,status,created_by,submitted_by,submitted_at,approved_by,approved_at,posted_by,posted_at)
 values(p_entry_date,trim(p_description),p_fund_id,'draft',auth.uid(),auth.uid(),now(),auth.uid(),now(),auth.uid(),now()) returning id into entry_id;
 insert into public.journal_lines(entry_id,line_no,description,account_id,debit,credit) values
  (entry_id,1,trim(p_description),p_debit_account,p_amount,0),
  (entry_id,2,trim(p_description),p_credit_account,0,p_amount);
 update public.journal_entries set status='posted',updated_at=now() where id=entry_id;
 insert into public.finance_audit_log(entry_id,actor_id,action,details) values(entry_id,auth.uid(),'cashbook_saved',jsonb_build_object('amount',p_amount));
 return entry_id;
end;$function$;

create or replace function public.mrpst_update_journal_draft(target_entry uuid,p_entry_date date,p_description text,p_fund_id uuid,p_reference_no text,p_lines jsonb)
returns void language plpgsql security definer set search_path=public as $function$
declare e public.journal_entries%rowtype; n integer; d numeric(18,2); c numeric(18,2);
begin
 if not public.mrpst_can_manage_finance() then raise exception 'Finance permission required'; end if;
 select * into e from public.journal_entries where id=target_entry for update;
 if not found then raise exception 'Entry not found'; end if;
 if p_entry_date is null or nullif(trim(p_description),'') is null then raise exception 'Date and description are required'; end if;
 if not exists(select 1 from public.finance_funds where id=p_fund_id and is_active) then raise exception 'Select an active fund'; end if;
 if jsonb_typeof(p_lines)<>'array' then raise exception 'Journal lines must be an array'; end if;
 select count(*),coalesce(sum((value->>'debit')::numeric),0),coalesce(sum((value->>'credit')::numeric),0) into n,d,c from jsonb_array_elements(p_lines) as items(value);
 if n<2 or d<=0 or d<>c then raise exception 'At least two balanced journal lines are required'; end if;
 if exists(select 1 from jsonb_array_elements(p_lines) as items(value) left join public.finance_accounts a on a.id=(value->>'account_id')::uuid where a.id is null or not a.is_active) then raise exception 'An account is invalid or inactive'; end if;
 update public.journal_entries set entry_date=p_entry_date,description=trim(p_description),reference_no=nullif(trim(p_reference_no),''),fund_id=p_fund_id,status='posted',rejection_reason=null,updated_at=now() where id=target_entry;
 delete from public.journal_lines where entry_id=target_entry;
 insert into public.journal_lines(entry_id,line_no,account_id,description,debit,credit) select target_entry,(row_number() over())::integer,(value->>'account_id')::uuid,nullif(value->>'description',''),coalesce((value->>'debit')::numeric,0),coalesce((value->>'credit')::numeric,0) from jsonb_array_elements(p_lines) as items(value);
 insert into public.finance_audit_log(entry_id,actor_id,action,details) values(target_entry,auth.uid(),'cashbook_updated',jsonb_build_object('debit_total',d,'credit_total',c));
end;$function$;

create or replace function public.mrpst_delete_journal_draft(target_entry uuid)
returns void language plpgsql security definer set search_path=public as $function$
declare e public.journal_entries%rowtype;
begin
 if not public.mrpst_can_manage_finance() then raise exception 'Finance permission required'; end if;
 select * into e from public.journal_entries where id=target_entry for update;
 if not found then raise exception 'Entry not found'; end if;
 if exists(select 1 from public.donor_contributions where journal_entry_id=target_entry) or exists(select 1 from public.scholarship_disbursements where journal_entry_id=target_entry) then raise exception 'This entry is linked to a donation or scholarship payment'; end if;
 update public.finance_audit_log set entry_id=null,details=coalesce(details,'{}'::jsonb)||jsonb_build_object('deleted_entry',jsonb_build_object('id',e.id,'entry_no',e.entry_no,'entry_date',e.entry_date,'description',e.description)) where entry_id=target_entry;
 delete from public.journal_lines where entry_id=target_entry;
 delete from public.journal_entries where id=target_entry;
end;$function$;

revoke all on function public.mrpst_save_simple_cashbook_entry(date,text,uuid,uuid,uuid,numeric) from public;
grant execute on function public.mrpst_save_simple_cashbook_entry(date,text,uuid,uuid,uuid,numeric) to authenticated;
