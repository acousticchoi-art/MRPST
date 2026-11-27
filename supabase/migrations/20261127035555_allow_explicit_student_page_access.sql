CREATE OR REPLACE FUNCTION mrpst_private.can_delegate_staff_page(target_id uuid, target_module text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select coalesce(mrpst_private.can_edit_ordinary_account(target_id)
   and exists(select 1 from public.user_profiles p where p.user_id=target_id)
   and target_module in ('finance','students','academics','facilities','library','meetings','website')
   and public.mrpst_can_manage_module(auth.uid(),target_module),false)
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
    when exists(select 1 from public.user_roles r where r.user_id=target_user and r.role='student')
      and not exists(select 1 from public.user_roles r where r.user_id=target_user and r.role<>'student') then false
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

alter policy "Administrators assign allowed staff page permissions" on public.user_module_permissions with check (mrpst_private.can_delegate_staff_page(user_id,module_key) and assigned_by=(select auth.uid()) and (can_view or not can_manage) and (not can_manage or exists(select 1 from public.user_roles r where r.user_id=user_module_permissions.user_id and r.role<>'student')));
alter policy "Administrators edit allowed staff page permissions" on public.user_module_permissions with check (mrpst_private.can_delegate_staff_page(user_id,module_key) and assigned_by=(select auth.uid()) and (can_view or not can_manage) and (not can_manage or exists(select 1 from public.user_roles r where r.user_id=user_module_permissions.user_id and r.role<>'student')));
