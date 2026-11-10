import {createBrowserClient} from "@supabase/ssr";
import {supabaseAnonKey,supabaseUrl,isSupabaseConfigured} from "./config";
export function createSupabaseBrowserClient(){if(!isSupabaseConfigured)return null;return createBrowserClient(supabaseUrl,supabaseAnonKey);}
