import SiteHeader from "../SiteHeader";
import Link from "next/link";
import {getPublishedWebsiteContent,inlinePageValues,websiteCopy} from "@/lib/website-content";
import InlinePageEditor from "../InlinePageEditor";

const text = {
  ko: {
    home:"홈", about:"학교 소개", academics:"학과 안내", calendar:"학사 일정", contact:"연락처", admin:"관리자",
    eyebrow:"ABOUT MRPST", title:"미얀마 교회를 섬길 신실한 지도자를 세웁니다",
    lead:"성경과 개혁주의 신학을 바탕으로 바른 신학과 신앙을 세우고, 건강한 교회를 세워 갈 사역자를 양성합니다.",
    purposeTitle:"설립 목적과 교육 이념",
    purpose:"미얀마 개혁주의 장로회 신학교(Myanmar Reformed Presbyterian School of Theology, MRPST)는 성경과 웨스트민스터 신앙고백에 기초한 개혁주의 신학 교육을 통해 미얀마 교회와 선교 현장을 섬길 목회자와 영적 지도자를 양성합니다. 또한 기독교적 가치에 기초한 유아교육 전문 인력을 양성하여 다음 세대의 건강한 성장을 함께 섬깁니다.",
    greetingTitle:"학과장 인사말",
    greeting:"주님의 이름으로 환영합니다. MRPST는 성경을 교육의 가장 중요한 기초로 삼고, 종교개혁과 청교도 신앙의 전통에 따라 신실한 사역자를 양성하고 있습니다. 단순히 신학 지식을 전달하는 데 그치지 않고, 배운 말씀을 삶으로 실천하며 교회와 이웃을 사랑으로 섬기는 지도자를 세우고자 합니다. 학생들은 기숙사 공동체 안에서 함께 배우고 기도하며, 설교와 전도 등 현장 실습을 통해 사역에 필요한 역량을 기릅니다. 미얀마 교회와 다음 세대를 섬길 일꾼을 세우는 이 사명에 함께해 주시기 바랍니다.",
    greetingSign:"MRPST 학과장",
    factsTitle:"학교 일반 현황",
    location:"위치", locationText:"미얀마 양곤 밍글라돈 소재. 양곤 시내에서 차량으로 약 30분 거리",
    land:"학교 부지", landText:"약 3.5에이커",
    facilities:"주요 시설", facilitiesText:"본관, 신학과·유아교육과 강의동, 강당, 기숙사, 기도실, 도서관, 컴퓨터실, 부설유치원, 식당 및 주방, 정원, 교직원 숙소, 잔디축구장, 풋살장, 아가페교회 및 부대시설",
    programsTitle:"교육과정 및 학위",
    programs:[
      ["4년제 신학대학","B. Th.","성경과 신학의 기초부터 목회와 선교를 위한 전문 훈련까지"],
      ["편목과정","2년 / Diploma","다른 신학교에서 B.Th. 과정을 이수하고 현재 목회 중인 사역자 대상"],
      ["유아교육과정","2년 / Diploma","기독교적 가치와 유아 발달에 기초한 전문 교육과정"],
      ["목회학 석사","3년 / M. Div.","미국 Evangelia University 학위와 MRPST 학위를 동시에 수여"]
    ],
    calendarTitle:"학사 일정",
    semester1:"제1학기", semester1v:"12월–3월", summer:"여름방학", summerv:"4월–5월",
    semester2:"제2학기", semester2v:"6월–9월", winter:"겨울방학 및 방송통신대 과정", winterv:"10월–11월",
    operationTitle:"교육 및 운영 방향",
    operation:[
      ["개혁신학 교육","종교개혁 사상과 청교도 신앙을 바탕으로 성경 중심의 개혁신학을 가르칩니다."],
      ["미전도 종족 선교","버마족, 몬족, 라카인족, 샨족 등 복음이 아직 충분히 전해지지 않은 종족을 우선적으로 섬기며, 다른 종족 공동체에도 복음을 전합니다."],
      ["기숙사 공동체 훈련","학생들이 함께 생활하며 말씀을 배우고 신앙을 실천하며, 서로 섬기고 교제하도록 합니다."],
      ["현장 중심의 사역 훈련","설교와 전도 실습을 중요하게 여기며, 재학 중에도 교회와 지역사회에서 사역 경험을 쌓도록 돕습니다. 유아교육과 학생들은 교회 부설 유치원 등에서 교육 실습을 합니다."],
      ["미얀마어 중심 교육","외국어 과목을 제외한 대부분의 수업은 미얀마어로 진행하며, 초빙교수의 경우 필요에 따라 통역을 제공합니다. M.Div. 과정은 영어로 진행합니다."],
      ["학업의 확장","희망하는 학생은 정부가 인정하는 학사학위를 취득하기 위해 방송통신대 과정을 병행할 수 있습니다. 해당 과정의 출석 수업은 10월과 11월 방학 기간에 진행합니다."],
      ["단계별 신학 훈련","신학대학 과정의 첫 2년은 기초 교양과 신학 기초를 다지고, 이후 2년은 집중적인 신학 훈련에 힘씁니다. 영어와 컴퓨터 활용 교육도 함께 실시합니다."]
    ],
    admissionTitle:"입학 자격 및 지원 요건",
    admission:[
      "학부(신학과·유아교육과): 미얀마 고등학교 졸업 및 대학 예비고사 합격자",
      "M.Div. 과정: 학사학위 이상 소지자",
      "입학 서류를 제출하고 입학시험에 합격한 사람",
      "목사 한 명 이상의 추천을 받은 사람",
      "세례를 받은 사람",
      "편목과정: 다른 신학교에서 B.Th. 과정을 이수하고 현재 목회 중인 사역자"
    ],
    historyTitle:"교육 과정 개설",
    history:[
      ["2007년 12월 4일","신학대학 개교"],
      ["2011년 12월 6일","편목과정 개설"],
      ["2014년 12월 2일","유아교육과정 개설"],
      ["2022년 8월 23일","3년제 M.Div. 과정 개설"]
    ],
    contactTitle:"학교에 문의하기", contactText:"입학과 교육과정에 관한 문의는 아래 전화번호로 연락해 주세요.",
    phone:"전화", phoneText:"09 516 3652 · 09 503 5316 · 09 431 9144",
    address:"학교 주소", addressText:"No.286, 10th Kaya St, Thingangyungyi, Mingladon Township, Yangon, Myanmar",
    more:"문의 남기기", map:"구글 지도에서 위치 확인하기"
  },
  my: {
    home:"ပင်မစာမျက်နှာ", about:"ကျောင်းအကြောင်း", academics:"ပညာရေး", calendar:"ပညာရေးပြက္ခဒိန်", contact:"ဆက်သွယ်ရန်", admin:"အုပ်ချုပ်ရေး",
    eyebrow:"ABOUT MRPST", title:"မြန်မာအသင်းတော်များကို အစေခံမည့် သစ္စာရှိသော ခေါင်းဆောင်များကို ပြုစုပျိုးထောင်ခြင်း",
    lead:"သမ္မာကျမ်းစာနှင့် ပြုပြင်ပြောင်းလဲရေး ဓမ္မပညာကို အခြေခံ၍ မှန်ကန်သော ဓမ္မပညာ၊ ယုံကြည်ခြင်းနှင့် အသင်းတော်တည်ထောင်ခြင်းကို လိုက်စားသော ကျောင်းဖြစ်ပါသည်။",
    purposeTitle:"တည်ထောင်ရခြင်း ရည်ရွယ်ချက်နှင့် ပညာရေးအယူဝါဒ",
    purpose:"Myanmar Reformed Presbyterian School of Theology (MRPST) သည် သမ္မာကျမ်းစာနှင့် ဝက်စ်မင်စတာ ယုံကြည်ခြင်းဝန်ခံချက်ကို အခြေခံသော ပြုပြင်ပြောင်းလဲရေး ဓမ္မပညာသင်ကြားမှုမှတစ်ဆင့် မြန်မာအသင်းတော်နှင့် သာသနာလုပ်ငန်းကို အစေခံမည့် သင်းအုပ်ဆရာများနှင့် ဝိညာဉ်ရေးခေါင်းဆောင်များကို ပြုစုပျိုးထောင်ပါသည်။ ထို့အပြင် ခရစ်ယာန်တန်ဖိုးများကို အခြေခံသော ကလေးသူငယ်ပညာရေးပညာရှင်များကို လေ့ကျင့်ပေးခြင်းဖြင့် နောင်လာမည့် မျိုးဆက်များ၏ ကျန်းမာသော ဖွံ့ဖြိုးမှုကိုလည်း အတူတကွ အစေခံပါသည်။",
    greetingTitle:"ဌာနမှူး၏ နှုတ်ခွန်းဆက်စကား",
    greeting:"သခင်ဘုရား၏ နာမတော်ဖြင့် ကြိုဆိုပါသည်။ MRPST သည် ဘုရားသခင်၏ နှုတ်ကပတ်တော်ဖြစ်သော သမ္မာကျမ်းစာကို အခြေခံအုတ်မြစ်အဖြစ်ထားပြီး ပြုပြင်ပြောင်းလဲရေးနှင့် Puritan ယုံကြည်ခြင်းအမွေအနှစ်အပေါ်တွင် သစ္စာရှိသော အမှုတော်ဆောင်များကို ပြုစုပျိုးထောင်ရန် ကြိုးစားလျက်ရှိပါသည်။ အသိပညာပေးရုံသာမက နှုတ်ကပတ်တော်ကို အသက်တာတွင် ကျင့်သုံးပြီး အသင်းတော်နှင့် အိမ်နီးချင်းများကို ချစ်ခြင်းမေတ္တာဖြင့် အစေခံသော ခေါင်းဆောင်များ ဖြစ်လာစေရန် ရည်ရွယ်ပါသည်။ ကျောင်းသားများသည် အဆောင်အသိုင်းအဝိုင်းတွင် အတူတကွ သင်ယူ၊ ဆုတောင်းပြီး တရားဟောခြင်း၊ ဧဝံဂေလိဟောပြောခြင်းနှင့် လက်တွေ့အမှုတော်မှတစ်ဆင့် သင်ယူထားသည့်အရာများကို အသုံးချနိုင်ရန် လမ်းညွှန်ပေးပါမည်။",
    greetingSign:"MRPST ဌာနမှူး",
    factsTitle:"ကျောင်း၏ အထွေထွေအချက်အလက်",
    location:"တည်နေရာ", locationText:"မြန်မာနိုင်ငံ၊ ရန်ကုန်မြို့၊ မင်္ဂလာဒုံမြို့နယ်။ ရန်ကုန်မြို့လယ်မှ ကားဖြင့် မိနစ် ၃၀ ခန့်",
    land:"ကျောင်းမြေဧရိယာ", landText:"၃.၅ ဧကခန့်",
    facilities:"အဓိက အဆောက်အအုံများ", facilitiesText:"ကျောင်းရုံးချုပ်၊ ဓမ္မပညာနှင့် ကလေးသူငယ်ပညာရေး စာသင်ဆောင်များ၊ ခန်းမ၊ ကျောင်းသားအဆောင်၊ ဆုတောင်းခန်း၊ စာကြည့်တိုက်၊ ကွန်ပျူတာခန်း၊ မူကြိုကျောင်း၊ စားသောက်ဆိုင်နှင့် မီးဖိုချောင်၊ ဥယျာဉ်၊ ဆရာ/ဝန်ထမ်းအိမ်ရာ၊ ဘောလုံးကွင်း၊ ဖူဆယ်ကွင်း၊ Agape အသင်းတော်နှင့် ဆက်စပ်အဆောက်အအုံများ",
    programsTitle:"သင်တန်းနှင့် ဘွဲ့အစီအစဉ်များ",
    programs:[
      ["၄ နှစ် ဓမ္မပညာဘွဲ့","B. Th.","သမ္မာကျမ်းစာနှင့် ဓမ္မပညာအခြေခံမှ အမှုတော်ဆောင်သင်တန်းအထိ"],
      ["၂ နှစ် သင်းအုပ်ဆရာသင်တန်း","Diploma","အခြားကျမ်းစာကျောင်းတွင် အနည်းဆုံး B. Th. ပြီးမြောက်ပြီး လက်ရှိအသင်းတော်တွင် အမှုဆောင်နေသူများ"],
      ["၂ နှစ် ကလေးသူငယ်ပညာရေး","Diploma","ခရစ်ယာန်တန်ဖိုးများနှင့် ကလေးဖွံ့ဖြိုးမှုကို အခြေခံသော ပညာရေးသင်တန်း"],
      ["၃ နှစ် M. Div.","M. Div.","အမေရိကန် Evangelia University နှင့် MRPST ဘွဲ့နှစ်ခု ပူးတွဲချီးမြှင့်ခြင်း"]
    ],
    calendarTitle:"ပညာသင်နှစ် အချိန်ဇယား",
    semester1:"ပထမစာသင်နှစ်ဝက်", semester1v:"ဒီဇင်ဘာ–မတ်", summer:"နွေရာသီကျောင်းပိတ်ရက်", summerv:"ဧပြီ–မေ",
    semester2:"ဒုတိယစာသင်နှစ်ဝက်", semester2v:"ဇွန်–စက်တင်ဘာ", winter:"ဆောင်းရာသီပိတ်ရက်နှင့် အဝေးသင်တက္ကသိုလ်", winterv:"အောက်တိုဘာ–နိုဝင်ဘာ",
    operationTitle:"ပညာရေးနှင့် လုပ်ငန်းဆောင်ရွက်မှု မူဝါဒ",
    operation:[
      ["ပြုပြင်ပြောင်းလဲရေး ဓမ္မပညာ","ပြုပြင်ပြောင်းလဲရေးနှင့် Puritan ယုံကြည်ခြင်းကို အခြေခံ၍ သမ္မာကျမ်းစာဗဟိုပြု ဓမ္မပညာကို သင်ကြားပါသည်။"],
      ["မရောက်ရှိသေးသော လူမျိုးစုများထံ သာသနာပြုခြင်း","ဗမာ၊ မွန်၊ ရခိုင်၊ ရှမ်းနှင့် အခြားလူမျိုးစုများထံ ဧဝံဂေလိတရား ရောက်ရှိစေရန် အလေးထားပါသည်။"],
      ["အဆောင်အသိုင်းအဝိုင်း လေ့ကျင့်မှု","ကျောင်းသားများသည် အတူနေထိုင်ကာ သမ္မာတရားရှာဖွေခြင်း၊ ယုံကြည်ခြင်းလက်တွေ့ကျင့်သုံးခြင်း၊ အချင်းချင်းအစေခံခြင်းနှင့် မိတ်သဟာယဖွဲ့ခြင်းတို့ကို လေ့ကျင့်ပါသည်။"],
      ["လက်တွေ့အမှုတော် လေ့ကျင့်မှု","တရားဟောလေ့ကျင့်ခြင်းနှင့် ဧဝံဂေလိဟောပြောခြင်းကို အလေးထားပြီး ကျောင်းတက်နေစဉ်တွင်ပင် အသင်းတော်နှင့် လူမှုအသိုင်းအဝိုင်း၌ အမှုတော်ဆောင်စေပါသည်။"],
      ["မြန်မာဘာသာဖြင့် သင်ကြားခြင်း","နိုင်ငံခြားဘာသာရပ်များမှလွဲ၍ အများစုကို မြန်မာဘာသာဖြင့် သင်ကြားပြီး M.Div. သင်တန်းကို အင်္ဂလိပ်ဘာသာဖြင့် သင်ကြားပါသည်။"],
      ["ပညာရေးဆက်လက်တိုးချဲ့ခြင်း","အစိုးရအသိအမှတ်ပြု ဘွဲ့ရရှိရန် အဝေးသင်တက္ကသိုလ်သင်တန်းကို တက်ရောက်လိုသူများအတွက် အခွင့်အရေးပေးပါသည်။"],
      ["အဆင့်လိုက် ဓမ္မပညာလေ့ကျင့်မှု","ပထမ ၂ နှစ်တွင် အခြေခံပညာနှင့် ဓမ္မပညာအခြေခံများ၊ နောက် ၂ နှစ်တွင် အထူးပြုဓမ္မပညာကို သင်ယူစေပြီး အင်္ဂလိပ်စာနှင့် ကွန်ပျူတာကိုလည်း သင်ကြားပါသည်။"]
    ],
    admissionTitle:"ဝင်ခွင့်အရည်အချင်းနှင့် လိုအပ်ချက်များ",
    admission:[
      "ဘွဲ့ကြို (ဓမ္မပညာနှင့် ကလေးသူငယ်ပညာရေး): မြန်မာနိုင်ငံ အထက်တန်းအောင်မြင်ပြီး တက္ကသိုလ်ဝင်ခွင့်စာမေးပွဲ အောင်မြင်သူ",
      "M.Div. သင်တန်း: ဘွဲ့တစ်ခုခု ရရှိပြီးသူ",
      "ဝင်ခွင့်လျှောက်လွှာတင်ပြီး ကျောင်းဝင်ခွင့်စာမေးပွဲ အောင်မြင်သူ",
      "အနည်းဆုံး သင်းအုပ်ဆရာတစ်ဦး၏ ထောက်ခံစာ ရရှိသူ",
      "နှစ်ခြင်းခံယူပြီးသူ",
      "သင်းအုပ်ဆရာသင်တန်း: အခြားကျမ်းစာကျောင်းတွင် B. Th. အနည်းဆုံး ပြီးမြောက်ပြီး လက်ရှိအသင်းတော်၌ အမှုဆောင်နေသူ"
    ],
    historyTitle:"သင်တန်းများ စတင်ဖွင့်လှစ်သည့်နေ့",
    history:[
      ["၂၀၀၇ ဒီဇင်ဘာ ၄","ဓမ္မပညာဘွဲ့သင်တန်း စတင်ဖွင့်လှစ်"],
      ["၂၀၁၁ ဒီဇင်ဘာ ၆","သင်းအုပ်ဆရာသင်တန်း စတင်ဖွင့်လှစ်"],
      ["၂၀၁၄ ဒီဇင်ဘာ ၂","ကလေးသူငယ်ပညာရေးသင်တန်း စတင်ဖွင့်လှစ်"],
      ["၂၀၂၂ ဩဂုတ် ၂၃","၃ နှစ် M.Div. သင်တန်း စတင်ဖွင့်လှစ်"]
    ],
    contactTitle:"ကျောင်းသို့ ဆက်သွယ်ရန်", contactText:"ဝင်ခွင့်နှင့် သင်တန်းအစီအစဉ်များအကြောင်း သိရှိလိုပါက ဆက်သွယ်ရန်စာမျက်နှာကို အသုံးပြုပါ။",
    phone:"ဖုန်း", phoneText:"09 516 3652 · 09 503 5316 · 09 431 9144",
    address:"ကျောင်းလိပ်စာ", addressText:"No.286, 10th Kaya St, Thingangyungyi, Mingladon Township, Yangon, Myanmar",
    more:"ဆက်သွယ်ရန်", map:"Google Maps တွင် ကြည့်ရန်"
  }
};

