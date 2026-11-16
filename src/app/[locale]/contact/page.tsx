import SiteHeader from "../SiteHeader";
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
    <SiteHeader locale={locale} active="contact" />
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
