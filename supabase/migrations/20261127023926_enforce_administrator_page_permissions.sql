CREATE OR REPLACE FUNCTION mrpst_private.can_edit_ordinary_account(target_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select target_id <> auth.uid()
    and public.mrpst_is_active_user(auth.uid())
    and public.mrpst_has_role(auth.uid(), 'administrator')
    and public.mrpst_can_access_module(auth.uid(), 'administration')
    and not exists (
      select 1 from public.user_roles
      where user_id = target_id and role in ('super_admin', 'administrator')
    );
$function$
;

CREATE OR REPLACE FUNCTION public.mrpst_approve_budget(target_budget uuid, approve boolean, reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 if not(public.mrpst_can_manage_finance() and public.mrpst_is_active_user(auth.uid()) and (public.mrpst_has_role(auth.uid(),'super_admin') or public.mrpst_has_role(auth.uid(),'administrator'))) then raise exception 'Approval permission required'; end if;
 update public.finance_budgets set status=case when approve then 'approved'::public.mrpst_budget_status else 'rejected'::public.mrpst_budget_status end,approved_by=case when approve then auth.uid() else null end,approved_at=case when approve then now() else null end,rejection_reason=case when approve then null else nullif(trim(reason),'') end,updated_at=now() where id=target_budget and status='submitted';
 if not found then raise exception 'Only submitted budgets can be reviewed'; end if;
end; $function$
;

CREATE OR REPLACE FUNCTION public.mrpst_approve_journal(target_entry uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ begin if not(public.mrpst_can_manage_finance() and public.mrpst_is_active_user(auth.uid()) and (public.mrpst_has_role(auth.uid(),'super_admin') or public.mrpst_has_role(auth.uid(),'administrator'))) then raise exception 'Approval permission required'; end if; update public.journal_entries set status='approved',approved_by=auth.uid(),approved_at=now(),updated_at=now() where id=target_entry and status='submitted'; if not found then raise exception 'Only submitted entries can be approved'; end if; insert into public.finance_audit_log(entry_id,actor_id,action) values(target_entry,auth.uid(),'approved'); end; $function$
;

CREATE OR REPLACE FUNCTION public.mrpst_can_access_module(target_user uuid, target_module text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when not public.mrpst_is_active_user(target_user) then false
    when public.mrpst_has_role(target_user,'super_admin'::public.mrpst_role) then true
    when public.mrpst_has_role(target_user,'administrator'::public.mrpst_role) then coalesce((select p.can_view from public.user_module_permissions p where p.user_id=target_user and p.module_key=target_module),true)
    when target_module='administration' then false
    when exists(
      select 1 from public.user_module_permissions p
      where p.user_id=target_user and p.module_key=target_module
    ) then exists(
      select 1 from public.user_module_permissions p
      where p.user_id=target_user and p.module_key=target_module and p.can_view
    )
    else exists(
      select 1 from public.user_roles r
      where r.user_id=target_user and (
        (target_module='finance' and r.role='finance_officer') or
        (target_module='students' and r.role in ('student_officer','academic_officer')) or
        (target_module='academics' and r.role in ('academic_officer','faculty')) or
        (target_module='facilities' and r.role='facility_manager') or
        (target_module='library' and r.role='librarian') or
        (target_module='meetings' and r.role in ('academic_officer','faculty','staff')) or
        (target_module='calendar' and r.role in ('academic_officer','faculty','student_officer','student'))
      )
    )
  end;
$function$
;

CREATE OR REPLACE FUNCTION public.mrpst_can_manage_module(target_user uuid, target_module text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when not public.mrpst_is_active_user(target_user) then false
    when public.mrpst_has_role(target_user,'super_admin'::public.mrpst_role) then true
    when target_module='administration' then false
    when not public.mrpst_can_access_module(target_user,target_module) then false
    when public.mrpst_has_role(target_user,'administrator'::public.mrpst_role) then true
    when exists(
      select 1 from public.user_module_permissions p
      where p.user_id=target_user and p.module_key=target_module
    ) then exists(
      select 1 from public.user_module_permissions p
      where p.user_id=target_user and p.module_key=target_module and p.can_manage
    )
    else exists(
      select 1 from public.user_roles r
      where r.user_id=target_user and (
        (target_module='finance' and r.role='finance_officer') or
        (target_module='students' and r.role in ('student_officer','academic_officer')) or
        (target_module='academics' and r.role='academic_officer') or
        (target_module='facilities' and r.role='facility_manager') or
        (target_module='library' and r.role='librarian') or
        (target_module='meetings' and r.role in ('academic_officer','faculty','staff')) or
        (target_module='website' and r.role='administrator')
      )
    )
  end;
$function$
;

CREATE OR REPLACE FUNCTION public.mrpst_reject_journal(target_entry uuid, reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 if not(public.mrpst_can_manage_finance() and public.mrpst_is_active_user(auth.uid()) and (public.mrpst_has_role(auth.uid(),'super_admin') or public.mrpst_has_role(auth.uid(),'administrator'))) then raise exception 'Approval permission required'; end if;
 update public.journal_entries set status='rejected',rejection_reason=nullif(trim(reason),''),updated_at=now() where id=target_entry and status='submitted';
 if not found then raise exception 'Only submitted entries can be rejected'; end if;
 insert into public.finance_audit_log(entry_id,actor_id,action,details) values(target_entry,auth.uid(),'rejected',jsonb_build_object('reason',reason));
end; $function$
;

CREATE OR REPLACE FUNCTION public.mrpst_review_scholarship_award(target_award uuid, approve boolean, reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 if not(public.mrpst_can_manage_finance() and public.mrpst_is_active_user(auth.uid()) and (public.mrpst_has_role(auth.uid(),'super_admin') or public.mrpst_has_role(auth.uid(),'administrator'))) then raise exception 'Approval permission required'; end if;
 update public.scholarship_awards set status=case when approve then 'approved'::public.mrpst_scholarship_status else 'rejected'::public.mrpst_scholarship_status end,
 approved_by=case when approve then auth.uid() else null end,approved_at=case when approve then now() else null end,
 rejection_reason=case when approve then null else nullif(trim(reason),'') end,updated_at=now()
 where id=target_award and status='submitted';
 if not found then raise exception 'Only submitted scholarship awards can be reviewed'; end if;
end; $function$
;
alter policy "Grade administrators delete grades" on public.academic_grades using ((mrpst_is_active_user(( SELECT auth.uid() AS uid)) AND (mrpst_has_role(( SELECT auth.uid() AS uid), 'super_admin'::mrpst_role) OR mrpst_has_role(( SELECT auth.uid() AS uid), 'administrator'::mrpst_role) OR mrpst_has_role(( SELECT auth.uid() AS uid), 'academic_officer'::mrpst_role))) and (not public.mrpst_has_role((select auth.uid()),'administrator') or public.mrpst_can_manage_academics()));
alter policy "Grade administrators insert grades" on public.academic_grades with check ((mrpst_is_active_user(( SELECT auth.uid() AS uid)) AND (mrpst_has_role(( SELECT auth.uid() AS uid), 'super_admin'::mrpst_role) OR mrpst_has_role(( SELECT auth.uid() AS uid), 'administrator'::mrpst_role) OR mrpst_has_role(( SELECT auth.uid() AS uid), 'academic_officer'::mrpst_role)) AND (entered_by = ( SELECT auth.uid() AS uid))) and (not public.mrpst_has_role((select auth.uid()),'administrator') or public.mrpst_can_manage_academics()));
alter policy "Grade administrators update grades" on public.academic_grades using ((mrpst_is_active_user(( SELECT auth.uid() AS uid)) AND (mrpst_has_role(( SELECT auth.uid() AS uid), 'super_admin'::mrpst_role) OR mrpst_has_role(( SELECT auth.uid() AS uid), 'administrator'::mrpst_role) OR mrpst_has_role(( SELECT auth.uid() AS uid), 'academic_officer'::mrpst_role))) and (not public.mrpst_has_role((select auth.uid()),'administrator') or public.mrpst_can_manage_academics())) with check ((mrpst_is_active_user(( SELECT auth.uid() AS uid)) AND (mrpst_has_role(( SELECT auth.uid() AS uid), 'super_admin'::mrpst_role) OR mrpst_has_role(( SELECT auth.uid() AS uid), 'administrator'::mrpst_role) OR mrpst_has_role(( SELECT auth.uid() AS uid), 'academic_officer'::mrpst_role))) and (not public.mrpst_has_role((select auth.uid()),'administrator') or public.mrpst_can_manage_academics()));
