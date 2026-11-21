-- Public announcements can be shared by every language version of the site.
alter table public.website_contents
  drop constraint if exists website_contents_locale_check;

alter table public.website_contents
  add constraint website_contents_locale_check
  check (locale = any (array['ko'::text, 'my'::text, 'en'::text, 'all'::text]));
