-- MRPST initial access-control schema
-- Apply this migration in the Supabase SQL Editor before inviting administrators.
create extension if not exists pgcrypto;

do $$ begin
  create type public.mrpst_role as enum (
    'super_admin','administrator','finance_officer','academic_officer',
    'student_officer','librarian','facility_manager','faculty','staff'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_en text not null,
  name_my text,
  name_ko text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  preferred_locale text not null default 'en' check (preferred_locale in ('en','my','ko')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.mrpst_role not null,
  department_id uuid references public.departments(id) on delete set null,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(user_id, role, department_id)
);

create index if not exists user_roles_user_id_idx on public.user_roles(user_id);
create index if not exists user_roles_department_id_idx on public.user_roles(department_id);

create or replace function public.mrpst_has_role(target_user uuid, target_role public.mrpst_role)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = target_user and role = target_role
  );
$$;

create or replace function public.mrpst_is_active_user(target_user uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles
    where user_id = target_user and is_active = true
  );
$$;

alter table public.departments enable row level security;
alter table public.user_profiles enable row level security;
alter table public.user_roles enable row level security;

drop policy if exists "Authenticated users can view active departments" on public.departments;
create policy "Authenticated users can view active departments"
on public.departments for select to authenticated
using (is_active = true or public.mrpst_has_role(auth.uid(),'super_admin'));

drop policy if exists "Super admins manage departments" on public.departments;
create policy "Super admins manage departments"
on public.departments for all to authenticated
using (public.mrpst_has_role(auth.uid(),'super_admin'))
with check (public.mrpst_has_role(auth.uid(),'super_admin'));

drop policy if exists "Users can view own profile" on public.user_profiles;
create policy "Users can view own profile"
on public.user_profiles for select to authenticated
using (user_id = auth.uid() or public.mrpst_has_role(auth.uid(),'super_admin'));

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile"
on public.user_profiles for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Super admins manage profiles" on public.user_profiles;
create policy "Super admins manage profiles"
on public.user_profiles for all to authenticated
using (public.mrpst_has_role(auth.uid(),'super_admin'))
with check (public.mrpst_has_role(auth.uid(),'super_admin'));

drop policy if exists "Users can view own roles" on public.user_roles;
create policy "Users can view own roles"
on public.user_roles for select to authenticated
using (user_id = auth.uid() or public.mrpst_has_role(auth.uid(),'super_admin'));

drop policy if exists "Super admins assign roles" on public.user_roles;
create policy "Super admins assign roles"
on public.user_roles for all to authenticated
using (public.mrpst_has_role(auth.uid(),'super_admin'))
with check (public.mrpst_has_role(auth.uid(),'super_admin'));

grant usage on schema public to authenticated;
grant select on public.departments to authenticated;
grant select, update on public.user_profiles to authenticated;
grant select on public.user_roles to authenticated;
grant execute on function public.mrpst_has_role(uuid,public.mrpst_role) to authenticated;
grant execute on function public.mrpst_is_active_user(uuid) to authenticated;

-- Bootstrap the first super administrator manually after creating their Auth user:
-- insert into public.user_profiles(user_id, full_name) values ('AUTH-USER-UUID','Name');
-- insert into public.user_roles(user_id, role) values ('AUTH-USER-UUID','super_admin');
