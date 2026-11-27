create or replace function mrpst_private.can_delegate_staff_page(target_id uuid, target_module text)
returns boolean language sql stable security definer set search_path to ''
as $function$
 select coalesce(mrpst_private.can_edit_ordinary_account(target_id)
   and exists(select 1 from public.user_profiles p where p.user_id=target_id)
   and not exists(select 1 from public.user_roles r where r.user_id=target_id and r.role='student')
   and target_module in ('finance','students','academics','facilities','library','meetings','website')
   and public.mrpst_can_manage_module(auth.uid(),target_module),false)
$function$;
revoke all on function mrpst_private.can_delegate_staff_page(uuid,text) from public,anon,authenticated;
grant execute on function mrpst_private.can_delegate_staff_page(uuid,text) to authenticated;
create policy "Administrators read ordinary staff page permissions" on public.user_module_permissions for select to authenticated
using (mrpst_private.can_edit_ordinary_account(user_id));
create policy "Administrators assign allowed staff page permissions" on public.user_module_permissions for insert to authenticated
with check (mrpst_private.can_delegate_staff_page(user_id,module_key) and assigned_by=(select auth.uid()) and (can_view or not can_manage));
create policy "Administrators edit allowed staff page permissions" on public.user_module_permissions for update to authenticated
using (mrpst_private.can_delegate_staff_page(user_id,module_key))
with check (mrpst_private.can_delegate_staff_page(user_id,module_key) and assigned_by=(select auth.uid()) and (can_view or not can_manage));
