-- Faculty directory and per-term teaching assignments/workload.
create table if not exists public.academic_instructors(
 id uuid primary key default gen_random_uuid(),
 full_name text not null check(length(trim(full_name))>0),
 department_id uuid references public.departments(id) on delete set null,
 title text,
 email text,
 phone text,
 employment_type text not null default 'full_time' check(employment_type in ('full_time','part_time','adjunct','visiting')),
 is_active boolean not null default true,
 notes text,
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists academic_instructors_department_idx on public.academic_instructors(department_id,is_active,full_name);
create table if not exists public.academic_teaching_assignments(
 id uuid primary key default gen_random_uuid(),
 term_id uuid not null references public.academic_terms(id) on delete cascade,
 course_id uuid not null references public.academic_courses(id) on delete restrict,
 instructor_id uuid not null references public.academic_instructors(id) on delete restrict,
 weekly_hours numeric(5,2) not null default 0 check(weekly_hours between 0 and 80),
 assignment_role text not null default 'primary' check(assignment_role in ('primary','assistant')),
 notes text,
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(term_id,course_id,instructor_id)
);
create index if not exists academic_teaching_assignments_term_idx on public.academic_teaching_assignments(term_id,instructor_id);
alter table public.academic_instructors enable row level security;
alter table public.academic_teaching_assignments enable row level security;
create policy "Academic staff read instructors" on public.academic_instructors for select to authenticated using(public.mrpst_can_view_academics());
create policy "Academic managers insert instructors" on public.academic_instructors for insert to authenticated with check(public.mrpst_can_manage_academics() and created_by=auth.uid());
create policy "Academic managers update instructors" on public.academic_instructors for update to authenticated using(public.mrpst_can_manage_academics()) with check(public.mrpst_can_manage_academics());
create policy "Academic managers delete instructors" on public.academic_instructors for delete to authenticated using(public.mrpst_can_manage_academics());
create policy "Academic staff read teaching assignments" on public.academic_teaching_assignments for select to authenticated using(public.mrpst_can_view_academics());
create policy "Academic managers insert teaching assignments" on public.academic_teaching_assignments for insert to authenticated with check(public.mrpst_can_manage_academics() and created_by=auth.uid());
create policy "Academic managers update teaching assignments" on public.academic_teaching_assignments for update to authenticated using(public.mrpst_can_manage_academics()) with check(public.mrpst_can_manage_academics());
create policy "Academic managers delete teaching assignments" on public.academic_teaching_assignments for delete to authenticated using(public.mrpst_can_manage_academics());
grant select,insert,update,delete on public.academic_instructors,public.academic_teaching_assignments to authenticated;
drop trigger if exists academic_instructors_updated_at on public.academic_instructors;
create trigger academic_instructors_updated_at before update on public.academic_instructors for each row execute function public.mrpst_academics_set_updated_at();
drop trigger if exists academic_teaching_assignments_updated_at on public.academic_teaching_assignments;
create trigger academic_teaching_assignments_updated_at before update on public.academic_teaching_assignments for each row execute function public.mrpst_academics_set_updated_at();
