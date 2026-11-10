import Link from "next/link";

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
    contactTitle:"Connect with MRPST",
    historyIntro:"From its founding in Yangon to the development of theological degree programs, MRPST has continued to prepare leaders for the church in Myanmar.",
    milestones:[
      ["December 2007","MRPST was established in Mingalardon, Yangon, through the united efforts of Korean missionaries, with an initial board of six members. Its founding vision was to train leaders to share the gospel among unreached communities in Myanmar."],
      ["Foundational commitments","The school set its educational direction on the inspiration of Scripture, the Westminster Confession of Faith and Presbyterian church order, with Reformed theology shaped by the Reformation and Puritan traditions."],
      ["2020","MRPST's ministry development included cooperation with Evangelia University in the United States for further theological training. The school also reported building its library collection to more than 10,000 volumes."],
      ["2022","A three-year Master of Divinity (M.Div.) program taught in English was introduced alongside the four-year theology program taught in Burmese. The curriculum also included practical subjects such as music, instrumental practice, computer skills and English."],
      ["2024","A report by the MRPST Student Affairs Director described graduates serving in approximately 50 churches connected with the Myanmar Reformed Presbyterian Community Church and highlighted ongoing work in theological education, faculty development and church planting."]
    ],
    contactText:"Contact the seminary for program information, admissions and institutional enquiries.",
    addressText:"Official address, phone number and email will be added after confirmation."
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
      ["၂၀၂၄","MRPST ကျောင်းသားရေးရာတာဝန်ခံ၏ အစီရင်ခံစာတွင် ကျောင်းဆင်းများသည် Myanmar Reformed Presbyterian Community Church နှင့် ဆက်စပ်သော အသင်းတော် ၅၀ ခန့်တွင် အမှုတော်ဆောင်နေကြောင်း ဖော်ပြထားပြီး ဓမ္မပညာသင်ကြားရေး၊ ဆရာအင်အားပြုစုပျိုးထောင်ရေးနှင့် အသင်းတော်တည်ထောင်ရေးလုပ်ငန်းများကို ဆက်လက်အလေးထားကြောင်း ဖော်ပြထားပါသည်။"]
    ],
    contactText:"သင်တန်းအစီအစဉ်၊ ဝင်ခွင့်နှင့် ကျောင်းဆိုင်ရာ အချက်အလက်များအတွက် ဆက်သွယ်နိုင်ပါသည်။",
    addressText:"တရားဝင်လိပ်စာ၊ ဖုန်းနံပါတ်နှင့် အီးမေးလ်ကို အတည်ပြုပြီး ထည့်သွင်းပါမည်။"
  },
  ko: {
    about:"학교 소개", academics:"학과 안내", history:"연혁", contact:"연락처",
    title:"교회와 세상을 섬기는 신실한 일꾼을 세웁니다.",
    intro:"성경에 뿌리를 두고 개혁주의 전통을 따라 MRPST는 미얀마 교회와 지역사회를 섬기며 복음을 전할 신실한 지도자를 양성합니다.",
    aboutTitle:"신실한 섬김을 위한 신학교육",
    aboutText:"Myanmar Reformed Presbyterian School of Theology(MRPST)는 미얀마 교회의 사명에 동참할 신실한 기독교 지도자를 양성하기 위해 설립되었습니다. 교육의 기초는 성경의 권위와 웨스트민스터 신앙고백, 장로교 정치 원리입니다. 종교개혁과 청교도 전통에 뿌리를 둔 개혁주의 신학을 가르치며, 성경에 대한 확고한 신앙과 경건한 인격, 바른 신학적 이해, 실제 사역에 필요한 역량을 함께 세우는 것을 목표로 합니다. 특히 복음의 접촉이 제한된 미얀마의 여러 지역과 종족 공동체를 섬길 사역자를 준비하는 데 마음을 두고 있습니다.",
    departments:"교육 학과",
    theology:"신학과",
    theologyText:"기독교 사역과 설교, 교회 지도력 및 선교를 위한 성경·신학 교육을 제공합니다.",
    ece:"유아교육과",
    eceText:"아동 발달과 기독교적 교육 가치에 기초하여 유아교육 전문인을 양성합니다.",
    contactTitle:"MRPST와 연결되세요",
    historyIntro:"양곤에서 시작된 MRPST는 미얀마 교회를 섬길 지도자를 세우기 위해 신학교육과 사역 훈련을 이어가고 있습니다.",
    milestones:[
      ["2007년 12월","한국 선교사들의 연합으로 양곤 밍글라돈(Mingalardon)에 MRPST가 개교했습니다. 초기에는 6명의 이사와 함께 학교의 기초를 세웠으며, 미얀마의 미전도 공동체에 복음을 전할 지도자를 양성하는 비전을 품었습니다."],
      ["설립 이념과 교육 방향","성경의 유기적 영감설, 웨스트민스터 신앙고백, 장로교 정치체제를 교육의 기초로 삼았습니다. 종교개혁과 청교도 전통에 기초한 개혁주의 신학을 가르치고 설교자와 전도자를 세우는 것을 핵심 방향으로 정했습니다."],
      ["2020년","미국 에반겔리아대학교(Evangelia University)와 협력하여 신학 분야의 심화 교육을 이어갔습니다. 같은 시기 학교는 1만 권 이상의 장서를 확보하며 도서관 기반을 확충했습니다."],
      ["2022년","버마어로 진행하는 4년제 신학과 과정과 함께 영어로 진행하는 3년제 목회학 석사(M.Div.) 과정을 개설했습니다. 음악 이론과 악기 실습, 컴퓨터, 영어 등 실제 사역에 필요한 교양 교육도 교육과정에 포함했습니다."],
      ["2024년","MRPST 학생처장이 발표한 사역 보고서는 졸업생들이 미얀마개혁장로교공동체교회(MRPCC) 산하 약 50개 교회에서 사역하고 있다고 소개했습니다. 또한 신학교육과 교수 인력 양성, 교회 개척을 앞으로의 주요 과제로 제시했습니다."]
    ],
    contactText:"교육과정, 입학 및 학교 관련 문의는 아래 연락처를 통해 해주시기 바랍니다.",
    addressText:"공식 주소와 전화번호, 이메일은 확인 후 안내할 예정입니다."
  }
} as const;

