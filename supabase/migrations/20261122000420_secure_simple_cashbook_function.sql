revoke all on function public.mrpst_save_simple_cashbook_entry(date,text,uuid,uuid,uuid,numeric) from anon;
revoke all on function public.mrpst_save_simple_cashbook_entry(date,text,uuid,uuid,uuid,numeric) from public;
grant execute on function public.mrpst_save_simple_cashbook_entry(date,text,uuid,uuid,uuid,numeric) to authenticated;
