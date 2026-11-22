-- One student has exactly one library membership. Student login creation uses
-- the student number as the library member number and keeps this link in sync.
create unique index if not exists library_members_one_per_student_idx
  on public.library_members(student_id)
  where student_id is not null;
