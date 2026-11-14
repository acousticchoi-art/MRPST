-- Student lifecycle: program lengths, semester enrolment history, status history and graduation.
alter table public.students
  add column if not exists program_code text,
  add column if not exists current_semester smallint,
  add column if not exists admission_term text,
  add column if not exists graduation_year integer,
  add column if not exists graduation_term smallint,
  add column if not exists graduation_date date,
  add column if not exists graduation_number text;

alter table public.students
  add constraint students_program_code_check
  check (program_code is null or program_code in ('theology','ece','mdiv'));
alter table public.students
  add constraint students_current_semester_check
  check (
    current_semester is null or
    (program_code='theology' and current_semester between 1 and 8) or
    (program_code='ece' and current_semester between 1 and 4) or
    (program_code='mdiv' and current_semester between 1 and 6)
  );
alter table public.students
  add constraint students_graduation_term_check
  check (graduation_term is null or graduation_term in (1,2));

create table if not exists public.student_term_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  academic_year integer not null check (academic_year between 2000 and 2200),
  term_number smallint not null check (term_number in (1,2)),
  semester_number smallint not null check (semester_number between 1 and 8),
  enrollment_status text not null default 'enrolled'
    check (enrollment_status in ('enrolled','completed','leave','withdrawn')),
  registered_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  unique(student_id, academic_year, term_number)
);
create index if not exists student_term_enrollments_student_idx
  on public.student_term_enrollments(student_id, academic_year desc, term_number desc);

