CREATE OR REPLACE FUNCTION public.mrpst_student_portal_data()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_student public.students%rowtype;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  if not public.mrpst_is_active_user(auth.uid()) then raise exception 'Active student account required'; end if;
  select s.* into v_student from public.students s where s.auth_user_id=auth.uid() and exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.role='student');
  if not found then raise exception 'Student portal account required'; end if;
  return jsonb_build_object(
    'student',jsonb_build_object('student_number',v_student.student_number,'full_name',v_student.full_name,'program',v_student.program,'current_semester',v_student.current_semester,'admission_year',v_student.admission_year,'student_status',v_student.student_status),
    'grades',coalesce((select jsonb_agg(jsonb_build_object('academic_year',t.academic_year,'term_name',t.name,'term_code',t.term_code,'course_code',c.course_code,'course_name',c.title,'course_name_my',c.title_my,'credits',c.credits,'score',g.score,'grade',g.grade) order by t.academic_year desc,t.term_code desc,c.course_code) from public.academic_enrollments e join public.academic_terms t on t.id=e.term_id join public.academic_courses c on c.id=e.course_id left join public.academic_grades g on g.student_id=e.student_id and g.course_id=e.course_id and g.term_id=e.term_id where e.student_id=v_student.id and e.enrollment_status <> 'withdrawn'),'[]'::jsonb),
    'timetable',coalesce((select jsonb_agg(jsonb_build_object('term_name',t.name,'term_code',t.term_code,'academic_year',t.academic_year,'course_code',c.course_code,'course_name',c.title,'course_name_my',c.title_my,'day_of_week',x.day_of_week,'start_time',to_char(x.start_time,'HH24:MI'),'end_time',to_char(x.end_time,'HH24:MI'),'room',x.room,'class_group',x.class_group,'in_current_term',coalesce(t.status='active' and (now() at time zone 'Asia/Yangon')::date between t.start_date and t.end_date,false)) order by t.academic_year desc,t.term_code desc,x.day_of_week,x.start_time) from public.academic_timetable_entries x join public.academic_terms t on t.id=x.term_id join public.academic_courses c on c.id=x.course_id where x.is_active=true and exists(select 1 from public.academic_enrollments e where e.student_id=v_student.id and e.term_id=x.term_id and e.course_id=x.course_id and e.enrollment_status <> 'withdrawn')),'[]'::jsonb)
    ,'library_linked',exists(select 1 from public.library_members m where m.student_id=v_student.id)
    ,'loans',coalesce((select jsonb_agg(jsonb_build_object('title',b.title,'checkout_date',l.checkout_date,'due_date',l.due_date,'status',l.status) order by l.due_date,l.id) from public.library_loans l join public.library_members m on m.id=l.member_id join public.library_books b on b.id=l.book_id where m.student_id=v_student.id and l.returned_at is null and l.status in ('active','lost')),'[]'::jsonb)
  );
end;
$function$
;
