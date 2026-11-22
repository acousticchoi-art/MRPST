-- Historical cashbook rows are final records, not pending drafts.
update public.journal_entries
set status = 'posted',
    submitted_by = coalesce(submitted_by, created_by),
    submitted_at = coalesce(submitted_at, now()),
    approved_by = coalesce(approved_by, created_by),
    approved_at = coalesce(approved_at, now()),
    posted_by = coalesce(posted_by, created_by),
    posted_at = coalesce(posted_at, now()),
    updated_at = now()
where reference_no like 'XLSX-2026-%'
  and status in ('draft','submitted','approved','rejected');
