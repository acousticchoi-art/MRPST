"use client";
import Link from "next/link";
import ScheduleCalendar from "../admin/[module]/ScheduleCalendar";
export default function CalendarPage(){return <main className="academics-workspace" style={{maxWidth:1100,margin:"0 auto",padding:"40px 20px"}}><header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}><Link href="/ko" className="brand"><span className="mark">M</span><span>MRPST</span></Link><Link className="btn secondary" href="/ko">홈으로</Link></header><div className="academics-heading" style={{marginTop:36}}><span className="eyebrow">MRPST ACADEMIC CALENDAR</span><h1>학사 일정</h1><p>학교의 학사 일정과 주요 행사를 확인할 수 있습니다.</p></div><ScheduleCalendar publicOnly/></main>}
