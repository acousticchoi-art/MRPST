import SiteHeader from "../SiteHeader";
import Link from "next/link";
import {getPublishedWebsiteContent,inlinePageValues,websiteCopy} from "@/lib/website-content";
import InlinePageEditor from "../InlinePageEditor";

const text = {en:{"home":"Home","eyebrow":"ABOUT MRPST","title":"Forming faithful leaders for the churches of Myanmar","lead":"Grounded in Scripture and Reformed theology, we prepare servants who uphold sound theology and faith and build healthy churches.","purposeTitle":"Our purpose and educational foundation","purpose":"Myanmar Reformed Presbyterian School of Theology (MRPST) equips pastors and spiritual leaders for the church and mission in Myanmar through Reformed theological education founded on Scripture and the Westminster Confession of Faith. We also train early childhood educators grounded in Christian values to support the healthy growth of the next generation.","greetingTitle":"Message from the Department Head","greeting":"Welcome in the name of the Lord. MRPST places Scripture at the heart of its education and prepares faithful servants in the Reformation and Puritan traditions. We seek not merely to impart theological knowledge but to form leaders who live out the Word and serve churches and neighbours with love. Students learn and pray together in the residential community and develop ministry skills through preaching and evangelism. We invite you to join us in preparing servants for the churches and the next generation of Myanmar.","greetingSign":"MRPST Department Head","factsTitle":"School at a glance","location":"Location","locationText":"Mingalardon Township, Yangon, Myanmar, approximately 30 minutes by car from downtown Yangon.","land":"Campus","landText":"Approximately 3.5 acres","facilities":"Facilities","facilitiesText":"Administration building, theology and early childhood education classrooms, auditorium, dormitories, prayer room, library, computer lab, affiliated kindergarten, dining hall and kitchen, garden, staff housing, football field, futsal court, Agape Church and related facilities.","historyTitle":"Program history","history":[["4 December 2007","Theology program opened"],["6 December 2011","Pastoral ministry diploma opened"],["2 December 2014","Early Childhood Education program opened"],["23 August 2022","Three-year M.Div. program opened"]],"contactTitle":"Contact the school","contactText":"For enquiries about admissions and academic programs, please call the school.","phone":"Telephone","phoneText":"09 516 3652 · 09 503 5316 · 09 431 9144","address":"School address","addressText":"No.286, 10th Kaya St, Thingangyungyi, Mingladon Township, Yangon, Myanmar","more":"Send an enquiry","map":"View on Google Maps"}} as const;

export default async function AboutPage(){
 const locale="en";
  const t=text.en;
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
      <section className="chair-greeting"><div className="chair-mark"><img src="/mrpst-logo.png" alt="MRPST logo"/></div><div><span className="eyebrow">02 — MESSAGE</span><h2>{greeting.title}</h2><blockquote>{greeting.body}</blockquote><strong>{t.greetingSign}</strong></div></section>
      <section className="about-facts"><div className="about-section-head"><span className="eyebrow">03 — AT A GLANCE</span><h2>{facts.title}</h2>{facts.body&&<p>{facts.body}</p>}</div><div className="about-fact-grid"><article><span>01</span><h3>{t.location}</h3><p>{t.locationText}</p></article><article><span>02</span><h3>{t.land}</h3><p>{t.landText}</p></article><article className="wide"><span>03</span><h3>{t.facilities}</h3><p>{t.facilitiesText}</p></article></div></section>
      <section className="about-history"><div className="about-section-head"><span className="eyebrow">08 — HISTORY</span><h2>{history.title}</h2>{history.body&&<p>{history.body}</p>}</div><div className="about-history-list">{t.history.map(([date,event])=><article key={date}><strong>{date}</strong><span>{event}</span></article>)}</div></section>
      <section className="about-contact"><div><span className="eyebrow">09 — CONTACT</span><h2>{contact.title}</h2><p>{contact.body}</p></div><div><b>{t.phone}</b><p>{t.phoneText}</p><b>{t.address}</b><p>{t.addressText}</p><a className="btn light" href="https://maps.app.goo.gl/rqupUXw5JiumcrMv9?g_st=ic" target="_blank" rel="noopener noreferrer">{t.map} ↗</a><Link className="btn light" href={`/${locale}/contact`}>{t.more} ↗</Link></div></section>
    </main>
    <footer className="footer"><span>Myanmar Reformed Presbyterian School of Theology</span><span><Link href={`/${locale}`}>{t.home}</Link> · © {new Date().getFullYear()} MRPST</span></footer>
  </InlinePageEditor>;
}
