"use client";
import {useState, type FormEvent} from "react";
import Link from "next/link";
import {createBrowserClient} from "@supabase/ssr";
import {isSupabaseConfigured,supabaseAnonKey,supabaseUrl} from "@/lib/supabase/config";

const PRODUCTION_ORIGIN = "https://mrpst-school.vercel.app";

export default function ForgotPasswordForm({locale}:{locale:string}) {
  const [email,setEmail]=useState(""); const [message,setMessage]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMessage(""); setError("");
    if(!isSupabaseConfigured){setError("Password recovery is temporarily unavailable.");return;}
    setBusy(true);
    try {
      const supabase=createBrowserClient(supabaseUrl,supabaseAnonKey);
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const origin = isLocalhost ? PRODUCTION_ORIGIN : window.location.origin;
      const redirectTo=new URL(`/${locale}/reset-password`,origin).toString();
      const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo});
      if(error) throw error;
      setMessage("If an account exists for this email, a password reset link has been sent. Please check your inbox.");
    }
    catch(err){setError(err instanceof Error?err.message:"Unable to send reset email.");}
    finally{setBusy(false);}
  }
  return <main className="login-wrap"><section className="login-card"><Link href={`/${locale}/login`} className="brand"><span className="mark">M</span><span>MRPST<small>ADMINISTRATION PORTAL</small></span></Link><span className="eyebrow">ACCOUNT RECOVERY</span><h1>Reset your password</h1><p className="login-intro">Enter your administrator email address. We will send a secure reset link if the account exists.</p><form onSubmit={submit} className="login-form"><label>Email address<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="name@mrpst.org"/></label>{error&&<p className="login-error" role="alert">{error}</p>}{message&&<p role="status">{message}</p>}<button className="btn primary login-submit" disabled={busy}>{busy?"Sending…":"Send reset link"}</button></form><p className="login-foot"><Link href={`/${locale}/login`}>Back to sign in</Link></p></section></main>;
}