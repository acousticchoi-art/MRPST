import {NextRequest,NextResponse} from "next/server";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import {supabaseAnonKey,supabaseUrl,isSupabaseConfigured} from "@/lib/supabase/config";

export const dynamic="force-dynamic";
export const revalidate=0;

export async function POST(request:NextRequest){
  if(!isSupabaseConfigured)return NextResponse.json({error:"Supabase 서버 설정을 확인할 수 없습니다."},{status:503});
  const supabase=await createSupabaseServerClient();
  if(!supabase)return NextResponse.json({error:"로그인 연결을 확인할 수 없습니다."},{status:503});
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError||!user)return NextResponse.json({error:"로그인이 필요합니다."},{status:401});
  const {data:{session},error:sessionError}=await supabase.auth.getSession();
  if(sessionError||!session?.access_token)return NextResponse.json({error:"로그인 세션이 만료되었습니다. 다시 로그인해 주세요."},{status:401});
  let body:unknown;
  try{body=await request.json();}catch{return NextResponse.json({error:"요청 형식이 올바르지 않습니다."},{status:400});}
  try{
    const response=await fetch(`${supabaseUrl}/functions/v1/admin-manage-user`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "apikey":supabaseAnonKey,
        "Authorization":`Bearer ${session.access_token}`,
        "x-client-info":"mrpst-admin-server-proxy"
      },
      body:JSON.stringify(body),
      cache:"no-store"
    });
    const text=await response.text();
    let data:any;
    try{data=text?JSON.parse(text):{};}catch{data={error:text||"Supabase 함수에서 읽을 수 없는 응답을 받았습니다."};}
    return NextResponse.json(data,{status:response.status,headers:{"Cache-Control":"no-store, max-age=0"}});
  }catch(error:any){
    return NextResponse.json({error:error?.message||"Supabase 계정 관리 서버에 연결하지 못했습니다."},{status:502});
  }
}
