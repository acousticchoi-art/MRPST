"use client";

import {useCallback,useEffect,useRef,useState,type PointerEvent as ReactPointerEvent,type ReactNode} from "react";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";

type InlineValues=Record<string,string>;
const editableSelector="h1,h2,h3,h4,p,span,strong,small,blockquote,li,a,button,label";

function textElements(root:HTMLElement){
  return Array.from(root.querySelectorAll<HTMLElement>(editableSelector)).filter(element=>
    element.textContent?.trim()&&
    !element.closest("[data-inline-editor-controls]")&&
    !Array.from(element.querySelectorAll(editableSelector)).some(child=>child!==element&&Boolean(child.textContent?.trim()))
  );
}

function elementKey(root:HTMLElement,element:HTMLElement){
  const parts:string[]=[];
  let current:HTMLElement|null=element;
  while(current&&current!==root){
    const parent:HTMLElement|null=current.parentElement;
    if(!parent)break;
    parts.unshift(String(Array.from(parent.children).indexOf(current)));
    current=parent;
  }
  return parts.join(".");
}

export default function InlinePageEditor({pageKey,locale,children}:{pageKey:string;locale:string;children:ReactNode}){
  const rootRef=useRef<HTMLDivElement>(null);
  const original=useRef<InlineValues>({});
  const [canManage,setCanManage]=useState(false);
  const [editing,setEditing]=useState(false);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const [position,setPosition]=useState<{x:number;y:number}|null>(null);
  const storageKey=`inline-page-${pageKey}`;

  const applyValues=useCallback((values:InlineValues)=>{
    const root=rootRef.current;if(!root)return;
    textElements(root).forEach(element=>{const value=values[elementKey(root,element)];if(value!==undefined)element.textContent=value;});
  },[]);

  useEffect(()=>{
    const root=rootRef.current;if(!root)return;
    void fetch("/api/admin/data/website",{cache:"no-store",credentials:"same-origin"})
      .then(async response=>({response,data:await response.json().catch(()=>null)}))
      .then(({response,data})=>setCanManage(response.ok&&data?.canManage===true))
      .catch(()=>setCanManage(false));
    const db=createSupabaseBrowserClient();
    if(!db)return;
    void db.from("website_contents").select("body").eq("content_type","page").eq("content_key",storageKey).eq("locale",locale).eq("is_published",true).maybeSingle()
      .then(({data})=>{try{if(data?.body)applyValues(JSON.parse(data.body));}catch{}});
  },[applyValues,locale,storageKey]);

  useEffect(()=>{try{const saved=localStorage.getItem("mrpst-inline-editor-position");if(saved)setPosition(JSON.parse(saved));}catch{}},[]);
  const startDrag=(event:ReactPointerEvent<HTMLSpanElement>)=>{
    event.preventDefault();
    const offsetX=event.clientX-(position?.x??window.innerWidth-190);
    const offsetY=event.clientY-(position?.y??18);
    const move=(moveEvent:globalThis.PointerEvent)=>{
      const next={x:Math.max(6,Math.min(window.innerWidth-190,moveEvent.clientX-offsetX)),y:Math.max(6,Math.min(window.innerHeight-50,moveEvent.clientY-offsetY))};
      setPosition(next);try{localStorage.setItem("mrpst-inline-editor-position",JSON.stringify(next));}catch{}
    };
    const end=()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",end);};
    window.addEventListener("pointermove",move);window.addEventListener("pointerup",end);
  };

  const stopEditing=useCallback((restore:boolean)=>{
    const root=rootRef.current;if(!root)return;
    textElements(root).forEach(element=>{
      const key=elementKey(root,element);
      if(restore&&original.current[key]!==undefined)element.textContent=original.current[key];
      element.contentEditable="false";
      element.classList.remove("inline-editable-text");
    });
    setEditing(false);
  },[]);

  const startEditing=()=>{
    const root=rootRef.current;if(!root)return;
    const values:InlineValues={};
    textElements(root).forEach(element=>{values[elementKey(root,element)]=element.textContent??"";element.contentEditable="true";element.classList.add("inline-editable-text");});
    original.current=values;setMessage("");setEditing(true);
  };

  const save=async()=>{
    const root=rootRef.current;const db=createSupabaseBrowserClient();if(!root||!db)return;
    const values:InlineValues={};textElements(root).forEach(element=>{values[elementKey(root,element)]=element.textContent??"";});
    setSaving(true);setMessage("");
    try{
      const {data:{user}}=await db.auth.getUser();
      const row={content_type:"page",content_key:storageKey,locale,title:`Inline text: ${pageKey}`,body:JSON.stringify(values),is_published:true,sort_order:998,updated_by:user?.id??null};
      const {error}=await db.from("website_contents").upsert(row,{onConflict:"content_type,content_key,locale"});
      if(error)throw error;
      original.current=values;stopEditing(false);setMessage("저장되었습니다.");
    }catch{setMessage("저장하지 못했습니다. 권한과 연결 상태를 확인해 주세요.");}
    finally{setSaving(false);}
  };

  return <div ref={rootRef} data-inline-page={pageKey}>{children}{canManage&&<div className="inline-editor-controls" data-inline-editor-controls style={position?{left:position.x,top:position.y,right:"auto"}:undefined}><span className="inline-editor-drag" onPointerDown={startDrag} title="끌어서 이동">⋮⋮</span><span>{message}</span>{editing?<><button type="button" onClick={()=>stopEditing(true)} disabled={saving}>취소</button><button type="button" onClick={()=>void save()} disabled={saving}>{saving?"저장 중…":"저장"}</button></>:<button type="button" onClick={startEditing}>편집 모드</button>}</div>}</div>;
}
