"use client";
import AdminModuleHeading from "./AdminModuleHeading";

import {useCallback,useEffect,useMemo,useState} from "react";
import {createPortal} from "react-dom";
import {usePathname} from "next/navigation";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";
import {AdminFormActions,FormField} from "./AdminUI";
import GraduateBulkImport from "./GraduateBulkImport";

type Student={id:string;auth_user_id:string|null;program_code:string|null;current_semester:number|null;student_number:string;full_name:string;full_name_my:string|null;full_name_en:string|null;gender:string|null;date_of_birth:string|null;admission_year:number|null;program:string|null;cohort:string|null;student_status:string;phone:string|null;email:string|null;guardian_name:string|null;guardian_phone:string|null;notes:string|null;graduation_year:number|null;graduation_term:number|null;graduation_date:string|null;graduation_number:string|null};
type StatusHistory={id:string;student_id:string;previous_status:string|null;new_status:string;effective_date:string;reason:string|null;created_at:string};
type Graduation={id:string;student_id:string;program_code:string;graduation_year:number;graduation_term:number;graduation_date:string|null;degree_name:string|null;graduation_number:string|null;honors:string|null;notes:string|null;approved_at:string};
type Award={award_id:string;student_id:string;academic_year:number;scholarship_name:string;base_amount:number;paid_amount:number;remaining_amount:number;status:string};
const statusLabel:Record<string,string>={active:"재학",leave:"휴학",graduated:"졸업",withdrawn:"자퇴"};
const awardLabel:Record<string,string>={draft:"임시저장",submitted:"결재대기",approved:"승인",rejected:"반려",completed:"지급 완료",cancelled:"취소"};
const money=(n:number)=>new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(Number(n)||0);
const yearFirstSemester:Record<string,number>={"First Year":1,"Second Year":3,"Third Year":5,"Fourth Year":7};
const yearOptions=[["First Year","1학년"],["Second Year","2학년"],["Third Year","3학년"],["Fourth Year","4학년"]] as const;
const emptyProfile={student_number:"",full_name:"",full_name_en:"",full_name_my:"",gender:"unspecified",date_of_birth:"",admission_year:String(new Date().getFullYear()),program:"",cohort:"",student_status:"active",phone:"",email:"",guardian_name:"",guardian_phone:"",notes:""};

