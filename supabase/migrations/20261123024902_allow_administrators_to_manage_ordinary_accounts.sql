create schema if not exists mrpst_private;

create function mrpst_private.can_edit_ordinary_account(target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_id <> auth.uid()
    and public.mrpst_is_active_user(auth.uid())
    and public.mrpst_has_role(auth.uid(), 'administrator')
    and not exists (
      select 1 from public.user_roles
      where user_id = target_id and role in ('super_admin', 'administrator')
    );
$$;

revoke all on function mrpst_private.can_edit_ordinary_account(uuid) from public;
grant execute on function mrpst_private.can_edit_ordinary_account(uuid) to authenticated;

create policy "Administrators read ordinary account profiles"
on public.user_profiles for select to authenticated
using (mrpst_private.can_edit_ordinary_account(user_id));

create policy "Administrators edit ordinary account profiles"
on public.user_profiles for update to authenticated
using (mrpst_private.can_edit_ordinary_account(user_id))
with check (mrpst_private.can_edit_ordinary_account(user_id));

create policy "Administrators read ordinary account roles"
on public.user_roles for select to authenticated
using (mrpst_private.can_edit_ordinary_account(user_id));

create policy "Administrators assign ordinary staff roles"
on public.user_roles for insert to authenticated
with check (
  mrpst_private.can_edit_ordinary_account(user_id)
  and role in ('finance_officer', 'academic_officer', 'student_officer', 'librarian', 'facility_manager', 'faculty', 'staff')
  and assigned_by = auth.uid()
);

create policy "Administrators remove ordinary staff roles"
on public.user_roles for delete to authenticated
using (
  mrpst_private.can_edit_ordinary_account(user_id)
  and role in ('finance_officer', 'academic_officer', 'student_officer', 'librarian', 'facility_manager', 'faculty', 'staff')
);
