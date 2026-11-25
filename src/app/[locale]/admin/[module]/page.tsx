import LanguageSwitcher from "../../LanguageSwitcher";
import Link from "next/link";
import type {ReactNode} from "react";
import dynamic from "next/dynamic";
import {notFound,redirect} from "next/navigation";
import {getServerModuleAccess} from "@/lib/auth/server-access";
import {MODULES,getModuleKey,canAccessModule} from "@/lib/auth/permissions";
import AdminActions from "../AdminActions";
import AdminMenuDetails from "../AdminMenuDetails";
import InlineAdminEditor from "../InlineAdminEditor";
import InlinePageEditor from "../../InlinePageEditor";
const AdminEnglishTranslator=dynamic(()=>import("../AdminEnglishTranslator"));
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
  en:{admin:"MRPST Administration",dashboard:"Dashboard",view:"View website ↗",finance:"Finance",students:"Student Management",academics:"Academic Management",facilities:"Facilities",library:"Library",meetings:"Meeting Records",administration:"Accounts & Permissions",website:"Website Management",workspace:"WORKSPACE",back:"Back to dashboard",groups:{academic:"Academic & Students",finance:"Finance",operations:"School Operations",system:"System & Website"}},
  ko:{
    admin:"MRPST 관리자",dashboard:"대시보드",view:"홈페이지 보기 ↗",
    finance:"재정 관리",students:"학생 관리",academics:"학사 관리",facilities:"시설 관리",
    library:"도서관 관리",meetings:"회의 자료",administration:"계정·권한 관리",website:"홈페이지 관리",
    workspace:"WORKSPACE",back:"대시보드로 돌아가기",groups:{academic:"학사·학생",finance:"재정",operations:"학교 운영",system:"시스템·홈페이지"}
  },
  my:{
    admin:"MRPST အုပ်ချုပ်ရေး",dashboard:"ဒက်ရှ်ဘုတ်",view:"ဝဘ်ဆိုက်ကြည့်ရန် ↗",
    finance:"ဘဏ္ဍာရေးစီမံခန့်ခွဲမှု",students:"ကျောင်းသားစီမံခန့်ခွဲမှု",academics:"ပညာရေးစီမံခန့်ခွဲမှု",facilities:"ကျောင်းအဆောက်အအုံနှင့် ပစ္စည်းများ",
    library:"စာကြည့်တိုက်စီမံခန့်ခွဲမှု",meetings:"အစည်းအဝေးမှတ်တမ်းများ",administration:"အကောင့်နှင့် ခွင့်ပြုချက်စီမံခန့်ခွဲမှု",website:"ဝဘ်ဆိုက်စီမံခန့်ခွဲမှု",
    workspace:"စီမံခန့်ခွဲမှု",back:"ဒက်ရှ်ဘုတ်သို့ ပြန်သွားရန်",groups:{academic:"ပညာရေးနှင့် ကျောင်းသား",finance:"ဘဏ္ဍာရေး",operations:"ကျောင်းလုပ်ငန်း",system:"စနစ်နှင့် ဝဘ်ဆိုက်"}
  }
} as const;

export default async function ModulePage({params}:{params:Promise<{locale:string;module:string}>}){
  const {locale,module}=await params;
  const lang=locale==="en"?"en":locale==="my"?"my":"ko";
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
  // Fetch the stored edit with the server-rendered page so it is available
  // before client-side modules mount and can be reapplied after re-renders.
  let inlineValues:Record<string,string>={};
  if(locale==="ko"){
    const {data}=await supabase.from("website_contents").select("body")
      .eq("content_type","page").eq("content_key",`inline-page-admin-${module}`)
      .eq("locale",locale).eq("is_published",true).maybeSingle();
    try{
      const saved=data?.body?JSON.parse(data.body):{};
      if(saved&&typeof saved==="object"&&!Array.isArray(saved))inlineValues=saved;
    }catch{}
  }
  const adminShell=(content:ReactNode)=>locale==="en"?content:locale==="my"?<InlineAdminEditor locale={locale}>{content}</InlineAdminEditor>:<InlinePageEditor pageKey={`admin-${module}`} locale={locale} initialValues={inlineValues}>{content}</InlinePageEditor>;
  return <>{locale==="en"&&<AdminEnglishTranslator/>}{locale==="my"&&<AdminMyanmarTranslator locale={locale}/>} {adminShell(<div className="admin">
    <aside className="sidebar">
      <Link href={`/${locale}/admin`} className="brand mobile-sidebar-brand"><span className="brand-logo"><img src="/mrpst-logo.png" alt="MRPST 공식 로고"/></span><span>MRPST<small>{t.admin}</small></span></Link>
      <AdminMenuDetails>
        <summary>{lang==="ko"?"관리 메뉴":"Menu"}</summary>
        <nav className="sidebar-nav">
          
          <div className="side-label">{t.workspace}</div>
          <Link className="side-link" href={`/${locale}/admin`}>{t.dashboard}</Link>
          {moduleGroups.map(([group,keys])=>{const items=visibleInGroup(keys);return items.length>0?<div className="sidebar-group" key={group}><div className="side-label">{t.groups[group]}</div>{items.map(([moduleKey,entry])=><Link className={moduleKey===key?"side-link active":"side-link"} href={`/${locale}/admin/${moduleKey}`} key={moduleKey}>{moduleNames[moduleKey]??entry.title}</Link>)}</div>:null;})}
        </nav>
      </AdminMenuDetails>
      <div className="sidebar-mobile-tools"><div data-no-inline-edit data-no-translate><LanguageSwitcher locale={lang}/></div><Link href={`/${locale}`}>{t.view}</Link>{supabase&&<AdminActions locale={locale}/>}</div>
      </aside>
    <main className="admin-main">
      <header className="topbar admin-desktop-topbar"><Link href={`/${locale}/admin`} className="brand admin-topbar-brand"><span className="brand-logo"><img src="/mrpst-logo.png" alt="MRPST 공식 로고"/></span><span>MRPST<small>{t.admin}</small></span></Link><div className="admin-user">
        <div data-no-inline-edit data-no-translate><LanguageSwitcher locale={lang}/></div>
        
        <Link href={`/${locale}`}>{t.view}</Link>
        {supabase&&<AdminActions locale={locale}/>}
      </div></header>
      <div className="content">
        {key==="finance"?<FinanceModule/>:key==="students"?<StudentModule/>:key==="library"?<LibraryModule canManage={access.canManage}/>:key==="facilities"?<FacilitiesModule canManage={access.canManage} locale={locale}/>:key==="meetings"?<MeetingsModule canManage={access.canManage}/>:key==="academics"?<AcademicsModule/>:key==="administration"?<AdministrationModule isSuperAdmin={access.canManage} callerId={user.id}/>:key==="website"?<WebsiteModule canManage={access.canManage}/>:<><h1 className="admin-heading">{moduleNames[key]??item.title}</h1><p className="admin-subtitle">{item.description}</p><div className="module-placeholder"><strong>Module foundation</strong><p>This area is reserved for the {item.title.toLowerCase()} workflow. Data entry, approval steps, reporting and department-level database policies will be added in the next implementation phase.</p><span>Not connected to live records</span></div></>}
          </div>
    </main>
  </div>)}</>;
}
