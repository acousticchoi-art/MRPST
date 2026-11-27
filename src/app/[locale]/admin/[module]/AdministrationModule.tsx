"use client";
import {englishDisplay} from "@/lib/english-display";

import AdminModuleHeading from "./AdminModuleHeading";
import BackupRestorePanel from "./BackupRestorePanel";

import {useCallback,useEffect,useMemo,useState} from "react";
import {FormField,SearchSelect} from "./AdminUI";
import {usePathname} from "next/navigation";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";
import {canAccessModule,type MrpstRole} from "@/lib/auth/permissions";
type UserRole={id:string;role:string;department_id:string|null};
type UserModulePermission={module_key:string;can_view:boolean;can_manage:boolean};
type P={user_id:string;full_name:string;email:string|null;preferred_locale:string;is_active:boolean;created_at:string;roles:UserRole[];permissions:UserModulePermission[]};
type D={id:string;code:string;name_en:string;name_my:string|null;name_ko:string|null;is_active:boolean};
const roles=["super_admin","administrator","finance_officer","academic_officer","student_officer","librarian","facility_manager","faculty","staff","student"];
const names:Record<string,string>={super_admin:"최고 관리자",administrator:"관리자",finance_officer:"재정 담당",academic_officer:"학사 담당",student_officer:"학생 담당",librarian:"도서관 담당",facility_manager:"시설 담당",faculty:"교수",staff:"직원",student:"학생"};
const pageOptions=[
 {key:"finance",title:"재정 관리",description:"회계, 예산, 후원금 및 지출"},
 {key:"students",title:"학생 관리",description:"학생 정보, 학적 및 장학"},
 {key:"academics",title:"학사 관리",description:"학과, 과목, 시간표 및 성적"},
 {key:"facilities",title:"시설 관리",description:"건물, 비품, 차량 및 유지보수"},
 {key:"library",title:"도서관 관리",description:"도서 목록, 대출 및 반납"},
 {key:"meetings",title:"회의 자료",description:"교수회 및 각종 회의 자료"},
 {key:"website",title:"홈페이지 관리",description:"학교 소개, 공지 및 홈페이지 콘텐츠"},
 {key:"administration",title:"계정·권한 관리",description:"일반 계정 관리"}
] as const;
const manageRolesByPage:Record<string,string[]>={
 finance:["finance_officer"],students:["student_officer","academic_officer"],academics:["academic_officer"],
 facilities:["facility_manager"],library:["librarian"],meetings:["academic_officer","faculty","staff"],website:["administrator"]
};
function hasRoleManageAccess(userRoles:UserRole[],moduleKey:string){
 return userRoles.some(userRole=>userRole.role==="super_admin"||userRole.role==="administrator"||(manageRolesByPage[moduleKey]||[]).includes(userRole.role));
}
const rolePageGuide:Record<string,{en:[string,string];my:[string,string]}>={
 finance:{en:["Financial management","Accounting, budgets, donations and expenses"],my:["ဘဏ္ဍာရေးစီမံခန့်ခွဲမှု","စာရင်းကိုင်၊ ဘတ်ဂျက်၊ အလှူငွေနှင့် အသုံးစရိတ်"]},
 students:{en:["Student management","Student records, enrollment status and scholarships"],my:["ကျောင်းသားစီမံခန့်ခွဲမှု","ကျောင်းသားမှတ်တမ်း၊ ကျောင်းသားအခြေအနေနှင့် ပညာသင်ဆု"]},
 academics:{en:["Academic management","Departments, courses, timetables and grades"],my:["ပညာရေးစီမံခန့်ခွဲမှု","ဌာန၊ ဘာသာရပ်၊ အချိန်ဇယားနှင့် အမှတ်စာရင်း"]},
 facilities:{en:["Facilities management","Buildings, equipment, vehicles and maintenance"],my:["အဆောက်အအုံနှင့် ပစ္စည်းစီမံခန့်ခွဲမှု","အဆောက်အအုံ၊ ပစ္စည်း၊ ယာဉ်နှင့် ပြုပြင်ထိန်းသိမ်းမှု"]},
 library:{en:["Library management","Book catalogue, loans and returns"],my:["စာကြည့်တိုက်စီမံခန့်ခွဲမှု","စာအုပ်စာရင်း၊ ငှားရမ်းခြင်းနှင့် ပြန်အပ်ခြင်း"]},
 meetings:{en:["Meeting records","Faculty and staff meeting records and documents"],my:["အစည်းအဝေးမှတ်တမ်းများ","ဆရာ၊ ဆရာမနှင့် ဝန်ထမ်း အစည်းအဝေးမှတ်တမ်းနှင့် စာရွက်စာတမ်းများ"]},
 website:{en:["Website management","School information, notices and website content"],my:["ဝဘ်ဆိုက်စီမံခန့်ခွဲမှု","ကျောင်းအကြောင်း၊ ကြေညာချက်နှင့် ဝဘ်ဆိုက်အကြောင်းအရာ"]},
 administration:{en:["Accounts & permissions","Ordinary staff account creation, role and page permissions"],my:["အကောင့်နှင့် ခွင့်ပြုချက်စီမံခန့်ခွဲမှု","ဝန်ထမ်းအကောင့်ဖွင့်ခြင်း၊ တာဝန်နှင့် စာမျက်နှာခွင့်ပြုချက် သတ်မှတ်ခြင်း"]}
};
function RoleAccessGuide({role,locale}:{role:string;locale:"ko"|"my"|"en"}){
 const pages=pageOptions.filter(option=>canAccessModule([role as MrpstRole],option.key));
 const t=locale==="my"?{heading:"ရွေးချယ်ထားသော တာဝန်၏ မူလခွင့်ပြုချက်များ",view:"ကြည့်ရှုရန်သာ",manage:"ကြည့်ရှုခြင်းနှင့် စီမံခြင်း",note:"သီးခြားသတ်မှတ်ထားသော စာမျက်နှာခွင့်ပြုချက်များနှင့် လက်ရှိတာဝန်များကြောင့် အမှန်တကယ် ဝင်ရောက်ခွင့် ကွာခြားနိုင်ပါသည်။",admin:"အမြင့်ဆုံး စီမံခန့်ခွဲသူ၏ သီးသန့်လုပ်ဆောင်ချက်များ မပါဝင်ပါ။"}:locale==="en"?{heading:"Default permissions for the selected role",view:"View only",manage:"View and manage",note:"Actual access may differ because of other assigned roles and individual page settings.",admin:"Super Administrator-only functions are excluded."}:{heading:"선택한 역할의 기본 권한",view:"조회만 가능",manage:"조회·관리",note:"기존 역할 및 개별 페이지 설정에 따라 실제 접근 권한은 달라질 수 있습니다.",admin:"최고 관리자 전용 기능은 제외됩니다."};
 return <div data-no-translate aria-live="polite" className="settings-form-hint" style={{marginTop:10,padding:12,border:"1px solid var(--line, #d8dfe5)",borderRadius:8,overflowWrap:"anywhere"}}>
  <strong>{t.heading}</strong>
  <ul style={{paddingInlineStart:18,margin:"8px 0",display:"grid",gap:6}}>{pages.map(option=>{
   const details=locale==="ko"?[option.title,option.key==="administration"?"일반 직원 계정 등록·역할 및 페이지 권한 설정":option.description]:rolePageGuide[option.key][locale];
   const manage=option.key==="administration"?role==="administrator"||role==="super_admin":role==="administrator"||role==="super_admin"||(manageRolesByPage[option.key]||[]).includes(role);
   return <li key={option.key}><strong>{details[0]}</strong> · {manage?t.manage:t.view}<br/>{details[1]}</li>;
  })}</ul>
  {role==="administrator"&&<p style={{margin:"6px 0"}}>{t.admin}</p>}
  <small>{t.note}</small>
 </div>;
}
function effectivePageKeys(user:P,roleOnly=false){
 return pageOptions.filter(option=>canAccessModule(user.roles.map(r=>r.role as MrpstRole),option.key,roleOnly?undefined:user.permissions)).map(option=>option.key);
}
export default function AdministrationModule({isSuperAdmin,callerId,delegableModuleKeys}:{isSuperAdmin:boolean;callerId:string;delegableModuleKeys:string[]}){
 const pathnameForDates=usePathname();
 const englishUI=pathnameForDates.startsWith("/en/");
 const useMyanmarLocale=pathnameForDates.startsWith("/my/");
 const pathname=usePathname();
 const locale=pathname.startsWith("/en/")?"en":pathname.startsWith("/my/")?"my":"ko";
 const db=useMemo(()=>createSupabaseBrowserClient(),[]);
 const [users,setUsers]=useState<P[]>([]),[deps,setDeps]=useState<D[]>([]),[logs,setLogs]=useState<any[]>([]);
 const depName=(d:D|undefined)=>locale==="en"?(d?.name_en||d?.name_ko||d?.name_my||""):locale==="my"?(d?.name_my||d?.name_en||d?.name_ko||""):(d?.name_ko||d?.name_en||d?.name_my||"");
 const [tab,setTab]=useState("users"),[search,setSearch]=useState(""),[statusFilter,setStatusFilter]=useState("all");
 const [auditSearch,setAuditSearch]=useState(""),[auditActionFilter,setAuditActionFilter]=useState("all");
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [selectedId,setSelectedId]=useState(""),[fullName,setFullName]=useState(""),[preferredLocale,setPreferredLocale]=useState("ko"),[role,setRole]=useState("staff"),[depId,setDepId]=useState("");
 const [newDep,setNewDep]=useState({code:"",name_en:"",name_my:"",name_ko:""}),[depOpen,setDepOpen]=useState(false),[editingDepId,setEditingDepId]=useState("");
 const [createOpen,setCreateOpen]=useState(false),[createError,setCreateError]=useState(""),[newUser,setNewUser]=useState({full_name:"",email:"",password:"",preferred_locale:"ko",role:"staff",department_id:""}),[newPassword,setNewPassword]=useState("");
 const [selectedPageKeys,setSelectedPageKeys]=useState<string[]>([]);
 const [newPageOverrides,setNewPageOverrides]=useState<Record<string,boolean>>({});
 const newPageOptions=pageOptions.filter(option=>option.key!=="administration"||(isSuperAdmin&&newUser.role==="administrator"));
 const newPageKeys=newPageOptions.filter(option=>(isSuperAdmin||delegableModuleKeys.includes(option.key))&&(newPageOverrides[option.key]??canAccessModule([newUser.role as MrpstRole],option.key))).map(option=>option.key);
 const [backupBusy,setBackupBusy]=useState(false),[backupStatus,setBackupStatus]=useState(""),[backupFailed,setBackupFailed]=useState(false);
 const backupText=locale==="en"?{
 title:"Business data backup",tab:"Data backup",description:"Download student, academic, finance, library, facilities, meeting and website records as one JSON file.",restricted:"Super Administrator only",warning:"This is a manual, unencrypted business-data export, not a full database or account backup. Store it privately, not in a public or link-shared Drive folder. Back up before bulk changes and preferably after each working day.",download:"Download backup",working:"Preparing backup…",done:"Backup file prepared for download. Keep it in a secure location.",failed:"Backup failed. No partial file was saved. Please try again.",size:"Backup exceeds the download size limit. No partial file was saved.",changed:"Records changed during the export. Please retry when no one is editing.",denied:"Please sign in as an active Super Administrator."
 }:locale==="my"?{
 title:"လုပ်ငန်းဒေတာ အရန်ကူးယူခြင်း",tab:"အရန်ကူးယူခြင်း",description:"ကျောင်းသား၊ ပညာရေး၊ ဘဏ္ဍာရေး၊ စာကြည့်တိုက်၊ အဆောက်အအုံ၊ အစည်းအဝေးနှင့် ဝဘ်ဆိုက်ဒေတာကို JSON ဖိုင်တစ်ခုအဖြစ် ရယူပါ။",restricted:"အမြင့်ဆုံး စီမံခန့်ခွဲသူအတွက်သာ",warning:"ဤဖိုင်သည် လုပ်ငန်းဒေတာ အရန်ဖိုင်သာဖြစ်ပြီး စကားဝှက်ဖြင့် ကာကွယ်ထားခြင်း မရှိပါ။ သီးသန့်နေရာတွင် သိမ်းဆည်းပါ။ အများသုံး Drive ဖိုင်တွဲတွင် မတင်ပါနှင့်။ ဒေတာအများအပြား မပြင်ဆင်မီနှင့် နေ့စဉ်လုပ်ငန်းပြီးနောက် အရန်ကူးပါ။",download:"အရန်ဖိုင် ရယူရန်",working:"အရန်ဖိုင် ပြင်ဆင်နေသည်…",done:"အရန်ဖိုင် ရယူနိုင်ပါပြီ။ လုံခြုံသောနေရာတွင် သိမ်းဆည်းပါ။",failed:"အရန်ကူးယူ၍ မရပါ။ ထပ်မံကြိုးစားပါ။",size:"ဖိုင်အရွယ်အစား ကန့်သတ်ချက် ကျော်လွန်နေပါသည်။",changed:"ဒေတာ ပြောင်းလဲနေပါသည်။ ပြင်ဆင်နေသူမရှိချိန်တွင် ပြန်ကြိုးစားပါ။",denied:"အမြင့်ဆုံး စီမံခန့်ခွဲသူအဖြစ် ဝင်ရောက်ပါ။"
 }:{
 title:"업무 데이터 백업",tab:"운영 백업",description:"학생·학사·재정·도서관·시설·회의·홈페이지 자료를 JSON 파일 하나로 내려받습니다.",restricted:"최고 관리자 전용",warning:"암호화되지 않은 수동 업무자료 백업이며 전체 DB·계정 복구용은 아닙니다. 개인 정보가 포함되므로 공개 또는 링크 공유 Drive에 올리지 말고 비공개 장소에 보관하세요. 대량 수정 전과 가급적 매일 업무 종료 후 백업하세요.",download:"백업 내려받기",working:"백업 파일 준비 중…",done:"백업 파일 다운로드를 시작했습니다. 안전한 곳에 보관하세요.",failed:"백업에 실패했습니다. 일부 파일은 저장하지 않았습니다. 다시 시도해 주세요.",size:"백업 파일이 다운로드 용량 한도를 초과했습니다. 일부 파일은 저장하지 않았습니다.",changed:"조회 중 데이터가 변경되었습니다. 다른 사용자가 수정하지 않는 시간에 다시 시도해 주세요.",denied:"활성 최고 관리자 계정으로 로그인해 주세요."
 };
 async function downloadBackup(){
  if(!isSuperAdmin||backupBusy)return;
  setBackupBusy(true);setBackupStatus("");setBackupFailed(false);
  try{
   const response=await fetch("/api/admin/backup",{method:"POST",cache:"no-store",credentials:"same-origin",headers:{"x-mrpst-backup":"1",Accept:"application/json"}});
   if(!response.ok){
    const body=await response.json().catch(()=>null);
    throw new Error(response.status===401||response.status===403?backupText.denied:body?.error==="backup_too_large"?backupText.size:body?.error==="data_changed"?backupText.changed:backupText.failed);
   }
   const body=await response.json();
   if(body?.format!=="mrpst-operational-backup"||body?.version!==2||body?.table_count!==44||!body.tables||!body.row_counts||Object.keys(body.tables).length!==44||!Object.entries(body.tables).every(([key,rows])=>Array.isArray(rows)&&rows.length===body.row_counts[key]))throw new Error(backupText.failed);
   const blob=new Blob([JSON.stringify(body)],{type:"application/json;charset=utf-8"});
   const url=URL.createObjectURL(blob),link=document.createElement("a");
   link.href=url;link.download="mrpst-backup-"+new Date().toISOString().replace(/[:.]/g,"-")+".json";
   document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
   setBackupStatus(backupText.done);
  }catch(e){setBackupFailed(true);setBackupStatus(e instanceof Error&&Object.values(backupText).includes(e.message)?e.message:backupText.failed);}
  finally{setBackupBusy(false);}
 }

 const selected=users.find(x=>x.user_id===selectedId)||null;
 const effectiveKeys=useMemo(()=>selected?effectivePageKeys(selected):[],[selected]);
 const defaultKeys=useMemo(()=>selected?effectivePageKeys(selected,true):[],[selected]);
 useEffect(()=>{setSelectedPageKeys(effectiveKeys);},[effectiveKeys]);
 const canEditSelected=isSuperAdmin||Boolean(selected&&selected.user_id!==callerId&&!selected.roles.some(r=>r.role==="super_admin"||r.role==="administrator"));
 const studentOnly=Boolean(selected?.roles.length&&selected.roles.every(r=>r.role==="student"));
 const canEditPagePermissions=Boolean(selected&&!selected.roles.some(r=>r.role==="super_admin")&&canEditSelected);
 const canDelegatePage=(key:string)=>isSuperAdmin||delegableModuleKeys.includes(key);
 const assignableRoles=roles.filter(r=>r!=="super_admin"&&r!=="student"&&(isSuperAdmin||r!=="administrator"));
 const load=useCallback(async()=>{setLoading(true);setError("");try{
  const response=await fetch("/api/admin/data/administration",{cache:"no-store",credentials:"same-origin",headers:{Accept:"application/json"}});
  const invalidResponse=englishUI?"Invalid server response. Please try again.":locale==="my"?"ဆာဗာမှ အချက်အလက် မှန်ကန်စွာ မရရှိပါ။ ထပ်မံကြိုးစားပါ။":"서버 응답이 올바르지 않습니다. 다시 시도해 주세요.";
  const data=await response.json().catch(()=>{throw new Error(invalidResponse);});
  if(!response.ok)throw new Error(data?.error||(englishUI?`Unable to load users and permissions (HTTP ${response.status})`:locale==="my"?`အသုံးပြုသူနှင့် ခွင့်ပြုချက်ဒေတာကို မရယူနိုင်ပါ (HTTP ${response.status})`:`회원·권한 데이터 조회 실패 (HTTP ${response.status})`));
  const keys=["profiles","departments","auditLogs","roles","permissions"];
  const errors=keys.map(key=>data?.[key]?.error).filter(Boolean);
  if(errors.length)throw new Error(errors.join(" · "));if(!keys.every(key=>Array.isArray(data?.[key]?.data)))throw new Error(invalidResponse);
  const rows=(data.profiles?.data||[]) as Omit<P,"roles">[],rr=(data.roles?.data||[]) as UserRole[],pp=(data.permissions?.data||[]) as (UserModulePermission & {user_id:string})[];
  const mapped=rows.map(x=>({...x,roles:rr.filter(y=>(y as any).user_id===x.user_id),permissions:pp.filter(y=>y.user_id===x.user_id)})) as P[];
  setUsers(mapped);setDeps((data.departments?.data||[]) as D[]);setLogs(data.auditLogs?.data||[]);
  setSelectedId(current=>current&&mapped.some(x=>x.user_id===current)?current:"");
 }catch(e:any){setError(e instanceof TypeError?(englishUI?"Network connection failed. Check your connection and try again.":locale==="my"?"အင်တာနက် ချိတ်ဆက်မှုကို စစ်ဆေးပြီး ထပ်မံကြိုးစားပါ။":"네트워크 연결을 확인한 후 다시 시도해 주세요."):e?.message||String(e)||"데이터를 불러오지 못했습니다.");}finally{setLoading(false);}},[]);
 useEffect(()=>{void load();},[load]);
 async function invokeAdmin(body:Record<string,unknown>){const response=await fetch("/api/admin/manage-user",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(body),cache:"no-store"});const data=await response.json().catch(()=>({error:"서버 응답을 읽을 수 없습니다."}));if(!response.ok||data?.error)throw new Error(data?.error||(englishUI?`Account management request failed (HTTP ${response.status})`:locale==="my"?`အကောင့်စီမံခန့်ခွဲမှု တောင်းဆိုချက် မအောင်မြင်ပါ (HTTP ${response.status})`:`계정 관리 요청 실패 (HTTP ${response.status})`));return data;}
 async function createAccount(){if(!newUser.full_name.trim()||!newUser.email.trim()||newUser.password.length<6){setCreateError((englishUI?"Enter a name, email and password of at least six characters.":"이름, 이메일, 6자 이상의 비밀번호를 입력해 주세요."));return;}setSaving(true);setCreateError("");try{const result=await invokeAdmin({action:"create",...newUser,full_name:newUser.full_name.trim(),email:newUser.email.trim(),page_keys:newPageKeys});if(!result?.user_id)throw new Error("계정 생성 결과를 확인할 수 없습니다.");setNotice(result.audit_warning||"새 계정을 생성했습니다.");setCreateOpen(false);setNewPageOverrides({});setNewUser({full_name:"",email:"",password:"",preferred_locale:"ko",role:"staff",department_id:""});await load();}catch(e:any){setCreateError(e?.message||"계정을 생성하지 못했습니다. 입력한 내용은 유지됩니다.");}finally{setSaving(false);}}
 async function run(fn:()=>any,msg:string){
  setSaving(true);setError("");setNotice("");
  try{const r=await fn();if(r?.error)throw r.error;setNotice(r?.audit_warning||msg);await load();return true;}
  catch(e:any){setError(e?.message||"처리하지 못했습니다.");return false;}
  finally{setSaving(false);}
 }
 function openUser(p:P){
  setSelectedId(p.user_id);setFullName(p.full_name||"");setPreferredLocale(p.preferred_locale==="en"?"en":p.preferred_locale==="my"?"my":"ko");setRole("staff");setDepId("");setNewPassword("");setNotice("");setError("");
  setSelectedPageKeys(effectivePageKeys(p));
 }
 const actorName=(id:string|null)=>id?users.find(u=>u.user_id===id)?.full_name||(englishUI?"Unknown user":"알 수 없는 사용자"):(englishUI?"System operation · actor unknown":"시스템 작업 · 실행자 미확인");
 const auditLabel=(x:any)=>{const b=x.details?.before||{},a=x.details?.after||{};if(x.entity_type==="user_profile")return users.find(u=>u.user_id===x.entity_id)?.full_name||a.full_name||b.full_name||x.details?.full_name||(englishUI?"Member":"회원");if(x.entity_type==="user_role"){const uid=a.user_id||b.user_id||x.details?.user_id||((x.details?.event==="account_created")?x.entity_id:null);return users.find(u=>u.user_id===uid)?.full_name||x.details?.full_name||(englishUI?"Permission subject":"권한 대상");}if(x.entity_type==="department")return depName(deps.find(d=>d.id===x.entity_id))||(locale==="en"?(a.name_en||a.name_ko):locale==="my"?(a.name_my||a.name_en||a.name_ko):(a.name_ko||a.name_en))||(englishUI?"Department":"부서");return x.entity_id||"—";};
 const auditActionName=(a:string)=>((englishUI?{insert:"Register",update:"Edit",delete:"Delete"}:{insert:"등록",update:"수정",delete:"삭제"}) as Record<string,string>)[a]||a;
 const auditEntityName=(e:string)=>((englishUI?{user_profile:"Member information",user_role:"Account permissions",department:"Department"}:{user_profile:"회원 정보",user_role:"계정 권한",department:(englishUI?"Department":"부서")}) as Record<string,string>)[e]||e;
 const auditSummary=(x:any)=>{
  const d=x.details||{},before=d.before||{},after=d.after||{};
  if(d.event==="password_changed")return (englishUI?"Password changed · ":"비밀번호 변경 · ")+(d.full_name||d.email||(englishUI?"Account":"계정"));
  if(d.event==="account_created")return (englishUI?"Account created · ":"계정 생성 · ")+(d.full_name||d.email||(englishUI?"Member":"회원"))+" · "+((englishUI?({super_admin:"Super Administrator",administrator:"Administrator",finance_officer:"Finance officer",academic_officer:"Academic officer",student_officer:"Student affairs officer",librarian:"Library officer",facility_manager:"Facilities officer",faculty:"Faculty",staff:"Staff",student:"Student"} as Record<string,string>):names)[d.role]||d.role||(englishUI?"No role assigned":"역할 미지정"));
  if(x.entity_type==="user_role"){
   const row=after.user_id?after:before;
   const roleName=(englishUI?({super_admin:"Super Administrator",administrator:"Administrator",finance_officer:"Finance officer",academic_officer:"Academic officer",student_officer:"Student affairs officer",librarian:"Library officer",facility_manager:"Facilities officer",faculty:"Faculty",staff:"Staff",student:"Student"} as Record<string,string>):names)[row.role]||row.role||d.role||(englishUI?"Permission":"권한");
   const dept=depName(deps.find(v=>v.id===row.department_id));
   return (x.action==="insert"?(englishUI?"Permission granted":"권한 부여"):x.action==="delete"?(englishUI?"Permission revoked":"권한 해제"):(englishUI?"Permission changed":"권한 변경"))+" · "+roleName+(dept?" ("+dept+")":"");
  }
  if(x.entity_type==="department"){
   const b=(locale==="en"?(before.name_en||before.name_ko):locale==="my"?(before.name_my||before.name_en||before.name_ko):(before.name_ko||before.name_en)),a=(locale==="en"?(after.name_en||after.name_ko):locale==="my"?(after.name_my||after.name_en||after.name_ko):(after.name_ko||after.name_en));
   if(x.action==="insert")return (englishUI?"Department registered · ":"부서 등록 · ")+(a||(englishUI?"Department":"부서"));
   if(x.action==="delete")return (englishUI?"Department deleted · ":"부서 삭제 · ")+(b||(englishUI?"Department":"부서"));
   return (englishUI?"Department updated":"부서 정보 수정")+(b||a?" · "+(b||(englishUI?"Previous department":"이전 부서"))+" → "+(a||(englishUI?"Updated department":"수정된 부서")):"");
  }
  if(x.entity_type==="user_profile"){
   const keys=["full_name","email","preferred_locale","is_active"];
   const labels:Record<string,string>={full_name:(englishUI?"Name":"이름"),email:(englishUI?"Email":"이메일"),preferred_locale:(englishUI?"Language":"언어"),is_active:(englishUI?"Account status":"계정 상태")};
   const changed=keys.filter(k=>before[k]!==after[k]&&before[k]!==undefined&&after[k]!==undefined);
   if(x.action==="insert")return (englishUI?"Member registered · ":"회원 등록 · ")+(after.full_name||(englishUI?"Member":"회원"));
   if(!changed.length)return (englishUI?"Member information changed":"회원 정보 변경");
   return changed.map(k=>labels[k]+": "+String(before[k])+" → "+String(after[k])).join(" · ");
  }
  return d.event||(englishUI?"Change record":"변경 기록");
 };
 const filteredAudit=logs.filter(x=>{const q=auditSearch.trim().toLowerCase();const hay=[actorName(x.actor_id),auditLabel(x),auditEntityName(x.entity_type),auditActionName(x.action),JSON.stringify(x.details||{})].join(" ").toLowerCase();return (!q||hay.includes(q))&&(auditActionFilter==="all"||x.action===auditActionFilter);});
 const filtered=users.filter(x=>{
  const text=[x.full_name,x.email||"",x.user_id,...x.roles.map(r=>(englishUI?({super_admin:"Super Administrator",administrator:"Administrator",finance_officer:"Finance officer",academic_officer:"Academic officer",student_officer:"Student affairs officer",librarian:"Library officer",facility_manager:"Facilities officer",faculty:"Faculty",staff:"Staff",student:"Student"} as Record<string,string>):names)[r.role]||r.role),...x.roles.map(r=>depName(deps.find(d=>d.id===r.department_id))||"")].join(" ").toLowerCase();
  return (!search||text.includes(search.toLowerCase()))&&(statusFilter==="all"||(statusFilter==="active"?x.is_active:!x.is_active));
 });
 const assign=()=>{
  if(!selected)return;
  if(selected.roles.some(r=>r.role===role&&r.department_id===(depId||null))){setError((englishUI?"The same role and department have already been assigned.":"이미 동일한 역할과 부서가 지정되어 있습니다."));return;}
  void run(async()=>{const {data,error}=await db!.from("user_roles").insert({user_id:selected.user_id,role,department_id:depId||null,assigned_by:callerId}).select("id").single();if(error)throw error;if(!data?.id)throw new Error("역할이 저장되지 않았습니다.");return data;},"역할을 추가했습니다.");
 };
 const toggle=(p:P)=>{const desired=!p.is_active;if(!window.confirm(locale==="my"?(desired?"ဤအကောင့်ကို ပြန်လည်အသုံးပြုခွင့်ပေးမလား။":"ဤအကောင့်ကို ပိတ်ထားမလား။ အသုံးပြုသူ၏ ဝင်ရောက်ခွင့်ကို ရပ်ဆိုင်းပါမည်။"):(desired?(window.location.pathname.startsWith("/en/")?"Reactivate this account?":"이 계정을 다시 활성화할까요?"):(window.location.pathname.startsWith("/en/")?"Deactivate this account? The user will no longer be able to sign in or use the service.":"이 계정을 비활성화할까요? 사용자의 로그인과 서비스 이용이 중지됩니다."))))return;void run(async()=>{const {error}=await db!.rpc("mrpst_set_user_active",{target_user:p.user_id,make_active:desired});if(error)throw error;const {data:verify,error:verifyError}=await db!.from("user_profiles").select("is_active").eq("user_id",p.user_id).maybeSingle();if(verifyError)throw verifyError;if(!verify||verify.is_active!==desired)throw new Error("계정 상태 변경 결과를 확인할 수 없습니다.");return verify;},p.is_active?"계정을 비활성화했습니다.":"계정을 활성화했습니다.");};
 async function savePagePermissions(){
  if(!selected||!db||!canEditPagePermissions)return;
  const {data:{user}}=await db.auth.getUser();
  const administrator=selected.roles.some(r=>r.role==="administrator");
  const rows=pageOptions.filter(option=>(option.key!=="administration"||administrator)&&canDelegatePage(option.key)&&selectedPageKeys.includes(option.key)!==effectiveKeys.includes(option.key)).map(option=>{
   const existing=selected.permissions.find(permission=>permission.module_key===option.key);
   const canView=selectedPageKeys.includes(option.key);return {user_id:selected.user_id,module_key:option.key,can_view:canView,can_manage:canView&&!studentOnly&&option.key!=="administration"?(administrator?true:((existing?.can_view?existing.can_manage:hasRoleManageAccess(selected.roles,option.key)))):false,assigned_by:user?.id??null,updated_at:new Date().toISOString()};
  });
  if(!rows.length)return;
  await run(async()=>{const {data,error}=await db.from("user_module_permissions").upsert(rows,{onConflict:"user_id,module_key"}).select("module_key,can_view");if(error)throw error;if(!data||data.length!==rows.length||data.some(saved=>{const expected=rows.find(row=>row.module_key===saved.module_key);return !expected||saved.can_view!==expected.can_view;}))throw new Error("일부 페이지 권한 저장 결과가 입력한 설정과 일치하지 않습니다.");return data;},"페이지 표시 설정을 저장했습니다.");
 }
 const tabs=isSuperAdmin?[["users","계정 관리"],["departments","부서 관리"],["audit","변경 이력"],["backup","운영 백업"]]:[["users","계정 관리"]];
 return <div className="settings-workspace">
  <div className="settings-heading"><AdminModuleHeading moduleKey="administration"/></div>
  <div className="settings-stats">
   <article><span>{(englishUI?"All members":"전체 회원")}</span><strong>{users.length}</strong></article>
   <article><span>{(englishUI?"Active members":"활성 회원")}</span><strong>{users.filter(x=>x.is_active).length}</strong></article>
   <article><span>{(englishUI?"Inactive members":"비활성 회원")}</span><strong>{users.filter(x=>!x.is_active).length}</strong></article>
   <article><span>{(englishUI?"Assigned permissions":"부여된 권한")}</span><strong>{users.reduce((n,x)=>n+x.roles.length,0)}</strong></article>
  </div>
  <div className="settings-workflow"><article><b>1</b><div><strong>{(englishUI?"Select account":"계정 선택")}</strong><span>{(englishUI?"Search by name or email and review current status.":"이름·이메일로 찾고 현재 상태를 확인합니다.")}</span></div></article><article><b>2</b><div><strong>{(englishUI?"Role and page settings":"역할과 페이지 설정")}</strong><span>{(englishUI?"Assign work roles, then display only the required administration pages.":"업무 역할을 부여한 뒤 필요한 관리 페이지만 표시합니다.")}</span></div></article><article><b>3</b><div><strong>{(englishUI?"View change history":"변경 이력 확인")}</strong><span>{(englishUI?"After saving, review the change history to see who changed what.":"저장 후 변경 이력에서 누가 무엇을 바꿨는지 확인합니다.")}</span></div></article></div>
  {error&&<div className="settings-alert error">{englishUI?englishDisplay(error):error}</div>}{notice&&<div className="settings-alert success">{englishUI?englishDisplay(notice):notice}</div>}
  <nav className="settings-tabs">{tabs.map(([k,v])=><button key={k} className={tab===k?"active":""} onClick={()=>{setTab(k);setSelectedId("");}}>{k==="backup"?backupText.tab:englishUI?englishDisplay(v):v}</button>)}</nav>
  {tab==="users"&&<section className="settings-panel">
   <div className="settings-panel-head"><div><h3>{(englishUI?"Account list":"계정 목록")}</h3><p>{(englishUI?"Administrators create accounts directly and manage passwords and permissions.":"관리자가 계정을 직접 생성하고 비밀번호와 권한을 관리합니다.")}</p></div><div className="settings-account-actions"><button className="settings-primary" onClick={()=>{setCreateError("");setNewPageOverrides({});setCreateOpen(true);}}>{(englishUI?"＋ Register account":"＋ 계정 등록")}</button></div></div>
   <div className="settings-toolbar"><input className="settings-search" placeholder={(englishUI?"Search name, email or role":"이름, 이메일, 역할 검색")} value={search} onChange={e=>setSearch(e.target.value)}/><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">{(englishUI?"All status":"전체 상태")}</option><option value="active">{(englishUI?"Active members":"활성 회원")}</option><option value="inactive">{(englishUI?"Inactive members":"비활성 회원")}</option></select><span>{filtered.length}{(englishUI?" shown":"명 표시")}</span></div>
   <div className="settings-member-layout">
    <div className="settings-member-list">{loading?<Empty>{(englishUI?"Loading member information.":"회원 정보를 불러오는 중입니다.")}</Empty>:filtered.map(p=><button type="button" className={"settings-member-item "+(selectedId===p.user_id?"selected":"")} key={p.user_id} onClick={()=>openUser(p)}>
      <span className="settings-member-avatar">{(p.full_name||"?").trim().slice(0,1)}</span><span className="settings-member-copy"><strong>{p.full_name||(englishUI?"Name not registered":"이름 미등록")}</strong><small>{p.email||(englishUI?"Email not registered":"이메일 미등록")} · {p.roles.length? p.roles.map(r=>(englishUI?({super_admin:"Super Administrator",administrator:"Administrator",finance_officer:"Finance officer",academic_officer:"Academic officer",student_officer:"Student affairs officer",librarian:"Library officer",facility_manager:"Facilities officer",faculty:"Faculty",staff:"Staff",student:"Student"} as Record<string,string>):names)[r.role]||r.role).join(" · "):"권한 미지정"}</small></span><span className={p.is_active?"settings-status active":"settings-status inactive"}>{p.is_active?(englishUI?"Active":"활성"):(englishUI?"Inactive":"비활성")}</span>
     </button>)}{!loading&&!filtered.length&&<Empty>{(englishUI?"No members match your search.":"검색 조건에 맞는 회원이 없습니다.")}</Empty>}</div>
    {selected?<div className="settings-member-detail" data-no-inline-edit>
      <div className="settings-detail-head"><div><span className="eyebrow">MEMBER PROFILE</span><h3>{selected.full_name||(englishUI?"Name not registered":"이름 미등록")}</h3><small>{selected.email||(englishUI?"Email not registered":"이메일 미등록")}{englishUI?" · Registered ":" · 등록일 "}{new Date(selected.created_at).toLocaleDateString(englishUI?"en-GB":useMyanmarLocale?"my-MM":"ko-KR")}</small></div><span className={selected.is_active?"settings-status active":"settings-status inactive"}>{selected.is_active?(englishUI?"Active account":"활성 계정"):(englishUI?"Inactive account":"비활성 계정")}</span></div>
      <div className="settings-form-grid">
       <FormField label={(englishUI?"Member name":"회원 이름")}><input value={fullName} disabled={!canEditSelected} onChange={e=>setFullName(e.target.value)}/></FormField>
       <FormField label={(englishUI?"Default language":"기본 언어")}><select value={preferredLocale} disabled={!canEditSelected} onChange={e=>setPreferredLocale(e.target.value)}><option value="ko">{englishUI?"Korean":"한국어"}</option><option value="en">English</option><option value="my">{englishUI?"Myanmar":"မြန်မာ"}</option></select></FormField>
      </div>
      <button className="settings-primary" disabled={!canEditSelected||saving||!fullName.trim()} onClick={()=>void run(async()=>{const {data,error}=await db!.from("user_profiles").update({full_name:fullName.trim(),preferred_locale:preferredLocale}).eq("user_id",selected.user_id).select("user_id").maybeSingle();if(error)throw error;if(!data?.user_id)throw new Error("회원 정보가 수정되지 않았습니다. 권한과 계정 상태를 확인해 주세요.");return data;},"회원 정보를 저장했습니다.")}>{(englishUI?"Save member information":"회원 정보 저장")}</button>
      {isSuperAdmin&&<div className="settings-detail-section"><h4>{(englishUI?"Change password":"비밀번호 변경")}</h4><p className="settings-form-hint">{(englishUI?"Setting a new password immediately invalidates the old password.":"새 비밀번호를 설정하면 기존 비밀번호는 즉시 사용할 수 없게 됩니다.")}</p><div className="settings-password-row"><input type="password" autoComplete="new-password" minLength={6} placeholder={(englishUI?"New password (6+ characters)":"새 비밀번호 (6자 이상)")} value={newPassword} onChange={e=>setNewPassword(e.target.value)}/><button className="settings-primary" disabled={saving||newPassword.length<6} onClick={()=>void run(()=>invokeAdmin({action:"update_password",user_id:selected.user_id,password:newPassword}),"비밀번호를 변경했습니다.")}>{(englishUI?"Change password":"비밀번호 변경")}</button></div></div>}
      <div className="settings-detail-section"><h4>{(englishUI?"1. Current roles ":"1. 현재 역할 ")}<small>{selected.roles.length}{(englishUI?"":"개")}</small></h4>
       {selected.roles.length?selected.roles.map(r=><div className="settings-role-row" key={r.id}><span><strong>{(englishUI?({super_admin:"Super Administrator",administrator:"Administrator",finance_officer:"Finance officer",academic_officer:"Academic officer",student_officer:"Student affairs officer",librarian:"Library officer",facility_manager:"Facilities officer",faculty:"Faculty",staff:"Staff",student:"Student"} as Record<string,string>):names)[r.role]||r.role}</strong><small>{r.department_id?(depName(deps.find(d=>d.id===r.department_id))||"부서"):"전체 부서"}</small></span><button disabled={!canEditSelected||saving||r.role==="super_admin"||(!isSuperAdmin&&!assignableRoles.includes(r.role))} title={r.role==="super_admin"?(englishUI?"Super Administrator permissions cannot be revoked from this screen.":"최고 관리자 권한은 이 화면에서 해제할 수 없습니다."):""} onClick={()=>{if(!window.confirm(locale==="my"?"ဤအကောင့်၏ သက်ဆိုင်ရာခွင့်ပြုချက်ကို ဖယ်ရှားမလား။":(window.location.pathname.startsWith("/en/")?"Revoke this account's selected permission?":"이 계정의 해당 권한을 해제할까요?")))return;void run(async()=>{const {data,error}=await db!.from("user_roles").delete().eq("id",r.id).select("id").maybeSingle();if(error)throw error;if(!data?.id)throw new Error("권한이 해제되지 않았습니다.");return data;},"권한을 해제했습니다.");}}>{(englishUI?"Revoke permission":"권한 해제")}</button></div>):<Empty>{(englishUI?"No permissions assigned.":"아직 부여된 권한이 없습니다.")}</Empty>}
      </div>
      {canEditSelected&&<div className="settings-detail-section"><h4>{(englishUI?"2. Add roles":"2. 역할 추가")}</h4><div className="settings-role-form"><select value={role} onChange={e=>setRole(e.target.value)}>{assignableRoles.map(r=><option key={r} value={r}>{(englishUI?({super_admin:"Super Administrator",administrator:"Administrator",finance_officer:"Finance officer",academic_officer:"Academic officer",student_officer:"Student affairs officer",librarian:"Library officer",facility_manager:"Facilities officer",faculty:"Faculty",staff:"Staff",student:"Student"} as Record<string,string>):names)[r]}</option>)}</select><SearchSelect value={depId} placeholder={(englishUI?"All departments":"전체 부서")} searchPlaceholder={(englishUI?"Search department name":"부서명 검색")} options={deps.filter(d=>d.is_active).map(d=>({value:d.id,label:depName(d),keywords:`${d.code} ${d.name_ko||""} ${d.name_en||""}`}))} onChange={setDepId} clearLabel={(englishUI?"Clear department selection":"부서 선택 해제")}/><button className="settings-primary" disabled={saving||selected.roles.some(r=>r.role===role&&r.department_id===(depId||null))} onClick={assign}>{(englishUI?"Add permission":"권한 추가")}</button></div><RoleAccessGuide role={role} locale={locale}/></div>}
      {<div className="settings-detail-section">
       <h4>{(englishUI?"3. Admin page visibility ":"3. 관리 페이지 표시 ")}<small>{selectedPageKeys.length}/{pageOptions.filter(option=>option.key!=="administration"||selected.roles.some(r=>r.role==="administrator"||r.role==="super_admin")).length}</small></h4>
       <p className="settings-form-hint">{(englishUI?"Roles automatically determine the default pages. Change only the pages that require an individual exception.":"역할에 따라 기본 페이지가 자동 선택됩니다. 개별 변경이 필요한 페이지만 조정하세요.")}</p>
       {!isSuperAdmin&&<p className="settings-form-hint">{!canEditPagePermissions?(selected.user_id===callerId?(locale==="my"?"မိမိအကောင့်၏ စာမျက်နှာခွင့်ပြုချက်များကို အမြင့်ဆုံး စီမံခန့်ခွဲသူသာ ပြောင်းလဲနိုင်ပါသည်။":englishUI?"Only a Super Administrator can change your own page permissions.":"본인 계정의 페이지 권한은 최고 관리자만 변경할 수 있습니다."):(locale==="my"?"ဤအကောင့်၏ ခွင့်ပြုချက်များကို အမြင့်ဆုံး စီမံခန့်ခွဲသူသာ ပြောင်းလဲနိုင်ပါသည်။":englishUI?"Only a Super Administrator can change this account’s permissions.":"이 계정의 권한은 최고 관리자만 변경할 수 있습니다.")):(locale==="my"?"သင်ဝင်ရောက်နိုင်သော စီမံခန့်ခွဲမှု စာမျက်နှာများကိုသာ သတ်မှတ်နိုင်ပါသည်။":englishUI?"You can change permissions only for pages you can manage.":"본인에게 허용된 관리 페이지의 권한만 변경할 수 있습니다.")}</p>}
       {studentOnly&&<p className="settings-form-hint" data-no-translate>{locale==="my"?"ကျောင်းသားအကောင့်သည် ရွေးချယ်ထားသော စီမံခန့်ခွဲမှု စာမျက်နှာများရှိ ကျောင်းဒေတာကို ကြည့်ရှုနိုင်ပါသည်။ ကျောင်းသားတာဝန်သာရှိပါက ပြင်ဆင်ခွင့် မရှိပါ။":englishUI?"Selected pages expose school records to this student account. A student-only role has read-only access. The student portal remains available.":"학생 계정에 선택한 관리 페이지의 학교 자료가 공개됩니다. 학생 역할만 있는 경우 조회만 가능하며 기존 학생 포털은 유지됩니다."}</p>}
       <div className="settings-page-permissions">
        {pageOptions.filter(option=>option.key!=="administration"||selected.roles.some(r=>r.role==="administrator"||r.role==="super_admin")).map(option=><label className="settings-page-permission" key={option.key}>
         <input type="checkbox" checked={selectedPageKeys.includes(option.key)} disabled={loading||saving||!canEditPagePermissions||!canDelegatePage(option.key)} onChange={e=>setSelectedPageKeys(current=>e.target.checked?[...current,option.key]:current.filter(key=>key!==option.key))}/>
         <span><strong>{englishUI?englishDisplay(option.title):option.title}</strong><small style={{display:"block"}}>{!selected.roles.some(r=>r.role==="super_admin")&&selected.permissions.some(p=>p.module_key===option.key)?(locale==="my"?"သီးခြားသတ်မှတ်ချက်":englishUI?"Individual exception":"개별 설정"):(defaultKeys.includes(option.key)?(locale==="my"?"ရာထူးအလိုက် ခွင့်ပြုချက်":englishUI?"Role default":"역할 기본 권한"):(locale==="my"?"ပုံမှန်ဝင်ရောက်ခွင့်မရှိ":englishUI?"Not included in role":"역할 기본 권한 없음"))}</small></span>
        </label>)}
       </div>
       <div className="settings-page-permission-actions">
        <button type="button" className="settings-primary" disabled={loading||saving||!canEditPagePermissions||!pageOptions.some(option=>canDelegatePage(option.key)&&selectedPageKeys.includes(option.key)!==effectiveKeys.includes(option.key))} onClick={()=>void savePagePermissions()}>{saving?"저장 중…":"저장"}</button>
       </div>
       {selected.roles.some(r=>r.role==="super_admin")&&<p className="settings-form-hint">{(englishUI?"Super Administrators can access all pages.":"최고 관리자는 모든 페이지에 접근할 수 있습니다.")}</p>}{!selected.roles.some(r=>r.role==="super_admin")&&selected.roles.some(r=>r.role==="administrator")&&<p className="settings-form-hint">{(englishUI?"Administrators can access only the pages selected here.":"관리자는 여기서 선택한 페이지만 접근할 수 있습니다.")}</p>}
      </div>}
      {isSuperAdmin&&<div className="settings-danger-zone"><div><strong>{(englishUI?"Account status":"계정 상태")}</strong><small>{selected.is_active?(englishUI?"This account can sign in and use the service.":"현재 로그인 및 서비스 이용이 가능한 상태입니다."):(englishUI?"This account is inactive.":"현재 비활성화된 계정입니다.")}</small></div><button disabled={saving||selected.roles.some(r=>r.role==="super_admin")} onClick={()=>toggle(selected)}>{selected.is_active?"회원 비활성화":"회원 다시 활성화"}</button></div>}
     </div>:<div className="settings-member-empty"><strong>{(englishUI?"Select a member.":"회원을 선택해 주세요")}</strong><p>{(englishUI?"Select a member from the list to manage details and permissions.":"왼쪽 목록에서 회원을 선택하면 상세 정보와 권한을 관리할 수 있습니다.")}</p></div>}
   </div>
  </section>}
  {tab==="departments"&&<section className="settings-panel"><div className="settings-panel-head"><div><h3>{(englishUI?"Department management":"부서 관리")}</h3><p>{(englishUI?"List of departments used to assign departmental roles to members.":"회원에게 부서별 역할을 지정할 때 사용하는 부서 목록입니다.")}</p></div><button className="settings-primary" onClick={()=>{setEditingDepId("");setNewDep({code:"",name_en:"",name_my:"",name_ko:""});setDepOpen(true);}}>{(englishUI?"＋ Register department":"＋ 부서 등록")}</button></div><div className="settings-table-wrap"><table className="settings-table"><thead><tr><th>{(englishUI?"Code":"코드")}</th><th>English</th><th>မြန်မာ</th><th>{englishUI?"Korean":"한국어"}</th><th>{(englishUI?"Status":"상태")}</th><th>{(englishUI?"Management":"관리")}</th></tr></thead><tbody>{deps.map(d=><tr key={d.id}><td>{d.code}</td><td>{d.name_en}</td><td>{d.name_my||"—"}</td><td>{d.name_ko||"—"}</td><td>{d.is_active?(englishUI?"Active":"활성"):(englishUI?"Inactive":"비활성")}</td><td><button onClick={()=>{setEditingDepId(d.id);setNewDep({code:d.code,name_en:d.name_en,name_my:d.name_my||"",name_ko:d.name_ko||""});setDepOpen(true);}}>{(englishUI?"Edit":"수정")}</button> <button onClick={()=>void run(async()=>{const desired=!d.is_active;const {error}=await db!.from("departments").update({is_active:desired}).eq("id",d.id);if(error)throw error;const {data:verify,error:verifyError}=await db!.from("departments").select("is_active").eq("id",d.id).maybeSingle();if(verifyError)throw verifyError;if(!verify||verify.is_active!==desired)throw new Error("부서 상태 변경 결과를 확인할 수 없습니다.");return verify;},"부서 상태를 변경했습니다.")}>{d.is_active?"비활성화":"활성화"}</button></td></tr>)}</tbody></table>{!loading&&!deps.length&&<Empty>{(englishUI?"No departments registered.":"등록된 부서가 없습니다.")}</Empty>}</div></section>}
  {tab==="audit"&&<section className="settings-panel"><div className="settings-panel-head"><div><h3>{(englishUI?"Account management history":"회원 관리 변경 이력")}</h3><p>{(englishUI?"Latest 100 user, permission and department changes. Automated actions with unknown operators are identified separately.":"최근 100건의 사용자·권한·부서 변경 기록입니다. 실행자를 확인할 수 없는 자동 작업은 별도로 표시합니다.")}</p></div></div><div className="settings-toolbar"><input className="settings-search" placeholder={(englishUI?"Search operator, target or changes":"작업자, 대상, 변경 내용 검색")} value={auditSearch} onChange={e=>setAuditSearch(e.target.value)}/><select value={auditActionFilter} onChange={e=>setAuditActionFilter(e.target.value)}><option value="all">{(englishUI?"All actions":"모든 작업")}</option><option value="insert">{(englishUI?"Register":"등록")}</option><option value="update">{(englishUI?"Edit":"수정")}</option><option value="delete">{(englishUI?"Delete":"삭제")}</option></select><span>{filteredAudit.length}{(englishUI?" shown":"건 표시")}</span></div><div className="settings-table-wrap"><table className="settings-table"><thead><tr><th>{(englishUI?"Date and time":"일시")}</th><th>{(englishUI?"Operator":"작업자")}</th><th>{(englishUI?"Target":"대상")}</th><th>{(englishUI?"Category":"유형")}</th><th>{(englishUI?"Action":"작업")}</th><th>{(englishUI?"Change summary":"변경 요약")}</th></tr></thead><tbody>{filteredAudit.map(x=><tr key={x.id}><td>{new Date(x.created_at).toLocaleString(englishUI?"en-GB":useMyanmarLocale?"my-MM":"ko-KR")}</td><td>{actorName(x.actor_id)}</td><td>{auditLabel(x)}</td><td>{auditEntityName(x.entity_type)}</td><td>{auditActionName(x.action)}</td><td>{auditSummary(x)}</td></tr>)}</tbody></table>{!loading&&!filteredAudit.length&&<Empty>{(englishUI?"No change history matches your search.":"검색 조건에 맞는 변경 이력이 없습니다.")}</Empty>}</div></section>}
  {tab==="backup"&&isSuperAdmin&&<section className="settings-panel" data-no-inline-edit data-no-translate><div className="settings-panel-head"><div><h3>{backupText.title}</h3><p>{backupText.description}</p></div></div><div className="settings-backup"><strong>{backupText.restricted}</strong><p>{backupText.warning}</p><button className="settings-primary" type="button" disabled={backupBusy} onClick={()=>void downloadBackup()}>{backupBusy?backupText.working:backupText.download}</button>{backupStatus&&<div className={backupFailed?"settings-alert error":"settings-alert success"} role={backupFailed?"alert":"status"} aria-live="polite">{backupStatus}</div>}</div><BackupRestorePanel locale={locale}/></section>}
  {createOpen&&<div className="settings-modal-backdrop" data-no-inline-edit><section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="account-create-heading" style={{maxHeight:"calc(100dvh - 24px)",overflowY:"auto"}}><header style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}><h3 id="account-create-heading" style={{flex:1,minWidth:0}}>{locale==="my"?"အကောင့်အသစ် ဖွင့်ရန်":englishUI?"Register new account":"새 계정 등록"}</h3><button type="button" aria-label={locale==="my"?"ပိတ်ရန်":englishUI?"Close":"닫기"} style={{flexShrink:0,width:36,height:36}} onClick={()=>setCreateOpen(false)}>×</button></header><p className="settings-form-hint">{(englishUI?"Accounts become active immediately and can sign in using the registered email and password.":"계정은 즉시 활성화되며 등록한 이메일과 비밀번호로 로그인할 수 있습니다.")}</p>{createError&&<div className="settings-alert error" role="alert" aria-live="polite">{englishUI?englishDisplay(createError):createError}</div>}<div className="settings-form-grid"><FormField label={(englishUI?"Name *":"이름 *")}><input value={newUser.full_name} onChange={e=>setNewUser({...newUser,full_name:e.target.value})}/></FormField><FormField label={(englishUI?"Email *":"이메일 *")}><input type="email" autoComplete="email" value={newUser.email} onChange={e=>setNewUser({...newUser,email:e.target.value})}/></FormField><FormField label={(englishUI?"Initial password *":"초기 비밀번호 *")}><input type="password" autoComplete="new-password" minLength={6} value={newUser.password} onChange={e=>setNewUser({...newUser,password:e.target.value})}/></FormField><FormField label={(englishUI?"Default language":"기본 언어")}><select value={newUser.preferred_locale} onChange={e=>setNewUser({...newUser,preferred_locale:e.target.value})}><option value="ko">{englishUI?"Korean":"한국어"}</option><option value="en">English</option><option value="my">မြန်မာ</option></select></FormField><FormField label={(englishUI?"Role":"역할")}><select value={newUser.role} onChange={e=>{setNewUser({...newUser,role:e.target.value});setNewPageOverrides({});}}>{assignableRoles.map(r=><option key={r} value={r}>{(englishUI?({super_admin:"Super Administrator",administrator:"Administrator",finance_officer:"Finance officer",academic_officer:"Academic officer",student_officer:"Student affairs officer",librarian:"Library officer",facility_manager:"Facilities officer",faculty:"Faculty",staff:"Staff",student:"Student"} as Record<string,string>):names)[r]}</option>)}</select></FormField><FormField label={(englishUI?"Department":"부서")}><SearchSelect value={newUser.department_id} placeholder={(englishUI?"All departments":"전체 부서")} searchPlaceholder={(englishUI?"Search department name":"부서명 검색")} options={deps.filter(d=>d.is_active).map(d=>({value:d.id,label:depName(d),keywords:`${d.code} ${d.name_ko||""} ${d.name_en||""}`}))} onChange={id=>setNewUser({...newUser,department_id:id})} clearLabel={(englishUI?"Clear department selection":"부서 선택 해제")}/></FormField></div><RoleAccessGuide role={newUser.role} locale={locale}/><div className="settings-detail-section" data-no-inline-edit data-no-translate style={{marginTop:12}}><h4>{locale==="my"?"စီမံခန့်ခွဲမှု စာမျက်နှာ ခွင့်ပြုချက်များ":englishUI?"Page permissions":"관리 페이지 선택"} <small>{newPageKeys.length}/{newPageOptions.length}</small></h4><p className="settings-form-hint">{locale==="my"?"တာဝန်အလိုက် မူလစာမျက်နှာများကို ရွေးထားပါသည်။ လိုအပ်သလို ပြောင်းလဲနိုင်ပါသည်။":englishUI?"Role defaults are preselected. Select or clear pages as needed.":"역할에 따른 기본 페이지가 선택되어 있습니다. 필요한 페이지를 직접 선택하거나 해제하세요."}</p><div className="settings-page-permissions">{newPageOptions.map(option=><label key={option.key} className="settings-page-permission"><input type="checkbox" checked={newPageKeys.includes(option.key)} disabled={saving||!canDelegatePage(option.key)} onChange={e=>setNewPageOverrides(current=>({...current,[option.key]:e.target.checked}))}/><span><strong>{locale==="ko"?option.title:rolePageGuide[option.key][locale][0]}</strong></span></label>)}</div>{!isSuperAdmin&&<p className="settings-form-hint">{locale==="my"?"မိမိရရှိထားသော စာမျက်နှာခွင့်ပြုချက်များကိုသာ ပေးနိုင်ပါသည်။":englishUI?"You may grant only pages within your own permissions.":"본인에게 허용된 페이지의 권한만 부여할 수 있습니다."}</p>}</div><footer><button onClick={()=>setCreateOpen(false)}>{(englishUI?"Cancel":"취소")}</button><button className="settings-primary" disabled={saving||!newUser.full_name.trim()||!newUser.email.trim()||newUser.password.length<6} onClick={()=>void createAccount()}>{saving?"등록 중…":"계정 생성"}</button></footer></section></div>}
  {depOpen&&<div className="settings-modal-backdrop" data-no-inline-edit><section className="settings-modal"><header><h3>{editingDepId?(englishUI?"Edit department information":"부서 정보 수정"):(englishUI?"Register department":"부서 등록")}</h3><button onClick={()=>setDepOpen(false)}>×</button></header><div className="settings-form-grid"><FormField label={(englishUI?"Department code *":"부서 코드 *")}><input value={newDep.code} onChange={e=>setNewDep({...newDep,code:e.target.value.toUpperCase()})}/></FormField><FormField label={(englishUI?"English name *":"영어 이름 *")}><input value={newDep.name_en} onChange={e=>setNewDep({...newDep,name_en:e.target.value})}/></FormField><FormField label={(englishUI?"Myanmar name":"미얀마어 이름")}><input value={newDep.name_my} onChange={e=>setNewDep({...newDep,name_my:e.target.value})}/></FormField><FormField label={(englishUI?"Korean name":"한국어 이름")}><input value={newDep.name_ko} onChange={e=>setNewDep({...newDep,name_ko:e.target.value})}/></FormField></div><footer><button onClick={()=>setDepOpen(false)}>{(englishUI?"Cancel":"취소")}</button><button className="settings-primary" disabled={saving||!newDep.code.trim()||!newDep.name_en.trim()} onClick={()=>void run(async()=>{const payload={code:newDep.code.trim(),name_en:newDep.name_en.trim(),name_my:newDep.name_my.trim()||null,name_ko:newDep.name_ko.trim()||null};if(editingDepId){const {data,error}=await db!.from("departments").update(payload).eq("id",editingDepId).select("id,code,name_en,name_my,name_ko").single();if(error)throw error;if(!data?.id||data.id!==editingDepId||data.code!==payload.code||data.name_en!==payload.name_en||data.name_my!==payload.name_my||data.name_ko!==payload.name_ko)throw new Error("부서 수정 결과를 확인할 수 없습니다.");return data;}const {data,error}=await db!.from("departments").insert(payload).select("id").single();if(error)throw error;if(!data?.id)throw new Error("부서 등록 결과를 확인할 수 없습니다.");return data;},editingDepId?"부서 정보를 수정했습니다.":"부서를 등록했습니다.").then(success=>{if(success){setDepOpen(false);setEditingDepId("");}})}>{(englishUI?"Register":"등록")}</button></footer></section></div>}
 </div>;
}
function Empty({children}:{children:React.ReactNode}){return <p className="settings-empty">{children}</p>}

