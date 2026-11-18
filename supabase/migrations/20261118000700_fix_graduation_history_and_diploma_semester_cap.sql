-- Correct graduation history duplication and enforce Diploma semester cap.
-- Status-history trigger owns the single status transition record.
create or replace function public.mrpst_advance_student_semester(p_student_ids uuid[],p_academic_year integer,p_term_number smallint)
returns table(student_id uuid,student_name text,next_semester smallint,result text)
language plpgsql security invoker set search_path=public as $$
declare s public.students%rowtype; max_semester smallint; next_no smallint; inserted_id uuid;
begin
 if not public.mrpst_can_manage_students() then raise exception 'Student management permission required'; end if;
 if p_academic_year not between 2000 and 2200 or p_term_number not in (1,2) then raise exception 'Invalid academic term'; end if;
 for s in select st.* from public.students st where st.id=any(p_student_ids) order by st.student_number loop
  max_semester:=case
    when s.program_code='ece' then 4
    when s.program_code='mdiv' then 6
    when s.program_code='theology' and coalesce(s.program,'') ilike '%diploma%' then 4
    when s.program_code='theology' then 8
    else null end;
  if s.student_status<>'active' then
   student_id:=s.id;student_name:=s.full_name;next_semester:=s.current_semester;result:='재학 상태가 아니어서 제외';return next;
  elsif max_semester is null or s.current_semester is null then
   student_id:=s.id;student_name:=s.full_name;next_semester:=s.current_semester;result:='과정 또는 현재 학기가 지정되지 않아 제외';return next;
  elsif s.current_semester>=max_semester then
   student_id:=s.id;student_name:=s.full_name;next_semester:=s.current_semester;result:='최종 학기: 졸업 심사 필요';return next;
  else
   next_no:=s.current_semester+1;
   inserted_id:=null;
   insert into public.student_term_enrollments(student_id,academic_year,term_number,semester_number,enrollment_status,created_by)
   values(s.id,p_academic_year,p_term_number,next_no,'enrolled',auth.uid())
   on conflict(student_id,academic_year,term_number) do nothing
   returning id into inserted_id;
   if inserted_id is null then
    student_id:=s.id;student_name:=s.full_name;next_semester:=s.current_semester;result:='이미 등록된 학기이므로 중복 진급을 막았습니다';return next;
   end if;
   update public.student_term_enrollments set enrollment_status='completed',completed_at=now()
   where student_id=s.id and enrollment_status='enrolled' and id<>inserted_id;
   update public.students set current_semester=next_no where id=s.id;
   student_id:=s.id;student_name:=s.full_name;next_semester:=next_no;result:='진급 처리 완료';return next;
  end if;
 end loop;
end; $$;
revoke all on function public.mrpst_advance_student_semester(uuid[],integer,smallint) from public;
grant execute on function public.mrpst_advance_student_semester(uuid[],integer,smallint) to authenticated;

-- Recreate graduation confirmation without manually inserting student_status_history.
create or replace function public.mrpst_confirm_student_graduation(
  p_item_id uuid,
  p_graduation_year integer,
  p_graduation_term smallint,
  p_graduation_date date default null,
  p_degree_name text default null,
  p_graduation_number text default null,
  p_honors text default null,
  p_notes text default null
) returns uuid
language plpgsql security definer set search_path=public as $$
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
  if not public.mrpst_can_manage_academics() then raise exception '졸업 확정 권한이 없습니다.'; end if;
  if p_graduation_year < 2000 or p_graduation_year > 2200 then raise exception '졸업 연도가 올바르지 않습니다.'; end if;
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
  if v_program_code not in ('theology','ece','mdiv') then raise exception '학생의 학위 과정 코드(theology, ece, mdiv)를 먼저 확인해 주세요.'; end if;
  v_max_semester:=case
    when v_program_code='ece' then 4
    when v_program_code='mdiv' then 6
    when v_program_code='theology' and coalesce(v_program,'') ilike '%diploma%' then 4
    when v_program_code='theology' then 8 else null end;
  if v_max_semester is null or coalesce(v_current_semester,0)<v_max_semester then raise exception '최종 학기의 학사 진급 승인이 완료되지 않았습니다.'; end if;
  if exists(select 1 from public.student_graduations where student_id=v_student_id) then raise exception '이미 졸업 이력이 등록된 학생입니다.'; end if;

  insert into public.student_graduations(student_id,program_code,graduation_year,graduation_term,graduation_date,degree_name,graduation_number,honors,notes,approved_by)
  values(v_student_id,v_program_code,p_graduation_year,p_graduation_term,p_graduation_date,nullif(trim(p_degree_name),''),nullif(trim(p_graduation_number),''),nullif(trim(p_honors),''),nullif(trim(p_notes),''),auth.uid())
  returning id into v_graduation_id;

  -- The students_status_history trigger inserts exactly one row for this transition.
  update public.students set student_status='graduated',graduation_year=p_graduation_year,graduation_term=p_graduation_term,graduation_date=p_graduation_date,graduation_number=nullif(trim(p_graduation_number),''),updated_at=now()
  where id=v_student_id;
  return v_graduation_id;
end; $$;
revoke all on function public.mrpst_confirm_student_graduation(uuid,integer,smallint,date,text,text,text,text) from public;
grant execute on function public.mrpst_confirm_student_graduation(uuid,integer,smallint,date,text,text,text,text) to authenticated;
