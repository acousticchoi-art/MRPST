"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";

type Student={id:string;student_number:string;full_name:string;program:string|null;program_code:string|null;cohort:string|null;current_semester:number|null;student_status:string};
export default function SemesterProgressionPanel({canManage}:{canManage:boolean}){
 const supabase=useMemo(()=>createSupabaseBrowserClient(),[]);
 const academicMutationsEnabled=process.env.NEXT_PUBLIC_MRPST_ACADEMIC_MUTATIONS_ENABLED!=="false";
 const [students,setStudents]=useState<Student[]>([]);
 const [terms,setTerms]=useState<any[]>([]),[termRows,setTermRows]=useState<any[]>([]),[courseRows,setCourseRows]=useState<any[]>([]),[gradeRows,setGradeRows]=useState<any[]>([]);
 const [selectedTermId,setSelectedTermId]=useState(""),[termBusy,setTermBusy]=useState(false),[loading,setLoading]=useState(true);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const loadTermData=useCallback(async()=>{
  if(!supabase)return;setLoading(true);setError("");
  try{
   const [studentsResult,t,e,a,g]=await Promise.all([
    supabase.from("students").select("id,student_number,full_name,program,program_code,cohort,current_semester,student_status"),
    supabase.from("academic_terms").select("id,term_code,name,academic_year,status").order("academic_year",{ascending:false}),
    supabase.from("student_term_enrollments").select("*"),
    supabase.from("academic_enrollments").select("student_id,course_id,term_id,enrollment_status"),
    supabase.from("academic_grades").select("student_id,course_id,term_id,score")
   ]);
   for(const item of [studentsResult,t,e,a,g])if(item.error)throw item.error;
   setStudents((studentsResult.data??[]) as Student[]);
   setTerms(t.data??[]);setTermRows(e.data??[]);setCourseRows(a.data??[]);setGradeRows(g.data??[]);
   setSelectedTermId(current=>current||((t.data?.find(x=>x.status==="active")??t.data?.[0])?.id??""));
  }catch(err:any){setError(err.message||"학기 데이터 조회에 실패했습니다.");}finally{setLoading(false);}
 },[supabase]);
 useEffect(()=>{void loadTermData();},[loadTermData]);
  const selectedTerm=terms.find(t=>t.id===selectedTermId)??null;
 const cohortBaseSemester=(s:Student):number|null=>s.cohort==="First Year"?1:s.cohort==="Second Year"?3:s.cohort==="Third Year"&&(s.program_code==="theology"||s.program_code==="mdiv")?5:s.cohort==="Fourth Year"&&s.program_code==="theology"&&!(s.program||"").toLowerCase().includes("diploma")?7:null;
 const cohortSemester=(s:Student):number|null=>s.current_semester??cohortBaseSemester(s);
 const termNumber=selectedTerm?Number((selectedTerm.term_code.match(/([12])$/)||[])[1]||0):0;
 const termEnrollmentFor=(s:Student)=>termRows.find(r=>r.student_id===s.id&&r.academic_year===selectedTerm?.academic_year&&r.term_number===termNumber);
 const courseStatsFor=(s:Student)=>{const regs=courseRows.filter(r=>r.student_id===s.id&&r.term_id===selectedTermId&&r.enrollment_status!=="withdrawn");const completed=regs.filter(r=>r.enrollment_status==="completed").length;const missing=regs.filter(r=>!gradeRows.some(g=>g.student_id===s.id&&g.course_id===r.course_id&&g.term_id===selectedTermId&&g.score!==null&&g.score!==undefined)).length;return {total:regs.length,completed,missing};};

  const registerTerm=async(s:Student)=>{if(!academicMutationsEnabled||!canManage){setNotice("학사 데이터 변경은 개발 DB 연결 및 기능 활성화 후 사용할 수 있습니다.");return;}const baseSemester=cohortBaseSemester(s);const startingSemester=s.current_semester??baseSemester;const termSemester=startingSemester||null;if(!supabase||!selectedTerm||!termNumber||!termSemester)return;if(s.student_status!=="active"){setError("재학 상태의 학생만 새 학기에 등록할 수 있습니다.");return;}setTermBusy(true);setError("");try{const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)throw new Error("로그인이 필요합니다.");const exists=termEnrollmentFor(s);if(exists){if(Number(exists.semester_number)!==termSemester)throw new Error("기존 학기 등록의 학기 번호가 현재 학년 기준과 다릅니다. 기존 기록을 확인하세요.");throw new Error("이미 해당 학기 기록이 있습니다. 기존 기록을 먼저 확인하세요.");}const {data:created,error}=await supabase.from("student_term_enrollments").insert({student_id:s.id,academic_year:selectedTerm.academic_year,term_number:termNumber,semester_number:termSemester,enrollment_status:"enrolled",created_by:user.id}).select("id,student_id,academic_year,term_number,semester_number,enrollment_status").single();if(error)throw error;if(!created?.id||created.student_id!==s.id||created.academic_year!==selectedTerm.academic_year||created.term_number!==termNumber||created.semester_number!==termSemester||created.enrollment_status!=="enrolled")throw new Error("학기 등록 저장 결과를 확인할 수 없습니다.");setNotice(s.full_name+" 학생의 "+selectedTerm.name+" 학기 등록을 생성했습니다.");await loadTermData();}catch(e:any){setError(e.message||"학기 등록 실패");}finally{setTermBusy(false);}};
 const completeTerm=async(s:Student)=>{if(!academicMutationsEnabled||!canManage){setNotice("학사 데이터 변경은 개발 DB 연결 및 기능 활성화 후 사용할 수 있습니다.");return;}if(!supabase||!selectedTerm||!termNumber)return;setTermBusy(true);setError("");try{const {error}=await supabase.rpc("mrpst_complete_student_semester",{p_student_id:s.id,p_academic_year:selectedTerm.academic_year,p_term_number:termNumber});if(error)throw error;const {data:verified,error:verifyError}=await supabase.from("student_term_enrollments").select("id,student_id,academic_year,term_number,semester_number,enrollment_status,completed_at").eq("student_id",s.id).eq("academic_year",selectedTerm.academic_year).eq("term_number",termNumber).eq("semester_number",s.current_semester).maybeSingle();if(verifyError)throw verifyError;if(!verified||verified.student_id!==s.id||verified.enrollment_status!=="completed"||!verified.completed_at)throw new Error("학기 이수 확정 결과를 확인할 수 없습니다.");setNotice(s.full_name+" 학생의 학기 이수 확정을 확인했습니다.");await loadTermData();}catch(e:any){setError(e.message||"학기 이수 확정 실패");}finally{setTermBusy(false);}};
 const advanceTerm=async(s:Student)=>{if(!academicMutationsEnabled||!canManage){setNotice("학사 데이터 변경은 개발 DB 연결 및 기능 활성화 후 사용할 수 있습니다.");return;}if(!supabase||!selectedTerm||!termNumber)return;setTermBusy(true);setError("");try{const {data,error}=await supabase.rpc("mrpst_advance_student_semester",{p_student_ids:[s.id],p_academic_year:selectedTerm.academic_year,p_term_number:termNumber});if(error)throw error;const outcome=data?.[0]?.result??"진급 처리 결과를 확인하세요";if(outcome==="학기 진급 완료"){const nextSemester=Number(data[0].next_semester);const {data:verified,error:verifyError}=await supabase.from("students").select("id,current_semester").eq("id",s.id).single();if(verifyError)throw verifyError;if(!verified||verified.id!==s.id||verified.current_semester!==nextSemester)throw new Error("진급 후 학기 번호가 일치하지 않습니다.");}setNotice(s.full_name+" · "+outcome);await loadTermData();}catch(e:any){setError(e.message||"학기 진급 처리 실패");}finally{setTermBusy(false);}};


 return <div className="student-workspace">
  {error&&<div className="student-alert error" role="alert">{error}</div>}
  {notice&&<div className="student-alert success" role="status">{notice}</div>}
  {loading&&<div className="student-empty">학기 관리 자료를 불러오는 중입니다…</div>}
  <section className="student-panel student-semester-panel"><div className="student-panel-head"><div><span className="eyebrow">SEMESTER PROGRESSION</span><h4>선택 학기 이수 및 진급</h4><p>수강과 성적을 확인한 뒤, 학생별 학기 등록·이수 확정·진급을 순서대로 처리합니다.</p></div><span className="student-readonly">학사 데이터 연결</span></div>
  <div className="student-semester-toolbar"><label htmlFor="semester-term-select"><span>대상 학기</span><select id="semester-term-select" value={selectedTermId} onChange={e=>setSelectedTermId(e.target.value)}><option value="">학기 선택</option>{terms.map(t=><option key={t.id} value={t.id}>{t.name||t.term_code} · {t.status}</option>)}</select></label><button className="student-semester-refresh" onClick={()=>void loadTermData()} disabled={termBusy}>↻ 새로고침</button><div className="student-semester-guide"><strong>{selectedTerm?.name||"학기를 선택하세요"}</strong><span>{selectedTerm?"재학생 "+students.filter(s=>s.student_status==="active").length+"명 · 수강 및 성적 현황을 기준으로 처리":"먼저 처리할 학사 학기를 선택하세요"}</span></div></div>
  <div className="student-table-wrap student-semester-table-wrap"><table className="student-table student-semester-table"><thead><tr><th>학생</th><th>과정 · 학년</th><th>현재 학기</th><th>수강 현황</th><th>점수 입력</th><th>처리 상태</th><th>다음 작업</th></tr></thead><tbody>{students.filter(s=>s.student_status==="active").map(s=>{const row=termEnrollmentFor(s),stats=courseStatsFor(s),sem=cohortSemester(s),maxSem=s.program_code==='ece'?4:s.program_code==='mdiv'?6:s.program_code==='theology'&&(s.program||'').toLowerCase().includes('diploma')?4:8;const recordLabel=row?row.enrollment_status==="completed"?"이수 완료":"등록됨":"미등록";return <tr key={s.id}><td><strong>{s.full_name}</strong><small>{s.student_number}</small></td><td>{s.program||s.program_code||"—"}<small>{s.cohort||"학년 미설정"}</small></td><td><b>{sem??"미설정"}</b></td><td><strong>{stats.completed}/{stats.total}</strong><small>과목 이수</small></td><td><span className={stats.missing?"student-semester-alert":"student-semester-clear"}>{stats.missing?stats.missing+"건 누락":"입력 완료"}</span></td><td><span className={row?.enrollment_status==="completed"?"student-semester-complete":row?"student-semester-enrolled":"student-semester-pending"}>{recordLabel}</span></td><td><div className="student-row-actions">
  {!row&&<button disabled={!academicMutationsEnabled||!canManage||!selectedTerm||!sem||termBusy} onClick={()=>void registerTerm(s)}>학기 등록</button>}
  {row?.enrollment_status==="enrolled"&&<button disabled={!academicMutationsEnabled||!canManage||termBusy||!selectedTerm||stats.total===0||stats.completed!==stats.total||stats.missing>0} onClick={()=>void completeTerm(s)}>이수 확정</button>}
  {row?.enrollment_status==="completed"&&sem!==null&&row.semester_number===sem&&sem<maxSem&&<button disabled={!academicMutationsEnabled||!canManage||termBusy||!selectedTerm} onClick={()=>void advanceTerm(s)}>진급 처리</button>}
  {row?.enrollment_status==="completed"&&sem!==null&&row.semester_number===sem&&sem>=maxSem&&<span className="student-readonly">졸업 심사 대상</span>}
  {row?.enrollment_status==="completed"&&row.semester_number!==sem&&<span className="student-readonly">진급 완료</span>}
  </div></td></tr>})}</tbody></table>{!selectedTerm&&<div className="student-empty">먼저 학기를 선택하세요.</div>}</div>
  <div className="student-semester-notes"><span>작업 권한이 없거나 기능이 비활성화된 경우 버튼을 사용할 수 없습니다.</span><span>이수 확정은 모든 과목 이수 및 점수 입력 후에 가능합니다.</span></div></section>
 </div>;
}
