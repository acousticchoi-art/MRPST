-- Preserve the effective date and reason supplied to the student status-change RPC.
-- The students_status_history trigger creates the single audit row; this RPC enriches it.
create or replace function public.mrpst_change_student_status(
  p_student_id uuid,
  p_new_status public.mrpst_student_status,
  p_effective_date date default current_date,
  p_reason text default null
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_previous_status public.mrpst_student_status;
begin
  if not public.mrpst_can_manage_students() then
    raise exception '학적 변경 권한이 없습니다.';
  end if;
  if p_new_status = 'graduated' then
    raise exception '졸업 상태는 졸업 심사에서만 확정할 수 있습니다.';
  end if;

  select student_status into v_previous_status
  from public.students
  where id = p_student_id
  for update;
  if not found then raise exception '학생 정보를 찾을 수 없습니다.'; end if;
  if v_previous_status = 'graduated' then
    raise exception '졸업 확정된 학생의 학적 상태는 일반 변경할 수 없습니다.';
  end if;
  if v_previous_status = p_new_status then return false; end if;

  update public.students
  set student_status = p_new_status, updated_at = now()
  where id = p_student_id;

  -- The audit trigger inserts exactly one row in this transaction.
  update public.student_status_history
  set effective_date = coalesce(p_effective_date, current_date),
      reason = nullif(trim(p_reason), '')
  where id = (
    select id from public.student_status_history
    where student_id = p_student_id
      and previous_status = v_previous_status
      and new_status = p_new_status
      and changed_by = auth.uid()
      and created_at >= transaction_timestamp()
    order by created_at desc
    limit 1
  );

  return true;
end;
$$;

revoke all on function public.mrpst_change_student_status(uuid,public.mrpst_student_status,date,text) from public;
grant execute on function public.mrpst_change_student_status(uuid,public.mrpst_student_status,date,text) to authenticated;