export default async function AboutPage({params}:{params:Promise<{locale:string}>}) {
  const {locale}=await params;
  const t=text[locale==="my"?"my":"ko"];
  const content=await getPublishedWebsiteContent(locale);
  const hero=websiteCopy(content,"about-hero",{title:t.title,body:t.lead});
  const foundation=websiteCopy(content,"about-foundation",{title:t.purposeTitle,body:t.purpose});
  const greeting=websiteCopy(content,"about-greeting",{title:t.greetingTitle,body:t.greeting});
  const facts=websiteCopy(content,"about-facts",{title:t.factsTitle,body:""});
  const history=websiteCopy(content,"about-history",{title:t.historyTitle,body:""});
  const contact=websiteCopy(content,"about-contact",{title:t.contactTitle,body:t.contactText});
  return <InlinePageEditor pageKey="about" locale={locale} initialValues={inlinePageValues(content,"about")}>
    <SiteHeader locale={locale} active="about" />
    <main className="about-page">
      <section className="about-hero"><span className="eyebrow">{t.eyebrow} · MYANMAR · YANGON</span><h1>{hero.title}</h1><p>{hero.body}</p></section>
      <section className="about-purpose"><div><span className="eyebrow">01 — OUR FOUNDATION</span><h2>{foundation.title}</h2></div><p>{foundation.body}</p></section>
      <section className="chair-greeting"><div className="chair-mark"><img src="/mrpst-logo.png" alt="MRPST 로고"/></div><div><span className="eyebrow">02 — MESSAGE</span><h2>{greeting.title}</h2><blockquote>{greeting.body}</blockquote><strong>{t.greetingSign}</strong></div></section>
      <section className="about-facts"><div className="about-section-head"><span className="eyebrow">03 — AT A GLANCE</span><h2>{facts.title}</h2>{facts.body&&<p>{facts.body}</p>}</div><div className="about-fact-grid"><article><span>01</span><h3>{t.location}</h3><p>{t.locationText}</p></article><article><span>02</span><h3>{t.land}</h3><p>{t.landText}</p></article><article className="wide"><span>03</span><h3>{t.facilities}</h3><p>{t.facilitiesText}</p></article></div></section>
      <section className="about-history"><div className="about-section-head"><span className="eyebrow">08 — HISTORY</span><h2>{history.title}</h2>{history.body&&<p>{history.body}</p>}</div><div className="about-history-list">{t.history.map(([date,event])=><article key={date}><strong>{date}</strong><span>{event}</span></article>)}</div></section>
      <section className="about-contact"><div><span className="eyebrow">09 — CONTACT</span><h2>{contact.title}</h2><p>{contact.body}</p></div><div><b>{t.phone}</b><p>{t.phoneText}</p><b>{t.address}</b><p>{t.addressText}</p><a className="btn light" href="https://maps.app.goo.gl/rqupUXw5JiumcrMv9?g_st=ic" target="_blank" rel="noopener noreferrer">{t.map} ↗</a><Link className="btn light" href={`/${locale}/contact`}>{t.more} ↗</Link></div></section>
    </main>
    <footer className="footer"><span>Myanmar Reformed Presbyterian School of Theology</span><span><Link href={`/${locale}`}>{t.home}</Link> · © {new Date().getFullYear()} MRPST</span></footer>
  </InlinePageEditor>;
}
