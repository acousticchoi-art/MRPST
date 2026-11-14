create or replace function public.mrpst_update_scholarship_award_draft(target_award uuid,p_student_id uuid,p_fund_id uuid,p_academic_year integer,p_name text,p_purpose text,p_currency character,p_amount numeric,p_exchange_rate numeric)
returns void language plpgsql security definer set search_path=public as $function$
declare a public.scholarship_awards%rowtype;
begin
 if not public.mrpst_can_manage_finance() then raise exception 'Finance permission required'; end if;
 select * into a from public.scholarship_awards where id=target_award for update;
 if not found or a.status not in ('draft','rejected') then raise exception 'Only draft or rejected scholarship awards can be edited'; end if;
 if exists(select 1 from public.scholarship_disbursements where award_id=target_award) then raise exception 'An award with payment history cannot be edited'; end if;
 if not exists(select 1 from public.students where id=p_student_id and student_status='active') then raise exception 'Select an active student'; end if;
 if not exists(select 1 from public.finance_funds where id=p_fund_id and fund_type='scholarship' and is_active) then raise exception 'Select the active scholarship fund'; end if;
 if p_academic_year not between 2000 and 2200 or nullif(trim(p_name),'') is null then raise exception 'Academic year and scholarship name are required'; end if;
 if p_amount is null or p_amount<=0 or p_exchange_rate is null or p_exchange_rate<=0 then raise exception 'Amount and exchange rate must be positive'; end if;
 if p_currency is null or p_currency !~ '^[A-Z]{3}$' then raise exception 'Invalid currency'; end if;
 update public.scholarship_awards set student_id=p_student_id,fund_id=p_fund_id,academic_year=p_academic_year,scholarship_name=trim(p_name),purpose=nullif(trim(p_purpose),''),original_currency=p_currency,original_amount=p_amount,exchange_rate=p_exchange_rate,rejection_reason=null,updated_at=now() where id=target_award;
end;$function$;
create or replace function public.mrpst_delete_scholarship_award_draft(target_award uuid)
returns void language plpgsql security definer set search_path=public as $function$
declare a public.scholarship_awards%rowtype;
begin
 if not public.mrpst_can_manage_finance() then raise exception 'Finance permission required'; end if;
 select * into a from public.scholarship_awards where id=target_award for update;
 if not found or a.status not in ('draft','rejected') then raise exception 'Only draft or rejected scholarship awards can be deleted'; end if;
 if exists(select 1 from public.scholarship_disbursements where award_id=target_award) then raise exception 'An award with payment history cannot be deleted'; end if;
 delete from public.scholarship_awards where id=target_award;
end;$function$;
revoke all on function public.mrpst_update_scholarship_award_draft(uuid,uuid,uuid,integer,text,text,character,numeric,numeric) from public,anon;
revoke all on function public.mrpst_delete_scholarship_award_draft(uuid) from public,anon;
grant execute on function public.mrpst_update_scholarship_award_draft(uuid,uuid,uuid,integer,text,text,character,numeric,numeric) to authenticated;
grant execute on function public.mrpst_delete_scholarship_award_draft(uuid) to authenticated;