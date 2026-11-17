import Link from "next/link";
import dynamic from "next/dynamic";
import {notFound,redirect} from "next/navigation";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import {MODULES,getModuleKey,canAccessModule,type MrpstRole} from "@/lib/auth/permissions";
import AdminActions from "../AdminActions";
const AdminMyanmarTranslator=dynamic(()=>import("../AdminMyanmarTranslator"));
const FinanceModule=dynamic(()=>import("./FinanceModule"));
const StudentModule=dynamic(()=>import("./StudentModule"));
const LibraryModule=dynamic(()=>import("./LibraryModule"));
const FacilitiesModule=dynamic(()=>import("./FacilitiesModule"));
const MeetingsModule=dynamic(()=>import("./MeetingsModule"));
const AcademicsModule=dynamic(()=>import("./AcademicsModule"));
const AdministrationModule=dynamic(()=>import("./AdministrationModule"));
const WebsiteModule=dynamic(()=>import("./WebsiteModule"));

const copy = {
  ko:{
    admin:"MRPST 관리자",dashboard:"대시보드",view:"홈페이지 보기 ↗",
    finance:"재정 관리",students:"학생 관리",academics:"학사 관리",facilities:"시설 관리",
    library:"도서관 관리",meetings:"회의 관리",administration:"계정·권한 관리",website:"홈페이지 관리",
    workspace:"업무 메뉴",back:"대시보드로 돌아가기",groups:{academic:"학사·학생",finance:"재정",operations:"학교 운영",system:"시스템·홈페이지"}
  },
  my:{
    admin:"MRPST အုပ်ချုပ်ရေး",dashboard:"ဒက်ရှ်ဘုတ်",view:"ဝဘ်ဆိုက်ကြည့်ရန် ↗",
    finance:"ဘဏ္ဍာရေး",students:"ကျောင်းသား",academics:"ပညာရေး",facilities:"အဆောက်အအုံ",
    library:"စာကြည့်တိုက်",meetings:"အစည်းအဝေး",administration:"အကောင့်နှင့် ခွင့်ပြုချက်",website:"ဝဘ်ဆိုက်",
    workspace:"လုပ်ငန်းမီနူး",back:"ဒက်ရှ်ဘုတ်သို့ ပြန်သွားရန်",groups:{academic:"ပညာရေးနှင့် ကျောင်းသား",finance:"ဘဏ္ဍာရေး",operations:"ကျောင်းလုပ်ငန်း",system:"စနစ်နှင့် ဝဘ်ဆိုက်"}
  }
} as const;

export default async function ModulePage({params}:{params:Promise<{locale:string;module:string}>}){
  const {locale,module}=await params;
  const lang=locale==="my"?"my":"ko";
  const t=copy[lang];
  const key=getModuleKey(module);
  if(!key)notFound();
  const item=MODULES[key];
  const supabase=await createSupabaseServerClient();
  if(!supabase) return <main className="login-wrap"><section className="login-card"><span className="eyebrow">MRPST</span><h1>관리자 서비스에 연결할 수 없습니다</h1><p className="login-intro">로그인 서비스 설정이 확인되지 않아 관리 기능을 열 수 없습니다. 서비스 설정을 확인한 뒤 다시 시도해 주세요.</p><Link className="btn secondary" href={`/${locale}`}>홈페이지로 돌아가기</Link></section></main>;
  let userEmail="";
  let roles:MrpstRole[]=[];
  let overrides:{module_key:string;can_view:boolean}[]=[];
  if(supabase){
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)redirect(`/${locale}/login`);
    userEmail=user.email??"";
    const [{data:roleRows,error},{data:profile},{data:permissions}]=await Promise.all([
      supabase.from("user_roles").select("role, department_id").eq("user_id",user.id),
      supabase.from("user_profiles").select("is_active").eq("user_id",user.id).maybeSingle(),
      supabase.from("user_module_permissions").select("module_key,can_view").eq("user_id",user.id)
    ]);
    roles=(roleRows??[]).map(row=>row.role as MrpstRole);
    overrides=permissions??[];
    if(error||!roleRows?.length||profile?.is_active!==true||!canAccessModule(roles,key,overrides)){
      return <main className="login-wrap"><section className="login-card"><span className="eyebrow">PERMISSION REQUIRED</span><h1>Access restricted</h1><p className="login-intro">Your assigned role does not include access to {item.title}. Contact the Super Administrator if this access is required for your work.</p></section></main>;
    }
  }
  const visible=Object.entries(MODULES).filter(([moduleKey])=>!supabase||canAccessModule(roles,moduleKey as keyof typeof MODULES,overrides));
  const moduleGroups=[["academic",["students","academics"]],["finance",["finance"]],["operations",["facilities","library","meetings"]],["system",["administration","website"]]] as const;
  const visibleInGroup=(keys:readonly string[])=>visible.filter(([moduleKey])=>keys.includes(moduleKey));
  const moduleNames:Record<string,string>={finance:t.finance,students:t.students,academics:t.academics,facilities:t.facilities,library:t.library,meetings:t.meetings,administration:t.administration,website:t.website};
  return <>{locale==="my"&&<AdminMyanmarTranslator locale={locale}/>}<div className="admin">
    <aside className="sidebar">
      <div className="sidebar-nav">
        
        <div className="side-label">{t.workspace}</div>
        <Link className="side-link" href={`/${locale}/admin`}>{t.dashboard}</Link>
        {moduleGroups.map(([group,keys])=>{const items=visibleInGroup(keys);return items.length>0?<div className="sidebar-group" key={group}><div className="side-label">{t.groups[group]}</div>{items.map(([moduleKey,entry])=><Link className={moduleKey===key?"side-link active":"side-link"} href={`/${locale}/admin/${moduleKey}`} key={moduleKey}>{moduleNames[moduleKey]??entry.title}</Link>)}</div>:null;})}
      </div>
      </aside>
    <main className="admin-main">
      <header className="topbar"><Link href={`/${locale}`} className="brand admin-topbar-brand"><span className="brand-logo"><img src="/mrpst-logo.svg" alt="MRPST 공식 로고"/></span><span>MRPST<small>{t.admin}</small></span></Link><div className="admin-user">
        <nav className="admin-language" aria-label="Language">
          <a className={lang==="my"?"selected":""} href={`/my/admin/${module}`}>မြန်မာ</a>
          <a className={lang==="ko"?"selected":""} href={`/ko/admin/${module}`}>한국어</a>
        </nav>
        
        <Link href={`/${locale}`}>{t.view}</Link>
        {supabase&&<AdminActions locale={locale}/>}
      </div></header>
      <div className="content">
        {key==="finance"?<FinanceModule/>:key==="students"?<StudentModule/>:key==="library"?<LibraryModule/>:key==="facilities"?<FacilitiesModule/>:key==="meetings"?<MeetingsModule/>:key==="academics"?<AcademicsModule/>:key==="administration"?<AdministrationModule/>:key==="website"?<WebsiteModule/>:<><h1 className="admin-heading">{moduleNames[key]??item.title}</h1><p className="admin-subtitle">{item.description}</p><div className="module-placeholder"><strong>Module foundation</strong><p>This area is reserved for the {item.title.toLowerCase()} workflow. Data entry, approval steps, reporting and department-level database policies will be added in the next implementation phase.</p><span>Not connected to live records</span></div></>}
          </div>
    </main>
  </div></>;
}
