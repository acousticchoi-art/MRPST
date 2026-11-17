import {NextRequest,NextResponse} from "next/server";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import {supabaseAnonKey,supabaseUrl,isSupabaseConfigured} from "@/lib/supabase/config";

export const dynamic="force-dynamic";
export const revalidate=0;

const allowedMethods=["GET","HEAD","POST","PATCH","PUT","DELETE"];
const requestHeaders=[
  "accept","content-type","prefer","accept-profile","content-profile",
  "range","range-unit","if-match","if-none-match","cache-control",
  "x-client-info","x-upsert","content-range","x-supabase-api-version",
  "x-supabase-client-platform","x-supabase-client-platform-version",
  "x-supabase-client-runtime","x-supabase-client-runtime-version"
];
const responseHeaders=[
  "content-type","content-range","accept-ranges","etag","last-modified",
  "preference-applied","content-profile","cache-control","location","retry-after"
];

async function proxy(request:NextRequest,{params}:{params:Promise<{path:string[]}>}){
  if(!isSupabaseConfigured)return NextResponse.json({error:"Supabase 서버 설정을 확인할 수 없습니다."},{status:503});
  const {path}=await params;
  const pathname="/"+(path??[]).join("/");
  const allowed=pathname.startsWith("/rest/v1/")||pathname.startsWith("/functions/v1/");
  if(!allowed)return NextResponse.json({error:"허용되지 않은 Supabase 경로입니다."},{status:404});
  if(!allowedMethods.includes(request.method))return NextResponse.json({error:"허용되지 않은 요청 방식입니다."},{status:405});

  const supabase=await createSupabaseServerClient();
  if(!supabase)return NextResponse.json({error:"로그인 연결을 확인할 수 없습니다."},{status:503});
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError||!user)return NextResponse.json({error:"로그인이 필요합니다."},{status:401});
  const {data:{session},error:sessionError}=await supabase.auth.getSession();
  if(sessionError||!session?.access_token)return NextResponse.json({error:"로그인 세션이 만료되었습니다. 다시 로그인해 주세요."},{status:401});

  const headers=new Headers();
  for(const name of requestHeaders){const value=request.headers.get(name);if(value)headers.set(name,value);}
  headers.set("apikey",supabaseAnonKey);
  headers.set("Authorization",`Bearer ${session.access_token}`);

  try{
    const upstream=await fetch(`${supabaseUrl}${pathname}${request.nextUrl.search}`,{
      method:request.method,
      headers,
      body:request.method==="GET"||request.method==="HEAD"?undefined:await request.arrayBuffer(),
      cache:"no-store",
      redirect:"manual"
    });
    const outgoing=new Headers();
    for(const name of responseHeaders){const value=upstream.headers.get(name);if(value)outgoing.set(name,value);}
    outgoing.set("Cache-Control","no-store, max-age=0");
    return new NextResponse(upstream.body,{status:upstream.status,headers:outgoing});
  }catch(error:any){
    return NextResponse.json({error:error?.message||"Supabase 서버에 연결하지 못했습니다."},{status:502});
  }
}

export const GET=proxy;
export const HEAD=proxy;
export const POST=proxy;
export const PATCH=proxy;
export const PUT=proxy;
export const DELETE=proxy;
