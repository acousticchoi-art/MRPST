import {NextResponse} from "next/server";
import {getServerModuleAccess} from "@/lib/auth/server-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const access = await getServerModuleAccess("students");
  if (!access.ok) {
    return NextResponse.json({error:access.error},{status:access.status});
  }
  const {supabase} = access;

  const [students,enrollments,grades,scholarships,graduations] = await Promise.all([
    supabase.from("students")
      .select("id,auth_user_id,program_code,student_number,full_name,full_name_my,full_name_en,gender,date_of_birth,admission_year,program,cohort,student_status,phone,email,guardian_name,guardian_phone,notes,graduation_year,graduation_term,graduation_date,graduation_number")
      .order("student_number"),
    supabase.from("academic_enrollments")
      .select("id,student_id,course_id,term_id,enrollment_status,academic_courses(course_code,title,credits),academic_terms(academic_year,name,term_code)")
      .order("created_at",{ascending:false}),
    supabase.from("academic_grades")
      .select("id,student_id,course_id,term_id,score,grade,remarks,updated_at")
      .order("updated_at",{ascending:false}),
    supabase.rpc("mrpst_student_scholarship_history"),
    supabase.from("student_graduations").select("id,student_id,program_code,graduation_year,graduation_term,graduation_date,degree_name,graduation_number,honors,notes,approved_at").order("graduation_year",{ascending:false})
  ]);

  const gradeByEnrollment = new Map<string,any>();
  for (const grade of grades.data ?? []) {
    gradeByEnrollment.set(`${grade.student_id}|${grade.course_id}|${grade.term_id}`,grade);
  }
  const academicHistory = (enrollments.data ?? []).map((enrollment:any) => {
    const grade = gradeByEnrollment.get(`${enrollment.student_id}|${enrollment.course_id}|${enrollment.term_id}`);
    const course = Array.isArray(enrollment.academic_courses) ? enrollment.academic_courses[0] : enrollment.academic_courses;
    const term = Array.isArray(enrollment.academic_terms) ? enrollment.academic_terms[0] : enrollment.academic_terms;
    return {
      id:enrollment.id,
      student_id:enrollment.student_id,
      course_id:enrollment.course_id,
      term_id:enrollment.term_id,
      enrollment_status:enrollment.enrollment_status,
      academic_year:term?.academic_year ?? null,
      term:term?.name ?? term?.term_code ?? "학기 정보 없음",
      course_code:course?.course_code ?? null,
      course_name:course?.title ?? "과목 정보 없음",
      credits:course?.credits ?? null,
      score:grade?.score ?? null,
      grade:grade?.grade ?? null,
      remarks:grade?.remarks ?? null,
      grade_updated_at:grade?.updated_at ?? null
    };
  });

  return NextResponse.json({
    students:{data:students.data ?? [],error:students.error?.message ?? null},
    grades:{data:academicHistory,error:enrollments.error?.message ?? grades.error?.message ?? null},
    scholarships:{data:scholarships.data ?? [],error:scholarships.error?.message ?? null},
    graduations:{data:graduations.data ?? [],error:graduations.error?.message ?? null}
  },{headers:{"Cache-Control":"no-store, max-age=0"}});
}
