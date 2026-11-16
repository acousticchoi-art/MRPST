import SiteHeader from "../SiteHeader";
import Link from "next/link";

const contentByLocale = {
  ko: {
    navAbout: "학교 소개", navAcademics: "학과 안내", navCalendar: "학사 일정", navContact: "문의하기", navAdmin: "관리자",
    eyebrow: "ACADEMIC PROGRAMS · MRPST",
    title: "배움으로 준비하고, 섬김으로 나아갑니다.",
    lead: "MRPST는 성경과 개혁주의 신학을 바탕으로 교회와 지역사회를 섬길 지도자를 양성합니다. 신학과 목회학, 유아교육 분야의 교육과정을 운영하며 배운 내용을 교회와 교육 현장에서 실천하도록 돕습니다.",
    programsTitle: "교육과정 안내",
    programsLead: "현재 운영하는 네 가지 교육과정의 학제와 학위 정보를 안내합니다.",
    programs: [
      { no: "01", category: "THEOLOGY", name: "신학대학 과정", degree: "B.Th. · 4년제", period: "4년", intro: "성경과 개혁주의 신학을 기초로 교회와 선교 현장을 섬길 사역자를 양성하는 학부 과정입니다.", detail: "첫 2년은 기초 교육과 신학의 기본 내용을 배우고, 후반 2년은 보다 집중적인 신학 훈련을 받습니다. 설교와 전도 등 실제 사역 훈련도 함께 강조합니다.", opened: "2007년 12월 4일 개교" },
      { no: "02", category: "PASTORAL MINISTRY", name: "편목과정", degree: "Diploma · 2년제", period: "2년", intro: "다른 신학교에서 신학을 공부하고 현재 목회 현장에서 섬기는 사역자를 위한 과정입니다.", detail: "타 신학교에서 최소 B.Th. 과정을 이수하고 현재 목회 중인 사역자를 대상으로 하며, 목회 사역에 필요한 신학 교육을 이어갈 수 있도록 운영합니다.", opened: "2011년 12월 6일 개설" },
      { no: "03", category: "EARLY CHILDHOOD EDUCATION", name: "유아교육과정", degree: "Diploma · 2년제", period: "2년", intro: "기독교적 가치관과 영유아 발달에 대한 이해를 바탕으로 유아교육 분야의 인재를 양성하는 과정입니다.", detail: "유아의 건강한 성장과 발달을 이해하고, 기독교적 가치에 기초한 교육을 실천할 수 있도록 교육합니다.", opened: "2014년 12월 2일 개설" },
      { no: "04", category: "MASTER OF DIVINITY", name: "목회학 석사과정", degree: "M.Div. · 3년제", period: "3년", intro: "목회와 신학 사역을 위한 전문적인 신학 교육을 제공하는 석사 과정입니다.", detail: "영어로 수업을 진행하며, 미국 Evangelia University와 MRPST의 학위를 함께 수여합니다.", opened: "2022년 8월 23일 개설" }
    ],
    approachTitle: "교육 운영의 방향",
    approach: [
      ["성경과 개혁주의 신학", "성경을 교육의 기초로 삼고 개혁주의와 청교도 전통에 따라 신학을 가르칩니다."],
      ["현장 중심의 사역 훈련", "설교와 전도 훈련을 강조하며, 배운 내용을 교회와 지역사회 현장에서 실천하도록 돕습니다."],
      ["공동체 안에서의 성장", "기숙사 공동체 생활을 통해 함께 배우고 기도하며 서로 섬기는 태도를 기릅니다."],
      ["단계별 신학 교육", "신학대학 과정은 기초 교육에서 출발해 후반부에 집중적인 신학 훈련으로 이어집니다."]
    ],
    calendarTitle: "학사 일정",
    semesters: [["1학기", "12월–3월"], ["여름방학", "4월–5월"], ["2학기", "6월–9월"], ["겨울방학 및 방통대", "10월–11월"]],
    admissionTitle: "입학 자격 안내",
    admission: [
      "신학대학 및 유아교육 학부 과정: 미얀마 고등학교 졸업 및 대학 예비고사 합격",
      "M.Div. 과정: 학사 학위 이상 소지",
      "입학 서류 제출 및 입학시험 통과",
      "목사 1인 이상의 추천",
      "세례를 받은 사람",
      "편목과정: 다른 신학교에서 최소 B.Th. 과정을 이수하고 현재 목회 중인 사역자"
    ],
    note: "과정별 세부 과목과 학기별 강의 내용은 학사 운영에 따라 편성됩니다.",
    ctaTitle: "교육과정에 대해 더 알고 싶으신가요?",
    ctaText: "입학 및 교육과정에 관한 문의를 남겨 주시면 학교에서 안내해 드리겠습니다.",
    ctaButton: "문의하기"
  },
  my: {
    navAbout: "ကျောင်းအကြောင်း", navAcademics: "ပညာရေးအစီအစဉ်", navCalendar: "ပညာရေးပြက္ခဒိန်", navContact: "ဆက်သွယ်ရန်", navAdmin: "အုပ်ချုပ်ရေး",
    eyebrow: "ACADEMIC PROGRAMS · MRPST",
    title: "ပညာသင်ယူ၍ အမှုတော်ဆောင်ရန် ပြင်ဆင်ခြင်း",
    lead: "MRPST သည် သမ္မာကျမ်းစာနှင့် ပြုပြင်ပြောင်းလဲရေး ဓမ္မပညာကို အခြေခံ၍ အသင်းတော်နှင့် လူမှုအသိုင်းအဝိုင်းကို အစေခံမည့် ခေါင်းဆောင်များကို ပြုစုပျိုးထောင်ပါသည်။ ဓမ္မပညာ၊ သင်းအုပ်ဆရာသင်တန်းနှင့် ကလေးသူငယ်ပညာရေး သင်တန်းများကို ဖွင့်လှစ်ထားပါသည်။",
    programsTitle: "သင်တန်းအစီအစဉ်များ",
    programsLead: "လက်ရှိဖွင့်လှစ်ထားသော သင်တန်းလေးမျိုး၏ ကြာမြင့်ချိန်နှင့် ဘွဲ့အချက်အလက်များ။",
    programs: [
      { no: "01", category: "THEOLOGY", name: "ဓမ္မပညာဘွဲ့သင်တန်း", degree: "B.Th. · ၄ နှစ်", period: "၄ နှစ်", intro: "သမ္မာကျမ်းစာနှင့် ပြုပြင်ပြောင်းလဲရေး ဓမ္မပညာကို အခြေခံ၍ အသင်းတော်နှင့် သာသနာလုပ်ငန်းတွင် အစေခံမည့်သူများကို ပြင်ဆင်ပေးသော ဘွဲ့ကြိုသင်တန်းဖြစ်ပါသည်။", detail: "ပထမ ၂ နှစ်တွင် အခြေခံပညာနှင့် ဓမ္မပညာအခြေခံများကို သင်ယူပြီး နောက် ၂ နှစ်တွင် ပိုမိုအထူးပြုသော ဓမ္မပညာသင်ကြားမှုကို ခံယူရပါသည်။ တရားဟောခြင်းနှင့် ဧဝံဂေလိဟောပြောခြင်း လက်တွေ့လေ့ကျင့်မှုကိုလည်း အလေးထားပါသည်။", opened: "၂၀၀၇ ဒီဇင်ဘာ ၄ ရက်တွင် ဖွင့်လှစ်" },
      { no: "02", category: "PASTORAL MINISTRY", name: "သင်းအုပ်ဆရာသင်တန်း", degree: "Diploma · ၂ နှစ်", period: "၂ နှစ်", intro: "အခြားကျမ်းစာသင်ကျောင်းတွင် ဓမ္မပညာသင်ယူပြီး လက်ရှိအသင်းတော်တွင် အမှုဆောင်နေသူများအတွက် ဖြစ်ပါသည်။", detail: "အခြားကျမ်းစာသင်ကျောင်းတွင် B.Th. အနည်းဆုံး ပြီးမြောက်ပြီး လက်ရှိသင်းအုပ်ဆရာအဖြစ် အမှုဆောင်နေသူများကို လက်ခံပါသည်။", opened: "၂၀၁၁ ဒီဇင်ဘာ ၆ ရက်တွင် ဖွင့်လှစ်" },
      { no: "03", category: "EARLY CHILDHOOD EDUCATION", name: "ကလေးသူငယ်ပညာရေးသင်တန်း", degree: "Diploma · ၂ နှစ်", period: "၂ နှစ်", intro: "ခရစ်ယာန်တန်ဖိုးများနှင့် ကလေးသူငယ်ဖွံ့ဖြိုးမှုကို အခြေခံ၍ ပညာရေးဝန်ထမ်းများကို ပြင်ဆင်ပေးသော သင်တန်းဖြစ်ပါသည်။", detail: "ကလေးများ၏ ကျန်းမာသော ကြီးထွားဖွံ့ဖြိုးမှုကို နားလည်ပြီး ခရစ်ယာန်တန်ဖိုးများအပေါ် အခြေခံသော ပညာရေးကို လက်တွေ့ကျင့်သုံးနိုင်ရန် သင်ကြားပေးပါသည်။", opened: "၂၀၁၄ ဒီဇင်ဘာ ၂ ရက်တွင် ဖွင့်လှစ်" },
      { no: "04", category: "MASTER OF DIVINITY", name: "ဓမ္မအမှုတော် မဟာဘွဲ့သင်တန်း", degree: "M.Div. · ၃ နှစ်", period: "၃ နှစ်", intro: "ဓမ္မအမှုတော်နှင့် ဓမ္မပညာဆိုင်ရာ အထူးပြုပညာရေးကို ပေးအပ်သော မဟာဘွဲ့သင်တန်းဖြစ်ပါသည်။", detail: "အင်္ဂလိပ်ဘာသာဖြင့် သင်ကြားပြီး အမေရိကန်နိုင်ငံရှိ Evangelia University နှင့် MRPST တို့မှ ဘွဲ့နှစ်ခု ပူးတွဲချီးမြှင့်ပါသည်။", opened: "၂၀၂၂ ဩဂုတ် ၂၃ ရက်တွင် ဖွင့်လှစ်" }
    ],
    approachTitle: "ပညာရေးဆောင်ရွက်မှု ဦးတည်ချက်",
    approach: [
      ["သမ္မာကျမ်းစာနှင့် ပြုပြင်ပြောင်းလဲရေး ဓမ္မပညာ", "သမ္မာကျမ်းစာကို ပညာရေး၏ အခြေခံအဖြစ်ထားပြီး ပြုပြင်ပြောင်းလဲရေးနှင့် Puritan အစဉ်အလာအတိုင်း သင်ကြားပါသည်။"],
      ["လက်တွေ့အမှုတော် လေ့ကျင့်မှု", "တရားဟောခြင်းနှင့် ဧဝံဂေလိဟောပြောခြင်းကို အလေးထားပြီး သင်ယူထားသည်များကို အသင်းတော်နှင့် လူမှုအသိုင်းအဝိုင်းတွင် လက်တွေ့အသုံးချစေပါသည်။"],
      ["အသိုင်းအဝိုင်းအတွင်း ကြီးထွားခြင်း", "အဆောင်တွင် အတူနေထိုင်သင်ယူခြင်း၊ ဆုတောင်းခြင်းနှင့် အချင်းချင်းအစေခံခြင်းတို့ကို လေ့ကျင့်ပါသည်။"],
      ["အဆင့်လိုက် ဓမ္မပညာသင်ကြားမှု", "ဓမ္မပညာဘွဲ့သင်တန်းတွင် ပထမပိုင်း အခြေခံပညာမှ နောက်ပိုင်း အထူးပြုဓမ္မပညာသင်ကြားမှုသို့ တက်လှမ်းပါသည်။"]
    ],
    calendarTitle: "ပညာသင်နှစ် အချိန်ဇယား",
    semesters: [["ပထမစာသင်နှစ်ဝက်", "ဒီဇင်ဘာ–မတ်"], ["နွေရာသီကျောင်းပိတ်ရက်", "ဧပြီ–မေ"], ["ဒုတိယစာသင်နှစ်ဝက်", "ဇွန်–စက်တင်ဘာ"], ["ဆောင်းရာသီပိတ်ရက်နှင့် အဝေးသင်တက္ကသိုလ်", "အောက်တိုဘာ–နိုဝင်ဘာ"]],
    admissionTitle: "ဝင်ခွင့်အရည်အချင်း",
    admission: [
      "ဓမ္မပညာနှင့် ကလေးသူငယ်ပညာရေး ဘွဲ့ကြိုသင်တန်း: မြန်မာနိုင်ငံ အထက်တန်းအောင်မြင်ပြီး တက္ကသိုလ်ဝင်ခွင့်စာမေးပွဲ အောင်မြင်သူ",
      "M.Div. သင်တန်း: ဘွဲ့တစ်ခုခု ရရှိပြီးသူ",
      "ဝင်ခွင့်လျှောက်လွှာတင်ပြီး ကျောင်းဝင်ခွင့်စာမေးပွဲ အောင်မြင်သူ",
      "အနည်းဆုံး သင်းအုပ်ဆရာတစ်ဦး၏ ထောက်ခံစာ ရရှိသူ",
      "နှစ်ခြင်းခံယူပြီးသူ",
      "သင်းအုပ်ဆရာသင်တန်း: အခြားကျမ်းစာကျောင်းတွင် B.Th. အနည်းဆုံး ပြီးမြောက်ပြီး လက်ရှိအသင်းတော်တွင် အမှုဆောင်နေသူ"
    ],
    note: "သင်တန်းတစ်ခုစီ၏ ဘာသာရပ်များနှင့် စာသင်နှစ်အလိုက် သင်ခန်းစာများကို ပညာရေးအစီအစဉ်အရ သတ်မှတ်ပါသည်။",
    ctaTitle: "သင်တန်းအစီအစဉ်များအကြောင်း ထပ်မံသိရှိလိုပါသလား။",
    ctaText: "ဝင်ခွင့်နှင့် သင်တန်းများအကြောင်း မေးမြန်းလိုပါက ဆက်သွယ်ရန်စာမျက်နှာမှ စာပေးပို့နိုင်ပါသည်။",
    ctaButton: "ဆက်သွယ်ရန်"
  }
} as const;

