-- Administrator-managed account provisioning; retire public self-signup approval.
alter table public.user_profiles add column if not exists email text;
update public.user_profiles p
set email = u.email
from auth.users u
where u.id = p.user_id and (p.email is null or p.email = '');

drop trigger if exists on_auth_user_registration_request on auth.users;
drop function if exists public.mrpst_capture_registration_request();
revoke all on function public.mrpst_review_registration(uuid,text) from public, anon, authenticated;
drop function if exists public.mrpst_review_registration(uuid,text);

-- Keep registration_requests as historical data; no new requests are generated.
