"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {createSupabaseBrowserClient} from "@/lib/supabase/client";
type EventRow={id:string;title:string;description:string|null;event_type:string;start_date:string;end_date:string|null;start_time:string|null;end_time:string|null;location:string|null;is_published:boolean};
const types=[["academic","학사 일정"],["admission","입학"],["exam","시험"],["holiday","휴일"],["event","행사"],["other","기타"]];
const myTypes: Record<string, string> = {
 academic: "ပညာရေးအစီအစဉ်", admission: "ကျောင်းဝင်ခွင့်", exam: "စာမေးပွဲ",
 holiday: "ပိတ်ရက်", event: "အခမ်းအနား", other: "အခြား",
};
const myEventTitles: Record<string, string> = {
 "개강": "အတန်းများ စတင်မည့်နေ့",
 "개강 집회": "စာသင်ကာလ ဖွင့်ပွဲ",
};
// Use explicit labels so the public calendar also works without Burmese locale data.
const myMonths = [
 "ဇန်နဝါရီ", "ဖေဖော်ဝါရီ", "မတ်", "ဧပြီ", "မေ", "ဇွန်",
 "ဇူလိုင်", "ဩဂုတ်", "စက်တင်ဘာ", "အောက်တိုဘာ", "နိုဝင်ဘာ", "ဒီဇင်ဘာ",
];
const myNumber = (value: number) =>
 String(value).replace(/[0-9]/g, digit => "၀၁၂၃၄၅၆၇၈၉"[Number(digit)]);
const myMonthLabel = (year: number, monthIndex: number) =>
 `${myNumber(year)} ခုနှစ်၊ ${myMonths[monthIndex]}လ`;
