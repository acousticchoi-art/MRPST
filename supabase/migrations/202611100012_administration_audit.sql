grant update (full_name, preferred_locale, is_active) on public.user_profiles to authenticated;
create table if not exists public.admin_audit_log(
 id uuid primary key default gen_random_uuid(),actor_id uuid references auth.users(id) on delete set null,
 entity_type text not null check(entity_type in ('user_profile','user_role','department')),
 entity_id text not null,action text not null check(action in ('insert','update','delete')),
 details jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log(created_at desc);
alter table public.admin_audit_log enable row level security;
create policy "Super admins read admin audit log" on public.admin_audit_log for select to authenticated using(public.mrpst_has_role(auth.uid(),'super_admin') and public.mrpst_is_active_user(auth.uid()));
grant select on public.admin_audit_log to authenticated;
create or replace function public.mrpst_write_admin_audit()
returns trigger language plpgsql security definer set search_path=public as $$
declare b jsonb;a jsonb;target text;event text;
begin
 if tg_op='INSERT' then b:='{}'::jsonb;a:=to_jsonb(new);event:='insert';
 elsif tg_op='UPDATE' then b:=to_jsonb(old);a:=to_jsonb(new);event:='update';
 else b:=to_jsonb(old);a:='{}'::jsonb;event:='delete';end if;
 if tg_table_name='user_profiles' then target:=coalesce(a->>'user_id',b->>'user_id');a:=a-'created_at'-'updated_at';b:=b-'created_at'-'updated_at';
 else target:=coalesce(a->>'id',b->>'id');end if;
 insert into public.admin_audit_log(actor_id,entity_type,entity_id,action,details)
 values(auth.uid(),case tg_table_name when 'user_profiles' then 'user_profile' when 'user_roles' then 'user_role' else 'department' end,target,event,jsonb_build_object('before',b,'after',a));
 if tg_op='DELETE' then return old;else return new;end if;
end;$$;
drop trigger if exists admin_audit_user_profiles on public.user_profiles;
create trigger admin_audit_user_profiles after insert or update or delete on public.user_profiles for each row execute function public.mrpst_write_admin_audit();
drop trigger if exists admin_audit_user_roles on public.user_roles;
create trigger admin_audit_user_roles after insert or update or delete on public.user_roles for each row execute function public.mrpst_write_admin_audit();
drop trigger if exists admin_audit_departments on public.departments;
create trigger admin_audit_departments after insert or update or delete on public.departments for each row execute function public.mrpst_write_admin_audit();