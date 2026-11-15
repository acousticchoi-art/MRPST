"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";

type Entry={id:string;content_type:"page"|"announcement";content_key:string;locale:string;title:string;body:string;is_published:boolean;sort_order:number;updated_at:string};
const pageFields=[
 {key:"hero",label:"메인 화면",hint:"첫 화면의 제목과 소개 문구"},
 {key:"about",label:"학교 소개",hint:"학교 소개 제목과 본문"},
 {key:"history",label:"학교 연혁",hint:"연혁 섹션의 제목과 소개 문구"},
 {key:"contact",label:"연락처 영역",hint:"문의 섹션 제목과 안내 문구"},
 {key:"address",label:"학교 주소",hint:"메인 화면 하단에 표시할 주소"}
] as const;
const locales=[{value:"ko",label:"한국어"},{value:"my",label:"မြန်မာ"},{value:"en",label:"English"}];
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
 const load=useCallback(async()=>{
  if(!db){setError("데이터베이스 연결을 확인해 주세요.");setLoading(false);return;}
  setLoading(true);setError("");
  const {data,error}=await db.from("website_contents").select("*").order("sort_order").order("updated_at",{ascending:false});
  if(error){setError("홈페이지 콘텐츠를 불러오지 못했습니다: "+error.message);setLoading(false);return;}
  const rows=(data||[]) as Entry[];setItems(rows);
  const values:Record<string,{title:string;body:string}>={};
  for(const field of pageFields){const row=rows.find(x=>x.content_type==="page"&&x.content_key===field.key&&x.locale===locale);values[field.key]={title:row?.title||"",body:row?.body||""};}
  setPageValues(values);setLoading(false);
 },[db,locale]);
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
 return <div className="website-workspace">
  <div className="website-heading"><span className="eyebrow">PUBLIC WEBSITE CMS</span><h2>홈페이지 관리</h2><p>방문자에게 공개되는 학교 소개 문구와 공지사항을 관리합니다.</p></div>
  {error&&<div className="website-alert error">{error}</div>}{notice&&<div className="website-alert success">{notice}</div>}
  <nav className="website-tabs"><button className={tab==="pages"?"active":""} onClick={()=>setTab("pages")}>페이지 콘텐츠</button><button className={tab==="notices"?"active":""} onClick={()=>setTab("notices")}>공지사항 ({notices.length})</button></nav>
  {tab==="pages"&&<section className="website-panel">
   <div className="website-panel-head"><div><h3>홈페이지 문구 편집</h3><p>언어별 콘텐츠를 수정하면 저장 즉시 해당 언어 홈페이지에 게시됩니다.</p></div><select value={locale} onChange={e=>setLocale(e.target.value)}>{locales.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></div>
   {loading?<p>콘텐츠를 불러오는 중입니다.</p>:<div className="website-fields">{pageFields.map(field=><article className="website-field" key={field.key}><div><h4>{field.label}</h4><p>{field.hint}</p></div><label>제목<input value={pageValues[field.key]?.title||""} onChange={e=>setPageValues(v=>({...v,[field.key]:{...v[field.key],title:e.target.value}}))}/></label><label>본문 또는 표시 내용<textarea rows={field.key==="about"?5:3} value={pageValues[field.key]?.body||""} onChange={e=>setPageValues(v=>({...v,[field.key]:{...v[field.key],body:e.target.value}}))}/></label></article>)}</div>}
   <div className="website-actions"><button className="website-primary" disabled={saving||loading} onClick={()=>void savePages()}>{saving?"저장 중…":"변경 내용 저장 및 게시"}</button></div>
  </section>}
  {tab==="notices"&&<div className="website-notice-layout">
   <section className="website-panel"><div className="website-panel-head"><div><h3>{editingId?"공지사항 수정":"새 공지사항 등록"}</h3><p>게시된 공지사항은 홈페이지 방문자에게 공개됩니다.</p></div></div>
    <div className="website-form"><label>언어<select value={noticeLocale} onChange={e=>setNoticeLocale(e.target.value)}>{locales.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label><label>제목<input value={noticeTitle} onChange={e=>setNoticeTitle(e.target.value)} placeholder="공지사항 제목"/></label><label>내용<textarea rows={6} value={noticeBody} onChange={e=>setNoticeBody(e.target.value)} placeholder="공지사항 내용을 입력하세요."/></label><label className="website-publish-check"><input type="checkbox" checked={noticePublished} onChange={e=>setNoticePublished(e.target.checked)}/> 저장 후 바로 게시</label><div className="website-actions"><button className="website-primary" disabled={saving||!noticeTitle.trim()||!noticeBody.trim()} onClick={()=>void saveNotice()}>{saving?"저장 중…":editingId?"수정 저장":"공지사항 등록"}</button>{editingId&&<button className="website-secondary" onClick={resetNotice}>취소</button>}</div></div>
   </section>
   <section className="website-panel"><div className="website-panel-head"><div><h3>등록된 공지사항</h3><p>{notices.length}건</p></div></div>
    <div className="website-notice-list">{notices.map(item=><article className="website-notice-item" key={item.id}><div className="website-notice-meta"><span>{locales.find(x=>x.value===item.locale)?.label||item.locale}</span><span className={item.is_published?"published":"draft"}>{item.is_published?"게시 중":"비공개"}</span></div><h4>{item.title}</h4><p>{item.body}</p><div className="website-notice-actions"><button onClick={()=>editNotice(item)}>수정</button><button onClick={()=>void toggleNotice(item)} disabled={saving}>{item.is_published?"게시 중단":"게시"}</button><button className="danger" onClick={()=>void deleteNotice(item)} disabled={saving}>삭제</button></div></article>)}{!notices.length&&!loading&&<p className="website-empty">등록된 공지사항이 없습니다.</p>}</div>
   </section>
  </div>}
 </div>;
}
