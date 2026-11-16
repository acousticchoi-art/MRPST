import Link from "next/link";
import dynamic from "next/dynamic";
import {redirect} from "next/navigation";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import {isSupabaseConfigured} from "@/lib/supabase/config";
import {MODULES,canAccessModule,type MrpstRole} from "@/lib/auth/permissions";
import AdminActions from "./AdminActions";
const AdminMyanmarTranslator=dynamic(()=>import("./AdminMyanmarTranslator"));

const copy = {
  en: {
    admin:"MRPST ADMINISTRATION", dashboard:"Dashboard", view:"View Website ↗",
    eyebrow:"INTEGRATED SCHOOL MANAGEMENT", title:"Administration Dashboard",
    subtitle:"Academic and school operations at a glance.",
    graduateTotal:"Total Graduates", currentStudents:"Current Students", schedule:"Schedule Management",
    modules:"Management", open:"Open →", groups:{academic:"Academic & Students",finance:"Finance",operations:"School Operations",system:"System & Website"},
    finance:["Financial Management","General finance, special funds, scholarship fund, budgets and approvals."],
    students:["Student Management","Student profiles, academic records and student scholarships."],
    academics:["Academic Management","Departments, courses, semesters, class schedules and academic results."],
    facilities:["School Facilities","Buildings, equipment inventory, vehicles, maintenance and repairs."],
    library:["Library Management","Book catalogue, circulation, loans, returns and library members."],
    meetings:["Meeting Materials","Academic committee, faculty and staff meeting records and documents."],
    administration:["Account & Permission Management","Create accounts, change passwords, assign roles and departments, and review changes."],
    website:["Website Management","Public website content, institutional history, announcements and contact details."],
    denied:"Access not assigned", deniedText:"Your account does not have an active MRPST profile and role. Ask the Super Administrator to grant access.",
    back:"Return to website", preview:"Preview mode: configure Supabase and assign staff roles to activate secure, role-specific access. Dashboard figures are placeholders."
  },
  ko: {
    admin:"MRPST 관리자", dashboard:"대시보드", view:"홈페이지 보기 ↗",
    eyebrow:"통합 학교 관리 시스템", title:"행정 대시보드",
    subtitle:"학사 및 학교 운영 현황을 한눈에 확인합니다.",
    graduateTotal:"총 졸업생", currentStudents:"재학생", schedule:"일정 관리",
    modules:"관리 메뉴", open:"열기 →", groups:{academic:"학사·학생",finance:"재정",operations:"학교 운영",system:"시스템·홈페이지"},
    finance:["재정 관리","일반 회계, 특별 기금, 장학 기금, 예산 및 지출 승인을 관리합니다."],
    students:["학생 관리","학생 인적 사항, 학적 기록 및 장학 내역을 관리합니다."],
    academics:["학사 관리","학과, 과목, 학기, 수업 시간표 및 학업 성적을 관리합니다."],
    facilities:["시설 관리","건물, 비품, 차량, 시설 유지 보수 및 수리를 관리합니다."],
    library:["도서관 관리","도서 목록, 대출·반납 및 도서관 이용자를 관리합니다."],
    meetings:["회의 자료","학사위원회와 교수·직원 회의 기록 및 문서를 관리합니다."],
    administration:["계정·권한 관리","회원 계정 생성, 비밀번호 변경, 역할·부서 지정 및 변경 이력을 관리합니다."],
    website:["홈페이지 관리","학교 소개, 연혁, 공지사항 및 연락처 등 홈페이지 콘텐츠를 관리합니다."],
    denied:"접근 권한이 없습니다", deniedText:"현재 계정에 활성화된 MRPST 프로필 또는 역할이 없습니다. 최고 관리자에게 권한을 요청하세요.",
    back:"홈페이지로 돌아가기", preview:"미리보기 모드: Supabase를 연결하고 직원 역할을 지정하면 권한별 관리 기능이 활성화됩니다. 통계는 데이터 연동 후 표시됩니다."
  },
  my: {
    admin:"MRPST အုပ်ချုပ်ရေး", dashboard:"ဒက်ရှ်ဘုတ်", view:"ဝဘ်ဆိုက်ကြည့်ရန် ↗",
    eyebrow:"ပေါင်းစည်းထားသော ကျောင်းစီမံခန့်ခွဲမှု", title:"အုပ်ချုပ်ရေး ဒက်ရှ်ဘုတ်",
    subtitle:"ပညာရေးနှင့် ကျောင်းလုပ်ငန်းဆောင်ရွက်မှု အခြေအနေများ။",
    graduateTotal:"ဘွဲ့ရကျောင်းသား စုစုပေါင်း", currentStudents:"လက်ရှိကျောင်းသား", schedule:"အချိန်ဇယား စီမံခန့်ခွဲမှု",
    modules:"စီမံခန့်ခွဲမှု", open:"ဖွင့်ရန် →", groups:{academic:"ပညာရေးနှင့် ကျောင်းသား",finance:"ဘဏ္ဍာရေး",operations:"ကျောင်းလုပ်ငန်း",system:"စနစ်နှင့် ဝဘ်ဆိုက်"},
    finance:["ဘဏ္ဍာရေးစီမံခန့်ခွဲမှု","အထွေထွေဘဏ္ဍာရေး၊ အထူးရန်ပုံငွေ၊ ပညာသင်ဆုရန်ပုံငွေ၊ ဘတ်ဂျက်နှင့် အတည်ပြုချက်များ။"],
    students:["ကျောင်းသားစီမံခန့်ခွဲမှု","ကျောင်းသားကိုယ်ရေးအချက်အလက်၊ ပညာရေးမှတ်တမ်းနှင့် ပညာသင်ဆုများ။"],
    academics:["ပညာရေးစီမံခန့်ခွဲမှု","ဌာန၊ သင်ခန်းစာ၊ စာသင်နှစ်၊ အချိန်ဇယားနှင့် ရလဒ်များ။"],
    facilities:["ကျောင်းအဆောက်အအုံနှင့် ပစ္စည်းများ","အဆောက်အအုံ၊ ပစ္စည်းစာရင်း၊ ယာဉ်၊ ပြုပြင်ထိန်းသိမ်းမှုများ။"],
    library:["စာကြည့်တိုက်စီမံခန့်ခွဲမှု","စာအုပ်စာရင်း၊ ငှားရမ်းခြင်း၊ ပြန်အပ်ခြင်းနှင့် အသင်းဝင်များ။"],
    meetings:["အစည်းအဝေးမှတ်တမ်းများ","ပညာရေးကော်မတီ၊ ဆရာ၊ ဆရာမနှင့် ဝန်ထမ်းအစည်းအဝေးမှတ်တမ်းများ။"],
    administration:["အကောင့်နှင့် ခွင့်ပြုချက်စီမံခန့်ခွဲမှု","အကောင့်ဖန်တီးခြင်း၊ စကားဝှက်ပြောင်းခြင်း၊ ရာထူးနှင့် ဌာနသတ်မှတ်ခြင်း။"],
    website:["ဝဘ်ဆိုက်စီမံခန့်ခွဲမှု","ကျောင်းအကြောင်းအရာ၊ သမိုင်းကြောင်း၊ ကြေညာချက်နှင့် ဆက်သွယ်ရန်အချက်အလက်။"],
    denied:"ဝင်ရောက်ခွင့် မရှိပါ", deniedText:"သင့်အကောင့်တွင် အသုံးပြုနိုင်သော MRPST အခန်းကဏ္ဍ မရှိပါ။ အုပ်ချုပ်ရေးမှူးထံ ဆက်သွယ်ပါ။",
    back:"ဝဘ်ဆိုက်သို့ ပြန်သွားရန်", preview:"အစမ်းကြည့်ရှုမှု: Supabase ချိတ်ဆက်ပြီး ဝန်ထမ်းရာထူးများ သတ်မှတ်ပါက စီမံခန့်ခွဲမှုကို အသုံးပြုနိုင်ပါမည်။"
  }
} as const;

