"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";
type UserRole={id:string;role:string;department_id:string|null};
type UserModulePermission={module_key:string;can_view:boolean;can_manage:boolean};
type P={user_id:string;full_name:string;email:string|null;preferred_locale:string;is_active:boolean;created_at:string;roles:UserRole[];permissions:UserModulePermission[]};
type D={id:string;code:string;name_en:string;name_my:string|null;name_ko:string|null;is_active:boolean};
const roles=["super_admin","administrator","finance_officer","academic_officer","student_officer","librarian","facility_manager","faculty","staff","student"];
const names:Record<string,string>={super_admin:"최고 관리자",administrator:"관리자",finance_officer:"재정 담당",academic_officer:"학사 담당",student_officer:"학생 담당",librarian:"도서관 담당",facility_manager:"시설 담당",faculty:"교수",staff:"직원",student:"학생"};
const localeNames:Record<string,string>={ko:"한국어",my:"မြန်မာ"};
const pageOptions=[
 {key:"finance",title:"재정 관리",description:"회계, 예산, 후원금 및 지출"},
 {key:"students",title:"학생 관리",description:"학생 정보, 학적 및 장학"},
 {key:"academics",title:"학사 관리",description:"학과, 과목, 시간표 및 성적"},
 {key:"facilities",title:"시설 관리",description:"건물, 비품, 차량 및 유지보수"},
 {key:"library",title:"도서관 관리",description:"도서 목록, 대출 및 반납"},
 {key:"meetings",title:"회의 자료",description:"교수회 및 각종 회의 자료"},
 {key:"website",title:"홈페이지 관리",description:"학교 소개, 공지 및 홈페이지 콘텐츠"}
] as const;
export default function AdministrationModule(){
 const db=useMemo(()=>createSupabaseBrowserClient(),[]);
 const [users,setUsers]=useState<P[]>([]),[deps,setDeps]=useState<D[]>([]),[logs,setLogs]=useState<any[]>([]);
 const [tab,setTab]=useState("users"),[search,setSearch]=useState(""),[statusFilter,setStatusFilter]=useState("all");
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [selectedId,setSelectedId]=useState(""),[fullName,setFullName]=useState(""),[preferredLocale,setPreferredLocale]=useState("ko"),[role,setRole]=useState("staff"),[depId,setDepId]=useState("");
 const [newDep,setNewDep]=useState({code:"",name_en:"",name_my:"",name_ko:""}),[depOpen,setDepOpen]=useState(false),[editingDepId,setEditingDepId]=useState("");
 const [createOpen,setCreateOpen]=useState(false),[newUser,setNewUser]=useState({full_name:"",email:"",password:"",preferred_locale:"ko",role:"staff",department_id:""}),[newPassword,setNewPassword]=useState("");
 const [selectedPageKeys,setSelectedPageKeys]=useState<string[]>([]);
 const selected=users.find(x=>x.user_id===selectedId)||null;
 const load=useCallback(async()=>{
  if(!db){setLoading(false);setError("데이터베이스 연결을 확인해 주세요.");return;}
  setLoading(true);setError("");
  const [p,d,l]=await Promise.all([
   db.from("user_profiles").select("user_id,full_name,email,preferred_locale,is_active,created_at").order("created_at",{ascending:false}),
   db.from("departments").select("*").order("code"),
   db.from("admin_audit_log").select("*").order("created_at",{ascending:false}).limit(100)
  ]);
  const errs=[p,d,l].filter(x=>x.error).map(x=>x.error!.message);
  if(errs.length){setError(errs.join(" · "));setLoading(false);return;}
  const rows=(p.data||[]) as Omit<P,"roles">[],ids=rows.map(x=>x.user_id);
  let rr:UserRole[]=[];
  let pp:(UserModulePermission & {user_id:string})[]=[];
  if(ids.length){
   const [r,permissions]=await Promise.all([
    db.from("user_roles").select("id,user_id,role,department_id").in("user_id",ids),
    db.from("user_module_permissions").select("user_id,module_key,can_view,can_manage").in("user_id",ids)
   ]);
   if(r.error||permissions.error){setError(r.error?.message||permissions.error?.message||"권한 정보를 불러오지 못했습니다.");setLoading(false);return;}
   rr=(r.data||[]) as UserRole[];
   pp=(permissions.data||[]) as (UserModulePermission & {user_id:string})[];
  }
  const mapped=rows.map(x=>({...x,roles:rr.filter(y=>(y as any).user_id===x.user_id),permissions:pp.filter(y=>y.user_id===x.user_id)})) as P[];
  setUsers(mapped);setDeps((d.data||[]) as D[]);setLogs(l.data||[]);
  setSelectedId(current=>current&&mapped.some(x=>x.user_id===current)?current:"");
  setLoading(false);
 },[db]);
 useEffect(()=>{void load();},[load]);
 async function invokeAdmin(body:Record<string,unknown>){if(!db)throw new Error("데이터베이스 연결을 확인해 주세요.");const {data,error}=await db.functions.invoke("admin-manage-user",{body});if(error)throw error;if(data?.error)throw new Error(data.error);return data;}
 async function createAccount(){if(!newUser.full_name.trim()||!newUser.email.trim()||newUser.password.length<8){setError("이름, 이메일, 8자 이상의 비밀번호를 입력해 주세요.");return;}const ok=await run(()=>invokeAdmin({action:"create",...newUser,full_name:newUser.full_name.trim(),email:newUser.email.trim()}),"새 계정을 생성했습니다.");if(!ok)return;setCreateOpen(false);setNewUser({full_name:"",email:"",password:"",preferred_locale:"ko",role:"staff",department_id:""});}
 async function createTestAccounts(){
  const testAccounts=[
   {full_name:"테스트 재정 담당",email:"test_finance@mrpst.test",role:"finance_officer",pages:["finance"]},
   {full_name:"테스트 학사 담당",email:"test_academic@mrpst.test",role:"academic_officer",pages:["academics","students"]},
   {full_name:"테스트 시설 담당",email:"test_facility@mrpst.test",role:"facility_manager",pages:["facilities","library","meetings"]}
  ];
  const existing=new Set(users.map(user=>(user.email||"").toLowerCase()));
  const created:string[]=[];
  const skipped:string[]=[];
  setSaving(true);setError("");setNotice("");
  try{
   for(const account of testAccounts){
    if(existing.has(account.email)){skipped.push(account.email);continue;}
    const result=await invokeAdmin({action:"create",full_name:account.full_name,email:account.email,password:"test1234",preferred_locale:"ko",role:account.role,department_id:""});
    if(!result?.user_id)throw new Error(account.email+" 계정 생성 결과를 확인할 수 없습니다.");
    const permissions=pageOptions.map(option=>({user_id:result.user_id,module_key:option.key,can_view:account.pages.includes(option.key),can_manage:false,assigned_by:null}));
    const {error:permissionError}=await db!.from("user_module_permissions").upsert(permissions,{onConflict:"user_id,module_key"});
    if(permissionError)throw new Error(account.email+" 페이지 권한 저장 실패: "+permissionError.message);
    created.push(account.email);
   }
   setNotice(created.length+"개 테스트 계정을 생성했습니다."+(skipped.length?" 이미 존재하여 건너뜀: "+skipped.join(", "):""));
   await load();
  }catch(e:any){setError((e?.message||"테스트 계정 생성에 실패했습니다.")+(created.length?" 이미 생성된 계정: "+created.join(", "):""));}
  finally{setSaving(false);}
 }
 async function run(fn:()=>any,msg:string){
  setSaving(true);setError("");setNotice("");
  try{const r=await fn();if(r?.error)throw r.error;setNotice(msg);await load();return true;}
  catch(e:any){setError(e?.message||"처리하지 못했습니다.");return false;}
  finally{setSaving(false);}
 }
 function openUser(p:P){
  setSelectedId(p.user_id);setFullName(p.full_name||"");setPreferredLocale(p.preferred_locale==="my"?"my":"ko");setRole("staff");setDepId("");setNewPassword("");setNotice("");setError("");
  setSelectedPageKeys(pageOptions.filter(option=>p.permissions.some(permission=>permission.module_key===option.key&&permission.can_view)).map(option=>option.key));
 }
 const filtered=users.filter(x=>{
  const text=[x.full_name,x.email||"",x.user_id,...x.roles.map(r=>names[r.role]||r.role),...x.roles.map(r=>deps.find(d=>d.id===r.department_id)?.name_ko||"")].join(" ").toLowerCase();
  return (!search||text.includes(search.toLowerCase()))&&(statusFilter==="all"||(statusFilter==="active"?x.is_active:!x.is_active));
 });
 const assign=()=>{
  if(!selected)return;
  if(selected.roles.some(r=>r.role===role&&r.department_id===(depId||null))){setError("이미 동일한 역할과 부서가 지정되어 있습니다.");return;}
  void run(()=>db!.from("user_roles").insert({user_id:selected.user_id,role,department_id:depId||null}),"역할을 추가했습니다.");
 };
 const toggle=(p:P)=>void run(()=>db!.rpc("mrpst_set_user_active",{target_user:p.user_id,make_active:!p.is_active}),p.is_active?"계정을 비활성화했습니다.":"계정을 활성화했습니다.");
 async function savePagePermissions(){
  if(!selected||!db)return;
  const {data:{user}}=await db.auth.getUser();
  const rows=pageOptions.map(option=>{
   const existing=selected.permissions.find(permission=>permission.module_key===option.key);
   return {user_id:selected.user_id,module_key:option.key,can_view:selectedPageKeys.includes(option.key),can_manage:existing?.can_manage??false,assigned_by:user?.id??null,updated_at:new Date().toISOString()};
  });
  await run(()=>db.from("user_module_permissions").upsert(rows,{onConflict:"user_id,module_key"}),"페이지 표시 설정을 저장했습니다.");
 }
 const tabs=[["users","회원·권한 관리"],["departments","부서 관리"],["audit","변경 이력"]];
 return <div className="settings-workspace">
  <div className="settings-heading"><span className="eyebrow">SYSTEM GOVERNANCE</span><h2>회원 관리</h2><p>회원 상태와 소속, 관리자 권한을 한 화면에서 확인하고 관리합니다.</p></div>
  <div className="settings-stats">
   <article><span>전체 회원</span><strong>{users.length}</strong></article>
   <article><span>활성 회원</span><strong>{users.filter(x=>x.is_active).length}</strong></article>
   <article><span>비활성 회원</span><strong>{users.filter(x=>!x.is_active).length}</strong></article>
   <article><span>부여된 권한</span><strong>{users.reduce((n,x)=>n+x.roles.length,0)}</strong></article>
  </div>
  {error&&<div className="settings-alert error">{error}</div>}{notice&&<div className="settings-alert success">{notice}</div>}
  <nav className="settings-tabs">{tabs.map(([k,v])=><button key={k} className={tab===k?"active":""} onClick={()=>{setTab(k);setSelectedId("");}}>{v}</button>)}</nav>
  {tab==="users"&&<section className="settings-panel">
   <div className="settings-panel-head"><div><h3>계정 목록</h3><p>관리자가 계정을 직접 생성하고 비밀번호와 권한을 관리합니다.</p></div><div className="settings-account-actions"><button className="settings-refresh" disabled={loading} onClick={()=>void load()}>새로고침</button><button className="settings-refresh" disabled={saving||loading} onClick={()=>void createTestAccounts()}>테스트 계정 3개 생성</button><button className="settings-primary" onClick={()=>setCreateOpen(true)}>＋ 계정 등록</button></div></div>
   <div className="settings-toolbar"><input className="settings-search" placeholder="이름, 이메일, 역할 검색" value={search} onChange={e=>setSearch(e.target.value)}/><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">전체 상태</option><option value="active">활성 회원</option><option value="inactive">비활성 회원</option></select><span>{filtered.length}명 표시</span></div>
   <div className="settings-member-layout">
    <div className="settings-member-list">{loading?<Empty>회원 정보를 불러오는 중입니다.</Empty>:filtered.map(p=><button type="button" className={"settings-member-item "+(selectedId===p.user_id?"selected":"")} key={p.user_id} onClick={()=>openUser(p)}>
      <span className="settings-member-avatar">{(p.full_name||"?").trim().slice(0,1)}</span><span className="settings-member-copy"><strong>{p.full_name||"이름 미등록"}</strong><small>{p.email||"이메일 미등록"} · {p.roles.length? p.roles.map(r=>names[r.role]||r.role).join(" · "):"권한 미지정"}</small></span><span className={p.is_active?"settings-status active":"settings-status inactive"}>{p.is_active?"활성":"비활성"}</span>
     </button>)}{!loading&&!filtered.length&&<Empty>검색 조건에 맞는 회원이 없습니다.</Empty>}</div>
    {selected?<div className="settings-member-detail">
      <div className="settings-detail-head"><div><span className="eyebrow">MEMBER PROFILE</span><h3>{selected.full_name||"이름 미등록"}</h3><small>{selected.email||"이메일 미등록"} · 등록일 {new Date(selected.created_at).toLocaleDateString()}</small></div><span className={selected.is_active?"settings-status active":"settings-status inactive"}>{selected.is_active?"활성 계정":"비활성 계정"}</span></div>
      <div className="settings-account-id">{selected.user_id}</div>
      <div className="settings-form-grid">
       <label>회원 이름<input value={fullName} onChange={e=>setFullName(e.target.value)}/></label>
       <label>기본 언어<select value={preferredLocale} onChange={e=>setPreferredLocale(e.target.value)}><option value="ko">한국어</option><option value="my">မြန်မာ</option></select></label>
      </div>
      <button className="settings-primary" disabled={saving||!fullName.trim()} onClick={()=>void run(()=>db!.from("user_profiles").update({full_name:fullName.trim(),preferred_locale:preferredLocale}).eq("user_id",selected.user_id),"회원 정보를 저장했습니다.")}>회원 정보 저장</button>
      <div className="settings-detail-section"><h4>비밀번호 변경</h4><p className="settings-form-hint">새 비밀번호를 설정하면 기존 비밀번호는 즉시 사용할 수 없게 됩니다.</p><div className="settings-password-row"><input type="password" autoComplete="new-password" minLength={8} placeholder="새 비밀번호 (8자 이상)" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/><button className="settings-primary" disabled={saving||newPassword.length<8} onClick={()=>void run(()=>invokeAdmin({action:"update_password",user_id:selected.user_id,password:newPassword}),"비밀번호를 변경했습니다.")}>비밀번호 변경</button></div></div>
      <div className="settings-detail-section"><h4>현재 권한 <small>{selected.roles.length}개</small></h4>
       {selected.roles.length?selected.roles.map(r=><div className="settings-role-row" key={r.id}><span><strong>{names[r.role]||r.role}</strong><small>{r.department_id?(deps.find(d=>d.id===r.department_id)?.name_ko||deps.find(d=>d.id===r.department_id)?.name_en||"부서"):"전체 부서"}</small></span><button disabled={saving||r.role==="super_admin"} title={r.role==="super_admin"?"최고 관리자 권한은 이 화면에서 해제할 수 없습니다.":""} onClick={()=>void run(()=>db!.from("user_roles").delete().eq("id",r.id),"권한을 해제했습니다.")}>권한 해제</button></div>):<Empty>아직 부여된 권한이 없습니다.</Empty>}
      </div>
      <div className="settings-detail-section"><h4>새 권한 부여</h4><div className="settings-role-form"><select value={role} onChange={e=>setRole(e.target.value)}>{roles.filter(r=>r!=="super_admin"&&r!=="student").map(r=><option key={r} value={r}>{names[r]}</option>)}</select><select value={depId} onChange={e=>setDepId(e.target.value)}><option value="">전체 부서</option>{deps.filter(d=>d.is_active).map(d=><option key={d.id} value={d.id}>{d.name_ko||d.name_en}</option>)}</select><button className="settings-primary" disabled={saving||selected.roles.some(r=>r.role===role&&r.department_id===(depId||null))} onClick={assign}>권한 추가</button></div></div>
      <div className="settings-detail-section">
       <h4>보여줄 페이지 <small>{selectedPageKeys.length}/{pageOptions.length}</small></h4>
       <p className="settings-form-hint">이 회원에게 보여줄 페이지만 선택하세요.</p>
       <div className="settings-page-permissions">
        {pageOptions.map(option=><label className="settings-page-permission" key={option.key}>
         <input type="checkbox" checked={selectedPageKeys.includes(option.key)} disabled={selected.roles.some(r=>r.role==="super_admin")} onChange={e=>setSelectedPageKeys(current=>e.target.checked?[...current,option.key]:current.filter(key=>key!==option.key))}/>
         <span><strong>{option.title}</strong></span>
        </label>)}
       </div>
       <div className="settings-page-permission-actions">
        <button type="button" className="settings-primary" disabled={saving||selected.roles.some(r=>r.role==="super_admin")} onClick={()=>void savePagePermissions()}>{saving?"저장 중…":"저장"}</button>
       </div>
       {selected.roles.some(r=>r.role==="super_admin")&&<p className="settings-form-hint">최고 관리자는 모든 페이지가 표시됩니다.</p>}
      </div>
      <div className="settings-danger-zone"><div><strong>계정 상태</strong><small>{selected.is_active?"현재 로그인 및 서비스 이용이 가능한 상태입니다.":"현재 비활성화된 계정입니다."}</small></div><button disabled={saving||selected.roles.some(r=>r.role==="super_admin")} onClick={()=>toggle(selected)}>{selected.is_active?"회원 비활성화":"회원 다시 활성화"}</button></div>
     </div>:<div className="settings-member-empty"><strong>회원을 선택해 주세요</strong><p>왼쪽 목록에서 회원을 선택하면 상세 정보와 권한을 관리할 수 있습니다.</p></div>}
   </div>
  </section>}
  {tab==="departments"&&<section className="settings-panel"><div className="settings-panel-head"><div><h3>부서 관리</h3><p>회원에게 부서별 역할을 지정할 때 사용하는 부서 목록입니다.</p></div><button className="settings-primary" onClick={()=>{setEditingDepId("");setNewDep({code:"",name_en:"",name_my:"",name_ko:""});setDepOpen(true);}}>＋ 부서 등록</button></div><div className="settings-table-wrap"><table className="settings-table"><thead><tr><th>코드</th><th>English</th><th>မြန်မာ</th><th>한국어</th><th>상태</th><th>관리</th></tr></thead><tbody>{deps.map(d=><tr key={d.id}><td>{d.code}</td><td>{d.name_en}</td><td>{d.name_my||"—"}</td><td>{d.name_ko||"—"}</td><td>{d.is_active?"활성":"비활성"}</td><td><button onClick={()=>{setEditingDepId(d.id);setNewDep({code:d.code,name_en:d.name_en,name_my:d.name_my||"",name_ko:d.name_ko||""});setDepOpen(true);}}>수정</button> <button onClick={()=>void run(()=>db!.from("departments").update({is_active:!d.is_active}).eq("id",d.id),"부서 상태를 변경했습니다.")}>{d.is_active?"비활성화":"활성화"}</button></td></tr>)}</tbody></table>{!loading&&!deps.length&&<Empty>등록된 부서가 없습니다.</Empty>}</div></section>}
  {tab==="audit"&&<section className="settings-panel"><div className="settings-panel-head"><div><h3>회원 관리 변경 이력</h3><p>최근 100건의 사용자·권한·부서 변경 기록입니다.</p></div></div><div className="settings-table-wrap"><table className="settings-table"><thead><tr><th>일시</th><th>작업자</th><th>대상</th><th>작업</th><th>변경 내용</th></tr></thead><tbody>{logs.map(x=><tr key={x.id}><td>{new Date(x.created_at).toLocaleString()}</td><td>{x.actor_id?.slice(0,8)||"system"}</td><td>{x.entity_type}</td><td>{x.action}</td><td><code>{JSON.stringify(x.details||{}).slice(0,150)}</code></td></tr>)}</tbody></table>{!loading&&!logs.length&&<Empty>기록된 작업이 없습니다.</Empty>}</div></section>}
  {createOpen&&<div className="settings-modal-backdrop"><section className="settings-modal"><header><h3>새 계정 등록</h3><button onClick={()=>setCreateOpen(false)}>×</button></header><p className="settings-form-hint">계정은 즉시 활성화되며 등록한 이메일과 비밀번호로 로그인할 수 있습니다.</p><div className="settings-form-grid"><label>이름 *<input value={newUser.full_name} onChange={e=>setNewUser({...newUser,full_name:e.target.value})}/></label><label>이메일 *<input type="email" autoComplete="email" value={newUser.email} onChange={e=>setNewUser({...newUser,email:e.target.value})}/></label><label>초기 비밀번호 *<input type="password" autoComplete="new-password" minLength={8} value={newUser.password} onChange={e=>setNewUser({...newUser,password:e.target.value})}/></label><label>기본 언어<select value={newUser.preferred_locale} onChange={e=>setNewUser({...newUser,preferred_locale:e.target.value})}><option value="ko">한국어</option><option value="en">English</option><option value="my">မြန်မာ</option></select></label><label>역할<select value={newUser.role} onChange={e=>setNewUser({...newUser,role:e.target.value})}>{roles.filter(r=>r!=="super_admin"&&r!=="student").map(r=><option key={r} value={r}>{names[r]}</option>)}</select></label><label>부서<select value={newUser.department_id} onChange={e=>setNewUser({...newUser,department_id:e.target.value})}><option value="">전체 부서</option>{deps.filter(d=>d.is_active).map(d=><option key={d.id} value={d.id}>{d.name_ko||d.name_en}</option>)}</select></label></div><footer><button onClick={()=>setCreateOpen(false)}>취소</button><button className="settings-primary" disabled={saving||!newUser.full_name.trim()||!newUser.email.trim()||newUser.password.length<8} onClick={()=>void createAccount()}>{saving?"등록 중…":"계정 생성"}</button></footer></section></div>}
  {depOpen&&<div className="settings-modal-backdrop"><section className="settings-modal"><header><h3>{editingDepId?"부서 정보 수정":"부서 등록"}</h3><button onClick={()=>setDepOpen(false)}>×</button></header><div className="settings-form-grid"><label>부서 코드 *<input value={newDep.code} onChange={e=>setNewDep({...newDep,code:e.target.value.toUpperCase()})}/></label><label>영어 이름 *<input value={newDep.name_en} onChange={e=>setNewDep({...newDep,name_en:e.target.value})}/></label><label>미얀마어 이름<input value={newDep.name_my} onChange={e=>setNewDep({...newDep,name_my:e.target.value})}/></label><label>한국어 이름<input value={newDep.name_ko} onChange={e=>setNewDep({...newDep,name_ko:e.target.value})}/></label></div><footer><button onClick={()=>setDepOpen(false)}>취소</button><button className="settings-primary" disabled={saving||!newDep.code.trim()||!newDep.name_en.trim()} onClick={()=>void run(()=>editingDepId?db!.from("departments").update({code:newDep.code.trim(),name_en:newDep.name_en.trim(),name_my:newDep.name_my.trim()||null,name_ko:newDep.name_ko.trim()||null}).eq("id",editingDepId):db!.from("departments").insert({code:newDep.code.trim(),name_en:newDep.name_en.trim(),name_my:newDep.name_my.trim()||null,name_ko:newDep.name_ko.trim()||null}),editingDepId?"부서 정보를 수정했습니다.":"부서를 등록했습니다.").then(()=>{setDepOpen(false);setEditingDepId("");})}>등록</button></footer></section></div>}
 </div>;
}
function Empty({children}:{children:React.ReactNode}){return <p className="settings-empty">{children}</p>}
