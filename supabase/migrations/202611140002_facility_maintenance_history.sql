-- Extend maintenance records to support campus locations and the legacy paper log format.
alter table public.facility_maintenance
  add column if not exists place_to_repair text,
  add column if not exists assigned_to text,
  add column if not exists check_status text not null default 'pending',
  add column if not exists result text;

alter table public.facility_maintenance
  drop constraint if exists facility_maintenance_target_type_check,
  drop constraint if exists facility_maintenance_check,
  drop constraint if exists facility_maintenance_check_status_check;

alter table public.facility_maintenance
  add constraint facility_maintenance_target_type_check
    check (target_type in ('building','inventory','vehicle','location')),
  add constraint facility_maintenance_check_status_check
    check (check_status in ('pending','checked','not_checked','repaired')),
  add constraint facility_maintenance_target_check
    check (
      (target_type='building' and building_id is not null and inventory_id is null and vehicle_id is null)
      or (target_type='inventory' and inventory_id is not null and building_id is null and vehicle_id is null)
      or (target_type='vehicle' and vehicle_id is not null and building_id is null and inventory_id is null)
      or (target_type='location' and place_to_repair is not null and length(trim(place_to_repair))>0
          and building_id is null and inventory_id is null and vehicle_id is null)
    );

create index if not exists facility_maintenance_reported_date_idx
  on public.facility_maintenance(reported_date desc);
create index if not exists facility_maintenance_place_idx
  on public.facility_maintenance(place_to_repair);
