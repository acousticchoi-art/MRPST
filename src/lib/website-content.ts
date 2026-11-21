import {createSupabaseServerClient} from "@/lib/supabase/server";

export type WebsitePageContent = {title:string;body:string};

/**
 * Loads administrator-published copy for a public page.  The components keep
 * their bundled copy as a fallback so an unfinished translation never leaves
 * a public page blank.
 */
export async function getPublishedWebsiteContent(locale:string){
  const supabase=await createSupabaseServerClient();
  if(!supabase)return new Map<string,WebsitePageContent>();
  const {data}=await supabase.from("website_contents")
    .select("content_key,title,body")
    .eq("content_type","page")
    .eq("locale",locale)
    .eq("is_published",true);
  return new Map((data??[]).map(row=>[row.content_key,{title:row.title??"",body:row.body??""}]));
}

export function websiteCopy(content:Map<string,WebsitePageContent>,key:string,fallback:WebsitePageContent){
  const saved=content.get(key);
  return {
    title:saved?.title.trim()||fallback.title,
    body:saved?.body.trim()||fallback.body
  };
}
