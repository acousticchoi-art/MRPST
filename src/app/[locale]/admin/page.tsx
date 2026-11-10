import Link from "next/link";
import {redirect} from "next/navigation";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import {isSupabaseConfigured} from "@/lib/supabase/config";
import {MODULES,canAccessModule,type MrpstRole} from "@/lib/auth/permissions";
import AdminActions from "./AdminActions";

const copy = {
  en: {
    admin:"MRPST ADMINISTRATION", dashboard:"Dashboard", view:"View Website ↗",
    eyebrow:"INTEGRATED SCHOOL MANAGEMENT", title:"Administration Dashboard",
    subtitle:"Academic and school operations at a glance.",
    graduateTotal:"Total Graduates", currentStudents:"Current Students", schedule:"Schedule Management",
    modules:"Management Modules", open:"Open module →",
    finance:["Financial Management","General finance, special funds, scholarship fund, budgets and approvals."],
    students:["Student Management","Student profiles, academic records and student scholarships."],
    academics:["Academic Management","Departments, courses, semesters, class schedules and academic results."],
    facilities:["School Facilities","Buildings, equipment inventory, vehicles, maintenance and repairs."],
    library:["Library Management","Book catalogue, circulation, loans, returns and library members."],
    meetings:["Meeting Materials","Academic committee, faculty and staff meeting records and documents."],
    administration:["Member & Permission Management","Create accounts, change passwords, assign roles and departments, and review changes."],
    website:["Website Management","Public website content, institutional history, announcements and contact details."],
    denied:"Access not assigned", deniedText:"Your account does not have an active MRPST profile and role. Ask the Super Administrator to grant access.",
    back:"Return to website", preview:"Preview mode: configure Supabase and assign staff roles to activate secure, role-specific access. Dashboard figures are placeholders."
  },
  ko: {
    admin:"MRPST 관리자", dashboard:"대시보드", view:"홈페이지 보기 ↗",
    eyebrow:"통합 학교 관리 시스템", title:"행정 대시보드",
    subtitle:"학사 및 학교 운영 현황을 한눈에 확인합니다.",
    graduateTotal:"총 졸업생", currentStudents:"재학생", schedule:"일정 관리",
    modules:"관리 모듈", open:"모듈 열기 →",
    finance:["재정 관리","일반 회계, 특별 기금, 장학 기금, 예산 및 지출 승인을 관리합니다."],
    students:["학생 관리","학생 인적 사항, 학적 기록 및 장학 내역을 관리합니다."],
    academics:["학사 관리","학과, 과목, 학기, 수업 시간표 및 학업 성적을 관리합니다."],
    facilities:["시설 관리","건물, 비품, 차량, 시설 유지 보수 및 수리를 관리합니다."],
    library:["도서관 관리","도서 목록, 대출·반납 및 도서관 이용자를 관리합니다."],
    meetings:["회의 자료","학사위원회와 교수·직원 회의 기록 및 문서를 관리합니다."],
    administration:["회원 및 권한 관리","회원 계정 생성, 비밀번호 변경, 역할·부서 지정 및 변경 이력을 관리합니다."],
    website:["홈페이지 관리","학교 소개, 연혁, 공지사항 및 연락처 등 홈페이지 콘텐츠를 관리합니다."],
    denied:"접근 권한이 없습니다", deniedText:"현재 계정에 활성화된 MRPST 프로필 또는 역할이 없습니다. 최고 관리자에게 권한을 요청하세요.",
    back:"홈페이지로 돌아가기", preview:"미리보기 모드: Supabase를 연결하고 직원 역할을 지정하면 권한별 관리 기능이 활성화됩니다. 통계는 데이터 연동 후 표시됩니다."
  },
  my: {
    admin:"MRPST အုပ်ချုပ်ရေး", dashboard:"ဒက်ရှ်ဘုတ်", view:"ဝဘ်ဆိုက်ကြည့်ရန် ↗",
    eyebrow:"ပေါင်းစည်းထားသော ကျောင်းစီမံခန့်ခွဲမှု", title:"အုပ်ချုပ်ရေး ဒက်ရှ်ဘုတ်",
    subtitle:"ပညာရေးနှင့် ကျောင်းလုပ်ငန်းဆောင်ရွက်မှု အခြေအနေများ။",
    graduateTotal:"ဘွဲ့ရကျောင်းသား စုစုပေါင်း", currentStudents:"လက်ရှိကျောင်းသား", schedule:"အချိန်ဇယား စီမံခန့်ခွဲမှု",
    modules:"စီမံခန့်ခွဲမှုကဏ္ဍများ", open:"ဖွင့်ရန် →",
    finance:["ဘဏ္ဍာရေးစီမံခန့်ခွဲမှု","အထွေထွေဘဏ္ဍာရေး၊ အထူးရန်ပုံငွေ၊ ပညာသင်ဆုရန်ပုံငွေ၊ ဘတ်ဂျက်နှင့် အတည်ပြုချက်များ။"],
    students:["ကျောင်းသားစီမံခန့်ခွဲမှု","ကျောင်းသားကိုယ်ရေးအချက်အလက်၊ ပညာရေးမှတ်တမ်းနှင့် ပညာသင်ဆုများ။"],
    academics:["ပညာရေးစီမံခန့်ခွဲမှု","ဌာန၊ သင်ခန်းစာ၊ စာသင်နှစ်၊ အချိန်ဇယားနှင့် ရလဒ်များ။"],
    facilities:["ကျောင်းအဆောက်အအုံနှင့် ပစ္စည်းများ","အဆောက်အအုံ၊ ပစ္စည်းစာရင်း၊ ယာဉ်၊ ပြုပြင်ထိန်းသိမ်းမှုများ။"],
    library:["စာကြည့်တိုက်စီမံခန့်ခွဲမှု","စာအုပ်စာရင်း၊ ငှားရမ်းခြင်း၊ ပြန်အပ်ခြင်းနှင့် အသင်းဝင်များ။"],
    meetings:["အစည်းအဝေးမှတ်တမ်းများ","ပညာရေးကော်မတီ၊ ဆရာ၊ ဆရာမနှင့် ဝန်ထမ်းအစည်းအဝေးမှတ်တမ်းများ။"],
    administration:["အသင်းဝင်နှင့် ခွင့်ပြုချက်စီမံခန့်ခွဲမှု","အကောင့်ဖန်တီးခြင်း၊ စကားဝှက်ပြောင်းခြင်း၊ ရာထူးနှင့် ဌာနသတ်မှတ်ခြင်း။"],
    website:["ဝဘ်ဆိုက်စီမံခန့်ခွဲမှု","ကျောင်းအကြောင်းအရာ၊ သမိုင်းကြောင်း၊ ကြေညာချက်နှင့် ဆက်သွယ်ရန်အချက်အလက်။"],
    denied:"ဝင်ရောက်ခွင့် မရှိပါ", deniedText:"သင့်အကောင့်တွင် အသုံးပြုနိုင်သော MRPST အခန်းကဏ္ဍ မရှိပါ။ အုပ်ချုပ်ရေးမှူးထံ ဆက်သွယ်ပါ။",
    back:"ဝဘ်ဆိုက်သို့ ပြန်သွားရန်", preview:"အစမ်းကြည့်ရှုမှု: Supabase ချိတ်ဆက်ပြီး ဝန်ထမ်းရာထူးများ သတ်မှတ်ပါက စီမံခန့်ခွဲမှုကို အသုံးပြုနိုင်ပါမည်။"
  }
} as const;

