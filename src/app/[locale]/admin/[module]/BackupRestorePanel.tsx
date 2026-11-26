"use client";
import {useState} from "react";
import {validateBackup,restoreColumns,isRestoreTable,type RestoreTable,type Row} from "@/lib/backup-restore";

const labels={
 departments:["학과","Departments","ဌာနများ"],
 students:["학생","Students","ကျောင်းသားများ"],
 academic_grades:["성적","Grades","အမှတ်စာရင်း"],
 academic_calendar_events:["학사 일정","Academic calendar","ပညာသင် ပြက္ခဒိန်"],
 facility_buildings:["건물","Buildings","အဆောက်အအုံ"],
 facility_inventory:["비품","Inventory","ပစ္စည်းစာရင်း"],
 library_books:["도서","Library books","စာအုပ်များ"],
 website_contents:["홈페이지 콘텐츠","Website content","ဝဘ်ဆိုက် အကြောင်းအရာ"]
} as const;
type Preview={table:RestoreTable;total:number;existing:number;missing:number;blocked:number;eligible:number;token:string};
export default function BackupRestorePanel({locale}:{locale:string}){
 const lang=locale==="en"?1:locale==="my"?2:0;
 const tr=(ko:string,en:string,my:string)=>[ko,en,my][lang];
 const [backup,setBackup]=useState<ReturnType<typeof validateBackup>|null>(null);
 const [table,setTable]=useState<RestoreTable>("students");
 const [preview,setPreview]=useState<Preview|null>(null);
 const [saved,setSaved]=useState(false),[confirm,setConfirm]=useState("");
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[failed,setFailed]=useState(false);
 const [fileKey,setFileKey]=useState(0);
 const reset=()=>{setPreview(null);setSaved(false);setConfirm("");setMessage("");setFailed(false);};
 function errorMessage(code:string){
  if(code==="preview_changed")return tr("현재 상태가 변경되었습니다. 다시 확인하세요.","Records changed. Run a new preview.","ဒေတာ ပြောင်းလဲသွားပါသည်။ ပြန်စစ်ဆေးပါ။");
  if(code==="insert_failed")return tr("복구가 거부되었습니다. 중복 또는 연결된 기록, 권한 및 제약조건을 확인해야 합니다. 다시 미리보기하세요.","Insert was rejected. Check duplicates, related records, permissions and constraints; run preview again.","ပြန်လည်ရယူမှု မအောင်မြင်ပါ။ ဆက်နွယ်ဒေတာနှင့် ခွင့်ပြုချက်ကို စစ်ဆေးပြီး ထပ်စမ်းပါ။");
  return tr("처리할 수 없습니다. 올바른 버전 2 백업 파일, 연결 상태 및 권한을 확인한 후 다시 시도하세요.","Unable to process. Check the version 2 backup file, connection and permissions, then retry.","ဗားရှင်း ၂ အရန်ဖိုင်၊ အင်တာနက်နှင့် ခွင့်ပြုချက်ကို စစ်ပြီး ထပ်ကြိုးစားပါ။");
 }
 async function selectFile(file:File|undefined){
  reset();setBackup(null);if(!file)return;
  setBusy(true);
  try{if(file.size>3_800_000)throw Error("too_large");setBackup(validateBackup(JSON.parse(await file.text())));}
  catch{setFailed(true);setMessage(errorMessage("invalid_file"));setFileKey(n=>n+1);}
  finally{setBusy(false);}
 }
 async function request(action:"preview"|"restore"){
  if(!backup||busy||(action==="restore"&&(!preview||!saved||confirm!=="RESTORE"||preview.eligible===0)))return;
  setBusy(true);setMessage("");setFailed(false);
  try{
   const rows:Row[]=backup.tables[table];
   const response=await fetch("/api/admin/backup/restore",{method:"POST",cache:"no-store",credentials:"same-origin",headers:{"Content-Type":"application/json","x-mrpst-restore":"1"},body:JSON.stringify({action,table,rows,...(action==="restore"?{token:preview?.token,confirmation:confirm,savedCurrentBackup:saved}:{})})});
   const result=await response.json();
   if(!response.ok)throw Error(typeof result?.error==="string"?result.error:"read_failed");
   if(action==="preview"){
    if(result?.table!==table||result?.total!==rows.length||![result.existing,result.missing,result.blocked,result.eligible].every(n=>Number.isInteger(n)&&n>=0)||result.existing+result.missing!==rows.length||result.blocked+result.eligible!==result.missing||typeof result.token!=="string"||! /^[0-9a-f]{64}$/.test(result.token))throw Error("read_failed");
    setPreview(result as Preview);setSaved(false);setConfirm("");
   }else{
    if(result?.table!==table||result?.restored!==preview?.eligible)throw Error("read_failed");
    setPreview(null);setSaved(false);setConfirm("");
    setMessage(tr(`${result.restored}건 복구 요청이 성공했습니다. 다시 미리보기하여 확인하세요.`,`Restore request succeeded for ${result.restored} records. Run preview again to verify.`,`မှတ်တမ်း ${result.restored} ခု ပြန်လည်ရယူပြီးပါပြီ။ ပြန်စစ်ဆေးပါ။`));
   }
  }catch(e){setPreview(null);setSaved(false);setConfirm("");setFailed(true);setMessage(errorMessage(e instanceof Error?e.message:"read_failed"));}
  finally{setBusy(false);}
 }
 return <div className="settings-backup" data-no-inline-edit data-no-translate style={{marginTop:20}}>
  <h3>{tr("삭제 기록 복구","Restore missing records","ပျောက်ဆုံးမှတ်တမ်း ပြန်လည်ရယူရန်")}</h3>
  <p>{tr("버전 2 백업 파일을 선택한 뒤 한 번에 한 업무 항목의 삭제된 기록만 복구합니다. 기존 ID의 기록은 수정·삭제하지 않습니다. 8개 항목만 지원하며 계정 연결 학생, 회계 전표, 장학금 등은 별도 복구가 필요합니다. 복구자 계정으로 작성자·수정자 정보가 기록될 수 있습니다.","Choose a version 2 backup and restore missing records for one supported table at a time. Existing IDs are never updated or deleted. Eight tables are supported; account-linked students, accounting and scholarships require separate recovery. Creator/editor fields may be assigned to the restoring administrator.","ဗားရှင်း ၂ အရန်ဖိုင်ကို ရွေးပြီး ပျောက်ဆုံးမှတ်တမ်းများသာ ပြန်ယူပါ။ ရှိပြီးသား ID များကို မပြင်ဆင်၊ မဖျက်ပါ။ အမျိုးအစား ၈ ခုသာ ရရှိပြီး အကောင့်ချိတ်ဆက်ထားသော ကျောင်းသား၊ စာရင်းကိုင်နှင့် ပညာသင်ဆုများကို သီးခြားပြန်ယူရပါမည်။ တစ်ကြိမ်လျှင် အမျိုးအစားတစ်ခုသာ ပြန်ယူနိုင်ပါသည်။ မှတ်တမ်းဖန်တီးသူနှင့် ပြင်ဆင်သူအဖြစ် ပြန်လည်ရယူသည့် အုပ်ချုပ်သူ၏ အကောင့်ကို သတ်မှတ်နိုင်ပါသည်။")}</p>
  <label>{tr("백업 JSON 파일","Backup JSON file","အရန် JSON ဖိုင်")} <input key={fileKey} type="file" accept=".json,application/json" disabled={busy} onChange={e=>void selectFile(e.target.files?.[0])}/></label>
  {backup&&<div>
   <p>{tr("파일 확인 완료 · 생성일: ","File format checked · Created: ","ဖိုင်ပုံစံ စစ်ဆေးပြီး · ရက်စွဲ: ")}{new Date(backup.generatedAt).toLocaleString(locale==="my"?"my-MM":locale==="en"?"en-GB":"ko-KR")}</p>
   <label>{tr("복구 항목","Restore table","ပြန်ယူမည့်အမျိုးအစား")} <select value={table} disabled={busy} onChange={e=>{if(isRestoreTable(e.target.value)){setTable(e.target.value);reset();}}}>{Object.keys(restoreColumns).filter(isRestoreTable).map(k=><option value={k} key={k}>{labels[k][lang]} ({backup.tables[k].length})</option>)}</select></label>
   <button type="button" className="settings-primary" disabled={busy} onClick={()=>void request("preview")}>{tr("복구 미리보기","Preview recovery","ကြိုတင်စစ်ဆေးရန်")}</button>
   {preview&&<div className="settings-backup" style={{marginTop:12}}>
    <p>{tr("백업 기록","Backup records","အရန်မှတ်တမ်း")}: {preview.total} · {tr("기존 기록","Existing","ရှိပြီးသား")}: {preview.existing} · {tr("복구 가능","Eligible","ပြန်ယူနိုင်သည်")}: {preview.eligible} · {tr("별도 복구 필요","Separate recovery","သီးခြားပြန်ယူရန်")}: {preview.blocked}</p>
    {preview.eligible>0&&<>
     <p>{tr("위의 백업 내려받기 버튼으로 현재 데이터를 먼저 저장하세요. 복구 요청은 한 번에 선택한 항목만 반영합니다. 다른 사용자가 수정하지 않는 시간에 실행하세요.","Download and save a fresh backup using the button above before restoring. Only the selected table is inserted in this request. Run when no one else is editing.","အထက်ရှိ ခလုတ်ဖြင့် လက်ရှိဒေတာကို ဦးစွာ သိမ်းပါ။ ရွေးထားသောအမျိုးအစားသာ ပြန်ယူပါ။ အခြားသူများ မပြင်ဆင်ချိန်တွင် လုပ်ပါ။")}</p>
     <label><input type="checkbox" checked={saved} disabled={busy} onChange={e=>setSaved(e.target.checked)}/>{tr("현재 백업 파일을 안전한 곳에 저장했습니다.","I saved a fresh backup in a private location.","လက်ရှိအရန်ဖိုင်ကို လုံခြုံစွာ သိမ်းပြီးပါပြီ။")}</label>
     <label>{tr("확인을 위해 RESTORE 입력","Type RESTORE to confirm","အတည်ပြုရန် RESTORE ရိုက်ပါ")} <input value={confirm} disabled={busy} onChange={e=>setConfirm(e.target.value)} autoComplete="off"/></label>
     <button type="button" className="settings-primary" disabled={busy||!saved||confirm!=="RESTORE"} onClick={()=>void request("restore")}>{tr("누락 기록 복구 실행","Restore missing records","ပျောက်ဆုံးမှတ်တမ်း ပြန်ယူရန်")}</button>
    </>}
   </div>}
  </div>}
  {busy&&<p role="status">{tr("처리 중…","Processing…","လုပ်ဆောင်နေသည်…")}</p>}
  {message&&<div className={failed?"settings-alert error":"settings-alert success"} role={failed?"alert":"status"} aria-live="polite">{message}</div>}
 </div>;
}
