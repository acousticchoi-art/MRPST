-- Block direct/public Supabase Auth signups; only the trusted admin function may create accounts.
create or replace function public.mrpst_require_admin_provisioned_auth_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if coalesce(new.raw_app_meta_data->>'mrpst_admin_provisioned','false') <> 'true' then
    raise exception 'MRPST accounts must be created by an administrator';
  end if;
  return new;
end;
$$;
drop trigger if exists mrpst_require_admin_provisioned_auth_user on auth.users;
create trigger mrpst_require_admin_provisioned_auth_user
before insert on auth.users
for each row execute function public.mrpst_require_admin_provisioned_auth_user();
revoke all on function public.mrpst_require_admin_provisioned_auth_user() from public, anon, authenticated;
