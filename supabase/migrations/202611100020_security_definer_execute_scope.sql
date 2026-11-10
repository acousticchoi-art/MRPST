-- Restrict SECURITY DEFINER RPCs and helper functions to signed-in users.
-- Trigger-only functions remain callable only through their triggers.
do $$
declare f record;
begin
 for f in
  select p.oid, n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.prosecdef
 loop
  execute format('revoke execute on function %I.%I(%s) from public, anon, authenticated',f.nspname,f.proname,f.args);
  if f.proname not in ('mrpst_guard_last_super_admin','mrpst_write_admin_audit') then
   execute format('grant execute on function %I.%I(%s) to authenticated',f.nspname,f.proname,f.args);
  end if;
 end loop;
end;
$$;
