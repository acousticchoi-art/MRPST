"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authFailure, loginFeedback } from "@/lib/auth/login-feedback";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function StudentLoginForm({ locale }: { locale: string }) {
  const my = locale === "my";
  const t = my ? { title: "ကျောင်းသား ဝင်ရောက်ရန်", intro: "ကျောင်းမှ ထုတ်ပေးထားသော အီးမေးလ်နှင့် ကနဦးစကားဝှက်ကို အသုံးပြု၍ ဝင်ရောက်ပါ။", email: "အီးမေးလ်", password: "စကားဝှက်", submit: "ဝင်ရောက်ရန်", loading: "ဝင်ရောက်နေသည်…", staff: "ဝန်ထမ်း ဝင်ရောက်ရန်", service: "ဝင်ရောက်မှုစနစ်ကို စစ်ဆေးပါ။", only: "ကျောင်းသားအကောင့်သာ ဝင်ရောက်နိုင်ပါသည်။ ဝန်ထမ်းဝင်ရောက်မှုကို အသုံးပြုပါ။", fail: "ဝင်ရောက်၍ မရပါ။" } : { title: "학생 로그인", intro: "학교에서 발급받은 이메일과 초기 비밀번호로 로그인하세요.", email: "이메일", password: "비밀번호", submit: "학생 로그인", loading: "로그인 중…", staff: "임직원 로그인", service: "로그인 서비스 설정을 확인해 주세요.", only: "학생 전용 계정이 아닙니다. 임직원 로그인 화면을 이용해 주세요.", fail: "로그인할 수 없습니다." };
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError(t.service);
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
      else if (roles.some((row) => row.role !== "student")) reason = t.only;
      if (!reason) {
        const { data: portal, error: portalError } = await supabase.rpc("mrpst_student_portal_data");
        if (portalError && portalError.message !== "Student portal account required") {
          reason = loginFeedback("studentLookup", locale);
        } else if (!portal?.student) {
          reason = loginFeedback("noStudent", locale);
        }
      }
      if (reason) {
        setError(reason);
        await supabase.auth.signOut({ scope: "local" });
        return;
      }

      router.replace(`/${locale}/student`);
      router.refresh();
    } catch {
      setError(loginFeedback("network", locale));
    } finally {
      setBusy(false);
    }
  }
  return <main className="login-wrap"><section className="login-card"><Link href={`/${locale}`} className="brand"><span className="brand-logo"><img src="/mrpst-logo.png" alt="MRPST"/></span><span>MRPST<small>STUDENT PORTAL</small></span></Link><span className="eyebrow">STUDENT ACCESS</span><h1>{t.title}</h1><p className="login-intro">{t.intro}</p><form onSubmit={submit} className="login-form"><label>{t.email}<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>{t.password}<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>{error && <p className="login-error" role="alert">{error}</p>}<button className="btn primary login-submit" disabled={busy}>{busy ? t.loading : t.submit}</button></form><p className="login-foot"><Link href={`/${locale}/login`}>{t.staff}</Link></p></section></main>;
}
