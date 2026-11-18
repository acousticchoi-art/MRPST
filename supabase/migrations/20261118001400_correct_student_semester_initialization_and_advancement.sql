-- Correct semester progression: current semester is a single student field.
-- student_term_enrollments represents the specific academic year/term record, not a future-term placeholder.
-- Backfill active test students' current semester from their cohort and program.
update public.students
set current_semester = case
  when cohort='First Year' then 1
  when cohort='Second Year' then 3
  when cohort='Third Year' then 5
  when cohort='Fourth Year' then 7
  else current_semester
end
where student_status='active' and current_semester is null
  and program_code in ('theology','ece','mdiv');

-- Initialize newly created student semester from their cohort if not explicitly supplied.
create or replace function public.mrpst_initialize_student_semester()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.current_semester is null then
    new.current_semester := case
      when new.cohort='First Year' then 1
      when new.cohort='Second Year' then 3
      when new.cohort='Third Year' then 5
      when new.cohort='Fourth Year' then 7
      else null
    end;
  end if;
  return new;
end;
$$;
drop trigger if exists mrpst_initialize_student_semester on public.students;
create trigger mrpst_initialize_student_semester
before insert or update of cohort,program_code,current_semester on public.students
for each row execute function public.mrpst_initialize_student_semester();

-- Advance only after the exact current academic term's semester record is completed.
-- Do not insert a future-semester enrollment using the same year/term unique key.
create or replace function public.mrpst_advance_student_semester(p_student_ids uuid[],p_academic_year integer,p_term_number smallint)
returns table(student_id uuid,student_name text,next_semester smallint,result text)
language plpgsql security invoker set search_path=public as $$
declare
  s public.students%rowtype;
  max_semester smallint;
  next_no smallint;
begin
  if not public.mrpst_can_manage_students() then raise exception 'Student management permission required'; end if;
  if p_academic_year not between 2000 and 2200 or p_term_number not in (1,2) then raise exception 'Invalid academic term'; end if;
  for s in select st.* from public.students st where st.id=any(p_student_ids) order by st.student_number loop
    max_semester:=case
      when s.program_code='ece' then 4
      when s.program_code='mdiv' then 6
      when s.program_code='theology' and coalesce(s.program,'') ilike '%diploma%' then 4
      when s.program_code='theology' then 8 else null end;
    if s.student_status<>'active' then
      student_id:=s.id;student_name:=s.full_name;next_semester:=s.current_semester;result:='재학 상태가 아니어서 제외';return next;
    elsif max_semester is null or s.current_semester is null then
      student_id:=s.id;student_name:=s.full_name;next_semester:=s.current_semester;result:='과정 또는 현재 학기가 지정되지 않아 제외';return next;
    elsif s.current_semester>=max_semester then
      student_id:=s.id;student_name:=s.full_name;next_semester:=s.current_semester;result:='최종 학기: 졸업 심사 필요';return next;
    elsif not exists(
      select 1 from public.student_term_enrollments e
      where e.student_id=s.id and e.academic_year=p_academic_year
        and e.term_number=p_term_number and e.semester_number=s.current_semester
        and e.enrollment_status='completed'
    ) then
      student_id:=s.id;student_name:=s.full_name;next_semester:=s.current_semester;result:='해당 학기 이수 확정 기록이 필요합니다';return next;
    else
      next_no:=s.current_semester+1;
      update public.students set current_semester=next_no where id=s.id;
      student_id:=s.id;student_name:=s.full_name;next_semester:=next_no;result:='학기 진급 완료';return next;
    end if;
  end loop;
end; $$;
revoke all on function public.mrpst_advance_student_semester(uuid[],integer,smallint) from public;
grant execute on function public.mrpst_advance_student_semester(uuid[],integer,smallint) to authenticated;

-- Annual cohort promotion sets the start semester for the next cohort, without resetting a
-- semester already advanced by the individual-term workflow.
create or replace function public.mrpst_approve_student_promotion(p_batch_id uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare v_updated integer; v_academic_year integer;
begin
  if not public.mrpst_can_manage_academics() then raise exception '진급 승인 권한이 없습니다.'; end if;
  select academic_year into v_academic_year from public.student_promotion_batches
  where id=p_batch_id and status='review' for update;
  if not found then raise exception '승인 대기 중인 진급 명단이 없습니다.'; end if;
  if exists(select 1 from public.student_promotion_items where batch_id=p_batch_id and decision='needs_review') then
    raise exception '학년 확인이 필요한 학생이 남아 있습니다. 먼저 처리해 주세요.';
  end if;
  if exists(
    select 1 from public.student_promotion_items i join public.students s on s.id=i.student_id
    where i.batch_id=p_batch_id and i.decision='promote'
      and (not exists(select 1 from public.student_term_enrollments e where e.student_id=s.id and e.academic_year=v_academic_year and e.term_number=1 and e.enrollment_status='completed'
        and e.semester_number=case i.from_cohort when 'First Year' then 1 when 'Second Year' then 3 when 'Third Year' then 5 else null end)
      or not exists(select 1 from public.student_term_enrollments e where e.student_id=s.id and e.academic_year=v_academic_year and e.term_number=2 and e.enrollment_status='completed
        and e.semester_number=case i.from_cohort when 'First Year' then 2 when 'Second Year' then 4 when 'Third Year' then 6 else null end))
  ) then raise exception '진급 대상 학생의 개인 학기 이수 기록이 누락되었습니다. 학기 이수 확정 후 승인해 주세요.'; end if;

  update public.students s
  set cohort=i.to_cohort,
      current_semester=greatest(coalesce(s.current_semester,0),
        case i.to_cohort when 'Second Year' then 3 when 'Third Year' then 5 when 'Fourth Year' then 7 else 0 end),
      updated_at=now()
  from public.student_promotion_items i
  where i.batch_id=p_batch_id and i.student_id=s.id and i.decision='promote'
    and s.student_status='active' and s.cohort is not distinct from i.from_cohort;
  get diagnostics v_updated=row_count;

  update public.students s
  set current_semester=greatest(coalesce(s.current_semester,0),
      case when s.program_code='ece' then 4 when s.program_code='mdiv' then 6
        when s.program_code='theology' and coalesce(s.program,'') ilike '%diploma%' then 4
        when s.program_code='theology' then 8 else 0 end),updated_at=now()
  from public.student_promotion_items i
  where i.batch_id=p_batch_id and i.student_id=s.id and i.decision='graduation_review'
    and s.student_status='active' and s.cohort is not distinct from i.from_cohort;

  if exists(select 1 from public.student_promotion_items i join public.students s on s.id=i.student_id
    where i.batch_id=p_batch_id and i.decision='promote' and (s.student_status<>'active' or s.cohort is distinct from i.to_cohort)) then
    raise exception '진급 명단 생성 후 학생 정보가 변경되었습니다. 명단을 다시 확인해 주세요.';
  end if;
  update public.student_promotion_batches set status='approved',approved_by=auth.uid(),approved_at=now() where id=p_batch_id;
  return v_updated;
end; $$;
revoke all on function public.mrpst_approve_student_promotion(uuid) from public;
grant execute on function public.mrpst_approve_student_promotion(uuid) to authenticated;
