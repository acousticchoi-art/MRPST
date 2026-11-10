-- Link recurring timetable slots to the canonical instructor and approved course assignments.
alter table public.academic_timetable_slots
 add column if not exists instructor_id uuid references public.academic_instructors(id) on delete set null;
create index if not exists academic_timetable_instructor_idx on public.academic_timetable_slots(term_id,instructor_id,day_of_week,start_time);
-- Backfill only unambiguous exact-name matches that are also assigned to that course and term.
with matches as (
 select s.id,min(i.id::text)::uuid as instructor_id,count(distinct i.id) as match_count
 from public.academic_timetable_slots s
 join public.academic_instructors i on lower(trim(i.full_name))=lower(trim(s.instructor)) and i.is_active
 join public.academic_teaching_assignments a on a.term_id=s.term_id and a.course_id=s.course_id and a.instructor_id=i.id
 where s.instructor_id is null and nullif(trim(s.instructor),'') is not null
 group by s.id
)
update public.academic_timetable_slots s set instructor_id=m.instructor_id
from matches m where s.id=m.id and m.match_count=1;
create or replace function public.mrpst_validate_timetable_instructor_assignment()
returns trigger language plpgsql set search_path=public as $$
declare assigned_name text;
begin
 if new.instructor_id is not null then
  select i.full_name into assigned_name
  from public.academic_teaching_assignments a
  join public.academic_instructors i on i.id=a.instructor_id
  where a.term_id=new.term_id and a.course_id=new.course_id and a.instructor_id=new.instructor_id and i.is_active;
  if assigned_name is null then
   raise exception 'Selected instructor is not assigned to this course in the selected term';
  end if;
  new.instructor:=assigned_name;
 end if;
 return new;
end;
$$;
drop trigger if exists academic_timetable_instructor_assignment on public.academic_timetable_slots;
create trigger academic_timetable_instructor_assignment
 before insert or update of term_id,course_id,instructor_id,instructor on public.academic_timetable_slots
 for each row execute function public.mrpst_validate_timetable_instructor_assignment();
-- Prevent deleting/changing an assignment while timetable slots still use it.
create or replace function public.mrpst_guard_timetable_teaching_assignment()
returns trigger language plpgsql set search_path=public as $$
begin
 if exists(select 1 from public.academic_timetable_slots s where s.term_id=old.term_id and s.course_id=old.course_id and s.instructor_id=old.instructor_id) then
  raise exception 'This teaching assignment is used by the timetable. Reassign or clear timetable slots before changing or deleting it';
 end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end;
$$;
drop trigger if exists academic_teaching_assignment_timetable_guard on public.academic_teaching_assignments;
create trigger academic_teaching_assignment_timetable_guard
 before delete or update of term_id,course_id,instructor_id on public.academic_teaching_assignments
 for each row execute function public.mrpst_guard_timetable_teaching_assignment();
\n-- Keep linked instructor references when copying a timetable to a term that already has matching teaching assignments.
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
  term_id,department_id,course_id,day_of_week,period_no,start_time,end_time,room,instructor,instructor_id,topic,created_by
 )
 select p_target_term_id,s.department_id,s.course_id,s.day_of_week,s.period_no,s.start_time,s.end_time,s.room,s.instructor,
  case when exists(
   select 1 from public.academic_teaching_assignments a
   where a.term_id=p_target_term_id and a.course_id=s.course_id and a.instructor_id=s.instructor_id
  ) then s.instructor_id else null end,
  s.topic,auth.uid()
 from public.academic_timetable_slots s
 where s.term_id=p_source_term_id and s.department_id=p_department_id
 order by s.day_of_week,s.period_no;
 get diagnostics copied_count=row_count;
 return copied_count;
end;
$$;
revoke all on function public.mrpst_copy_academic_timetable(uuid,uuid,uuid) from public;
grant execute on function public.mrpst_copy_academic_timetable(uuid,uuid,uuid) to authenticated;
