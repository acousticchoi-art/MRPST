import Link from "next/link";
import ContactForm from "./ContactForm";

const copy = {
  ko: {
    eyebrow:"CONTACT MRPST",
    title:"문의하기",
    intro:"입학과 교육과정 등 학교에 관한 문의를 남겨 주세요. 작성한 내용은 이메일 앱을 통해 전달할 수 있습니다.",
    address:"No.286, 10th Kaya St, Thingangyungyi, Mingladon Township, Yangon, Myanmar",
    map:"구글 지도에서 위치 확인하기",
    email:"이메일",
    formTitle:"문의 양식",
  },
  my: {
    eyebrow:"CONTACT MRPST",
    title:"ဆက်သွယ်မေးမြန်းရန်",
    intro:"ဝင်ခွင့်၊ ပညာရေးအစီအစဉ်နှင့် ကျောင်းဆိုင်ရာ မေးမြန်းချက်များကို ပေးပို့နိုင်ပါသည်။",
    address:"No.286, 10th Kaya St, Thingangyungyi, Mingladon Township, Yangon, Myanmar",
    map:"Google Maps ဖြင့် ကြည့်ရန်",
    email:"အီးမေးလ်",
    formTitle:"မေးမြန်းချက် ရေးသားရန်",
  }
} as const;

export default async function ContactPage({params}:{params:Promise<{locale:string}>}) {
  const {locale}=await params;
  const t=copy[locale as keyof typeof copy]??copy.ko;
  return <>
    <header className="header">
      <Link href={`/${locale}`} className="brand"><span className="brand-logo"><img src="/mrpst-logo.svg" alt="MRPST 공식 로고"/></span><span>MRPST<small>MYANMAR REFORMED PRESBYTERIAN SCHOOL OF THEOLOGY</small></span></Link>
      <nav className="nav"><Link href={`/${locale}#about`}>{locale==="ko"?"학교 소개":"ကျောင်းအကြောင်း"}</Link><Link href={`/${locale}#academics`}>{locale==="ko"?"학과 안내":"ပညာရေး"}</Link><Link href={`/${locale}#history`}>{locale==="ko"?"연혁":"သမိုင်း"}</Link><Link href={`/${locale}/calendar`}>{locale==="ko"?"학사 일정":"ပညာရေးပြက္ခဒိန်"}</Link><Link href={`/${locale}/contact`}>{t.title}</Link></nav>
      <div className="header-tools"><div className="langs"><Link href="/my">မြန်မာ</Link><Link href="/ko">한국어</Link></div><Link className="admin-link" href={`/${locale}/admin`}>{locale==="ko"?"관리자":"အုပ်ချုပ်ရေး"}</Link></div>
      <details className="mobile-menu"><summary aria-label="Open navigation menu"><span></span><span></span><span></span></summary><nav className="mobile-nav"><Link href={`/${locale}#about`}>{locale==="ko"?"학교 소개":"ကျောင်းအကြောင်း"}</Link><Link href={`/${locale}#academics`}>{locale==="ko"?"학과 안내":"ပညာရေး"}</Link><Link href={`/${locale}#history`}>{locale==="ko"?"연혁":"သမိုင်း"}</Link><Link href={`/${locale}/calendar`}>{locale==="ko"?"학사 일정":"ပညာရေးပြက္ခဒိန်"}</Link><Link href={`/${locale}/contact`}>{t.title}</Link><Link href={`/${locale}/admin`}>{locale==="ko"?"관리자":"အုပ်ချုပ်ရေး"}</Link><div className="mobile-langs"><Link href="/my">မြန်မာ</Link><Link href="/ko">한국어</Link></div></nav></details>
    </header>
    <main className="contact-page">
      <section className="contact-page-heading"><span className="eyebrow">{t.eyebrow}</span><h1>{t.title}</h1><p>{t.intro}</p></section>
      <div className="contact-page-grid">
        <section className="contact-info-card">
          <span className="eyebrow">VISIT MRPST</span><h2>Myanmar Reformed Presbyterian School of Theology</h2>
          <p>{t.address}</p>
          <a className="btn primary" href="https://maps.app.goo.gl/rqupUXw5JiumcrMv9?g_st=ic" target="_blank" rel="noopener noreferrer">{t.map} ↗</a>
          <div className="contact-info-divider"></div>
          <span className="contact-info-label">{t.email}</span>
          <a className="contact-info-email" href="mailto:acousticchoi@gmail.com">acousticchoi@gmail.com</a>
        </section>
        <section className="contact-form-card"><h2>{t.formTitle}</h2><ContactForm locale={locale}/></section>
      </div>
    </main>
    <footer className="footer"><span>Myanmar Reformed Presbyterian School of Theology</span><span>© {new Date().getFullYear()} MRPST</span></footer>
  </>;
}
