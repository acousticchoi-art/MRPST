import {NextRequest,NextResponse} from "next/server";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import {getServerModuleAccess} from "@/lib/auth/server-access";
import {supabaseAnonKey,supabaseUrl,isSupabaseConfigured} from "@/lib/supabase/config";

export const dynamic="force-dynamic";
export const revalidate=0;

const allowedMethods=["GET","HEAD","POST","PATCH","PUT","DELETE"];
const requestHeaders=[
  "accept","content-type","prefer","accept-profile","content-profile",
  "range","range-unit","if-match","if-none-match","cache-control",
  "x-client-info","x-upsert","content-range","x-supabase-api-version",
  "x-supabase-client-platform","x-supabase-client-platform-version",
  "x-supabase-client-runtime","x-supabase-client-runtime-version"
];
const responseHeaders=[
  "content-type","content-range","accept-ranges","etag","last-modified",
  "preference-applied","content-profile","cache-control","location","retry-after"
];

async function proxy(request:NextRequest,{params}:{params:Promise<{path:string[]}>}){
  if(!isSupabaseConfigured)return NextResponse.json({error:"Supabase 서버 설정을 확인할 수 없습니다."},{status:503});
  const {path}=await params;
  const pathname="/"+(path??[]).join("/");
  const isAuthPath=pathname.startsWith("/auth/v1/");
  const isDataPath=pathname.startsWith("/rest/v1/")||pathname.startsWith("/functions/v1/");
  if(!isAuthPath&&!isDataPath)return NextResponse.json({error:"허용되지 않은 Supabase 경로입니다."},{status:404});
  if(!allowedMethods.includes(request.method))return NextResponse.json({error:"허용되지 않은 요청 방식입니다."},{status:405});

  const headers=new Headers();
  for(const name of requestHeaders){const value=request.headers.get(name);if(value)headers.set(name,value);}
  headers.set("apikey",supabaseAnonKey);

  if(isAuthPath){
    // Auth endpoints (password login, token refresh, recovery and logout) must be
    // reachable before a session exists. The anon key is public; no service key is forwarded.
    const authorization=request.headers.get("authorization");
    if(authorization)headers.set("Authorization",authorization);
  }else{
    const supabase=await createSupabaseServerClient();
    if(!supabase)return NextResponse.json({error:"로그인 연결을 확인할 수 없습니다."},{status:503});
    const {data:{user},error:userError}=await supabase.auth.getUser();
    if(userError||!user)return NextResponse.json({error:"로그인이 필요합니다."},{status:401});
    const {data:{session},error:sessionError}=await supabase.auth.getSession();
    if(sessionError||!session?.access_token)return NextResponse.json({error:"로그인 세션이 만료되었습니다. 다시 로그인해 주세요."},{status:401});
    headers.set("Authorization",`Bearer ${session.access_token}`);

    // Enforce module-level permissions for direct browser-side administrative writes.
    if(request.method!=="GET"&&request.method!=="HEAD"&&pathname.startsWith("/rest/v1/")){
      const parts=(path??[]);
      const resource=parts[2]??"";
      const tableModules:Record<string,string>={
        finance_donors:"finance",
        students:"students",
        student_academic_records:"students",
        academic_terms:"academics",
        academic_courses:"academics",
        academic_timetable_slots:"academics",
        academic_course_syllabi:"academics",
        academic_instructors:"academics",
        academic_teaching_assignments:"academics",
        academic_enrollments:"academics",
        academic_grades:"academics",
        facility_vehicles:"facilities",
        facility_maintenance:"facilities",
        facility_vehicle_logs:"facilities",
        library_books:"library",
        library_members:"library",
        meetings:"meetings",
        meeting_participants:"meetings",
        meeting_action_items:"meetings",
        meeting_materials:"meetings",
        user_module_permissions:"administration",
        departments:"administration",
        website_contents:"website"
      };
      const rpcModules:Record<string,string>={
        mrpst_create_journal:"finance",mrpst_update_journal_draft:"finance",
        mrpst_delete_journal_draft:"finance",mrpst_submit_journal:"finance",
        mrpst_approve_journal:"finance",mrpst_post_journal:"finance",mrpst_reject_journal:"finance",
        mrpst_create_budget:"finance",mrpst_update_budget_draft:"finance",
        mrpst_delete_budget_draft:"finance",mrpst_submit_budget:"finance",mrpst_approve_budget:"finance",
        mrpst_create_donation:"finance",mrpst_create_scholarship_award:"finance",
        mrpst_update_scholarship_award_draft:"finance",mrpst_delete_scholarship_award_draft:"finance",
        mrpst_submit_scholarship_award:"finance",mrpst_review_scholarship_award:"finance",
        mrpst_create_scholarship_disbursement:"finance",mrpst_refresh_scholarship_status:"finance",
        mrpst_copy_academic_timetable:"academics",
        mrpst_checkout_library_book:"library",mrpst_return_library_book:"library"
      };
      const targetModule=resource==="rpc"?(rpcModules[parts[3]??""]??null):(tableModules[resource]??null);
      if(targetModule){
        const access=await getServerModuleAccess(targetModule as import("@/lib/auth/permissions").ModuleKey);
        if(!access.ok)return NextResponse.json({error:access.error},{status:access.status});
        if(!access.canManage)return NextResponse.json({error:"이 메뉴의 등록·수정·삭제 권한이 없습니다."},{status:403});
      }
    }
  }

  try{
    const upstream=await fetch(`${supabaseUrl}${pathname}${request.nextUrl.search}`,{
      method:request.method,
      headers,
      body:request.method==="GET"||request.method==="HEAD"?undefined:await request.arrayBuffer(),
      cache:"no-store",
      redirect:"manual"
    });
    const outgoing=new Headers();
    for(const name of responseHeaders){const value=upstream.headers.get(name);if(value)outgoing.set(name,value);}
    outgoing.set("Cache-Control","no-store, max-age=0");
    return new NextResponse(upstream.body,{status:upstream.status,headers:outgoing});
  }catch(error:any){
    return NextResponse.json({error:error?.message||"Supabase 서버에 연결하지 못했습니다."},{status:502});
  }
}

export const GET=proxy;
export const HEAD=proxy;
export const POST=proxy;
export const PATCH=proxy;
export const PUT=proxy;
export const DELETE=proxy;
