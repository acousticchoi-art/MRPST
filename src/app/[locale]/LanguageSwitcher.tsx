"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";

export default function LanguageSwitcher({locale, mobile=false}:{locale:"my"|"ko";mobile?:boolean}){
  const pathname=usePathname() || `/${locale}`;
  function choose(next:"my"|"ko"){
    try{
      localStorage.setItem("mrpst_locale",next);
      document.cookie=`mrpst_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    }catch{}
  }
  return <div className={mobile?"mobile-langs langs":"langs"} aria-label="Language selection">
    <Link href={pathname.replace(/^\/(my|ko)(?=\/|$)/,"/my")} onClick={()=>choose("my")} className={locale==="my"?"selected":undefined} aria-current={locale==="my"?"true":undefined}>မြန်မာ</Link>
    <Link href={pathname.replace(/^\/(my|ko)(?=\/|$)/,"/ko")} onClick={()=>choose("ko")} className={locale==="ko"?"selected":undefined} aria-current={locale==="ko"?"true":undefined}>한국어</Link>
  </div>;
}
