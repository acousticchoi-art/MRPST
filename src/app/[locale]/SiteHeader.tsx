import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";

const labels = {
  my: { home: "ပင်မစာမျက်နှာ", about: "ကျောင်းအကြောင်း", academics: "ပညာရေးအစီအစဉ်", calendar: "ပညာရေးပြက္ခဒိန်", contact: "ဆက်သွယ်ရန်", admin: "အုပ်ချုပ်ရေး" },
  ko: { home: "홈", about: "학교 소개", academics: "학과 안내", calendar: "학사 일정", contact: "연락처", admin: "관리자" }
} as const;

export default function SiteHeader({ locale, active }: { locale: string; active: "home" | "about" | "academics" | "calendar" | "contact" }) {
  const lang = locale === "ko" ? "ko" : "my";
  const t = labels[lang];
  const links = [
    { key: "home", href: `/${lang}`, label: t.home },
    { key: "about", href: `/${lang}/about`, label: t.about },
    { key: "academics", href: `/${lang}/academics`, label: t.academics },
    { key: "calendar", href: `/${lang}/calendar`, label: t.calendar },
    { key: "contact", href: `/${lang}/contact`, label: t.contact }
  ] as const;
  return (
    <>
      <style>{`
        @media (max-width: 760px) {
          header.header nav.public-desktop-nav { display: none !important; }
          header.header .public-header-tools { display: none !important; }
          header.header details.public-mobile-menu { display: block !important; position: relative !important; margin-left: auto !important; z-index: 2000 !important; }
          header.header details.public-mobile-menu > summary { display: flex !important; width: 42px !important; height: 42px !important; align-items: center !important; justify-content: center !important; flex-direction: column !important; gap: 5px !important; border: 1px solid #dce3e7 !important; border-radius: 50% !important; background: #fff !important; cursor: pointer !important; }
          header.header details.public-mobile-menu > summary::-webkit-details-marker { display: none; }
          header.header details.public-mobile-menu > summary span { display: block !important; width: 17px !important; height: 2px !important; background: #173c55 !important; }
          header.header nav.public-mobile-nav { position: absolute !important; top: calc(100% + 10px) !important; right: 0 !important; z-index: 2001 !important; display: none !important; grid-template-columns: 1fr !important; grid-auto-flow: row !important; gap: 2px !important; width: min(290px, calc(100vw - 32px)) !important; max-height: 70vh !important; overflow-y: auto !important; padding: 10px !important; border: 1px solid #e5eaee !important; border-radius: 12px !important; background: #fff !important; box-shadow: 0 16px 40px rgba(16,45,66,.18) !important; }
          header.header details.public-mobile-menu[open] nav.public-mobile-nav { display: grid !important; }
          header.header nav.public-mobile-nav a { display: flex !important; width: 100% !important; min-width: 0 !important; padding: 12px !important; border-radius: 7px !important; white-space: normal !important; line-height: 1.5 !important; color: #26343d !important; }
          header.header nav.public-mobile-nav a.active { background: #edf2f5 !important; color: #173c55 !important; font-weight: 800 !important; }
          header.header nav.public-mobile-nav .mobile-langs { display: flex !important; gap: 16px !important; padding: 12px !important; }
        }
        @media (min-width: 761px) {
          header.header details.public-mobile-menu { display: none !important; }
          header.header nav.public-desktop-nav { display: flex !important; }
          header.header .public-header-tools { display: flex !important; }
        }
      `}</style>
      <header className="header">
        <Link href={`/${lang}`} className="brand">
          <span className="brand-logo"><img src="/mrpst-logo.png" alt="MRPST official logo" /></span>
          <span>MRPST<small>MYANMAR REFORMED PRESBYTERIAN SCHOOL OF THEOLOGY</small></span>
        </Link>
        <nav className="nav public-desktop-nav">
          {links.map(link => <Link key={link.key} href={link.href} className={active === link.key ? "active" : undefined} aria-current={active === link.key ? "page" : undefined}>{link.label}</Link>)}
        </nav>
        <div className="header-tools public-header-tools">
          <LanguageSwitcher locale={lang} />
          <Link className="admin-link" href={`/${lang}/admin`}>{t.admin}</Link>
        </div>
        <details className="mobile-menu public-mobile-menu">
          <summary aria-label="Open navigation menu"><span></span><span></span><span></span></summary>
          <nav className="mobile-nav public-mobile-nav">
            {links.map(link => <Link key={link.key} href={link.href} className={active === link.key ? "active" : undefined} aria-current={active === link.key ? "page" : undefined}>{link.label}</Link>)}
            <Link href={`/${lang}/admin`}>{t.admin}</Link>
            <LanguageSwitcher locale={lang} mobile />
          </nav>
        </details>
      </header>
    </>
  );
}
