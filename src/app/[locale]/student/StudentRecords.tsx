"use client";
import {useState} from "react";
export type Grade = { academic_year: number; term_name: string; term_code: string; course_code: string; course_name: string; course_name_my: string | null; credits: number | null; score: number | null; grade: string | null };
export type Timetable = { academic_year: number; term_name: string; term_code: string; course_code: string; course_name: string; course_name_my: string | null; day_of_week: number; start_time: string; end_time: string; room: string | null; class_group: string | null; in_current_term?: boolean };

export type Loan={title:string;checkout_date:string;due_date:string;status:string};
type Labels={schedule:string;grades:string;noSchedule:string;noGrades:string;term:string;course:string;credit:string;score:string;grade:string;room:string};
export default function StudentRecords({locale,labels:t,days,grades,timetable,loans,libraryLinked,today,weekday}:{locale:string;labels:Labels;days:string[];grades:Grade[];timetable:Timetable[];loans?:Loan[];libraryLinked?:boolean;today:string;weekday:number}){
 const my=locale==="my",en=locale==="en";
 const courseName=(row:{course_name:string;course_name_my:string|null})=>my&&row.course_name_my?row.course_name_my:row.course_name;
 const termOptions=(rows:(Grade|Timetable)[])=>Array.from(new Map(rows.map(row=>[row.term_code,{code:row.term_code,name:row.term_name,year:row.academic_year}])).values());
 const scheduleTerms=termOptions(timetable),gradeTerms=termOptions(grades);
 const [scheduleTerm,setScheduleTerm]=useState(timetable.find(row=>row.in_current_term)?.term_code??scheduleTerms[0]?.code??"");
 const [gradeTerm,setGradeTerm]=useState(grades.find(row=>row.score!==null)?.term_code??gradeTerms[0]?.code??"");
 const schedule=timetable.filter(row=>row.term_code===scheduleTerm);
 const selectedGrades=grades.filter(row=>row.term_code===gradeTerm);
 const scores=selectedGrades.filter(row=>typeof row.score==="number"&&Number.isFinite(row.score));
 const average=scores.length?(scores.reduce((sum,row)=>sum+Number(row.score),0)/scores.length).toFixed(2):"—";
 const averageLabel=en?"Average of recorded scores":my?"မှတ်တမ်းတင်ထားသော အမှတ်များ၏ ပျမ်းမျှ":"입력된 점수의 단순 평균";
 const enteredLabel=en?"Recorded scores":my?"မှတ်တမ်းတင်ထားသော အမှတ်များ":"점수 입력 과목";
 const termLabel=(row:{name:string;year:number})=>row.year+" · "+row.name;
 const dayLabel=(day:number)=>days[day-1]??String(day);
 const scheduleDays=Array.from(new Set(schedule.map(row=>row.day_of_week))).sort((a,b)=>a-b);
 const currentSchedule=timetable.filter(row=>row.in_current_term===true);
 const todaySchedule=currentSchedule.filter(row=>row.day_of_week===weekday).sort((a,b)=>a.start_time.localeCompare(b.start_time));
 const todayTitle=en?"Today's regular classes":my?"ယနေ့ ပုံမှန်အတန်းချိန်":"오늘의 정규 수업";
 const noToday=en?"No regular classes today.":my?"ယနေ့ ပုံမှန်အတန်း မရှိပါ။":"오늘 정규 수업이 없습니다.";
 const noCurrent=en?"No timetable for an active term within its dates.":my?"လက်ရှိဖွင့်ထားသော စာသင်နှစ်ဝက်အတွက် အချိန်ဇယား မရှိပါ။":"현재 운영 기간에 해당하는 학기 시간표가 없습니다.";
 const libraryTitle=en?"My library loans":my?"ငှားရမ်းထားသော စာအုပ်များ":"내 도서 대출";
 const dueLabel=en?"Due date":my?"ပြန်အပ်ရမည့်ရက်":"반납 예정일";
 return <>
  {timetable.some(row=>typeof row.in_current_term==="boolean")&&<section className="student-section">
   <div className="records-heading"><h2>{todayTitle}</h2><span>{today} · {dayLabel(weekday)}</span></div>
   {todaySchedule.length?<div className="student-schedule">{todaySchedule.map((row,index)=><article key={row.term_code+"-"+row.course_code+"-"+index}><b>{row.start_time}–{row.end_time}</b><strong>{courseName(row)}</strong><span>{row.room?t.room+" "+row.room:row.course_code}</span></article>)}</div>:<p className="module-placeholder">{currentSchedule.length?noToday:noCurrent}</p>}
  </section>}
  <section className="student-section">
   <div className="records-heading"><h2>{t.schedule}</h2>{scheduleTerms.length>0&&<label>{t.term}<select value={scheduleTerm} onChange={e=>setScheduleTerm(e.target.value)}>{scheduleTerms.map(term=><option key={term.code} value={term.code}>{termLabel(term)}</option>)}</select></label>}</div>
   {schedule.length?scheduleDays.map(day=><div className="day-group" key={day}><h3>{dayLabel(day)}</h3><div className="student-schedule">{schedule.filter(row=>row.day_of_week===day).map((row,index)=><article key={row.course_code+"-"+index}><b>{row.start_time}–{row.end_time}</b><strong>{courseName(row)}</strong><span>{row.course_code}{row.room?" · "+t.room+" "+row.room:""}{row.class_group?" · "+row.class_group:""}</span></article>)}</div></div>):<p className="module-placeholder">{t.noSchedule}</p>}
  </section>
  <section className="student-section">
   <div className="records-heading"><h2>{t.grades}</h2>{gradeTerms.length>0&&<label>{t.term}<select value={gradeTerm} onChange={e=>setGradeTerm(e.target.value)}>{gradeTerms.map(term=><option key={term.code} value={term.code}>{termLabel(term)}</option>)}</select></label>}</div>
   {selectedGrades.length?<><div className="grade-summary"><div><span>{enteredLabel}</span><strong>{scores.length} / {selectedGrades.length}</strong></div><div><span>{averageLabel}</span><strong>{average}</strong></div></div><div className="grade-list">{selectedGrades.map((row,index)=><article className="grade-record" key={row.course_code+"-"+index}><div className="course-name"><strong>{courseName(row)}</strong><small>{row.course_code}</small></div><div className="grade-values"><div><small>{t.credit}</small><b>{row.credits??"—"}</b></div><div><small>{t.score}</small><b>{row.score??"—"}</b></div><div><small>{t.grade}</small><b>{row.grade??"—"}</b></div></div></article>)}</div></>:<p className="module-placeholder">{t.noGrades}</p>}
  </section>
  {typeof libraryLinked==="boolean"&&Array.isArray(loans)&&<section className="student-section">
   <div className="records-heading"><h2>{libraryTitle}</h2></div>
   {!libraryLinked?<p className="module-placeholder">{en?"Your library member record is not linked.":my?"စာကြည့်တိုက် အသင်းဝင်စာရင်းနှင့် မချိတ်ဆက်ရသေးပါ။":"도서관 이용자 정보가 아직 연결되지 않았습니다."}</p>:!loans.length?<p className="module-placeholder">{en?"No outstanding loans.":my?"ပြန်အပ်ရန် ကျန်ရှိသော စာအုပ် မရှိပါ။":"미반납 도서가 없습니다."}</p>:<div className="grade-list">{loans.map((loan,index)=><article className="grade-record" key={index}><div className="course-name"><strong>{loan.title}</strong><small>{dueLabel}: {loan.due_date}</small></div><b>{loan.status==="lost"?(en?"Lost":my?"ပျောက်ဆုံး":"분실"):loan.due_date<today?(en?"Overdue":my?"ရက်ကျော်နေသည်":"반납 기한 경과"):(en?"On loan":my?"ငှားရမ်းဆဲ":"대출 중")}</b></article>)}</div>}
  </section>}
  <style jsx>{`
   .records-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px}
   .records-heading h2{margin:0}
   .records-heading label{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted);max-width:100%;flex-wrap:wrap}
   .records-heading select{min-height:44px;max-width:100%;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:white;color:var(--navy);font:inherit}
   .day-group{margin:0 0 18px}.day-group h3{font-size:15px;margin:0 0 8px;color:var(--navy)}
   .grade-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:14px}
   .grade-summary>div,.grade-record{border:1px solid var(--line);border-radius:10px;padding:12px;background:#fff;min-width:0}
   .grade-summary span,.grade-record small{display:block;font-size:12px;color:var(--muted);overflow-wrap:anywhere}
   .grade-summary strong{display:block;font-size:20px;color:var(--navy);margin-top:5px}
   .grade-list{display:grid;gap:8px}
   .grade-record{display:grid;grid-template-columns:minmax(0,1fr) minmax(180px,40%);align-items:center;gap:10px}
   .course-name{overflow-wrap:anywhere}.course-name strong{display:block;line-height:1.5}
   .grade-values{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;text-align:center}.grade-values b{display:block;overflow-wrap:anywhere;margin-top:3px}
   @media(max-width:560px){.records-heading label{width:100%}.records-heading select{flex:1;min-width:0}.grade-record{grid-template-columns:1fr}.grade-values{border-top:1px solid var(--line);padding-top:8px}.grade-summary>div{padding:10px}}
  `}</style>
 </>;
}
