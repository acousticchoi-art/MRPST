alter table public.academic_courses
  alter column credits drop not null,
  alter column credits drop default;