export default async function Admin({params}:{params:Promise<{locale:string}>}) {
  const {locale}=await params;
  const lang=(locale==="my"?"my":"ko") as "my"|"ko";
  const t=copy[lang];
  const supabase=await createSupabaseServerClient();
  if(!supabase) return <main className="login-wrap"><section className="login-card"><span className="eyebrow">MRPST</span><h1>{lang==="my"?"စီမံခန့်ခွဲသူ ဝန်ဆောင်မှုသို့ ချိတ်ဆက်၍ မရပါ":"관리자 서비스에 연결할 수 없습니다"}</h1><p className="login-intro">{lang==="my"?"အကောင့်ဝင်ရောက်မှု ဝန်ဆောင်မှုကို မသတ်မှတ်ရသေးသောကြောင့် စီမံခန့်ခွဲသူစာမျက်နှာကို ဖွင့်၍မရပါ။ ဝန်ဆောင်မှုဆက်တင်များကို စစ်ဆေးပြီး ထပ်မံကြိုးစားပါ။":"로그인 서비스 설정이 확인되지 않아 관리자 화면을 열 수 없습니다. 서비스 설정을 확인한 뒤 다시 시도해 주세요."}</p><Link className="btn secondary" href={`/${locale}`}>{lang==="my"?"ဝဘ်ဆိုက်သို့ ပြန်သွားရန်":"홈페이지로 돌아가기"}</Link></section></main>;
  let userEmail="";
  let roles:MrpstRole[]=[];
  let moduleOverrides:{module_key:string;can_view:boolean}[]=[];
  let accessDenied=false;
  if(supabase){
    const {data:{user}}=await supabase.auth.getUser();
    if(!user) redirect(`/${locale}/login`);
    userEmail=user.email??"";
    const [{data:roleRows,error},{data:profile},{data:overrides}]=await Promise.all([
      supabase.from("user_roles").select("role, department_id").eq("user_id",user.id),
      supabase.from("user_profiles").select("is_active").eq("user_id",user.id).maybeSingle(),
      supabase.from("user_module_permissions").select("module_key,can_view").eq("user_id",user.id)
    ]);
    accessDenied=Boolean(error||!roleRows?.length||profile?.is_active!==true);
    roles=(roleRows??[]).map(row=>row.role as MrpstRole);
    moduleOverrides=overrides??[];
  }
  if(accessDenied) return <main className="login-wrap"><section className="login-card"><span className="eyebrow">MRPST</span><h1>{t.denied}</h1><p className="login-intro">{t.deniedText}</p><Link className="btn secondary" href={`/${locale}`}>{t.back}</Link></section></main>;
  const visible=Object.entries(MODULES).filter(([key])=>!supabase||canAccessModule(roles,key as keyof typeof MODULES,moduleOverrides));
  const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Yangon",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const [activeStudentCount,graduateCount,upcomingResult,announcementResult]=await Promise.all([
    supabase?supabase.from("students").select("id",{count:"exact",head:true}).eq("student_status","active"):Promise.resolve({count:null}),
    supabase?supabase.from("students").select("id",{count:"exact",head:true}).eq("student_status","graduated"):Promise.resolve({count:null}),
    supabase?supabase.from("academic_calendar_events").select("id,title,start_date,start_time,event_type,location").gte("start_date",today).order("start_date",{ascending:true}).limit(5):Promise.resolve({data:[]}),
    supabase?supabase.from("website_contents").select("content_key,title,body,is_published,updated_at").eq("content_type","announcement").eq("locale",locale).order("updated_at",{ascending:false}).limit(3):Promise.resolve({data:[]})
  ]);
  const hasStudentStats=activeStudentCount.count!==null&&graduateCount.count!==null;
  const upcomingEvents=upcomingResult.data??[];
  const recentAnnouncements=announcementResult.data??[];
  const moduleGroups=[["academic",["students","academics"]],["finance",["finance"]],["operations",["facilities","library","meetings"]],["system",["administration","website"]]] as const;
  const visibleInGroup=(keys:readonly string[])=>visible.filter(([key])=>keys.includes(key));
  return <>{locale==="my"&&<AdminMyanmarTranslator locale={locale}/>}<div className="admin">
    <aside className="sidebar">
      <div className="sidebar-nav">
        <Link href={`/${locale}`} className="brand"><span className="mark">M</span><span>MRPST<small>{t.admin}</small></span></Link>
        <div className="side-label">WORKSPACE</div>
        <Link className="side-link active" href={`/${locale}/admin`}>{t.dashboard}</Link>
        {moduleGroups.map(([group,keys])=>{const items=visibleInGroup(keys);return items.length>0?<div className="sidebar-group" key={group}><div className="side-label">{t.groups[group]}</div>{items.map(([key,item])=><Link className="side-link" href={`/${locale}/admin/${key}`} key={key}>{(t as any)[key]?.[0]??item.title}</Link>)}</div>:null;})}
      </div>
      <div className="sidebar-mobile-tools">
        <nav className="admin-language" aria-label="Language">
          <a className={locale==="my"?"selected":""} href="/my/admin">မြန်မာ</a><a className={locale==="ko"?"selected":""} href="/ko/admin">한국어</a>
        </nav>
        <Link href={`/${locale}`}>{t.view}</Link>
        {supabase&&<AdminActions locale={locale}/>}
      </div>
    </aside>
    <main className="admin-main">
      <header className="topbar"><strong>{t.admin}</strong><div className="admin-user">
        <nav className="admin-language" aria-label="Language">
          <a className={locale==="my"?"selected":""} href="/my/admin">မြန်မာ</a><a className={locale==="ko"?"selected":""} href="/ko/admin">한국어</a>
        </nav>
        <span>{userEmail||"Preview mode"}</span>
        <Link href={`/${locale}`}>{t.view}</Link>
        {supabase&&<AdminActions locale={locale}/>}
      </div></header>
      <div className="content"><span className="eyebrow">{t.eyebrow}</span><h1 className="admin-heading">{t.title}</h1><p className="admin-subtitle">{t.subtitle}</p>
        {!isSupabaseConfigured&&<div className="notice">{t.preview}</div>}
        <section className="dashboard-welcome">
          <div><span className="dashboard-date">{today}</span><h2>{lang==="ko"?"무슨 일을 하든지 마음을 다하여 주께 하듯 하고 사람에게 하듯 하지 말라.":"သင်တို့သည် ပြုလေသမျှသော အမှုတို့ကို သခင်ဘုရားအား ပြုသည်ဟု စိတ်နှလုံးအကြွင်းမဲ့ ပြုကြလော့။"}</h2><p>{lang==="ko"?"골로새서 3:23":"ကောလောသဲ ၃:၂၃"}</p></div>
          <div className="dashboard-welcome-mark">MRPST</div>
        </section>
        <section className="dashboard-stats">
          <article className="dashboard-stat"><span>{t.currentStudents}</span><strong>{hasStudentStats?activeStudentCount.count?.toLocaleString("en-US"):"—"}</strong><small>{lang==="ko"?"현재 재학 상태":"Active enrollment"}</small></article>
          <article className="dashboard-stat"><span>{t.graduateTotal}</span><strong>{hasStudentStats?graduateCount.count?.toLocaleString("en-US"):"—"}</strong><small>{lang==="ko"?"졸업 처리된 학생":"Graduated students"}</small></article>
          <article className="dashboard-stat"><span>{lang==="ko"?"이번 주 일정":"Upcoming this week"}</span><strong>{upcomingEvents.length}</strong><small>{lang==="ko"?"등록된 향후 일정":"Upcoming calendar entries"}</small></article>
        </section>
        <div className="dashboard-columns">
          <section className="dashboard-panel dashboard-schedule">
            <div className="dashboard-panel-head"><div><span className="eyebrow">{lang==="ko"?"ACADEMIC CALENDAR":"ACADEMIC CALENDAR"}</span><h2>{lang==="ko"?"다가오는 일정":"Upcoming Schedule"}</h2></div><Link href={`/${locale}/admin/academics`}>{lang==="ko"?"일정 관리 →":"Manage →"}</Link></div>
            {upcomingEvents.length? <div className="dashboard-event-list">{upcomingEvents.map((event:any)=><article key={event.id}><time>{event.start_date}{event.start_time?" · "+String(event.start_time).slice(0,5):""}</time><div><strong>{event.title}</strong>{event.location&&<small>{event.location}</small>}</div></article>)}</div>:<p className="dashboard-empty">{lang==="ko"?"예정된 일정이 없습니다.":"No upcoming events have been registered."}</p>}
          </section>
          <section className="dashboard-panel dashboard-announcements">
            <div className="dashboard-panel-head"><div><span className="eyebrow">{lang==="ko"?"MRPST NEWS":"MRPST NEWS"}</span><h2>{lang==="ko"?"최근 공지사항":"Recent Announcements"}</h2></div><Link href={`/${locale}/admin/website`}>{lang==="ko"?"공지사항 관리 →":"Manage →"}</Link></div>
            {recentAnnouncements.length?<div className="dashboard-announcement-list">{recentAnnouncements.map((item:any)=><article key={item.content_key}><div><strong>{item.title}</strong><p>{item.body}</p></div><span className={item.is_published?"published":"draft"}>{item.is_published?(lang==="ko"?"게시":"Published"):(lang==="ko"?"임시저장":"Draft")}</span></article>)}</div>:<p className="dashboard-empty">{lang==="ko"?"등록된 공지사항이 없습니다.":"No announcements have been registered."}</p>}
          </section>
        </div>
      </div>
    </main>
  </div></>;
}