const officialName = "Myanmar Reformed Presbyterian School of Theology";

export default async function Home({params}:{params:Promise<{locale:string}>}) {
  const {locale}=await params;
  const t=copy[locale as keyof typeof copy]??copy.en;
  return <>
    <header className="header">
      <Link href={`/${locale}`} className="brand"><span className="mark">M</span><span>MRPST<small>{officialName.toUpperCase()}</small></span></Link>
      <nav className="nav"><a href="#about">{t.about}</a><a href="#academics">{t.academics}</a><a href="#history">{t.history}</a><a href="#contact">{t.contact}</a></nav>
      <div className="header-tools"><div className="langs"><Link href="/en" aria-label="English">EN</Link><Link href="/my" aria-label="Myanmar">MY</Link><Link href="/ko" aria-label="Korean">KO</Link></div><Link className="admin-link" href={`/${locale}/admin`}>Admin</Link></div>
      <details className="mobile-menu"><summary aria-label="Open navigation menu"><span></span><span></span><span></span></summary><nav className="mobile-nav"><a href="#about">{t.about}</a><a href="#academics">{t.academics}</a><a href="#history">{t.history}</a><a href="#contact">{t.contact}</a><Link href={`/${locale}/admin`}>Admin</Link><div className="mobile-langs"><Link href="/en">EN</Link><Link href="/my">MY</Link><Link href="/ko">KO</Link></div></nav></details>
    </header>
    <main>
      <section className="hero"><div><span className="eyebrow">{officialName.toUpperCase()}</span><h1>{t.title}</h1><p>{t.intro}</p><div className="actions"><a className="btn primary" href="#academics">{t.academics}</a><a className="btn secondary" href="#about">{t.about}</a></div></div><div className="hero-image"/></section>
      <section id="about" className="section"><div className="center"><span className="eyebrow">WHO WE ARE</span><h2>{t.aboutTitle}</h2><p>{t.aboutText}</p></div></section>
      <section id="academics" className="section soft"><div className="center"><span className="eyebrow">ACADEMICS</span><h2>{t.departments}</h2></div><div className="cards"><article className="card"><span className="eyebrow">01 / THEOLOGY</span><h3>{t.theology}</h3><p>{t.theologyText}</p></article><article className="card"><span className="eyebrow">02 / EDUCATION</span><h3>{t.ece}</h3><p>{t.eceText}</p></article></div></section>
      <section id="history" className="section"><div className="center"><span className="eyebrow">OUR STORY</span><h2>{t.history}</h2><p>{t.historyIntro}</p></div><div className="history-timeline">{t.milestones.map(([year,description],i)=><article className="history-item" key={year}><div className="history-year">{year}</div><div className="history-copy"><h3>{year}</h3><p>{description}</p></div></article>)}</div></section>
      <section id="contact" className="section soft"><div className="contact"><div><span className="eyebrow">CONTACT</span><h2>{t.contactTitle}</h2><p>{t.contactText}</p></div><p>{t.addressText}</p></div></section>
    </main>
    <footer className="footer"><span>{officialName}</span><span>© {new Date().getFullYear()} MRPST</span></footer>
  </>;
}