export default function StudentModule(){
 const supabase=useMemo(()=>createSupabaseBrowserClient(),[]);
 const locale=usePathname().startsWith("/my/")?"my":"ko";
 const academicMutationsEnabled=process.env.NEXT_PUBLIC_MRPST_ACADEMIC_MUTATIONS_ENABLED!=="false";
 const [students,setStudents]=useState<Student[]>([]),[records,setRecords]=useState<any[]>([]),[awards,setAwards]=useState<Award[]>([]),[graduations,setGraduations]=useState<Graduation[]>([]),[statusHistory,setStatusHistory]=useState<StatusHistory[]>([]);
 const [selectedId,setSelectedId]=useState(""),[tab,setTab]=useState("profiles"),[search,setSearch]=useState(""),[directory,setDirectory]=useState<"current"|"graduates">("current");
 const [canManage,setCanManage]=useState(false);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [profileOpen,setProfileOpen]=useState(false),[editingStudent,setEditingStudent]=useState(""),[profile,setProfile]=useState<any>(emptyProfile);
 const [accountOpen,setAccountOpen]=useState(false),[accountEmail,setAccountEmail]=useState(""),[accountPassword,setAccountPassword]=useState(""),[accountBusy,setAccountBusy]=useState(false);
 const load=useCallback(async()=>{setLoading(true);setError("");try{
  // 브라우저에서 Supabase로 직접 요청하지 않고 동일 출처의 Vercel API를 통해 조회합니다.
  const response=await fetch("/api/admin/students",{method:"GET",cache:"no-store",credentials:"same-origin",headers:{Accept:"application/json"}});
  const payload=await response.json().catch(()=>({error:"서버 응답을 읽을 수 없습니다."}));
  if(!response.ok)throw new Error(payload.error||`학생 데이터 조회 실패 (HTTP ${response.status})`);
  setCanManage(payload.canManage===true);
  const errors:string[]=[];
  const s=payload.students,r=payload.grades,a=payload.scholarships,g=payload.graduations,h=payload.statusHistory;
  if(s?.error)errors.push("학생 명부: "+s.error);
  else{
   const rows=(s?.data??[]) as Student[];
   setStudents(rows);
   if(selectedId&&!rows.some(x=>x.id===selectedId))setSelectedId("");
  }
  if(r?.error)errors.push("성적 조회: "+r.error);
  else setRecords(((r?.data??[]) as any[]).map(x=>({id:x.id,student_id:x.student_id,academic_year:x.academic_year??x.academic_terms?.academic_year??0,term:x.term??x.academic_terms?.name??x.academic_terms?.term_code??"",course_code:x.course_code??x.academic_courses?.course_code??null,course_name:x.course_name??x.academic_courses?.title??"",credits:x.credits??x.academic_courses?.credits??null,enrollment_status:x.enrollment_status??"",score:x.score,grade:x.grade,remarks:x.remarks})));
  if(a?.error)errors.push("장학금 조회: "+a.error);
  else setAwards((a?.data??[]) as Award[]);
  if(g?.error)errors.push("졸업 이력 조회: "+g.error);
  else setGraduations((g?.data??[]) as Graduation[]);
  if(h?.error)errors.push("학적 변동 이력 조회: "+h.error);
  else setStatusHistory((h?.data??[]) as StatusHistory[]);
  setError(errors.join(" · "));
 }catch(e:any){setError(e?.message||String(e)||"데이터를 불러오지 못했습니다. 다시 시도해 주세요.");}finally{setLoading(false);}},[selectedId]);
 useEffect(()=>{void load();},[load]);
 const selected=students.find(s=>s.id===selectedId)??null;
 const currentStudents=students.filter(s=>s.student_status==="active");
 const graduateStudents=students.filter(s=>s.student_status==="graduated"||graduations.some(g=>g.student_id===s.id));
 const directoryStudents=directory==="current"?currentStudents:graduateStudents;
 const displayStudentName=(s:Student)=>locale==="my"?(s.full_name_my||s.full_name):s.full_name;
 const visible=directoryStudents.filter(s=>!search.trim()||[s.student_number,s.full_name,s.full_name_en,s.full_name_my,s.program,s.cohort].some(v=>(v??"").toLowerCase().includes(search.toLowerCase())));
 const studentRecords=records.filter(r=>r.student_id===selectedId),studentAwards=awards.filter(a=>a.student_id===selectedId),studentGraduations=graduations.filter(g=>g.student_id===selectedId),studentStatusHistory=statusHistory.filter(h=>h.student_id===selectedId);
 const activeStudents=currentStudents.length,graduatedStudentCount=graduateStudents.length;
 const openStudent=(id:string)=>{setSelectedId(id);setTab("profiles");};
 const setP=(k:string,v:string)=>setProfile((old:any)=>({...old,[k]:v}));
 const newProfile=()=>{setEditingStudent("");setProfile({...emptyProfile});setProfileOpen(true);};
 const editProfile=(s:Student)=>{setEditingStudent(s.id);setProfile({student_number:s.student_number,full_name:s.full_name,full_name_en:s.full_name_en??"",full_name_my:s.full_name_my??"",gender:s.gender??"unspecified",date_of_birth:s.date_of_birth??"",admission_year:s.admission_year?String(s.admission_year):"",program:s.program??(s.program_code==="ece"?"Early Childhood Education":s.program_code==="mdiv"?"Master of Divinity":s.program_code==="theology"?"Theology":""),cohort:s.cohort??"",student_status:s.student_status,phone:s.phone??"",email:s.email??"",guardian_name:s.guardian_name??"",guardian_phone:s.guardian_phone??"",notes:s.notes??""});setProfileOpen(true);};
 const saveProfile=async()=>{if(!supabase||!academicMutationsEnabled||!canManage){setNotice("학생 정보 변경은 개발 DB 분리 및 안전성 검증 전까지 잠겨 있습니다.");return;}setSaving(true);setError("");try{
  const normalizedStudentNumber=profile.student_number.trim();
  const duplicateQuery=await supabase.from("students").select("id,student_number").eq("student_number",normalizedStudentNumber).limit(1);
  if(duplicateQuery.error)throw duplicateQuery.error;
  const duplicate=duplicateQuery.data?.find((row:any)=>row.id!==editingStudent);
  if(duplicate){throw new Error("이미 등록된 학번입니다. 기존 학생 정보를 확인해 주세요.");}
  const programCode=/early childhood|ece/i.test(profile.program)?"ece":/m\.?div|master of divinity/i.test(profile.program)?"mdiv":/theology|신학|diploma/i.test(profile.program)?"theology":null;
  const nextCohort=profile.cohort.trim();
  const nextSemester=yearFirstSemester[nextCohort]??null;
  const programMaxSemester=programCode==="ece"||/diploma/i.test(profile.program)?4:programCode==="mdiv"?6:programCode==="theology"?8:null;
  if(nextSemester&&programMaxSemester&&nextSemester>programMaxSemester)throw new Error("선택한 학년은 해당 교육과정의 최대 학년을 초과합니다.");
  const previousStudent=students.find(student=>student.id===editingStudent);
  const yearOrProgramChanged=!previousStudent||previousStudent.cohort!==nextCohort||previousStudent.program_code!==programCode;
  const payload={student_number:profile.student_number.trim(),full_name:profile.full_name.trim(),full_name_en:profile.full_name_en.trim()||null,full_name_my:profile.full_name_my.trim()||null,gender:profile.gender,date_of_birth:profile.date_of_birth||null,admission_year:profile.admission_year?Number(profile.admission_year):null,program:profile.program.trim()||null,program_code:programCode,cohort:nextCohort||null,...(yearOrProgramChanged?{current_semester:nextSemester&&programCode?nextSemester:null}:{}),phone:profile.phone.trim()||null,email:profile.email.trim()||null,guardian_name:profile.guardian_name.trim()||null,guardian_phone:profile.guardian_phone.trim()||null,notes:profile.notes.trim()||null};
  if(editingStudent){const x=await supabase.from("students").update(payload).eq("id",editingStudent).select("id,student_number,full_name").single();if(x.error)throw x.error;if(!x.data?.id||x.data.id!==editingStudent||x.data.student_number!==payload.student_number||x.data.full_name!==payload.full_name)throw new Error("학생 정보 수정 결과를 확인할 수 없습니다.");setSelectedId(editingStudent);setNotice("학생 정보를 수정했습니다.");}
  else{const {data:u}=await supabase.auth.getUser();const x=await supabase.from("students").insert({...payload,created_by:u.user?.id}).select("id").single();if(x.error)throw x.error;setSelectedId(x.data.id);setNotice("학생을 등록했습니다.");}
  setProfileOpen(false);await load();
 }catch(e:any){setError(e.code==="23505"?"이미 등록된 학번입니다. 학번을 확인해 주세요.":e.message??"학생 정보 저장에 실패했습니다.");}finally{setSaving(false);}};
 const changeStudentStatus=async(nextStatus:"active"|"leave"|"withdrawn")=>{
  if(!academicMutationsEnabled||!canManage){setNotice("학적 상태 변경은 개발 DB 분리 및 안전성 검증 전까지 잠겨 있습니다.");return;}
  if(!supabase||!selected)return;
  const label=statusLabel[nextStatus];
  if(!window.confirm(window.location.pathname.startsWith("/en/")?("Change "+selected.full_name+"'s enrollment status to "+(({active:"Enrolled",leave:"On leave",graduated:"Graduated",withdrawn:"Withdrawn"} as Record<string,string>)[nextStatus]||nextStatus)+"? The change history will be retained."):locale==="my"?(selected.full_name_my||selected.full_name)+" ၏ ကျောင်းသားအခြေအနေကို "+(({active:"ကျောင်းတက်",leave:"ကျောင်းနား",graduated:"ဘွဲ့ရ",withdrawn:"ကျောင်းထွက်"} as Record<string,string>)[nextStatus]||nextStatus)+" အဖြစ် ပြောင်းမလား။ ပြောင်းလဲမှုမှတ်တမ်းကို ထိန်းသိမ်းထားပါမည်။":selected.full_name+" 학생을 "+label+" 상태로 변경할까요? 변경 이력은 자동으로 보존됩니다."))return;
  setSaving(true);setError("");
  try{const {data:changed,error}=await supabase.rpc("mrpst_change_student_status",{p_student_id:selected.id,p_new_status:nextStatus,p_effective_date:new Date().toISOString().slice(0,10),p_reason:"관리자 학적 상태 변경"});if(error)throw error;const {data:verified,error:verifyError}=await supabase.from("students").select("id,student_status").eq("id",selected.id).single();if(verifyError)throw verifyError;if(!verified||verified.id!==selected.id||verified.student_status!==nextStatus)throw new Error("학적 변경 결과를 확인할 수 없습니다.");setNotice(changed===false?"이미 해당 학적 상태입니다.":(locale==="my"?"ကျောင်းသားအခြေအနေကို ပြောင်းလဲပြီးပါပြီ။":"학생을 "+label+" 상태로 변경했습니다."));await load();}
  catch(e:any){setError(e.message||"학적 상태 변경에 실패했습니다.");}
  finally{setSaving(false);}
};
const archiveStudent=async()=>changeStudentStatus("withdrawn");
 const issueStudentAccount=async()=>{if(!canManage){setError("학생 계정 발급 권한이 없습니다.");return;}if(!selected)return;setAccountBusy(true);setError("");try{const response=await fetch("/api/admin/manage-user",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({action:"create_student",student_id:selected.id,email:accountEmail.trim(),password:accountPassword})});const data=await response.json().catch(()=>({error:"계정 관리 서버의 응답을 읽을 수 없습니다."}));if(!response.ok||data?.error)throw new Error(data?.error||"학생 계정 발급에 실패했습니다.");setNotice(data?.audit_warning||"학생 로그인 계정과 도서관 회원 계정을 함께 연결했습니다.");setAccountOpen(false);setAccountPassword("");setAccountEmail("");await load();}catch(e:any){setError(e.message??"학생 계정 발급에 실패했습니다.");}finally{setAccountBusy(false);}};
 const input=(label:string,key:string,type="text")=><FormField label={label}><input type={type} value={profile[key]??""} disabled={!canManage||!academicMutationsEnabled||saving} onChange={e=>setP(key,e.target.value)}/></FormField>;
 return <div className="student-workspace">
  <header className="student-page-head"><div><AdminModuleHeading moduleKey="students"/></div><button className="student-primary" disabled={!academicMutationsEnabled||!canManage} onClick={newProfile}>＋ 학생 등록</button></header>
  <GraduateBulkImport canManage={canManage} enabled={academicMutationsEnabled} onDone={load}/>
  <section className="student-overview student-overview-academic" aria-label="학생 현황"><article><span>재학생</span><strong>{currentStudents.length}</strong><small>현재 재학 상태</small></article><article><span>졸업생</span><strong>{graduatedStudentCount}</strong><small>졸업 확정 기록 포함</small></article><article><span>전체 학생</span><strong>{students.length}</strong><small>재학 상태 {activeStudents}명</small></article></section>
  {error&&<div className="student-alert error">{error}</div>}{notice&&<div className="student-alert success">{notice}</div>}{!supabase&&<div className="student-alert">Supabase 환경변수를 설정하면 실제 학생 데이터를 사용할 수 있습니다.</div>}
  <div className="student-layout student-layout-roster">
   <section className="student-roster student-directory"><div className="student-directory-head"><div><h3>{directory==="current"?"재학생 명부":"졸업생 명부"} <span>{directoryStudents.length}</span></h3><p>{directory==="current"?"현재 재학 상태인 학생입니다. 학생을 선택하면 수강 이력을 바로 볼 수 있습니다.":"졸업 확정 기록과 졸업 학적을 기준으로 표시합니다."}</p></div><span>{visible.length}명 표시</span></div><div className="student-directory-tools"><div className="student-directory-switch" role="tablist" aria-label="학생 명부 구분"><button role="tab" aria-selected={directory==="current"} className={directory==="current"?"selected":""} onClick={()=>{setDirectory("current");setSearch("");}}>재학생 <b>{currentStudents.length}</b></button><button role="tab" aria-selected={directory==="graduates"} className={directory==="graduates"?"selected":""} onClick={()=>{setDirectory("graduates");setSearch("");}}>졸업생 <b>{graduateStudents.length}</b></button></div><label className="student-directory-search"><span>검색</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="학번, 이름, 과정으로 검색"/></label></div>
    <div className="student-directory-table"><table><thead><tr><th>학번</th><th>학생</th><th>과정 · 학년</th><th>입학 연도</th><th>학적 상태</th><th><span className="sr-only">상세 보기</span></th></tr></thead><tbody>{visible.map(s=><tr key={s.id} className={selectedId===s.id?"active":""} onClick={()=>openStudent(s.id)} tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openStudent(s.id);}}} aria-label={displayStudentName(s)+(locale==="my"?" ကျောင်းသားအသေးစိတ်ကြည့်ရန်":" 학생 상세정보 보기")}><td>{s.student_number}</td><td><strong>{displayStudentName(s)}</strong><small>{s.full_name_en&&s.full_name_en!==displayStudentName(s)?s.full_name_en:""}</small></td><td><strong>{s.program||"과정 미지정"}</strong><small>{s.cohort||"학년 미지정"}</small></td><td>{s.admission_year??"—"}</td><td><span className={"student-status "+s.student_status}>{statusLabel[s.student_status]??s.student_status}</span></td><td><span className="student-directory-open">상세 보기 <b>→</b></span></td></tr>)}</tbody></table>{!loading&&!visible.length&&<div className="student-empty">검색 결과가 없습니다.</div>}</div>
   </section>
   {selected&&<div className="student-detail-overlay" role="dialog" aria-modal="true"><main className="student-detail student-detail-floating">
    {loading&&<div className="student-empty">학생 정보를 불러오는 중입니다…</div>}
    {!loading&&!selected&&<div className="student-empty large"><strong>등록된 학생이 없습니다.</strong><span>학생 등록을 눌러 첫 학생 정보를 입력하세요.</span></div>}
    {selected&&<>
     <div className="student-profile-head"><button className="student-detail-close" onClick={()=>setSelectedId("")} aria-label="상세정보 닫기">×</button><div><span className="student-number">학생 번호 · {selected.student_number}</span><h3>{displayStudentName(selected)} <span className={"student-status "+selected.student_status}>{statusLabel[selected.student_status]??selected.student_status}</span></h3><p><b>과정</b> {selected.program||"미지정"} <i>·</i> <b>학년</b> {selected.cohort||"미지정"} <i>·</i> <b>입학년도</b> {selected.admission_year??"미상"}</p></div><div className="student-profile-actions"><button disabled={!academicMutationsEnabled||!canManage} onClick={()=>editProfile(selected)}>정보 · 학년 수정</button>{selected.auth_user_id?<span className="student-readonly">로그인·도서관 계정 연결됨</span>:<button disabled={!canManage} onClick={()=>{setError("");setAccountEmail(selected.email??"");setAccountPassword("");setAccountOpen(true);}}>학생 계정 발급</button>}<a className="student-certificate-link" href={`/${locale}/admin/students/certificates/${selected.id}?type=${selected.student_status==="graduated"?"graduation":"enrollment"}`} target="_blank" rel="noopener noreferrer">증명서 출력</a><details className="student-status-actions"><summary>학적 관리</summary><div>{selected.student_status==="active"&&<button disabled={!academicMutationsEnabled||!canManage||saving} onClick={()=>void changeStudentStatus("leave")}>휴학 처리</button>}{selected.student_status==="leave"&&<button disabled={!academicMutationsEnabled||!canManage||saving} onClick={()=>void changeStudentStatus("active")}>재학 복귀</button>}{selected.student_status!=="withdrawn"&&selected.student_status!=="graduated"&&<button disabled={!academicMutationsEnabled||!canManage||saving} onClick={()=>void archiveStudent()}>자퇴 처리</button>}</div></details></div></div>
     <section className="student-at-a-glance" aria-label="학생 핵심 현황"><div><span className="eyebrow">AT A GLANCE</span><h4>한눈에 보기</h4></div><div className="student-summary-grid"><article><span>학업 기록</span><strong>{studentRecords.length}건</strong></article><article><span>장학금</span><strong>{studentAwards.length}건</strong></article><article><span>연락처</span><strong>{selected.phone||"미등록"}</strong></article><article><span>이메일</span><strong>{selected.email||"미등록"}</strong></article></div></section>
     <nav className="student-detail-tabs" aria-label={displayStudentName(selected)+(locale==="my"?" ကျောင်းသားစီမံခန့်ခွဲမှုမီနူး":" 학생 관리 메뉴")}><button className={tab==="profiles"?"selected":""} onClick={()=>setTab("profiles")}>기본 정보</button><button className={tab==="academics"?"selected":""} onClick={()=>setTab("academics")}>학업</button><button className={tab==="scholarships"?"selected":""} onClick={()=>setTab("scholarships")}>장학금</button><button className={tab==="graduations"?"selected":""} onClick={()=>setTab("graduations")}>졸업</button></nav>
     {tab==="profiles"&&<section className="student-panel"><div className="student-panel-head"><div><h4>학생 기본정보</h4><p>인적 사항과 보호자 연락처</p></div><button disabled={!academicMutationsEnabled||!canManage} onClick={()=>editProfile(selected)}>수정</button></div><div className="student-info-grid">
      <div><span>영문 이름</span><strong>{selected.full_name_en||"—"}</strong></div><div><span>미얀마어 이름</span><strong>{selected.full_name_my||"—"}</strong></div><div><span>성별</span><strong>{selected.gender==="male"?"남성":selected.gender==="female"?"여성":"미지정"}</strong></div><div><span>생년월일</span><strong>{selected.date_of_birth||"—"}</strong></div><div><span>전화번호</span><strong>{selected.phone||"—"}</strong></div><div><span>이메일</span><strong>{selected.email||"—"}</strong></div><div><span>보호자</span><strong>{selected.guardian_name||"—"}</strong></div><div><span>보호자 연락처</span><strong>{selected.guardian_phone||"—"}</strong></div><div className="full"><span>비고</span><strong>{selected.notes||"—"}</strong></div><div><span>학적 상태</span><strong>{statusLabel[selected.student_status]??selected.student_status}</strong></div>
     </div><div className="student-panel-head"><div><h4>학적 변동 이력</h4><p>휴학·복학·자퇴·졸업 처리 기록</p></div></div><div className="student-table-wrap"><table className="student-table"><thead><tr><th>적용일</th><th>변경 전</th><th>변경 후</th><th>사유</th></tr></thead><tbody>{studentStatusHistory.map(h=><tr key={h.id}><td>{h.effective_date}</td><td>{h.previous_status?statusLabel[h.previous_status]||h.previous_status:"신규"}</td><td>{statusLabel[h.new_status]||h.new_status}</td><td>{h.reason||"—"}</td></tr>)}</tbody></table>{!studentStatusHistory.length&&<div className="student-empty">학적 변동 이력이 없습니다.</div>}</div></section>}
     {tab==="academics"&&<section className="student-panel"><div className="student-panel-head"><div><h4>수강 이력</h4><p>등록된 수강 과목과 학기별 성적을 조회합니다. 학기 등록과 진급 처리는 학사 관리에서 진행합니다.</p></div><span className="student-readonly">성적관리 연동</span></div><div className="student-table-wrap"><table className="student-table"><thead><tr><th>학년도</th><th>학기</th><th>과목 코드</th><th>과목명</th><th>학점</th><th>수강 상태</th><th>점수</th><th>성적</th><th>비고</th></tr></thead><tbody>{studentRecords.map(r=><tr key={r.id}><td>{r.academic_year}</td><td>{r.term}</td><td>{r.course_code||"—"}</td><td>{r.course_name}</td><td>{r.credits??"—"}</td><td>{r.enrollment_status==="completed"?"이수 완료":r.enrollment_status==="enrolled"?"수강 중":r.enrollment_status||"—"}</td><td>{r.score??"—"}</td><td>{r.grade||"—"}</td><td>{r.remarks||"—"}</td></tr>)}</tbody></table>{!studentRecords.length&&<div className="student-empty">등록된 수강 이력이 없습니다.</div>}</div></section>}
     {tab==="graduations"&&<section className="student-panel"><div className="student-panel-head"><div><h4>공식 졸업 이력</h4><p>졸업 심사에서 최종 확정된 학위와 졸업 정보를 표시합니다.</p></div><span className="student-readonly">학사관리 연동</span></div><div className="student-table-wrap"><table className="student-table"><thead><tr><th>졸업 연도</th><th>학기</th><th>학위</th><th>졸업일</th><th>졸업 번호</th><th>우등·명예</th></tr></thead><tbody>{studentGraduations.map(g=><tr key={g.id}><td>{g.graduation_year}</td><td>{g.graduation_term}학기</td><td>{g.degree_name||g.program_code}</td><td>{g.graduation_date||"—"}</td><td>{g.graduation_number||"—"}</td><td>{g.honors||"—"}</td></tr>)}</tbody></table>{!studentGraduations.length&&<div className="student-empty">공식 졸업 이력이 없습니다. 졸업 검토 후 학사관리에서 확정할 수 있습니다.</div>}</div></section>}
     {tab==="scholarships"&&<section className="student-panel"><div className="student-panel-head"><div><h4>장학금 이력</h4><p>재정 모듈의 장학금 승인·지급 내역과 연결됩니다.</p></div><span className="student-readonly">재정 모듈 연동</span></div><div className="student-table-wrap"><table className="student-table"><thead><tr><th>학년도</th><th>장학금 명칭</th><th>승인액</th><th>지급액</th><th>잔액</th><th>상태</th></tr></thead><tbody>{studentAwards.map(a=><tr key={a.award_id}><td>{a.academic_year}</td><td>{a.scholarship_name}</td><td>{money(a.base_amount)} MMK</td><td>{money(a.paid_amount)} MMK</td><td>{money(a.remaining_amount)} MMK</td><td><span className={"student-status "+a.status}>{awardLabel[a.status]??a.status}</span></td></tr>)}</tbody></table>{!studentAwards.length&&<div className="student-empty">연결된 장학금 이력이 없습니다. 재정 관리에서 장학금을 편성할 수 있습니다.</div>}</div></section>}
    </>}
   </main></div>}
  </div>
  {profileOpen&&createPortal(<div className="student-modal-backdrop student-profile-backdrop" role="presentation"><section className="student-modal"><div className="student-modal-head"><div><span className="eyebrow">STUDENT PROFILE</span><h3>{editingStudent?"학생 정보 수정":"신규 학생 등록"}</h3></div><button onClick={()=>setProfileOpen(false)}>×</button></div><div className="student-form-grid">
   {input("학번 *","student_number")}{input("이름 *","full_name")}{input("영문 이름","full_name_en")}{input("미얀마어 이름","full_name_my")}
   <FormField label="성별"><select value={profile.gender} disabled={!canManage||!academicMutationsEnabled||saving} onChange={e=>setP("gender",e.target.value)}><option value="unspecified">미지정</option><option value="male">남성</option><option value="female">여성</option></select></FormField>{input("생년월일","date_of_birth","date")}{input("입학 연도","admission_year","number")}{input("과정 / 학위","program")}
   <FormField label="학년 (수동 변경)"><select value={profile.cohort} disabled={!canManage||!academicMutationsEnabled||saving} onChange={e=>setP("cohort",e.target.value)}>
      <option value="">학년 선택</option>
      {yearOptions.filter(([year])=>{
        const program=/early childhood|ece/i.test(profile.program)?"ece":/m\.?div|master of divinity/i.test(profile.program)?"mdiv":/theology|신학|diploma/i.test(profile.program)?"theology":null;
        const max=program==="ece"||/diploma/i.test(profile.program)?4:program==="mdiv"?6:8;
        return yearFirstSemester[year]<=max;
      }).map(([year,label])=><option key={year} value={year}>{label}</option>)}
      {profile.cohort&&!yearFirstSemester[profile.cohort]&&<option value={profile.cohort}>{profile.cohort}</option>}
     </select><small className="student-manual-year-hint">학년을 직접 선택한 뒤 학생 정보를 저장하세요. 기존 성적은 유지됩니다.</small></FormField>
   <FormField label="학적 상태"><span className="student-readonly">학적 상태 변경은 학생 명부의 상태 관리 버튼을 사용합니다.</span></FormField>{input("전화번호","phone")}{input("이메일","email","email")}{input("보호자 이름","guardian_name")}{input("보호자 연락처","guardian_phone")}<FormField label="비고" full><textarea value={profile.notes} disabled={!canManage||!academicMutationsEnabled||saving} onChange={e=>setP("notes",e.target.value)}/></FormField>
  </div>{error&&<div className="student-alert error" role="alert">{error}</div>}<AdminFormActions className="student-modal-actions" primaryClassName="student-primary" close={()=>setProfileOpen(false)} saving={saving} disabled={!canManage||!academicMutationsEnabled||saving||!profile.student_number.trim()||!profile.full_name.trim()} submit={()=>void saveProfile()}/></section></div>,document.body)}
  {accountOpen&&selected&&createPortal(<div className="student-modal-backdrop student-account-backdrop" role="presentation"><section className="student-modal"><div className="student-modal-head"><div><span className="eyebrow">STUDENT ACCOUNT</span><h3>학생 로그인 계정 발급</h3></div><button onClick={()=>setAccountOpen(false)}>×</button></div><p>{displayStudentName(selected)} · {selected.student_number}</p>{error&&<div className="student-alert error" role="alert">{error}</div>}<div className="student-form-grid"><FormField label="로그인 이메일 *"><input type="email" value={accountEmail} disabled={!canManage||accountBusy} onChange={e=>setAccountEmail(e.target.value)} required/></FormField><FormField label="초기 비밀번호 *"><input type="password" minLength={6} value={accountPassword} disabled={!canManage||accountBusy} onChange={e=>setAccountPassword(e.target.value)} placeholder="6자 이상"/></FormField></div><p className="student-readonly">발급 후 학생 로그인 화면에서 이메일과 초기 비밀번호로 접속합니다. 학생 학번으로 도서관 회원 계정도 함께 만들거나 기존 회원 정보와 연결합니다.</p><AdminFormActions className="student-modal-actions" primaryClassName="student-primary" close={()=>setAccountOpen(false)} saving={accountBusy} disabled={!canManage||accountBusy||!accountEmail.includes("@")||accountPassword.length<6} submit={()=>void issueStudentAccount()} submitLabel="계정·도서관 회원 발급" savingLabel="발급 중…"/></section></div>, document.body)}
 </div>;
}
