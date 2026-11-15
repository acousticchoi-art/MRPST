"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";

type Row={id:string;[key:string]:any};
const days=[{value:1,label:"MON"},{value:2,label:"TUE"},{value:3,label:"WED"},{value:4,label:"THU"},{value:5,label:"FRI"},{value:6,label:"SAT"}];
const blankCourse={day_of_week:"1",start_time:"08:00",end_time:"09:30",course_id:"",instructor_id:"",class_group:"",room:"",notes:""};
const blankEvent={day_of_week:"1",start_time:"07:00",end_time:"07:30",title:"",notes:""};
const time=(v:string)=>String(v||"").slice(0,5);
const dayName=(n:number)=>["","월요일","화요일","수요일","목요일","금요일","토요일"][n]||"";

export default function TimetableBuilder(){
 const db=useMemo(()=>createSupabaseBrowserClient(),[]);
 const [terms,setTerms]=useState<Row[]>([]),[departments,setDepartments]=useState<Row[]>([]),[courses,setCourses]=useState<Row[]>([]),[instructors,setInstructors]=useState<Row[]>([]);
 const [entries,setEntries]=useState<Row[]>([]),[events,setEvents]=useState<Row[]>([]);
 const [termId,setTermId]=useState(""),[departmentId,setDepartmentId]=useState(""),[canManage,setCanManage]=useState(false);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [editing,setEditing]=useState(""),[editingType,setEditingType]=useState<"course"|"event">("course");
 const [form,setForm]=useState<any>(blankCourse),[modal,setModal]=useState(false),[copyFrom,setCopyFrom]=useState("");

 const load=useCallback(async()=>{
  if(!db){setLoading(false);return;} setLoading(true);setError("");
  const {data:{user}}=await db.auth.getUser();
  if(user){const {data}=await db.from("user_roles").select("role").eq("user_id",user.id);setCanManage((data||[]).some(x=>["super_admin","administrator","academic_officer"].includes(x.role)));}
  const [t,d,c,i]=await Promise.all([
   db.from("academic_terms").select("*").order("academic_year",{ascending:false}).order("term_code",{ascending:false}),
   db.from("departments").select("*").eq("is_active",true).order("code"),
   db.from("academic_courses").select("*").eq("is_active",true).order("course_code"),
   db.from("academic_instructors").select("*").eq("is_active",true).order("full_name")
  ]);
  const errs=[t.error,d.error,c.error,i.error].filter(Boolean).map(x=>x!.message);
  if(errs.length){setError(errs.join(" · "));setLoading(false);return;}
  setTerms(t.data||[]);setDepartments(d.data||[]);setCourses(c.data||[]);setInstructors(i.data||[]);
  const nextTerm=termId||(t.data||[]).find(x=>x.status==="active")?.id||(t.data||[])[0]?.id||"";
  const nextDept=departmentId||(d.data||[]).find(x=>x.code==="ECE")?.id||(d.data||[])[0]?.id||"";
  setTermId(nextTerm);setDepartmentId(nextDept);
  if(nextTerm&&nextDept){
   const [a,b]=await Promise.all([
    db.from("academic_timetable_entries").select("*").eq("term_id",nextTerm).eq("department_id",nextDept).eq("is_active",true).order("day_of_week").order("start_time").order("display_order"),
    db.from("academic_timetable_events").select("*").eq("term_id",nextTerm).eq("department_id",nextDept).order("day_of_week").order("start_time").order("display_order")
   ]);
   if(a.error||b.error)setError([a.error?.message,b.error?.message].filter(Boolean).join(" · "));
   setEntries(a.data||[]);setEvents(b.data||[]);
  }else{setEntries([]);setEvents([]);}
  setLoading(false);
 },[db,termId,departmentId]);
 useEffect(()=>{void load();},[load]);
 const selectedTerm=terms.find(x=>x.id===termId),selectedDepartment=departments.find(x=>x.id===departmentId);
 const deptCourses=courses.filter(x=>x.department_id===departmentId||(x.department==="Theology"&&selectedDepartment?.code==="THEOLOGY")||(x.department==="Early Childhood Education"&&selectedDepartment?.code==="ECE"));
 const instructorLabel=(id:string)=>instructors.find(x=>x.id===id)?.full_name||"";
 const courseLabel=(id:string)=>courses.find(x=>x.id===id)?.title||"과목 정보 없음";
 const timeSlots=useMemo(()=>{
  const keys=new Map<string,{start:string,end:string}>();
  [...entries,...events].forEach(x=>{const start=time(x.start_time),end=time(x.end_time);if(start&&end)keys.set(start+"|"+end,{start,end});});
  return [...keys.values()].sort((a,b)=>a.start.localeCompare(b.start)||a.end.localeCompare(b.end));
 },[entries,events]);
 const startEdit=(entry?:Row,type:"course"|"event"="course")=>{
  setEditing(entry?.id||"");setEditingType(type);
  if(type==="event")setForm(entry?{day_of_week:String(entry.day_of_week),start_time:time(entry.start_time),end_time:time(entry.end_time),title:entry.title||"",notes:entry.notes||""}:{...blankEvent});
  else setForm(entry?{day_of_week:String(entry.day_of_week),start_time:time(entry.start_time),end_time:time(entry.end_time),course_id:entry.course_id,instructor_id:entry.instructor_id||"",class_group:entry.class_group||"",room:entry.room||"",notes:entry.notes||""}:{...blankCourse});
  setError("");setModal(true);
 };
 const save=async()=>{
  if(!db)return;setSaving(true);setError("");
  try{
   const {data:{user}}=await db.auth.getUser();
   const common={term_id:termId,department_id:departmentId,day_of_week:Number(form.day_of_week),start_time:form.start_time,end_time:form.end_time};
   let result:any;
   if(editingType==="event"){
    if(!form.title.trim())throw new Error("일정명을 입력해 주세요.");
    const payload={...common,title:form.title.trim(),notes:form.notes.trim()||null,created_by:user?.id||null};
    result=editing?await db.from("academic_timetable_events").update(payload).eq("id",editing):await db.from("academic_timetable_events").insert(payload);
   }else{
    if(!form.course_id)throw new Error("과목을 선택해 주세요.");
    const payload={...common,course_id:form.course_id,instructor_id:form.instructor_id||null,class_group:form.class_group.trim(),room:form.room.trim()||null,notes:form.notes.trim()||null,created_by:user?.id||null};
    result=editing?await db.from("academic_timetable_entries").update(payload).eq("id",editing):await db.from("academic_timetable_entries").insert(payload);
   }
   if(result.error)throw result.error;
   setModal(false);setNotice(editing?"시간표 항목을 수정했습니다.":"시간표 항목을 등록했습니다.");await load();
  }catch(e:any){setError(e.message||"저장하지 못했습니다.");}finally{setSaving(false);}
 };
 const remove=async(id:string,type:"course"|"event")=>{
  if(!db||!window.confirm("이 항목을 삭제할까요?"))return;
  const {error:e}=await db.from(type==="event"?"academic_timetable_events":"academic_timetable_entries").delete().eq("id",id);
  if(e)setError(e.message);else{setNotice("항목을 삭제했습니다.");await load();}
 };
 const copySchedule=async()=>{
  if(!db||!copyFrom||copyFrom===termId)return;
  if(!window.confirm("선택한 학기의 시간표를 현재 학기로 복사할까요? 현재 학기에 이미 등록된 항목은 유지되고, 기존 항목과 시간이 완전히 같은 복사 항목은 건너뜁니다."))return;
  setSaving(true);setError("");
  try{
   const {data:{user}}=await db.auth.getUser();
   if(!user)throw new Error("로그인이 필요합니다.");
   const [a,b]=await Promise.all([
    db.from("academic_timetable_entries").select("*").eq("term_id",copyFrom).eq("department_id",departmentId).eq("is_active",true),
    db.from("academic_timetable_events").select("*").eq("term_id",copyFrom).eq("department_id",departmentId)
   ]);
   if(a.error||b.error)throw a.error||b.error;
   const [currentA,currentB]=await Promise.all([
    db.from("academic_timetable_entries").select("day_of_week,start_time,end_time,course_id,class_group").eq("term_id",termId).eq("department_id",departmentId),
    db.from("academic_timetable_events").select("day_of_week,start_time,end_time,title").eq("term_id",termId).eq("department_id",departmentId)
   ]);
   if(currentA.error||currentB.error)throw currentA.error||currentB.error;
   const courseKeys=new Set((currentA.data||[]).map(x=>[x.day_of_week,time(x.start_time),time(x.end_time),x.course_id,x.class_group].join("|")));
   const eventKeys=new Set((currentB.data||[]).map(x=>[x.day_of_week,time(x.start_time),time(x.end_time),x.title].join("|")));
   const courseRows=(a.data||[]).filter(x=>!courseKeys.has([x.day_of_week,time(x.start_time),time(x.end_time),x.course_id,x.class_group].join("|"))).map(({id,created_at,updated_at,...x})=>({...x,term_id:termId,created_by:user.id}));
   const eventRows=(b.data||[]).filter(x=>!eventKeys.has([x.day_of_week,time(x.start_time),time(x.end_time),x.title].join("|"))).map(({id,created_at,updated_at,...x})=>({...x,term_id:termId,created_by:user.id}));
   if(courseRows.length){const {error:e}=await db.from("academic_timetable_entries").insert(courseRows);if(e)throw e;}
   if(eventRows.length){const {error:e}=await db.from("academic_timetable_events").insert(eventRows);if(e)throw e;}
   setNotice("이전 학기 시간표 복사가 완료되었습니다. 새 학기 일정에 맞게 자유롭게 수정하세요.");await load();
  }catch(e:any){setError(e.message||"시간표 복사에 실패했습니다.");}finally{setSaving(false);}
 };
 const print=()=>window.print();
 return <div className="timetable-workspace">
  <div className="timetable-heading"><div><span className="eyebrow">ACADEMIC TIMETABLE</span><h2>강의 시간표 편성</h2><p>학기마다 요일과 시간을 자유롭게 편성합니다. 이전 학기 시간표는 복사한 뒤 수정할 수 있습니다.</p></div><div className="timetable-actions"><button className="timetable-secondary" onClick={print}>PDF / 인쇄</button>{canManage&&<><button className="timetable-secondary" onClick={()=>startEdit(undefined,"event")}>＋ 공통 일정</button><button className="timetable-primary" onClick={()=>startEdit()}>＋ 강의 배치</button></>}</div></div>
  <div className="timetable-filters"><label>학기<select value={termId} onChange={e=>setTermId(e.target.value)}>{terms.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>학과<select value={departmentId} onChange={e=>setDepartmentId(e.target.value)}>{departments.map(x=><option key={x.id} value={x.id}>{x.name_ko||x.name_en||x.code}</option>)}</select></label></div>
  {canManage&&<div className="timetable-copy-row"><label>복사할 이전 학기<select value={copyFrom} onChange={e=>setCopyFrom(e.target.value)}><option value="">학기 선택</option>{terms.filter(x=>x.id!==termId).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><button className="timetable-secondary" disabled={!copyFrom||saving} onClick={()=>void copySchedule()}>선택 학기 시간표 복사</button></div>}
  {error&&<div className="academics-alert error">{error}</div>}{notice&&<div className="academics-alert">{notice}</div>}
  <div className="timetable-paper">
   <header className="timetable-paper-title"><h1>MRPST LECTURE SCHEDULE ({selectedDepartment?.code==="ECE"?"E.C.E":"Theology"})</h1><strong>{selectedTerm?.name||"학기를 선택해 주세요"}</strong><span>{selectedDepartment?.name_en||""}</span></header>
   {loading?<p className="academics-empty">시간표를 불러오는 중입니다.</p>:<div className="timetable-scroll"><table className="timetable-grid"><thead><tr><th>TIME / DAY</th>{days.map(d=><th key={d.value}>{d.label}</th>)}</tr></thead><tbody>
    {timeSlots.length===0?<tr><td colSpan={7} className="academics-empty">등록된 시간표가 없습니다. 강의 또는 공통 일정을 등록해 주세요.</td></tr>:timeSlots.map(slot=><tr key={slot.start+"|"+slot.end}><th className="timetable-time">{slot.start}–{slot.end}</th>{days.map(d=>{
      const items=entries.filter(x=>x.day_of_week===d.value&&time(x.start_time)===slot.start&&time(x.end_time)===slot.end);
      const dayEvents=events.filter(x=>x.day_of_week===d.value&&time(x.start_time)===slot.start&&time(x.end_time)===slot.end);
      return <td key={d.value}>
       {dayEvents.map((x:Row)=><article className="timetable-event" key={x.id}><strong>{x.title}</strong>{x.notes&&<small>{x.notes}</small>}{canManage&&<div className="timetable-entry-actions"><button onClick={()=>startEdit(x,"event")}>수정</button><button onClick={()=>void remove(x.id,"event")}>삭제</button></div>}</article>)}
       {items.map((x:Row)=><article className={"timetable-course "+(x.display_order%2?"blue":"pink")} key={x.id}><strong>{courseLabel(x.course_id)}</strong><span>{instructorLabel(x.instructor_id)||"Self Study"}</span>{x.class_group&&<small>{x.class_group}</small>}{x.room&&<small>{x.room}</small>}{canManage&&<div className="timetable-entry-actions"><button onClick={()=>startEdit(x,"course")}>수정</button><button onClick={()=>void remove(x.id,"course")}>삭제</button></div>}</article>)}
      </td>;
    })}</tr>)}
   </tbody></table></div>}
   <footer className="timetable-paper-footer">{selectedTerm?.name||""} · {selectedDepartment?.name_en||""}</footer>
  </div>
  {canManage&&<section className="timetable-course-library"><div><h3>등록된 과목 및 담당 교수</h3><p>과목과 교수 정보는 과목 관리와 교수·강의 배정 탭에서 관리합니다.</p></div><div className="timetable-course-list">{deptCourses.map(c=><article key={c.id}><strong>{c.title}</strong><span>{c.course_code}</span></article>)}</div></section>}
  {modal&&<div className="academics-modal-backdrop"><section className="academics-modal timetable-modal"><header><h3>{editing?(editingType==="event"?"공통 일정 수정":"강의 시간표 수정"):(editingType==="event"?"공통 일정 등록":"강의 시간표 등록")}</h3><button onClick={()=>setModal(false)}>×</button></header><div className="academics-form-grid">
   <label>요일<select value={form.day_of_week} onChange={e=>setForm({...form,day_of_week:e.target.value})}>{days.map(d=><option key={d.value} value={d.value}>{dayName(d.value)}</option>)}</select></label>
   <label>시작 시간<input type="time" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})}/></label>
   <label>종료 시간<input type="time" value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})}/></label>
   {editingType==="event"?<label className="full">일정명<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="예: Chapel, Morning Devotion, Cleaning"/></label>:<>
    <label className="full">과목<select value={form.course_id} onChange={e=>setForm({...form,course_id:e.target.value})}><option value="">과목 선택</option>{deptCourses.map(c=><option key={c.id} value={c.id}>{c.course_code} · {c.title}</option>)}</select></label>
    <label>담당 교수<select value={form.instructor_id} onChange={e=>setForm({...form,instructor_id:e.target.value})}><option value="">담당 교수 미정 / 자율학습</option>{instructors.filter(i=>i.department_id===departmentId).map(i=><option key={i.id} value={i.id}>{i.full_name}</option>)}</select></label>
    <label>학년 / 반<input value={form.class_group} onChange={e=>setForm({...form,class_group:e.target.value})} placeholder="예: First Year, All Students, Level 1"/></label>
    <label>강의실<input value={form.room} onChange={e=>setForm({...form,room:e.target.value})}/></label>
   </>}
   <label className="full">비고<input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
  </div>{error&&<div className="academics-alert error">{error}</div>}<div className="academics-modal-actions"><button onClick={()=>setModal(false)}>취소</button><button className="academics-primary" disabled={saving||!form.start_time||!form.end_time||form.end_time<=form.start_time||(editingType==="course"&&!form.course_id)||(editingType==="event"&&!form.title.trim())} onClick={()=>void save()}>{saving?"저장 중…":"저장"}</button></div></section></div>}
 </div>;
}
