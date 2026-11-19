-- Prevent individual semester advancement from auto-marking previous enrollments complete.
-- Semester completion must be an explicit action; advancement only creates the next term.
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
    when s.program_code='theology' then 8 else null end;
  if s.student_status<>'active' then
   student_id:=s.id;student_name:=s.full_name;next_semester:=s.current_semester;result:='재학 상태가 아니어서 제외';return next;
  elsif max_semester is null or s.current_semester is null then
   student_id:=s.id;student_name:=s.full_name;next_semester:=s.current_semester;result:='과정 또는 현재 학기가 지정되지 않아 제외';return next;
  elsif s.current_semester>=max_semester then
   student_id:=s.id;student_name:=s.full_name;next_semester:=s.current_semester;result:='최종 학기: 졸업 심사 필요';return next;
  elsif not exists(select 1 from public.student_term_enrollments e where e.student_id=s.id and e.semester_number=s.current_semester and e.enrollment_status='completed') then
   student_id:=s.id;student_name:=s.full_name;next_semester:=s.current_semester;result:='현재 학기 이수 확정 후 진급할 수 있습니다';return next;
  else
   next_no:=s.current_semester+1;inserted_id:=null;
   insert into public.student_term_enrollments(student_id,academic_year,term_number,semester_number,enrollment_status,created_by)
   values(s.id,p_academic_year,p_term_number,next_no,'enrolled',auth.uid())
   on conflict(student_id,academic_year,term_number) do nothing returning id into inserted_id;
   if inserted_id is null then
    student_id:=s.id;student_name:=s.full_name;next_semester:=s.current_semester;result:='이미 등록된 학기이므로 중복 진급을 막았습니다';return next;
   end if;
   update public.students set current_semester=next_no where id=s.id;
   student_id:=s.id;student_name:=s.full_name;next_semester:=next_no;result:='진급 처리 완료';return next;
  end if;
 end loop;
end; $$;
revoke all on function public.mrpst_advance_student_semester(uuid[],integer,smallint) from public;
grant execute on function public.mrpst_advance_student_semester(uuid[],integer,smallint) to authenticated;
