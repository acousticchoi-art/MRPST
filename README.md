# MRPST Seminary Website

A multilingual website and administration portal foundation for Myanmar Reformed Presbyterian Seminary.

## Stack
- Next.js App Router + TypeScript
- Supabase Auth and PostgreSQL with Row Level Security
- Vercel deployment
- Public website languages: English, Myanmar and Korean

## Run locally
1. Install Node.js 20 or later.
2. Copy `.env.example` to `.env.local`.
3. Add the Supabase project URL and anon/publishable key.
4. Run `npm install`, then `npm run dev`.

## Supabase setup
1. Create a Supabase project.
2. Run the SQL files in `supabase/migrations` in filename order using the Supabase SQL Editor.
3. In Supabase Authentication, create the first administrator account.
4. Copy that user's UUID from Authentication > Users.
5. Replace the example UUID and name below, then run this SQL:

```sql
insert into public.user_profiles (user_id, full_name)
values ('AUTH-USER-UUID', 'Administrator');

insert into public.user_roles (user_id, role)
values ('AUTH-USER-UUID', 'super_admin');
```

6. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel Environment Variables, then redeploy.

Never expose a Supabase service-role key in browser code or a `NEXT_PUBLIC_` variable.

## Current implementation status
- Public homepage with English, Myanmar and Korean routes.
- Initial admin dashboard shell and sign-in form.
- Supabase cookie/session integration.
- Initial role model and RLS policies for profiles, departments and user roles.
- Integrated double-entry finance ledger with fund-based accounting and approval workflow.
- Budget planning with approval and budget-versus-actual reporting.
- Donor registry and multi-currency contribution records linked to journal entries.
- Admin dashboard requires an authenticated account with an assigned role and an active profile once Supabase is configured.

## Important next steps
- Verify the project build and test sign-in against the actual Supabase project.
- Add department-specific permission checks to every administrative page and database table.
- Finish finance reports, budget export and scholarship disbursement workflows.
- Implement students, academics, facilities, library, meeting records and website CMS.
- Replace all temporary public copy with institutionally approved facts, dates, contacts and photographs.

The work is on `foundation/nextjs-migration`. The original `main` branch has not been replaced.
