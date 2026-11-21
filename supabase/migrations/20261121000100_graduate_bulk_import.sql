-- Import historical graduates atomically: student profile, graduation record,
-- and initial status history are either all created or none are created.
create or replace function public.mrpst_import_graduates(p_rows jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row jsonb;
  v_index integer := 0;
  v_student_number text;
  v_full_name text;
  v_program_code text;
  v_program text;
  v_admission_year integer;
  v_graduation_year integer;
  v_graduation_term smallint;
  v_graduation_date date;
  v_graduation_number text;
  v_student_id uuid;
  v_imported integer := 0;
begin
  if auth.uid() is null or not public.mrpst_can_manage_students() then
    raise exception 'Student management permission required';
  end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'At least one graduate row is required';
  end if;

  -- Validate every row before any write, so a bad CSV never creates a partial import.
  for v_row in select value from jsonb_array_elements(p_rows)
  loop
    v_index := v_index + 1;
    v_student_number := nullif(btrim(v_row->>'student_number'), '');
    v_full_name := nullif(btrim(v_row->>'full_name'), '');
    v_program_code := lower(nullif(btrim(v_row->>'program_code'), ''));
    v_admission_year := nullif(btrim(v_row->>'admission_year'), '')::integer;
    v_graduation_year := nullif(btrim(v_row->>'graduation_year'), '')::integer;
    v_graduation_term := coalesce(nullif(btrim(v_row->>'graduation_term'), '')::smallint, 2);
    if v_student_number is null or v_full_name is null then raise exception 'Row %: student number and name are required', v_index; end if;
    if v_program_code not in ('theology','ece','mdiv') then raise exception 'Row %: program_code must be theology, ece, or mdiv', v_index; end if;
    if v_admission_year not between 1950 and 2200 or v_graduation_year not between 2000 and 2200 or v_admission_year > v_graduation_year then raise exception 'Row %: check admission and graduation years', v_index; end if;
    if v_graduation_term not in (1,2) then raise exception 'Row %: graduation term must be 1 or 2', v_index; end if;
    if nullif(btrim(v_row->>'graduation_date'), '') is not null and (v_row->>'graduation_date') !~ '^\\d{4}-\\d{2}-\\d{2}$' then raise exception 'Row %: graduation date must use YYYY-MM-DD', v_index; end if;
    if exists(select 1 from public.students where student_number = v_student_number) then raise exception 'Row %: student number % already exists', v_index, v_student_number; end if;
    if nullif(btrim(v_row->>'graduation_number'), '') is not null and exists(select 1 from public.student_graduations where graduation_number = btrim(v_row->>'graduation_number')) then raise exception 'Row %: graduation number already exists', v_index; end if;
    if (select count(*) from jsonb_array_elements(p_rows) x where nullif(btrim(x.value->>'student_number'),'') = v_student_number) > 1 then raise exception 'Row %: duplicate student number in file', v_index; end if;
  end loop;

  for v_row in select value from jsonb_array_elements(p_rows)
  loop
    v_student_number := btrim(v_row->>'student_number');
    v_full_name := btrim(v_row->>'full_name');
    v_program_code := lower(btrim(v_row->>'program_code'));
    v_program := coalesce(nullif(btrim(v_row->>'program'), ''), case v_program_code when 'ece' then 'Early Childhood Education' when 'mdiv' then 'Master of Divinity' else 'Theology' end);
    v_admission_year := (v_row->>'admission_year')::integer;
    v_graduation_year := (v_row->>'graduation_year')::integer;
    v_graduation_term := coalesce(nullif(btrim(v_row->>'graduation_term'), '')::smallint, 2);
    v_graduation_date := nullif(btrim(v_row->>'graduation_date'), '')::date;
    v_graduation_number := nullif(btrim(v_row->>'graduation_number'), '');
    insert into public.students(student_number,full_name,full_name_my,full_name_en,program_code,program,admission_year,student_status,phone,email,notes,graduation_year,graduation_term,graduation_date,graduation_number,created_by)
    values(v_student_number,v_full_name,nullif(btrim(v_row->>'full_name_my'),''),nullif(btrim(v_row->>'full_name_en'),''),v_program_code,v_program,v_admission_year,'graduated',nullif(btrim(v_row->>'phone'),''),nullif(btrim(v_row->>'email'),''),nullif(btrim(v_row->>'notes'),''),v_graduation_year,v_graduation_term,v_graduation_date,v_graduation_number,auth.uid())
    returning id into v_student_id;
    insert into public.student_graduations(student_id,program_code,graduation_year,graduation_term,graduation_date,degree_name,graduation_number,honors,notes,approved_by)
    values(v_student_id,v_program_code,v_graduation_year,v_graduation_term,v_graduation_date,nullif(btrim(v_row->>'degree_name'),''),v_graduation_number,nullif(btrim(v_row->>'honors'),''),nullif(btrim(v_row->>'notes'),''),auth.uid());
    insert into public.student_status_history(student_id,previous_status,new_status,effective_date,reason,changed_by)
    values(v_student_id,null,'graduated',coalesce(v_graduation_date,make_date(v_graduation_year,12,31)),'초기 졸업생 일괄 등록',auth.uid());
    v_imported := v_imported + 1;
  end loop;
  return jsonb_build_object('imported',v_imported);
end;
$$;

revoke all on function public.mrpst_import_graduates(jsonb) from public;
revoke execute on function public.mrpst_import_graduates(jsonb) from anon;
grant execute on function public.mrpst_import_graduates(jsonb) to authenticated;
