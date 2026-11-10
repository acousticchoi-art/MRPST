"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {createBrowserClient} from "@supabase/ssr";
import {isSupabaseConfigured,supabaseAnonKey,supabaseUrl} from "@/lib/supabase/config";
export default function AdminActions(){const [busy,setBusy]=useState(false);const router=useRouter();async function signOut(){if(!isSupabaseConfigured)return;setBusy(true);const supabase=createBrowserClient(supabaseUrl,supabaseAnonKey);await supabase.auth.signOut();router.replace("/en/login");router.refresh();setBusy(false);}return <button className="top-action" onClick={signOut} disabled={busy}>{busy?"Signing out…":"Sign out"}</button>;}