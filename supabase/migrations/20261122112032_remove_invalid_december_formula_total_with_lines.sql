-- The December worksheet cell E5 is SUM(C15:C25), a formula total, not a transaction.
-- This is kept for migration history; the same correction has been applied to production.
with removed_lines as (
  delete from public.journal_lines
  where entry_id in (
    select id
    from public.journal_entries
    where reference_no = 'XLSX-2026-December-income-15'
      and entry_date = date '2026-12-31'
      and description = 'December import 1 (Excel import)'
  )
  returning entry_id
)
delete from public.journal_entries
where id in (select distinct entry_id from removed_lines);
