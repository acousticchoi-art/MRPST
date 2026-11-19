-- Require both individual semester completion records before annual cohort promotion.
-- Academic-term closure alone is not sufficient to advance a student's cohort.
create or replace function public.mrpst_approve_student_promotion(p_batch_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
  v_academic_year integer;
begin
  if not public.mrpst_can_manage_academics() then
    raise exception '진급 승인 권한이 없습니다.';
  end if;

  select academic_year into v_academic_year
  from public.student_promotion_batches
  where id=p_batch_id and status='review'
  for update;
  if not found then raise exception '승인 대기 중인 진급 명단이 없습니다.'; end if;

  if exists(select 1 from public.student_promotion_items where batch_id=p_batch_id and decision='needs_review') then
    raise exception '학년 확인이 필요한 학생이 남아 있습니다. 먼저 처리해 주세요.';
  end if;

  -- For students marked to promote, verify term 1 and term 2 completed records
  -- match the two semester numbers for their current cohort/year.
  if exists (
    select 1
    from public.student_promotion_items i
    join public.students s on s.id=i.student_id
    where i.batch_id=p_batch_id and i.decision='promote'
      and (
        not exists (
          select 1 from public.student_term_enrollments e
          where e.student_id=s.id and e.academic_year=v_academic_year
            and e.term_number=1 and e.enrollment_status='completed'
            and e.semester_number=case i.from_cohort
              when 'First Year' then 1 when 'Second Year' then 3 when 'Third Year' then 5 else null end
        )
        or not exists (
          select 1 from public.student_term_enrollments e
          where e.student_id=s.id and e.academic_year=v_academic_year
            and e.term_number=2 and e.enrollment_status='completed'
            and e.semester_number=case i.from_cohort
              when 'First Year' then 2 when 'Second Year' then 4 when 'Third Year' then 6 else null end
        )
      )
  ) then
    raise exception '진급 대상 학생 중 해당 학년도 1·2학기 개인 이수 기록이 누락된 학생이 있습니다. 학생별 학기 이수 확정 후 다시 승인해 주세요.';
  end if;

  update public.students s
  set cohort=i.to_cohort,
      current_semester=greatest(coalesce(s.current_semester,0),
        case i.to_cohort when 'Second Year' then 2 when 'Third Year' then 4 when 'Fourth Year' then 6 else 0 end),
      updated_at=now()
  from public.student_promotion_items i
  where i.batch_id=p_batch_id and i.student_id=s.id
    and i.decision='promote' and s.student_status='active'
    and s.cohort is not distinct from i.from_cohort;
  get diagnostics v_updated=row_count;

  update public.students s
  set current_semester=greatest(coalesce(s.current_semester,0),
      case
        when s.program_code='ece' then 4
        when s.program_code='mdiv' then 6
        when s.program_code='theology' and coalesce(s.program,'') ilike '%diploma%' then 4
        when s.program_code='theology' then 8
        else 0
      end),
      updated_at=now()
  from public.student_promotion_items i
  where i.batch_id=p_batch_id and i.student_id=s.id
    and i.decision='graduation_review' and s.student_status='active'
    and s.cohort is not distinct from i.from_cohort;

  if exists(
    select 1 from public.student_promotion_items i
    join public.students s on s.id=i.student_id
    where i.batch_id=p_batch_id and i.decision='promote'
      and (s.student_status<>'active' or s.cohort is distinct from i.to_cohort)
  ) then
    raise exception '진급 명단 생성 후 학생 정보가 변경되었습니다. 명단을 다시 확인해 주세요.';
  end if;

  update public.student_promotion_batches
  set status='approved',approved_by=auth.uid(),approved_at=now()
  where id=p_batch_id;
  return v_updated;
end;
$$;

revoke all on function public.mrpst_approve_student_promotion(uuid) from public;
grant execute on function public.mrpst_approve_student_promotion(uuid) to authenticated;
