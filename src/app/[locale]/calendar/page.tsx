import Link from "next/link";
import ScheduleCalendar from "../admin/[module]/ScheduleCalendar";

export default async function CalendarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === "my" ? "my" : "ko";
  const isMyanmar = locale === "my";

  return (
    <>
      <header className="header">
        <Link href={`/${locale}`} className="brand">
          <span className="mark">M</span>
          <span>MRPST<small>MYANMAR REFORMED PRESBYTERIAN SCHOOL OF THEOLOGY</small></span>
        </Link>
        <nav className="nav">
          <Link href={`/${locale}#about`}>{isMyanmar ? "ကျောင်းအကြောင်း" : "학교 소개"}</Link>
          <Link href={`/${locale}#academics`}>{isMyanmar ? "ပညာရေး" : "학과 안내"}</Link>
          <Link href={`/${locale}#history`}>{isMyanmar ? "သမိုင်း" : "연혁"}</Link>
          <Link href={`/${locale}/calendar`}>{isMyanmar ? "ပညာရေးပြက္ခဒိန်" : "학사 일정"}</Link>
          <Link href={`/${locale}/contact`}>{isMyanmar ? "ဆက်သွယ်ရန်" : "연락처"}</Link>
        </nav>
        <div className="header-tools">
          <div className="langs"><Link href="/my">မြန်မာ</Link><Link href="/ko">한국어</Link></div>
          <Link className="admin-link" href={`/${locale}/admin`}>{isMyanmar ? "အုပ်ချုပ်ရေး" : "관리자"}</Link>
        </div>
        <details className="mobile-menu">
          <summary aria-label="Open navigation menu"><span></span><span></span><span></span></summary>
          <nav className="mobile-nav">
            <Link href={`/${locale}#about`}>{isMyanmar ? "ကျောင်းအကြောင်း" : "학교 소개"}</Link>
            <Link href={`/${locale}#academics`}>{isMyanmar ? "ပညာရေး" : "학과 안내"}</Link>
            <Link href={`/${locale}#history`}>{isMyanmar ? "သမိုင်း" : "연혁"}</Link>
            <Link href={`/${locale}/calendar`}>{isMyanmar ? "ပညာရေးပြက္ခဒိန်" : "학사 일정"}</Link>
            <Link href={`/${locale}/contact`}>{isMyanmar ? "ဆက်သွယ်ရန်" : "연락처"}</Link>
            <Link href={`/${locale}/admin`}>{isMyanmar ? "အုပ်ချုပ်ရေး" : "관리자"}</Link>
            <div className="mobile-langs"><Link href="/my">မြန်မာ</Link><Link href="/ko">한국어</Link></div>
          </nav>
        </details>
      </header>
      <main className="academics-workspace" style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
        <div className="academics-heading" style={{ marginTop: 36 }}>
          <span className="eyebrow">MRPST ACADEMIC CALENDAR</span>
          <h1>{isMyanmar ? "ပညာရေးပြက္ခဒိန်" : "학사 일정"}</h1>
          <p>{isMyanmar ? "ကျောင်း၏ ပညာရေးအစီအစဉ်နှင့် အရေးကြီးသော အခမ်းအနားများကို ကြည့်ရှုနိုင်ပါသည်။" : "학교의 학사 일정과 주요 행사를 확인하실 수 있습니다."}</p>
        </div>
        <ScheduleCalendar publicOnly />
      </main>
    </>
  );
}
