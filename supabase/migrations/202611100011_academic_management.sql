-- Academic terms, course catalogue, enrolment, class sessions and grades.
create table if not exists public.academic_terms(
 id uuid primary key default gen_random_uuid(),term_code text not null unique check(length(trim(term_code))>0),
 name text not null check(length(trim(name))>0),academic_year integer not null check(academic_year between 2000 and 2200),
 start_date date,end_date date,status text not null default 'planned' check(status in ('planned','active','completed')),
 created_by uuid not null default auth.uid() references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(start_date is null or end_date is null or end_date>=start_date)
);
create table if not exists public.academic_courses(
 id uuid primary key default gen_random_uuid(),course_code text not null unique check(length(trim(course_code))>0),
 title text not null check(length(trim(title))>0),title_my text,description text,credits numeric(5,2) not null default 3 check(credits>=0),
 department text,level text,is_active boolean not null default true,
 created_by uuid not null default auth.uid() references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.academic_enrollments(
 id uuid primary key default gen_random_uuid(),student_id uuid not null references public.students(id) on delete restrict,
 course_id uuid not null references public.academic_courses(id) on delete restrict,term_id uuid not null references public.academic_terms(id) on delete restrict,
 enrollment_status text not null default 'enrolled' check(enrollment_status in ('enrolled','completed','withdrawn')),
 created_by uuid not null default auth.uid() references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(student_id,course_id,term_id)
);
create index if not exists academic_enrollments_term_idx on public.academic_enrollments(term_id,enrollment_status);
create table if not exists public.academic_class_sessions(
 id uuid primary key default gen_random_uuid(),course_id uuid not null references public.academic_courses(id) on delete cascade,
 term_id uuid not null references public.academic_terms(id) on delete cascade,class_date date not null,start_time time,end_time time,location text,instructor text,topic text,
 created_by uuid not null default auth.uid() references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(end_time is null or start_time is null or end_time>start_time)
);
create index if not exists academic_class_sessions_date_idx on public.academic_class_sessions(class_date,start_time);
create table if not exists public.academic_grades(
 id uuid primary key default gen_random_uuid(),student_id uuid not null references public.students(id) on delete restrict,
 course_id uuid not null references public.academic_courses(id) on delete restrict,term_id uuid not null references public.academic_terms(id) on delete restrict,
 score numeric(5,2) check(score is null or score between 0 and 100),grade text,remarks text,
 entered_by uuid not null default auth.uid() references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(student_id,course_id,term_id)
);
create index if not exists academic_grades_student_idx on public.academic_grades(student_id,term_id);
create or replace function public.mrpst_can_manage_academics()
returns boolean language sql stable security definer set search_path=public as $$
 select public.mrpst_is_active_user(auth.uid()) and exists(select 1 from public.user_roles where user_id=auth.uid() and role in ('super_admin','administrator','academic_officer'));
$$;
create or replace function public.mrpst_can_view_academics()
returns boolean language sql stable security definer set search_path=public as $$
 select public.mrpst_is_active_user(auth.uid()) and exists(select 1 from public.user_roles where user_id=auth.uid() and role in ('super_admin','administrator','academic_officer','faculty','student_officer'));
$$;
alter table public.academic_terms enable row level security;
alter table public.academic_courses enable row level security;
alter table public.academic_enrollments enable row level security;
alter table public.academic_class_sessions enable row level security;
alter table public.academic_grades enable row level security;
create policy "Academic staff read terms" on public.academic_terms for select to authenticated using(public.mrpst_can_view_academics());
create policy "Academic managers insert terms" on public.academic_terms for insert to authenticated with check(public.mrpst_can_manage_academics() and created_by=auth.uid());
create policy "Academic managers update terms" on public.academic_terms for update to authenticated using(public.mrpst_can_manage_academics()) with check(public.mrpst_can_manage_academics());
create policy "Academic managers delete terms" on public.academic_terms for delete to authenticated using(public.mrpst_can_manage_academics());
create policy "Academic staff read courses" on public.academic_courses for select to authenticated using(public.mrpst_can_view_academics());
create policy "Academic managers insert courses" on public.academic_courses for insert to authenticated with check(public.mrpst_can_manage_academics() and created_by=auth.uid());
create policy "Academic managers update courses" on public.academic_courses for update to authenticated using(public.mrpst_can_manage_academics()) with check(public.mrpst_can_manage_academics());
create policy "Academic managers delete courses" on public.academic_courses for delete to authenticated using(public.mrpst_can_manage_academics());
create policy "Academic staff read enrolments" on public.academic_enrollments for select to authenticated using(public.mrpst_can_view_academics());
create policy "Academic managers insert enrolments" on public.academic_enrollments for insert to authenticated with check(public.mrpst_can_manage_academics() and created_by=auth.uid());
create policy "Academic managers update enrolments" on public.academic_enrollments for update to authenticated using(public.mrpst_can_manage_academics()) with check(public.mrpst_can_manage_academics());
create policy "Academic managers delete enrolments" on public.academic_enrollments for delete to authenticated using(public.mrpst_can_manage_academics());
create policy "Academic staff read sessions" on public.academic_class_sessions for select to authenticated using(public.mrpst_can_view_academics());
create policy "Academic managers insert sessions" on public.academic_class_sessions for insert to authenticated with check(public.mrpst_can_manage_academics() and created_by=auth.uid());
create policy "Academic managers update sessions" on public.academic_class_sessions for update to authenticated using(public.mrpst_can_manage_academics()) with check(public.mrpst_can_manage_academics());
create policy "Academic managers delete sessions" on public.academic_class_sessions for delete to authenticated using(public.mrpst_can_manage_academics());
create policy "Academic staff read grades" on public.academic_grades for select to authenticated using(public.mrpst_can_view_academics());
create policy "Academic managers insert grades" on public.academic_grades for insert to authenticated with check(public.mrpst_can_manage_academics() and entered_by=auth.uid());
create policy "Academic managers update grades" on public.academic_grades for update to authenticated using(public.mrpst_can_manage_academics()) with check(public.mrpst_can_manage_academics());
create policy "Academic managers delete grades" on public.academic_grades for delete to authenticated using(public.mrpst_can_manage_academics());
grant select,insert,update,delete on public.academic_terms,public.academic_courses,public.academic_enrollments,public.academic_class_sessions,public.academic_grades to authenticated;
grant execute on function public.mrpst_can_manage_academics() to authenticated;
grant execute on function public.mrpst_can_view_academics() to authenticated;
create or replace function public.mrpst_academics_set_updated_at()
returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now();return new;end; $$;
drop trigger if exists academic_terms_updated_at on public.academic_terms;
create trigger academic_terms_updated_at before update on public.academic_terms for each row execute function public.mrpst_academics_set_updated_at();
drop trigger if exists academic_courses_updated_at on public.academic_courses;
create trigger academic_courses_updated_at before update on public.academic_courses for each row execute function public.mrpst_academics_set_updated_at();
drop trigger if exists academic_enrollments_updated_at on public.academic_enrollments;
create trigger academic_enrollments_updated_at before update on public.academic_enrollments for each row execute function public.mrpst_academics_set_updated_at();
drop trigger if exists academic_class_sessions_updated_at on public.academic_class_sessions;
create trigger academic_class_sessions_updated_at before update on public.academic_class_sessions for each row execute function public.mrpst_academics_set_updated_at();
drop trigger if exists academic_grades_updated_at on public.academic_grades;
create trigger academic_grades_updated_at before update on public.academic_grades for each row execute function public.mrpst_academics_set_updated_at();
