import {NextRequest,NextResponse} from "next/server";
import {getServerModuleAccess} from "@/lib/auth/server-access";

export const dynamic="force-dynamic";
export const revalidate=0;
export const runtime="nodejs";
export const maxDuration=60;

const backupTables=[
  "academic_calendar_events","academic_class_sessions","academic_course_syllabi","academic_courses",
  "academic_enrollments","academic_grades","academic_instructors","academic_teaching_assignments",
  "academic_terms","academic_timetable_entries","academic_timetable_events","academic_timetable_slots",
  "departments","donor_contributions","facility_buildings","facility_inventory","facility_maintenance",
  "facility_vehicle_logs","facility_vehicles","finance_accounts","finance_budget_lines","finance_budgets",
  "finance_donors","finance_funds","finance_periods","journal_entries","journal_lines",
  "library_books","library_loans","library_members","meeting_action_items","meeting_materials",
  "meeting_participants","meetings","scholarship_awards","scholarship_disbursements","student_academic_records",
  "student_graduations","student_promotion_batches","student_promotion_items","student_status_history",
  "student_term_enrollments","students","website_contents"
] as const;
const privateHeaders={"Cache-Control":"private, no-store, max-age=0","Pragma":"no-cache","X-Content-Type-Options":"nosniff","X-Robots-Tag":"noindex, nofollow"};
const failure=(code:string,status:number)=>NextResponse.json({error:code},{status,headers:privateHeaders});
type Row=Record<string,unknown>;

// Signed-in user, existing RLS; no service-role key or new database privileges.
export async function POST(request:NextRequest){
  if(request.headers.get("x-mrpst-backup")!=="1" || request.headers.get("sec-fetch-site")==="cross-site")return failure("invalid_request",403);
  const access=await getServerModuleAccess("administration");
  if(!access.ok)return failure(access.status===401?"login_required":"access_denied",access.status);
  if(!access.roles.includes("super_admin"))return failure("access_denied",403);
  const {supabase}=access;
  const startedAt=new Date().toISOString();
  const tables:Record<string,Row[]>={};
  const rowCounts:Record<string,number>={};
  // Conservative cap for a buffered Vercel response. Never send a partial backup.
  const maxBytes=3_800_000;
  let dataBytes=0;
  async function readTable(table:typeof backupTables[number]){
    const rows:Row[]=[];
    let cursor:string|number|undefined,expected:number|null=null;
    const ids=new Set<string|number>();
    while(true){
      let query=supabase.from(table).select("*",{count:"exact"}).order("id",{ascending:true}).limit(500);
      if(cursor!==undefined)query=query.gt("id",cursor);
      const {data,error,count}=await query;
      if(error||!Array.isArray(data)||typeof count!=="number")throw Error("read_failed");
      if(expected===null)expected=count;
      if(count!==expected-rows.length||count>50000||data.length>count)throw Error("data_changed");
      for(const row of data as Row[]){
        const id=row.id;
        if((typeof id!=="string"&&typeof id!=="number")||ids.has(id))throw Error("read_failed");
        ids.add(id);cursor=id;
        dataBytes+=Buffer.byteLength(JSON.stringify(row),"utf8")+1;
        if(dataBytes>maxBytes)throw Error("backup_too_large");
        rows.push(row);
      }
      if(rows.length===expected)break;
      if(data.length===0)throw Error("read_failed");
    }
    const {count,error}=await supabase.from(table).select("id",{head:true,count:"exact"});
    if(error||count!==rows.length)throw Error("data_changed");
    return rows;
  }
  try{
    for(let i=0;i<backupTables.length;i+=5){
      const batch=backupTables.slice(i,i+5);
      const result=await Promise.all(batch.map(readTable));
      batch.forEach((table,j)=>{tables[table]=result[j];rowCounts[table]=result[j].length;});
    }
    const generated_at=new Date().toISOString();
    const body=JSON.stringify({
      format:"mrpst-operational-backup",version:2,generated_at,started_at:startedAt,
      scope:"selected business tables visible to the signed-in super administrator; not a database or authentication backup",
      consistent_snapshot:false,
      exclusions:["auth schema and credentials","account profiles and role assignments","authentication tokens","registration requests","audit logs","database schema and settings","storage file objects"],
      table_count:backupTables.length,row_counts:rowCounts,tables
    });
    if(Buffer.byteLength(body,"utf8")>maxBytes)return failure("backup_too_large",413);
    const stamp=generated_at.replace(/[:.]/g,"-");
    return new NextResponse(body,{headers:{...privateHeaders,"Content-Type":"application/json; charset=utf-8","Content-Disposition":`attachment; filename="mrpst-backup-${stamp}.json"`}});
  }catch(error){
    const code=error instanceof Error?error.message:"read_failed";
    return failure(code==="backup_too_large"?code:code==="data_changed"?code:"read_failed",code==="backup_too_large"?413:code==="data_changed"?409:500);
  }
}
