import SiteHeader from "../SiteHeader";
import ScheduleCalendar from "../admin/[module]/ScheduleCalendar";
import {getPublishedWebsiteContent,inlinePageValues,websiteCopy} from "@/lib/website-content";
import InlinePageEditor from "../InlinePageEditor";

export default async function CalendarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === "my" ? "my" : "ko";
  const isMyanmar = locale === "my";
  const content=await getPublishedWebsiteContent(locale);
  const hero=websiteCopy(content,"calendar-hero",{
    title:isMyanmar ? "ပညာရေးပြက္ခဒိန်" : "학사 일정",
    body:isMyanmar ? "စာသင်ကာလအလိုက် ကျောင်း၏ အရေးကြီးရက်များနှင့် အခမ်းအနားများကို ကြည့်ရှုနိုင်ပါသည်။" : "학교의 학사 일정과 주요 행사를 확인하실 수 있습니다."
  });

  return (
    <InlinePageEditor pageKey="calendar" locale={locale} initialValues={inlinePageValues(content,"calendar")}>
      <SiteHeader locale={locale} active="calendar" />
      <main className="academics-workspace" style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
        <div className="academics-heading" data-no-inline-edit={isMyanmar ? "" : undefined} style={{ marginTop: 36 }}>
          <span className="eyebrow">{isMyanmar ? "MRPST" : "MRPST ACADEMIC CALENDAR"}</span>
          <h1>{hero.title}</h1>
          <p>{hero.body}</p>
        </div>
        <ScheduleCalendar publicOnly locale={locale} />
      </main>
    </InlinePageEditor>
  );
}
