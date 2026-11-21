import {NextResponse} from "next/server";
import {getServerModuleAccess} from "@/lib/auth/server-access";

export const dynamic="force-dynamic";
export const revalidate=0;

const backupTables=[
  "departments","students","student_status_history","student_graduations",
  "academic_terms","academic_courses","academic_enrollments","academic_grades",
  "academic_course_syllabi","academic_instructors","academic_teaching_assignments",
  "academic_timetable_entries","academic_timetable_events","academic_calendar_events",
  "website_contents","user_profiles","user_roles","user_module_permissions","admin_audit_log",
  "facility_buildings","facility_inventory","facility_vehicles","facility_vehicle_logs","facility_maintenance",
  "library_books","library_members","library_loans","meetings","meeting_participants","meeting_action_items","meeting_materials",
  "finance_funds","finance_accounts","finance_budgets","finance_budget_lines","journal_entries","journal_lines",
  "finance_donors","donor_contributions","scholarship_awards","scholarship_disbursements"
] as const;

export async function GET(){
  const access=await getServerModuleAccess("administration");
  if(!access.ok)return NextResponse.json({error:access.error},{status:access.status});
  if(!access.roles.includes("super_admin"))return NextResponse.json({error:"최고 관리자만 운영 백업을 내려받을 수 있습니다."},{status:403});

  try{
    const tables:Record<string,unknown[]>={};
    for(const table of backupTables){
      const {data,error}=await access.supabase.from(table).select("*");
      if(error)throw new Error(`${table}: ${error.message}`);
      tables[table]=data??[];
    }
    const generatedAt=new Date().toISOString();
    const body=JSON.stringify({format:"mrpst-operational-backup",version:1,generated_at:generatedAt,tables},null,2);
    const filename=`mrpst-backup-${generatedAt.slice(0,10)}.json`;
    return new NextResponse(body,{headers:{"Content-Type":"application/json; charset=utf-8","Content-Disposition":`attachment; filename="${filename}"`,"Cache-Control":"no-store, max-age=0","X-Content-Type-Options":"nosniff"}});
  }catch(error:any){
    return NextResponse.json({error:error?.message||"운영 백업을 만들지 못했습니다."},{status:500});
  }
}
