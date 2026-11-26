"use client";
import {englishDisplay} from "@/lib/english-display";

import {useCallback,useEffect,useMemo,useState} from "react";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";
import {SearchSelect} from "./AdminUI";
import {usePathname} from "next/navigation";

type Row={id:string;[key:string]:any};
const days=[{value:1,label:"MON"},{value:2,label:"TUE"},{value:3,label:"WED"},{value:4,label:"THU"},{value:5,label:"FRI"},{value:6,label:"SAT"}];
const blankCourse={day_of_week:"1",start_time:"08:00",end_time:"09:30",course_id:"",instructor_id:"",class_group:"",room:"",notes:""};
const blankEvent={day_of_week:"1",start_time:"07:00",end_time:"07:30",title:"",notes:""};
const time=(v:string)=>String(v||"").slice(0,5);
const dayName=(n:number)=>["","월요일","화요일","수요일","목요일","금요일","토요일"][n]||"";
const groupKey=(v:any)=>String(v||"").trim().toLowerCase();
const groupsConflict=(a:any,b:any)=>{const x=groupKey(a),y=groupKey(b);return !x||!y||x==="all students"||y==="all students"||x===y;}
const escapeHtml=(v:any)=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]||ch));

export default function TimetableBuilder({canManage,mutationsEnabled}:{canManage:boolean;mutationsEnabled:boolean}){
 const englishUI=usePathname().startsWith("/en/");
 const db=useMemo(()=>createSupabaseBrowserClient(),[]);
 const pathname=usePathname();
 const locale=englishUI?"en":pathname.startsWith("/my/")?"my":"ko";
 const [terms,setTerms]=useState<Row[]>([]),[departments,setDepartments]=useState<Row[]>([]),[courses,setCourses]=useState<Row[]>([]),[instructors,setInstructors]=useState<Row[]>([]);
 const [entries,setEntries]=useState<Row[]>([]),[events,setEvents]=useState<Row[]>([]);
 const [termId,setTermId]=useState(""),[departmentId,setDepartmentId]=useState("");
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [editing,setEditing]=useState(""),[editingType,setEditingType]=useState<"course"|"event">("course");
 const [form,setForm]=useState<any>(blankCourse),[modal,setModal]=useState(false),[copyFrom,setCopyFrom]=useState("");
 const [dragged,setDragged]=useState<{entry:Row;type:"course"|"event"}|null>(null),[undoAction,setUndoAction]=useState<{entry:Row;type:"course"|"event"}|null>(null);

 const load=useCallback(async()=>{
  if(!db){setLoading(false);return;} setLoading(true);setError("");
  const [t,d,c,i]=await Promise.all([
   db.from("academic_terms").select("*").order("academic_year",{ascending:false}).order("term_code",{ascending:false}),
   db.from("departments").select("*").eq("is_active",true).order("code"),
   db.from("academic_courses").select("*").eq("is_active",true).order("course_code"),
   db.from("academic_instructors").select("*").eq("is_active",true).order("full_name")
  ]);
  const errs=[t.error,d.error,c.error,i.error].filter(Boolean).map(x=>x!.message);
  if(errs.length){setError(errs.join(" · "));setLoading(false);return;}
  setTerms(t.data||[]);setDepartments(d.data||[]);setCourses(c.data||[]);setInstructors(i.data||[]);
  const nextTerm=termId||(t.data||[]).find(x=>x.term_code==="2026-2027-1")?.id||(t.data||[]).find(x=>x.status==="active")?.id||(t.data||[])[0]?.id||"";
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
 const deptCourses=courses.filter(x=>x.course_kind==="general"||x.department_id===departmentId||(x.department==="Theology"&&selectedDepartment?.code==="THEOLOGY")||(x.department==="Early Childhood Education"&&selectedDepartment?.code==="ECE"));
 const instructorLabel=(id:string)=>instructors.find(x=>x.id===id)?.full_name||"";
 const courseLabel=(id:string)=>{const c=courses.find(x=>x.id===id);return (locale==="my"?(c?.title_my||c?.title):c?.title)||(englishUI?"Course information unavailable":"과목 정보 없음");};
 const timeSlots=useMemo(()=>{
  const keys=new Map<string,{start:string,end:string}>();
  [...entries,...events].forEach(x=>{const start=time(x.start_time),end=time(x.end_time);if(start&&end)keys.set(start+"|"+end,{start,end});});
  return [...keys.values()].sort((a,b)=>a.start.localeCompare(b.start)||a.end.localeCompare(b.end));
 },[entries,events]);
 const startEdit=(entry?:Partial<Row>,type:"course"|"event"="course")=>{
  setEditing(entry?.id||"");setEditingType(type);
  if(type==="event")setForm(entry?{day_of_week:String(entry.day_of_week),start_time:time(entry.start_time),end_time:time(entry.end_time),title:entry.title||"",notes:entry.notes||""}:{...blankEvent});
  else setForm(entry?{day_of_week:String(entry.day_of_week),start_time:time(entry.start_time),end_time:time(entry.end_time),course_id:entry.course_id,instructor_id:entry.instructor_id||"",class_group:entry.class_group||"",room:entry.room||"",notes:entry.notes||""}:{...blankCourse});
  setError("");setModal(true);
 };
 const save=async()=>{
  if(!db||!mutationsEnabled){setNotice((englishUI?"Academic data changes are available only after the development database is separated and the feature enabled.":"학사 데이터 변경은 개발 DB 분리 및 기능 활성화 후 사용할 수 있습니다."));return;}setSaving(true);setError("");
  try{
   const {data:{user},error:userError}=await db.auth.getUser();if(userError)throw userError;if(!user)throw new Error("로그인이 필요합니다.");
   const common={term_id:termId,department_id:departmentId,day_of_week:Number(form.day_of_week),start_time:form.start_time,end_time:form.end_time};
   const overlaps=(row:any)=>time(row.start_time)<time(form.end_time)&&time(row.end_time)>time(form.start_time);
   const [existingEntries,existingEvents]=await Promise.all([
    db.from("academic_timetable_entries").select("id,department_id,instructor_id,room,class_group,start_time,end_time").eq("term_id",termId).eq("day_of_week",Number(form.day_of_week)).eq("is_active",true),
    db.from("academic_timetable_events").select("id,start_time,end_time,title").eq("term_id",termId).eq("department_id",departmentId).eq("day_of_week",Number(form.day_of_week))
   ]);
   if(existingEntries.error||existingEvents.error)throw existingEntries.error||existingEvents.error;
   const entriesForDay=existingEntries.data||[],eventsForDay=existingEvents.data||[];
   if(editingType==="event"){
    
    if(eventsForDay.some(x=>x.id!==editing&&overlaps(x)))throw new Error("같은 학과의 다른 일정과 시간이 겹칩니다.");
   }else{
    if(entriesForDay.some(x=>x.id!==editing&&x.department_id===departmentId&&groupsConflict(x.class_group,form.class_group)&&overlaps(x)))throw new Error("같은 학과의 다른 강의와 시간이 겹칩니다.");
    
    if(form.instructor_id&&entriesForDay.some(x=>x.id!==editing&&x.instructor_id===form.instructor_id&&overlaps(x)))throw new Error("담당 교수가 같은 시간에 다른 강의를 맡고 있습니다.");
    if(form.room.trim()&&entriesForDay.some(x=>x.id!==editing&&String(x.room||"").trim()===form.room.trim()&&overlaps(x)))throw new Error("선택한 강의실이 같은 시간에 이미 사용 중입니다.");
   }
   let result:any;
   if(editingType==="event"){
    if(!form.title.trim())throw new Error("일정명을 입력해 주세요.");
    const payload={...common,title:form.title.trim(),notes:form.notes.trim()||null};
    result=editing?await db.from("academic_timetable_events").update(payload).eq("id",editing).select("id").single():await db.from("academic_timetable_events").insert({...payload,created_by:user.id}).select("id").single();
   }else{
    if(!form.course_id)throw new Error("과목을 선택해 주세요.");if(!form.class_group.trim())throw new Error("학년 / 반을 입력해 주세요.");
    const payload={...common,course_id:form.course_id,instructor_id:form.instructor_id||null,class_group:form.class_group.trim(),room:form.room.trim()||null,notes:form.notes.trim()||null};
    result=editing?await db.from("academic_timetable_entries").update(payload).eq("id",editing).select("id").single():await db.from("academic_timetable_entries").insert({...payload,created_by:user.id}).select("id").single();
   }
   if(result.error)throw result.error;
   if(!result.data?.id||(editing&&result.data.id!==editing))throw new Error("저장된 시간표 항목을 확인할 수 없습니다.");
   setModal(false);setNotice(editing?"시간표 항목을 수정했습니다.":"시간표 항목을 등록했습니다.");await load();
  }catch(e:any){setError(e.message||"저장하지 못했습니다.");}finally{setSaving(false);}
 };
 const remove=async(id:string,type:"course"|"event")=>{
  if(!db||!mutationsEnabled){setNotice((englishUI?"Academic data changes are available only after the development database is separated and the feature enabled.":"학사 데이터 변경은 개발 DB 분리 및 기능 활성화 후 사용할 수 있습니다."));return;}if(!window.confirm(englishUI?"Delete this item?":locale==="my"?"ဤအချက်အလက်ကို ဖျက်မလား။":"이 항목을 삭제할까요?"))return;
  const {data:deleted,error:e}=await db.from(type==="event"?"academic_timetable_events":"academic_timetable_entries").delete().eq("id",id).select("id").maybeSingle();
  if(e)setError(e.message);else if(!deleted?.id||deleted.id!==id)setError((englishUI?"Unable to verify deleted timetable entry.":"삭제된 시간표 항목을 확인할 수 없습니다."));else{setNotice((englishUI?"Item deleted.":"항목을 삭제했습니다."));await load();}
 };
 const moveEntry=async(targetDay:number,targetStart:string,targetEnd:string)=>{
  if(!db||!dragged||!mutationsEnabled)return;
  const original=dragged.entry;if(original.day_of_week===targetDay&&time(original.start_time)===targetStart&&time(original.end_time)===targetEnd){setDragged(null);return;}
  setSaving(true);setError("");
  try{
   const table=dragged.type==="course"?"academic_timetable_entries":"academic_timetable_events";
   const overlaps=(row:any)=>row.day_of_week===targetDay&&time(row.start_time)<targetEnd&&time(row.end_time)>targetStart;
   if(dragged.type==="course"){
    if(entries.some(x=>x.id!==original.id&&overlaps(x)&&((x.department_id===departmentId&&groupsConflict(x.class_group,original.class_group))||(original.instructor_id&&x.instructor_id===original.instructor_id)||(original.room&&String(x.room||"").trim()===String(original.room).trim()))))throw new Error("옮길 위치에 학과 수업, 담당 교수 또는 강의실 시간이 겹칩니다.");
    if(events.some(x=>overlaps(x)))throw new Error("옮길 위치에 공통 일정이 있습니다.");
   }else if(events.some(x=>x.id!==original.id&&overlaps(x))||entries.some(x=>x.department_id===departmentId&&overlaps(x)))throw new Error("옮길 위치에 이미 일정 또는 수업이 있습니다.");
   const {data:updated,error:moveError}=await db.from(table).update({day_of_week:targetDay,start_time:targetStart,end_time:targetEnd}).eq("id",original.id).select("id,day_of_week,start_time,end_time").single();
   if(moveError)throw moveError;
   if(!updated||updated.id!==original.id)throw new Error("시간표 이동 결과를 확인할 수 없습니다.");
   setUndoAction({entry:original,type:dragged.type});setNotice((englishUI?"Timetable entry moved. Select Undo if this was a mistake.":"시간표를 옮겼습니다. 실수였다면 ‘작업 취소’를 누르세요."));await load();
  }catch(e:any){setError(e.message||"시간표를 옮기지 못했습니다.");}finally{setDragged(null);setSaving(false);}
 };
 const undoLastAction=async()=>{
  if(!db||!undoAction||!mutationsEnabled)return;setSaving(true);setError("");
  try{const table=undoAction.type==="course"?"academic_timetable_entries":"academic_timetable_events";const original=undoAction.entry;const {data:restored,error:undoError}=await db.from(table).update({day_of_week:original.day_of_week,start_time:original.start_time,end_time:original.end_time}).eq("id",original.id).select("id").single();if(undoError)throw undoError;if(restored?.id!==original.id)throw new Error("되돌린 시간표 항목을 확인할 수 없습니다.");setUndoAction(null);setNotice((englishUI?"The last timetable move was undone.":"직전 시간표 이동을 되돌렸습니다."));await load();}catch(e:any){setError(e.message||"작업을 되돌리지 못했습니다.");}finally{setSaving(false);}
 };
 const copySchedule=async()=>{
  if(!db||!mutationsEnabled){setNotice((englishUI?"Academic data changes are available only after the development database is separated and the feature enabled.":"학사 데이터 변경은 개발 DB 분리 및 기능 활성화 후 사용할 수 있습니다."));return;}if(!copyFrom||copyFrom===termId)return;
  if(!window.confirm(englishUI?"Copy the selected semester's timetable to the current semester? Existing entries will be retained, and copies with identical times to existing entries will be skipped.":locale==="my"?"ရွေးထားသော စာသင်ကာလ၏ အချိန်ဇယားကို လက်ရှိစာသင်ကာလသို့ ကူးယူမလား။ ရှိပြီးသား အချက်အလက်များကို ထိန်းသိမ်းထားပါမည်။":"선택한 학기의 시간표를 현재 학기로 복사할까요? 현재 학기에 이미 등록된 항목은 유지되고, 기존 항목과 시간이 완전히 같은 복사 항목은 건너뜁니다."))return;
  setSaving(true);setError("");
  try{
   const {data:{user},error:userError}=await db.auth.getUser();
   if(userError)throw userError;
   if(!user)throw new Error("로그인이 필요합니다.");
   const [a,b]=await Promise.all([
    db.from("academic_timetable_entries").select("*").eq("term_id",copyFrom).eq("department_id",departmentId).eq("is_active",true),
    db.from("academic_timetable_events").select("*").eq("term_id",copyFrom).eq("department_id",departmentId)
   ]);
   if(a.error||b.error)throw a.error||b.error;
   const [currentA,currentB]=await Promise.all([
    db.from("academic_timetable_entries").select("day_of_week,start_time,end_time,course_id,class_group,department_id,instructor_id,room").eq("term_id",termId).eq("is_active",true),
    db.from("academic_timetable_events").select("day_of_week,start_time,end_time,title").eq("term_id",termId).eq("department_id",departmentId)
   ]);
   if(currentA.error||currentB.error)throw currentA.error||currentB.error;
   const overlaps=(x:any,y:any)=>x.day_of_week===y.day_of_week&&time(x.start_time)<time(y.end_time)&&time(x.end_time)>time(y.start_time);
   const courseKey=(x:any)=>[x.day_of_week,time(x.start_time),time(x.end_time),x.course_id,x.class_group].join("|");
   const eventKey=(x:any)=>[x.day_of_week,time(x.start_time),time(x.end_time),x.title].join("|");
   const existingCourses=currentA.data||[],existingEvents=currentB.data||[];
   const courseKeys=new Set(existingCourses.filter(x=>x.department_id===departmentId).map(courseKey));
   const eventKeys=new Set(existingEvents.map(eventKey));
   const courseRows=(a.data||[]).filter(x=>!courseKeys.has(courseKey(x))).map(({id,created_at,updated_at,...x})=>({...x,term_id:termId,created_by:user.id}));
   const eventRows=(b.data||[]).filter(x=>!eventKeys.has(eventKey(x))).map(({id,created_at,updated_at,...x})=>({...x,term_id:termId,created_by:user.id}));
   // Validate all copied rows against target timetable and each other before inserting anything.
   const acceptedCourses:any[]=[];
   for(const row of courseRows){
    if(existingEvents.some(x=>overlaps(row,x)))throw new Error("시간표 복사 중단: 복사할 강의가 현재 학기의 공통 일정과 겹칩니다.");
    if(existingCourses.some(x=>overlaps(row,x)&&((x.department_id===departmentId&&groupsConflict(x.class_group,row.class_group))||!!row.instructor_id&&x.instructor_id===row.instructor_id||!!row.room&&String(x.room||"").trim()===String(row.room||"").trim())))throw new Error("시간표 복사 중단: 학과 강의, 담당 교수 또는 강의실 시간 충돌이 발견되었습니다.");
    if(acceptedCourses.some(x=>overlaps(row,x)&&((x.department_id===departmentId&&groupsConflict(x.class_group,row.class_group))||!!row.instructor_id&&x.instructor_id===row.instructor_id||!!row.room&&String(x.room||"").trim()===String(row.room||"").trim())))throw new Error("시간표 복사 중단: 복사되는 강의들끼리 시간 충돌이 발견되었습니다.");
    acceptedCourses.push(row);
   }
   const acceptedEvents:any[]=[];
   for(const row of eventRows){
    if(existingEvents.some(x=>overlaps(row,x)))throw new Error("시간표 복사 중단: 기존 공통 일정과 시간이 겹칩니다.");
    if(existingCourses.some(x=>x.department_id===departmentId&&overlaps(row,x))||acceptedCourses.some(x=>x.department_id===departmentId&&overlaps(row,x)))throw new Error("시간표 복사 중단: 공통 일정과 강의 시간이 겹칩니다.");
    if(acceptedEvents.some(x=>overlaps(row,x)))throw new Error("시간표 복사 중단: 복사되는 공통 일정끼리 시간이 겹칩니다.");
    acceptedEvents.push(row);
   }
   if(courseRows.length){const {data:savedCourses,error:e}=await db.from("academic_timetable_entries").insert(courseRows).select("id");if(e)throw e;if((savedCourses||[]).length!==courseRows.length)throw new Error("복사한 강의 시간표 저장 개수가 일치하지 않습니다.");}
   if(eventRows.length){const {data:savedEvents,error:e}=await db.from("academic_timetable_events").insert(eventRows).select("id");if(e)throw e;if((savedEvents||[]).length!==eventRows.length)throw new Error("복사한 공통 일정 저장 개수가 일치하지 않습니다.");}
   setNotice((englishUI?"Previous semester's timetable copied. Edit it to suit the new semester.":"이전 학기 시간표 복사가 완료되었습니다. 새 학기 일정에 맞게 자유롭게 수정하세요."));await load();
  }catch(e:any){setError(e.message||"시간표 복사에 실패했습니다.");}finally{setSaving(false);}
 };
 return <div className="timetable-workspace">
  <div className="timetable-heading"><div><span className="eyebrow">ACADEMIC TIMETABLE</span><h2>{(englishUI?"Class timetable planning":"강의 시간표 편성")}</h2><p>{(englishUI?"Select a cell to add a class, or drag an existing class to another cell.":"칸을 눌러 새 수업을 넣고, 등록된 수업을 다른 칸으로 끌어 옮길 수 있습니다.")}</p></div><div className="timetable-actions"><a className="timetable-secondary timetable-print-link" href={`/${locale}/admin/academics/timetable/print?term=${encodeURIComponent(termId)}&department=${encodeURIComponent(departmentId)}`} target="_blank" rel="noopener noreferrer" aria-disabled={!termId||!departmentId||loading} onClick={event=>{if(!termId||!departmentId||loading)event.preventDefault();}}>{(englishUI?"PDF / Print":"PDF / 인쇄")}</a>{canManage&&mutationsEnabled&&<><button className="timetable-secondary" disabled={!undoAction||saving} onClick={()=>void undoLastAction()}>{(englishUI?"Undo":"작업 취소")}</button><button className="timetable-secondary" onClick={()=>startEdit(undefined,"event")}>{(englishUI?"＋ Shared event":"＋ 공통 일정")}</button><button className="timetable-primary" onClick={()=>startEdit()}>{(englishUI?"＋ Schedule class":"＋ 강의 배치")}</button></>}</div></div>
  <div className="timetable-filters"><label>{(englishUI?"Semester":"학기")}<select value={termId} onChange={e=>setTermId(e.target.value)}>{terms.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>{(englishUI?"Department":"학과")}<SearchSelect value={departmentId} placeholder={(englishUI?"Search departments":"학과 검색")} searchPlaceholder={(englishUI?"Search by department name or code":"학과명 또는 코드 검색")} options={departments.map(x=>({value:x.id,label:englishUI?(x.name_en||x.name_ko||x.code):locale==="my"?(x.name_my||x.name_en||x.name_ko||x.code):(x.name_ko||x.name_en||x.code),keywords:`${x.code} ${x.name_ko||""} ${x.name_en||""} ${x.name_my||""}`}))} onChange={setDepartmentId}/></label></div>
  {canManage&&mutationsEnabled&&<div className="timetable-copy-row"><label>{(englishUI?"Previous semester to copy":"복사할 이전 학기")}<select value={copyFrom} onChange={e=>setCopyFrom(e.target.value)}><option value="">{(englishUI?"Select semester":"학기 선택")}</option>{terms.filter(x=>x.id!==termId).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><button className="timetable-secondary" disabled={!copyFrom||saving} onClick={()=>void copySchedule()}>{(englishUI?"Copy selected semester's timetable":"선택 학기 시간표 복사")}</button></div>}
  {!mutationsEnabled&&<div className="academics-alert">{(englishUI?"Academic data changes are locked until the development database is separated and safety verified. Currently read-only.":"학사 데이터 변경 기능은 개발 DB 분리 및 안전성 검증 전까지 잠겨 있습니다. 현재는 조회만 가능합니다.")}</div>}
{error&&<div className="academics-alert error">{englishUI?englishDisplay(error):error}</div>}{notice&&<div className="academics-alert">{englishUI?englishDisplay(notice):notice}</div>}
  <div className="timetable-paper">
   <header className="timetable-paper-title"><h1>MRPST LECTURE SCHEDULE ({selectedDepartment?.code==="ECE"?"E.C.E":"Theology"})</h1><strong>{selectedTerm?.name||(englishUI?"Select a semester":"학기를 선택해 주세요")}</strong><span>{selectedDepartment?.name_en||""}</span></header>
   {loading?<p className="academics-empty">{(englishUI?"Loading timetable.":"시간표를 불러오는 중입니다.")}</p>:<div className="timetable-scroll"><table className="timetable-grid"><thead><tr><th>TIME / DAY</th>{days.map(d=><th key={d.value}>{d.label}</th>)}</tr></thead><tbody>
    {timeSlots.length===0?<tr><td colSpan={7} className="academics-empty">{(englishUI?"No timetable entries. Register a class or shared event.":"등록된 시간표가 없습니다. 강의 또는 공통 일정을 등록해 주세요.")}</td></tr>:timeSlots.map(slot=><tr key={slot.start+"|"+slot.end}><th className="timetable-time">{slot.start}–{slot.end}</th>{days.map(d=>{
      const items=entries.filter(x=>x.day_of_week===d.value&&time(x.start_time)===slot.start&&time(x.end_time)===slot.end);
      const dayEvents=events.filter(x=>x.day_of_week===d.value&&time(x.start_time)===slot.start&&time(x.end_time)===slot.end);
      return <td key={d.value} className="timetable-drop-zone" onClick={()=>canManage&&mutationsEnabled&&!dragged&&startEdit({day_of_week:d.value,start_time:slot.start,end_time:slot.end},"course")} onDragOver={e=>{if(canManage&&mutationsEnabled)e.preventDefault();}} onDrop={e=>{e.preventDefault();void moveEntry(d.value,slot.start,slot.end);}}>
       {dayEvents.map((x:Row)=><article className="timetable-event" key={x.id} draggable={canManage&&mutationsEnabled} onDragStart={e=>{e.stopPropagation();setDragged({entry:x,type:"event"});}} onClick={e=>{e.stopPropagation();startEdit(x,"event");}}><strong>{x.title}</strong>{x.notes&&<small>{x.notes}</small>}{canManage&&<div className="timetable-entry-actions"><button onClick={e=>{e.stopPropagation();startEdit(x,"event");}}>{(englishUI?"Edit":"수정")}</button><button onClick={e=>{e.stopPropagation();void remove(x.id,"event");}}>{(englishUI?"Delete":"삭제")}</button></div>}</article>)}
       {items.map((x:Row)=><article className={"timetable-course "+(x.display_order%2?"blue":"pink")} key={x.id} draggable={canManage&&mutationsEnabled} onDragStart={e=>{e.stopPropagation();setDragged({entry:x,type:"course"});}} onClick={e=>{e.stopPropagation();startEdit(x,"course");}}><strong>{courseLabel(x.course_id)}</strong><span>{instructorLabel(x.instructor_id)||"Self Study"}</span>{x.class_group&&<small>{x.class_group}</small>}{x.room&&<small>{x.room}</small>}{canManage&&<div className="timetable-entry-actions"><button onClick={e=>{e.stopPropagation();startEdit(x,"course");}}>{(englishUI?"Edit":"수정")}</button><button onClick={e=>{e.stopPropagation();void remove(x.id,"course");}}>{(englishUI?"Delete":"삭제")}</button></div>}</article>)}
      </td>;
    })}</tr>)}
   </tbody></table></div>}
   <footer className="timetable-paper-footer">{selectedTerm?.name||""} · {selectedDepartment?.name_en||""}</footer>
  </div>
  {canManage&&<section className="timetable-course-library"><div><h3>{(englishUI?"Registered courses and assigned instructors":"등록된 과목 및 담당 교수")}</h3><p>{(englishUI?"Manage course and instructor information in the Courses and Faculty & Teaching Assignments tabs.":"과목과 교수 정보는 과목 관리와 교수·강의 배정 탭에서 관리합니다.")}</p></div><div className="timetable-course-list">{deptCourses.map(c=><article key={c.id}><strong>{locale==="my"?(c.title_my||c.title):c.title}</strong><span>{c.course_code}</span></article>)}</div></section>}
  {modal&&<div className="academics-modal-backdrop"><section className="academics-modal timetable-modal"><header><h3>{editing?(editingType==="event"?(englishUI?"Edit shared event":"공통 일정 수정"):(englishUI?"Edit class timetable":"강의 시간표 수정")):(editingType==="event"?(englishUI?"Add shared event":"공통 일정 등록"):(englishUI?"Add class timetable":"강의 시간표 등록"))}</h3><button onClick={()=>setModal(false)}>×</button></header><div className="academics-form-grid">
   <label>{(englishUI?"Day of week":"요일")}<select value={form.day_of_week} onChange={e=>setForm({...form,day_of_week:e.target.value})}>{days.map(d=><option key={d.value} value={d.value}>{englishUI?["","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.value]:dayName(d.value)}</option>)}</select></label>
   <label>{(englishUI?"Start time":"시작 시간")}<input type="time" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})}/></label>
   <label>{(englishUI?"End time":"종료 시간")}<input type="time" value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})}/></label>
   {editingType==="event"?<label className="full">{(englishUI?"Event name":"일정명")}<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder={(englishUI?"e.g. Chapel, Morning Devotion, Cleaning":"예: Chapel, Morning Devotion, Cleaning")}/></label>:<>
    <label className="full">{(englishUI?"Course":"과목")}<SearchSelect value={form.course_id} placeholder={(englishUI?"Search courses":"과목 검색")} searchPlaceholder={(englishUI?"Search by course code or name":"과목 코드 또는 이름 검색")} options={deptCourses.map(c=>({value:c.id,label:`${c.course_code} · ${locale==="my"?(c.title_my||c.title):c.title}`,keywords:`${c.course_code} ${c.title}`}))} onChange={id=>setForm({...form,course_id:id})}/></label>
    <label>{(englishUI?"Assigned instructor":"담당 교수")}<SearchSelect value={form.instructor_id} placeholder={(englishUI?"Search instructor (optional)":"교수 검색 (미정 가능)")} searchPlaceholder={(englishUI?"Search by instructor name or position":"교수명·직위 검색")} options={instructors.map(i=>({value:i.id,label:i.full_name,keywords:`${i.full_name} ${i.title||""}`}))} onChange={id=>setForm({...form,instructor_id:id})}/></label>
    <label>{(englishUI?"Year / class":"학년 / 반")}<input value={form.class_group} onChange={e=>setForm({...form,class_group:e.target.value})} placeholder={(englishUI?"e.g. First Year, All Students, Level 1":"예: First Year, All Students, Level 1")}/></label>
    <label>{(englishUI?"Classroom":"강의실")}<input value={form.room} onChange={e=>setForm({...form,room:e.target.value})}/></label>
   </>}
   <label className="full">{(englishUI?"Notes":"비고")}<input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
  </div>{error&&<div className="academics-alert error">{englishUI?englishDisplay(error):error}</div>}<div className="academics-modal-actions"><button onClick={()=>setModal(false)}>{(englishUI?"Cancel":"취소")}</button><button className="academics-primary" disabled={saving||!form.start_time||!form.end_time||form.end_time<=form.start_time||(editingType==="course"&&(!form.course_id||!form.class_group.trim()))||(editingType==="event"&&!form.title.trim())} onClick={()=>void save()}>{saving?"저장 중…":"저장"}</button></div></section></div>}
 </div>;
}
