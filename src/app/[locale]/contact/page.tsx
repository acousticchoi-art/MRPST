import Link from "next/link";
import ContactForm from "./ContactForm";

const copy = {
  ko: {
    eyebrow:"CONTACT MRPST",
    title:"문의하기",
    intro:"입학, 교육과정 및 학교 관련 문의를 남겨 주세요. 작성하신 내용을 이메일로 전달할 수 있습니다.",
    address:"No.286, 10th Kaya St, Thingangyungyi, Mingladon Township, Yangon, Myanmar",
    map:"구글 지도에서 위치 보기",
    email:"이메일",
    back:"홈으로 돌아가기",
    formTitle:"문의 내용 작성",
  },
  my: {
    eyebrow:"CONTACT MRPST",
    title:"ဆက်သွယ်မေးမြန်းရန်",
    intro:"ဝင်ခွင့်၊ ပညာရေးအစီအစဉ်နှင့် ကျောင်းဆိုင်ရာ မေးမြန်းချက်များကို ပေးပို့နိုင်ပါသည်။",
    address:"No.286, 10th Kaya St, Thingangyungyi, Mingladon Township, Yangon, Myanmar",
    map:"Google Maps ဖြင့် ကြည့်ရန်",
    email:"အီးမေးလ်",
    back:"ပင်မစာမျက်နှာသို့ ပြန်ရန်",
    formTitle:"မေးမြန်းချက် ရေးသားရန်",
  }
} as const;

export default async function ContactPage({params}:{params:Promise<{locale:string}>}) {
  const {locale}=await params;
  const t=copy[locale as keyof typeof copy]??copy.ko;
  return <>
    <header className="header">
      <Link href={`/${locale}`} className="brand"><span className="mark">M</span><span>MRPST<small>MYANMAR REFORMED PRESBYTERIAN SCHOOL OF THEOLOGY</small></span></Link>
      <nav className="nav"><Link href={`/${locale}`}>{t.back}</Link></nav>
      <div className="header-tools"><div className="langs"><Link href="/my">မြန်မာ</Link><Link href="/ko">한국어</Link></div></div>
      <details className="mobile-menu"><summary aria-label="Open navigation menu"><span></span><span></span><span></span></summary><nav className="mobile-nav"><Link href={`/${locale}`}>{t.back}</Link><div className="mobile-langs"><Link href="/my">မြန်မာ</Link><Link href="/ko">한국어</Link></div></nav></details>
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
      <div className="contact-page-back"><Link href={`/${locale}`}>← {t.back}</Link></div>
    </main>
    <footer className="footer"><span>Myanmar Reformed Presbyterian School of Theology</span><span>© {new Date().getFullYear()} MRPST</span></footer>
  </>;
}
