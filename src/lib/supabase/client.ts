import {createBrowserClient} from "@supabase/ssr";
import {supabaseAnonKey,supabaseUrl,isSupabaseConfigured} from "./config";
import {supabaseProxyFetch} from "./proxy-fetch";

export function createSupabaseBrowserClient(){
  if(!isSupabaseConfigured)return null;
  return createBrowserClient(supabaseUrl,supabaseAnonKey,{global:{fetch:supabaseProxyFetch}});
}
