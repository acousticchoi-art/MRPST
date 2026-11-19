-- Promotion batch creation accepts both legacy term codes (2026-1) and
-- extended term codes (2026-2027-1) by matching the academic_year and final term suffix.
create or replace function public.mrpst_create_student_promotion_batch(p_academic_year integer)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_batch_id uuid;
begin
  if not public.mrpst_can_manage_academics() then raise exception '진급 관리 권한이 없습니다.'; end if;
  if p_academic_year not between 2000 and 2200 then raise exception '학년도가 올바르지 않습니다.'; end if;

  if not exists(
    select 1 from public.academic_terms
    where academic_year=p_academic_year and substring(term_code from '([12])$')='1' and status='completed'
  ) or not exists(
    select 1 from public.academic_terms
    where academic_year=p_academic_year and substring(term_code from '([12])$')='2' and status='completed'
  ) then
    raise exception '해당 학년도의 1학기와 2학기가 모두 종료되어야 진급 명단을 만들 수 있습니다.';
  end if;

  insert into public.student_promotion_batches(academic_year,created_by)
  values(p_academic_year,auth.uid()) returning id into v_batch_id;

  insert into public.student_promotion_items(batch_id,student_id,student_number,student_name,from_cohort,to_cohort,decision)
  select v_batch_id,s.id,s.student_number,s.full_name,s.cohort,
    case when year_level<max_year then
      case year_level when 1 then 'Second Year' when 2 then 'Third Year' when 3 then 'Fourth Year' end
      else null end,
    case
      when year_level is null or max_year is null or year_level>max_year then 'needs_review'
      when year_level=max_year then 'graduation_review'
      else 'promote'
    end
  from (
    select st.*,
      case st.cohort when 'First Year' then 1 when 'Second Year' then 2 when 'Third Year' then 3 when 'Fourth Year' then 4 else null end as year_level,
      case
        when st.program_code='ece' then 2
        when st.program_code='mdiv' then 3
        when st.program_code='theology' and coalesce(st.program,'') ilike '%diploma%' then 2
        when st.program_code='theology' then 4
        else null
      end as max_year
    from public.students st where st.student_status='active'
  ) s;
  return v_batch_id;
exception when unique_violation then
  raise exception '해당 학년도의 진급 명단이 이미 생성되어 있습니다.';
end;
$$;
revoke all on function public.mrpst_create_student_promotion_batch(integer) from public;
grant execute on function public.mrpst_create_student_promotion_batch(integer) to authenticated;
