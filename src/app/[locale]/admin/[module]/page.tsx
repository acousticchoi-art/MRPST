import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import {MODULES,getModuleKey,canAccessModule,type MrpstRole} from "@/lib/auth/permissions";
import AdminActions from "../AdminActions";
import FinanceModule from "./FinanceModule";
import StudentModule from "./StudentModule";
import LibraryModule from "./LibraryModule";
import FacilitiesModule from "./FacilitiesModule";
import MeetingsModule from "./MeetingsModule";
import AcademicsModule from "./AcademicsModule";
import AdministrationModule from "./AdministrationModule";

const labels = {
  ko:{dashboard:"대시보드",finance:"재정 관리",students:"학생 관리",academics:"학사 관리",facilities:"시설 관리",library:"도서관",meetings:"회의 관리",administration:"행정 관리",website:"홈페이지 관리",home:"홈페이지 보기"},
  my:{dashboard:"ဒက်ရှ်ဘုတ်",finance:"ဘဏ္ဍာရေး",students:"ကျောင်းသား",academics:"ပညာရေး",facilities:"အဆောက်အအုံ",library:"စာကြည့်တိုက်",meetings:"အစည်းအဝေး",administration:"အုပ်ချုပ်ရေး",website:"ဝဘ်ဆိုက်",home:"ဝဘ်ဆိုက်ကြည့်ရန်"}
} as const;

export default async function ModulePage({params}:{params:Promise<{locale:string;module:string}>}){
  const {locale,module}=await params;
  const lang=locale==="my"?"my":"ko";
  const t=labels[lang];
  const key=getModuleKey(module);
  if(!key)notFound();
  const item=MODULES[key];
  const supabase=await createSupabaseServerClient();
  let email="";
  let visibleModules=Object.entries(MODULES);
  if(supabase){
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)redirect(`/${locale}/login`);
    email=user.email??"";
    const [{data:roleRows,error},{data:profile},{data:overrides}]=await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id",user.id),
      supabase.from("user_profiles").select("is_active").eq("user_id",user.id).maybeSingle(),
      supabase.from("user_module_permissions").select("module_key,can_view").eq("user_id",user.id)
    ]);
    const roles=(roleRows??[]).map(row=>row.role as MrpstRole);
    if(error||profile?.is_active!==true||!canAccessModule(roles,key,overrides??[])){
      return <main className="login-wrap"><section className="login-card"><span className="eyebrow">PERMISSION REQUIRED</span><h1>Module access restricted</h1><p className="login-intro">Your assigned role does not include access to {item.title}. Contact the Super Administrator if this access is required for your work.</p><Link className="btn secondary" href={`/${locale}/admin`}>Back to dashboard</Link></section></main>;
    }
    visibleModules=Object.entries(MODULES).filter(([moduleKey])=>canAccessModule(roles,moduleKey as keyof typeof MODULES,overrides??[]));
  }
  return <main className="module-page">
    <header className="admin-global-nav">
      <div className="admin-global-nav-top">
        <Link href={`/${locale}/admin`} className="admin-global-brand"><span className="admin-global-mark">M</span><span>MRPST<small>{lang==="ko"?"관리자":"အုပ်ချုပ်ရေး"}</small></span></Link>
        <div className="admin-global-tools">
          <nav className="admin-language" aria-label="Language">
            <a className={lang==="my"?"selected":""} href={`/my/admin/${module}`}>မြန်မာ</a>
            <a className={lang==="ko"?"selected":""} href={`/ko/admin/${module}`}>한국어</a>
          </nav>
          <Link className="admin-global-home" href={`/${locale}`}>{t.home}</Link>
          {supabase&&<AdminActions locale={locale}/>}
        </div>
      </div>
      <nav className="admin-global-links" aria-label="관리자 메뉴">
        <Link className="admin-global-link" href={`/${locale}/admin`}>{t.dashboard}</Link>
        {visibleModules.map(([moduleKey,entry])=><Link key={moduleKey} className={moduleKey===key?"admin-global-link active":"admin-global-link"} href={`/${locale}/admin/${moduleKey}`}>{t[moduleKey as keyof typeof t]??entry.title}</Link>)}
      </nav>
    </header>
    <section className="module-page-content">
      <span className="eyebrow">{lang==="ko"?"관리 모듈":"စီမံခန့်ခွဲမှုကဏ္ဍ"}</span>
      {key==="finance"?<FinanceModule/>:key==="students"?<StudentModule/>:key==="library"?<LibraryModule/>:key==="facilities"?<FacilitiesModule/>:key==="meetings"?<MeetingsModule/>:key==="academics"?<AcademicsModule/>:key==="administration"?<AdministrationModule/>:<><h1>{item.title}</h1><p>{item.description}</p><div className="module-placeholder"><strong>Module foundation</strong><p>This section is reserved for the {item.title.toLowerCase()} workflow. Data entry, approval steps, reporting and department-level database policies will be added in the next implementation phase.</p><span>Not connected to live records</span></div></>}
      <Link className="btn secondary" href={`/${locale}/admin`}>{lang==="ko"?"대시보드로 돌아가기":"ဒက်ရှ်ဘုတ်သို့ ပြန်သွားရန်"}</Link>
    </section>
  </main>;
}
