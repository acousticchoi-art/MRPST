create or replace function public.mrpst_set_student_promotion_decision(
  p_item_id uuid,
  p_decision text,
  p_note text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch_status text;
  v_program_code text;
  v_program text;
  v_cohort text;
  v_student_cohort text;
  v_year_level integer;
  v_max_year integer;
begin
  if not public.mrpst_can_manage_academics() then
    raise exception '진급 관리 권한이 없습니다.';
  end if;
  if p_decision not in ('promote','graduation_review','needs_review','excluded') then
    raise exception '올바르지 않은 처리 상태입니다.';
  end if;

  select b.status,s.program_code,s.program,i.from_cohort,s.cohort
    into v_batch_status,v_program_code,v_program,v_cohort,v_student_cohort
  from public.student_promotion_items i
  join public.student_promotion_batches b on b.id=i.batch_id
  join public.students s on s.id=i.student_id
  where i.id=p_item_id
  for update of i,s;

  if not found or v_batch_status<>'review' then
    raise exception '검토 중인 진급 항목을 찾을 수 없습니다.';
  end if;
  if v_student_cohort is distinct from v_cohort then
    raise exception '명단 생성 후 학생의 학년 정보가 변경되었습니다. 명단을 다시 생성해 주세요.';
  end if;

  v_year_level:=case v_cohort when 'First Year' then 1 when 'Second Year' then 2 when 'Third Year' then 3 when 'Fourth Year' then 4 else null end;
  v_max_year:=case
    when v_program_code='ece' then 2
    when v_program_code='mdiv' then 3
    when v_program_code='theology' and coalesce(v_program,'') ilike '%diploma%' then 2
    when v_program_code='theology' then 4
    else null
  end;

  if p_decision='promote' and (v_year_level is null or v_max_year is null or v_year_level>=v_max_year) then
    raise exception '해당 과정의 최종 학년은 일반 진급 처리할 수 없습니다.';
  end if;
  if p_decision='graduation_review' and (v_year_level is null or v_max_year is null or v_year_level<>v_max_year) then
    raise exception '해당 과정의 최종 학년 학생만 졸업 검토로 지정할 수 있습니다.';
  end if;

  update public.student_promotion_items
  set decision=p_decision,note=nullif(trim(p_note),'')
  where id=p_item_id;
end;
$$;
revoke all on function public.mrpst_set_student_promotion_decision(uuid,text,text) from public;
grant execute on function public.mrpst_set_student_promotion_decision(uuid,text,text) to authenticated;
