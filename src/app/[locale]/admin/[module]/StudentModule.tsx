"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";
import {AdminFormActions,FormField} from "./AdminUI";

type Student={id:string;auth_user_id:string|null;program_code:string|null;student_number:string;full_name:string;full_name_my:string|null;full_name_en:string|null;gender:string|null;date_of_birth:string|null;admission_year:number|null;program:string|null;cohort:string|null;student_status:string;phone:string|null;email:string|null;guardian_name:string|null;guardian_phone:string|null;notes:string|null;graduation_year:number|null;graduation_term:number|null;graduation_date:string|null;graduation_number:string|null};
type StatusHistory={id:string;student_id:string;previous_status:string|null;new_status:string;effective_date:string;reason:string|null;created_at:string};
type Graduation={id:string;student_id:string;program_code:string;graduation_year:number;graduation_term:number;graduation_date:string|null;degree_name:string|null;graduation_number:string|null;honors:string|null;notes:string|null;approved_at:string};
type Award={award_id:string;student_id:string;academic_year:number;scholarship_name:string;base_amount:number;paid_amount:number;remaining_amount:number;status:string};
const statusLabel:Record<string,string>={active:"재학",leave:"휴학",graduated:"졸업",withdrawn:"자퇴"};
const awardLabel:Record<string,string>={draft:"임시저장",submitted:"결재대기",approved:"승인",rejected:"반려",completed:"지급 완료",cancelled:"취소"};
const money=(n:number)=>new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(Number(n)||0);
const emptyProfile={student_number:"",full_name:"",full_name_en:"",full_name_my:"",gender:"unspecified",date_of_birth:"",admission_year:String(new Date().getFullYear()),program:"",cohort:"",student_status:"active",phone:"",email:"",guardian_name:"",guardian_phone:"",notes:""};

