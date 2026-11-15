"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";

type Row={id:string;[key:string]:any};
const days=[{value:1,label:"MON"},{value:2,label:"TUE"},{value:3,label:"WED"},{value:4,label:"THU"},{value:5,label:"FRI"},{value:6,label:"SAT"}];
const periods=[{key:"morning",time:"05:30–07:00",label:"Morning Devotion"},{key:"early",time:"08:00–09:30"},{key:"chapel",time:"09:40–10:30"},{key:"mid",time:"10:30–12:00"},{key:"afternoon",time:"13:00–14:30"},{key:"clean",time:"14:40–16:10"},{key:"prayer",time:"18:30–19:00",label:"Prayer Time with Student President"},{key:"evening",time:"19:00–21:00"}];
const blank={day_of_week:"2",start_time:"08:00",end_time:"09:30",course_id:"",instructor_id:"",class_group:"First Year",room:"",notes:""};
export default function TimetableBuilder(){
 const db=useMemo(()=>createSupabaseBrowserClient(),[]);
 const [terms,setTerms]=useState<Row[]>([]),[departments,setDepartments]=useState<Row[]>([]),[courses,setCourses]=useState<Row[]>([]),[instructors,setInstructors]=useState<Row[]>([]),[entries,setEntries]=useState<Row[]>([]);
 const [termId,setTermId]=useState(""),[departmentId,setDepartmentId]=useState(""),[canManage,setCanManage]=useState(false),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [editing,setEditing]=useState(""),[form,setForm]=useState<any>(blank),[modal,setModal]=useState(false);
 const load=useCallback(async()=>{
  if(!db){setLoading(false);return;} setLoading(true);setError("");
  const {data:{user}}=await db.auth.getUser();
  if(user){const {data}=await db.from("user_roles").select("role").eq("user_id",user.id);setCanManage((data||[]).some(x=>["super_admin","administrator","academic_officer"].includes(x.role)));}
  const [t,d,c,i]=await Promise.all([
   db.from("academic_terms").select("*").order("academic_year",{ascending:false}),
   db.from("departments").select("*").eq("is_active",true).order("code"),
   db.from("academic_courses").select("*").eq("is_active",true).order("course_code"),
   db.from("academic_instructors").select("*").eq("is_active",true).order("full_name")
  ]);
  const errors=[t.error,d.error,c.error,i.error].filter(Boolean).map(x=>x!.message);
  if(errors.length){setError(errors.join(" · "));setLoading(false);return;}
  setTerms(t.data||[]);setDepartments(d.data||[]);setCourses(c.data||[]);setInstructors(i.data||[]);
  const nextTerm=termId||(t.data||[]).find(x=>x.term_code==="2026-2027-1")?.id||(t.data||[])[0]?.id||"";
  const nextDept=departmentId||(d.data||[]).find(x=>x.code==="ECE")?.id||(d.data||[])[0]?.id||"";
  setTermId(nextTerm);setDepartmentId(nextDept);
  if(nextTerm&&nextDept){
   const {data,error:e}=await db.from("academic_timetable_entries").select("*").eq("term_id",nextTerm).eq("department_id",nextDept).order("day_of_week").order("start_time").order("display_order");
   if(e)setError(e.message);else setEntries(data||[]);
  }else setEntries([]);
  setLoading(false);
 },[db,termId,departmentId]);
 useEffect(()=>{void load();},[load]);
 const selectedTerm=terms.find(x=>x.id===termId),selectedDepartment=departments.find(x=>x.id===departmentId);
 const deptCourses=courses.filter(x=>x.department_id===departmentId||x.department==="Theology"&&selectedDepartment?.code==="THEOLOGY"||x.department==="Early Childhood Education"&&selectedDepartment?.code==="ECE");
 const instructorLabel=(id:string)=>instructors.find(x=>x.id===id)?.full_name||"";
 const courseLabel=(id:string)=>courses.find(x=>x.id===id)?.title||"";
 const startEdit=(entry?:Row)=>{
  setEditing(entry?.id||"");
  setForm(entry?{day_of_week:String(entry.day_of_week),start_time:String(entry.start_time).slice(0,5),end_time:String(entry.end_time).slice(0,5),course_id:entry.course_id,instructor_id:entry.instructor_id||"",class_group:entry.class_group||"",room:entry.room||"",notes:entry.notes||""}:{...blank});
  setError("");setModal(true);
 };
 const save=async()=>{
  if(!db)return;setSaving(true);setError("");
  try{
   const {data:{user}}=await db.auth.getUser();
   const payload={term_id:termId,department_id:departmentId,course_id:form.course_id,instructor_id:form.instructor_id||null,day_of_week:Number(form.day_of_week),start_time:form.start_time,end_time:form.end_time,class_group:form.class_group.trim(),room:form.room.trim()||null,notes:form.notes.trim()||null,created_by:user?.id||null};
   const result=editing?await db.from("academic_timetable_entries").update(payload).eq("id",editing):await db.from("academic_timetable_entries").insert(payload);
   if(result.error)throw result.error;
   setModal(false);setNotice(editing?"시간표 항목을 수정했습니다.":"시간표 항목을 등록했습니다.");await load();
  }catch(e:any){setError(e.message||"시간표를 저장하지 못했습니다.");}finally{setSaving(false);}
 };
 const remove=async(id:string)=>{
  if(!db||!window.confirm("이 시간표 항목을 삭제할까요?"))return;
  const {error:e}=await db.from("academic_timetable_entries").delete().eq("id",id);
  if(e)setError(e.message);else{setNotice("시간표 항목을 삭제했습니다.");await load();}
 };
 const fixed=(period:string,day:number)=>{
  if(period==="morning")return day===6?"": "Morning Devotion";
  if(period==="early"){if(day===1)return "Bible Examination Preparation Time";if(day===6)return "Q.T. Check";}
  if(period==="chapel"){if(day===1)return "Bible Examination Preparation Time";if(day===6)return "Q.T. Check";return "Chapel";}
  if(period==="mid"&&day===1)return "Bible Examination Preparation Time";
  if(period==="afternoon"&&day===1)return "Bible Examination\\n(Daw Grace Moon)";
  if(period==="clean"){if([1,3,5].includes(day))return "Cleaning Time\\n(14:30–15:00)";if(day===2)return "Physical Education\\n(U Khin Tun)";if(day===4)return "Instrument Practice Time\\n(Thin Pwint Phyu, Simon, Hsal Takhe, Aung Htet Myat)";}
  if(period==="prayer")return "Prayer Time with Student President";
  if(period==="evening"&&day===4)return "Sermon Practice for all Students";
  return "";
 };
 const print=()=>window.print();
 const cellEntries=(period:string,day:number)=>{
  const ranges:Record<string,[string,string]>={early:["08:00","09:30"],mid:["10:30","12:00"],afternoon:["13:00","14:30"]};
  const range=ranges[period];if(!range)return [];
  return entries.filter(x=>x.day_of_week===day&&String(x.start_time).slice(0,5)===range[0]&&String(x.end_time).slice(0,5)===range[1]);
 };
 return <div className="timetable-workspace">
  <div className="timetable-heading"><div><span className="eyebrow">ACADEMIC TIMETABLE</span><h2>강의 시간표 편성</h2><p>과목과 담당 교수를 요일·시간·학년별로 배치하고 인쇄용 시간표를 만듭니다.</p></div><div className="timetable-actions"><button className="timetable-secondary" onClick={print}>PDF / 인쇄</button>{canManage&&<button className="timetable-primary" onClick={()=>startEdit()}>＋ 강의 배치</button>}</div></div>
  <div className="timetable-filters"><label>학기<select value={termId} onChange={e=>setTermId(e.target.value)}>{terms.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>학과<select value={departmentId} onChange={e=>setDepartmentId(e.target.value)}>{departments.map(x=><option key={x.id} value={x.id}>{x.name_ko||x.name_en||x.code}</option>)}</select></label></div>
  {error&&<div className="academics-alert error">{error}</div>}{notice&&<div className="academics-alert">{notice}</div>}
  <div className="timetable-paper">
   <header className="timetable-paper-title"><h1>MRPST LECTURE SCHEDULE ({selectedDepartment?.code==="ECE"?"E.C.E":"Theology"})</h1><strong>{selectedTerm?.name||"First Semester 2026/2027 School Year"}</strong><span>Bible writing with E or M (Choice) and QT in everyday (Check)</span></header>
   {loading?<p className="academics-empty">시간표를 불러오는 중입니다.</p>:<div className="timetable-scroll"><table className="timetable-grid"><thead><tr><th>TIME / DAY</th>{days.map(d=><th key={d.value}>{d.label}</th>)}</tr></thead><tbody>
    {periods.map(p=><tr key={p.key}><th className="timetable-time">{p.time}</th>{p.key==="morning"||p.key==="prayer"?<td colSpan={6} className="timetable-fixed">{p.label}</td>:days.map(d=>{
      const f=fixed(p.key,d.value),items=cellEntries(p.key,d.value);
      return <td key={d.value} className={f?"timetable-fixed-cell":""}>
       {f&&<div className={"timetable-fixed-label "+(f==="Chapel"?"chapel":"")}>{f}</div>}
       {items.map((x:Row)=><article className={"timetable-course "+(x.display_order%2?"blue":"pink")} key={x.id}>
        <strong>{courseLabel(x.course_id)}</strong><span>{instructorLabel(x.instructor_id)||"Self Study"}</span>{x.class_group&&<small>{x.class_group}</small>}
        {canManage&&<div className="timetable-entry-actions"><button onClick={()=>startEdit(x)}>수정</button><button onClick={()=>void remove(x.id)}>삭제</button></div>}
       </article>)}
       
      </td>;
    })}</tr>)}
   </tbody></table></div>}
   <footer className="timetable-paper-footer">{selectedTerm?.name||"First Semester 2026/2027 School Year"} · {selectedDepartment?.name_en||""}</footer>
  </div>
  {canManage&&<section className="timetable-course-library"><div><h3>등록된 과목 및 담당 교수</h3><p>시간표에 배치할 수 있는 학과 과목입니다. 과목·교수 정보는 과목 관리와 교수·강의 배정 탭에서 수정할 수 있습니다.</p></div><div className="timetable-course-list">{deptCourses.map(c=><article key={c.id}><strong>{c.title}</strong><span>{c.course_code}</span></article>)}</div></section>}
  {modal&&<div className="academics-modal-backdrop"><section className="academics-modal timetable-modal"><header><h3>{editing?"시간표 항목 수정":"시간표 항목 등록"}</h3><button onClick={()=>setModal(false)}>×</button></header><div className="academics-form-grid">
   <label>요일<select value={form.day_of_week} onChange={e=>setForm({...form,day_of_week:e.target.value})}>{days.map(d=><option key={d.value} value={d.value}>{({MON:"월요일",TUE:"화요일",WED:"수요일",THU:"목요일",FRI:"금요일",SAT:"토요일"} as any)[d.label]}</option>)}</select></label>
   <label>시간대<select value={form.start_time+"|"+form.end_time} onChange={e=>{const [start_time,end_time]=e.target.value.split("|");setForm({...form,start_time,end_time});}}><option value="08:00|09:30">08:00–09:30</option><option value="10:30|12:00">10:30–12:00</option><option value="13:00|14:30">13:00–14:30</option></select></label>
   <label>과목<select value={form.course_id} onChange={e=>setForm({...form,course_id:e.target.value})}><option value="">과목 선택</option>{deptCourses.map(c=><option key={c.id} value={c.id}>{c.course_code} · {c.title}</option>)}</select></label>
   <label>담당 교수<select value={form.instructor_id} onChange={e=>setForm({...form,instructor_id:e.target.value})}><option value="">담당 교수 미정 / 자율학습</option>{instructors.filter(i=>i.department_id===departmentId).map(i=><option key={i.id} value={i.id}>{i.full_name}</option>)}</select></label>
   <label>학년 / 반 구분<input value={form.class_group} onChange={e=>setForm({...form,class_group:e.target.value})} placeholder="예: First Year, Level 1, All Students"/></label>
   <label>강의실<input value={form.room} onChange={e=>setForm({...form,room:e.target.value})}/></label>
   <label className="full">비고<input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
  </div>{error&&<div className="academics-alert error">{error}</div>}<div className="academics-modal-actions"><button onClick={()=>setModal(false)}>취소</button><button className="academics-primary" disabled={saving||!form.course_id||!form.start_time||!form.end_time||form.end_time<=form.start_time} onClick={()=>void save()}>{saving?"저장 중…":"저장"}</button></div></section></div>}
 </div>;
}