create table if not exists public.student_status_history (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  previous_status public.mrpst_student_status,
  new_status public.mrpst_student_status not null,
  effective_date date not null default current_date,
  reason text,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists student_status_history_student_idx
  on public.student_status_history(student_id, created_at desc);

create table if not exists public.student_graduations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students(id) on delete restrict,
  program_code text not null check (program_code in ('theology','ece','mdiv')),
  graduation_year integer not null check (graduation_year between 2000 and 2200),
  graduation_term smallint not null check (graduation_term in (1,2)),
  graduation_date date,
  degree_name text,
  graduation_number text unique,
  honors text,
  notes text,
  approved_by uuid references auth.users(id),
  approved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.student_term_enrollments enable row level security;
alter table public.student_status_history enable row level security;
alter table public.student_graduations enable row level security;

create policy "Student staff read term enrollments" on public.student_term_enrollments
  for select to authenticated using (public.mrpst_can_view_student_records());
create policy "Student managers insert term enrollments" on public.student_term_enrollments
  for insert to authenticated with check (public.mrpst_can_manage_students() and created_by=auth.uid());
create policy "Student managers update term enrollments" on public.student_term_enrollments
  for update to authenticated using (public.mrpst_can_manage_students()) with check (public.mrpst_can_manage_students());
create policy "Student managers read status history" on public.student_status_history
  for select to authenticated using (public.mrpst_can_view_student_records());
create policy "Student managers insert status history" on public.student_status_history
  for insert to authenticated with check (public.mrpst_can_manage_students() and changed_by=auth.uid());
create policy "Student staff read graduations" on public.student_graduations
  for select to authenticated using (public.mrpst_can_view_student_records());
create policy "Student managers insert graduations" on public.student_graduations
  for insert to authenticated with check (public.mrpst_can_manage_students() and approved_by=auth.uid());
create policy "Student managers update graduations" on public.student_graduations
  for update to authenticated using (public.mrpst_can_manage_students()) with check (public.mrpst_can_manage_students());

grant select,insert,update on public.student_term_enrollments to authenticated;
grant select,insert on public.student_status_history to authenticated;
grant select,insert,update on public.student_graduations to authenticated;

create or replace function public.mrpst_log_student_status_change()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  if new.student_status is distinct from old.student_status then
    insert into public.student_status_history(student_id,previous_status,new_status,changed_by)
    values(new.id,old.student_status,new.student_status,auth.uid());
  end if;
  return new;
end;
$$;
drop trigger if exists students_status_history on public.students;
create trigger students_status_history
  after update of student_status on public.students
  for each row execute function public.mrpst_log_student_status_change();

create or replace function public.mrpst_advance_student_semester(
  p_student_ids uuid[], p_academic_year integer, p_term_number smallint
) returns table(student_id uuid, student_name text, next_semester smallint, result text)
language plpgsql security invoker set search_path=public as $$
declare s public.students%rowtype; max_semester smallint; next_no smallint;
begin
  if not public.mrpst_can_manage_students() then raise exception 'Student management permission required'; end if;
  if p_academic_year not between 2000 and 2200 or p_term_number not in (1,2) then raise exception 'Invalid academic term'; end if;
  for s in select st.* from public.students st where st.id = any(p_student_ids) order by st.student_number
  loop
    max_semester := case s.program_code when 'theology' then 8 when 'ece' then 4 when 'mdiv' then 6 else null end;
    if s.student_status <> 'active' then
      student_id:=s.id; student_name:=s.full_name; next_semester:=s.current_semester; result:='재학 상태가 아니어서 제외'; return next;
    elsif max_semester is null or s.current_semester is null then
      student_id:=s.id; student_name:=s.full_name; next_semester:=s.current_semester; result:='과정 또는 현재 학기가 지정되지 않아 제외'; return next;
    elsif s.current_semester >= max_semester then
      student_id:=s.id; student_name:=s.full_name; next_semester:=s.current_semester; result:='최종 학기: 졸업 심사 필요'; return next;
    else
      next_no := s.current_semester + 1;
      insert into public.student_term_enrollments(student_id,academic_year,term_number,semester_number,enrollment_status,created_by)
      values(s.id,p_academic_year,p_term_number,next_no,'enrolled',auth.uid())
      on conflict(student_id,academic_year,term_number) do nothing;
      update public.students set current_semester=next_no where id=s.id;
      student_id:=s.id; student_name:=s.full_name; next_semester:=next_no; result:='진급 처리 완료'; return next;
    end if;
  end loop;
end;
$$;
revoke all on function public.mrpst_advance_student_semester(uuid[],integer,smallint) from public;
grant execute on function public.mrpst_advance_student_semester(uuid[],integer,smallint) to authenticated;

create or replace function public.mrpst_confirm_student_graduation(
  p_student_id uuid, p_graduation_year integer, p_graduation_term smallint,
  p_graduation_date date default null, p_degree_name text default null,
  p_graduation_number text default null
) returns uuid
language plpgsql security invoker set search_path=public as $$
declare s public.students%rowtype; max_semester smallint; graduation_id uuid;
begin
  if not public.mrpst_can_manage_students() then raise exception 'Student management permission required'; end if;
  select * into s from public.students where id=p_student_id for update;
  if not found then raise exception 'Student not found'; end if;
  max_semester:=case s.program_code when 'theology' then 8 when 'ece' then 4 when 'mdiv' then 6 else null end;
  if s.student_status <> 'active' or max_semester is null or s.current_semester < max_semester then
    raise exception 'Final semester completion is required before graduation';
  end if;
  insert into public.student_graduations(student_id,program_code,graduation_year,graduation_term,graduation_date,degree_name,graduation_number,approved_by)
  values(s.id,s.program_code,p_graduation_year,p_graduation_term,p_graduation_date,p_degree_name,nullif(trim(p_graduation_number),''),auth.uid())
  returning id into graduation_id;
  update public.students set student_status='graduated',graduation_year=p_graduation_year,
    graduation_term=p_graduation_term,graduation_date=p_graduation_date,
    graduation_number=nullif(trim(p_graduation_number),'') where id=s.id;
  return graduation_id;
end;
$$;
revoke all on function public.mrpst_confirm_student_graduation(uuid,integer,smallint,date,text,text) from public;
grant execute on function public.mrpst_confirm_student_graduation(uuid,integer,smallint,date,text,text) to authenticated;
