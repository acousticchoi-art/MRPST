"use client";

import {useCallback,useEffect,useLayoutEffect,useRef,useState,type PointerEvent as ReactPointerEvent,type ReactNode} from "react";

type InlineValues=Record<string,string>;
const editableSelector="h1,h2,h3,h4,p,span,strong,small,blockquote,li,a,button,label";

function textElements(root:HTMLElement){
  return Array.from(root.querySelectorAll<HTMLElement>(editableSelector)).filter(element=>
    element.textContent?.trim()&&
    !element.closest("[data-inline-editor-controls],[data-no-inline-edit]")&&
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

export default function InlinePageEditor({pageKey,locale,initialValues,children}:{pageKey:string;locale:string;initialValues?:InlineValues;children:ReactNode}){
  const rootRef=useRef<HTMLDivElement>(null);
  const original=useRef<InlineValues>({});
  const savedValues=useRef<InlineValues>(initialValues??{});
  const editingRef=useRef(false);
  const [canManage,setCanManage]=useState(false);
  const [editing,setEditing]=useState(false);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const [position,setPosition]=useState<{x:number;y:number}|null>(null);
  const storageKey=`inline-page-${pageKey}`;
  const hasInitialValues=initialValues!==undefined;

  const applyValues=useCallback((values:InlineValues)=>{
    const root=rootRef.current;if(!root)return;
    textElements(root).forEach(element=>{const value=values[elementKey(root,element)];if(value!==undefined){if(element.textContent!==value)element.textContent=value;element.classList.toggle("inline-text-multiline",value.includes("\n"));}});
  },[]);

  useLayoutEffect(()=>{
    if(initialValues===undefined)return;
    savedValues.current=initialValues;
    if(!editingRef.current)applyValues(initialValues);
  },[applyValues,initialValues]);

  // Dynamic admin modules render after the page shell has mounted. React may
  // replace the text nodes later, so keep published edits attached to the DOM.
  // Observe only while not editing, and discard our own mutation records.
  useEffect(()=>{
    const root=rootRef.current;if(!root)return;
    const observer=new MutationObserver(records=>{
      if(editingRef.current||!Object.keys(savedValues.current).length)return;
      if(!records.some(record=>record.type==="childList"||record.type==="characterData"))return;
      applyValues(savedValues.current);
      observer.takeRecords();
    });
    observer.observe(root,{subtree:true,childList:true,characterData:true});
    return ()=>observer.disconnect();
  },[applyValues]);

  useEffect(()=>{
    if(!document.cookie.includes("sb-"))return;
    void import("@/lib/supabase/client").then(({createSupabaseBrowserClient})=>{
      const db=createSupabaseBrowserClient();if(!db)return;
      return db.auth.getSession().then(({data:{session}})=>{
        if(!session)return;
        void fetch("/api/admin/data/website?scope=editor-permission",{cache:"no-store",credentials:"same-origin"})
          .then(async response=>({response,data:await response.json().catch(()=>null)}))
          .then(({response,data})=>setCanManage(response.ok&&data?.canManage===true))
          .catch(()=>setCanManage(false));
        if(hasInitialValues)return;
        return db.from("website_contents").select("body").eq("content_type","page").eq("content_key",storageKey).eq("locale",locale).eq("is_published",true).maybeSingle()
          .then(({data})=>{try{const values=data?.body?JSON.parse(data.body):{};if(values&&typeof values==="object"&&!Array.isArray(values)){savedValues.current=values;if(!editingRef.current)applyValues(values);}}catch{}});
      });
    });
  },[applyValues,hasInitialValues,locale,storageKey]);

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
      if(restore&&original.current[key]!==undefined){element.textContent=original.current[key];element.classList.toggle("inline-text-multiline",original.current[key].includes("\n"));}
      element.contentEditable="false";
      element.classList.remove("inline-editable-text");
    });
    editingRef.current=false;
    setEditing(false);
  },[]);

  const startEditing=()=>{
    const root=rootRef.current;if(!root)return;
    const values:InlineValues={};
    textElements(root).forEach(element=>{values[elementKey(root,element)]=element.textContent??"";element.contentEditable="true";element.classList.add("inline-editable-text");});
    original.current=values;editingRef.current=true;setMessage("");setEditing(true);
  };

  const insertLineBreak=(event:React.KeyboardEvent<HTMLDivElement>)=>{
    if(event.key!=="Enter"||event.nativeEvent.isComposing)return;
    const target=event.target;
    if(!(target instanceof HTMLElement)||!target.classList.contains("inline-editable-text"))return;
    const selection=window.getSelection();
    if(!selection||selection.rangeCount===0)return;
    const range=selection.getRangeAt(0);
    if(!target.contains(range.commonAncestorContainer))return;
    event.preventDefault();
    range.deleteContents();
    const newline=document.createTextNode("\n");
    range.insertNode(newline);
    range.setStartAfter(newline);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const save=async()=>{
    const root=rootRef.current;if(!root)return;
    const values:InlineValues={};textElements(root).forEach(element=>{const value=element.textContent??"";values[elementKey(root,element)]=value;element.classList.toggle("inline-text-multiline",value.includes("\n"));});
    setSaving(true);setMessage("");
    try{
      const {createSupabaseBrowserClient}=await import("@/lib/supabase/client");const db=createSupabaseBrowserClient();if(!db)throw new Error();
      const {data:{user}}=await db.auth.getUser();
      const row={content_type:"page",content_key:storageKey,locale,title:`Inline text: ${pageKey}`,body:JSON.stringify(values),is_published:true,sort_order:998,updated_by:user?.id??null};
      const {error}=await db.from("website_contents").upsert(row,{onConflict:"content_type,content_key,locale"});
      if(error)throw error;
      savedValues.current=values;original.current=values;stopEditing(false);setMessage(locale==="en"?"Saved.":"저장되었습니다.");
    }catch{setMessage(locale==="en"?"Unable to save. Check your permissions and connection.":"저장하지 못했습니다. 권한과 연결 상태를 확인해 주세요.");}
    finally{setSaving(false);}
  };

  const bootstrap=hasInitialValues?`(()=>{const root=document.currentScript&&document.currentScript.parentElement;if(!root)return;const values=${JSON.stringify(initialValues).replace(/</g,"\\u003c")};const selector=${JSON.stringify(editableSelector)};const elements=Array.from(root.querySelectorAll(selector)).filter(element=>element.textContent&&element.textContent.trim()&&!element.closest('[data-inline-editor-controls],[data-no-inline-edit]')&&!Array.from(element.querySelectorAll(selector)).some(child=>child!==element&&child.textContent&&child.textContent.trim()));const key=element=>{const parts=[];let current=element;while(current&&current!==root){const parent=current.parentElement;if(!parent)break;parts.unshift(String(Array.from(parent.children).indexOf(current)));current=parent;}return parts.join('.');};elements.forEach(element=>{const value=values[key(element)];if(value!==undefined){element.textContent=value;element.classList.toggle("inline-text-multiline",value.includes("\\n"));}});})();`:"";
  return <div ref={rootRef} data-inline-page={pageKey} onKeyDownCapture={insertLineBreak}>{children}{hasInitialValues&&<script dangerouslySetInnerHTML={{__html:bootstrap}}/>}{canManage&&<div className="inline-editor-controls" data-inline-editor-controls style={position?{left:position.x,top:position.y,right:"auto"}:undefined}><span className="inline-editor-drag" onPointerDown={startDrag} title={locale==="en"?"Drag to move":"끌어서 이동"}>⋮⋮</span><span>{message}</span>{editing?<><button type="button" onClick={()=>stopEditing(true)} disabled={saving}>{locale==="en"?"Cancel":"취소"}</button><button type="button" onClick={()=>void save()} disabled={saving}>{saving?(locale==="en"?"Saving…":"저장 중…"):(locale==="en"?"Save":"저장")}</button></>:<button type="button" onClick={startEditing}>{locale==="en"?"Edit mode":"편집 모드"}</button>}</div>}</div>;
}
