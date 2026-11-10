-- Editing is handled through the existing timetable RLS policies.
-- Copy a department's complete weekly timetable to another term atomically.
create or replace function public.mrpst_copy_academic_timetable(
 p_source_term_id uuid,
 p_target_term_id uuid,
 p_department_id uuid
)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare copied_count integer;
begin
 if not public.mrpst_can_manage_academics() then
  raise exception 'Academic management permission required';
 end if;
 if p_source_term_id is null or p_target_term_id is null or p_department_id is null then
  raise exception 'Source term, target term and department are required';
 end if;
 if p_source_term_id=p_target_term_id then
  raise exception 'Choose a different target term';
 end if;
 if not exists(select 1 from public.academic_terms where id=p_source_term_id) or
    not exists(select 1 from public.academic_terms where id=p_target_term_id) then
  raise exception 'Selected academic term does not exist';
 end if;
 if exists(select 1 from public.academic_timetable_slots where term_id=p_target_term_id and department_id=p_department_id) then
  raise exception 'The target term already has timetable entries for this department';
 end if;
 insert into public.academic_timetable_slots(
  term_id,department_id,course_id,day_of_week,period_no,start_time,end_time,room,instructor,topic,created_by
 )
 select p_target_term_id,department_id,course_id,day_of_week,period_no,start_time,end_time,room,instructor,topic,auth.uid()
 from public.academic_timetable_slots
 where term_id=p_source_term_id and department_id=p_department_id
 order by day_of_week,period_no;
 get diagnostics copied_count=row_count;
 return copied_count;
end;
$$;
revoke all on function public.mrpst_copy_academic_timetable(uuid,uuid,uuid) from public;
grant execute on function public.mrpst_copy_academic_timetable(uuid,uuid,uuid) to authenticated;