export default function StudentModule(){
 const supabase=useMemo(()=>createSupabaseBrowserClient(),[]);
 const [students,setStudents]=useState<Student[]>([]),[records,setRecords]=useState<any[]>([]),[awards,setAwards]=useState<Award[]>([]),[graduations,setGraduations]=useState<Graduation[]>([]),[statusHistory,setStatusHistory]=useState<StatusHistory[]>([]);
 const [selectedId,setSelectedId]=useState(""),[tab,setTab]=useState("profiles"),[search,setSearch]=useState(""),[filter,setFilter]=useState("all");
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [profileOpen,setProfileOpen]=useState(false),[editingStudent,setEditingStudent]=useState(""),[profile,setProfile]=useState<any>(emptyProfile);
 const [accountOpen,setAccountOpen]=useState(false),[accountEmail,setAccountEmail]=useState(""),[accountPassword,setAccountPassword]=useState(""),[accountBusy,setAccountBusy]=useState(false);
 const load=useCallback(async()=>{setLoading(true);setError("");try{
  // 브라우저에서 Supabase로 직접 요청하지 않고 동일 출처의 Vercel API를 통해 조회합니다.
  const response=await fetch("/api/admin/students",{method:"GET",cache:"no-store",credentials:"same-origin",headers:{Accept:"application/json"}});
  const payload=await response.json().catch(()=>({error:"서버 응답을 읽을 수 없습니다."}));
  if(!response.ok)throw new Error(payload.error||`학생 데이터 조회 실패 (HTTP ${response.status})`);
  const errors:string[]=[];
  const s=payload.students,r=payload.grades,a=payload.scholarships,g=payload.graduations,h=payload.statusHistory;
  if(s?.error)errors.push("학생 명부: "+s.error);
  else{
   const rows=(s?.data??[]) as Student[];
   setStudents(rows);
   if(!selectedId&&rows.length)setSelectedId(rows[0].id);
   if(selectedId&&!rows.some(x=>x.id===selectedId))setSelectedId(rows[0]?.id??"");
  }
  if(r?.error)errors.push("성적 조회: "+r.error);
  else setRecords(((r?.data??[]) as any[]).map(x=>({id:x.id,student_id:x.student_id,academic_year:x.academic_year??x.academic_terms?.academic_year??0,term:x.term??x.academic_terms?.name??x.academic_terms?.term_code??"",course_code:x.course_code??x.academic_courses?.course_code??null,course_name:x.course_name??x.academic_courses?.title??"",credits:x.credits??x.academic_courses?.credits??null,score:x.score,grade:x.grade,remarks:x.remarks})));
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
 const visible=students.filter(s=>(filter==="all"||s.student_status===filter)&&(!search.trim()||[s.student_number,s.full_name,s.full_name_en,s.full_name_my,s.program,s.cohort].some(v=>(v??"").toLowerCase().includes(search.toLowerCase()))));
 const studentRecords=records.filter(r=>r.student_id===selectedId),studentAwards=awards.filter(a=>a.student_id===selectedId),studentGraduations=graduations.filter(g=>g.student_id===selectedId),studentStatusHistory=statusHistory.filter(h=>h.student_id===selectedId);
 const setP=(k:string,v:string)=>setProfile((old:any)=>({...old,[k]:v}));
 const newProfile=()=>{setEditingStudent("");setProfile({...emptyProfile});setProfileOpen(true);};
 const editProfile=(s:Student)=>{setEditingStudent(s.id);setProfile({student_number:s.student_number,full_name:s.full_name,full_name_en:s.full_name_en??"",full_name_my:s.full_name_my??"",gender:s.gender??"unspecified",date_of_birth:s.date_of_birth??"",admission_year:s.admission_year?String(s.admission_year):"",program:s.program??(s.program_code==="ece"?"Early Childhood Education":s.program_code==="mdiv"?"Master of Divinity":s.program_code==="theology"?"Theology":""),cohort:s.cohort??"",student_status:s.student_status,phone:s.phone??"",email:s.email??"",guardian_name:s.guardian_name??"",guardian_phone:s.guardian_phone??"",notes:s.notes??""});setProfileOpen(true);};
 const saveProfile=async()=>{if(!supabase)return;setSaving(true);setError("");try{
  const payload={student_number:profile.student_number.trim(),full_name:profile.full_name.trim(),full_name_en:profile.full_name_en.trim()||null,full_name_my:profile.full_name_my.trim()||null,gender:profile.gender,date_of_birth:profile.date_of_birth||null,admission_year:profile.admission_year?Number(profile.admission_year):null,program:profile.program.trim()||null,program_code:/early childhood|ece/i.test(profile.program)?"ece":/m\.?div|master of divinity/i.test(profile.program)?"mdiv":/theology|신학|diploma/i.test(profile.program)?"theology":null,cohort:profile.cohort.trim()||null,phone:profile.phone.trim()||null,email:profile.email.trim()||null,guardian_name:profile.guardian_name.trim()||null,guardian_phone:profile.guardian_phone.trim()||null,notes:profile.notes.trim()||null};
  if(editingStudent){const x=await supabase.from("students").update(payload).eq("id",editingStudent);if(x.error)throw x.error;setSelectedId(editingStudent);setNotice("학생 정보를 수정했습니다.");}
  else{const {data:u}=await supabase.auth.getUser();const x=await supabase.from("students").insert({...payload,created_by:u.user?.id}).select("id").single();if(x.error)throw x.error;setSelectedId(x.data.id);setNotice("학생을 등록했습니다.");}
  setProfileOpen(false);await load();
 }catch(e:any){setError(e.message??"학생 정보 저장에 실패했습니다.");}finally{setSaving(false);}};
 const changeStudentStatus=async(nextStatus:"active"|"leave"|"withdrawn")=>{
  if(!supabase||!selected)return;
  const label=statusLabel[nextStatus];
  if(!window.confirm(selected.full_name+" 학생을 "+label+" 상태로 변경할까요? 변경 이력은 자동으로 보존됩니다."))return;
  setSaving(true);setError("");
  try{const {error}=await supabase.rpc("mrpst_change_student_status",{p_student_id:selected.id,p_new_status:nextStatus,p_effective_date:new Date().toISOString().slice(0,10),p_reason:"관리자 학적 상태 변경"});if(error)throw error;setNotice("학생을 "+label+" 상태로 변경했습니다.");await load();}
  catch(e:any){setError(e.message||"학적 상태 변경에 실패했습니다.");}
  finally{setSaving(false);}
};
const archiveStudent=async()=>changeStudentStatus("withdrawn");
 const issueStudentAccount=async()=>{if(!supabase||!selected)return;setAccountBusy(true);setError("");try{const {data,error}=await supabase.functions.invoke("admin-manage-user",{body:{action:"create_student",student_id:selected.id,email:accountEmail.trim(),password:accountPassword}});if(error)throw error; if(data?.error)throw new Error(data.error);setNotice("학생 로그인 계정을 발급하고 학생 정보와 연결했습니다.");setAccountOpen(false);setAccountPassword("");setAccountEmail("");await load();}catch(e:any){setError(e.message??"학생 계정 발급에 실패했습니다.");}finally{setAccountBusy(false);}};
 const input=(label:string,key:string,type="text")=><FormField label={label}><input type={type} value={profile[key]??""} onChange={e=>setP(key,e.target.value)}/></FormField>;
 return <div className="student-workspace">
  <div className="student-intro"><div><span className="eyebrow">STUDENT INFORMATION SYSTEM</span><h2>Student Management</h2><p>학생 기본정보, 학업 이력과 장학금 내역을 통합 관리합니다.</p></div><button className="student-primary" onClick={newProfile}>＋ 학생 등록</button></div>
  <div className="student-tabs"><button className={tab==="profiles"?"selected":""} onClick={()=>setTab("profiles")}>학생 명부</button><button className={tab==="academics"?"selected":""} onClick={()=>setTab("academics")}>학업 기록</button><button className={tab==="scholarships"?"selected":""} onClick={()=>setTab("scholarships")}>장학금 이력</button><button className={tab==="graduations"?"selected":""} onClick={()=>setTab("graduations")}>졸업 이력</button></div>
  {error&&<div className="student-alert error">{error}</div>}{notice&&<div className="student-alert success">{notice}</div>}{!supabase&&<div className="student-alert">Supabase 환경변수를 설정하면 실제 학생 데이터를 사용할 수 있습니다.</div>}
  <div className="student-layout">
   <aside className="student-roster"><div className="student-roster-head"><strong>학생 명부 <span>{students.length}</span></strong><button onClick={newProfile}>＋</button></div><input className="student-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="학번, 이름, 과정 검색"/><select className="student-filter" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">전체 상태</option><option value="active">재학</option><option value="leave">휴학</option><option value="graduated">졸업</option><option value="withdrawn">자퇴</option></select>
    <div className="student-roster-list">{visible.map(s=><button key={s.id} className={selectedId===s.id?"active":""} onClick={()=>setSelectedId(s.id)}><strong>{s.full_name}</strong><span>{s.student_number} · {s.program||"과정 미지정"}</span><small>{statusLabel[s.student_status]??s.student_status}</small></button>)}{!loading&&!visible.length&&<div className="student-empty">검색 결과가 없습니다.</div>}</div>
   </aside>
   <main className="student-detail">
    {loading&&<div className="student-empty">학생 정보를 불러오는 중입니다…</div>}
    {!loading&&!selected&&<div className="student-empty large"><strong>등록된 학생이 없습니다.</strong><span>학생 등록을 눌러 첫 학생 정보를 입력하세요.</span></div>}
    {selected&&<>
     <div className="student-profile-head"><div><span className="student-number">{selected.student_number}</span><h3>{selected.full_name}</h3><p>{selected.program||"과정 미지정"}{selected.cohort?" · "+selected.cohort:""} · {selected.admission_year??"입학연도 미상"} 입학</p></div><div className="student-profile-actions"><span className={"student-status "+selected.student_status}>{statusLabel[selected.student_status]??selected.student_status}</span><button onClick={()=>editProfile(selected)}>정보 수정</button>{selected.student_status==="active"&&<button disabled={saving} onClick={()=>void changeStudentStatus("leave")}>휴학 처리</button>}{selected.student_status==="leave"&&<button disabled={saving} onClick={()=>void changeStudentStatus("active")}>재학 복귀</button>}{selected.student_status!=="withdrawn"&&selected.student_status!=="graduated"&&<button disabled={saving} onClick={()=>void archiveStudent()}>자퇴 처리</button>}{selected.auth_user_id?<span className="student-readonly">로그인 계정 연결됨</span>:<button onClick={()=>{setAccountEmail(selected.email??"");setAccountPassword("");setAccountOpen(true);}}>학생 계정 발급</button>}</div></div>
     <div className="student-summary-grid"><article><span>학업 기록</span><strong>{studentRecords.length}건</strong></article><article><span>장학금</span><strong>{studentAwards.length}건</strong></article><article><span>연락처</span><strong>{selected.phone||"미등록"}</strong></article><article><span>이메일</span><strong>{selected.email||"미등록"}</strong></article></div>
     {tab==="profiles"&&<section className="student-panel"><div className="student-panel-head"><div><h4>학생 기본정보</h4><p>인적 사항과 보호자 연락처</p></div><button onClick={()=>editProfile(selected)}>수정</button></div><div className="student-info-grid">
      <div><span>영문 이름</span><strong>{selected.full_name_en||"—"}</strong></div><div><span>미얀마어 이름</span><strong>{selected.full_name_my||"—"}</strong></div><div><span>성별</span><strong>{selected.gender==="male"?"남성":selected.gender==="female"?"여성":"미지정"}</strong></div><div><span>생년월일</span><strong>{selected.date_of_birth||"—"}</strong></div><div><span>전화번호</span><strong>{selected.phone||"—"}</strong></div><div><span>이메일</span><strong>{selected.email||"—"}</strong></div><div><span>보호자</span><strong>{selected.guardian_name||"—"}</strong></div><div><span>보호자 연락처</span><strong>{selected.guardian_phone||"—"}</strong></div><div className="full"><span>비고</span><strong>{selected.notes||"—"}</strong></div><div><span>학적 상태</span><strong>{statusLabel[selected.student_status]??selected.student_status}</strong></div>
     </div><div className="student-panel-head"><div><h4>학적 변동 이력</h4><p>휴학·복학·자퇴·졸업 처리 기록</p></div></div><div className="student-table-wrap"><table className="student-table"><thead><tr><th>적용일</th><th>변경 전</th><th>변경 후</th><th>사유</th></tr></thead><tbody>{studentStatusHistory.map(h=><tr key={h.id}><td>{h.effective_date}</td><td>{h.previous_status?statusLabel[h.previous_status]||h.previous_status:"신규"}</td><td>{statusLabel[h.new_status]||h.new_status}</td><td>{h.reason||"—"}</td></tr>)}</tbody></table>{!studentStatusHistory.length&&<div className="student-empty">학적 변동 이력이 없습니다.</div>}</div></section>}
     {tab==="academics"&&<section className="student-panel"><div className="student-panel-head"><div><h4>학업 이력</h4><p>{selected.full_name} 학생의 성적관리 데이터와 실시간 연동됩니다. 점수 입력과 수정은 성적관리 메뉴에서 진행합니다.</p></div><span className="student-readonly">성적관리 연동</span></div><div className="student-table-wrap"><table className="student-table"><thead><tr><th>학년도</th><th>학기</th><th>과목 코드</th><th>과목명</th><th>학점</th><th>점수</th><th>성적</th><th>비고</th><th>관리</th></tr></thead><tbody>{studentRecords.map(r=><tr key={r.id}><td>{r.academic_year}</td><td>{r.term}</td><td>{r.course_code||"—"}</td><td>{r.course_name}</td><td>{r.credits??"—"}</td><td>{r.score??"—"}</td><td>{r.grade||"—"}</td><td>{r.remarks||"—"}</td><td><span className="student-readonly">성적관리에서 수정</span></td></tr>)}</tbody></table>{!studentRecords.length&&<div className="student-empty">등록된 학업 기록이 없습니다.</div>}</div></section>}
     {tab==="graduations"&&<section className="student-panel"><div className="student-panel-head"><div><h4>공식 졸업 이력</h4><p>졸업 심사에서 최종 확정된 학위와 졸업 정보를 표시합니다.</p></div><span className="student-readonly">학사관리 연동</span></div><div className="student-table-wrap"><table className="student-table"><thead><tr><th>졸업 연도</th><th>학기</th><th>학위</th><th>졸업일</th><th>졸업 번호</th><th>우등·명예</th></tr></thead><tbody>{studentGraduations.map(g=><tr key={g.id}><td>{g.graduation_year}</td><td>{g.graduation_term}학기</td><td>{g.degree_name||g.program_code}</td><td>{g.graduation_date||"—"}</td><td>{g.graduation_number||"—"}</td><td>{g.honors||"—"}</td></tr>)}</tbody></table>{!studentGraduations.length&&<div className="student-empty">공식 졸업 이력이 없습니다. 졸업 검토 후 학사관리에서 확정할 수 있습니다.</div>}</div></section>}
     {tab==="scholarships"&&<section className="student-panel"><div className="student-panel-head"><div><h4>장학금 이력</h4><p>재정 모듈의 장학금 승인·지급 내역과 연결됩니다.</p></div><span className="student-readonly">재정 모듈 연동</span></div><div className="student-table-wrap"><table className="student-table"><thead><tr><th>학년도</th><th>장학금 명칭</th><th>승인액</th><th>지급액</th><th>잔액</th><th>상태</th></tr></thead><tbody>{studentAwards.map(a=><tr key={a.award_id}><td>{a.academic_year}</td><td>{a.scholarship_name}</td><td>{money(a.base_amount)} MMK</td><td>{money(a.paid_amount)} MMK</td><td>{money(a.remaining_amount)} MMK</td><td><span className={"student-status "+a.status}>{awardLabel[a.status]??a.status}</span></td></tr>)}</tbody></table>{!studentAwards.length&&<div className="student-empty">연결된 장학금 이력이 없습니다. 재정 관리에서 장학금을 편성할 수 있습니다.</div>}</div></section>}
    </>}
   </main>
  </div>
  {profileOpen&&<div className="student-modal-backdrop"><section className="student-modal"><div className="student-modal-head"><div><span className="eyebrow">STUDENT PROFILE</span><h3>{editingStudent?"학생 정보 수정":"신규 학생 등록"}</h3></div><button onClick={()=>setProfileOpen(false)}>×</button></div><div className="student-form-grid">
   {input("학번 *","student_number")}{input("이름 *","full_name")}{input("영문 이름","full_name_en")}{input("미얀마어 이름","full_name_my")}
   <FormField label="성별"><select value={profile.gender} onChange={e=>setP("gender",e.target.value)}><option value="unspecified">미지정</option><option value="male">남성</option><option value="female">여성</option></select></FormField>{input("생년월일","date_of_birth","date")}{input("입학 연도","admission_year","number")}{input("과정 / 학위","program")}{input("학년 / 기수","cohort")}
   <FormField label="학적 상태"><span className="student-readonly">학적 상태 변경은 학생 명부의 상태 관리 버튼을 사용합니다.</span></FormField>{input("전화번호","phone")}{input("이메일","email","email")}{input("보호자 이름","guardian_name")}{input("보호자 연락처","guardian_phone")}<FormField label="비고" full><textarea value={profile.notes} onChange={e=>setP("notes",e.target.value)}/></FormField>
  </div><AdminFormActions className="student-modal-actions" primaryClassName="student-primary" close={()=>setProfileOpen(false)} saving={saving} disabled={!profile.student_number.trim()||!profile.full_name.trim()} submit={()=>void saveProfile()}/></section></div>}
  {accountOpen&&selected&&<div className="student-modal-backdrop"><section className="student-modal"><div className="student-modal-head"><div><span className="eyebrow">STUDENT ACCOUNT</span><h3>학생 로그인 계정 발급</h3></div><button onClick={()=>setAccountOpen(false)}>×</button></div><p>{selected.full_name} · {selected.student_number}</p><div className="student-form-grid"><FormField label="로그인 이메일 *"><input type="email" value={accountEmail} onChange={e=>setAccountEmail(e.target.value)} required/></FormField><FormField label="초기 비밀번호 *"><input type="password" minLength={8} value={accountPassword} onChange={e=>setAccountPassword(e.target.value)} placeholder="8자 이상"/></FormField></div><p className="student-readonly">발급 후 학생 로그인 화면에서 이메일과 초기 비밀번호로 접속합니다. 계정은 이 학생의 학번에 연결됩니다.</p><AdminFormActions className="student-modal-actions" primaryClassName="student-primary" close={()=>setAccountOpen(false)} saving={accountBusy} disabled={!accountEmail.includes("@")||accountPassword.length<8} submit={()=>void issueStudentAccount()} submitLabel="계정 발급" savingLabel="발급 중…"/></section></div>}
 </div>;
}
