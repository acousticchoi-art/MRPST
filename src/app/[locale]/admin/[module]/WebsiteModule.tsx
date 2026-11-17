"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {FormField} from "./AdminUI";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";

type Entry={id:string;content_type:"page"|"announcement";content_key:string;locale:string;title:string;body:string;is_published:boolean;sort_order:number;updated_at:string};
const pageFields=[
 {key:"hero",label:"메인 화면",hint:"첫 화면의 제목과 소개 문구"},
 {key:"about",label:"학교 소개",hint:"학교 소개 제목과 본문"},
 {key:"history",label:"학교 연혁",hint:"연혁 섹션의 제목과 소개 문구"},
 {key:"contact",label:"연락처 영역",hint:"문의 섹션 제목과 안내 문구"},
 {key:"address",label:"학교 주소",hint:"메인 화면 하단에 표시할 주소"}
] as const;
const locales=[{value:"ko",label:"한국어"},{value:"my",label:"မြန်မာ"}];
export default function WebsiteModule(){
 const db=useMemo(()=>createSupabaseBrowserClient(),[]);
 const [items,setItems]=useState<Entry[]>([]);
 const [locale,setLocale]=useState("ko");
 const [tab,setTab]=useState<"pages"|"notices">("pages");
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const [pageValues,setPageValues]=useState<Record<string,{title:string;body:string}>>({});
 const [editingId,setEditingId]=useState("");
 const [noticeTitle,setNoticeTitle]=useState(""),[noticeBody,setNoticeBody]=useState(""),[noticeLocale,setNoticeLocale]=useState("ko"),[noticePublished,setNoticePublished]=useState(true);
 const load=useCallback(async()=>{setLoading(true);setError("");try{
  const response=await fetch("/api/admin/data/website",{cache:"no-store",credentials:"same-origin",headers:{Accept:"application/json"}});
  const data=await response.json().catch(()=>({error:"서버 응답을 읽을 수 없습니다."}));
  if(!response.ok)throw new Error(data.error||`홈페이지 콘텐츠 조회 실패 (HTTP ${response.status})`);
  if(data.items?.error)throw new Error("홈페이지 콘텐츠를 불러오지 못했습니다: "+data.items.error);
  const rows=(data.items?.data||[]) as Entry[];setItems(rows);
  const values:Record<string,{title:string;body:string}>={};
  for(const field of pageFields){const row=rows.find(x=>x.content_type==="page"&&x.content_key===field.key&&x.locale===locale);values[field.key]={title:row?.title||"",body:row?.body||""};}
  setPageValues(values);
 }catch(e:any){setError(e?.message||String(e)||"데이터를 불러오지 못했습니다.");}finally{setLoading(false);}},[locale]);
 useEffect(()=>{void load();},[load]);
 async function savePages(){
  if(!db)return;setSaving(true);setError("");setNotice("");
  try{
   const {data:{user}}=await db.auth.getUser();
   const rows=pageFields.map((field,index)=>({content_type:"page",content_key:field.key,locale,title:pageValues[field.key]?.title||"",body:pageValues[field.key]?.body||"",is_published:true,sort_order:index,updated_by:user?.id??null}));
   const {error}=await db.from("website_contents").upsert(rows,{onConflict:"content_type,content_key,locale"});
   if(error)throw error;
   setNotice("페이지 콘텐츠를 저장하고 홈페이지에 게시했습니다.");await load();
  }catch(e:any){setError(e?.message||"저장하지 못했습니다.");}
  finally{setSaving(false);}
 }
 async function saveNotice(){
  if(!db||!noticeTitle.trim()||!noticeBody.trim()){setError("공지 제목과 내용을 입력해 주세요.");return;}
  setSaving(true);setError("");setNotice("");
  try{
   const {data:{user}}=await db.auth.getUser();
   const existing=items.find(x=>x.id===editingId);
   const row={content_type:"announcement",content_key:existing?.content_key||"notice-"+crypto.randomUUID(),locale:noticeLocale,title:noticeTitle.trim(),body:noticeBody.trim(),is_published:noticePublished,sort_order:0,updated_by:user?.id??null};
   const query=existing?db.from("website_contents").update(row).eq("id",existing.id):db.from("website_contents").insert({...row,created_by:user?.id??null});
   const {error}=await query;if(error)throw error;
   setNotice(existing?"공지사항을 수정했습니다.":"공지사항을 등록했습니다.");resetNotice();await load();
  }catch(e:any){setError(e?.message||"공지사항을 저장하지 못했습니다.");}
  finally{setSaving(false);}
 }
 function resetNotice(){setEditingId("");setNoticeTitle("");setNoticeBody("");setNoticeLocale("ko");setNoticePublished(true);}
 function editNotice(item:Entry){setEditingId(item.id);setNoticeTitle(item.title);setNoticeBody(item.body);setNoticeLocale(item.locale);setNoticePublished(item.is_published);}
 async function toggleNotice(item:Entry){if(!db)return;setSaving(true);setError("");try{const {error}=await db.from("website_contents").update({is_published:!item.is_published}).eq("id",item.id);if(error)throw error;setNotice(item.is_published?"공지사항 게시를 중단했습니다.":"공지사항을 게시했습니다.");await load();}catch(e:any){setError(e?.message||"상태를 변경하지 못했습니다.");}finally{setSaving(false);}}
 async function deleteNotice(item:Entry){if(!db||!window.confirm("이 공지사항을 삭제할까요?"))return;setSaving(true);setError("");try{const {error}=await db.from("website_contents").delete().eq("id",item.id);if(error)throw error;setNotice("공지사항을 삭제했습니다.");await load();}catch(e:any){setError(e?.message||"삭제하지 못했습니다.");}finally{setSaving(false);}}
 const notices=items.filter(x=>x.content_type==="announcement").sort((a,b)=>b.updated_at.localeCompare(a.updated_at));
 return <div className="website-workspace website-workspace-v2">
  <div className="website-heading website-heading-v2">
   <div><span className="eyebrow">PUBLIC WEBSITE CMS</span><h2>홈페이지 관리</h2><p>홈페이지에 공개되는 학교 소개와 공지사항을 한곳에서 관리합니다.</p></div>
   <a className="website-preview-link" href={`/${locale}`} target="_blank" rel="noreferrer">홈페이지 미리보기 ↗</a>
  </div>
  <div className="website-overview">
   <article><span>페이지 콘텐츠</span><strong>{pageFields.length}</strong><small>관리 항목</small></article>
   <article><span>전체 공지사항</span><strong>{notices.length}</strong><small>등록된 글</small></article>
   <article><span>게시 중</span><strong>{notices.filter(x=>x.is_published).length}</strong><small>홈페이지 공개</small></article>
   <article><span>비공개</span><strong>{notices.filter(x=>!x.is_published).length}</strong><small>임시 보관</small></article>
  </div>
  {error&&<div className="website-alert error" role="alert">{error}</div>}
  {notice&&<div className="website-alert success" role="status">{notice}</div>}
  <nav className="website-tabs website-tabs-v2" aria-label="홈페이지 콘텐츠 종류">
   <button className={tab==="pages"?"active":""} onClick={()=>setTab("pages")}><span>01</span> 페이지 콘텐츠</button>
   <button className={tab==="notices"?"active":""} onClick={()=>setTab("notices")}><span>02</span> 공지사항 <b>{notices.length}</b></button>
  </nav>
  {tab==="pages"&&<section className="website-panel website-panel-v2">
   <div className="website-section-intro"><div><span className="website-kicker">PAGE EDITOR</span><h3>홈페이지 문구 편집</h3><p>수정할 언어를 선택하고 내용을 변경한 뒤 저장해 주세요. 저장된 내용은 해당 언어 홈페이지에 반영됩니다.</p></div>
    <FormField label="편집 언어" className="website-language-select"><select value={locale} onChange={e=>setLocale(e.target.value)}>{locales.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></FormField>
   </div>
   {loading?<div className="website-loading">콘텐츠를 불러오는 중입니다…</div>:<div className="website-fields website-fields-v2">{pageFields.map((field,index)=><article className="website-field website-field-v2" key={field.key}>
    <div className="website-field-title"><span>{String(index+1).padStart(2,"0")}</span><div><h4>{field.label}</h4><p>{field.hint}</p></div></div>
    <div className="website-field-inputs">{field.key!=="address"&&<FormField label="제목"<input value={pageValues[field.key]?.title||""} onChange={e=>setPageValues(v=>({...v,[field.key]:{...v[field.key],title:e.target.value}}))} placeholder={field.label+" 제목"}/></FormField>}
     <FormField label={field.key==="address"?"주소":"본문 및 소개 문구"}<textarea rows={field.key==="about"?5:3} value={pageValues[field.key]?.body||""} onChange={e=>setPageValues(v=>({...v,[field.key]:{...v[field.key],body:e.target.value}}))} placeholder="홈페이지에 표시할 내용을 입력하세요."/></FormField></div>
   </article>)}</div>}
   <div className="website-footer-actions"><span>변경한 내용은 저장 후 홈페이지에 게시됩니다.</span><button className="website-primary" disabled={saving||loading} onClick={()=>void savePages()}>{saving?"저장 중…":"변경 내용 저장 및 게시"}</button></div>
  </section>}
  {tab==="notices"&&<div className="website-notice-layout website-notice-layout-v2">
   <section className="website-panel website-panel-v2 website-notice-editor">
    <div className="website-section-intro"><div><span className="website-kicker">ANNOUNCEMENT EDITOR</span><h3>{editingId?"공지사항 수정":"새 공지사항 작성"}</h3><p>게시 상태로 저장하면 선택한 언어의 홈페이지에 공개됩니다.</p></div></div>
    <div className="website-form website-form-v2">
     <FormField label="게시 언어"<select value={noticeLocale} onChange={e=>setNoticeLocale(e.target.value)}>{locales.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></FormField>
     <FormField label="공지사항 제목"<input value={noticeTitle} onChange={e=>setNoticeTitle(e.target.value)} placeholder="예: 2026학년도 2학기 개강 안내"/></FormField>
     <FormField label="공지사항 내용"<textarea rows={9} value={noticeBody} onChange={e=>setNoticeBody(e.target.value)} placeholder="공지할 내용을 입력하세요."/></FormField>
     <label className="website-publish-check website-publish-check-v2"><input type="checkbox" checked={noticePublished} onChange={e=>setNoticePublished(e.target.checked)}/><span><strong>저장 후 홈페이지에 게시</strong><small>체크를 해제하면 비공개 상태로 저장됩니다.</small></span></label>
     <div className="website-actions website-actions-v2"><button className="website-primary" disabled={saving||!noticeTitle.trim()||!noticeBody.trim()} onClick={()=>void saveNotice()}>{saving?"저장 중…":editingId?"수정 내용 저장":"공지사항 등록"}</button>{editingId&&<button className="website-secondary" onClick={resetNotice}>수정 취소</button>}</div>
    </div>
   </section>
   <section className="website-panel website-panel-v2 website-notice-list-panel">
    <div className="website-section-intro website-list-intro"><div><span className="website-kicker">PUBLISHED CONTENT</span><h3>등록된 공지사항</h3><p>게시·비공개 상태를 확인하고 내용을 관리합니다.</p></div><strong className="website-count">{notices.length}건</strong></div>
    <div className="website-notice-list website-notice-list-v2">{notices.map(item=><article className="website-notice-item website-notice-item-v2" key={item.id}>
     <div className="website-notice-meta"><span className="website-locale-tag">{locales.find(x=>x.value===item.locale)?.label||item.locale}</span><span className={item.is_published?"published":"draft"}>{item.is_published?"게시 중":"비공개"}</span></div>
     <h4>{item.title}</h4><p>{item.body}</p><small className="website-updated">{new Date(item.updated_at).toLocaleDateString("ko-KR",{year:"numeric",month:"short",day:"numeric"})}</small>
     <div className="website-notice-actions"><button onClick={()=>editNotice(item)}>수정</button><button onClick={()=>void toggleNotice(item)} disabled={saving}>{item.is_published?"게시 중단":"게시하기"}</button><button className="danger" onClick={()=>void deleteNotice(item)} disabled={saving}>삭제</button></div>
    </article>)}{!notices.length&&!loading&&<div className="website-empty website-empty-v2"><strong>아직 등록된 공지사항이 없습니다.</strong><span>왼쪽 작성 영역에서 첫 공지사항을 등록해 보세요.</span></div>}</div>
   </section>
  </div>}
 </div>;
}
