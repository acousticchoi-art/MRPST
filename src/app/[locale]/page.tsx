import Link from "next/link";
import {createSupabaseServerClient} from "@/lib/supabase/server";

const copy = {
  en: {
    about:"About", academics:"Academics", history:"History", contact:"Contact",
    title:"Forming faithful servants for the church and the world.",
    intro:"Rooted in Scripture and shaped by the Reformed tradition, MRPST prepares servants to proclaim the gospel, strengthen local churches and serve communities throughout Myanmar.",
    aboutTitle:"Theological education for faithful service",
    aboutText:"Myanmar Reformed Presbyterian School of Theology (MRPST) was established to equip faithful Christian leaders for the mission of the church in Myanmar. Its education is grounded in the authority of Scripture, the Westminster Confession of Faith and Presbyterian church order. In the Reformation and Puritan traditions, the school seeks to cultivate biblical conviction, godly character, sound theological understanding and practical ministry skills. MRPST has a particular concern for preparing leaders who can bring the gospel to communities and people groups with limited access to Christian witness.",
    departments:"Our academic departments",
    theology:"Department of Theology",
    theologyText:"Biblical and theological formation for Christian ministry, preaching, church leadership and mission.",
    ece:"Department of Early Childhood Education",
    eceText:"Preparing educators to nurture children through developmentally appropriate and Christ-centered education.",
    contactTitle:"Contact MRPST",
    historyIntro:"From its founding in Yangon to the development of theological degree programs, MRPST has continued to prepare leaders for the church in Myanmar.",
    milestones:[
      ["December 2007","MRPST was founded in Mingalardon, Yangon, through the united efforts of Korean missionaries, with an initial board of six members."],
      ["Foundational vision","The school established its theological foundation on the authority of Scripture, the Westminster Confession of Faith and Presbyterian church order, following the Reformed tradition."],
      ["2020","MRPST began cooperation with Evangelia University in the United States and expanded its library to more than 10,000 volumes."],
      ["2022","A three-year Master of Divinity (M.Div.) program taught in English was introduced alongside the four-year theology program taught in Burmese."],
      ["2024","MRPST graduates currently serve as pastors and ministry workers in approximately 50 churches under the Myanmar Reformed Presbyterian Church (MRPCC)."],
    ],
    contactText:"Contact the seminary for program information, admissions and institutional enquiries.",
    addressText:"No.286, 10th Kaya St, Thingangyungyi, Mingladon Township, Yangon, Myanmar"
  },
  my: {
    about:"ကျောင်းအကြောင်း", academics:"ပညာရေး", history:"သမိုင်း", contact:"ဆက်သွယ်ရန်",
    title:"အသင်းတော်နှင့် လူ့အဖွဲ့အစည်းအတွက် သစ္စာရှိသော အမှုတော်ဆောင်များကို ပြုစုပျိုးထောင်ခြင်း",
    intro:"သမ္မာကျမ်းစာနှင့် ပြုပြင်ပြောင်းလဲရေး ယုံကြည်ခြင်းအစဉ်အလာကို အခြေခံ၍ MRPST သည် မြန်မာနိုင်ငံရှိ အသင်းတော်များနှင့် လူမှုအသိုင်းအဝိုင်းများကို အမှုတော်ဆောင်နိုင်မည့် ခေါင်းဆောင်များကို ပြင်ဆင်ပေးပါသည်။",
    aboutTitle:"သစ္စာရှိစွာ အစေခံရန် ဓမ္မပညာသင်ကြားရေး",
    aboutText:"Myanmar Reformed Presbyterian School of Theology (MRPST) ကို မြန်မာနိုင်ငံရှိ အသင်းတော်၏ သာသနာလုပ်ငန်းအတွက် သစ္စာရှိသော ခရစ်ယာန်ခေါင်းဆောင်များကို ပြင်ဆင်ပေးရန် တည်ထောင်ခဲ့ပါသည်။ ကျောင်း၏ ပညာရေးသည် သမ္မာကျမ်းစာ၏ အခွင့်အာဏာ၊ Westminster ယုံကြည်ခြင်းဝန်ခံချက်နှင့် Presbyterian အသင်းတော်အုပ်ချုပ်မှုစနစ်တို့အပေါ် အခြေခံထားပါသည်။ ပြုပြင်ပြောင်းလဲရေးနှင့် Puritan အစဉ်အလာကို လိုက်နာကာ သမ္မာကျမ်းစာအပေါ် ခိုင်မာသောယုံကြည်မှု၊ ဘုရားတရားကြည်ညိုသောအသက်တာ၊ မှန်ကန်သောဓမ္မပညာနှင့် လက်တွေ့အမှုတော်ဆောင်နိုင်စွမ်းတို့ကို ပျိုးထောင်ပေးပါသည်။",
    departments:"ပညာရေးဌာနများ",
    theology:"ဓမ္မပညာဌာန",
    theologyText:"ခရစ်ယာန်အမှုတော်၊ တရားဟောခြင်း၊ အသင်းတော်ခေါင်းဆောင်မှုနှင့် သာသနာလုပ်ငန်းအတွက် သမ္မာကျမ်းစာနှင့် ဓမ္မပညာသင်ကြားမှု။",
    ece:"ကလေးသူငယ်ပညာရေးဌာန",
    eceText:"ကလေးများ၏ ဖွံ့ဖြိုးမှုနှင့် ခရစ်တော်ကို ဗဟိုပြုသော ပညာရေးအတွက် ဆရာ၊ ဆရာမများကို ပြင်ဆင်ပေးခြင်း။",
    contactTitle:"MRPST သို့ ဆက်သွယ်ရန်",
    historyIntro:"ရန်ကုန်မြို့တွင် စတင်တည်ထောင်ခဲ့သည့်အချိန်မှစ၍ MRPST သည် မြန်မာနိုင်ငံရှိ အသင်းတော်များအတွက် ခေါင်းဆောင်များကို ဆက်လက်ပြင်ဆင်ပေးလျက်ရှိပါသည်။",
    milestones:[
      ["၂၀၀၇ ဒီဇင်ဘာ","ကိုရီးယားသာသနာပြုဆရာများ၏ ပူးပေါင်းကြိုးပမ်းမှုဖြင့် ရန်ကုန်မြို့ မင်္ဂလာဒုံတွင် MRPST ကို စတင်တည်ထောင်ခဲ့ပြီး အစပိုင်းတွင် အုပ်ချုပ်ရေးဘုတ်အဖွဲ့ဝင် ၆ ဦးဖြင့် စတင်ခဲ့ပါသည်။"],
      ["တည်ထောင်မှုအခြေခံမူများ","သမ္မာကျမ်းစာ၏ လှုံ့ဆော်မှု၊ Westminster ယုံကြည်ခြင်းဝန်ခံချက်နှင့် Presbyterian အသင်းတော်အုပ်ချုပ်မှုစနစ်တို့ကို အခြေခံ၍ ပြုပြင်ပြောင်းလဲရေးနှင့် Puritan ဓမ္မပညာအစဉ်အလာကို သင်ကြားရန် ရည်ရွယ်ခဲ့ပါသည်။"],
      ["၂၀၂၀","အမေရိကန်နိုင်ငံရှိ Evangelia University နှင့် ပူးပေါင်းကာ ဓမ္မပညာဆိုင်ရာ ပိုမိုမြင့်မားသော ပညာရေးကို ဆက်လက်ဖော်ဆောင်ခဲ့ပါသည်။ ထိုကာလတွင် စာကြည့်တိုက်စာအုပ်ပေါင်း ၁၀,၀၀၀ ကျော် စုဆောင်းထားနိုင်ခဲ့ကြောင်း ဖော်ပြထားပါသည်။"],
      ["၂၀၂၂","မြန်မာဘာသာဖြင့် သင်ကြားသော ၄ နှစ်တာ ဓမ္မပညာသင်တန်းနှင့်အတူ အင်္ဂလိပ်ဘာသာဖြင့် သင်ကြားသော ၃ နှစ်တာ Master of Divinity (M.Div.) သင်တန်းကို ဖွင့်လှစ်ခဲ့ပါသည်။ ဂီတ၊ တူရိယာလက်တွေ့၊ ကွန်ပျူတာနှင့် အင်္ဂလိပ်စာကဲ့သို့ လက်တွေ့အမှုတော်အတွက် လိုအပ်သော ဘာသာရပ်များကိုလည်း ထည့်သွင်းသင်ကြားခဲ့ပါသည်။"],
      ["၂၀၂၄","MRPST ကျောင်းဆင်းများသည် Myanmar Reformed Presbyterian Church (MRPCC) လက်အောက်ရှိ အသင်းတော် ၅၀ ခန့်တွင် သင်းအုပ်ဆရာများနှင့် အမှုတော်ဆောင်များအဖြစ် လက်ရှိ အမှုတော်ထမ်းဆောင်လျက်ရှိပါသည်။"]
    ],
    contactText:"သင်တန်းအစီအစဉ်၊ ဝင်ခွင့်နှင့် ကျောင်းဆိုင်ရာ အချက်အလက်များအတွက် ဆက်သွယ်နိုင်ပါသည်။",
    addressText:"No.286, 10th Kaya St, Thingangyungyi, Mingladon Township, Yangon, Myanmar"
  },
  ko: {
    about:"학교 소개", academics:"학과 안내", history:"연혁", contact:"연락처",
    title:"교회와 세상을 섬기는 신실한 일꾼을 세웁니다.",
    intro:"MRPST는 성경과 개혁주의 신학을 바탕으로 미얀마 교회와 지역사회를 섬기고 복음을 전할 신실한 지도자를 양성합니다.",
    aboutTitle:"교회와 세상을 섬기는 신학교육",
    aboutText:"Myanmar Reformed Presbyterian School of Theology(MRPST)는 미얀마 교회의 사명에 동참할 신실한 기독교 지도자를 양성하기 위해 설립되었습니다. 교육의 기초는 성경의 권위와 웨스트민스터 신앙고백, 장로교 정치 원리입니다. 종교개혁과 청교도 전통에 뿌리를 둔 개혁주의 신학을 가르치며, 성경에 대한 확고한 신앙과 경건한 인격, 바른 신학적 이해, 실제 사역에 필요한 역량을 함께 세우는 것을 목표로 합니다. 특히 복음의 접촉이 제한된 미얀마의 여러 지역과 종족 공동체를 섬길 사역자를 준비하는 데 마음을 두고 있습니다.",
    departments:"학과 안내",
    theology:"신학과",
    theologyText:"목회와 설교, 교회 지도력 및 선교 사역에 필요한 성경·신학 교육을 제공합니다.",
    ece:"유아교육과",
    eceText:"아동 발달과 기독교 교육의 가치를 바탕으로 유아교육 전문가를 양성합니다.",
    contactTitle:"학교에 문의하기",
    historyIntro:"양곤에서 시작된 MRPST는 미얀마 교회를 섬길 지도자를 양성하며 신학교육과 현장 사역 훈련을 이어가고 있습니다.",
    milestones:[
      ["2007년 12월","한국 선교사들의 연합으로 양곤 밍글라돈(Mingalardon)에 MRPST가 설립되었습니다. 초기 이사회는 6명으로 구성되었습니다."],
      ["설립 이념과 교육 방향","성경의 권위와 웨스트민스터 신앙고백, 장로교 정치 원리를 교육의 기초로 삼고 종교개혁과 청교도 전통에 뿌리를 둔 개혁주의 신학을 따릅니다."],
      ["2020년","미국 에반겔리아대학교(Evangelia University)와 협력하고 도서관 장서를 1만 권 이상으로 확충했습니다."],
      ["2022년","버마어로 진행하는 4년제 신학과 과정과 함께 영어로 진행하는 3년제 목회학 석사(M.Div.) 과정을 개설했습니다."],
      ["2024년","현재 MRPST 졸업생들은 미얀마개혁장로교교회(MRPCC) 산하 약 50개 교회에서 목회자와 사역자로 섬기고 있습니다."],
    ],
    contactText:"입학과 교육과정에 관한 문의는 아래 이메일이나 문의 페이지를 이용해 주세요.",
    addressText:"No.286, 10th Kaya St, Thingangyungyi, Mingladon Township, Yangon, Myanmar"
  }
} as const;

