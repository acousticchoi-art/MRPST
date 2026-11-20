-- Distinguish program-major courses from shared general-education courses.
alter table public.academic_courses
  add column if not exists course_kind text not null default 'major'
  check (course_kind in ('major','general'));

create index if not exists academic_courses_kind_department_idx
  on public.academic_courses(course_kind,department_id,is_active);

comment on column public.academic_courses.course_kind is
  'major = programme-specific course, general = shared general-education course';
