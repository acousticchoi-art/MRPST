"use client";

import {useEffect,useRef,useState,type PointerEvent as ReactPointerEvent,type ReactNode} from "react";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";
import {MY} from "./AdminMyanmarTranslator";

type Overrides=Record<string,string>;
const selector="h1,h2,h3,h4,p,span,strong,small,blockquote,li,a,button,label,summary";

export default function InlineAdminEditor({locale,children}:{locale:string;children:ReactNode}){
 const rootRef=useRef<HTMLDivElement>(null);
 const original=useRef(new Map<HTMLElement,string>());
 const [canManage,setCanManage]=useState(false),[editing,setEditing]=useState(false),[saving,setSaving]=useState(false),[message,setMessage]=useState("");
 const [position,setPosition]=useState<{x:number;y:number}|null>(null);
 const [overrides,setOverrides]=useState<Overrides>({});
 useEffect(()=>{
  if(locale!=="my")return;
  void fetch("/api/admin/data/website",{cache:"no-store",credentials:"same-origin"}).then(async response=>({response,data:await response.json().catch(()=>null)})).then(({response,data})=>{
   setCanManage(response.ok&&data?.canManage===true);
   const row=data?.items?.data?.find((item:{content_type?:string;content_key?:string;locale?:string})=>item.content_type==="page"&&item.content_key==="admin-translations"&&item.locale==="my");
   try{setOverrides(row?.body?JSON.parse(row.body):{});}catch{setOverrides({});}
  }).catch(()=>setCanManage(false));
 },[locale]);
 useEffect(()=>{try{const saved=localStorage.getItem("mrpst-inline-editor-position");if(saved)setPosition(JSON.parse(saved));}catch{}},[]);
 const startDrag=(event:ReactPointerEvent<HTMLSpanElement>)=>{event.preventDefault();const offsetX=event.clientX-(position?.x??window.innerWidth-190);const offsetY=event.clientY-(position?.y??18);const move=(moveEvent:globalThis.PointerEvent)=>{const next={x:Math.max(6,Math.min(window.innerWidth-190,moveEvent.clientX-offsetX)),y:Math.max(6,Math.min(window.innerHeight-50,moveEvent.clientY-offsetY))};setPosition(next);try{localStorage.setItem("mrpst-inline-editor-position",JSON.stringify(next));}catch{}};const end=()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",end);};window.addEventListener("pointermove",move);window.addEventListener("pointerup",end);};
 const pairs=()=>{
  const targets=new Map<string,string>();for(const [source,target] of Object.entries(MY))if(target&&!targets.has(target))targets.set(target,source);
  return {targets,elements:Array.from(rootRef.current?.querySelectorAll<HTMLElement>(selector)??[]).filter(element=>element.textContent?.trim()&&!element.closest("[data-inline-editor-controls]")&&!Array.from(element.querySelectorAll(selector)).some(child=>child!==element&&Boolean(child.textContent?.trim())))};
 };
 const start=()=>{const {targets,elements}=pairs();original.current.clear();elements.forEach(element=>{if(targets.has(element.textContent?.trim()??"")){original.current.set(element,element.textContent??"");element.contentEditable="true";element.classList.add("inline-editable-text");}});setEditing(true);setMessage("");};
 const stop=(restore:boolean)=>{original.current.forEach((value,element)=>{if(restore)element.textContent=value;element.contentEditable="false";element.classList.remove("inline-editable-text");});original.current.clear();setEditing(false);};
 const save=async()=>{const next={...overrides};const {targets}=pairs();original.current.forEach((before,element)=>{const source=targets.get(before);const value=element.textContent?.trim()??"";if(source&&value)next[source]=value;});setSaving(true);try{const db=createSupabaseBrowserClient();if(!db)throw new Error();const {data:{user}}=await db.auth.getUser();const row={content_type:"page",content_key:"admin-translations",locale:"my",title:"Administrator UI translations",body:JSON.stringify(next),is_published:true,sort_order:999,updated_by:user?.id??null};const {error}=await db.from("website_contents").upsert(row,{onConflict:"content_type,content_key,locale"});if(error)throw error;setOverrides(next);stop(false);setMessage("저장되었습니다. 새로고침하면 전체 화면에 반영됩니다.");}catch{setMessage("저장하지 못했습니다.");}finally{setSaving(false);}};
 return <div ref={rootRef}>{children}{locale==="my"&&canManage&&<div className="inline-editor-controls inline-admin-editor" data-inline-editor-controls style={position?{left:position.x,top:position.y,right:"auto"}:undefined}><span className="inline-editor-drag" onPointerDown={startDrag} title="끌어서 이동">⋮⋮</span><span>{message}</span>{editing?<><button type="button" onClick={()=>stop(true)} disabled={saving}>취소</button><button type="button" onClick={()=>void save()} disabled={saving}>{saving?"저장 중…":"저장"}</button></>:<button type="button" onClick={start}>편집 모드</button>}</div>}</div>;
}
