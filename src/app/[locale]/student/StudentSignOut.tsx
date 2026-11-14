"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";
export default function StudentSignOut({locale}:{locale:string}){const [busy,setBusy]=useState(false);const router=useRouter();async function signOut(){const supabase=createSupabaseBrowserClient();if(!supabase)return;setBusy(true);await supabase.auth.signOut();router.replace(`/${locale}/student-login`);router.refresh();setBusy(false);}return <button className="top-action" onClick={signOut} disabled={busy}>{busy?"로그아웃 중…":"로그아웃"}</button>;}