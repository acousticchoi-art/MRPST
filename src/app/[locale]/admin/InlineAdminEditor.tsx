"use client";

import {useEffect,useRef,useState,type PointerEvent as ReactPointerEvent,type ReactNode} from "react";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";
import {MY} from "./AdminMyanmarTranslator";
import {loadAdminTranslations} from "@/lib/admin-translations-request";

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
  let disposed=false;
  void loadAdminTranslations().then(({canManage,body})=>{
   if(disposed)return;
   setCanManage(canManage);
   try{setOverrides(body?JSON.parse(body):{});}catch{setOverrides({});}
  }).catch(()=>{if(!disposed)setCanManage(false);});
  return ()=>{disposed=true;};
 },[locale]);
 useEffect(()=>{try{const saved=localStorage.getItem("mrpst-inline-editor-position");if(saved)setPosition(JSON.parse(saved));}catch{}},[]);
 const startDrag=(event:ReactPointerEvent<HTMLSpanElement>)=>{event.preventDefault();const offsetX=event.clientX-(position?.x??window.innerWidth-190);const offsetY=event.clientY-(position?.y??18);const move=(moveEvent:globalThis.PointerEvent)=>{const next={x:Math.max(6,Math.min(window.innerWidth-190,moveEvent.clientX-offsetX)),y:Math.max(6,Math.min(window.innerHeight-50,moveEvent.clientY-offsetY))};setPosition(next);try{localStorage.setItem("mrpst-inline-editor-position",JSON.stringify(next));}catch{}};const end=()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",end);};window.addEventListener("pointermove",move);window.addEventListener("pointerup",end);};
 const pairs=()=>{
  const targets=new Map<string,string>();for(const [source,target] of Object.entries(MY))if(target&&!targets.has(target))targets.set(target,source);
  return {targets,elements:Array.from(rootRef.current?.querySelectorAll<HTMLElement>(selector)??[]).filter(element=>element.textContent?.trim()&&!element.closest("[data-inline-editor-controls]")&&!Array.from(element.querySelectorAll(selector)).some(child=>child!==element&&Boolean(child.textContent?.trim())))};
 };
 const start=()=>{const {targets,elements}=pairs();original.current.clear();elements.forEach(element=>{if(targets.has(element.textContent?.trim()??"")){original.current.set(element,element.textContent??"");element.contentEditable="true";element.classList.add("inline-editable-text");}});setEditing(true);setMessage("");};
 const stop=(restore:boolean)=>{original.current.forEach((value,element)=>{if(restore)element.textContent=value;element.contentEditable="false";element.classList.remove("inline-editable-text");});original.current.clear();setEditing(false);};
 const save=async()=>{const next={...overrides};const {targets}=pairs();original.current.forEach((before,element)=>{const source=targets.get(before);const value=element.textContent?.trim()??"";if(source&&value)next[source]=value;});setSaving(true);try{const db=createSupabaseBrowserClient();if(!db)throw new Error();const {data:{user}}=await db.auth.getUser();const row={content_type:"page",content_key:"admin-translations",locale:"my",title:"Administrator UI translations",body:JSON.stringify(next),is_published:true,sort_order:999,updated_by:user?.id??null};const {error}=await db.from("website_contents").upsert(row,{onConflict:"content_type,content_key,locale"});if(error)throw error;setOverrides(next);stop(false);setMessage("သိမ်းဆည်းပြီးပါပြီ။ စာမျက်နှာကို ပြန်ဖွင့်ပါက မျက်နှာပြင်အားလုံးတွင် အကျိုးသက်ရောက်ပါမည်။");}catch{setMessage("သိမ်းဆည်းမှု မအောင်မြင်ပါ။");}finally{setSaving(false);}};
 return <div ref={rootRef}>{children}{locale==="my"&&canManage&&<div className="inline-editor-controls inline-admin-editor" data-inline-editor-controls data-no-translate style={position?{left:position.x,top:position.y,right:"auto"}:undefined}><span className="inline-editor-drag" onPointerDown={startDrag} title="ဆွဲ၍ နေရာရွှေ့ရန်">⋮⋮</span><span>{message}</span>{editing?<><button type="button" onClick={()=>stop(true)} disabled={saving}>မလုပ်တော့ပါ</button><button type="button" onClick={()=>void save()} disabled={saving}>{saving?"သိမ်းဆည်းနေသည်…":"သိမ်းဆည်းရန်"}</button></>:<button type="button" onClick={start}>ပြင်ဆင်ရန်</button>}</div>}</div>;
}
