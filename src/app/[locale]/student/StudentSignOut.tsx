"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";

export default function StudentSignOut({locale}:{locale:string}){
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const router=useRouter();
  const my=locale==="my";
  const failed=locale==="en"?"Sign-out failed. Try again.":my?"အကောင့်ထွက်ခြင်း မအောင်မြင်ပါ။ ထပ်မံကြိုးစားပါ။":"로그아웃에 실패했습니다. 다시 시도해 주세요.";
  async function signOut(){
    if(busy)return;
    setError("");
    const supabase=createSupabaseBrowserClient();
    if(!supabase){setError(failed);return;}
    setBusy(true);
    try{
      const {error:signOutError}=await supabase.auth.signOut();
      if(signOutError)throw signOutError;
      router.replace(`/${locale}/student-login`);
      router.refresh();
    }catch{
      setError(failed);
      setBusy(false);
    }
  }
  return <div className="admin-signout">
    <button className="top-action" onClick={signOut} disabled={busy}>{busy?(locale==="en"?"Signing out…":my?"ထွက်နေသည်…":"로그아웃 중…"):(locale==="en"?"Sign out":my?"ထွက်ရန်":"로그아웃")}</button>
    {error&&<span role="alert" className="signout-error">{error}</span>}
  </div>;
}