const officialName = "Myanmar Reformed Presbyterian School of Theology";

export default async function Home({params}:{params:Promise<{locale:string}>}) {
  const {locale}=await params;
  const base=copy[locale as keyof typeof copy]??copy.ko;
  const supabase=await createSupabaseServerClient();
  let cmsRows:{content_type:string;content_key:string;title:string;body:string;is_published:boolean;updated_at:string}[]=[];
  if(supabase){
    const {data}=await supabase.from("website_contents").select("content_type,content_key,title,body,is_published,updated_at").eq("locale",locale).eq("is_published",true);
    cmsRows=(data??[]) as typeof cmsRows;
  }
  const page=(key:string)=>cmsRows.find(x=>x.content_type==="page"&&x.content_key===key);
  const t={...base,
    title:page("hero")?.title||base.title,
    intro:page("hero")?.body||base.intro,
    aboutTitle:page("about")?.title||base.aboutTitle,
    aboutText:page("about")?.body||base.aboutText,
    history:page("history")?.title||base.history,
    historyIntro:page("history")?.body||base.historyIntro,
    contactTitle:page("contact")?.title||base.contactTitle,
    contactText:page("contact")?.body||base.contactText,
    addressText:page("address")?.body||base.addressText
  };
  const announcements=cmsRows.filter(x=>x.content_type==="announcement").sort((a,b)=>b.updated_at.localeCompare(a.updated_at));
  return <>
    <header className="header">
      <Link href={`/${locale}`} className="brand"><span className="mark">M</span><span>MRPST<small>{officialName.toUpperCase()}</small></span></Link>
      <nav className="nav"><Link href={`/${locale}/about`}>{t.about}</Link><a href="#academics">{t.academics}</a><a href="#history">{t.history}</a><Link href={`/${locale}/calendar`}>{locale==="ko"?"학사 일정":"ပညာရေးပြက္ခဒိန်"}</Link><Link href={`/${locale}/contact`}>{t.contact}</Link></nav>
      <div className="header-tools"><div className="langs"><Link href="/my" aria-label="မြန်မာဘာသာ">မြန်မာ</Link><Link href="/ko" aria-label="한국어">한국어</Link></div><Link className="admin-link" href={`/${locale}/admin`}>{locale==="ko"?"관리자":"အုပ်ချုပ်ရေး"}</Link></div>
      <details className="mobile-menu"><summary aria-label="Open navigation menu"><span></span><span></span><span></span></summary><nav className="mobile-nav"><Link href={`/${locale}/about`}>{t.about}</Link><a href="#academics">{t.academics}</a><a href="#history">{t.history}</a><Link href={`/${locale}/calendar`}>{locale==="ko"?"학사 일정":"ပညာရေးပြက္ခဒိန်"}</Link><Link href={`/${locale}/contact`}>{t.contact}</Link><Link href={`/${locale}/admin`}>Admin</Link><div className="mobile-langs"><Link href="/my">မြန်မာ</Link><Link href="/ko">한국어</Link></div></nav></details>
    </header>
    <main className="homepage">
      <section className="hero hero-redesign">
        <div className="hero-copy">
          <span className="eyebrow">{locale==="ko"?"MYANMAR · YANGON · EST. 2007":"MYANMAR · YANGON · EST. 2007"}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
          <div className="actions">
            <a className="btn primary" href="#academics">{t.academics}<span aria-hidden="true"> ↗</span></a>
            <a className="btn secondary" href="#about">{t.about}</a>
          </div>
          <div className="hero-principles">
            <span>{locale==="ko"?"성경 중심":"သမ္မာကျမ်းစာကို ဗဟိုပြုခြင်း"}</span>
            <i />
            <span>{locale==="ko"?"개혁주의 신학":"ပြုပြင်ပြောင်းလဲရေး ဓမ္မပညာ"}</span>
            <i />
            <span>{locale==="ko"?"현장 중심의 섬김":"လက်တွေ့အမှုတော်"}</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-image" />
          <div className="hero-image-caption"><span>MRPST</span><small>{locale==="ko"?"신실한 일꾼을 세우는 신학교":"သစ္စာရှိသော အမှုတော်ဆောင်များကို ပြုစုပျိုးထောင်ခြင်း"}</small></div>
          <div className="hero-seal"><strong>MRPST</strong><span>REFORMED<br/>THEOLOGY</span></div>
        </div>
      </section>

      <section className="public-announcements"><div className="public-announcements-heading"><span className="eyebrow">{locale==="ko"?"MRPST 소식":"MRPST NEWS"}</span><h2>{locale==="ko"?"공지사항":"ကြေညာချက်များ"}</h2></div><div className="public-announcements-list">{announcements.length>0?announcements.map(item=><article className="public-announcement" key={item.content_key}><h3>{item.title}</h3><p>{item.body}</p></article>):<p className="public-announcements-empty">{locale==="ko"?"등록된 공지사항이 없습니다.":"ကြေညာချက် မရှိသေးပါ။"}</p>}</div></section>

      <section id="about" className="section intro-section home-intro-summary">
        <div className="intro-heading">
          <span className="eyebrow">{locale==="ko"?"01 — ABOUT MRPST":"01 — MRPST အကြောင်း"}</span>
          <h2>{locale==="ko"?"성경과 개혁신학 위에 세워진 신학교":"သမ္မာကျမ်းစာနှင့် ပြုပြင်ပြောင်းလဲရေး ဓမ္မပညာအပေါ် အခြေခံသော ကျောင်း"}</h2>
          <div className="gold-rule" />
          <p className="intro-note">{locale==="ko"?"올바른 신학, 올바른 신앙, 올바른 교회개척":"မှန်ကန်သော ဓမ္မပညာ၊ ယုံကြည်ခြင်းနှင့် အသင်းတော်တည်ထောင်ခြင်း"}</p>
        </div>
        <div className="intro-body">
          <p>{locale==="ko"?"MRPST는 2006년 설립된 학교법인 미얀마예수교장로회총회신학원이 운영하는 신학교입니다. 성경과 개혁주의 신학을 바탕으로 미얀마 교회와 사회를 섬길 영적 지도자를 양성합니다. 신학 교육과 유아교육을 통해 복음의 확장과 다음 세대의 건강한 성장을 함께 섬깁니다.":"MRPST ကို ၂၀၀၆ ခုနှစ်တွင် တည်ထောင်ခဲ့ပြီး သမ္မာကျမ်းစာနှင့် ပြုပြင်ပြောင်းလဲရေး ဓမ္မပညာကို အခြေခံ၍ မြန်မာနိုင်ငံရှိ အသင်းတော်နှင့် လူ့အဖွဲ့အစည်းကို အစေခံမည့် ဝိညာဉ်ရေးခေါင်းဆောင်များကို ပြုစုပျိုးထောင်ပါသည်။"}</p>
          <Link className="text-link" href={`/${locale}/about`}>{locale==="ko"?"학교 소개 자세히 보기":"ကျောင်းအကြောင်း အသေးစိတ်ကြည့်ရန်"}<span aria-hidden="true"> ↗</span></Link>
        </div>
      </section>

      <section className="principles-band">
        <div className="principle"><span>01</span><div><strong>{locale==="ko"?"성경의 권위":"သမ္မာကျမ်းစာ၏ အခွင့်အာဏာ"}</strong><p>{locale==="ko"?"모든 교육과 사역의 변하지 않는 기초":"ပညာရေးနှင့် အမှုတော်အားလုံး၏ အခြေခံ"}</p></div></div>
        <div className="principle"><span>02</span><div><strong>{locale==="ko"?"개혁주의 신앙":"ပြုပြင်ပြောင်းလဲရေး ယုံကြည်ခြင်း"}</strong><p>{locale==="ko"?"웨스트민스터 신앙고백에 기초한 신학":"Westminster ယုံကြည်ခြင်းဝန်ခံချက်ကို အခြေခံသော ဓမ္မပညာ"}</p></div></div>
        <div className="principle"><span>03</span><div><strong>{locale==="ko"?"교회와 지역사회":"အသင်းတော်နှင့် လူမှုအသိုင်းအဝိုင်း"}</strong><p>{locale==="ko"?"배운 진리를 삶과 현장의 섬김으로":"သင်ယူထားသော အမှန်တရားကို လက်တွေ့အသက်တာတွင် ကျင့်သုံးခြင်း"}</p></div></div>
      </section>

      <section id="academics" className="section academics-section">
        <div className="section-heading-row"><div><span className="eyebrow">{locale==="ko"?"02 — ACADEMICS":"02 — ACADEMICS"}</span><h2>{t.departments}</h2></div><p>{locale==="ko"?"배움이 소명으로 이어지도록, 각 분야의 전문성과 기독교적 가치관을 함께 세웁니다.":"ပညာသင်ယူမှုမှ ခေါ်တော်မူခြင်းသို့ ရောက်ရှိစေရန် ပညာရပ်ဆိုင်ရာ ကျွမ်းကျင်မှုနှင့် ခရစ်ယာန်တန်ဖိုးများကို အတူတကွ ပျိုးထောင်ပါသည်။"}</p></div>
        <div className="cards academic-cards">
          <article className="card academic-card theology-card"><div className="academic-card-top"><span>01 / THEOLOGY</span><span className="academic-symbol">✦</span></div><div><h3>{t.theology}</h3><p>{t.theologyText}</p></div><a href="#contact" aria-label={t.theology}> <span aria-hidden="true">↗</span></a></article>
          <article className="card academic-card education-card"><div className="academic-card-top"><span>02 / EDUCATION</span><span className="academic-symbol">✳</span></div><div><h3>{t.ece}</h3><p>{t.eceText}</p></div><a href="#contact" aria-label={t.ece}><span aria-hidden="true">↗</span></a></article>
        </div>
      </section>

      <section id="history" className="section history-section">
        <div className="history-intro"><span className="eyebrow">{locale==="ko"?"03 — OUR JOURNEY":"03 — OUR JOURNEY"}</span><h2>{t.history}</h2><p>{t.historyIntro}</p></div>
        <div className="history-timeline">{t.milestones.map(([year,description],i)=><article className="history-item" key={year}><div className="history-year">{year}</div><div className="history-copy"><h3>{year}</h3><p>{description}</p></div></article>)}</div>
      </section>

      <section id="contact" className="contact-section">
        <div className="contact"><div><span className="eyebrow">{locale==="ko"?"04 — GET IN TOUCH":"04 — GET IN TOUCH"}</span><h2>{t.contactTitle}</h2><p>{t.contactText}</p></div><div className="contact-action"><p className="contact-address">{t.addressText}</p><a className="btn light" href="https://maps.app.goo.gl/rqupUXw5JiumcrMv9?g_st=ic" target="_blank" rel="noopener noreferrer">{locale==="ko"?"구글 지도에서 위치 보기":"Google Maps ဖြင့် ကြည့်ရန်"} ↗</a><p className="contact-email"><a href="mailto:acousticchoi@gmail.com">acousticchoi@gmail.com</a></p><Link className="btn light" href={`/${locale}/contact`}>{locale==="ko"?"문의하기":"ဆက်သွယ်ရန်"} ↗</Link></div></div>
      </section>
    </main>
    <footer className="footer"><span>{officialName}</span><span><Link href={`/${locale}/contact`}>{t.contact}</Link> · © {new Date().getFullYear()} MRPST</span></footer>
  </>;
}
