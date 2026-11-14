-- Security hardening for administration and active-account enforcement.
-- A signed-in user may edit only their own non-privileged profile fields.
revoke update (is_active) on public.user_profiles from authenticated;

-- Restore active-account checks on privileged administration policies.
drop policy if exists "Super admins manage departments" on public.departments;
create policy "Super admins manage departments"
on public.departments for all to authenticated
using (public.mrpst_is_active_user(auth.uid()) and public.mrpst_has_role(auth.uid(),'super_admin'))
with check (public.mrpst_is_active_user(auth.uid()) and public.mrpst_has_role(auth.uid(),'super_admin'));

drop policy if exists "Super admins manage profiles" on public.user_profiles;
create policy "Super admins manage profiles"
on public.user_profiles for all to authenticated
using (public.mrpst_is_active_user(auth.uid()) and public.mrpst_has_role(auth.uid(),'super_admin'))
with check (public.mrpst_is_active_user(auth.uid()) and public.mrpst_has_role(auth.uid(),'super_admin'));

drop policy if exists "Super admins assign roles" on public.user_roles;
create policy "Super admins assign roles"
on public.user_roles for all to authenticated
using (public.mrpst_is_active_user(auth.uid()) and public.mrpst_has_role(auth.uid(),'super_admin'))
with check (public.mrpst_is_active_user(auth.uid()) and public.mrpst_has_role(auth.uid(),'super_admin'));

-- Account activation/deactivation is a privileged database operation.
create or replace function public.mrpst_set_user_active(target_user uuid, make_active boolean)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare target_is_super_admin boolean;
begin
 if not public.mrpst_is_active_user(auth.uid()) or not public.mrpst_has_role(auth.uid(),'super_admin') then
   raise exception 'Super administrator permission required';
 end if;
 if target_user is null or make_active is null then raise exception 'Target user and status are required'; end if;
 if not exists(select 1 from public.user_profiles where user_id=target_user) then
   raise exception 'User profile not found';
 end if;
 if target_user=auth.uid() and not make_active then
   raise exception 'You cannot deactivate your own account';
 end if;
 select exists(select 1 from public.user_roles where user_id=target_user and role='super_admin') into target_is_super_admin;
 if target_is_super_admin and not make_active then
   if (select count(*) from public.user_roles r join public.user_profiles p on p.user_id=r.user_id where r.role='super_admin' and p.is_active and r.user_id<>target_user)<=0 then
     raise exception 'At least one active super administrator must remain';
   end if;
 end if;
 update public.user_profiles set is_active=make_active,updated_at=now() where user_id=target_user;
end;
$$;
revoke all on function public.mrpst_set_user_active(uuid,boolean) from public;
grant execute on function public.mrpst_set_user_active(uuid,boolean) to authenticated;

-- Prevent removing or demoting the final active super administrator.
create or replace function public.mrpst_guard_last_super_admin()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare remaining integer;
begin
 if old.role='super_admin'
    and public.mrpst_is_active_user(old.user_id)
    and (tg_op='DELETE' or new.role<>'super_admin' or new.user_id<>old.user_id) then
   select count(*) into remaining
   from public.user_roles r
   join public.user_profiles p on p.user_id=r.user_id
   where r.role='super_admin' and p.is_active and r.user_id<>old.user_id;
   if remaining=0 then raise exception 'At least one active super administrator must remain'; end if;
 end if;
 if tg_op='DELETE' then return old; else return new; end if;
end;
$$;
drop trigger if exists guard_last_super_admin on public.user_roles;
create trigger guard_last_super_admin before update of role,user_id or delete on public.user_roles
for each row execute function public.mrpst_guard_last_super_admin();

-- Meeting deletion previously checked the role but not the active profile.
drop policy if exists "Meeting admins delete meetings" on public.meetings;
create policy "Meeting admins delete meetings"
on public.meetings for delete to authenticated
using (
 public.mrpst_is_active_user(auth.uid())
 and (public.mrpst_has_role(auth.uid(),'super_admin') or public.mrpst_has_role(auth.uid(),'administrator'))
);
