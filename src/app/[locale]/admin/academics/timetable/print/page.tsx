import {englishDisplay} from "@/lib/english-display";
import Link from "next/link";
import {redirect} from "next/navigation";
import {getServerModuleAccess} from "@/lib/auth/server-access";
import PrintActions from "./PrintActions";
import "./print.css";

export const dynamic="force-dynamic";
export const revalidate=0;

type Row={id:string;[key:string]:any};
const weekdays=[{day:1,label:"MON"},{day:2,label:"TUE"},{day:3,label:"WED"},{day:4,label:"THU"},{day:5,label:"FRI"},{day:6,label:"SAT"}];
const clock=(value:unknown)=>String(value??"").slice(0,5);

export default async function TimetablePrintPage({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<{term?:string;department?:string}>}){
 const {locale}=await params;
 const lang=locale==="en"?"en":locale==="my"?"my":"ko";
 const {term:termId,department:departmentId}=await searchParams;
 const back=`/${locale}/admin/academics`;
 const copy=lang==="en"?{back:"Back to Academic Management",print:"Print / Save PDF",title:"Class Timetable",empty:"No timetable for the selected semester and department.",invalid:"Select a semester and department first.",fail:"Unable to load the timetable.",time:"TIME / DAY",event:"Shared event",self:"Independent study",term:"Semester",dept:"Department"}:lang==="my"?{
  back:"ပညာရေးစီမံခန့်ခွဲမှုသို့ ပြန်သွားရန်",print:"ပုံနှိပ်ရန် / PDF သိမ်းရန်",title:"သင်တန်းအချိန်ဇယား",
  empty:"ရွေးချယ်ထားသော စာသင်ကာလနှင့် ဌာနအတွက် အချိန်ဇယား မရှိပါ။",
  invalid:"စာသင်ကာလနှင့် ဌာနကို ဦးစွာ ရွေးချယ်ပါ။",fail:"အချိန်ဇယားကို ဖတ်၍မရပါ။",
  time:"အချိန် / နေ့ရက်",event:"အစီအစဉ်",self:"သီးသန့်လေ့လာချိန်",term:"စာသင်ကာလ",dept:"ဌာန"
 }:{
  back:"학사 관리로 돌아가기",print:"인쇄 / PDF 저장",title:"강의 시간표",
  empty:"선택한 학기와 학과에 등록된 시간표가 없습니다.",
  invalid:"학기와 학과를 먼저 선택해 주세요.",fail:"시간표를 불러올 수 없습니다.",
  time:"TIME / DAY",event:"공통 일정",self:"자율학습",term:"학기",dept:"학과"
 };
 const access=await getServerModuleAccess("academics");
 if(!access.ok){if(access.status===401)redirect(`/${locale}/login`);return <main className="lecture-print-error">{lang==="en"?englishDisplay(access.error):access.error}</main>;}
 const validId=(value:unknown)=>typeof value==="string"&&/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(value);
 if(!validId(termId)||!validId(departmentId))return <main className="lecture-print-error"><Link href={back}>{copy.back}</Link><p>{copy.invalid}</p></main>;
 const db=access.supabase;
 const [term,department,entriesResult,eventsResult]=await Promise.all([
  db.from("academic_terms").select("id,name,academic_year,term_code").eq("id",termId!).maybeSingle(),
  db.from("departments").select("id,code,name_ko,name_en,name_my").eq("id",departmentId!).maybeSingle(),
  db.from("academic_timetable_entries").select("id,day_of_week,start_time,end_time,course_id,instructor_id,class_group,room,notes").eq("term_id",termId!).eq("department_id",departmentId!).eq("is_active",true).order("day_of_week").order("start_time").order("display_order"),
  db.from("academic_timetable_events").select("id,day_of_week,start_time,end_time,title,notes").eq("term_id",termId!).eq("department_id",departmentId!).order("day_of_week").order("start_time").order("display_order")
 ]);
 const loadError=term.error||department.error||entriesResult.error||eventsResult.error;
 const entries=(entriesResult.data??[]) as Row[];
 const events=(eventsResult.data??[]) as Row[];
 const courseIds=[...new Set(entries.map(row=>row.course_id).filter(Boolean))];
 const instructorIds=[...new Set(entries.map(row=>row.instructor_id).filter(Boolean))];
 const [courses,instructors]=await Promise.all([
  courseIds.length?db.from("academic_courses").select("id,title,title_my,course_code").in("id",courseIds):Promise.resolve({data:[],error:null}),
  instructorIds.length?db.from("academic_instructors").select("id,full_name").in("id",instructorIds):Promise.resolve({data:[],error:null})
 ]);
 const error=loadError||courses.error||instructors.error;
 const courseNames=new Map((courses.data??[]).map(row=>[row.id,lang==="my"?(row.title_my||row.title):row.title]));
 const instructorNames=new Map((instructors.data??[]).map(row=>[row.id,row.full_name]));
 const slots=[...new Set([...entries,...events].map(row=>`${clock(row.start_time)}|${clock(row.end_time)}`))]
  .filter(x=>x.length>1).sort((a,b)=>a.localeCompare(b));
 const departmentName=lang==="en"?(department.data?.name_en||department.data?.name_ko||department.data?.code):lang==="my"?(department.data?.name_my||department.data?.name_en||department.data?.code):(department.data?.name_ko||department.data?.name_en||department.data?.code);
 const title=`${term.data?.name??""} · ${departmentName??""}`;
 return <main className="lecture-print-page">
  <nav className="lecture-print-toolbar"><Link href={back}>{copy.back}</Link><strong>{copy.title}</strong>{!error&&term.data&&department.data&&<PrintActions label={copy.print}/>}</nav>
  {error||!term.data||!department.data?<section className="lecture-print-error">{copy.fail}</section>:
  <article className="lecture-print-sheet" data-print-lang={lang}>
   <header><span>MRPST · {lang==="my"?"သင်တန်းအချိန်ဇယား":"ACADEMIC TIMETABLE"}</span><h1>{copy.title}</h1><div><strong>{copy.term}: {term.data.name}</strong><strong>{copy.dept}: {departmentName}</strong></div></header>
   {slots.length===0?<p className="lecture-print-empty">{copy.empty}</p>:
   <table className="lecture-print-grid"><thead><tr><th scope="col">{copy.time}</th>{weekdays.map(day=><th key={day.day} scope="col">{lang==="my"?["တနင်္လာ","အင်္ဂါ","ဗုဒ္ဓဟူး","ကြာသပတေး","သောကြာ","စနေ"][day.day-1]:day.label}</th>)}</tr></thead>
    <tbody>{slots.map(slot=>{
      const [start,end]=slot.split("|");
      return <tr key={slot}><th scope="row">{start}<span>–</span>{end}</th>{weekdays.map(day=>{
        const cellEntries=entries.filter(row=>row.day_of_week===day.day&&clock(row.start_time)===start&&clock(row.end_time)===end);
        const cellEvents=events.filter(row=>row.day_of_week===day.day&&clock(row.start_time)===start&&clock(row.end_time)===end);
        return <td key={day.day}>{cellEvents.map(row=><div className="lecture-print-event" key={row.id}><b>{row.title}</b>{row.notes&&<small>{row.notes}</small>}</div>)}
        {cellEntries.map(row=><div className="lecture-print-course" key={row.id}><b>{courseNames.get(row.course_id)||row.course_id}</b><span>{instructorNames.get(row.instructor_id)||copy.self}</span>{[row.class_group,row.room].filter(Boolean).length>0&&<small>{[row.class_group,row.room].filter(Boolean).join(" · ")}</small>}{row.notes&&<small>{row.notes}</small>}</div>)}</td>;
      })}</tr>;
    })}</tbody></table>}
   <footer>Myanmar Reformed Presbyterian School of Theology</footer>
  </article>}
 </main>;
}
