-- Link academic courses to the shared department master data.
-- Keep the legacy text column for compatibility with existing course records.
alter table public.academic_courses
  add column if not exists department_id uuid
  references public.departments(id) on delete set null;

create index if not exists academic_courses_department_id_idx
  on public.academic_courses(department_id);

comment on column public.academic_courses.department_id is
  'Canonical department reference; department text remains for legacy display compatibility.';
