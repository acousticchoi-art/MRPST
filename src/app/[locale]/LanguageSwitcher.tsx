"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useRef,useState} from "react";
type Locale="my"|"en"|"ko";
const languages=[["my","မြန်မာ"],["en","English"],["ko","한국어"]] as const;
export default function LanguageSwitcher({locale,mobile=false}:{locale:Locale;mobile?:boolean}){
 const pathname=usePathname()||"/"+locale;
 const [open,setOpen]=useState(false);
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{setOpen(false);},[pathname]);
 useEffect(()=>{if(!open)return;const close=(e:PointerEvent)=>{if(!ref.current?.contains(e.target as Node))setOpen(false);};const escape=(e:KeyboardEvent)=>{if(e.key==="Escape"){setOpen(false);ref.current?.querySelector("button")?.focus();}};document.addEventListener("pointerdown",close);document.addEventListener("keydown",escape);return()=>{document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",escape);};},[open]);
 function choose(next:Locale){setOpen(false);try{localStorage.setItem("mrpst_locale",next);document.cookie="mrpst_locale="+next+"; Path=/; Max-Age=31536000; SameSite=Lax";}catch{}}
 return <div ref={ref} className={"language-dropdown"+(mobile?" language-dropdown-mobile":"")} data-no-inline-edit>
 <button type="button" aria-label="Language selection" aria-expanded={open} onClick={()=>setOpen(!open)} className="language-trigger"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg><span>{locale.toUpperCase()}</span><svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m2 4 4 4 4-4"/></svg></button>
 {open&&<div className="language-options">{languages.map(([code,name])=><Link key={code} href={pathname.replace(/^\/(my|en|ko)(?=\/|$)/,"/"+code)} onClick={()=>choose(code)} lang={code} aria-current={locale===code?"true":undefined}><span>{name}</span>{locale===code&&<span aria-hidden="true">✓</span>}</Link>)}</div>}
 <style jsx>{`
 .language-dropdown{position:relative;flex:none;color:#173c55;z-index:1005}
 .language-trigger{display:flex;align-items:center;justify-content:center;gap:5px;min-width:68px;min-height:36px;padding:5px 7px;background:white;border:1px solid #d5e0e6;border-radius:7px;color:inherit;font:600 12px Arial,sans-serif;cursor:pointer}
 .language-options{position:absolute;right:0;top:calc(100% + 6px);width:150px;background:white;border:1px solid #d9e3e9;border-radius:8px;box-shadow:0 8px 24px #173c5522;padding:4px;z-index:1010}
 .language-options a{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:10px;border-radius:5px;font-size:13px;color:#173c55}
 .language-options a[aria-current=true]{background:#edf2f5;font-weight:700}
 .language-options a:hover{background:#f3f6f7}
 .language-dropdown-mobile .language-options{position:static;width:100%;margin-top:5px;box-shadow:none}
 `}</style></div>;
}
