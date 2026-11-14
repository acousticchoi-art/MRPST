-- Grade entry is restricted to active administrative roles.
-- Existing academic staff read policy remains unchanged.
drop policy if exists "Academic managers insert grades" on public.academic_grades;
drop policy if exists "Academic managers update grades" on public.academic_grades;
drop policy if exists "Academic managers delete grades" on public.academic_grades;

create policy "Grade administrators insert grades"
on public.academic_grades
for insert
to authenticated
with check (
  public.mrpst_is_active_user((select auth.uid()))
  and (
    public.mrpst_has_role((select auth.uid()), 'super_admin'::public.mrpst_role)
    or public.mrpst_has_role((select auth.uid()), 'administrator'::public.mrpst_role)
    or public.mrpst_has_role((select auth.uid()), 'academic_officer'::public.mrpst_role)
  )
  and entered_by = (select auth.uid())
);

create policy "Grade administrators update grades"
on public.academic_grades
for update
to authenticated
using (
  public.mrpst_is_active_user((select auth.uid()))
  and (
    public.mrpst_has_role((select auth.uid()), 'super_admin'::public.mrpst_role)
    or public.mrpst_has_role((select auth.uid()), 'administrator'::public.mrpst_role)
    or public.mrpst_has_role((select auth.uid()), 'academic_officer'::public.mrpst_role)
  )
)
with check (
  public.mrpst_is_active_user((select auth.uid()))
  and (
    public.mrpst_has_role((select auth.uid()), 'super_admin'::public.mrpst_role)
    or public.mrpst_has_role((select auth.uid()), 'administrator'::public.mrpst_role)
    or public.mrpst_has_role((select auth.uid()), 'academic_officer'::public.mrpst_role)
  )
);

create policy "Grade administrators delete grades"
on public.academic_grades
for delete
to authenticated
using (
  public.mrpst_is_active_user((select auth.uid()))
  and (
    public.mrpst_has_role((select auth.uid()), 'super_admin'::public.mrpst_role)
    or public.mrpst_has_role((select auth.uid()), 'administrator'::public.mrpst_role)
    or public.mrpst_has_role((select auth.uid()), 'academic_officer'::public.mrpst_role)
  )
);

create index if not exists academic_grades_term_student_course_idx
on public.academic_grades (term_id, student_id, course_id);

create index if not exists academic_enrollments_term_course_student_idx
on public.academic_enrollments (term_id, course_id, student_id);
