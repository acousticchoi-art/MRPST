-- Buildings, inventory, fleet and maintenance workflows.
create table if not exists public.facility_buildings(
 id uuid primary key default gen_random_uuid(),building_code text not null unique,
 name text not null check(length(trim(name))>0),location text,
 floors integer check(floors is null or floors>=0),area_sqm numeric(12,2) check(area_sqm is null or area_sqm>=0),
 building_status text not null default 'active' check(building_status in ('active','maintenance','inactive')),
 description text,created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.facility_inventory(
 id uuid primary key default gen_random_uuid(),asset_code text not null unique,
 name text not null check(length(trim(name))>0),category text not null,
 building_id uuid references public.facility_buildings(id) on delete set null,
 quantity integer not null default 1 check(quantity>=0),
 condition_status text not null default 'good' check(condition_status in ('good','fair','poor','disposed')),
 purchase_date date,purchase_cost numeric(18,2) check(purchase_cost is null or purchase_cost>=0),
 currency char(3) not null default 'MMK' check(currency ~ '^[A-Z]{3}$'),assigned_to text,notes text,
 created_by uuid not null default auth.uid() references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index if not exists facility_inventory_building_idx on public.facility_inventory(building_id);
create table if not exists public.facility_vehicles(
 id uuid primary key default gen_random_uuid(),vehicle_code text not null unique,make text,model text,
 registration_number text not null unique,vehicle_type text,
 manufacture_year integer check(manufacture_year is null or manufacture_year between 1950 and 2200),
 capacity integer check(capacity is null or capacity>=0),current_mileage integer check(current_mileage is null or current_mileage>=0),
 insurance_expiry date,inspection_expiry date,
 vehicle_status text not null default 'active' check(vehicle_status in ('active','maintenance','inactive')),
 notes text,created_by uuid not null default auth.uid() references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.facility_maintenance(
 id uuid primary key default gen_random_uuid(),request_number bigint generated always as identity unique,
 title text not null check(length(trim(title))>0),description text,
 target_type text not null check(target_type in ('building','inventory','vehicle')),
 building_id uuid references public.facility_buildings(id) on delete restrict,
 inventory_id uuid references public.facility_inventory(id) on delete restrict,
 vehicle_id uuid references public.facility_vehicles(id) on delete restrict,
 priority text not null default 'normal' check(priority in ('low','normal','high','urgent')),
 status text not null default 'reported' check(status in ('reported','in_progress','on_hold','completed','cancelled')),
 reported_date date not null default current_date,scheduled_date date,completed_date date,
 estimated_cost numeric(18,2) check(estimated_cost is null or estimated_cost>=0),
 actual_cost numeric(18,2) check(actual_cost is null or actual_cost>=0),
 currency char(3) not null default 'MMK' check(currency ~ '^[A-Z]{3}$'),vendor text,resolution_notes text,
 created_by uuid not null default auth.uid() references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check((target_type='building' and building_id is not null and inventory_id is null and vehicle_id is null)
 or (target_type='inventory' and inventory_id is not null and building_id is null and vehicle_id is null)
 or (target_type='vehicle' and vehicle_id is not null and building_id is null and inventory_id is null))
);
create index if not exists facility_maintenance_status_idx on public.facility_maintenance(status,priority);
create or replace function public.mrpst_can_manage_facilities()
returns boolean language sql stable security definer set search_path=public as $$
 select public.mrpst_is_active_user(auth.uid()) and exists(select 1 from public.user_roles where user_id=auth.uid() and role in ('super_admin','administrator','facility_manager'));
$$;
alter table public.facility_buildings enable row level security;
alter table public.facility_inventory enable row level security;
alter table public.facility_vehicles enable row level security;
alter table public.facility_maintenance enable row level security;
create policy "Facility managers read buildings" on public.facility_buildings for select to authenticated using(public.mrpst_can_manage_facilities());
create policy "Facility managers manage buildings" on public.facility_buildings for all to authenticated using(public.mrpst_can_manage_facilities()) with check(public.mrpst_can_manage_facilities() and created_by=auth.uid());
create policy "Facility managers read inventory" on public.facility_inventory for select to authenticated using(public.mrpst_can_manage_facilities());
create policy "Facility managers manage inventory" on public.facility_inventory for all to authenticated using(public.mrpst_can_manage_facilities()) with check(public.mrpst_can_manage_facilities() and created_by=auth.uid());
create policy "Facility managers read vehicles" on public.facility_vehicles for select to authenticated using(public.mrpst_can_manage_facilities());
create policy "Facility managers manage vehicles" on public.facility_vehicles for all to authenticated using(public.mrpst_can_manage_facilities()) with check(public.mrpst_can_manage_facilities() and created_by=auth.uid());
create policy "Facility managers read maintenance" on public.facility_maintenance for select to authenticated using(public.mrpst_can_manage_facilities());
create policy "Facility managers create maintenance" on public.facility_maintenance for insert to authenticated with check(public.mrpst_can_manage_facilities() and created_by=auth.uid());
create policy "Facility managers update maintenance" on public.facility_maintenance for update to authenticated using(public.mrpst_can_manage_facilities()) with check(public.mrpst_can_manage_facilities());
grant select,insert,update,delete on public.facility_buildings,public.facility_inventory,public.facility_vehicles to authenticated;
grant select,insert,update on public.facility_maintenance to authenticated;
grant execute on function public.mrpst_can_manage_facilities() to authenticated;
create or replace function public.mrpst_facility_set_updated_at()
returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now();return new;end; $$;
drop trigger if exists facility_buildings_updated_at on public.facility_buildings;
create trigger facility_buildings_updated_at before update on public.facility_buildings for each row execute function public.mrpst_facility_set_updated_at();
drop trigger if exists facility_inventory_updated_at on public.facility_inventory;
create trigger facility_inventory_updated_at before update on public.facility_inventory for each row execute function public.mrpst_facility_set_updated_at();
drop trigger if exists facility_vehicles_updated_at on public.facility_vehicles;
create trigger facility_vehicles_updated_at before update on public.facility_vehicles for each row execute function public.mrpst_facility_set_updated_at();
drop trigger if exists facility_maintenance_updated_at on public.facility_maintenance;
create trigger facility_maintenance_updated_at before update on public.facility_maintenance for each row execute function public.mrpst_facility_set_updated_at();
create or replace function public.mrpst_validate_facility_maintenance_target()
returns trigger language plpgsql set search_path=public as $$
begin
 if new.target_type='building' and not exists(select 1 from public.facility_buildings where id=new.building_id) then raise exception 'Building not found'; end if;
 if new.target_type='inventory' and not exists(select 1 from public.facility_inventory where id=new.inventory_id) then raise exception 'Inventory item not found'; end if;
 if new.target_type='vehicle' and not exists(select 1 from public.facility_vehicles where id=new.vehicle_id) then raise exception 'Vehicle not found'; end if;
 if new.status='completed' and new.completed_date is null then new.completed_date=current_date; end if;
 return new;
end;
$$;
drop trigger if exists facility_maintenance_validate_target on public.facility_maintenance;
create trigger facility_maintenance_validate_target before insert or update on public.facility_maintenance for each row execute function public.mrpst_validate_facility_maintenance_target();
