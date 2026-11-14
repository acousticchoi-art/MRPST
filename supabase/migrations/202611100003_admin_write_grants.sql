-- Grant table operations to privileged roles; RLS policies remain the enforcement layer.
-- Ordinary users retain only their own profile read and limited profile-field update rights.
grant insert, update, delete on public.departments to authenticated;
grant insert, update, delete on public.user_roles to authenticated;
grant insert on public.user_profiles to authenticated;