const blank={title:"",description:"",event_type:"academic",start_date:"",end_date:"",start_time:"",end_time:"",location:"",is_published:true};
export default function ScheduleCalendar({publicOnly=false,canManage=false,locale}:{publicOnly?:boolean;canManage?:boolean;locale?:"my"|"ko"}){
 const translatePublic = publicOnly && locale === "my";
 const db=useMemo(()=>createSupabaseBrowserClient(),[]);
 const mutationsEnabled=process.env.NEXT_PUBLIC_MRPST_ACADEMIC_MUTATIONS_ENABLED!=="false";
 const [rows,setRows]=useState<EventRow[]>([]),[month,setMonth]=useState(new Date(new Date().getFullYear(),new Date().getMonth(),1)),[form,setForm]=useState<any>(blank),[editing,setEditing]=useState(""),[show,setShow]=useState(false),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState("");
 const monthKey=month.getFullYear()+"-"+String(month.getMonth()+1).padStart(2,"0");
 const monthStart=monthKey+"-01";
 const monthEnd=monthKey+"-"+String(new Date(month.getFullYear(),month.getMonth()+1,0).getDate()).padStart(2,"0");
 const load=useCallback(async()=>{
  if(!db)return;
  setLoading(true);
  const {data,error}=await db.from("academic_calendar_events").select("*").lte("start_date",monthEnd)
    .or(`end_date.is.null,end_date.gte.${monthStart}`).order("start_date");
  if(error)setError(error.message);
  else setRows((data||[]) as EventRow[]);
  setLoading(false);
 },[db,monthStart,monthEnd]);
 useEffect(()=>{
  if(!publicOnly){
   if(db)void load();
   else setLoading(false);
   return;
  }

  const controller=new AbortController();
  setLoading(true);
  setError("");
  fetch(`/api/calendar?month=${monthKey}`,{signal:controller.signal,cache:"no-store"})
    .then(async response=>{
     if(!response.ok)throw new Error("Calendar unavailable");
     const events=await response.json() as EventRow[];
     if(!controller.signal.aborted)setRows(events);
    })
    .catch(()=>{
     if(controller.signal.aborted)return;
     setRows([]);
     setError(translatePublic?"အစီအစဉ်များကို ရယူ၍ မရပါ။ ခဏစောင့်ပြီး ထပ်မံကြိုးစားပါ။":"일정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    })
    .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[db,load,monthKey,publicOnly,translatePublic]);
 const first=new Date(month.getFullYear(),month.getMonth(),1),offset=(first.getDay()+6)%7,days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
 const dayKey=(d:number)=>[month.getFullYear(),String(month.getMonth()+1).padStart(2,"0"),String(d).padStart(2,"0")].join("-");
 const selected=(d:number)=>rows.filter(x=>x.start_date<=dayKey(d)&&(x.end_date||x.start_date)>=dayKey(d));
 const edit=(x:EventRow)=>{setEditing(x.id);setForm({...x,start_time:x.start_time?.slice(0,5)||"",end_time:x.end_time?.slice(0,5)||"",end_date:x.end_date||"",description:x.description||"",location:x.location||""});setShow(true);};
 const save=async()=>{if(!mutationsEnabled){setError("학사 일정 변경 기능은 현재 잠겨 있습니다.");return;}if(!db||!form.title.trim()||!form.start_date)return;if(form.end_date&&form.end_date<form.start_date){setError("종료일은 시작일보다 빠를 수 없습니다.");return;}if(form.start_date===form.end_date&&form.start_time&&form.end_time&&form.end_time<=form.start_time){setError("종료 시간은 시작 시간보다 늦어야 합니다.");return;}setSaving(true);setError("");try{const {data:{user},error:userError}=await db.auth.getUser();if(userError)throw userError;if(!user)throw new Error("로그인이 필요합니다.");const payload={...form,title:form.title.trim(),description:form.description.trim()||null,end_date:form.end_date||null,start_time:form.start_time||null,end_time:form.end_time||null,location:form.location.trim()||null,updated_by:user.id};const result=editing?await db.from("academic_calendar_events").update(payload).eq("id",editing).select("id").single():await db.from("academic_calendar_events").insert({...payload,created_by:user.id}).select("id").single();if(result.error)throw result.error;if(!result.data?.id||(editing&&result.data.id!==editing))throw new Error("저장된 학사 일정을 확인할 수 없습니다.");setShow(false);setEditing("");setForm(blank);await load();}catch(e:any){setError(e.message||"학사 일정을 저장하지 못했습니다.");}finally{setSaving(false);}};
 const remove=async(x:EventRow)=>{if(!mutationsEnabled){setError("학사 일정 변경 기능은 현재 잠겨 있습니다.");return;}if(!db||!window.confirm(locale==="my"?"ဤအစီအစဉ်ကို ဖျက်မလား။":"이 일정을 삭제할까요?"))return;const {data:deleted,error}=await db.from("academic_calendar_events").delete().eq("id",x.id).select("id").maybeSingle();if(error)setError(error.message);else if(!deleted?.id||deleted.id!==x.id)setError("삭제된 학사 일정을 확인할 수 없습니다.");else await load();};
 const visibleRows=rows.filter(x=>x.start_date<=monthEnd&&(x.end_date||x.start_date)>=monthStart);
 const isMyanmar=locale ? locale === "my" : typeof document!=="undefined"&&document.querySelector("[lang='my']")!==null;
 const eventTitle=(title:string)=>translatePublic ? myEventTitles[title.trim()] ?? title : title;
 const dateLabel=(date:string)=>{
  if(!translatePublic)return date;
  const [year, month, day]=date.split("-").map(Number);
  return `${myMonthLabel(year,month-1)} ${myNumber(day)} ရက်`;
 };
 const monthLabel=translatePublic ? myMonthLabel(month.getFullYear(),month.getMonth()) : month.toLocaleDateString(isMyanmar?"my-MM":"ko-KR",{year:"numeric",month:"long"});
 return <section className="academics-panel" data-no-inline-edit={translatePublic ? "" : undefined} style={{marginTop:20}}>
 <div className="academics-panel-head"><div><h3>{translatePublic?"လစဉ်အစီအစဉ်":publicOnly?"학사 일정":"학사 일정 캘린더"}</h3><p>{translatePublic?"လအလိုက် ကျောင်း၏ အစီအစဉ်များကို ကြည့်ရှုပါ။":publicOnly?"MRPST의 학사 및 학교 주요 일정을 확인하세요.":"일정을 등록하면 게시 상태에 따라 홈페이지에 공개됩니다."}</p></div>{!publicOnly&&canManage&&<button disabled={!mutationsEnabled} className="academics-primary small" onClick={()=>{setEditing("");setForm({...blank});setShow(true);}}>＋ 일정 등록</button>}</div>
 {error&&<p className="academics-alert error">{error}</p>}
 <div className="schedule-calendar-head"><button aria-label={translatePublic?"ယခင်လ":"이전 달"} onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}>‹</button><strong>{monthLabel}</strong><button aria-label={translatePublic?"နောက်လ":"다음 달"} onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}>›</button></div>
 <div className="schedule-calendar-grid">{(isMyanmar?["တနင်္လာ","အင်္ဂါ","ဗုဒ္ဓဟူး","ကြာသပတေး","သောကြာ","စနေ","တနင်္ဂနွေ"]:["월","화","수","목","금","토","일"]).map(x=><div className="schedule-weekday" key={x}>{x}</div>)}{Array.from({length:offset},(_,i)=><div className="schedule-day empty" key={"e"+i}/>)}{Array.from({length:days},(_,i)=>{const d=i+1,ev=selected(d);return <div className="schedule-day" key={d}><b>{translatePublic?myNumber(d):d}</b>{ev.slice(0,2).map(x=><span key={x.id} className={"schedule-dot "+x.event_type}>{eventTitle(x.title)}</span>)}{ev.length>2&&<small>+{translatePublic?myNumber(ev.length-2):ev.length-2}</small>}</div>;})}</div>
 <div className="schedule-event-list"><h4>{translatePublic?`${monthLabel} အစီအစဉ်များ`:`${monthLabel} 일정`}</h4>{visibleRows.map(x=><article key={x.id}><div><time>{dateLabel(x.start_date)}{x.end_date&&x.end_date!==x.start_date?(translatePublic?" – ":" ~ ")+dateLabel(x.end_date):""}{x.start_time?" · "+x.start_time.slice(0,5):""}</time><strong>{eventTitle(x.title)}</strong><p>{x.description}</p><small>{translatePublic?myTypes[x.event_type]??myTypes.other:types.find(t=>t[0]===x.event_type)?.[1]}{x.location?" · "+x.location:""}{!x.is_published?" · 비공개":""}</small></div>{!publicOnly&&canManage&&<div className="schedule-actions"><button onClick={()=>edit(x)}>수정</button><button onClick={()=>void remove(x)}>삭제</button></div>}</article>)}{!loading&&visibleRows.length===0&&(!publicOnly||!error)&&<p className="academics-empty">{translatePublic?"ဤလအတွက် အစီအစဉ် မရှိသေးပါ။":"등록된 일정이 없습니다."}</p>}</div>
 {show&&!publicOnly&&canManage&&<div className="academics-modal-backdrop"><section className="academics-modal"><header><h3>{editing?"일정 수정":"학사 일정 등록"}</h3><button onClick={()=>setShow(false)}>×</button></header><div className="academics-form-grid"><label>일정명 *<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>분류<select value={form.event_type} onChange={e=>setForm({...form,event_type:e.target.value})}>{types.map(t=><option key={t[0]} value={t[0]}>{t[1]}</option>)}</select></label><label>시작일 *<input type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})}/></label><label>종료일<input type="date" value={form.end_date||""} onChange={e=>setForm({...form,end_date:e.target.value})}/></label><label>시작 시간<input type="time" value={form.start_time||""} onChange={e=>setForm({...form,start_time:e.target.value})}/></label><label>종료 시간<input type="time" value={form.end_time||""} onChange={e=>setForm({...form,end_time:e.target.value})}/></label><label className="full">장소<input value={form.location||""} onChange={e=>setForm({...form,location:e.target.value})}/></label><label className="full">상세 내용<textarea rows={4} value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})}/></label><label className="full"><input type="checkbox" checked={!!form.is_published} onChange={e=>setForm({...form,is_published:e.target.checked})}/> 홈페이지에 공개</label></div><div className="academics-modal-actions"><button onClick={()=>setShow(false)}>취소</button><button className="academics-primary" disabled={saving||!form.title.trim()||!form.start_date} onClick={()=>void save()}>{saving?"저장 중…":"저장"}</button></div></section></div>}
 </section>;
}
