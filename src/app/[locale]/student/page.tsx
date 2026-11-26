import LanguageSwitcher from "../LanguageSwitcher";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import StudentSignOut from "./StudentSignOut";

type Grade = { academic_year: number; term_name: string; term_code: string; course_code: string; course_name: string; course_name_my: string | null; credits: number | null; score: number | null; grade: string | null };
type Timetable = { academic_year: number; term_name: string; term_code: string; course_code: string; course_name: string; course_name_my: string | null; day_of_week: number; start_time: string; end_time: string; room: string | null; class_group: string | null };
type PortalData = { student: { student_number: string; full_name: string; program: string | null; current_semester: number | null; admission_year: number | null; student_status: string }; grades: Grade[]; timetable: Timetable[] };

export default async function StudentPortal({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const my = locale === "my";
  const t = locale==="en"?{"title":"Student Portal","profile":"Student information","schedule":"Class timetable","grades":"Grades by semester","noSchedule":"No timetable is available for your enrolled courses.","noGrades":"No grades recorded.","number":"Student number","program":"Program","semester":"Current semester","admission":"Admission year","year":"Academic year","term":"Semester","course":"Course","credit":"Credits","score":"Score","grade":"Grade","room":"Room","status":"Student status","unspecified":"Not specified"}:my ? {
    title: "ကျောင်းသား စာမျက်နှာ", profile: "ကျောင်းသားအချက်အလက်", schedule: "အတန်းချိန်ဇယား", grades: "စာသင်နှစ်ဝက်အလိုက် အမှတ်များ", noSchedule: "မှတ်ပုံတင်ထားသော ဘာသာရပ်အတွက် အတန်းချိန်ဇယား မရှိသေးပါ။", noGrades: "မှတ်တမ်းတင်ထားသော အမှတ် မရှိသေးပါ။", number: "ကျောင်းသားနံပါတ်", program: "သင်တန်း", semester: "လက်ရှိ စာသင်နှစ်ဝက်", admission: "ဝင်ခွင့်နှစ်", year: "စာသင်နှစ်", term: "စာသင်နှစ်ဝက်", course: "ဘာသာရပ်", credit: "ယူနစ်", score: "အမှတ်", grade: "အဆင့်", room: "အခန်း", status: "အခြေအနေ", unspecified: "မသတ်မှတ်ရသေးပါ"
  } : {
    title: "학생 포털", profile: "학생 정보", schedule: "수강 시간표", grades: "학기별 성적", noSchedule: "수강 신청한 과목의 시간표가 아직 없습니다.", noGrades: "등록된 성적이 없습니다.", number: "학번", program: "과정", semester: "현재 학기", admission: "입학 연도", year: "학년도", term: "학기", course: "과목", credit: "학점", score: "점수", grade: "성적", room: "강의실", status: "학적 상태", unspecified: "미지정"
  };
  const statusLabels:Record<string,string> = locale==="en"?{active:"Enrolled",leave:"On leave",graduated:"Graduated",withdrawn:"Withdrawn"}:my?{active:"တက်ရောက်ဆဲ",leave:"ခွင့်ယူထား",graduated:"ဘွဲ့ရ",withdrawn:"ကျောင်းထွက်"}:{active:"재학",leave:"휴학",graduated:"졸업",withdrawn:"자퇴"};
  const days = locale==="en"?["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]:my ? ["တနင်္လာ", "အင်္ဂါ", "ဗုဒ္ဓဟူး", "ကြာသပတေး", "သောကြာ", "စနေ", "တနင်္ဂနွေ"] : ["월", "화", "수", "목", "금", "토", "일"];
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect(`/${locale}/student-login`);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/student-login`);
  const { data, error } = await supabase.rpc("mrpst_student_portal_data");
  if (error || !data?.student) redirect(`/${locale}/student-login`);
  const portal = data as PortalData;
  const currentTerm = portal.timetable[0]?.term_code;
  const schedule = currentTerm ? portal.timetable.filter((row) => row.term_code === currentTerm) : [];
  const courseName = (row: { course_name: string; course_name_my: string | null }) => my && row.course_name_my ? row.course_name_my : row.course_name;

  return <main className="module-page student-portal">
    <header className="module-page-top"><Link href={`/${locale}`}>MRPST</Link><div className="module-page-tools"><span>{portal.student.full_name} · {t.title}</span><LanguageSwitcher locale={locale==="en"?"en":my?"my":"ko"}/><StudentSignOut locale={locale} /></div></header>
    <section className="module-page-content">
      <span className="eyebrow">{t.title}</span><h1>{portal.student.full_name}</h1><p>{t.number} {portal.student.student_number} · {portal.student.program || t.unspecified}</p>
      <div className="student-summary">
        <div><span>{t.program}</span><strong>{portal.student.program || t.unspecified}</strong></div>
        <div><span>{t.semester}</span><strong>{portal.student.current_semester ?? "—"}</strong></div>
        <div><span>{t.admission}</span><strong>{portal.student.admission_year ?? "—"}</strong></div>
        <div><span>{t.status}</span><strong>{statusLabels[portal.student.student_status]??portal.student.student_status}</strong></div>
      </div>
      <section className="student-section"><h2>{t.schedule}{schedule[0] ? ` · ${schedule[0].term_name}` : ""}</h2>
        {schedule.length ? <div className="student-schedule">{schedule.map((row, index) => <article key={`${row.term_code}-${row.course_code}-${index}`}><b>{days[Math.max(0, Math.min(6, row.day_of_week - 1))] || row.day_of_week} · {row.start_time}–{row.end_time}</b><strong>{courseName(row)}</strong><span>{row.course_code}{row.room ? ` · ${t.room} ${row.room}` : ""}</span></article>)}</div> : <p className="module-placeholder">{t.noSchedule}</p>}</section>
      <section className="student-section"><h2>{t.grades}</h2><div className="student-table-wrap"><table className="student-table"><thead><tr><th>{t.year}</th><th>{t.term}</th><th>{t.course}</th><th>{t.credit}</th><th>{t.score}</th><th>{t.grade}</th></tr></thead><tbody>{portal.grades.map((row, index) => <tr key={`${row.term_code}-${row.course_code}-${index}`}><td>{row.academic_year}</td><td>{row.term_name}</td><td>{courseName(row)} <small>{row.course_code}</small></td><td>{row.credits ?? "—"}</td><td>{row.score ?? "—"}</td><td>{row.grade ?? "—"}</td></tr>)}</tbody></table>{!portal.grades.length && <p>{t.noGrades}</p>}</div></section>
    </section>
  </main>;
}
