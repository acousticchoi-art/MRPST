import {supabaseUrl} from "./config";

const proxiedPrefixes=["/rest/v1/","/functions/v1/","/auth/v1/"];

export const supabaseProxyFetch:typeof fetch=async(input,init)=>{
  const request=new Request(input,init);
  const target=new URL(request.url);
  const configured=new URL(supabaseUrl);
  const shouldProxy=target.origin===configured.origin&&proxiedPrefixes.some(prefix=>target.pathname.startsWith(prefix));
  if(!shouldProxy)return fetch(request);

  const proxyUrl=`/api/supabase-proxy${target.pathname}${target.search}`;
  const headers=new Headers(request.headers);
  headers.delete("authorization");
  headers.delete("apikey");
  const method=request.method.toUpperCase();
  const body=method==="GET"||method==="HEAD"?undefined:await request.arrayBuffer();

  return fetch(proxyUrl,{
    method,
    headers,
    body,
    credentials:"same-origin",
    cache:"no-store",
    redirect:"manual"
  });
};
