create or replace function public.mrpst_create_student_promotion_batch(p_academic_year integer)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_batch_id uuid;
begin
  if not public.mrpst_can_manage_academics() then
    raise exception '진급 관리 권한이 없습니다.';
  end if;
  if not exists (
    select 1 from public.academic_terms
    where academic_year=p_academic_year and term_code=p_academic_year::text||'-1' and status='completed'
  ) or not exists (
    select 1 from public.academic_terms
    where academic_year=p_academic_year and term_code=p_academic_year::text||'-2' and status='completed'
  ) then
    raise exception '해당 학년도의 1학기와 2학기가 모두 종료되어야 진급 명단을 만들 수 있습니다.';
  end if;

  insert into public.student_promotion_batches(academic_year,created_by)
  values(p_academic_year,auth.uid()) returning id into v_batch_id;

  insert into public.student_promotion_items(batch_id,student_id,student_number,student_name,from_cohort,to_cohort,decision)
  select
    v_batch_id,s.id,s.student_number,s.full_name,s.cohort,
    case
      when year_level < max_year then
        case year_level when 1 then 'Second Year' when 2 then 'Third Year' when 3 then 'Fourth Year' end
      else null
    end,
    case
      when year_level is null or max_year is null or year_level > max_year then 'needs_review'
      when year_level = max_year then 'graduation_review'
      else 'promote'
    end
  from (
    select s.*,
      case s.cohort when 'First Year' then 1 when 'Second Year' then 2 when 'Third Year' then 3 when 'Fourth Year' then 4 else null end as year_level,
      case
        when s.program_code='ece' then 2
        when s.program_code='mdiv' then 3
        when s.program_code='theology' and coalesce(s.program,'') ilike '%diploma%' then 2
        when s.program_code='theology' then 4
        else null
      end as max_year
    from public.students s
    where s.student_status='active'
  ) s;

  return v_batch_id;
exception when unique_violation then
  raise exception '해당 학년도의 진급 명단이 이미 생성되어 있습니다.';
end;
$$;

create or replace function public.mrpst_approve_student_promotion(p_batch_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_updated integer;
begin
  if not public.mrpst_can_manage_academics() then
    raise exception '진급 승인 권한이 없습니다.';
  end if;

  perform 1 from public.student_promotion_batches
  where id=p_batch_id and status='review' for update;
  if not found then raise exception '승인 대기 중인 진급 명단이 없습니다.'; end if;

  if exists(select 1 from public.student_promotion_items where batch_id=p_batch_id and decision='needs_review') then
    raise exception '학년 확인이 필요한 학생이 남아 있습니다. 먼저 처리해 주세요.';
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

revoke all on function public.mrpst_create_student_promotion_batch(integer) from public;
grant execute on function public.mrpst_create_student_promotion_batch(integer) to authenticated;
revoke all on function public.mrpst_approve_student_promotion(uuid) from public;
grant execute on function public.mrpst_approve_student_promotion(uuid) to authenticated;
