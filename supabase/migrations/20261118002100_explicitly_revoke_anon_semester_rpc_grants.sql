-- Explicitly remove the pre-existing direct anon grants as well as PUBLIC execution.
revoke execute on function public.mrpst_advance_student_semester(uuid[],integer,smallint) from anon, public;
grant execute on function public.mrpst_advance_student_semester(uuid[],integer,smallint) to authenticated;
revoke execute on function public.mrpst_complete_student_semester(uuid,integer,smallint) from anon, public;
grant execute on function public.mrpst_complete_student_semester(uuid,integer,smallint) to authenticated;