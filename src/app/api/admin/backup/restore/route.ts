import {NextRequest,NextResponse} from "next/server";
import {createHash} from "node:crypto";
import {getServerModuleAccess} from "@/lib/auth/server-access";
import {isRecord,isRestoreTable,validateRows,type Row} from "@/lib/backup-restore";

export const dynamic="force-dynamic";
export const revalidate=0;
export const runtime="nodejs";
export const maxDuration=60;

const headers={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff","X-Robots-Tag":"noindex, nofollow"};
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers});
const digest=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");

// Insert missing rows only. Each selected table is restored with one atomic
// PostgreSQL INSERT request, never upsert, update, delete, or RLS bypass.
export async function POST(request:NextRequest){
 if(request.headers.get("x-mrpst-restore")!=="1"||request.headers.get("sec-fetch-site")==="cross-site"||!request.headers.get("content-type")?.startsWith("application/json"))return fail("access_denied",403);
 const access=await getServerModuleAccess("administration");
 if(!access.ok)return fail("access_denied",access.status);
 if(!access.roles.includes("super_admin"))return fail("access_denied",403);
 try{
  const text=await request.text();
  if(Buffer.byteLength(text,"utf8")>3_800_000)return fail("too_large",413);
  const input:unknown=JSON.parse(text);
  if(!isRecord(input)||!isRestoreTable(input.table)||(input.action!=="preview"&&input.action!=="restore"))return fail("invalid_file",400);
  const table=input.table;
  const rows=validateRows(input.rows,table);
  if(rows.length>1000)return fail("too_large",413);
  if(rows.some(r=>Object.values(r).some(v=>v!==null&&!["string","number","boolean"].includes(typeof v))))return fail("invalid_file",400);
  const ids=rows.map(r=>String(r.id).toLowerCase());
  const existing=new Set<string>();
  for(let i=0;i<ids.length;i+=100){
   const {data,error}=await access.supabase.from(table).select("id").in("id",ids.slice(i,i+100)).limit(100);
   if(error||!Array.isArray(data))return fail("read_failed",500);
   for(const row of data)existing.add(String(row.id).toLowerCase());
  }
  const missing=rows.filter(r=>!existing.has(String(r.id).toLowerCase()));
  // Recreating a record must not restore an authentication link. Keep these
  // records for an explicit operator-led recovery instead.
  const blocked=table==="students"?missing.filter(r=>r.auth_user_id!==null):[];
  const eligible=table==="students"?missing.filter(r=>r.auth_user_id===null):missing;
  const token=digest({table,rows,eligibleIds:eligible.map(r=>r.id),user:access.user.id});
  const summary={table,total:rows.length,existing:existing.size,missing:missing.length,blocked:blocked.length,eligible:eligible.length,token};
  if(input.action==="preview")return NextResponse.json(summary,{headers});
  if(input.confirmation!=="RESTORE"||input.savedCurrentBackup!==true||input.token!==token||eligible.length===0)return fail("preview_changed",409);
  // Preserve business IDs/fields; policies require the current actor for
  // restored records. Do not restore old editor/creator account references.
  const records:Row[]=eligible.map(r=>{
   const row:Row={...r};
   for(const key of ["created_by","updated_by","entered_by"])if(Object.prototype.hasOwnProperty.call(row,key))row[key]=access.user.id;
   return row;
  });
  const {error}=await access.supabase.from(table).insert(records);
  if(error)return fail("insert_failed",409);
  return NextResponse.json({restored:records.length,table},{headers});
 }catch{return fail("invalid_file",400);}
}
