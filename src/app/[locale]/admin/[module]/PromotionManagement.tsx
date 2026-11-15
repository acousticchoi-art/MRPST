"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";

type Row={id:string;[key:string]:any};
const decisionLabel:Record<string,string>={promote:"진급 예정",graduation_review:"졸업 검토",needs_review:"확인 필요",excluded:"진급 제외"};
export default function PromotionManagement(){
 const db=useMemo(()=>createSupabaseBrowserClient(),[]);
 const [terms,setTerms]=useState<Row[]>([]),[batches,setBatches]=useState<Row[]>([]),[items,setItems]=useState<Row[]>([]);
 const [batchId,setBatchId]=useState(""),[year,setYear]=useState(String(new Date().getFullYear()));
 const [canManage,setCanManage]=useState(false),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const load=useCallback(async()=>{
  if(!db){setLoading(false);return;}
  setLoading(true);setError("");
  const {data:{user}}=await db.auth.getUser();
  if(user){const {data}=await db.from("user_roles").select("role").eq("user_id",user.id);setCanManage((data||[]).some(x=>["super_admin","administrator","academic_officer"].includes(x.role)));}
  const [t,b]=await Promise.all([
   db.from("academic_terms").select("id,academic_year,name,status,term_code").order("academic_year",{ascending:false}).order("term_code"),
   db.from("student_promotion_batches").select("*").order("academic_year",{ascending:false})
  ]);
  if(t.error||b.error){setError(t.error?.message||b.error?.message||"진급 정보를 불러오지 못했습니다.");setLoading(false);return;}
  setTerms(t.data||[]);setBatches(b.data||[]);
  const chosen=(b.data||[]).find(x=>x.id===batchId)||(b.data||[])[0];
  if(chosen){setBatchId(chosen.id);const {data,error:e}=await db.from("student_promotion_items").select("*").eq("batch_id",chosen.id).order("student_number");if(e)setError(e.message);setItems(data||[]);}
  else {setBatchId("");setItems([]);}
  const latestYear=(t.data||[])[0]?.academic_year;
  if(latestYear)setYear(String(latestYear));
  setLoading(false);
 },[db,batchId]);
 useEffect(()=>{void load();},[load]);
 const completedYears=useMemo(()=>{const m=new Map<number,number>();terms.filter(x=>x.status==="completed").forEach(x=>m.set(Number(x.academic_year),(m.get(Number(x.academic_year))||0)+1));return [...m.entries()].filter(([,n])=>n>=2).map(([y])=>y);},[terms]);
 const selectedBatch=batches.find(x=>x.id===batchId);
 const counts=useMemo(()=>items.reduce((a,x)=>{a[x.decision]=(a[x.decision]||0)+1;return a;},{ } as Record<string,number>),[items]);
 const changeDecision=async(item:Row,decision:string)=>{
  if(!db||!canManage||selectedBatch?.status!=="review")return;
  setSaving(true);setError("");const {error:e}=await db.rpc("mrpst_set_student_promotion_decision",{p_item_id:item.id,p_decision:decision,p_note:null});
  if(e)setError(e.message);else{setItems(old=>old.map(x=>x.id===item.id?{...x,decision}:x));setNotice("학생 처리 상태를 변경했습니다.");}
  setSaving(false);
 };
 const createBatch=async()=>{
  if(!db)return;setSaving(true);setError("");setNotice("");
  const {data,error:e}=await db.rpc("mrpst_create_student_promotion_batch",{p_academic_year:Number(year)});
  if(e)setError(e.message);else{setBatchId(data);setNotice(year+"학년도 진급 명단을 만들었습니다.");}
  setSaving(false);await load();
 };
 const approve=async()=>{
  if(!db||!selectedBatch||!window.confirm(selectedBatch.academic_year+"학년도 진급 명단을 최종 승인할까요? 승인하면 진급 대상 학생의 학년 정보가 변경됩니다."))return;
  setSaving(true);setError("");const {data,error:e}=await db.rpc("mrpst_approve_student_promotion",{p_batch_id:selectedBatch.id});
  if(e)setError(e.message);else setNotice("최종 승인 완료: "+data+"명의 학년을 변경했습니다.");
  setSaving(false);await load();
 };
 const ready=items.length>0&&items.every(x=>x.decision!=="needs_review");
 return <section className="academics-panel promotion-panel">
  <div className="academics-panel-head"><div><h3>학년 진급</h3><p>두 학기 종료 후 재학생 명단을 확인하고 한 번에 진급 처리합니다.</p></div></div>
  {error&&<div className="academics-alert error">{error}</div>}{notice&&<div className="academics-alert">{notice}</div>}
  <div className="promotion-controls">
   <label>학년도<select value={year} onChange={e=>setYear(e.target.value)}>{[...new Set(terms.map(x=>String(x.academic_year)))].map(y=><option key={y} value={y}>{y}학년도</option>)}</select></label>
   <button className="academics-primary small" disabled={!canManage||saving||!completedYears.includes(Number(year))||batches.some(x=>x.academic_year===Number(year))} onClick={()=>void createBatch()}>{saving?"처리 중…":"진급 명단 자동 생성"}</button>
  </div>
  {!completedYears.includes(Number(year))&&<p className="academics-form-hint">해당 학년도의 1학기와 2학기가 모두 ‘종료’ 상태가 되어야 진급 명단을 생성할 수 있습니다.</p>}
  {batches.length>0&&<div className="promotion-controls"><label>진급 처리 내역<select value={batchId} onChange={e=>setBatchId(e.target.value)}>{batches.map(x=><option key={x.id} value={x.id}>{x.academic_year}학년도 · {x.status==="approved"?"승인 완료":"검토 중"}</option>)}</select></label></div>}
  {selectedBatch&&<>
   <div className="promotion-summary">
    <article><span>진급 대상</span><strong>{counts.promote||0}</strong></article>
    <article><span>졸업 검토</span><strong>{counts.graduation_review||0}</strong></article>
    <article><span>확인 필요</span><strong>{counts.needs_review||0}</strong></article>
    <article><span>진급 제외</span><strong>{counts.excluded||0}</strong></article>
   </div>
   <div className="academics-table-wrap"><table className="academics-table"><thead><tr><th>학번</th><th>학생</th><th>현재 학년</th><th>처리 결과</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td>{x.student_number}</td><td>{x.student_name}</td><td>{x.from_cohort||"미등록"}</td><td>{selectedBatch.status==="approved"?decisionLabel[x.decision]:<select disabled={!canManage||saving} value={x.decision} onChange={e=>void changeDecision(x,e.target.value)}><option value="promote">진급 예정</option><option value="graduation_review">졸업 검토</option><option value="needs_review">확인 필요</option><option value="excluded">진급 제외</option></select>}</td></tr>)}</tbody></table></div>
   {selectedBatch.status==="review"?<div className="promotion-approve"><p className="academics-form-hint">4학년은 자동 졸업시키지 않고 졸업 검토로 남깁니다. 확인 필요 항목을 모두 처리해야 승인할 수 있습니다.</p><button className="academics-primary" disabled={!canManage||saving||!ready} onClick={()=>void approve()}>{saving?"처리 중…":"진급 최종 승인"}</button></div>:<p className="academics-form-hint">승인 완료 · {selectedBatch.approved_at?new Date(selectedBatch.approved_at).toLocaleString("ko-KR"):""}</p>}
  </>}
  {!loading&&!selectedBatch&&<div className="academics-empty">아직 생성된 진급 명단이 없습니다. 두 학기가 모두 종료되면 자동 생성할 수 있습니다.</div>}
 </section>;
}
