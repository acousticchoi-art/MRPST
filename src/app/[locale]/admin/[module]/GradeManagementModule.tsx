"use client";
import {englishDisplay} from "@/lib/english-display";
import {allRows} from "@/lib/complete-rows";

import {useCallback,useEffect,useMemo,useState} from "react";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";
import {SearchSelect} from "./AdminUI";
import {usePathname} from "next/navigation";
import styles from "./GradeManagementModule.module.css";

type Department={id:string;code:string;name_en:string;name_ko:string|null;name_my:string|null};
type Term={id:string;term_code:string;name:string;academic_year:number;status:string};
type Student={id:string;student_number:string;full_name:string;program_code:string|null;cohort:string|null;student_status:string};
type Course={id:string;course_code:string;title:string;title_my:string|null;department_id:string|null;level:string|null;is_active:boolean};
type Enrollment={student_id:string;course_id:string;term_id:string;enrollment_status:string};
type Grade={id:string;student_id:string;course_id:string;term_id:string;score:number|null;grade:string|null;remarks:string|null;updated_at:string;entered_by:string|null};

const csvCell=(value:unknown)=>'"'+String(value??"").replace(/"/g,'""')+'"';
const htmlCell=(value:unknown)=>String(value??"").replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[character]||character));

export default function GradeManagementModule({canManage,initialTermId,onTermChange}:{canManage:boolean;initialTermId?:string;onTermChange?:(id:string)=>void}){
 const englishUI=usePathname().startsWith("/en/");
 const pathname=usePathname();
 const locale=pathname.startsWith("/en/")?"en":pathname.startsWith("/my/")?"my":"ko";
 const db=useMemo(()=>createSupabaseBrowserClient(),[]); const academicMutationsEnabled=process.env.NEXT_PUBLIC_MRPST_ACADEMIC_MUTATIONS_ENABLED!=="false";
 const [departments,setDepartments]=useState<Department[]>([]);
 const [terms,setTerms]=useState<Term[]>([]);
 const [students,setStudents]=useState<Student[]>([]);
 const [courses,setCourses]=useState<Course[]>([]);
 const [grades,setGrades]=useState<Grade[]>([]);
 const [enrollments,setEnrollments]=useState<Enrollment[]>([]);
 const [termId,setTermId]=useState(initialTermId??"");
 const [departmentId,setDepartmentId]=useState("");
 const [level,setLevel]=useState("");
 const [courseId,setCourseId]=useState("");
 const [tab,setTab]=useState<"lookup"|"entry">("entry");
 const [search,setSearch]=useState("");
 const [selectedStudentId,setSelectedStudentId]=useState("");
 const [inputValues,setInputValues]=useState<Record<string,string>>({});
 const [currentUserId,setCurrentUserId]=useState("");
 const [loading,setLoading]=useState(true);
 const [termLoading,setTermLoading]=useState(true);
 const [termRefreshKey,setTermRefreshKey]=useState(0);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");

 const load=useCallback(async()=>{
  if(!db){setLoading(false);return;}
  setLoading(true);setError("");
  try{
   const {data:{user}}=await db.auth.getUser();
   if(!user){setCurrentUserId("");setError((englishUI?"Login required.":"로그인이 필요합니다."));setLoading(false);return;}
   setCurrentUserId(user.id);
   const [d,t,s,c]=await Promise.all([
    db.from("departments").select("id,code,name_en,name_ko,name_my").eq("is_active",true).order("code"),
    db.from("academic_terms").select("id,term_code,name,academic_year,status").order("academic_year",{ascending:false}).order("term_code",{ascending:false}),
    db.from("students").select("id,student_number,full_name,program_code,cohort,student_status").order("full_name"),
    db.from("academic_courses").select("id,course_code,title,title_my,department_id,level,is_active").order("course_code")
   ]);
   const errors=[d.error,t.error,s.error,c.error].filter(Boolean).map((x:any)=>typeof x==="string"?x:x.message);
   if(errors.length)throw new Error(errors.join(" · "));
   const nextTerms=(t.data??[]) as Term[];
   const nextDepartments=(d.data??[]) as Department[];
   setDepartments(nextDepartments);setTerms(nextTerms);setStudents((s.data??[]) as Student[]);setCourses((c.data??[]) as Course[]);
   if(!nextTerms.length)setTermLoading(false);

   
  }catch(err:any){setError(err?.message||"성적 데이터를 불러오지 못했습니다.");}
  finally{setLoading(false);}
 },[db,englishUI]);

 useEffect(()=>{void load();},[load]);
 useEffect(()=>{if(!termId&&terms.length){const nextId=(terms.find(x=>x.status==="active")??terms[0]).id;setTermId(nextId);onTermChange?.(nextId);}},[termId,terms,onTermChange]);
 useEffect(()=>{
  let active=true;
  if(!db||!termId){setGrades([]);setEnrollments([]);setTermLoading(false);return;}
  const loadSelectedTerm=async()=>{
   setTermLoading(true);setError("");
   try{
    const [g,e]=await Promise.all([
     allRows((start,end)=>db.from("academic_grades").select("id,student_id,course_id,term_id,score,grade,remarks,updated_at,entered_by",{count:"exact"}).eq("term_id",termId).order("updated_at",{ascending:false}).order("id").range(start,end),1000),
     allRows((start,end)=>db.from("academic_enrollments").select("id,student_id,course_id,term_id,enrollment_status",{count:"exact"}).eq("term_id",termId).order("id").range(start,end),1000)
    ]);
    const errors=[g.error,e.error].filter(Boolean);
    if(errors.length)throw new Error(errors.join(" · "));
    if(active){setGrades((g.data??[]) as Grade[]);setEnrollments((e.data??[]) as Enrollment[]);}
   }catch(err:any){if(active)setError(err?.message||"선택한 학기의 성적 데이터를 불러오지 못했습니다.");}
   finally{if(active)setTermLoading(false);}
  };
  void loadSelectedTerm();
  return ()=>{active=false;};
 },[db,termId,termRefreshKey]);

 const displayCourse=(c:Course)=>locale==="my"?(c.title_my||c.title):c.title;
 const department=departments.find(x=>x.id===departmentId);
 const programCode=departmentId?(department?.code?.toUpperCase().includes("ECE")?"ece":"theology"):null;
 const levels=useMemo(()=>Array.from(new Set([
  ...courses.filter(x=>!departmentId||x.department_id===departmentId).map(x=>x.level),
  ...students.filter(x=>!programCode||x.program_code===programCode).map(x=>x.cohort)
 ].filter((x):x is string=>Boolean(x)))).sort((a,b)=>a.localeCompare(b)),[courses,students,departmentId,programCode]);
 useEffect(()=>{if(level&&!levels.includes(level))setLevel("");},[levels,level]);
 const visibleCourses=useMemo(()=>courses.filter(x=>(!departmentId||x.department_id===departmentId)&&(!level||x.level===level||x.level==="All Levels")),[courses,departmentId,level]);
 const entryCourses=useMemo(()=>visibleCourses.filter(x=>x.is_active),[visibleCourses]);
 useEffect(()=>{if(!entryCourses.some(x=>x.id===courseId))setCourseId(entryCourses[0]?.id??"");},[entryCourses,courseId]);
 const visibleStudents=useMemo(()=>students.filter(x=>(!programCode||x.program_code===programCode)&&(!level||x.cohort===level)&&(!search.trim()||x.full_name.toLowerCase().includes(search.toLowerCase())||x.student_number.toLowerCase().includes(search.toLowerCase()))).sort((a,b)=>Number.isFinite(Number(a.student_number))&&Number.isFinite(Number(b.student_number))?Number(a.student_number)-Number(b.student_number):a.student_number.localeCompare(b.student_number)),[students,programCode,level,search]);
 const termGrades=useMemo(()=>grades.filter(x=>x.term_id===termId),[grades,termId]);
 const gradeByKey=useMemo(()=>new Map(termGrades.map(x=>[x.student_id+"|"+x.course_id,x])),[termGrades]);
 const selectedStudent=students.find(x=>x.id===selectedStudentId);
 const studentCourses=visibleCourses.filter(course=>enrollments.some(e=>e.student_id===selectedStudentId&&e.course_id===course.id&&e.term_id===termId&&["enrolled","completed"].includes(e.enrollment_status))).map(course=>({course,grade:gradeByKey.get(selectedStudentId+"|"+course.id)}));
 const entryStudents=useMemo(()=>visibleStudents.filter(student=>student.student_status==="active"),[visibleStudents]);
 const inputStudents=useMemo(()=>{
  if(!courseId||!termId)return [];
  const selectedCourse=entryCourses.find(course=>course.id===courseId);
  if(!selectedCourse)return [];
  const courseDepartment=departments.find(department=>department.id===selectedCourse.department_id);
  const expectedProgram=courseDepartment?.code?.toLowerCase()==="ece"?"ece":courseDepartment?.code?.toLowerCase()==="theology"?"theology":null;
  return entryStudents.filter(student=>{
    if(expectedProgram&&student.program_code!==expectedProgram)return false;
    if(selectedCourse.level&&selectedCourse.level!=="All Levels"&&student.cohort!==selectedCourse.level)return false;
    const registration=enrollments.find(e=>e.student_id===student.id&&e.course_id===courseId&&e.term_id===termId);
    return registration?.enrollment_status!=="withdrawn";
  });
 },[courseId,termId,entryStudents,entryCourses,departments,enrollments]);
 const currentCourse=entryCourses.find(x=>x.id===courseId);
 useEffect(()=>{
  const next:Record<string,string>={};
  inputStudents.forEach(student=>{const existing=gradeByKey.get(student.id+"|"+courseId);next[student.id]=existing?.score===null||existing?.score===undefined?"":String(existing.score);});
  setInputValues(next);
 },[inputStudents,gradeByKey,courseId]);

 const exportCsv=()=>{
  const rows=[locale==="my"?["စဉ်","ကျောင်းသားအမည်","ဌာန","အတန်းနှစ်","ပျမ်းမျှရမှတ်","ရမှတ်ထည့်ပြီး ဘာသာရပ်များ","ဘာသာရပ် စုစုပေါင်း"]:["Serial No.","Student Name","Department","Year","Average Score","Entered Subjects","Total Subjects"],...visibleStudents.map(student=>{
   const studentEnrollments=enrollments.filter(e=>e.student_id===student.id&&e.term_id===termId&&["enrolled","completed"].includes(e.enrollment_status));
   const enrolledCourseIds=[...new Set(studentEnrollments.map(e=>e.course_id))];
   const scores=enrolledCourseIds.map(id=>gradeByKey.get(student.id+"|"+id)?.score).filter((v):v is number=>v!==null&&v!==undefined);
   const average=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null;
   const studentDepartment=departments.find(d=>d.code.toLowerCase()===String(student.program_code||"").toLowerCase());
   return [student.student_number,student.full_name,(locale==="my"?studentDepartment?.name_my||studentDepartment?.name_en:studentDepartment?.name_en)||studentDepartment?.code||student.program_code,student.cohort,average===null?"":average.toFixed(2),scores.length,enrolledCourseIds.length];
  })];
  const blob=new Blob(["\uFEFF"+rows.map(row=>row.map(csvCell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="MRPST_"+(terms.find(x=>x.id===termId)?.term_code||"grades")+"_grades.csv";document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
 };

 const saveScores=async()=>{
  if(!academicMutationsEnabled){setNotice((englishUI?"Grade changes are locked until the development database is separated and safety verified.":"성적 변경은 개발 DB 분리 및 안전성 검증 전까지 잠겨 있습니다."));return;}
  if(!db||!termId||!courseId||!canManage)return;
  const rows=inputStudents.filter(student=>String(inputValues[student.id]??"").trim()!=="").map(student=>({student_id:student.id,course_id:courseId,term_id:termId,score:Number(inputValues[student.id]),entered_by:gradeByKey.get(student.id+"|"+courseId)?.entered_by??currentUserId}));
  if(rows.some(x=>!Number.isFinite(x.score)||x.score<0||x.score>100)){setError((englishUI?"Enter a numeric score between 0 and 100.":"점수는 0점부터 100점 사이의 숫자로 입력해 주세요."));return;}
  const changed=rows.filter(row=>{const old=gradeByKey.get(row.student_id+"|"+courseId);return !old||Number(old.score)!==row.score;});
  if(!changed.length){setNotice((englishUI?"No scores have changed.":"변경된 점수가 없습니다."));return;}
  setSaving(true);setError("");setNotice("");
  try{
    if(!currentUserId)throw new Error("로그인 상태를 다시 확인해 주세요.");
    // The grade form is independent of semester enrollment/completion. Create
    // only the course registration rows needed for actually saved scores.
    const missingRegistrations=changed.filter(row=>!enrollments.some(e=>e.student_id===row.student_id&&e.course_id===row.course_id&&e.term_id===row.term_id));
    if(missingRegistrations.length){
      const {data:registered,error:registrationError}=await db.from("academic_enrollments")
        .insert(missingRegistrations.map(row=>({student_id:row.student_id,course_id:row.course_id,term_id:row.term_id,enrollment_status:"enrolled",created_by:currentUserId})))
        .select("student_id,course_id,term_id");
      if(registrationError)throw registrationError;
      if(!registered||registered.length!==missingRegistrations.length)throw new Error("성적에 필요한 수강 기록을 확인할 수 없습니다.");
    }
    const {data:saved,error}=await db.from("academic_grades").upsert(changed,{onConflict:"student_id,course_id,term_id"}).select("student_id,course_id,term_id,score");if(error)throw error;if(!saved||saved.length!==changed.length||saved.some(row=>!changed.some(expected=>expected.student_id===row.student_id&&expected.course_id===row.course_id&&expected.term_id===row.term_id&&expected.score===row.score)))throw new Error("일부 성적 저장 결과를 확인할 수 없습니다.");setNotice(englishUI?`Saved grades for ${changed.length} students.`:changed.length+"명의 성적을 저장했습니다.");setTermRefreshKey(value=>value+1);}
  catch(err:any){setError(err?.message||"성적 저장에 실패했습니다.");}
  finally{setSaving(false);}
 };

 const deleteScore=async(student:Student)=>{
  if(!academicMutationsEnabled){setNotice((englishUI?"Grade deletion is locked until the development database is separated and safety verified.":"성적 삭제는 개발 DB 분리 및 안전성 검증 전까지 잠겨 있습니다."));return;}
  if(!db||!canManage)return;
  if(enrollments.some(e=>e.student_id===student.id&&e.course_id===courseId&&e.term_id===termId&&e.enrollment_status==="completed")){setError((englishUI?"Grades for completed courses cannot be deleted. Change the course completion status first.":"이미 이수 완료된 과목의 성적은 삭제할 수 없습니다. 수강 이수 상태를 먼저 변경해야 합니다."));return;}
  if(!window.confirm(window.location.pathname.startsWith("/en/")?("Delete "+student.full_name+"'s grade for this course?"):student.full_name+(locale==="my"?" ၏ ဤဘာသာရပ်အမှတ်ကို ဖျက်မလား။":" 학생의 이 과목 성적을 삭제할까요?")))return;
  setSaving(true);setError("");setNotice("");
  try{const {data:deleted,error}=await db.from("academic_grades").delete().eq("student_id",student.id).eq("course_id",courseId).eq("term_id",termId).select("id");if(error)throw error;if(!deleted?.length)throw new Error("성적 삭제 결과를 확인할 수 없습니다.");setNotice((englishUI?"Grade deleted.":"성적을 삭제했습니다."));setTermRefreshKey(value=>value+1);}
  catch(err:any){setError(err?.message||"성적 삭제에 실패했습니다.");}
  finally{setSaving(false);}
 };

 const stats=useMemo(()=>{
  const eligible=enrollments.filter(e=>e.term_id===termId&&["enrolled","completed"].includes(e.enrollment_status)&&visibleStudents.some(s=>s.id===e.student_id)&&visibleCourses.some(c=>c.id===e.course_id));
  const scores=eligible.map(e=>gradeByKey.get(e.student_id+"|"+e.course_id)?.score).filter((v):v is number=>v!==null&&v!==undefined);
  const entered=scores.length;
  const possible=eligible.length;
  return {students:visibleStudents.length,courses:visibleCourses.length,entered,missing:Math.max(0,possible-entered),average:scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null};
 },[enrollments,termId,visibleStudents,visibleCourses,gradeByKey]);

 const printStudentReport=()=>{
  if(!selectedStudent)return;
  const selectedTerm=terms.find(x=>x.id===termId);
  const scores=studentCourses.map(x=>x.grade?.score).filter((value):value is number=>value!==null&&value!==undefined);
  const average=scores.length?(scores.reduce((sum,value)=>sum+value,0)/scores.length).toFixed(2):"—";
  const rows=studentCourses.map(({course,grade},index)=>`<tr><td>${index+1}</td><td>${htmlCell(course.course_code)}</td><td>${htmlCell(displayCourse(course))}</td><td class="number">${htmlCell(grade?.score??"—")}</td><td>${htmlCell(grade?.grade||"—")}</td></tr>`).join("");
  const printFrame=document.createElement("iframe");
  printFrame.setAttribute("aria-hidden","true");
  printFrame.style.cssText="position:fixed;width:1px;height:1px;right:0;bottom:0;border:0;opacity:0;pointer-events:none";
  document.body.appendChild(printFrame);
  const printWindow=printFrame.contentWindow;
  if(!printWindow){printFrame.remove();window.alert(englishUI?"The print view could not be prepared. Please try again.":"인쇄 화면을 준비하지 못했습니다. 다시 시도해 주세요.");return;}
  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${htmlCell(selectedStudent.full_name)} - Report Card</title><style>
   @page{size:A4 portrait;margin:14mm}*{box-sizing:border-box}body{margin:0;color:#172b3c;background:#fff;font-family:Arial,"Noto Sans Myanmar","Noto Sans",sans-serif;font-size:10pt}.report{width:100%;margin:0 auto}.school{text-align:center;border-bottom:2px solid #17324a;padding-bottom:12px}.school h1{margin:0;color:#17324a;font-size:21pt;letter-spacing:1.5px}.school p{margin:4px 0 0;color:#5c6973;font-size:9pt}.title{text-align:center;margin:18px 0}.title h2{margin:0 0 5px;font-size:16pt;letter-spacing:1px}.title p{margin:0;color:#66737c;font-size:9pt}.student{display:grid;grid-template-columns:1fr 1fr;margin:0 0 16px;border:1px solid #aeb8be}.student div{display:grid;grid-template-columns:105px 1fr;min-height:34px;border-bottom:1px solid #d5dadd}.student div:nth-last-child(-n+2){border-bottom:0}.student div:nth-child(odd){border-right:1px solid #d5dadd}.student b,.student span{display:flex;align-items:center;padding:7px 9px}.student b{background:#f1f3f4;font-size:8.5pt}.student span{font-weight:600}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #aeb8be;padding:8px 7px;text-align:left;vertical-align:middle}th{background:#eef1f3!important;color:#263c4c;font-size:8.5pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}th:first-child,td:first-child{width:42px;text-align:center}th:nth-child(2),td:nth-child(2){width:92px}th:nth-child(4),td:nth-child(4){width:64px}th:nth-child(5),td:nth-child(5){width:64px}.number{text-align:center;font-weight:700}tbody tr{break-inside:avoid}.empty{text-align:center;color:#6e7980;padding:22px}.summary{display:grid;grid-template-columns:repeat(3,1fr);margin-top:14px;border:1px solid #aeb8be}.summary div{padding:10px;border-right:1px solid #d5dadd}.summary div:last-child{border-right:0}.summary span{display:block;color:#6b7780;font-size:8pt}.summary strong{display:block;margin-top:4px;font-size:11pt}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:70px;margin-top:58px}.signature{text-align:center;border-top:1px solid #596975;padding-top:7px;font-size:9pt}.issued{margin-top:30px;color:#78838a;font-size:8pt;text-align:right}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><main class="report"><header class="school"><h1>MRPST</h1><p>Myanmar Reformed Presbyterian Seminary</p></header><section class="title"><h2>STUDENT REPORT CARD</h2><p>${htmlCell(selectedTerm?.name||"Academic Term")} · ${htmlCell(selectedTerm?.academic_year||"")}</p></section><section class="student"><div><b>Student Name</b><span>${htmlCell(selectedStudent.full_name)}</span></div><div><b>Student Number</b><span>${htmlCell(selectedStudent.student_number)}</span></div><div><b>Department</b><span>${htmlCell(department?.name_en||selectedStudent.program_code||"—")}</span></div><div><b>Academic Year</b><span>${htmlCell(selectedStudent.cohort||"—")}</span></div></section><table><thead><tr><th>No.</th><th>Course Code</th><th>Course Title</th><th>Score</th><th>Grade</th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="empty">No registered courses</td></tr>'}</tbody></table><section class="summary"><div><span>Total Subjects</span><strong>${studentCourses.length}</strong></div><div><span>Scores Entered</span><strong>${scores.length}</strong></div><div><span>Average Score</span><strong>${average}</strong></div></section><section class="signatures"><div class="signature">Academic Officer</div><div class="signature">Principal</div></section><p class="issued">Issued: ${htmlCell(new Date().toLocaleDateString("en-CA"))}</p></main></body></html>`);
  printWindow.document.close();
  let cleaned=false;
  const cleanup=()=>{if(cleaned)return;cleaned=true;printFrame.remove();};
  printWindow.addEventListener("afterprint",cleanup,{once:true});
  window.setTimeout(()=>{
   try{printWindow.focus();printWindow.print();}
   catch{cleanup();window.alert(englishUI?"Printing could not start. Please try again.":"인쇄를 시작하지 못했습니다. 다시 시도해 주세요.");}
  },250);
  window.setTimeout(cleanup,60000);
 };

 return <div className={styles.workspace}>
  <div className={styles.heading}>
   <div><span className={styles.eyebrow}>GRADE MANAGEMENT</span><h2>{(englishUI?"Enter and review scores":"점수 입력·확인")}</h2><p>{(englishUI?"Select a semester and course, enter scores and save. Manage grades without semester registration or completion confirmation.":"학기와 과목을 선택하고 점수를 적어 저장하세요. 학기 등록·이수 확정 없이 성적을 관리합니다.")}</p></div>
   <span className={styles.permission}>{canManage&&academicMutationsEnabled?(englishUI?"Grade entry enabled":"점수 입력 가능"):(englishUI?"Read only":"조회 전용")}</span>
  </div>
  <div className={styles.filters}>
   <label>{(englishUI?"1. Select semester":"1. 학기 선택")}<select value={termId} onChange={e=>{setTermId(e.target.value);onTermChange?.(e.target.value);}}><option value="">{(englishUI?"Select semester":"학기 선택")}</option>{terms.map(x=><option key={x.id} value={x.id}>{x.name} ({x.academic_year})</option>)}</select></label>
   <label>{(englishUI?"2. Select department":"2. 학과 선택")}<select value={departmentId} onChange={e=>{setDepartmentId(e.target.value);setSelectedStudentId("");}}><option value="">{englishUI?"All departments":"전체 학과"}</option>{departments.map(x=><option key={x.id} value={x.id}>{locale==="en"?(x.name_en||x.name_ko||x.code):locale==="my"?(x.name_my||x.name_en||x.name_ko||x.code):(x.name_ko||x.name_en||x.code)}</option>)}</select></label>
   <label>{(englishUI?"3. Select year":"3. 학년 선택")}<select value={level} onChange={e=>{setLevel(e.target.value);setSelectedStudentId("");}}><option value="">{(englishUI?"All years":"전체 학년")}</option>{levels.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
  </div>
  <div className={styles.stats}>
   <article><span>{(englishUI?"Student":"학생")}</span><strong>{stats.students}</strong></article>
   <article><span>{(englishUI?"Course":"과목")}</span><strong>{stats.courses}</strong></article>
   <article><span>{(englishUI?"Scores entered":"점수 입력 완료")}</span><strong>{stats.entered}</strong></article>
   <article><span>{(englishUI?"Scores missing":"점수 미입력")}</span><strong>{stats.missing}</strong></article>
  </div>
  {error&&<div className={styles.alertError}>{englishUI?englishDisplay(error):error}</div>}{notice&&<div className={styles.alertSuccess}>{englishUI?englishDisplay(notice):notice}</div>}{!academicMutationsEnabled&&<div className={styles.alert}>{(englishUI?"Grade changes are locked in safety mode. Viewing and printing remain available.":"성적 변경 기능이 안전 모드로 잠겨 있습니다. 조회와 출력은 사용할 수 있습니다.")}</div>}
  {!db&&<div className={styles.alert}>{(englishUI?"Supabase connection configuration is required.":"Supabase 연결 설정이 필요합니다.")}</div>}
  {!canManage&&db&&<div className={styles.alert}>{(englishUI?"Grade management permission could not be verified. Sign in as a Super Administrator or administrative officer.":"성적관리 권한이 확인되지 않았습니다. Super Admin 또는 행정 담당자 계정으로 로그인해 주세요.")}</div>}
  <div className={styles.tabs} aria-label={(englishUI?"Select grading task":"성적 업무 선택")}><button type="button" className={tab==="entry"?styles.activeTab:""} onClick={()=>setTab("entry")}>{(englishUI?"Enter scores by course":"과목별 점수 입력")}</button><button type="button" className={tab==="lookup"?styles.activeTab:""} onClick={()=>setTab("lookup")}>{(englishUI?"View grades by student":"학생별 성적 확인")}</button></div>
  {tab==="lookup"&&<section className={styles.panel}>
   <div className={styles.panelHead}><div><h3>{(englishUI?"View grades by student":"학생별 성적 확인")}</h3><p>{(englishUI?"Select a student name to view course scores and courses with missing scores.":"학생 이름을 누르면 과목별 점수와 미입력 과목을 볼 수 있습니다.")}</p></div><div className={styles.actions}><button onClick={exportCsv} disabled={!visibleStudents.length}>{(englishUI?"CSV for Excel":"엑셀용 CSV")}</button><button onClick={()=>window.print()}>{(englishUI?"Print":"인쇄")}</button></div></div>
   <input className={styles.search} value={search} onChange={e=>setSearch(e.target.value)} placeholder={(englishUI?"Search student name or sequence number":"학생 이름 또는 순번 검색")}/>
    {loading||termLoading?<p className={styles.empty}>{(englishUI?"Loading data…":"데이터를 불러오는 중입니다…")}</p>:<div className={styles.tableWrap}><table><thead><tr><th>{(englishUI?"No.":"순번")}</th><th>{(englishUI?"Student name":"학생 이름")}</th><th>{(englishUI?"Year":"학년")}</th><th>{(englishUI?"Courses with entries":"입력 과목")}</th><th>{(englishUI?"Average score":"평균 점수")}</th><th></th></tr></thead><tbody>
    {visibleStudents.map(student=>{const enrolledCourses=visibleCourses.filter(course=>enrollments.some(e=>e.student_id===student.id&&e.course_id===course.id&&e.term_id===termId&&["enrolled","completed"].includes(e.enrollment_status)));const scores=enrolledCourses.map(course=>gradeByKey.get(student.id+"|"+course.id)?.score).filter((v):v is number=>v!==null&&v!==undefined);const average=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null;return <tr key={student.id} className={selectedStudentId===student.id?styles.selectedRow:""}><td>{student.student_number}</td><td><button className={styles.nameButton} onClick={()=>setSelectedStudentId(student.id)}>{student.full_name}</button></td><td>{student.cohort||"—"}</td><td>{scores.length} / {enrolledCourses.length}</td><td>{average===null?"—":average.toFixed(2)}</td><td><button className={styles.smallButton} onClick={()=>setSelectedStudentId(student.id)}>{(englishUI?"Details":"상세")}</button></td></tr>;})}
    {!visibleStudents.length&&<tr><td colSpan={6} className={styles.empty}>{(englishUI?"No students match your criteria.":"선택한 조건에 해당하는 학생이 없습니다.")}</td></tr>}
   </tbody></table></div>}
   {selectedStudent&&<div className={styles.detailBackdrop} role="dialog" aria-modal="true" aria-label={(englishUI?"Student grade details":"학생 성적 상세")} onMouseDown={()=>setSelectedStudentId("")}><div className={styles.detail} onMouseDown={event=>event.stopPropagation()}>
    <div className={styles.panelHead}><div><h3>{selectedStudent.full_name}</h3><p>{englishUI?"Student number: ":"순번 "}{selectedStudent.student_number} · {locale==="en"?(department?.name_en||department?.name_ko||selectedStudent.program_code||""):locale==="my"?(department?.name_my||department?.name_en||department?.name_ko||selectedStudent.program_code||""):(department?.name_ko||department?.name_en||selectedStudent.program_code||"")} · {selectedStudent.cohort||""}</p></div><div className={styles.actions}><button onClick={printStudentReport}>{(englishUI?"Print transcript / Save PDF":"성적표 출력 / PDF 저장")}</button><button onClick={()=>setSelectedStudentId("")}>{(englishUI?"Close":"닫기")}</button></div></div>
    <div className={styles.tableWrap}><table><thead><tr><th>{(englishUI?"Course code":"과목 코드")}</th><th>{(englishUI?"Course name":"과목명")}</th><th>{(englishUI?"Score":"점수")}</th><th>{(englishUI?"Status":"상태")}</th></tr></thead><tbody>
     {studentCourses.map(({course,grade})=><tr key={course.id}><td>{course.course_code}</td><td>{displayCourse(course)}</td><td>{grade?.score??"—"}</td><td>{grade?.score===null||grade?.score===undefined?<span className={styles.missing}>{(englishUI?"Not entered":"미입력")}</span>:<span className={styles.complete}>{(englishUI?"Entry complete":"입력 완료")}</span>}</td></tr>)}
     {!studentCourses.length&&<tr><td colSpan={4} className={styles.empty}>{(englishUI?"No registered courses.":"등록된 과목이 없습니다.")}</td></tr>}
    </tbody></table></div>
   </div></div>}
  </section>}
  {tab==="entry"&&<section className={styles.panel}>
   <div className={styles.panelHead}><div><h3>{(englishUI?"Enter scores by course":"과목별 점수 입력")}</h3><p>{(englishUI?"Select a course to display students in the relevant department and year. Enter scores from 0 to 100 and save. Students without enrollment records are linked automatically when scores are saved.":"과목을 고르면 해당 학과·학년 학생이 표시됩니다. 0~100점을 적고 저장하세요. 아직 수강 기록이 없는 학생은 점수 저장 시 자동으로 연결됩니다.")}</p></div></div>
   <div className={styles.entryFilters}>
    <label>{(englishUI?"Course to enter scores for":"점수를 입력할 과목")}<SearchSelect value={courseId} placeholder={(englishUI?"Search courses":"과목 검색")} searchPlaceholder={(englishUI?"Search by course code or name":"과목 코드, 과목명 검색")} options={entryCourses.map(x=>({value:x.id,label:`${x.course_code} · ${displayCourse(x)}`,keywords:`${x.course_code} ${x.title}`}))} onChange={setCourseId}/></label>
   </div>
   {currentCourse&&<div className={styles.entryTitle}><strong>{displayCourse(currentCourse)}</strong><span>{currentCourse.course_code} · {terms.find(x=>x.id===termId)?.name||"학기 미선택"}</span></div>}
   <div className={styles.tableWrap}><table><thead><tr><th>{(englishUI?"No.":"순번")}</th><th>{(englishUI?"Student name":"학생 이름")}</th><th>{(englishUI?"Score":"점수")}</th><th>{(englishUI?"Existing score":"기존 점수")}</th><th>{(englishUI?"Action":"작업")}</th></tr></thead><tbody>
     {inputStudents.map(student=>{const old=gradeByKey.get(student.id+"|"+courseId);return <tr key={student.id}><td>{student.student_number}</td><td>{student.full_name}</td><td><input className={styles.scoreInput} type="number" min="0" max="100" step="0.01" disabled={!canManage||!academicMutationsEnabled||saving||termLoading} value={inputValues[student.id]??""} onChange={e=>setInputValues(v=>({...v,[student.id]:e.target.value}))} aria-label={englishUI?"Score for "+student.full_name:student.full_name+" 점수"}/></td><td>{old?.score??"—"}</td><td>{old&&<button className={styles.deleteButton} disabled={!academicMutationsEnabled||saving||termLoading} onClick={()=>void deleteScore(student)}>{(englishUI?"Delete":"삭제")}</button>}</td></tr>;})}
    {!inputStudents.length&&<tr><td colSpan={5} className={styles.empty}>{!termId?(englishUI?"Select a semester first.":"먼저 학기를 선택하세요."):!courseId?(englishUI?"Select a course.":"과목을 선택하세요."):(englishUI?"No enrolled students in this course and year.":"해당 과목·학년에 재학 중인 학생이 없습니다.")}</td></tr>}
   </tbody></table></div>
    <div className={styles.saveRow}><span>{inputStudents.length}{locale==="my"?" ဦး · အလွတ်ကွက်များကို သိမ်းဆည်းမည်မဟုတ်ပါ။":"명 · 빈 칸은 저장하지 않습니다."}</span><button className={styles.primary} disabled={!academicMutationsEnabled||!canManage||saving||termLoading||!inputStudents.length||!courseId||!termId} onClick={()=>void saveScores()}>{saving?"저장 중…":"점수 저장"}</button></div>
  </section>}
   {(loading||termLoading)&&<p className={styles.loading}>{(englishUI?"Loading grade data.":"성적 데이터를 불러오는 중입니다.")}</p>}
  <p className={styles.footnote}>{(englishUI?"Change student year directly under Student Management → Edit Information. Grades and enrollment records are retained; missing scores are not counted as zero. Credits, letter grades and GPA are not calculated automatically.":"학년 변경은 학생 관리 → 정보 수정에서 직접 합니다. 성적과 수강 기록은 유지되며, 미입력 점수는 0점으로 계산하지 않습니다. 학점·등급·GPA는 자동 계산하지 않습니다.")}</p>
 </div>;
}
