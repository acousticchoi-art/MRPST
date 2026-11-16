import {NextResponse} from "next/server";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import {canAccessModule,type MrpstRole} from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({error:"Supabase 서버 연결 설정을 확인할 수 없습니다."},{status:503});
  }

  const {data:{user},error:userError} = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({error:"로그인이 필요합니다."},{status:401});
  }

  const [{data:roleRows,error:roleError},{data:profile},{data:permissions}] = await Promise.all([
    supabase.from("user_roles").select("role, department_id").eq("user_id",user.id),
    supabase.from("user_profiles").select("is_active").eq("user_id",user.id).maybeSingle(),
    supabase.from("user_module_permissions").select("module_key,can_view").eq("user_id",user.id)
  ]);

  const roles = (roleRows ?? []).map(row => row.role as MrpstRole);
  if (roleError || !roleRows?.length || profile?.is_active !== true ||
      !canAccessModule(roles,"students",permissions ?? [])) {
    return NextResponse.json({error:"학생 관리 메뉴에 접근할 권한이 없습니다."},{status:403});
  }

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
