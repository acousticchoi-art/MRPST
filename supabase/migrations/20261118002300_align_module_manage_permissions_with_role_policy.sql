-- Keep database module access and management checks aligned with the application role policy.
-- Faculty may view academic records, but only academic officers may manage them by default.
-- Explicit per-user can_manage=true grants remain supported for delegated access.

create or replace function public.mrpst_can_access_module(target_user uuid, target_module text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select case
    when not public.mrpst_is_active_user(target_user) then false
    when public.mrpst_has_role(target_user,'super_admin'::public.mrpst_role) then true
    when target_module='administration' then false
    when public.mrpst_has_role(target_user,'administrator'::public.mrpst_role) then true
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
$function$;

create or replace function public.mrpst_can_manage_module(target_user uuid, target_module text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select case
    when not public.mrpst_is_active_user(target_user) then false
    when public.mrpst_has_role(target_user,'super_admin'::public.mrpst_role) then true
    when target_module='administration' then false
    when public.mrpst_has_role(target_user,'administrator'::public.mrpst_role) then true
    when not public.mrpst_can_access_module(target_user,target_module) then false
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
$function$;
