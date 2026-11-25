"use client";
import LanguageSwitcher from "../LanguageSwitcher";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import { authFailure, loginFeedback } from "@/lib/auth/login-feedback";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";
export default function LoginForm({locale}:{locale:string}){
 const my=locale==="my";
 const t=locale==="en"?{"portal":"Administration Portal","secure":"Secure login","title":"Administrator Login","intro":"Sign in with an authorized MRPST account.","email":"Email","password":"Password","forgot":"Forgot your password?","busy":"Signing in…","submit":"Sign in","restricted":"Only accounts issued by the Super Administrator may access this portal.","student":"Student Login","config":"Authentication service is unavailable.","studentOnly":"This is a student account. Use the student portal.","failed":"Unable to sign in."}:my?{portal:"အုပ်ချုပ်ရေးဝင်ပေါက်",secure:"လုံခြုံသော ဝင်ရောက်မှု",title:"အုပ်ချုပ်ရေး အကောင့်ဝင်ရန်",intro:"ခွင့်ပြုထားသော MRPST အကောင့်ဖြင့် ဝင်ရောက်ပါ။",email:"အီးမေးလ်",password:"စကားဝှက်",forgot:"စကားဝှက် မေ့နေပါသလား",busy:"ဝင်ရောက်နေသည်…",submit:"အကောင့်ဝင်ရန်",restricted:"အုပ်ချုပ်ရေးမှူးက ဖန်တီးပေးထားသော အကောင့်များသာ ဝင်ရောက်နိုင်ပါသည်။",student:"ကျောင်းသား အကောင့်ဝင်ရန်",config:"ဝင်ရောက်မှုစနစ်ကို စီစဉ်သတ်မှတ်ရန် လိုအပ်ပါသည်။",studentOnly:"ဤအကောင့်သည် ကျောင်းသားအကောင့်ဖြစ်သည်။ ကျောင်းသားဝင်ပေါက်ကို အသုံးပြုပါ။",failed:"အကောင့်ဝင်၍ မရပါ။"}:{portal:"관리자 포털",secure:"보안 로그인",title:"관리자 로그인",intro:"승인된 MRPST 계정으로 로그인하세요.",email:"이메일",password:"비밀번호",forgot:"비밀번호를 잊으셨나요?",busy:"로그인 중…",submit:"로그인",restricted:"최고 관리자가 발급한 계정만 접근할 수 있습니다.",student:"학생 로그인",config:"로그인 서비스 설정을 확인해 주세요.",studentOnly:"학생 계정입니다. 학생 로그인 화면을 이용해 주세요.",failed:"로그인할 수 없습니다."};
 const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [error,setError]=useState("");const [busy,setBusy]=useState(false);const router=useRouter();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError(t.config);
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setError(authFailure(error, locale));
        return;
      }

      const [{ data: roles, error: roleError }, { data: profile, error: profileError }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", data.user.id),
        supabase.from("user_profiles").select("is_active").eq("user_id", data.user.id).maybeSingle(),
      ]);
      let reason = "";
      if (roleError || profileError) reason = loginFeedback("access", locale);
      else if (!profile) reason = loginFeedback("noProfile", locale);
      else if (profile.is_active !== true) reason = loginFeedback("inactive", locale);
      else if (!roles?.length) reason = loginFeedback("noRole", locale);
      else if (!roles.some((row) => row.role !== "student")) reason = t.studentOnly;
      if (reason) {
        setError(reason);
        await supabase.auth.signOut({ scope: "local" });
        return;
      }

      router.replace(`/${locale}/admin`);
      router.refresh();
    } catch {
      setError(loginFeedback("network", locale));
    } finally {
      setBusy(false);
    }
  }
 return <main className="login-wrap"><section className="login-card">{locale==="en"&&<div style={{display:"flex",justifyContent:"flex-end"}}><LanguageSwitcher locale="en"/></div>}<Link href={`/${locale}`} className="brand"><span className="brand-logo"><img src="/mrpst-logo.png" alt="MRPST"/></span><span>MRPST<small>{t.portal}</small></span></Link><span className="eyebrow">{t.secure}</span><h1>{t.title}</h1><p className="login-intro">{t.intro}</p><form onSubmit={submit} className="login-form"><label>{t.email}<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="name@mrpst.org"/></label><label>{t.password}<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder={t.password}/></label><p className="login-foot"><Link href={`/${locale}/forgot-password`}>{t.forgot}</Link></p>{error&&<p className="login-error" role="alert">{error}</p>}<button className="btn primary login-submit" disabled={busy}>{busy?t.busy:t.submit}</button></form><p className="login-foot">{t.restricted}</p><p className="login-foot"><Link href={`/${locale}/student-login`}>{t.student}</Link></p></section></main>;
}
