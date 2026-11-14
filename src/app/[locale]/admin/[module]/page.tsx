import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import {MODULES,getModuleKey,canAccessModule,type MrpstRole} from "@/lib/auth/permissions";
import AdminActions from "../AdminActions";
import AdminMyanmarTranslator from "../AdminMyanmarTranslator";
import FinanceModule from "./FinanceModule";
import StudentModule from "./StudentModule";
import LibraryModule from "./LibraryModule";
import FacilitiesModule from "./FacilitiesModule";
import MeetingsModule from "./MeetingsModule";
import AcademicsModule from "./AcademicsModule";
import AdministrationModule from "./AdministrationModule";

const copy = {
  ko:{
    admin:"MRPST 관리자",dashboard:"대시보드",view:"홈페이지 보기 ↗",
    finance:"재정 관리",students:"학생 관리",academics:"학사 관리",facilities:"시설 관리",
    library:"도서관 관리",meetings:"회의 관리",administration:"회원 및 권한 관리",website:"홈페이지 관리",
    workspace:"관리 메뉴",back:"대시보드로 돌아가기",module:"관리 모듈"
  },
  my:{
    admin:"MRPST အုပ်ချုပ်ရေး",dashboard:"ဒက်ရှ်ဘုတ်",view:"ဝဘ်ဆိုက်ကြည့်ရန် ↗",
    finance:"ဘဏ္ဍာရေး",students:"ကျောင်းသား",academics:"ပညာရေး",facilities:"အဆောက်အအုံ",
    library:"စာကြည့်တိုက်",meetings:"အစည်းအဝေး",administration:"အသင်းဝင်နှင့် ခွင့်ပြုချက်",website:"ဝဘ်ဆိုက်",
    workspace:"စီမံခန့်ခွဲမှု",back:"ဒက်ရှ်ဘုတ်သို့ ပြန်သွားရန်",module:"စီမံခန့်ခွဲမှုကဏ္ဍ"
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
      return <main className="login-wrap"><section className="login-card"><span className="eyebrow">PERMISSION REQUIRED</span><h1>Module access restricted</h1><p className="login-intro">Your assigned role does not include access to {item.title}. Contact the Super Administrator if this access is required for your work.</p><Link className="btn secondary" href={`/${locale}/admin`}>{t.back}</Link></section></main>;
    }
  }
  const visible=Object.entries(MODULES).filter(([moduleKey])=>!supabase||canAccessModule(roles,moduleKey as keyof typeof MODULES,overrides));
  const moduleNames:Record<string,string>={finance:t.finance,students:t.students,academics:t.academics,facilities:t.facilities,library:t.library,meetings:t.meetings,administration:t.administration,website:t.website};
  return <><AdminMyanmarTranslator locale={locale}/><div className="admin">
    <aside className="sidebar">
      <div className="sidebar-nav">
        <Link href={`/${locale}`} className="brand"><span className="mark">M</span><span>MRPST<small>{t.admin}</small></span></Link>
        <div className="side-label">{t.workspace}</div>
        <Link className="side-link" href={`/${locale}/admin`}>{t.dashboard}</Link>
        {visible.map(([moduleKey,entry])=><Link className={moduleKey===key?"side-link active":"side-link"} href={`/${locale}/admin/${moduleKey}`} key={moduleKey}>{moduleNames[moduleKey]??entry.title}</Link>)}
      </div>
      <div className="sidebar-mobile-tools">
        <nav className="admin-language" aria-label="Language">
          <a className={lang==="my"?"selected":""} href={`/my/admin/${module}`}>မြန်မာ</a>
          <a className={lang==="ko"?"selected":""} href={`/ko/admin/${module}`}>한국어</a>
        </nav>
        <Link href={`/${locale}`}>{t.view}</Link>
        {supabase&&<AdminActions locale={locale}/>}
      </div>
    </aside>
    <main className="admin-main">
      <header className="topbar"><strong>{t.admin}</strong><div className="admin-user">
        <nav className="admin-language" aria-label="Language">
          <a className={lang==="my"?"selected":""} href={`/my/admin/${module}`}>မြန်မာ</a>
          <a className={lang==="ko"?"selected":""} href={`/ko/admin/${module}`}>한국어</a>
        </nav>
        <span>{userEmail||"Preview mode"}</span>
        <Link href={`/${locale}`}>{t.view}</Link>
        {supabase&&<AdminActions locale={locale}/>}
      </div></header>
      <div className="content">
        <span className="eyebrow">{t.module}</span>
        {key==="finance"?<FinanceModule/>:key==="students"?<StudentModule/>:key==="library"?<LibraryModule/>:key==="facilities"?<FacilitiesModule/>:key==="meetings"?<MeetingsModule/>:key==="academics"?<AcademicsModule/>:key==="administration"?<AdministrationModule/>:<><h1 className="admin-heading">{moduleNames[key]??item.title}</h1><p className="admin-subtitle">{item.description}</p><div className="module-placeholder"><strong>Module foundation</strong><p>This section is reserved for the {item.title.toLowerCase()} workflow. Data entry, approval steps, reporting and department-level database policies will be added in the next implementation phase.</p><span>Not connected to live records</span></div></>}
        <Link className="btn secondary" href={`/${locale}/admin`}>{t.back}</Link>
      </div>
    </main>
  </div></>;
}
