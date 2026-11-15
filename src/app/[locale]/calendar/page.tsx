import Link from "next/link";
import ScheduleCalendar from "../admin/[module]/ScheduleCalendar";
export default async function CalendarPage({params}:{params:Promise<{locale:string}>}){
 const {locale:rawLocale}=await params;
 const locale=rawLocale==="my"?"my":"ko";
 const isMyanmar=locale==="my";
 return <main className="academics-workspace" style={{maxWidth:1100,margin:"0 auto",padding:"40px 20px"}}><header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}><Link href={`/${locale}`} className="brand"><span className="mark">M</span><span>MRPST</span></Link><Link className="btn secondary" href={`/${locale}`}>{isMyanmar?"ပင်မစာမျက်နှာ":"홈으로"}</Link></header><div className="academics-heading" style={{marginTop:36}}><span className="eyebrow">MRPST ACADEMIC CALENDAR</span><h1>{isMyanmar?"ပညာရေးပြက္ခဒိန်":"학사 일정"}</h1><p>{isMyanmar?"ကျောင်း၏ ပညာရေးအစီအစဉ်နှင့် အရေးကြီးသော အခမ်းအနားများကို ကြည့်ရှုနိုင်ပါသည်။":"학교의 학사 일정과 주요 행사를 확인할 수 있습니다."}</p></div><ScheduleCalendar publicOnly/></main>
}