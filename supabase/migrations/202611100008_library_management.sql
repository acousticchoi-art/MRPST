-- Library catalogue, members and circulation workflow.
create table if not exists public.library_books(
 id uuid primary key default gen_random_uuid(),
 isbn text unique,
 title text not null check(length(trim(title))>0),
 author text,
 publisher text,
 publication_year integer check(publication_year is null or publication_year between 1400 and 2200),
 category text,
 language text,
 shelf_location text,
 total_copies integer not null default 1 check(total_copies>=0),
 description text,
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists library_books_title_idx on public.library_books(title);
create index if not exists library_books_category_idx on public.library_books(category);
create table if not exists public.library_members(
 id uuid primary key default gen_random_uuid(),
 member_number text not null unique,
 full_name text not null check(length(trim(full_name))>0),
 member_type text not null check(member_type in ('student','faculty','staff','external')),
 phone text,
 email text,
 department text,
 student_id uuid references public.students(id) on delete set null,
 is_active boolean not null default true,
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists library_members_name_idx on public.library_members(full_name);
create index if not exists library_members_type_idx on public.library_members(member_type);
create table if not exists public.library_loans(
 id uuid primary key default gen_random_uuid(),
 book_id uuid not null references public.library_books(id) on delete restrict,
 member_id uuid not null references public.library_members(id) on delete restrict,
 checkout_date date not null default current_date,
 due_date date not null,
 returned_at date,
 status text not null default 'active' check(status in ('active','returned','lost')),
 issued_by uuid not null default auth.uid() references auth.users(id),
 received_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 check(due_date>=checkout_date),
 check((status='returned' and returned_at is not null) or (status<>'returned' and returned_at is null))
);
create index if not exists library_loans_book_status_idx on public.library_loans(book_id,status);
create index if not exists library_loans_member_status_idx on public.library_loans(member_id,status);
create index if not exists library_loans_due_date_idx on public.library_loans(due_date) where status='active';

create or replace function public.mrpst_can_manage_library()
returns boolean language sql stable security definer set search_path=public as $$
 select public.mrpst_is_active_user(auth.uid()) and exists(
  select 1 from public.user_roles where user_id=auth.uid()
  and role in ('super_admin','administrator','librarian')
 );
$$;
alter table public.library_books enable row level security;
alter table public.library_members enable row level security;
alter table public.library_loans enable row level security;
create policy "Library staff read books" on public.library_books for select to authenticated using(public.mrpst_can_manage_library());
create policy "Library staff manage books" on public.library_books for all to authenticated using(public.mrpst_can_manage_library()) with check(public.mrpst_can_manage_library() and created_by=auth.uid());
create policy "Library staff read members" on public.library_members for select to authenticated using(public.mrpst_can_manage_library());
create policy "Library staff manage members" on public.library_members for all to authenticated using(public.mrpst_can_manage_library()) with check(public.mrpst_can_manage_library() and created_by=auth.uid());
create policy "Library staff read loans" on public.library_loans for select to authenticated using(public.mrpst_can_manage_library());
grant select,insert,update,delete on public.library_books,public.library_members to authenticated;
grant select on public.library_loans to authenticated;
grant execute on function public.mrpst_can_manage_library() to authenticated;

create or replace function public.mrpst_checkout_library_book(
 p_book_id uuid,p_member_id uuid,p_checkout_date date,p_due_date date
) returns uuid language plpgsql security definer set search_path=public as $$
declare b public.library_books%rowtype; new_loan uuid; active_count integer;
begin
 if not public.mrpst_can_manage_library() then raise exception 'Library permission required'; end if;
 if p_checkout_date is null or p_due_date is null or p_due_date<p_checkout_date then raise exception 'A valid checkout and due date are required'; end if;
 select * into b from public.library_books where id=p_book_id for update;
 if not found then raise exception 'Book not found'; end if;
 if not exists(select 1 from public.library_members where id=p_member_id and is_active) then raise exception 'Select an active library member'; end if;
 select count(*) into active_count from public.library_loans where book_id=p_book_id and status='active';
 if active_count>=b.total_copies then raise exception 'No available copy of this book'; end if;
 insert into public.library_loans(book_id,member_id,checkout_date,due_date,issued_by)
 values(p_book_id,p_member_id,p_checkout_date,p_due_date,auth.uid()) returning id into new_loan;
 return new_loan;
end;
$$;
create or replace function public.mrpst_return_library_book(p_loan_id uuid,p_returned_at date default current_date)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.mrpst_can_manage_library() then raise exception 'Library permission required'; end if;
 if p_returned_at is null then raise exception 'Return date is required'; end if;
 update public.library_loans set status='returned',returned_at=p_returned_at,received_by=auth.uid()
 where id=p_loan_id and status='active';
 if not found then raise exception 'Only an active loan can be returned'; end if;
end;
$$;
revoke all on function public.mrpst_checkout_library_book(uuid,uuid,date,date) from public;
revoke all on function public.mrpst_return_library_book(uuid,date) from public;
grant execute on function public.mrpst_checkout_library_book(uuid,uuid,date,date) to authenticated;
grant execute on function public.mrpst_return_library_book(uuid,date) to authenticated;

create or replace function public.mrpst_library_set_updated_at()
returns trigger language plpgsql set search_path=public as $$
begin new.updated_at=now();return new;end;
$$;
drop trigger if exists library_books_updated_at on public.library_books;
create trigger library_books_updated_at before update on public.library_books for each row execute function public.mrpst_library_set_updated_at();
drop trigger if exists library_members_updated_at on public.library_members;
create trigger library_members_updated_at before update on public.library_members for each row execute function public.mrpst_library_set_updated_at();
