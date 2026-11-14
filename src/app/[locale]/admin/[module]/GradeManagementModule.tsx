"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";
import styles from "./GradeManagementModule.module.css";

type Department={id:string;code:string;name_en:string;name_ko:string|null;name_my:string|null};
type Term={id:string;term_code:string;name:string;academic_year:number;status:string};
type Student={id:string;student_number:string;full_name:string;program_code:string|null;cohort:string|null;student_status:string};
type Course={id:string;course_code:string;title:string;department_id:string|null;level:string|null;is_active:boolean};
type Grade={id:string;student_id:string;course_id:string;term_id:string;score:number|null;grade:string|null;remarks:string|null;updated_at:string;entered_by:string|null};

const roleCanEnter=["super_admin","administrator","academic_officer"];
const csvCell=(value:unknown)=>'"'+String(value??"").replace(/"/g,'""')+'"';

export default function GradeManagementModule(){
 const db=useMemo(()=>createSupabaseBrowserClient(),[]);
 const [departments,setDepartments]=useState<Department[]>([]);
 const [terms,setTerms]=useState<Term[]>([]);
 const [students,setStudents]=useState<Student[]>([]);
 const [courses,setCourses]=useState<Course[]>([]);
 const [grades,setGrades]=useState<Grade[]>([]);
 const [termId,setTermId]=useState("");
 const [departmentId,setDepartmentId]=useState("");
 const [level,setLevel]=useState("");
 const [courseId,setCourseId]=useState("");
 const [tab,setTab]=useState<"lookup"|"entry">("lookup");
 const [search,setSearch]=useState("");
 const [selectedStudentId,setSelectedStudentId]=useState("");
 const [inputValues,setInputValues]=useState<Record<string,string>>({});
 const [canManage,setCanManage]=useState(false);
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
   if(!user){setCanManage(false);setCurrentUserId("");setError("로그인이 필요합니다.");setLoading(false);return;}
   setCurrentUserId(user.id);
   const roleResult=await db.from("user_roles").select("role").eq("user_id",user.id);
   if(roleResult.error)throw roleResult.error;
   setCanManage((roleResult.data??[]).some((r:any)=>roleCanEnter.includes(r.role)));
   const [d,t,s,c,g]=await Promise.all([
    db.from("departments").select("id,code,name_en,name_ko,name_my").eq("is_active",true).order("code"),
    db.from("academic_terms").select("id,term_code,name,academic_year,status").order("academic_year",{ascending:false}).order("term_code",{ascending:false}),
    db.from("students").select("id,student_number,full_name,program_code,cohort,student_status").order("full_name"),
    db.from("academic_courses").select("id,course_code,title,department_id,level,is_active").eq("is_active",true).order("course_code"),
    db.from("academic_grades").select("id,student_id,course_id,term_id,score,grade,remarks,updated_at,entered_by").order("updated_at",{ascending:false})
   ]);
   const errors=[d.error,t.error,s.error,c.error,g.error].filter(Boolean).map((x:any)=>x.message);
   if(errors.length)throw new Error(errors.join(" · "));
   const nextTerms=(t.data??[]) as Term[];
   const nextDepartments=(d.data??[]) as Department[];
   setDepartments(nextDepartments);setTerms(nextTerms);setStudents((s.data??[]) as Student[]);setCourses((c.data??[]) as Course[]);setGrades((g.data??[]) as Grade[]);
   if(!termId&&nextTerms.length){setTermId((nextTerms.find(x=>x.status==="active")??nextTerms[0]).id);}
   if(!departmentId&&nextDepartments.length){setDepartmentId(nextDepartments[0].id);}
  }catch(err:any){setError(err?.message||"성적 데이터를 불러오지 못했습니다.");}
  finally{setLoading(false);}
 },[db,termId,departmentId]);

 useEffect(()=>{void load();},[load]);

 const department=departments.find(x=>x.id===departmentId);
 const programCode=department?.code?.toUpperCase().includes("ECE")?"ece":"theology";
 const levels=useMemo(()=>Array.from(new Set([
  ...courses.filter(x=>x.department_id===departmentId).map(x=>x.level),
  ...students.filter(x=>x.program_code===programCode).map(x=>x.cohort)
 ].filter((x):x is string=>Boolean(x)))).sort((a,b)=>a.localeCompare(b)),[courses,students,departmentId,programCode]);
 useEffect(()=>{if(levels.length&&!levels.includes(level))setLevel(levels[0]);},[levels,level]);
 const visibleCourses=useMemo(()=>courses.filter(x=>x.department_id===departmentId&&(!level||x.level===level)),[courses,departmentId,level]);
 useEffect(()=>{if(!visibleCourses.some(x=>x.id===courseId))setCourseId(visibleCourses[0]?.id??"");},[visibleCourses,courseId]);
 const visibleStudents=useMemo(()=>students.filter(x=>x.program_code===programCode&&(!level||x.cohort===level)&&(!search.trim()||x.full_name.toLowerCase().includes(search.toLowerCase())||x.student_number.toLowerCase().includes(search.toLowerCase()))).sort((a,b)=>Number.isFinite(Number(a.student_number))&&Number.isFinite(Number(b.student_number))?Number(a.student_number)-Number(b.student_number):a.student_number.localeCompare(b.student_number)),[students,programCode,level,search]);
 const termGrades=useMemo(()=>grades.filter(x=>x.term_id===termId),[grades,termId]);
 const gradeByKey=useMemo(()=>new Map(termGrades.map(x=>[x.student_id+"|"+x.course_id,x])),[termGrades]);
 const selectedStudent=students.find(x=>x.id===selectedStudentId);
 const studentCourses=visibleCourses.map(course=>({course,grade:gradeByKey.get(selectedStudentId+"|"+course.id)}));
 const inputStudents=useMemo(()=>courseId?visibleStudents:[],[courseId,visibleStudents]);
 const currentCourse=visibleCourses.find(x=>x.id===courseId);
 useEffect(()=>{
  const next:Record<string,string>={};
  inputStudents.forEach(student=>{const existing=gradeByKey.get(student.id+"|"+courseId);next[student.id]=existing?.score===null||existing?.score===undefined?"":String(existing.score);});
  setInputValues(next);
 },[inputStudents,gradeByKey,courseId]);

 const exportCsv=()=>{
  const rows=[["Serial No.","Student Name","Department","Year","Average Score","Entered Subjects","Total Subjects"],...visibleStudents.map(student=>{
   const scores=visibleCourses.map(course=>gradeByKey.get(student.id+"|"+course.id)?.score).filter((v):v is number=>v!==null&&v!==undefined);
   const average=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null;
   return [student.student_number,student.full_name,department?.name_en||department?.code,student.cohort,average===null?"":average.toFixed(2),scores.length,visibleCourses.length];
  })];
  const blob=new Blob(["\uFEFF"+rows.map(row=>row.map(csvCell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="MRPST_"+(terms.find(x=>x.id===termId)?.term_code||"grades")+"_grades.csv";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
 };

 const saveScores=async()=>{
  if(!db||!termId||!courseId||!canManage)return;
  const rows=inputStudents.filter(student=>String(inputValues[student.id]??"").trim()!=="").map(student=>({student_id:student.id,course_id:courseId,term_id:termId,score:Number(inputValues[student.id]),entered_by:gradeByKey.get(student.id+"|"+courseId)?.entered_by??currentUserId}));
  if(rows.some(x=>!Number.isFinite(x.score)||x.score<0||x.score>100)){setError("점수는 0점부터 100점 사이의 숫자로 입력해 주세요.");return;}
  const changed=rows.filter(row=>{const old=gradeByKey.get(row.student_id+"|"+courseId);return !old||Number(old.score)!==row.score;});
  if(!changed.length){setNotice("변경된 점수가 없습니다.");return;}
  setSaving(true);setError("");setNotice("");
  try{const {error}=await db.from("academic_grades").upsert(changed,{onConflict:"student_id,course_id,term_id"});if(error)throw error;setNotice(changed.length+"명의 성적을 저장했습니다.");await load();}
  catch(err:any){setError(err?.message||"성적 저장에 실패했습니다.");}
  finally{setSaving(false);}
 };

 const deleteScore=async(student:Student)=>{
  if(!db||!canManage||!window.confirm(student.full_name+" 학생의 이 과목 성적을 삭제할까요?"))return;
  setSaving(true);setError("");setNotice("");
  try{const {error}=await db.from("academic_grades").delete().eq("student_id",student.id).eq("course_id",courseId).eq("term_id",termId);if(error)throw error;setNotice("성적을 삭제했습니다.");await load();}
  catch(err:any){setError(err?.message||"성적 삭제에 실패했습니다.");}
  finally{setSaving(false);}
 };

 const stats=useMemo(()=>{
  const entered=visibleStudents.reduce((sum,student)=>sum+visibleCourses.filter(course=>gradeByKey.has(student.id+"|"+course.id)).length,0);
  const possible=visibleStudents.length*visibleCourses.length;
  const scores=visibleStudents.flatMap(student=>visibleCourses.map(course=>gradeByKey.get(student.id+"|"+course.id)?.score).filter((v):v is number=>v!==null&&v!==undefined));
  return {students:visibleStudents.length,courses:visibleCourses.length,entered,missing:Math.max(0,possible-entered),average:scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null};
 },[visibleStudents,visibleCourses,gradeByKey]);

 return <div className={styles.workspace}>
  <div className={styles.heading}>
   <div><span className={styles.eyebrow}>ACADEMIC RECORDS</span><h2>성적관리</h2><p>학과·학년·학기별 성적을 조회하고 과목별 점수를 일괄 입력합니다. 공식 학번은 추후 등록하며, 현재는 순번으로 구분합니다.</p></div>
   <span className={styles.permission}>행정 담당자 전용 입력</span>
  </div>
  <div className={styles.filters}>
   <label>학년도 / 학기<select value={termId} onChange={e=>setTermId(e.target.value)}><option value="">학기 선택</option>{terms.map(x=><option key={x.id} value={x.id}>{x.name} ({x.academic_year})</option>)}</select></label>
   <label>학과<select value={departmentId} onChange={e=>{setDepartmentId(e.target.value);setSelectedStudentId("");}}><option value="">학과 선택</option>{departments.map(x=><option key={x.id} value={x.id}>{x.name_ko||x.name_en||x.code}</option>)}</select></label>
   <label>학년<select value={level} onChange={e=>{setLevel(e.target.value);setSelectedStudentId("");}}><option value="">전체 학년</option>{levels.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
  </div>
  <div className={styles.stats}>
   <article><span>학생</span><strong>{stats.students}</strong></article>
   <article><span>과목</span><strong>{stats.courses}</strong></article>
   <article><span>입력 점수</span><strong>{stats.entered}</strong></article>
   <article><span>미입력</span><strong>{stats.missing}</strong></article>
  </div>
  {error&&<div className={styles.alertError}>{error}</div>}{notice&&<div className={styles.alertSuccess}>{notice}</div>}
  {!db&&<div className={styles.alert}>Supabase 연결 설정이 필요합니다.</div>}
  {!canManage&&db&&<div className={styles.alert}>성적관리 권한이 확인되지 않았습니다. Super Admin 또는 행정 담당자 계정으로 로그인해 주세요.</div>}
  <div className={styles.tabs}><button className={tab==="lookup"?styles.activeTab:""} onClick={()=>setTab("lookup")}>성적 조회</button><button className={tab==="entry"?styles.activeTab:""} onClick={()=>setTab("entry")}>과목별 성적 입력</button></div>
  {tab==="lookup"&&<section className={styles.panel}>
   <div className={styles.panelHead}><div><h3>학생별 성적 조회</h3><p>학생을 선택하면 과목별 점수와 미입력 과목을 확인할 수 있습니다.</p></div><div className={styles.actions}><button onClick={exportCsv} disabled={!visibleStudents.length}>엑셀용 CSV</button><button onClick={()=>window.print()}>인쇄</button></div></div>
   <input className={styles.search} value={search} onChange={e=>setSearch(e.target.value)} placeholder="학생 이름 또는 순번 검색"/>
   {loading?<p className={styles.empty}>데이터를 불러오는 중입니다…</p>:<div className={styles.tableWrap}><table><thead><tr><th>순번</th><th>학생 이름</th><th>학년</th><th>입력 과목</th><th>평균 점수</th><th></th></tr></thead><tbody>
    {visibleStudents.map(student=>{const scores=visibleCourses.map(course=>gradeByKey.get(student.id+"|"+course.id)?.score).filter((v):v is number=>v!==null&&v!==undefined);const average=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null;return <tr key={student.id} className={selectedStudentId===student.id?styles.selectedRow:""}><td>{student.student_number}</td><td><button className={styles.nameButton} onClick={()=>setSelectedStudentId(student.id)}>{student.full_name}</button></td><td>{student.cohort||"—"}</td><td>{scores.length} / {visibleCourses.length}</td><td>{average===null?"—":average.toFixed(2)}</td><td><button className={styles.smallButton} onClick={()=>setSelectedStudentId(student.id)}>상세</button></td></tr>;})}
    {!visibleStudents.length&&<tr><td colSpan={6} className={styles.empty}>선택한 조건에 해당하는 학생이 없습니다.</td></tr>}
   </tbody></table></div>}
   {selectedStudent&&<div className={styles.detail}>
    <div className={styles.panelHead}><div><h3>{selectedStudent.full_name}</h3><p>순번 {selectedStudent.student_number} · {department?.name_ko||department?.name_en||""} · {selectedStudent.cohort||""}</p></div><button onClick={()=>setSelectedStudentId("")}>닫기</button></div>
    <div className={styles.tableWrap}><table><thead><tr><th>과목 코드</th><th>과목명</th><th>점수</th><th>상태</th></tr></thead><tbody>
     {studentCourses.map(({course,grade})=><tr key={course.id}><td>{course.course_code}</td><td>{course.title}</td><td>{grade?.score??"—"}</td><td>{grade?.score===null||grade?.score===undefined?<span className={styles.missing}>미입력</span>:<span className={styles.complete}>입력 완료</span>}</td></tr>)}
     {!studentCourses.length&&<tr><td colSpan={4} className={styles.empty}>등록된 과목이 없습니다.</td></tr>}
    </tbody></table></div>
   </div>}
  </section>}
  {tab==="entry"&&<section className={styles.panel}>
   <div className={styles.panelHead}><div><h3>과목별 일괄 입력</h3><p>과목을 선택하면 선택한 학과·학년의 학생 목록이 표시됩니다. 점수는 0~100점, 소수점 입력을 지원합니다.</p></div></div>
   <div className={styles.entryFilters}>
    <label>과목<select value={courseId} onChange={e=>setCourseId(e.target.value)}><option value="">과목 선택</option>{visibleCourses.map(x=><option key={x.id} value={x.id}>{x.course_code} · {x.title}</option>)}</select></label>
   </div>
   {currentCourse&&<div className={styles.entryTitle}><strong>{currentCourse.title}</strong><span>{currentCourse.course_code} · {terms.find(x=>x.id===termId)?.name||"학기 미선택"}</span></div>}
   <div className={styles.tableWrap}><table><thead><tr><th>순번</th><th>학생 이름</th><th>점수</th><th>기존 점수</th><th>작업</th></tr></thead><tbody>
    {inputStudents.map(student=>{const old=gradeByKey.get(student.id+"|"+courseId);return <tr key={student.id}><td>{student.student_number}</td><td>{student.full_name}</td><td><input className={styles.scoreInput} type="number" min="0" max="100" step="0.01" value={inputValues[student.id]??""} onChange={e=>setInputValues(v=>({...v,[student.id]:e.target.value}))} aria-label={student.full_name+" 점수"}/></td><td>{old?.score??"—"}</td><td>{old&&<button className={styles.deleteButton} disabled={saving} onClick={()=>void deleteScore(student)}>삭제</button>}</td></tr>;})}
    {!inputStudents.length&&<tr><td colSpan={5} className={styles.empty}>{!termId?"먼저 학기를 선택하세요.":!courseId?"과목을 선택하세요.":"선택한 학과·학년에 등록된 학생이 없습니다."}</td></tr>}
   </tbody></table></div>
   <div className={styles.saveRow}><span>{inputStudents.length}명 · 빈 칸은 저장하지 않습니다.</span><button className={styles.primary} disabled={!canManage||saving||!inputStudents.length||!courseId||!termId} onClick={()=>void saveScores()}>{saving?"저장 중…":"변경 점수 저장"}</button></div>
  </section>}
  {loading&&<p className={styles.loading}>성적 데이터를 불러오는 중입니다.</p>}
  <p className={styles.footnote}>현재는 점수만 관리합니다. 학점, 등급 환산 및 GPA 계산은 적용하지 않습니다. 미입력 점수는 0점으로 처리하지 않습니다.</p>
 </div>;
}
