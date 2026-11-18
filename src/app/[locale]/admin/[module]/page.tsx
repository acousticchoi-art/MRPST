import Link from "next/link";
import dynamic from "next/dynamic";
import {notFound,redirect} from "next/navigation";
import {getServerModuleAccess} from "@/lib/auth/server-access";
import {MODULES,getModuleKey,canAccessModule} from "@/lib/auth/permissions";
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
  const access=await getServerModuleAccess(key);
  if(!access.ok){
    if(access.status===401)redirect(`/${locale}/login`);
    return <main className="login-wrap"><section className="login-card"><span className="eyebrow">PERMISSION REQUIRED</span><h1>Access restricted</h1><p className="login-intro">{access.error}</p></section></main>;
  }
  const {supabase,roles,permissions:overrides,user}=access;
  const visible=Object.entries(MODULES).filter(([moduleKey])=>canAccessModule(roles,moduleKey as keyof typeof MODULES,overrides));
  const moduleGroups=[["academic",["students","academics"]],["finance",["finance"]],["operations",["facilities","library","meetings"]],["system",["administration","website"]]] as const;
  const visibleInGroup=(keys:readonly string[])=>visible.filter(([moduleKey])=>keys.includes(moduleKey));
  const moduleNames:Record<string,string>={finance:t.finance,students:t.students,academics:t.academics,facilities:t.facilities,library:t.library,meetings:t.meetings,administration:t.administration,website:t.website};
  return <>{locale==="my"&&<AdminMyanmarTranslator locale={locale}/>}<div className="admin">
    <aside className="sidebar">
      <details className="admin-menu-details" open>
        <summary>{lang==="ko"?"관리 메뉴":"Menu"}</summary>
        <nav className="sidebar-nav">
          <div className="side-label">{t.workspace}</div>
          <Link className="side-link" href={`/${locale}/admin`}>{t.dashboard}</Link>
          {moduleGroups.map(([group,keys])=>{const items=visibleInGroup(keys);return items.length>0?<div className="sidebar-group" key={group}><div className="side-label">{t.groups[group]}</div>{items.map(([moduleKey,entry])=><Link className={moduleKey===key?"side-link active":"side-link"} href={`/${locale}/admin/${moduleKey}`} key={moduleKey}>{moduleNames[moduleKey]??entry.title}</Link>)}</div>:null;})}
        </nav>
      </details>
      </aside>
    <main className="admin-main">
      <header className="topbar"><Link href={`/${locale}`} className="brand admin-topbar-brand"><span className="brand-logo"><img src="/mrpst-logo.png" alt="MRPST 공식 로고"/></span><span>MRPST<small>{t.admin}</small></span></Link><div className="admin-user">
        <nav className="admin-language" aria-label="Language">
          <a className={lang==="my"?"selected":""} href={`/my/admin/${module}`}>မြန်မာ</a>
          <a className={lang==="ko"?"selected":""} href={`/ko/admin/${module}`}>한국어</a>
        </nav>
        
        <Link href={`/${locale}`}>{t.view}</Link>
        {supabase&&<AdminActions locale={locale}/>}
      </div></header>
      <div className="content">
        {key==="finance"?<FinanceModule/>:key==="students"?<StudentModule/>:key==="library"?<LibraryModule canManage={access.canManage}/>:key==="facilities"?<FacilitiesModule canManage={access.canManage}/>:key==="meetings"?<MeetingsModule canManage={access.canManage}/>:key==="academics"?<AcademicsModule/>:key==="administration"?<AdministrationModule/>:key==="website"?<WebsiteModule canManage={access.canManage}/>:<><h1 className="admin-heading">{moduleNames[key]??item.title}</h1><p className="admin-subtitle">{item.description}</p><div className="module-placeholder"><strong>Module foundation</strong><p>This area is reserved for the {item.title.toLowerCase()} workflow. Data entry, approval steps, reporting and department-level database policies will be added in the next implementation phase.</p><span>Not connected to live records</span></div></>}
          </div>
    </main>
  </div></>;
}
