import {NextRequest,NextResponse} from "next/server";
import {getServerModuleAccess} from "@/lib/auth/server-access";
import type {ModuleKey} from "@/lib/auth/permissions";

export const dynamic="force-dynamic";
export const revalidate=0;

type QueryResult={data:any;error:string|null};
async function result(query:PromiseLike<{data:any;error:any}>):Promise<QueryResult>{
  const {data,error}=await query;
  return {data:data??null,error:error?.message??null};
}

export async function GET(request:NextRequest,{params}:{params:Promise<{module:string}>}){
  const {module}=await params;
  const moduleKey=module as ModuleKey;
  const allowed:ModuleKey[]=["finance","students","academics","facilities","library","meetings","administration","website"];
  if(!allowed.includes(moduleKey))return NextResponse.json({error:"지원하지 않는 관리 메뉴입니다."},{status:404});

  const access=await getServerModuleAccess(moduleKey);
  if(!access.ok)return NextResponse.json({error:access.error},{status:access.status});
  const {supabase,roles}=access;

  const search=request.nextUrl.searchParams;
  const from=search.get("from")||"2000-01-01";
  const to=search.get("to")||"2100-12-31";
  const id=search.get("id");

  try{
    let data:any={};
    if(moduleKey==="finance"&&search.get("scope")==="award-purpose"){
      const awardId=search.get("id");
      if(!awardId)return NextResponse.json({error:"장학금 ID가 필요합니다."},{status:400});
      const purpose=await result(supabase.from("scholarship_awards").select("purpose").eq("id",awardId).single());
      return NextResponse.json({purpose},{headers:{"Cache-Control":"no-store, max-age=0"}});
    }
    if(moduleKey==="facilities"&&search.get("scope")==="vehicle-latest"){
      const vehicleId=search.get("vehicle_id");
      if(!vehicleId)return NextResponse.json({error:"차량 ID가 필요합니다."},{status:400});
      const latest=await result(supabase.from("facility_vehicle_logs").select("ending_odometer").eq("vehicle_id",vehicleId).order("trip_date",{ascending:false}).order("created_at",{ascending:false}).limit(1));
      return NextResponse.json({latest},{headers:{"Cache-Control":"no-store, max-age=0"}});
    }
    if(moduleKey==="finance"){
      const keys=["funds","accounts","entries","donors","budgets","actuals","donations","students","awards","disbursements"] as const;
      const queries=[
        supabase.from("finance_funds").select("id,code,name_ko,name_en").eq("is_active",true).order("code"),
        supabase.from("finance_accounts").select("id,code,name_ko,name_en,account_type").eq("is_active",true).order("code"),
        supabase.from("journal_entries").select("id,entry_no,entry_date,description,status,fund_id,reference_no,journal_lines(account_id,description,debit,credit)").order("entry_date",{ascending:false}).limit(300),
        supabase.from("finance_donors").select("id,donor_code,display_name,donor_type,phone,email,country").eq("is_active",true).order("display_name"),
        supabase.from("finance_budgets").select("id,fiscal_year,title,fund_id,status,finance_budget_lines(id,account_id,planned_amount,notes,finance_accounts(code,name_ko,name_en))").order("fiscal_year",{ascending:false}),
        supabase.from("finance_budget_vs_actual").select("*"),
        supabase.from("donor_contributions").select("id,contribution_date,purpose,original_currency,original_amount,exchange_rate,base_amount,donor_id,fund_id,journal_entry_id").order("contribution_date",{ascending:false}).limit(300),
        supabase.from("students").select("id,student_number,full_name,program,cohort,admission_year,student_status").order("student_number"),
        supabase.from("scholarship_award_balances").select("*").order("academic_year",{ascending:false}),
        supabase.from("scholarship_disbursements").select("id,award_id,installment_no,paid_date,original_currency,original_amount,exchange_rate,base_amount,journal_entry_id").order("paid_date",{ascending:false})
      ];
      const values=await Promise.all(queries.map(result));
      keys.forEach((key,index)=>data[key]=values[index]);
      data.canApprove=roles.some(role=>["super_admin","administrator"].includes(role));
      if(search.get("scope")==="reports"){
        const reports=await Promise.all([
          result(supabase.from("finance_monthly_income_expense").select("*").gte("month",from).lte("month",to).order("month")),
          result(supabase.from("finance_fund_account_balances").select("*").order("fund_code").order("account_code")),
          result(supabase.from("finance_donor_contribution_report").select("*").gte("contribution_date",from).lte("contribution_date",to).order("contribution_date",{ascending:false})),
          result(supabase.from("finance_scholarship_disbursement_report").select("*").gte("paid_date",from).lte("paid_date",to).order("paid_date",{ascending:false})),
          result(supabase.from("finance_general_ledger").select("*").gte("entry_date",from).lte("entry_date",to).order("entry_date").order("entry_no").range(0,4999))
        ]);
        ["monthlyReports","fundBalanceReports","donorReports","scholarshipReports","ledgerReports"].forEach((key,index)=>data[key]=reports[index]);
      }
    }else if(moduleKey==="academics"){
      const keys=["terms","courses","departments","students","enrol","slots","grades","syllabi","instructors","teachingAssignments","timetableEntries","timetableEvents"] as const;
      const queries=[
        supabase.from("academic_terms").select("*").order("academic_year",{ascending:false}),
        supabase.from("academic_courses").select("*").order("course_code"),
        supabase.from("departments").select("id,code,name_en,name_my,name_ko,is_active").eq("is_active",true).order("code"),
        supabase.from("students").select("id,student_number,full_name,student_status").order("full_name"),
        supabase.from("academic_enrollments").select("*").order("created_at",{ascending:false}),
        supabase.from("academic_timetable_slots").select("*").order("day_of_week").order("period_no"),
        supabase.from("academic_grades").select("*").order("updated_at",{ascending:false}),
        supabase.from("academic_course_syllabi").select("*").order("updated_at",{ascending:false}),
        supabase.from("academic_instructors").select("*").order("full_name"),
        supabase.from("academic_teaching_assignments").select("*").order("created_at",{ascending:false}),
        supabase.from("academic_timetable_entries").select("*").eq("is_active",true).order("term_id").order("department_id").order("day_of_week").order("start_time"),
        supabase.from("academic_timetable_events").select("*").order("term_id").order("department_id").order("day_of_week").order("start_time")
      ];
      const values=await Promise.all(queries.map(result));
      keys.forEach((key,index)=>data[key]=values[index]);
      data.canManage=roles.some(role=>["super_admin","administrator","academic_officer"].includes(role));
    }else if(moduleKey==="administration"){
      const [p,d,l]=await Promise.all([
        result(supabase.from("user_profiles").select("user_id,full_name,email,preferred_locale,is_active,created_at").order("created_at",{ascending:false})),
        result(supabase.from("departments").select("*").order("code")),
        result(supabase.from("admin_audit_log").select("*").order("created_at",{ascending:false}).limit(100))
      ]);
      let roleData:QueryResult={data:[],error:null},permissionData:QueryResult={data:[],error:null};
      const ids=(p.data??[]).map((row:any)=>row.user_id);
      if(ids.length){
        [roleData,permissionData]=await Promise.all([
          result(supabase.from("user_roles").select("id,user_id,role,department_id").in("user_id",ids)),
          result(supabase.from("user_module_permissions").select("user_id,module_key,can_view,can_manage").in("user_id",ids))
        ]);
      }
      data={profiles:p,departments:d,auditLogs:l,roles:roleData,permissions:permissionData};
    }else if(moduleKey==="facilities"){
      const keys=["buildings","items","vehicles","repairs","logs"] as const;
      const queries=[
        supabase.from("facility_buildings").select("*").order("name"),
        supabase.from("facility_inventory").select("*").order("name"),
        supabase.from("facility_vehicles").select("*").order("vehicle_code"),
        supabase.from("facility_maintenance").select("*").order("reported_date",{ascending:false}),
        supabase.from("facility_vehicle_logs").select("*").order("trip_date",{ascending:false})
      ];
      const values=await Promise.all(queries.map(result));
      keys.forEach((key,index)=>data[key]=values[index]);
    }else if(moduleKey==="library"){
      const keys=["books","members","loans","students"] as const;
      const queries=[
        supabase.from("library_books").select("id,isbn,title,author,publisher,publication_year,category,language,shelf_location,total_copies,description,created_at").order("title"),
        supabase.from("library_members").select("id,member_number,full_name,member_type,phone,email,department,student_id,is_active").eq("is_active",true).order("full_name"),
        supabase.from("library_loans").select("id,book_id,member_id,checkout_date,due_date,returned_at,status,book:library_books(id,title,isbn,author),member:library_members(id,member_number,full_name,member_type)").order("checkout_date",{ascending:false}),
        supabase.from("students").select("id,student_number,full_name,program,program_code,cohort,phone,email,student_status").eq("student_status","active").order("student_number")
      ];
      const values=await Promise.all(queries.map(result));
      keys.forEach((key,index)=>data[key]=values[index]);
    }else if(moduleKey==="meetings"){
      if(id){
        const [participants,actions,materials,meeting]=await Promise.all([
          result(supabase.from("meeting_participants").select("*").eq("meeting_id",id).order("full_name")),
          result(supabase.from("meeting_action_items").select("*").eq("meeting_id",id).order("created_at",{ascending:false})),
          result(supabase.from("meeting_materials").select("*").eq("meeting_id",id).order("created_at",{ascending:false})),
          result(supabase.from("meetings").select("*").eq("id",id).single())
        ]);
        data={participants,actions,materials,meeting};
      }else data.meetings=await result(supabase.from("meetings").select("*").order("meeting_date",{ascending:false}));
    }else if(moduleKey==="website"){
      data.items=await result(supabase.from("website_contents").select("*").order("sort_order").order("updated_at",{ascending:false}));
    }

    return NextResponse.json(data,{headers:{"Cache-Control":"no-store, max-age=0"}});
  }catch(error:any){
    return NextResponse.json({error:error?.message||"데이터 조회 중 오류가 발생했습니다."},{status:500});
  }
}
