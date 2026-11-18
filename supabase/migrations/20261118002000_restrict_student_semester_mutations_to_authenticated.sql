-- These student academic mutation RPCs are authenticated staff workflows.
-- The functions already check permissions, but anonymous EXECUTE is unnecessary.
revoke all on function public.mrpst_advance_student_semester(uuid[],integer,smallint) from public;
grant execute on function public.mrpst_advance_student_semester(uuid[],integer,smallint) to authenticated;
revoke all on function public.mrpst_complete_student_semester(uuid,integer,smallint) from public;
grant execute on function public.mrpst_complete_student_semester(uuid,integer,smallint) to authenticated;