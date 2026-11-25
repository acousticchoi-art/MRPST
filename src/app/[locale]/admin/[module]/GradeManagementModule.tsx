"use client";
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
   const [d,t,s,c,g,e]=await Promise.all([
    db.from("departments").select("id,code,name_en,name_ko,name_my").eq("is_active",true).order("code"),
    db.from("academic_terms").select("id,term_code,name,academic_year,status").order("academic_year",{ascending:false}).order("term_code",{ascending:false}),
    db.from("students").select("id,student_number,full_name,program_code,cohort,student_status").order("full_name"),
    db.from("academic_courses").select("id,course_code,title,title_my,department_id,level,is_active").order("course_code"),
    db.from("academic_grades").select("id,student_id,course_id,term_id,score,grade,remarks,updated_at,entered_by").order("updated_at",{ascending:false}),
    db.from("academic_enrollments").select("student_id,course_id,term_id,enrollment_status")
   ]);
   const errors=[d.error,t.error,s.error,c.error,g.error,e.error].filter(Boolean).map((x:any)=>x.message);
   if(errors.length)throw new Error(errors.join(" · "));
   const nextTerms=(t.data??[]) as Term[];
   const nextDepartments=(d.data??[]) as Department[];
   setDepartments(nextDepartments);setTerms(nextTerms);setStudents((s.data??[]) as Student[]);setCourses((c.data??[]) as Course[]);setGrades((g.data??[]) as Grade[]);setEnrollments((e.data??[]) as Enrollment[]);
   if(!termId&&nextTerms.length){const nextId=(nextTerms.find(x=>x.status==="active")??nextTerms[0]).id;setTermId(nextId);onTermChange?.(nextId);}
   
  }catch(err:any){setError(err?.message||"성적 데이터를 불러오지 못했습니다.");}
  finally{setLoading(false);}
 },[db,termId,departmentId,onTermChange]);

 useEffect(()=>{void load();},[load]);

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
   return [student.student_number,student.full_name,studentDepartment?.name_en||studentDepartment?.code||student.program_code,student.cohort,average===null?"":average.toFixed(2),scores.length,enrolledCourseIds.length];
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
    const {data:saved,error}=await db.from("academic_grades").upsert(changed,{onConflict:"student_id,course_id,term_id"}).select("student_id,course_id,term_id,score");if(error)throw error;if(!saved||saved.length!==changed.length||saved.some(row=>!changed.some(expected=>expected.student_id===row.student_id&&expected.course_id===row.course_id&&expected.term_id===row.term_id&&expected.score===row.score)))throw new Error("일부 성적 저장 결과를 확인할 수 없습니다.");setNotice(changed.length+"명의 성적을 저장했습니다.");await load();}
  catch(err:any){setError(err?.message||"성적 저장에 실패했습니다.");}
  finally{setSaving(false);}
 };

 const deleteScore=async(student:Student)=>{
  if(!academicMutationsEnabled){setNotice((englishUI?"Grade deletion is locked until the development database is separated and safety verified.":"성적 삭제는 개발 DB 분리 및 안전성 검증 전까지 잠겨 있습니다."));return;}
  if(!db||!canManage)return;
  if(enrollments.some(e=>e.student_id===student.id&&e.course_id===courseId&&e.term_id===termId&&e.enrollment_status==="completed")){setError((englishUI?"Grades for completed courses cannot be deleted. Change the course completion status first.":"이미 이수 완료된 과목의 성적은 삭제할 수 없습니다. 수강 이수 상태를 먼저 변경해야 합니다."));return;}
  if(!window.confirm(window.location.pathname.startsWith("/en/")?("Delete "+student.full_name+"'s grade for this course?"):student.full_name+(locale==="my"?" ၏ ဤဘာသာရပ်အမှတ်ကို ဖျက်မလား။":" 학생의 이 과목 성적을 삭제할까요?")))return;
  setSaving(true);setError("");setNotice("");
  try{const {data:deleted,error}=await db.from("academic_grades").delete().eq("student_id",student.id).eq("course_id",courseId).eq("term_id",termId).select("id");if(error)throw error;if(!deleted?.length)throw new Error("성적 삭제 결과를 확인할 수 없습니다.");setNotice((englishUI?"Grade deleted.":"성적을 삭제했습니다."));await load();}
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

 return <div className={styles.workspace}>
  <div className={styles.heading}>
   <div><span className={styles.eyebrow}>GRADE MANAGEMENT</span><h2>{(englishUI?"Enter and review scores":"점수 입력·확인")}</h2><p>{(englishUI?"Select a semester and course, enter scores and save. Manage grades without semester registration or completion confirmation.":"학기와 과목을 선택하고 점수를 적어 저장하세요. 학기 등록·이수 확정 없이 성적을 관리합니다.")}</p></div>
   <span className={styles.permission}>{canManage&&academicMutationsEnabled?"점수 입력 가능":"조회 전용"}</span>
  </div>
  <div className={styles.filters}>
   <label>{(englishUI?"1. Select semester":"1. 학기 선택")}<select value={termId} onChange={e=>{setTermId(e.target.value);onTermChange?.(e.target.value);}}><option value="">학기 선택</option>{terms.map(x=><option key={x.id} value={x.id}>{x.name} ({x.academic_year})</option>)}</select></label>
   <label>{(englishUI?"2. Select department":"2. 학과 선택")}<select value={departmentId} onChange={e=>{setDepartmentId(e.target.value);setSelectedStudentId("");}}><option value="">전체 학과</option>{departments.map(x=><option key={x.id} value={x.id}>{locale==="en"?(x.name_en||x.name_ko||x.code):locale==="my"?(x.name_my||x.name_en||x.name_ko||x.code):(x.name_ko||x.name_en||x.code)}</option>)}</select></label>
   <label>{(englishUI?"3. Select year":"3. 학년 선택")}<select value={level} onChange={e=>{setLevel(e.target.value);setSelectedStudentId("");}}><option value="">전체 학년</option>{levels.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
  </div>
  <div className={styles.stats}>
   <article><span>{(englishUI?"Student":"학생")}</span><strong>{stats.students}</strong></article>
   <article><span>{(englishUI?"Course":"과목")}</span><strong>{stats.courses}</strong></article>
   <article><span>{(englishUI?"Scores entered":"점수 입력 완료")}</span><strong>{stats.entered}</strong></article>
   <article><span>{(englishUI?"Scores missing":"점수 미입력")}</span><strong>{stats.missing}</strong></article>
  </div>
  {error&&<div className={styles.alertError}>{error}</div>}{notice&&<div className={styles.alertSuccess}>{notice}</div>}{!academicMutationsEnabled&&<div className={styles.alert}>성적 변경 기능이 안전 모드로 잠겨 있습니다. 조회와 출력은 사용할 수 있습니다.</div>}
  {!db&&<div className={styles.alert}>Supabase 연결 설정이 필요합니다.</div>}
  {!canManage&&db&&<div className={styles.alert}>성적관리 권한이 확인되지 않았습니다. Super Admin 또는 행정 담당자 계정으로 로그인해 주세요.</div>}
  <div className={styles.tabs} aria-label={(englishUI?"Select grading task":"성적 업무 선택")}><button type="button" className={tab==="entry"?styles.activeTab:""} onClick={()=>setTab("entry")}>과목별 점수 입력</button><button type="button" className={tab==="lookup"?styles.activeTab:""} onClick={()=>setTab("lookup")}>학생별 성적 확인</button></div>
  {tab==="lookup"&&<section className={styles.panel}>
   <div className={styles.panelHead}><div><h3>{(englishUI?"View grades by student":"학생별 성적 확인")}</h3><p>{(englishUI?"Select a student name to view course scores and courses with missing scores.":"학생 이름을 누르면 과목별 점수와 미입력 과목을 볼 수 있습니다.")}</p></div><div className={styles.actions}><button onClick={exportCsv} disabled={!visibleStudents.length}>엑셀용 CSV</button><button onClick={()=>window.print()}>인쇄</button></div></div>
   <input className={styles.search} value={search} onChange={e=>setSearch(e.target.value)} placeholder={(englishUI?"Search student name or sequence number":"학생 이름 또는 순번 검색")}/>
   {loading?<p className={styles.empty}>데이터를 불러오는 중입니다…</p>:<div className={styles.tableWrap}><table><thead><tr><th>{(englishUI?"No.":"순번")}</th><th>{(englishUI?"Student name":"학생 이름")}</th><th>{(englishUI?"Year":"학년")}</th><th>{(englishUI?"Courses with entries":"입력 과목")}</th><th>{(englishUI?"Average score":"평균 점수")}</th><th></th></tr></thead><tbody>
    {visibleStudents.map(student=>{const enrolledCourses=visibleCourses.filter(course=>enrollments.some(e=>e.student_id===student.id&&e.course_id===course.id&&e.term_id===termId&&["enrolled","completed"].includes(e.enrollment_status)));const scores=enrolledCourses.map(course=>gradeByKey.get(student.id+"|"+course.id)?.score).filter((v):v is number=>v!==null&&v!==undefined);const average=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null;return <tr key={student.id} className={selectedStudentId===student.id?styles.selectedRow:""}><td>{student.student_number}</td><td><button className={styles.nameButton} onClick={()=>setSelectedStudentId(student.id)}>{student.full_name}</button></td><td>{student.cohort||"—"}</td><td>{scores.length} / {enrolledCourses.length}</td><td>{average===null?"—":average.toFixed(2)}</td><td><button className={styles.smallButton} onClick={()=>setSelectedStudentId(student.id)}>상세</button></td></tr>;})}
    {!visibleStudents.length&&<tr><td colSpan={6} className={styles.empty}>선택한 조건에 해당하는 학생이 없습니다.</td></tr>}
   </tbody></table></div>}
   {selectedStudent&&<div className={styles.detailBackdrop} role="dialog" aria-modal="true" aria-label={(englishUI?"Student grade details":"학생 성적 상세")} onMouseDown={()=>setSelectedStudentId("")}><div className={styles.detail} onMouseDown={event=>event.stopPropagation()}>
    <div className={styles.panelHead}><div><h3>{selectedStudent.full_name}</h3><p>순번 {selectedStudent.student_number} · {locale==="en"?(department?.name_en||department?.name_ko||selectedStudent.program_code||""):locale==="my"?(department?.name_my||department?.name_en||department?.name_ko||selectedStudent.program_code||""):(department?.name_ko||department?.name_en||selectedStudent.program_code||"")} · {selectedStudent.cohort||""}</p></div><div className={styles.actions}><button onClick={()=>window.print()}>성적표 출력 / PDF 저장</button><button onClick={()=>setSelectedStudentId("")}>닫기</button></div></div><div className={styles.printReport}><header><h1>MRPST</h1><h2>STUDENT REPORT CARD</h2><p>{terms.find(x=>x.id===termId)?.name||"Academic Term"}</p></header><div className={styles.printStudent}><span><b>Student Name</b>{selectedStudent.full_name}</span><span><b>Student Number</b>{selectedStudent.student_number}</span><span><b>Department</b>{department?.name_en||selectedStudent.program_code||"—"}</span><span><b>Academic Year</b>{selectedStudent.cohort||"—"}</span></div><table><thead><tr><th>Course Code</th><th>Course Title</th><th>Score</th></tr></thead><tbody>{studentCourses.map(({course,grade})=><tr key={course.id}><td>{course.course_code}</td><td>{displayCourse(course)}</td><td>{grade?.score??"—"}</td></tr>)}</tbody></table><div className={styles.printSummary}><span>Entered Subjects: {studentCourses.filter(x=>x.grade?.score!==null&&x.grade?.score!==undefined).length} / {studentCourses.length}</span><b>Average Score: {(()=>{const scores=studentCourses.map(x=>x.grade?.score).filter((v):v is number=>v!==null&&v!==undefined);return scores.length?(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(2):"—";})()}</b></div><footer><span>Academic Officer</span><span>Principal</span></footer></div>
    <div className={styles.tableWrap}><table><thead><tr><th>{(englishUI?"Course code":"과목 코드")}</th><th>{(englishUI?"Course name":"과목명")}</th><th>{(englishUI?"Score":"점수")}</th><th>{(englishUI?"Status":"상태")}</th></tr></thead><tbody>
     {studentCourses.map(({course,grade})=><tr key={course.id}><td>{course.course_code}</td><td>{displayCourse(course)}</td><td>{grade?.score??"—"}</td><td>{grade?.score===null||grade?.score===undefined?<span className={styles.missing}>미입력</span>:<span className={styles.complete}>입력 완료</span>}</td></tr>)}
     {!studentCourses.length&&<tr><td colSpan={4} className={styles.empty}>등록된 과목이 없습니다.</td></tr>}
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
    {inputStudents.map(student=>{const old=gradeByKey.get(student.id+"|"+courseId);return <tr key={student.id}><td>{student.student_number}</td><td>{student.full_name}</td><td><input className={styles.scoreInput} type="number" min="0" max="100" step="0.01" disabled={!canManage||!academicMutationsEnabled||saving} value={inputValues[student.id]??""} onChange={e=>setInputValues(v=>({...v,[student.id]:e.target.value}))} aria-label={student.full_name+" 점수"}/></td><td>{old?.score??"—"}</td><td>{old&&<button className={styles.deleteButton} disabled={!academicMutationsEnabled||saving} onClick={()=>void deleteScore(student)}>삭제</button>}</td></tr>;})}
    {!inputStudents.length&&<tr><td colSpan={5} className={styles.empty}>{!termId?"먼저 학기를 선택하세요.":!courseId?"과목을 선택하세요.":"해당 과목·학년에 재학 중인 학생이 없습니다."}</td></tr>}
   </tbody></table></div>
   <div className={styles.saveRow}><span>{inputStudents.length}{locale==="my"?" ဦး · အလွတ်ကွက်များကို သိမ်းဆည်းမည်မဟုတ်ပါ။":"명 · 빈 칸은 저장하지 않습니다."}</span><button className={styles.primary} disabled={!academicMutationsEnabled||!canManage||saving||!inputStudents.length||!courseId||!termId} onClick={()=>void saveScores()}>{saving?"저장 중…":"점수 저장"}</button></div>
  </section>}
  {loading&&<p className={styles.loading}>성적 데이터를 불러오는 중입니다.</p>}
  <p className={styles.footnote}>학년 변경은 학생 관리 → 정보 수정에서 직접 합니다. 성적과 수강 기록은 유지되며, 미입력 점수는 0점으로 계산하지 않습니다. 학점·등급·GPA는 자동 계산하지 않습니다.</p>
 </div>;
}
