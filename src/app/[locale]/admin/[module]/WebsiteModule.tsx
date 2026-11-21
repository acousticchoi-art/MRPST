"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {FormField} from "./AdminUI";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";
import {MY} from "../AdminMyanmarTranslator";

type Entry={id:string;content_type:"page"|"announcement";content_key:string;locale:string;title:string;body:string;is_published:boolean;sort_order:number;updated_at:string};
const pageFields=[
 {key:"hero",label:"메인 화면",hint:"첫 화면의 제목과 소개 문구"},
 {key:"about",label:"학교 소개",hint:"학교 소개 제목과 본문"},
 {key:"history",label:"학교 연혁",hint:"연혁 섹션의 제목과 소개 문구"},
 {key:"contact",label:"연락처 영역",hint:"문의 섹션 제목과 안내 문구"},
 {key:"address",label:"학교 주소",hint:"메인 화면 하단에 표시할 주소"},
 {key:"about-hero",label:"소개 페이지 · 첫 화면",hint:"학교 소개 페이지의 제목과 요약"},
 {key:"about-foundation",label:"소개 페이지 · 설립 이념",hint:"설립 목적과 교육 이념"},
 {key:"about-greeting",label:"소개 페이지 · 인사말",hint:"학과장 인사말 제목과 본문"},
 {key:"about-facts",label:"소개 페이지 · 일반 현황",hint:"일반 현황 섹션의 제목과 안내 문구"},
 {key:"about-history",label:"소개 페이지 · 교육 과정 연혁",hint:"교육 과정 연혁 섹션의 제목과 안내 문구"},
 {key:"about-contact",label:"소개 페이지 · 문의",hint:"소개 페이지 하단 문의 제목과 안내"},
 {key:"academics-hero",label:"학과 페이지 · 첫 화면",hint:"학과 안내 페이지의 제목과 요약"},
 {key:"academics-programs",label:"학과 페이지 · 과정 안내",hint:"교육과정 섹션의 제목과 소개"},
 {key:"academics-approach",label:"학과 페이지 · 교육 방향",hint:"교육 방향 섹션의 제목과 안내"},
 {key:"academics-calendar",label:"학과 페이지 · 학사 일정",hint:"학사 일정 섹션의 제목과 안내"},
 {key:"academics-admission",label:"학과 페이지 · 입학 안내",hint:"입학 자격 섹션의 제목과 안내"},
 {key:"academics-contact",label:"학과 페이지 · 문의",hint:"학과 페이지 하단 문의 제목과 안내"},
 {key:"contact-hero",label:"연락처 페이지 · 첫 화면",hint:"연락처 페이지의 제목과 소개"},
 {key:"contact-info",label:"연락처 페이지 · 방문 안내",hint:"주소와 지도 버튼 위에 표시할 안내"},
 {key:"calendar-hero",label:"학사 일정 페이지 · 첫 화면",hint:"학사 일정 페이지의 제목과 소개"}
] as const;
const locales=[{value:"ko",label:"한국어"},{value:"my",label:"မြန်မာ"}];
export default function WebsiteModule({canManage}:{canManage:boolean}){
 const mutationsEnabled=process.env.NEXT_PUBLIC_MRPST_ACADEMIC_MUTATIONS_ENABLED!=="false";
 const db=useMemo(()=>createSupabaseBrowserClient(),[]);
 const [items,setItems]=useState<Entry[]>([]);
 const [tab,setTab]=useState<"translation"|"notices"|"admin">("notices");
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const [translationValues,setTranslationValues]=useState<Record<string,Record<string,{title:string;body:string}>>>({});
 const [editingId,setEditingId]=useState("");
 const [noticeTitle,setNoticeTitle]=useState(""),[noticeBody,setNoticeBody]=useState(""),[noticeLocale,setNoticeLocale]=useState("ko"),[noticePublished,setNoticePublished]=useState(true);
 const [adminTranslations,setAdminTranslations]=useState<Record<string,string>>({});
 const [adminQuery,setAdminQuery]=useState(""),[adminKey,setAdminKey]=useState("");
 const load=useCallback(async()=>{setLoading(true);setError("");try{
  const response=await fetch("/api/admin/data/website",{cache:"no-store",credentials:"same-origin",headers:{Accept:"application/json"}});
  const data=await response.json().catch(()=>({error:"서버 응답을 읽을 수 없습니다."}));
  if(!response.ok)throw new Error(data.error||`홈페이지 콘텐츠 조회 실패 (HTTP ${response.status})`);
  if(data.items?.error)throw new Error("홈페이지 콘텐츠를 불러오지 못했습니다: "+data.items.error);
  const rows=(data.items?.data||[]) as Entry[];setItems(rows);
  const adminRow=rows.find(row=>row.content_type==="page"&&row.content_key==="admin-translations"&&row.locale==="my");
  try{setAdminTranslations(adminRow?.body?JSON.parse(adminRow.body):{});}catch{setAdminTranslations({});}
  const translations:Record<string,Record<string,{title:string;body:string}>>={};
  const allPageKeys=Array.from(new Set([...pageFields.map(field=>field.key),...rows.filter(row=>row.content_type==="page").map(row=>row.content_key)]));
  for(const key of allPageKeys){translations[key]={};for(const language of locales){const row=rows.find(x=>x.content_type==="page"&&x.content_key===key&&x.locale===language.value);translations[key][language.value]={title:row?.title||"",body:row?.body||""};}}
  setTranslationValues(translations);
 }catch(e:any){setError(e?.message||String(e)||"데이터를 불러오지 못했습니다.");}finally{setLoading(false);}},[]);
 useEffect(()=>{void load();},[load]);
 const translationFields=useMemo(()=>{
  const known=new Map<string,{key:string;label:string;hint:string}>(pageFields.map(field=>[field.key,{...field}]));
  const keys=Array.from(new Set([...pageFields.map(field=>field.key),...items.filter(item=>item.content_type==="page"&&item.content_key!=="admin-translations"&&!item.content_key.startsWith("inline-page-")).map(item=>item.content_key)]));
  return keys.map(key=>known.get(key)||{key,label:key.replace(/[-_]/g," "),hint:"홈페이지에 등록된 추가 문구"});
 },[items]);
 async function saveTranslations(){
  if(!canManage){setError("홈페이지 변경 권한이 없습니다.");return;}
  if(!mutationsEnabled){setError("홈페이지 콘텐츠 변경은 개발 안전 잠금이 활성화되어 있습니다.");return;}
  if(!db)return;setSaving(true);setError("");setNotice("");
  try{
   const {data:{user}}=await db.auth.getUser();
   const rows=translationFields.flatMap((field,index)=>locales.map(language=>({content_type:"page",content_key:field.key,locale:language.value,title:translationValues[field.key]?.[language.value]?.title||"",body:translationValues[field.key]?.[language.value]?.body||"",is_published:true,sort_order:index,updated_by:user?.id??null})));
   const {data:saved,error}=await db.from("website_contents").upsert(rows,{onConflict:"content_type,content_key,locale"}).select("content_key,locale,title,body");
   if(error)throw error;
   if(!saved||saved.length!==rows.length||saved.some(row=>{const expected=rows.find(x=>x.content_key===row.content_key&&x.locale===row.locale);return !expected||row.title!==expected.title||row.body!==expected.body;}))throw new Error("번역 콘텐츠 저장 결과를 확인할 수 없습니다.");
   setNotice("한국어와 미얀마어 페이지 콘텐츠를 저장했습니다.");await load();
  }catch(e:any){setError(e?.message||"번역 콘텐츠를 저장하지 못했습니다.");}
  finally{setSaving(false);}
 }
 async function saveNotice(){
  if(!canManage){setError("홈페이지 변경 권한이 없습니다.");return;}
  if(!mutationsEnabled){setError("홈페이지 콘텐츠 변경은 개발 안전 잠금이 활성화되어 있습니다.");return;}
  if(!db||!noticeTitle.trim()||!noticeBody.trim()){setError("공지 제목과 내용을 입력해 주세요.");return;}
  setSaving(true);setError("");setNotice("");
  try{
   const {data:{user}}=await db.auth.getUser();
   const existing=items.find(x=>x.id===editingId);
   const row={content_type:"announcement",content_key:existing?.content_key||"notice-"+crypto.randomUUID(),locale:noticeLocale,title:noticeTitle.trim(),body:noticeBody.trim(),is_published:noticePublished,sort_order:0,updated_by:user?.id??null};
   const query=existing?db.from("website_contents").update(row).eq("id",existing.id):db.from("website_contents").insert({...row,created_by:user?.id??null});
   const {data:verified,error}=await query.select("id").single();if(error)throw error;if(!verified?.id||(existing&&verified.id!==existing.id))throw new Error("공지사항 저장 결과를 확인할 수 없습니다.");
   setNotice(existing?"공지사항을 수정했습니다.":"공지사항을 등록했습니다.");resetNotice();await load();
  }catch(e:any){setError(e?.message||"공지사항을 저장하지 못했습니다.");}
  finally{setSaving(false);}
 }
 async function saveAdminTranslation(){
  if(!canManage){setError("홈페이지 변경 권한이 없습니다.");return;}
  if(!mutationsEnabled){setError("홈페이지 콘텐츠 변경은 개발 안전 잠금이 활성화되어 있습니다.");return;}
  if(!db||!adminKey)return;
  const next={...adminTranslations};
  const value=(next[adminKey]??MY[adminKey]??"").trim();
  if(value)next[adminKey]=value;else delete next[adminKey];
  setSaving(true);setError("");setNotice("");
  try{
   const {data:{user}}=await db.auth.getUser();
   const row={content_type:"page",content_key:"admin-translations",locale:"my",title:"Administrator UI translations",body:JSON.stringify(next),is_published:true,sort_order:999,updated_by:user?.id??null};
   const {data:saved,error}=await db.from("website_contents").upsert(row,{onConflict:"content_type,content_key,locale"}).select("id,body").single();
   if(error)throw error;
   if(!saved?.id||saved.body!==row.body)throw new Error("관리자 번역 저장 결과를 확인할 수 없습니다.");
   setAdminTranslations(next);setNotice("관리자 화면 번역을 저장했습니다. 미얀마어 관리자 화면을 새로고침하면 적용됩니다.");await load();
  }catch(e:any){setError(e?.message||"관리자 번역을 저장하지 못했습니다.");}
  finally{setSaving(false);}
 }
 function resetNotice(){setEditingId("");setNoticeTitle("");setNoticeBody("");setNoticeLocale("ko");setNoticePublished(true);}
 function editNotice(item:Entry){setEditingId(item.id);setNoticeTitle(item.title);setNoticeBody(item.body);setNoticeLocale(item.locale);setNoticePublished(item.is_published);}
 async function toggleNotice(item:Entry){if(!canManage){setError("홈페이지 변경 권한이 없습니다.");return;}if(!mutationsEnabled){setError("홈페이지 콘텐츠 변경은 개발 안전 잠금이 활성화되어 있습니다.");return;}if(!db)return;setSaving(true);setError("");try{const {data:verified,error}=await db.from("website_contents").update({is_published:!item.is_published}).eq("id",item.id).select("id,is_published").single();if(error)throw error;if(!verified||verified.id!==item.id||verified.is_published===item.is_published)throw new Error("공지 게시 상태 변경 결과를 확인할 수 없습니다.");setNotice(item.is_published?"공지사항 게시를 중단했습니다.":"공지사항을 게시했습니다.");await load();}catch(e:any){setError(e?.message||"상태를 변경하지 못했습니다.");}finally{setSaving(false);}}
 async function deleteNotice(item:Entry){if(!canManage){setError("홈페이지 변경 권한이 없습니다.");return;}if(!mutationsEnabled){setError("홈페이지 콘텐츠 변경은 개발 안전 잠금이 활성화되어 있습니다.");return;}if(!db||!window.confirm("이 공지사항을 삭제할까요?"))return;setSaving(true);setError("");try{const {data:deleted,error}=await db.from("website_contents").delete().eq("id",item.id).select("id").maybeSingle();if(error)throw error;if(!deleted?.id||deleted.id!==item.id)throw new Error("삭제된 공지사항을 확인할 수 없습니다.");setNotice("공지사항을 삭제했습니다.");await load();}catch(e:any){setError(e?.message||"삭제하지 못했습니다.");}finally{setSaving(false);}}
 const notices=items.filter(x=>x.content_type==="announcement").sort((a,b)=>b.updated_at.localeCompare(a.updated_at));
 return <div className="website-workspace website-workspace-v2">{!canManage&&<div className="website-alert">읽기 전용 권한입니다. 홈페이지 콘텐츠와 공지사항을 조회할 수 있습니다.</div>}
  <div className="website-heading website-heading-v2">
   <div><span className="eyebrow">PUBLIC WEBSITE CMS</span><h2>홈페이지 관리</h2><p>공지사항을 먼저 관리하고, 필요한 경우 아래에서 두 언어의 홈페이지 문구를 함께 수정합니다.</p></div>
   <a className="website-preview-link" href="/ko" target="_blank" rel="noreferrer">홈페이지 미리보기 ↗</a>
  </div>
  <div className="website-overview">
   <article><span>페이지 콘텐츠</span><strong>{pageFields.length}</strong><small>관리 항목</small></article>
   <article><span>전체 공지사항</span><strong>{notices.length}</strong><small>등록된 글</small></article>
   <article><span>게시 중</span><strong>{notices.filter(x=>x.is_published).length}</strong><small>홈페이지 공개</small></article>
   <article><span>비공개</span><strong>{notices.filter(x=>!x.is_published).length}</strong><small>임시 보관</small></article>
  </div>
  <div className="website-workflow"><article><b>1</b><div><strong>공지 작성</strong><span>먼저 공지사항을 등록하거나 게시 상태를 바꿉니다.</span></div></article><article><b>2</b><div><strong>문구 관리</strong><span>한국어와 미얀마어 문구를 한 화면에서 수정합니다.</span></div></article><article><b>3</b><div><strong>홈페이지 확인</strong><span>미리보기에서 실제 공개 화면을 확인합니다.</span></div></article></div>
  {error&&<div className="website-alert error" role="alert">{error}</div>}
  {notice&&<div className="website-alert success" role="status">{notice}</div>}
  <nav className="website-tabs website-tabs-v2" aria-label="홈페이지 콘텐츠 종류">
   <button className={tab==="notices"?"active":""} onClick={()=>setTab("notices")}><span>01</span> 공지사항</button>
   <button className={tab==="translation"?"active":""} onClick={()=>setTab("translation")}><span>02</span> 홈페이지 문구</button>
   <button className={tab==="admin"?"active":""} onClick={()=>setTab("admin")}><span>03</span> 관리자 화면 번역</button>
  </nav>
  {tab==="translation"&&<section className="website-panel website-panel-v2 website-translation-panel">
   <div className="website-section-intro"><div><span className="website-kicker">BILINGUAL PAGE EDITOR</span><h3>홈페이지 문구</h3><p>한국어와 미얀마어를 한 화면에서 확인하고 수정합니다. 저장하면 두 언어 페이지에 각각 반영됩니다.</p></div></div>
   {loading?<div className="website-loading">콘텐츠를 불러오는 중입니다…</div>:<div className="website-translation-list">{translationFields.map((field,index)=><article className="website-translation-item" key={field.key}>
    <div className="website-field-title"><span>{String(index+1).padStart(2,"0")}</span><div><h4>{field.label}</h4><p>{field.hint}</p></div></div>
    <div className="website-translation-columns">{locales.map(language=><section key={language.value} className="website-translation-language"><h5>{language.label}</h5>{field.key!=="address"&&<FormField label="제목"><input disabled={!canManage||saving} value={translationValues[field.key]?.[language.value]?.title||""} onChange={e=>setTranslationValues(values=>({...values,[field.key]:{...values[field.key],[language.value]:{...values[field.key]?.[language.value],title:e.target.value}}}))}/></FormField>}<FormField label={field.key==="address"?"주소":"본문 및 소개 문구"}><textarea disabled={!canManage||saving} rows={field.key==="about"?6:4} value={translationValues[field.key]?.[language.value]?.body||""} onChange={e=>setTranslationValues(values=>({...values,[field.key]:{...values[field.key],[language.value]:{...values[field.key]?.[language.value],body:e.target.value}}}))}/></FormField></section>)}</div>
   </article>)}</div>}
   <div className="website-footer-actions"><span>두 언어를 함께 저장합니다. 비어 있는 항목도 그대로 저장되니 내용을 확인해 주세요.</span><button className="website-primary" disabled={!canManage||saving||loading} onClick={()=>void saveTranslations()}>{saving?"저장 중…":"두 언어 저장 및 게시"}</button></div>
  </section>}
  {tab==="notices"&&<div className="website-notice-layout website-notice-layout-v2">
   <section className="website-panel website-panel-v2 website-notice-editor">
    <div className="website-section-intro"><div><span className="website-kicker">ANNOUNCEMENT EDITOR</span><h3>{editingId?"공지사항 수정":"새 공지사항 작성"}</h3><p>게시 상태로 저장하면 선택한 언어의 홈페이지에 공개됩니다.</p></div></div>
    <div className="website-form website-form-v2">
     <FormField label="게시 언어"><select disabled={!canManage||saving} value={noticeLocale} onChange={e=>setNoticeLocale(e.target.value)}>{locales.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></FormField>
     <FormField label="공지사항 제목"><input disabled={!canManage||saving} value={noticeTitle} onChange={e=>setNoticeTitle(e.target.value)} placeholder="예: 2026학년도 2학기 개강 안내"/></FormField>
     <FormField label="공지사항 내용"><textarea disabled={!canManage||saving} rows={9} value={noticeBody} onChange={e=>setNoticeBody(e.target.value)} placeholder="공지할 내용을 입력하세요."/></FormField>
     <label className="website-publish-check website-publish-check-v2"><input type="checkbox" disabled={!canManage||saving} checked={noticePublished} onChange={e=>setNoticePublished(e.target.checked)}/><span><strong>저장 후 홈페이지에 게시</strong><small>체크를 해제하면 비공개 상태로 저장됩니다.</small></span></label>
     <div className="website-actions website-actions-v2"><button className="website-primary" disabled={!canManage||saving||!noticeTitle.trim()||!noticeBody.trim()} onClick={()=>void saveNotice()}>{saving?"저장 중…":editingId?"수정 내용 저장":"공지사항 등록"}</button>{editingId&&<button className="website-secondary" disabled={!canManage} onClick={resetNotice}>수정 취소</button>}</div>
    </div>
   </section>
   <section className="website-panel website-panel-v2 website-notice-list-panel">
    <div className="website-section-intro website-list-intro"><div><span className="website-kicker">PUBLISHED CONTENT</span><h3>등록된 공지사항</h3><p>게시·비공개 상태를 확인하고 내용을 관리합니다.</p></div><strong className="website-count">{notices.length}건</strong></div>
    <div className="website-notice-list website-notice-list-v2">{notices.map(item=><article className="website-notice-item website-notice-item-v2" key={item.id}>
     <div className="website-notice-meta"><span className="website-locale-tag">{locales.find(x=>x.value===item.locale)?.label||item.locale}</span><span className={item.is_published?"published":"draft"}>{item.is_published?"게시 중":"비공개"}</span></div>
     <h4>{item.title}</h4><p>{item.body}</p><small className="website-updated">{new Date(item.updated_at).toLocaleDateString("ko-KR",{year:"numeric",month:"short",day:"numeric"})}</small>
     <div className="website-notice-actions"><button disabled={!canManage||saving} onClick={()=>editNotice(item)}>수정</button><button onClick={()=>void toggleNotice(item)} disabled={!canManage||saving}>{item.is_published?"게시 중단":"게시하기"}</button><button className="danger" onClick={()=>void deleteNotice(item)} disabled={!canManage||saving}>삭제</button></div>
    </article>)}{!notices.length&&!loading&&<div className="website-empty website-empty-v2"><strong>아직 등록된 공지사항이 없습니다.</strong><span>왼쪽 작성 영역에서 첫 공지사항을 등록해 보세요.</span></div>}</div>
   </section>
  </div>}
  {tab==="admin"&&<section className="website-panel website-panel-v2 website-translation-panel">
   <div className="website-section-intro"><div><span className="website-kicker">ADMINISTRATOR UI</span><h3>관리자 화면 미얀마어 교정</h3><p>한국어 원문을 검색해 미얀마어 표현을 직접 교정합니다. 저장한 문구는 미얀마어 관리자 화면에 우선 적용됩니다.</p></div></div>
   <div className="website-form website-form-v2"><FormField label="한국어 원문 검색"><input value={adminQuery} onChange={e=>setAdminQuery(e.target.value)} placeholder="예: 저장, 학생 관리"/></FormField>
    <FormField label="수정할 문구"><select value={adminKey} onChange={e=>setAdminKey(e.target.value)} disabled={!canManage||saving}><option value="">문구를 선택하세요</option>{Object.keys(MY).filter(key=>key.toLowerCase().includes(adminQuery.toLowerCase())||MY[key].toLowerCase().includes(adminQuery.toLowerCase())).sort((a,b)=>a.localeCompare(b,"ko")).slice(0,200).map(key=><option key={key} value={key}>{key}</option>)}</select></FormField>
    {adminKey&&<><FormField label="한국어 원문"><textarea rows={3} value={adminKey} readOnly/></FormField><FormField label="미얀마어 번역"><textarea rows={4} disabled={!canManage||saving} value={adminTranslations[adminKey]??MY[adminKey]??""} onChange={e=>setAdminTranslations(values=>({...values,[adminKey]:e.target.value}))}/></FormField><div className="website-actions website-actions-v2"><button className="website-primary" disabled={!canManage||saving} onClick={()=>void saveAdminTranslation()}>{saving?"저장 중…":"미얀마어 번역 저장"}</button></div></>}
   </div>
  </section>}
 </div>;
}

