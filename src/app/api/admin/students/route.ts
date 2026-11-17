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

  const [students,grades,scholarships] = await Promise.all([
    supabase.from("students")
      .select("id,auth_user_id,program_code,student_number,full_name,full_name_my,full_name_en,gender,date_of_birth,admission_year,program,cohort,student_status,phone,email,guardian_name,guardian_phone,notes")
      .order("student_number"),
    supabase.from("academic_grades")
      .select("id,student_id,score,grade,remarks,academic_courses(course_code,title,credits),academic_terms(academic_year,name,term_code)")
      .order("updated_at",{ascending:false}),
    supabase.rpc("mrpst_student_scholarship_history")
  ]);

  return NextResponse.json({
    students:{data:students.data ?? [],error:students.error?.message ?? null},
    grades:{data:grades.data ?? [],error:grades.error?.message ?? null},
    scholarships:{data:scholarships.data ?? [],error:scholarships.error?.message ?? null}
  },{headers:{"Cache-Control":"no-store, max-age=0"}});
}