export default async function Admin({params}:{params:Promise<{locale:string}>}) {
  const {locale}=await params;
  const lang=(locale in copy?locale:"en") as keyof typeof copy;
  const t=copy[lang];
  const supabase=await createSupabaseServerClient();
  let userEmail="";
  let roles:MrpstRole[]=[];
  let accessDenied=false;
  if(supabase){
    const {data:{user}}=await supabase.auth.getUser();
    if(!user) redirect(`/${locale}/login`);
    userEmail=user.email??"";
    const [{data:roleRows,error},{data:profile}]=await Promise.all([
      supabase.from("user_roles").select("role, department_id").eq("user_id",user.id),
      supabase.from("user_profiles").select("is_active").eq("user_id",user.id).maybeSingle()
    ]);
    accessDenied=Boolean(error||!roleRows?.length||profile?.is_active!==true);
    roles=(roleRows??[]).map(row=>row.role as MrpstRole);
  }
  if(accessDenied) return <main className="login-wrap"><section className="login-card"><span className="eyebrow">MRPST</span><h1>{t.denied}</h1><p className="login-intro">{t.deniedText}</p><Link className="btn secondary" href={`/${locale}`}>{t.back}</Link></section></main>;
  let graduateCount: number | null = null;
  let currentStudentCount: number | null = null;
  if(supabase && !accessDenied){
    const [{count:graduates},{count:currentStudents}]=await Promise.all([
      supabase.from("students").select("id",{count:"exact",head:true}).eq("student_status","graduated"),
      supabase.from("students").select("id",{count:"exact",head:true}).in("student_status",["active","leave"])
    ]);
    graduateCount=graduates??0;
    currentStudentCount=currentStudents??0;
  }
  const visible=Object.entries(MODULES).filter(([key])=>!supabase||canAccessModule(roles,key as keyof typeof MODULES));
  return <div className="admin">
    <aside className="sidebar">
      <Link href={`/${locale}`} className="brand"><span className="mark">M</span><span>MRPST<small>{t.admin}</small></span></Link>
      <div className="side-label">WORKSPACE</div>
      <Link className="side-link active" href={`/${locale}/admin`}>{t.dashboard}</Link>
      {visible.map(([key,item])=><Link className="side-link" href={`/${locale}/admin/${key}`} key={key}>{t[key as keyof typeof t]?.[0]??item.title}</Link>)}
    </aside>
    <main className="admin-main">
      <header className="topbar"><strong>{t.admin}</strong><div className="admin-user">
        <nav className="admin-language" aria-label="Language">
          <a className={locale==="en"?"selected":""} href="/en/admin">EN</a><a className={locale==="my"?"selected":""} href="/my/admin">MY</a><a className={locale==="ko"?"selected":""} href="/ko/admin">KO</a>
        </nav><span>{userEmail||"Preview mode"}</span><Link href={`/${locale}`}>{t.view}</Link>{supabase&&<AdminActions locale={locale}/>}
      </div></header>
      <div className="content"><span className="eyebrow">{t.eyebrow}</span><h1 className="admin-heading">{t.title}</h1><p className="admin-subtitle">{t.subtitle}</p>
        {!isSupabaseConfigured&&<div className="notice">{t.preview}</div>}
        <div className="stats dashboard-overview">
          <div className="stat"><span>{t.graduateTotal}</span><strong>{graduateCount===null?"—":graduateCount}</strong></div>
          <div className="stat"><span>{t.currentStudents}</span><strong>{currentStudentCount===null?"—":currentStudentCount}</strong></div>
          <Link className="stat schedule-stat" href={`/${locale}/admin/academics`}><span>{t.schedule}</span><strong>{t.open}</strong></Link>
        </div>
        <div className="module-heading"><h2>{t.modules}</h2><span>{visible.length}{lang==="ko"?"개 모듈 사용 가능":lang==="my"?" ကဏ္ဍ အသုံးပြုနိုင်သည်": " available modules"}</span></div>
        <div className="modules">{visible.map(([key,item])=>{const words=t[key as keyof typeof t] as readonly string[];return <Link href={`/${locale}/admin/${key}`} className="module" key={key}><strong>{words?.[0]??item.title}</strong><p>{words?.[1]??item.description}</p><span className="module-open">{t.open}</span></Link>})}</div>
      </div>
    </main>
  </div>;
}
