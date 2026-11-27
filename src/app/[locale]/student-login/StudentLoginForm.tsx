"use client";
import LanguageSwitcher from "../LanguageSwitcher";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authFailure, loginFeedback } from "@/lib/auth/login-feedback";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function StudentLoginForm({ locale }: { locale: string }) {
  const my = locale === "my";
  const t = locale==="en"?{"title":"Student Login","intro":"Sign in using the email and password issued by the school.","email":"Email","password":"Password","submit":"Sign in","loading":"Signing in…","staff":"Staff Login","service":"Authentication service is unavailable.","only":"This is not a student account. Use the staff login.","fail":"Unable to sign in."}:my ? { title: "ကျောင်းသား ဝင်ရောက်ရန်", intro: "ကျောင်းမှ ထုတ်ပေးထားသော အီးမေးလ်နှင့် စကားဝှက်ကို အသုံးပြု၍ ဝင်ရောက်ပါ။", email: "အီးမေးလ်", password: "စကားဝှက်", submit: "ဝင်ရောက်ရန်", loading: "ဝင်ရောက်နေသည်…", staff: "ဝန်ထမ်း ဝင်ရောက်ရန်", service: "ဝင်ရောက်မှုစနစ်ကို စစ်ဆေးပါ။", only: "ကျောင်းသားအကောင့်သာ ဝင်ရောက်နိုင်ပါသည်။ ဝန်ထမ်းဝင်ရောက်မှုကို အသုံးပြုပါ။", fail: "ဝင်ရောက်၍ မရပါ။" } : { title: "학생 로그인", intro: "학교에서 발급받은 이메일과 비밀번호로 로그인하세요.", email: "이메일", password: "비밀번호", submit: "학생 로그인", loading: "로그인 중…", staff: "임직원 로그인", service: "로그인 서비스 설정을 확인해 주세요.", only: "학생 전용 계정이 아닙니다. 임직원 로그인 화면을 이용해 주세요.", fail: "로그인할 수 없습니다." };
  const showLabel = locale==="en"?"Show":my?"ပြရန်":"보기";
  const hideLabel = locale==="en"?"Hide":my?"ဖျောက်ရန်":"숨기기";
  const passwordHelp = locale==="en"?"Forgot your password? Contact the school administrator to reset it.":my?"စကားဝှက် မေ့နေပါသလား။ ပြန်လည်သတ်မှတ်ရန် ကျောင်းအုပ်ချုပ်ရေးတာဝန်ခံကို ဆက်သွယ်ပါ။":"비밀번호를 잊으셨다면 학교 관리자에게 재설정을 요청하세요.";
  const [showPassword,setShowPassword]=useState(false);
  const submitting=useRef(false);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if(submitting.current)return;
    setError("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError(t.service);
      return;
    }
    submitting.current=true;
    setBusy(true);
    let navigating=false;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setError(authFailure(error, locale));
        return;
      }

      const [{ data: roles, error: roleError }, { data: profile, error: profileError }, { data: student, error: studentError }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", data.user.id),
        supabase.from("user_profiles").select("is_active").eq("user_id", data.user.id).maybeSingle(),
        supabase.from("students").select("id").eq("auth_user_id",data.user.id).maybeSingle(),
      ]);
      let reason = "";
      if (roleError || profileError) reason = loginFeedback("access", locale);
      else if (!profile) reason = loginFeedback("noProfile", locale);
      else if (profile.is_active !== true) reason = loginFeedback("inactive", locale);
      else if (!roles?.length) reason = loginFeedback("noRole", locale);
      else if (!roles.some((row) => row.role === "student")) reason = t.only;
      else if (studentError) reason = loginFeedback("studentLookup",locale);
      else if (!student?.id) reason = loginFeedback("noStudent",locale);
      if (reason) {
        setError(reason);
        await supabase.auth.signOut({ scope: "local" });
        return;
      }

      router.replace(`/${locale}/student`);
      router.refresh();
      navigating=true;
    } catch {
      setError(loginFeedback("network", locale));
    } finally {
      if(!navigating){submitting.current=false;setBusy(false);}
    }
  }
  return <main className="login-wrap"><section className="login-card"><div style={{display:"flex",justifyContent:"flex-end"}}><LanguageSwitcher locale={locale==="en"?"en":my?"my":"ko"}/></div><Link href={`/${locale}`} className="brand"><span className="brand-logo"><img src="/mrpst-logo.png" alt="MRPST"/></span><span>MRPST<small>{locale==="en"?"Student Portal":my?"ကျောင်းသား စာမျက်နှာ":"학생 포털"}</small></span></Link><span className="eyebrow">{locale==="en"?"Student Access":my?"ကျောင်းသား ဝင်ရောက်မှု":"학생 전용"}</span><h1>{t.title}</h1><p className="login-intro">{t.intro}</p><form onSubmit={submit} className="login-form"><label>{t.email}<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>{t.password}<span style={{display:"flex",gap:8,alignItems:"center"}}><input style={{flex:1,minWidth:0}} type={showPassword?"text":"password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /><button type="button" className="btn secondary" style={{minHeight:48,flexShrink:0,padding:"0 12px"}} aria-pressed={showPassword} aria-label={showPassword?`${t.password} ${hideLabel}`:`${t.password} ${showLabel}`} onClick={()=>setShowPassword(v=>!v)}>{showPassword?hideLabel:showLabel}</button></span></label>{error && <p className="login-error" role="alert">{error}</p>}<button className="btn primary login-submit" disabled={busy}>{busy ? t.loading : t.submit}</button></form><p className="login-foot">{passwordHelp}</p><p className="login-foot"><Link href={`/${locale}/login`}>{t.staff}</Link></p></section></main>;
}
