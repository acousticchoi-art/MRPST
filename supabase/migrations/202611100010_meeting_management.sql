-- Meeting schedules, attendance, minutes, action items and linked resources.
create table if not exists public.meetings(
 id uuid primary key default gen_random_uuid(),
 meeting_type text not null check(meeting_type in ('academic_committee','faculty','staff')),
 title text not null check(length(trim(title))>0),
 meeting_date date not null,
 start_time time,
 end_time time,
 location text,
 chairperson text,
 secretary text,
 agenda text,
 minutes text,
 decisions text,
 status text not null default 'scheduled' check(status in ('scheduled','in_progress','completed','cancelled')),
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(end_time is null or start_time is null or end_time>start_time)
);
create index if not exists meetings_date_idx on public.meetings(meeting_date desc);
create index if not exists meetings_type_date_idx on public.meetings(meeting_type,meeting_date desc);
create table if not exists public.meeting_participants(
 id uuid primary key default gen_random_uuid(),
 meeting_id uuid not null references public.meetings(id) on delete cascade,
 full_name text not null check(length(trim(full_name))>0),
 role_title text,
 email text,
 attendance_status text not null default 'invited' check(attendance_status in ('invited','attending','absent','excused')),
 created_at timestamptz not null default now(),
 unique(meeting_id,full_name)
);
create table if not exists public.meeting_action_items(
 id uuid primary key default gen_random_uuid(),
 meeting_id uuid not null references public.meetings(id) on delete cascade,
 title text not null check(length(trim(title))>0),
 description text,
 owner_name text,
 due_date date,
 priority text not null default 'normal' check(priority in ('low','normal','high','urgent')),
 status text not null default 'pending' check(status in ('pending','in_progress','completed','cancelled')),
 completed_at timestamptz,
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists meeting_action_items_due_idx on public.meeting_action_items(status,due_date);
create table if not exists public.meeting_materials(
 id uuid primary key default gen_random_uuid(),
 meeting_id uuid not null references public.meetings(id) on delete cascade,
 title text not null check(length(trim(title))>0),
 material_type text not null default 'document' check(material_type in ('document','presentation','spreadsheet','other')),
 url text not null check(url ~ '^https?://'),
 description text,
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now()
);
create or replace function public.mrpst_can_manage_meetings()
returns boolean language sql stable security definer set search_path=public as $$
 select public.mrpst_is_active_user(auth.uid()) and exists(
  select 1 from public.user_roles where user_id=auth.uid()
  and role in ('super_admin','administrator','academic_officer','faculty','staff')
 );
$$;
alter table public.meetings enable row level security;
alter table public.meeting_participants enable row level security;
alter table public.meeting_action_items enable row level security;
alter table public.meeting_materials enable row level security;
create policy "Meeting staff read meetings" on public.meetings for select to authenticated using(public.mrpst_can_manage_meetings());
create policy "Meeting staff insert meetings" on public.meetings for insert to authenticated with check(public.mrpst_can_manage_meetings() and created_by=auth.uid());
create policy "Meeting staff update meetings" on public.meetings for update to authenticated using(public.mrpst_can_manage_meetings()) with check(public.mrpst_can_manage_meetings());
create policy "Meeting admins delete meetings" on public.meetings for delete to authenticated using(exists(select 1 from public.user_roles where user_id=auth.uid() and role in ('super_admin','administrator')));
create policy "Meeting staff read participants" on public.meeting_participants for select to authenticated using(public.mrpst_can_manage_meetings());
create policy "Meeting staff insert participants" on public.meeting_participants for insert to authenticated with check(public.mrpst_can_manage_meetings());
create policy "Meeting staff update participants" on public.meeting_participants for update to authenticated using(public.mrpst_can_manage_meetings()) with check(public.mrpst_can_manage_meetings());
create policy "Meeting staff delete participants" on public.meeting_participants for delete to authenticated using(public.mrpst_can_manage_meetings());
create policy "Meeting staff read actions" on public.meeting_action_items for select to authenticated using(public.mrpst_can_manage_meetings());
create policy "Meeting staff insert actions" on public.meeting_action_items for insert to authenticated with check(public.mrpst_can_manage_meetings() and created_by=auth.uid());
create policy "Meeting staff update actions" on public.meeting_action_items for update to authenticated using(public.mrpst_can_manage_meetings()) with check(public.mrpst_can_manage_meetings());
create policy "Meeting staff delete actions" on public.meeting_action_items for delete to authenticated using(public.mrpst_can_manage_meetings());
create policy "Meeting staff read materials" on public.meeting_materials for select to authenticated using(public.mrpst_can_manage_meetings());
create policy "Meeting staff insert materials" on public.meeting_materials for insert to authenticated with check(public.mrpst_can_manage_meetings() and created_by=auth.uid());
create policy "Meeting staff update materials" on public.meeting_materials for update to authenticated using(public.mrpst_can_manage_meetings()) with check(public.mrpst_can_manage_meetings());
create policy "Meeting staff delete materials" on public.meeting_materials for delete to authenticated using(public.mrpst_can_manage_meetings());
grant select,insert,update,delete on public.meetings,public.meeting_participants,public.meeting_action_items,public.meeting_materials to authenticated;
grant execute on function public.mrpst_can_manage_meetings() to authenticated;
create or replace function public.mrpst_meetings_set_updated_at()
returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now();return new;end; $$;
drop trigger if exists meetings_updated_at on public.meetings;
create trigger meetings_updated_at before update on public.meetings for each row execute function public.mrpst_meetings_set_updated_at();
drop trigger if exists meeting_action_items_updated_at on public.meeting_action_items;
create trigger meeting_action_items_updated_at before update on public.meeting_action_items for each row execute function public.mrpst_meetings_set_updated_at();
