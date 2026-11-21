import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";

const labels = {
  my: { home: "ပင်မစာမျက်နှာ", about: "ကျောင်းအကြောင်း", academics: "ပညာရေးအစီအစဉ်", calendar: "ပညာရေးပြက္ခဒိန်", contact: "ဆက်သွယ်ရန်", student: "ကျောင်းသားဝင်ရန်", admin: "အုပ်ချုပ်ရေး" },
  ko: { home: "홈", about: "학교 소개", academics: "학과 안내", calendar: "학사 일정", contact: "연락처", student: "학생 로그인", admin: "관리자" }
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
    <header className="header">
      <Link href={`/${lang}`} className="brand">
        <span className="brand-logo"><img src="/mrpst-logo.png" alt="MRPST official logo" /></span>
        <span>MRPST<small>MYANMAR REFORMED PRESBYTERIAN SCHOOL OF THEOLOGY</small></span>
      </Link>
      <nav className="nav">
        {links.map(link => <Link key={link.key} href={link.href} className={active === link.key ? "active" : undefined} aria-current={active === link.key ? "page" : undefined}>{link.label}</Link>)}
      </nav>
      <div className="header-tools">
        <LanguageSwitcher locale={lang} />
        <Link className="admin-link" href={`/${lang}/student-login`}>{t.student}</Link>
        <Link className="admin-link" href={`/${lang}/admin`}>{t.admin}</Link>
      </div>
      <details className="mobile-menu">
        <summary aria-label="Open navigation menu"><span></span><span></span><span></span></summary>
        <nav className="mobile-nav">
          {links.map(link => <Link key={link.key} href={link.href} className={active === link.key ? "active" : undefined} aria-current={active === link.key ? "page" : undefined}>{link.label}</Link>)}
          <Link href={`/${lang}/student-login`}>{t.student}</Link>
          <Link href={`/${lang}/admin`}>{t.admin}</Link>
          <LanguageSwitcher locale={lang} mobile />
        </nav>
      </details>
    </header>
  );
}
