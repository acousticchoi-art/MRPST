import SiteHeader from "../[locale]/SiteHeader";
import Link from "next/link";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import InlinePageEditor from "../[locale]/InlinePageEditor";
import {englishDisplay} from "@/lib/english-display";
import PublicAnnouncements from "./PublicAnnouncements";

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
} as const;
const officialName = "Myanmar Reformed Presbyterian School of Theology";

export default async function Home(){
 const locale="en";
 const base=copy.en;
  const supabase=await createSupabaseServerClient();
  let cmsRows:{content_type:string;content_key:string;title:string;body:string;is_published:boolean;created_at:string;updated_at:string}[]=[];
  if(supabase){
    const [{data:pageData},{data:announcementData}]=await Promise.all([
      supabase.from("website_contents").select("content_type,content_key,title,body,is_published,created_at,updated_at").eq("content_type","page").eq("locale",locale).eq("is_published",true),
      supabase.from("website_contents").select("content_type,content_key,title,body,is_published,created_at,updated_at").eq("content_type","announcement").in("locale",["all",locale]).eq("is_published",true)
    ]);
    cmsRows=[...(pageData??[]),...(announcementData??[])] as typeof cmsRows;
  }
  const page=(key:string)=>cmsRows.find(x=>x.content_type==="page"&&x.content_key===key);
  let inlineValues:Record<string,string>={};
  try{const parsed=JSON.parse(page("inline-page-home")?.body??"");if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed))inlineValues=parsed;}catch{}
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
  // Translate the two existing public notices only when their original text still matches.
  // New or edited notice content remains original until an English translation is supplied.
  const announcements=cmsRows.filter(x=>x.content_type==="announcement").map(x=>({...x,title:englishDisplay(x.title??""),body:englishDisplay(x.body??"")})).sort((a,b)=>b.updated_at.localeCompare(a.updated_at));
  return <InlinePageEditor pageKey="home" locale={locale} initialValues={inlineValues}>
    <SiteHeader locale={locale} active="home" />
    <main className="homepage">
      <section className="hero hero-redesign">
        <div className="hero-copy">
          <span className="eyebrow">{"MYANMAR · YANGON · EST. 2007"}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
          <div className="actions">
            <a className="btn primary" href="#academics">{t.academics}<span aria-hidden="true"> ↗</span></a>
            <a className="btn secondary" href="#about">{t.about}</a>
          </div>
          <div className="hero-principles">
            <span>{"Scripture-centered"}</span>
            <i />
            <span>{"Reformed theology"}</span>
            <i />
            <span>{"Practical ministry"}</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-image" />
          <div className="hero-image-caption"><span>MRPST</span><small>{"Forming faithful servants"}</small></div>
          <div className="hero-seal"><strong>MRPST</strong><span>REFORMED<br/>THEOLOGY</span></div>
        </div>
      </section>

      <PublicAnnouncements locale={locale} announcements={announcements}/>

      <section id="about" className="section intro-section home-intro-summary">
        <div className="intro-heading">
          <span className="eyebrow">{"01 — ABOUT MRPST"}</span>
          <h2>{"A seminary founded on Scripture and Reformed theology"}</h2>
          <div className="gold-rule" />
          <p className="intro-note">{"Sound theology, sound faith, faithful church planting"}</p>
        </div>
        <div className="intro-body">
          <p>{"MRPST equips spiritual leaders to serve Myanmar’s churches and communities through biblical and Reformed theological education, as well as Christian early childhood education."}</p>
          <Link className="text-link" href={`/${locale}/about`}>{"Learn more about MRPST"}<span aria-hidden="true"> ↗</span></Link>
        </div>
      </section>

      <section className="principles-band">
        <div className="principle"><span>01</span><div><strong>{"The authority of Scripture"}</strong><p>{"The enduring foundation of education and ministry"}</p></div></div>
        <div className="principle"><span>02</span><div><strong>{"Reformed faith"}</strong><p>{"Theology grounded in the Westminster Confession of Faith"}</p></div></div>
        <div className="principle"><span>03</span><div><strong>{"Church and community"}</strong><p>{"Putting learned truth into practice through service"}</p></div></div>
      </section>

      <section id="academics" className="section academics-section">
        <div className="section-heading-row"><div><span className="eyebrow">{"02 — ACADEMICS"}</span><h2>{t.departments}</h2></div><p>{"We cultivate professional skills and Christian values so that learning leads to calling."}</p></div>
        <div className="cards academic-cards">
          <article className="card academic-card theology-card"><div className="academic-card-top"><span>01 / THEOLOGY</span><span className="academic-symbol">✦</span></div><div><h3>{t.theology}</h3><p>{t.theologyText}</p></div><Link href={`/${locale}/academics`} aria-label={t.theology}> <span aria-hidden="true">↗</span></Link></article>
          <article className="card academic-card education-card"><div className="academic-card-top"><span>02 / EDUCATION</span><span className="academic-symbol">✳</span></div><div><h3>{t.ece}</h3><p>{t.eceText}</p></div><Link href={`/${locale}/academics`} aria-label={t.ece}><span aria-hidden="true">↗</span></Link></article>
        </div>
      </section>

      <section id="history" className="section history-section">
        <div className="history-intro"><span className="eyebrow">{"03 — OUR JOURNEY"}</span><h2>{t.history}</h2><p>{t.historyIntro}</p></div>
        <div className="history-timeline">{t.milestones.map(([year,description],i)=><article className="history-item" key={year}><div className="history-year">{year}</div><div className="history-copy"><h3>{year}</h3><p>{description}</p></div></article>)}</div>
      </section>

      <section id="contact" className="contact-section">
        <div className="contact"><div><span className="eyebrow">{"04 — GET IN TOUCH"}</span><h2>{t.contactTitle}</h2><p>{t.contactText}</p></div><div className="contact-action"><p className="contact-address">{t.addressText}</p><a className="btn light" href="https://maps.app.goo.gl/rqupUXw5JiumcrMv9?g_st=ic" target="_blank" rel="noopener noreferrer">{"View on Google Maps"} ↗</a><p className="contact-email"><a href="mailto:acousticchoi@gmail.com">acousticchoi@gmail.com</a></p><Link className="btn light" href={`/${locale}/contact`}>{"Contact us"} ↗</Link></div></div>
      </section>
    </main>
    <footer className="footer"><span>{officialName}</span><span><Link href={`/${locale}/contact`}>{t.contact}</Link> · © {new Date().getFullYear()} MRPST</span></footer>
  </InlinePageEditor>;
}
