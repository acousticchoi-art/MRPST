-- Restrict profile self-service updates to non-privileged fields.
-- Account activation remains under administrator control.
revoke update on table public.user_profiles from authenticated;
grant update (full_name, preferred_locale) on table public.user_profiles to authenticated;
