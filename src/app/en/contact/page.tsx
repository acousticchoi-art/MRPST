import SiteHeader from "../SiteHeader";
import Link from "next/link";
import ContactForm from "./ContactForm";
import {getPublishedWebsiteContent,inlinePageValues,websiteCopy} from "@/lib/website-content";
import InlinePageEditor from "../InlinePageEditor";

const copy = {en:{"eyebrow":"CONTACT MRPST","title":"Contact us","intro":"Send us your questions about admissions, academic programs or the school. Your message can be sent through your email application.","address":"No.286, 10th Kaya St, Thingangyungyi, Mingladon Township, Yangon, Myanmar","map":"View on Google Maps","email":"Email","formTitle":"Enquiry form"}} as const;

export default async function ContactPage(){
 const locale="en";
  const t=copy.en;
  const content=await getPublishedWebsiteContent(locale);
  const hero=websiteCopy(content,"contact-hero",{title:t.title,body:t.intro});
  const info=websiteCopy(content,"contact-info",{title:"Myanmar Reformed Presbyterian School of Theology",body:t.address});
  return <InlinePageEditor pageKey="contact" locale={locale} initialValues={inlinePageValues(content,"contact")}>
    <SiteHeader locale={locale} active="contact" />
    <main className="contact-page">
      <section className="contact-page-heading"><span className="eyebrow">{t.eyebrow}</span><h1>{hero.title}</h1><p>{hero.body}</p></section>
      <div className="contact-page-grid">
        <section className="contact-info-card">
          <span className="eyebrow">VISIT MRPST</span><h2>{info.title}</h2>
          <p>{info.body}</p>
          <a className="btn primary" href="https://maps.app.goo.gl/rqupUXw5JiumcrMv9?g_st=ic" target="_blank" rel="noopener noreferrer">{t.map} ↗</a>
          <div className="contact-info-divider"></div>
          <span className="contact-info-label">{t.email}</span>
          <a className="contact-info-email" href="mailto:acousticchoi@gmail.com">acousticchoi@gmail.com</a>
        </section>
        <section className="contact-form-card"><h2>{t.formTitle}</h2><ContactForm locale={locale}/></section>
      </div>
    </main>
    <footer className="footer"><span>Myanmar Reformed Presbyterian School of Theology</span><span>© {new Date().getFullYear()} MRPST</span></footer>
  </InlinePageEditor>;
}
