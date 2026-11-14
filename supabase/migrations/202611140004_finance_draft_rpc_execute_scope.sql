revoke all on function public.mrpst_update_journal_draft(uuid,date,text,uuid,text,jsonb) from anon;
revoke all on function public.mrpst_delete_journal_draft(uuid) from anon;
revoke all on function public.mrpst_update_budget_draft(uuid,integer,text,uuid,jsonb) from anon;
revoke all on function public.mrpst_delete_budget_draft(uuid) from anon;
grant execute on function public.mrpst_update_journal_draft(uuid,date,text,uuid,text,jsonb) to authenticated;
grant execute on function public.mrpst_delete_journal_draft(uuid) to authenticated;
grant execute on function public.mrpst_update_budget_draft(uuid,integer,text,uuid,jsonb) to authenticated;
grant execute on function public.mrpst_delete_budget_draft(uuid) to authenticated;