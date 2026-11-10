-- Student management permissions and academic history.
create or replace function public.mrpst_can_manage_students()
returns boolean language sql stable security definer set search_path=public as $$
 select public.mrpst_is_active_user(auth.uid()) and exists(
  select 1 from public.user_roles where user_id=auth.uid()
  and role in ('super_admin','administrator','student_officer','academic_officer','finance_officer')
 );
$$;
create or replace function public.mrpst_can_view_student_records()
returns boolean language sql stable security definer set search_path=public as $$
 select public.mrpst_is_active_user(auth.uid()) and exists(
  select 1 from public.user_roles where user_id=auth.uid()
  and role in ('super_admin','administrator','student_officer','academic_officer','finance_officer','faculty')
 );
$$;

drop policy if exists "Finance read students" on public.students;
drop policy if exists "Finance insert students" on public.students;
drop policy if exists "Finance update students" on public.students;
drop policy if exists "Finance delete students" on public.students;
create policy "Student managers read students" on public.students for select to authenticated using(public.mrpst_can_view_student_records());
create policy "Student managers insert students" on public.students for insert to authenticated with check(public.mrpst_can_manage_students() and created_by=auth.uid());
create policy "Student managers update students" on public.students for update to authenticated using(public.mrpst_can_manage_students()) with check(public.mrpst_can_manage_students());
create policy "Student managers delete students" on public.students for delete to authenticated using(public.mrpst_can_manage_students());

create table if not exists public.student_academic_records(
 id uuid primary key default gen_random_uuid(),
 student_id uuid not null references public.students(id) on delete cascade,
 academic_year integer not null check(academic_year between 2000 and 2200),
 term text not null check(length(trim(term)) between 1 and 40),
 course_code text,
 course_name text not null check(length(trim(course_name))>0),
 credits numeric(6,2) check(credits is null or credits>=0),
 score numeric(5,2) check(score is null or (score>=0 and score<=100)),
 grade text,
 remarks text,
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(student_id,academic_year,term,course_name)
);
create index if not exists student_academic_records_student_year_idx on public.student_academic_records(student_id,academic_year desc,term);
create index if not exists student_academic_records_course_idx on public.student_academic_records(course_code) where course_code is not null;
alter table public.student_academic_records enable row level security;
create policy "Academic staff read student records" on public.student_academic_records for select to authenticated using(public.mrpst_can_view_student_records());
create policy "Academic managers insert student records" on public.student_academic_records for insert to authenticated with check(public.mrpst_can_manage_students() and created_by=auth.uid());
create policy "Academic managers update student records" on public.student_academic_records for update to authenticated using(public.mrpst_can_manage_students()) with check(public.mrpst_can_manage_students());
create policy "Academic managers delete student records" on public.student_academic_records for delete to authenticated using(public.mrpst_can_manage_students());
grant select,insert,update,delete on public.student_academic_records to authenticated;
grant execute on function public.mrpst_can_manage_students() to authenticated;
grant execute on function public.mrpst_can_view_student_records() to authenticated;

create or replace function public.mrpst_set_updated_at()
returns trigger language plpgsql set search_path=public as $$
begin new.updated_at=now(); return new; end;
$$;
drop trigger if exists students_set_updated_at on public.students;
create trigger students_set_updated_at before update on public.students for each row execute function public.mrpst_set_updated_at();
drop trigger if exists student_academic_records_set_updated_at on public.student_academic_records;
create trigger student_academic_records_set_updated_at before update on public.student_academic_records for each row execute function public.mrpst_set_updated_at();
