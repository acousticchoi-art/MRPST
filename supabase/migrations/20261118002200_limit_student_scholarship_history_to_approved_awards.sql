-- Student-facing scholarship history should include only approved awards.
-- Draft, submitted, and rejected proposals are not part of a student's confirmed record.
CREATE OR REPLACE FUNCTION public.mrpst_student_scholarship_history()
RETURNS TABLE(
  award_id uuid,
  student_id uuid,
  academic_year integer,
  scholarship_name text,
  base_amount numeric,
  paid_amount numeric,
  remaining_amount numeric,
  status text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT public.mrpst_can_view_student_records() THEN
    RAISE EXCEPTION 'Student record permission required';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.student_id,
    a.academic_year,
    a.scholarship_name,
    a.base_amount,
    COALESCE(SUM(CASE WHEN j.status = 'posted' THEN d.base_amount ELSE 0 END), 0)::numeric(18,2),
    (a.base_amount - COALESCE(SUM(CASE WHEN j.status = 'posted' THEN d.base_amount ELSE 0 END), 0))::numeric(18,2),
    a.status::text
  FROM public.scholarship_awards a
  LEFT JOIN public.scholarship_disbursements d ON d.award_id = a.id
  LEFT JOIN public.journal_entries j ON j.id = d.journal_entry_id
  WHERE a.status IN ('approved', 'completed')
  GROUP BY a.id
  ORDER BY a.academic_year DESC, a.created_at DESC;
END;
$function$;

REVOKE ALL ON FUNCTION public.mrpst_student_scholarship_history() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mrpst_student_scholarship_history() TO authenticated;
