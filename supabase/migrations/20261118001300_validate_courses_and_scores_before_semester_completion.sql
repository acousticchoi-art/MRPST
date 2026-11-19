-- Individual semester completion must be backed by completed course registrations and entered scores.
-- Academic term lookup uses the final term-code suffix (1 or 2), supporting both "2026-2" and "2026-2027-1".
create or replace function public.mrpst_complete_student_semester(p_student_id uuid,p_academic_year integer,p_term_number smallint)
returns void
language plpgsql
security invoker
set search_path=public
as $$
declare
  s public.students%rowtype;
  v_term_id uuid;
  v_active_count integer;
  v_incomplete_count integer;
  v_missing_score_count integer;
  v_changed integer;
begin
  if not public.mrpst_can_manage_students() then
    raise exception 'Student management permission required';
  end if;
  if p_academic_year not between 2000 and 2200 or p_term_number not in (1,2) then
    raise exception 'Invalid academic term';
  end if;

  select * into s from public.students where id=p_student_id for update;
  if not found or s.student_status<>'active' or s.current_semester is null then
    raise exception 'Active student record required';
  end if;

  select id into v_term_id
  from public.academic_terms
  where academic_year=p_academic_year
    and substring(term_code from '([12])$')=p_term_number::text
    and status='completed'
  order by end_date desc nulls last, created_at desc
  limit 1;
  if v_term_id is null then
    raise exception 'Institutional academic term must be completed first';
  end if;

  select count(*),
         count(*) filter (where e.enrollment_status<>'completed'),
         count(*) filter (where g.id is null or g.score is null)
    into v_active_count,v_incomplete_count,v_missing_score_count
  from public.academic_enrollments e
  left join public.academic_grades g
    on g.student_id=e.student_id and g.course_id=e.course_id and g.term_id=e.term_id
  where e.student_id=p_student_id and e.term_id=v_term_id
    and e.enrollment_status<>'withdrawn';

  if v_active_count=0 then
    raise exception 'No active course registrations found for this academic term';
  end if;
  if v_incomplete_count>0 then
    raise exception 'All registered courses must be marked completed before semester completion';
  end if;
  if v_missing_score_count>0 then
    raise exception 'Scores must be entered for every completed course before semester completion';
  end if;

  update public.student_term_enrollments
  set enrollment_status='completed',completed_at=coalesce(completed_at,now())
  where student_id=p_student_id
    and academic_year=p_academic_year
    and term_number=p_term_number
    and semester_number=s.current_semester
    and enrollment_status='enrolled';
  get diagnostics v_changed=row_count;

  if v_changed=0 and not exists(
    select 1 from public.student_term_enrollments
    where student_id=p_student_id and academic_year=p_academic_year
      and term_number=p_term_number and semester_number=s.current_semester
      and enrollment_status='completed'
  ) then
    raise exception 'Current semester enrolment was not found';
  end if;
end;
$$;

revoke all on function public.mrpst_complete_student_semester(uuid,integer,smallint) from public;
grant execute on function public.mrpst_complete_student_semester(uuid,integer,smallint) to authenticated;
