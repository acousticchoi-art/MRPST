-- Recurring weekly timetable: one row represents a fixed weekly class slot.
create table if not exists public.academic_timetable_slots(
 id uuid primary key default gen_random_uuid(),
 term_id uuid not null references public.academic_terms(id) on delete cascade,
 department_id uuid not null references public.departments(id) on delete restrict,
 course_id uuid not null references public.academic_courses(id) on delete restrict,
 day_of_week smallint not null check(day_of_week between 1 and 7),
 period_no smallint not null check(period_no between 1 and 20),
 start_time time not null,
 end_time time not null,
 room text,
 instructor text,
 topic text,
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(end_time>start_time),
 unique(term_id,department_id,day_of_week,period_no)
);
create index if not exists academic_timetable_term_department_idx on public.academic_timetable_slots(term_id,department_id,day_of_week,period_no);
create index if not exists academic_timetable_course_idx on public.academic_timetable_slots(course_id,term_id);
create or replace function public.mrpst_validate_academic_timetable_slot()
returns trigger language plpgsql set search_path=public as $$
declare course_department uuid;
begin
 select department_id into course_department from public.academic_courses where id=new.course_id;
 if not found then raise exception 'Selected course does not exist'; end if;
 if course_department is not null and course_department<>new.department_id then raise exception 'Selected course belongs to a different department'; end if;
 if exists(select 1 from public.academic_timetable_slots x where x.id<>new.id and x.term_id=new.term_id and x.day_of_week=new.day_of_week and x.start_time<new.end_time and x.end_time>new.start_time and (x.department_id=new.department_id or (nullif(trim(new.room),'') is not null and lower(trim(x.room))=lower(trim(new.room))) or (nullif(trim(new.instructor),'') is not null and lower(trim(x.instructor))=lower(trim(new.instructor))))) then
  raise exception 'Timetable conflict: department, room, or instructor already has a class at this time';
 end if;
 return new;
end;
$$;
drop trigger if exists academic_timetable_slot_validate on public.academic_timetable_slots;
create trigger academic_timetable_slot_validate before insert or update on public.academic_timetable_slots for each row execute function public.mrpst_validate_academic_timetable_slot();
create or replace function public.mrpst_academic_timetable_set_updated_at()
returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists academic_timetable_slots_updated_at on public.academic_timetable_slots;
create trigger academic_timetable_slots_updated_at before update on public.academic_timetable_slots for each row execute function public.mrpst_academic_timetable_set_updated_at();
alter table public.academic_timetable_slots enable row level security;
drop policy if exists "Academic staff read timetable slots" on public.academic_timetable_slots;
create policy "Academic staff read timetable slots" on public.academic_timetable_slots for select to authenticated using(public.mrpst_can_view_academics());
drop policy if exists "Academic managers insert timetable slots" on public.academic_timetable_slots;
create policy "Academic managers insert timetable slots" on public.academic_timetable_slots for insert to authenticated with check(public.mrpst_can_manage_academics() and created_by=auth.uid());
drop policy if exists "Academic managers update timetable slots" on public.academic_timetable_slots;
create policy "Academic managers update timetable slots" on public.academic_timetable_slots for update to authenticated using(public.mrpst_can_manage_academics()) with check(public.mrpst_can_manage_academics());
drop policy if exists "Academic managers delete timetable slots" on public.academic_timetable_slots;
create policy "Academic managers delete timetable slots" on public.academic_timetable_slots for delete to authenticated using(public.mrpst_can_manage_academics());
grant select,insert,update,delete on public.academic_timetable_slots to authenticated;
-- Existing dated class sessions are retained and not automatically converted.
