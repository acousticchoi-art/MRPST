"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useRef,useState,useId} from "react";
import {createPortal} from "react-dom";
type Locale="my"|"en"|"ko";
const languages=[["my","မြန်မာ"],["en","English"],["ko","한국어"]] as const;
export default function LanguageSwitcher({locale,mobile=false}:{locale:Locale;mobile?:boolean}){
 const pathname=usePathname()||"/"+locale;
 const [open,setOpen]=useState(false);
 const ref=useRef<HTMLDivElement>(null);
 const menuRef=useRef<HTMLDivElement>(null);
 const menuId=useId();
 const [position,setPosition]=useState({left:0,top:0});
 function locate(){const rect=ref.current?.getBoundingClientRect();if(!rect)return;setPosition({left:Math.max(8,Math.min(rect.right-160,window.innerWidth-168)),top:rect.bottom+6});}
 function toggle(){if(!open)locate();setOpen(v=>!v);}
 useEffect(()=>{setOpen(false);},[pathname]);
 useEffect(()=>{if(!open)return;const close=(e:PointerEvent)=>{if(!ref.current?.contains(e.target as Node)&&!menuRef.current?.contains(e.target as Node))setOpen(false);};const escape=(e:KeyboardEvent)=>{if(e.key==="Escape"){setOpen(false);ref.current?.querySelector("button")?.focus();}};document.addEventListener("pointerdown",close);document.addEventListener("keydown",escape);window.addEventListener("resize",locate);window.addEventListener("scroll",locate,true);return()=>{document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",escape);window.removeEventListener("resize",locate);window.removeEventListener("scroll",locate,true);};},[open]);
 function choose(next:Locale){setOpen(false);try{localStorage.setItem("mrpst_locale",next);document.cookie="mrpst_locale="+next+"; Path=/; Max-Age=31536000; SameSite=Lax";}catch{}}
 return <div ref={ref} className={"language-dropdown"+(mobile?" language-dropdown-mobile":"")} data-no-inline-edit>
 <button type="button" aria-label={locale==="en"?"Language selection":locale==="my"?"ဘာသာစကား ရွေးချယ်ရန်":"언어 선택"} aria-expanded={open} aria-controls={open?menuId:undefined} onClick={toggle} className="language-trigger"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg><span>{locale.toUpperCase()}</span><svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m2 4 4 4 4-4"/></svg></button>
 {open&&createPortal(<div ref={menuRef} id={menuId} lang={locale} className="mrpst-language-options" data-no-inline-edit data-no-translate style={{left:position.left,top:position.top}}>{languages.map(([code,name])=><Link key={code} href={pathname.replace(/^\/(my|en|ko)(?=\/|$)/,"/"+code)} onClick={()=>choose(code)} lang={code} aria-current={locale===code?"true":undefined}><span>{name}</span>{locale===code&&<span aria-hidden="true">✓</span>}</Link>)}</div>,document.body)}
 <style jsx>{`
 .language-dropdown{position:relative;flex:none;color:#173c55;z-index:1005}
 .language-trigger{display:flex;align-items:center;justify-content:center;gap:5px;min-width:68px;min-height:36px;padding:5px 7px;background:white;border:1px solid #d5e0e6;border-radius:7px;color:inherit;font:600 12px Arial,sans-serif;cursor:pointer}
 .language-dropdown-mobile{display:none}
 @media(max-width:1100px){.language-dropdown-mobile{display:block;flex:0 0 auto}.language-dropdown-mobile .language-trigger{min-width:64px}}
 `}</style></div>;
}
