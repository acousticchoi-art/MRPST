-- Pending member registration and super-admin approval workflow.
create table if not exists public.registration_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  affiliation text not null default '',
  email text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);
create index if not exists registration_requests_status_created_idx on public.registration_requests(status, created_at desc);
alter table public.registration_requests enable row level security;
drop policy if exists "Super admins view registration requests" on public.registration_requests;
create policy "Super admins view registration requests" on public.registration_requests
for select to authenticated using (public.mrpst_is_active_user(auth.uid()) and public.mrpst_has_role(auth.uid(),'super_admin'));
grant select on public.registration_requests to authenticated;

create or replace function public.mrpst_capture_registration_request()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  insert into public.registration_requests(user_id,full_name,affiliation,email)
  values(new.id,coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),'Name not provided'),
    coalesce(trim(new.raw_user_meta_data->>'affiliation'),''),coalesce(new.email,''))
  on conflict(user_id) do update set full_name=excluded.full_name, affiliation=excluded.affiliation, email=excluded.email;
  return new;
end;
$$;
drop trigger if exists on_auth_user_registration_request on auth.users;
create trigger on_auth_user_registration_request after insert on auth.users
for each row execute function public.mrpst_capture_registration_request();

create or replace function public.mrpst_review_registration(target_request uuid, decision text)
returns void language plpgsql security definer set search_path=public
as $$
declare req public.registration_requests%rowtype;
begin
  if not public.mrpst_is_active_user(auth.uid()) or not public.mrpst_has_role(auth.uid(),'super_admin') then
    raise exception 'Super administrator permission required';
  end if;
  if decision not in ('approved','rejected') then raise exception 'Invalid decision'; end if;
  select * into req from public.registration_requests where id=target_request for update;
  if not found then raise exception 'Registration request not found'; end if;
  if req.status <> 'pending' then raise exception 'This request has already been reviewed'; end if;
  if decision='approved' then
    insert into public.user_profiles(user_id,full_name,preferred_locale,is_active)
    values(req.user_id,req.full_name,'en',true)
    on conflict(user_id) do update set full_name=excluded.full_name,is_active=true,updated_at=now();
    insert into public.user_roles(user_id,role,assigned_by)
    values(req.user_id,'staff',auth.uid())
    on conflict(user_id,role,department_id) do nothing;
  end if;
  update public.registration_requests set status=decision, reviewed_at=now(), reviewed_by=auth.uid()
  where id=target_request;
end;
$$;
revoke all on function public.mrpst_review_registration(uuid,text) from public;
grant execute on function public.mrpst_review_registration(uuid,text) to authenticated;
