-- Final canonical promotion and graduation guards after migrations 01100-01800.
-- Preserves cohort semester numbering, exact term validation, and trigger-owned status history.
CREATE OR REPLACE FUNCTION public.mrpst_approve_student_promotion(p_batch_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_updated integer; v_academic_year integer;
begin
  if not public.mrpst_can_manage_academics() then raise exception '진급 승인 권한이 없습니다.'; end if;
  select academic_year into v_academic_year from public.student_promotion_batches where id=p_batch_id and status='review' for update;
  if not found then raise exception '승인 대기 중인 진급 명단이 없습니다.'; end if;
  if exists(select 1 from public.student_promotion_items where batch_id=p_batch_id and decision='needs_review') then
    raise exception '학년 또는 학기 이수 확인이 필요한 학생이 남아 있습니다. 먼저 처리해 주세요.';
  end if;
  if exists(
    select 1 from public.student_promotion_items i join public.students s on s.id=i.student_id
    where i.batch_id=p_batch_id and i.decision in ('promote','graduation_review')
    and (s.student_status<>'active' or s.cohort is distinct from i.from_cohort
      or not exists(select 1 from public.student_term_enrollments e where e.student_id=s.id and e.academic_year=v_academic_year and e.term_number=1
        and e.semester_number=case i.from_cohort when 'First Year' then 1 when 'Second Year' then 3 when 'Third Year' then 5 when 'Fourth Year' then 7 else null end and e.enrollment_status='completed')
      or not exists(select 1 from public.student_term_enrollments e where e.student_id=s.id and e.academic_year=v_academic_year and e.term_number=2
        and e.semester_number=case i.from_cohort when 'First Year' then 2 when 'Second Year' then 4 when 'Third Year' then 6 when 'Fourth Year' then 8 else null end and e.enrollment_status='completed'))
  ) then raise exception '진급 명단 생성 후 학생 학적 또는 개인별 1·2학기 이수 상태가 변경되었습니다. 명단을 다시 확인해 주세요.'; end if;
  update public.students s set cohort=i.to_cohort,
    current_semester=greatest(coalesce(s.current_semester,0),case i.to_cohort when 'Second Year' then 3 when 'Third Year' then 5 when 'Fourth Year' then 7 else 0 end),
    updated_at=now()
  from public.student_promotion_items i where i.batch_id=p_batch_id and i.student_id=s.id
    and i.decision='promote' and s.student_status='active' and s.cohort is not distinct from i.from_cohort;
  get diagnostics v_updated=row_count;
  update public.students s set current_semester=greatest(coalesce(s.current_semester,0),
    case when s.program_code='ece' then 4 when s.program_code='mdiv' then 6
      when s.program_code='theology' and coalesce(s.program,'') ilike '%diploma%' then 4
      when s.program_code='theology' then 8 else 0 end),updated_at=now()
  from public.student_promotion_items i where i.batch_id=p_batch_id and i.student_id=s.id
    and i.decision='graduation_review' and s.student_status='active' and s.cohort is not distinct from i.from_cohort;
  if exists(select 1 from public.student_promotion_items i join public.students s on s.id=i.student_id
    where i.batch_id=p_batch_id and i.decision='promote' and (s.student_status<>'active' or s.cohort is distinct from i.to_cohort)) then
    raise exception '진급 명단 생성 후 학생 정보가 변경되었습니다. 명단을 다시 확인해 주세요.';
  end if;
  update public.student_promotion_batches set status='approved',approved_by=auth.uid(),approved_at=now() where id=p_batch_id;
  return v_updated;
end;
$function$


CREATE OR REPLACE FUNCTION public.mrpst_confirm_student_graduation(p_item_id uuid, p_graduation_year integer, p_graduation_term smallint, p_graduation_date date DEFAULT NULL::date, p_degree_name text DEFAULT NULL::text, p_graduation_number text DEFAULT NULL::text, p_honors text DEFAULT NULL::text, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_student_id uuid; v_batch_status text; v_decision text; v_student_status public.mrpst_student_status;
  v_program_code text; v_program text; v_current_semester smallint; v_max_semester smallint; v_graduation_id uuid;
begin
  if not public.mrpst_can_manage_academics() then raise exception '졸업 확정 권한이 없습니다.'; end if;
  if p_graduation_year not between 2000 and 2200 then raise exception '졸업 연도가 올바르지 않습니다.'; end if;
  if p_graduation_term not in (1,2) then raise exception '졸업 학기는 1학기 또는 2학기여야 합니다.'; end if;
  select i.student_id,i.decision,b.status into v_student_id,v_decision,v_batch_status
  from public.student_promotion_items i join public.student_promotion_batches b on b.id=i.batch_id
  where i.id=p_item_id for update of i;
  if not found then raise exception '졸업 심사 항목을 찾을 수 없습니다.'; end if;
  if v_batch_status<>'approved' then raise exception '진급 심사 명단이 먼저 최종 승인되어야 합니다.'; end if;
  if v_decision<>'graduation_review' then raise exception '졸업 검토 대상으로 지정된 학생이 아닙니다.'; end if;
  select student_status,program_code,program,current_semester into v_student_status,v_program_code,v_program,v_current_semester
  from public.students where id=v_student_id for update;
  if not found or v_student_status<>'active' then raise exception '현재 재학 상태인 학생만 졸업 처리할 수 있습니다.'; end if;
  if v_program_code not in ('theology','ece','mdiv') then raise exception '학생의 학위 과정 코드를 먼저 확인해 주세요.'; end if;
  v_max_semester:=case when v_program_code='ece' then 4 when v_program_code='mdiv' then 6
    when v_program_code='theology' and coalesce(v_program,'') ilike '%diploma%' then 4
    when v_program_code='theology' then 8 else null end;
  if v_max_semester is null or coalesce(v_current_semester,0)<v_max_semester then raise exception '최종 학기의 학사 진급 승인이 완료되지 않았습니다.'; end if;
  if not exists(select 1 from public.student_term_enrollments e where e.student_id=v_student_id
    and e.academic_year=p_graduation_year and e.term_number=p_graduation_term
    and e.semester_number=v_max_semester and e.enrollment_status='completed') then
    raise exception '선택한 졸업 학년·학기의 최종 학기 이수 기록이 필요합니다.';
  end if;
  if exists(select 1 from public.student_graduations where student_id=v_student_id) then raise exception '이미 졸업 이력이 등록된 학생입니다.'; end if;
  insert into public.student_graduations(student_id,program_code,graduation_year,graduation_term,graduation_date,degree_name,graduation_number,honors,notes,approved_by)
  values(v_student_id,v_program_code,p_graduation_year,p_graduation_term,p_graduation_date,nullif(trim(p_degree_name),''),nullif(trim(p_graduation_number),''),nullif(trim(p_honors),''),nullif(trim(p_notes),''),auth.uid())
  returning id into v_graduation_id;
  update public.students set student_status='graduated',graduation_year=p_graduation_year,graduation_term=p_graduation_term,
    graduation_date=p_graduation_date,graduation_number=nullif(trim(p_graduation_number),''),updated_at=now() where id=v_student_id;
  update public.student_status_history set effective_date=coalesce(p_graduation_date,current_date),reason='정식 졸업 확정'
  where id=(select id from public.student_status_history where student_id=v_student_id and previous_status='active'
    and new_status='graduated' and changed_by=auth.uid() and created_at>=transaction_timestamp() order by created_at desc limit 1);
  return v_graduation_id;
end;
$function$


CREATE OR REPLACE FUNCTION public.mrpst_create_student_promotion_batch(p_academic_year integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_batch_id uuid;
begin
  if not public.mrpst_can_manage_academics() then raise exception '진급 관리 권한이 없습니다.'; end if;
  if p_academic_year not between 2000 and 2200 then raise exception '학년도가 올바르지 않습니다.'; end if;
  if not exists(select 1 from public.academic_terms where academic_year=p_academic_year and substring(term_code from '([12])$')='1' and status='completed')
     or not exists(select 1 from public.academic_terms where academic_year=p_academic_year and substring(term_code from '([12])$')='2' and status='completed') then
    raise exception '해당 학년도의 1학기와 2학기가 모두 종료되어야 진급 명단을 만들 수 있습니다.';
  end if;
  insert into public.student_promotion_batches(academic_year,created_by) values(p_academic_year,auth.uid()) returning id into v_batch_id;
  insert into public.student_promotion_items(batch_id,student_id,student_number,student_name,from_cohort,to_cohort,decision)
  select v_batch_id,s.id,s.student_number,s.full_name,s.cohort,
    case when year_level<max_year then case year_level when 1 then 'Second Year' when 2 then 'Third Year' when 3 then 'Fourth Year' end else null end,
    case
      when year_level is null or max_year is null or year_level>max_year then 'needs_review'
      when not (
        exists(select 1 from public.student_term_enrollments e where e.student_id=s.id and e.academic_year=p_academic_year and e.term_number=1 and e.semester_number=year_level*2-1 and e.enrollment_status='completed')
        and exists(select 1 from public.student_term_enrollments e where e.student_id=s.id and e.academic_year=p_academic_year and e.term_number=2 and e.semester_number=year_level*2 and e.enrollment_status='completed')
      ) then 'needs_review'
      when year_level=max_year then 'graduation_review'
      else 'promote'
    end
  from (
    select st.*,
      case st.cohort when 'First Year' then 1 when 'Second Year' then 2 when 'Third Year' then 3 when 'Fourth Year' then 4 else null end as year_level,
      case when st.program_code='ece' then 2 when st.program_code='mdiv' then 3
        when st.program_code='theology' and coalesce(st.program,'') ilike '%diploma%' then 2
        when st.program_code='theology' then 4 else null end as max_year
    from public.students st where st.student_status='active'
  ) s;
  return v_batch_id;
exception when unique_violation then raise exception '해당 학년도의 진급 명단이 이미 생성되어 있습니다.';
end;
$function$


CREATE OR REPLACE FUNCTION public.mrpst_set_student_promotion_decision(p_item_id uuid, p_decision text, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_batch_status text; v_academic_year integer; v_student_id uuid; v_program_code text; v_program text;
  v_cohort text; v_student_cohort text; v_year_level integer; v_max_year integer;
begin
  if not public.mrpst_can_manage_academics() then raise exception '진급 관리 권한이 없습니다.'; end if;
  if p_decision not in ('promote','graduation_review','needs_review','excluded') then raise exception '올바르지 않은 처리 상태입니다.'; end if;
  select b.status,b.academic_year,s.id,s.program_code,s.program,i.from_cohort,s.cohort
    into v_batch_status,v_academic_year,v_student_id,v_program_code,v_program,v_cohort,v_student_cohort
  from public.student_promotion_items i join public.student_promotion_batches b on b.id=i.batch_id
  join public.students s on s.id=i.student_id where i.id=p_item_id for update of i,s;
  if not found or v_batch_status<>'review' then raise exception '검토 중인 진급 항목을 찾을 수 없습니다.'; end if;
  if v_student_cohort is distinct from v_cohort then raise exception '명단 생성 후 학생의 학년 정보가 변경되었습니다. 명단을 다시 생성해 주세요.'; end if;
  v_year_level:=case v_cohort when 'First Year' then 1 when 'Second Year' then 2 when 'Third Year' then 3 when 'Fourth Year' then 4 else null end;
  v_max_year:=case when v_program_code='ece' then 2 when v_program_code='mdiv' then 3
    when v_program_code='theology' and coalesce(v_program,'') ilike '%diploma%' then 2
    when v_program_code='theology' then 4 else null end;
  if p_decision='promote' and (v_year_level is null or v_max_year is null or v_year_level>=v_max_year) then
    raise exception '해당 과정의 최종 학년은 일반 진급 처리할 수 없습니다.';
  end if;
  if p_decision='graduation_review' and (v_year_level is null or v_max_year is null or v_year_level<>v_max_year) then
    raise exception '해당 과정의 최종 학년 학생만 졸업 검토로 지정할 수 있습니다.';
  end if;
  if p_decision in ('promote','graduation_review') and (
    not exists(select 1 from public.student_term_enrollments e where e.student_id=v_student_id and e.academic_year=v_academic_year and e.term_number=1 and e.semester_number=v_year_level*2-1 and e.enrollment_status='completed')
    or not exists(select 1 from public.student_term_enrollments e where e.student_id=v_student_id and e.academic_year=v_academic_year and e.term_number=2 and e.semester_number=v_year_level*2 and e.enrollment_status='completed')
  ) then
    raise exception '해당 학년도의 개인별 1·2학기 이수 기록이 모두 완료되어야 진급 또는 졸업 검토할 수 있습니다.';
  end if;
  update public.student_promotion_items set decision=p_decision,note=nullif(trim(p_note),'') where id=p_item_id;
end;
$function$


revoke all on function public.mrpst_create_student_promotion_batch(integer) from public;
grant execute on function public.mrpst_create_student_promotion_batch(integer) to authenticated;
revoke all on function public.mrpst_set_student_promotion_decision(uuid,text,text) from public;
grant execute on function public.mrpst_set_student_promotion_decision(uuid,text,text) to authenticated;
revoke all on function public.mrpst_approve_student_promotion(uuid) from public;
grant execute on function public.mrpst_approve_student_promotion(uuid) to authenticated;
revoke all on function public.mrpst_confirm_student_graduation(uuid,integer,smallint,date,text,text,text,text) from public;
grant execute on function public.mrpst_confirm_student_graduation(uuid,integer,smallint,date,text,text,text,text) to authenticated;
