-- Ensure facility management RLS honors explicit per-user can_manage overrides.
-- The previous helper OR-ed role membership with per-user grants, which allowed
-- facility_manager to bypass an explicit can_manage=false override.

create or replace function public.mrpst_can_manage_facilities()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(public.mrpst_can_manage_module(auth.uid(),'facilities'),false);
$function$;
