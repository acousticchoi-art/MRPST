"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";

export default function AdminActions({locale}:{locale:string}){
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const router=useRouter();

  async function signOut(){
    if(busy)return;
    const supabase=createSupabaseBrowserClient();
    if(!supabase){setError(locale==="en"?"Sign-out service unavailable. Refresh the page.":locale==="my"?"အကောင့်ထွက်ဝန်ဆောင်မှုကို အသုံးပြု၍မရပါ။ စာမျက်နှာကို ပြန်ဖွင့်ပါ။":"로그아웃 서비스를 사용할 수 없습니다. 페이지를 새로고침해 주세요.");return;}
    setBusy(true);
    setError("");
    try{
      const {error:signOutError}=await supabase.auth.signOut({scope:"global"});
      if(signOutError)throw signOutError;
      router.replace(`/${locale}/login`);
      router.refresh();
    }catch(err){
      setError(locale!=="en"&&err instanceof Error?err.message:(locale==="en"?"Sign-out failed. Try again.":locale==="my"?"အကောင့်ထွက်ခြင်း မအောင်မြင်ပါ။ ထပ်မံကြိုးစားပါ။":"로그아웃에 실패했습니다. 다시 시도해 주세요."));
      setBusy(false);
    }
  }

  return <div className="admin-signout">
    <button className="top-action" onClick={signOut} disabled={busy}>{busy?(locale==="en"?"Signing out…":locale==="my"?"အကောင့်မှ ထွက်နေပါသည်…":"로그아웃 중…"):(locale==="en"?"Sign out":locale==="my"?"အကောင့်ထွက်ရန်":"로그아웃")}</button>
    {error&&<span role="alert" className="signout-error">{error}</span>}
  </div>;
}
