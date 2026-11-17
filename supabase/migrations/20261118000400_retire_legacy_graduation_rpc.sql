-- Retire the legacy direct graduation endpoint. Graduation is now confirmed only
-- from an approved annual promotion batch through the item-scoped RPC.
revoke all on function public.mrpst_confirm_student_graduation(uuid,integer,smallint,date,text,text) from public;
revoke all on function public.mrpst_confirm_student_graduation(uuid,integer,smallint,date,text,text) from authenticated;
