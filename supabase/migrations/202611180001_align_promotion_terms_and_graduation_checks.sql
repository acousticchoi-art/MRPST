create or replace function public.mrpst_create_student_promotion_batch(p_academic_year integer)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_batch_id uuid;
  v_next_year integer := p_academic_year + 1;
begin
  if not public.mrpst_can_manage_academics() then
    raise exception '진급 관리 권한이 없습니다.';
  end if;

  if not exists (
    select 1 from public.academic_terms
    where academic_year = p_academic_year
      and term_code in (
        p_academic_year::text || '-1',
        p_academic_year::text || '-' || v_next_year::text || '-1'
      )
      and status = 'completed'
  ) or not exists (
    select 1 from public.academic_terms
    where academic_year = p_academic_year
      and term_code in (
        p_academic_year::text || '-2',
        p_academic_year::text || '-' || v_next_year::text || '-2'
      )
      and status = 'completed'
  ) then
    raise exception '해당 학년도의 1학기와 2학기가 모두 종료되어야 진급 명단을 만들 수 있습니다.';
  end if;

  insert into public.student_promotion_batches(academic_year, created_by)
  values (p_academic_year, auth.uid())
  returning id into v_batch_id;

  insert into public.student_promotion_items(
    batch_id, student_id, student_number, student_name, from_cohort, to_cohort, decision
  )
  select
    v_batch_id, s.id, s.student_number, s.full_name, s.cohort,
    case
      when year_level < max_year then
        case year_level
          when 1 then 'Second Year'
          when 2 then 'Third Year'
          when 3 then 'Fourth Year'
        end
      else null
    end,
    case
      when year_level is null or max_year is null or year_level > max_year then 'needs_review'
      when year_level = max_year then 'graduation_review'
      else 'promote'
    end
  from (
    select s.*,
      case s.cohort
        when 'First Year' then 1
        when 'Second Year' then 2
        when 'Third Year' then 3
        when 'Fourth Year' then 4
        else null
      end as year_level,
      case
        when s.program_code = 'ece' then 2
        when s.program_code = 'mdiv' then 3
        when s.program_code = 'theology' and coalesce(s.program, '') ilike '%diploma%' then 2
        when s.program_code = 'theology' then 4
        else null
      end as max_year
    from public.students s
    where s.student_status = 'active'
  ) s;

  return v_batch_id;
exception when unique_violation then
  raise exception '해당 학년도의 진급 명단이 이미 생성되어 있습니다.';
end;
$function$;

create or replace function public.mrpst_confirm_student_graduation(
  p_item_id uuid,
  p_graduation_year integer,
  p_graduation_term smallint,
  p_graduation_date date default null,
  p_degree_name text default null,
  p_graduation_number text default null,
  p_honors text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_student_id uuid;
  v_batch_status text;
  v_decision text;
  v_student_status public.mrpst_student_status;
  v_program_code text;
  v_program text;
  v_current_semester smallint;
  v_max_semester smallint;
  v_graduation_id uuid;
begin
  if not public.mrpst_can_manage_academics() then
    raise exception '졸업 확정 권한이 없습니다.';
  end if;
  if p_graduation_year < 2000 or p_graduation_year > 2200 then
    raise exception '졸업 연도가 올바르지 않습니다.';
  end if;
  if p_graduation_term not in (1, 2) then
    raise exception '졸업 학기는 1학기 또는 2학기여야 합니다.';
  end if;

  select i.student_id, i.decision, b.status
    into v_student_id, v_decision, v_batch_status
  from public.student_promotion_items i
  join public.student_promotion_batches b on b.id = i.batch_id
  where i.id = p_item_id
  for update of i;

  if not found then raise exception '졸업 심사 항목을 찾을 수 없습니다.'; end if;
  if v_batch_status <> 'approved' then
    raise exception '진급 심사 명단이 먼저 최종 승인되어야 합니다.';
  end if;
  if v_decision <> 'graduation_review' then
    raise exception '졸업 검토 대상으로 지정된 학생이 아닙니다.';
  end if;

  select student_status, program_code, program, current_semester
    into v_student_status, v_program_code, v_program, v_current_semester
  from public.students
  where id = v_student_id
  for update;

  if not found or v_student_status <> 'active' then
    raise exception '현재 재학 상태인 학생만 졸업 처리할 수 있습니다.';
  end if;
  if v_program_code not in ('theology', 'ece', 'mdiv') then
    raise exception '학생의 학위 과정 코드(theology, ece, mdiv)를 먼저 확인해 주세요.';
  end if;

  v_max_semester := case
    when v_program_code = 'ece' then 4
    when v_program_code = 'mdiv' then 6
    when v_program_code = 'theology' and coalesce(v_program, '') ilike '%diploma%' then 4
    when v_program_code = 'theology' then 8
    else null
  end;

  if v_max_semester is null or coalesce(v_current_semester, 0) < v_max_semester then
    raise exception '최종 학년의 학사 진급 승인이 완료되지 않았습니다.';
  end if;

  if not exists (
    select 1
    from public.student_term_enrollments e
    where e.student_id = v_student_id
      and e.semester_number = v_max_semester
      and e.enrollment_status = 'completed'
  ) then
    raise exception '최종 학기의 수강 및 이수 처리가 완료되어야 졸업할 수 있습니다.';
  end if;

  if exists (select 1 from public.student_graduations where student_id = v_student_id) then
    raise exception '이미 졸업 이력이 등록된 학생입니다.';
  end if;

  insert into public.student_graduations(
    student_id, program_code, graduation_year, graduation_term,
    graduation_date, degree_name, graduation_number, honors, notes, approved_by
  ) values (
    v_student_id, v_program_code, p_graduation_year, p_graduation_term,
    p_graduation_date, nullif(trim(p_degree_name), ''),
    nullif(trim(p_graduation_number), ''), nullif(trim(p_honors), ''),
    nullif(trim(p_notes), ''), auth.uid()
  ) returning id into v_graduation_id;

  insert into public.student_status_history(
    student_id, previous_status, new_status, effective_date, reason, changed_by
  ) values (
    v_student_id, 'active', 'graduated', coalesce(p_graduation_date, current_date),
    '정식 졸업 확정', auth.uid()
  );

  update public.students
  set student_status = 'graduated',
      graduation_year = p_graduation_year,
      graduation_term = p_graduation_term,
      graduation_date = p_graduation_date,
      graduation_number = nullif(trim(p_graduation_number), ''),
      updated_at = now()
  where id = v_student_id;

  return v_graduation_id;
end;
$function$;