export default async function AcademicsPage({params}:{params:Promise<{locale:string}>}) {
  const {locale}=await params;
  const lang=locale==="my"?"my":"ko";
  const t=contentByLocale[lang];
  return <>
    <SiteHeader locale={locale} active="academics" />
    <main className="academics-page">
      <section className="academics-hero"><span className="eyebrow">{t.eyebrow}</span><h1>{t.title}</h1><p>{t.lead}</p></section>
      <section className="academics-programs"><div className="about-section-head"><span className="eyebrow">01 — PROGRAMS</span><h2>{t.programsTitle}</h2><p>{t.programsLead}</p></div><div className="program-detail-grid">{t.programs.map((program,index)=><article className="program-detail-card" key={program.no}><div className="program-card-top"><span>0{index+1} / {program.category}</span><strong>{program.period}</strong></div><h3>{program.name}</h3><b className="program-degree">{program.degree}</b><p>{program.intro}</p><p className="program-detail-copy">{program.detail}</p><small>{program.opened}</small></article>)}</div></section>
      <section className="academics-approach"><div className="about-section-head"><span className="eyebrow">02 — EDUCATIONAL APPROACH</span><h2>{t.approachTitle}</h2></div><div className="academics-approach-grid">{t.approach.map(([title,desc],i)=><article key={title}><span>0{i+1}</span><div><h3>{title}</h3><p>{desc}</p></div></article>)}</div></section>
      <section className="academics-calendar"><div className="about-section-head"><span className="eyebrow">03 — ACADEMIC CALENDAR</span><h2>{t.calendarTitle}</h2></div><div className="semester-grid">{t.semesters.map(([name,period])=><article key={name}><span>{name}</span><strong>{period}</strong></article>)}</div><p className="academics-note">{t.note}</p></section>
      <section className="academics-admission"><div className="about-section-head"><span className="eyebrow">04 — ADMISSIONS</span><h2>{t.admissionTitle}</h2></div><ol>{t.admission.map(item=><li key={item}>{item}</li>)}</ol></section>
      <section className="academics-contact"><div><span className="eyebrow">05 — CONTACT</span><h2>{t.ctaTitle}</h2><p>{t.ctaText}</p></div><Link className="btn light" href={`/${locale}/contact`}>{t.ctaButton} ↗</Link></section>
    </main>
    <footer className="footer"><span>Myanmar Reformed Presbyterian School of Theology</span><span><Link href={`/${locale}`}>{lang==="ko"?"홈페이지":"ပင်မစာမျက်နှာ"}</Link> · © {new Date().getFullYear()} MRPST</span></footer>
  </>;
}
