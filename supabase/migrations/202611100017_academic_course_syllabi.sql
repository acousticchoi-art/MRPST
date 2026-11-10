-- Per-course, per-term syllabus with a structured weekly teaching plan.
create table if not exists public.academic_course_syllabi(
 id uuid primary key default gen_random_uuid(),
 course_id uuid not null references public.academic_courses(id) on delete cascade,
 term_id uuid not null references public.academic_terms(id) on delete cascade,
 instructor text,
 objectives text,
 learning_outcomes text,
 teaching_methods text,
 textbooks text,
 assessment_methods text,
 weekly_topics jsonb not null default '[]'::jsonb check(jsonb_typeof(weekly_topics)='array'),
 created_by uuid not null default auth.uid() references auth.users(id),
 updated_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(course_id,term_id)
);
create index if not exists academic_course_syllabi_term_idx
 on public.academic_course_syllabi(term_id,course_id);
alter table public.academic_course_syllabi enable row level security;
create policy "Academic staff read syllabi" on public.academic_course_syllabi
 for select to authenticated using(public.mrpst_can_view_academics());
create policy "Academic managers insert syllabi" on public.academic_course_syllabi
 for insert to authenticated with check(public.mrpst_can_manage_academics() and created_by=auth.uid());
create policy "Academic managers update syllabi" on public.academic_course_syllabi
 for update to authenticated using(public.mrpst_can_manage_academics())
 with check(public.mrpst_can_manage_academics());
create policy "Academic managers delete syllabi" on public.academic_course_syllabi
 for delete to authenticated using(public.mrpst_can_manage_academics());
grant select,insert,update,delete on public.academic_course_syllabi to authenticated;
drop trigger if exists academic_course_syllabi_updated_at on public.academic_course_syllabi;
create trigger academic_course_syllabi_updated_at
 before update on public.academic_course_syllabi
 for each row execute function public.mrpst_academics_set_updated_at();
