"use client";
import {useEffect,useState} from "react";
import {englishDisplay} from "@/lib/english-display";
type EventRow={id:string;title:string;description:string|null;event_type:string;start_date:string;end_date:string|null;start_time:string|null;location:string|null};
const types:Record<string,string>={academic:"Academic",admission:"Admissions",exam:"Exam",holiday:"Holiday",event:"Event",other:"Other"};
export default function EnglishCalendar(){
 const [month,setMonth]=useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1));
 const [rows,setRows]=useState<EventRow[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(false);
 const monthKey=month.getFullYear()+"-"+String(month.getMonth()+1).padStart(2,"0");
 useEffect(()=>{const c=new AbortController();setRows([]);setLoading(true);setError(false);fetch("/api/calendar?month="+monthKey,{signal:c.signal,cache:"no-store"}).then(async r=>{if(!r.ok)throw Error();const data=await r.json();if(!c.signal.aborted)setRows(data);}).catch(()=>{if(!c.signal.aborted)setError(true);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[monthKey]);
 const first=new Date(month.getFullYear(),month.getMonth(),1),offset=(first.getDay()+6)%7,days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
 const label=month.toLocaleDateString("en-GB",{year:"numeric",month:"long"});
 const title=(x:EventRow)=>englishDisplay(x.title);
 return <section className="academics-panel" data-no-inline-edit style={{marginTop:20}}><div className="academics-panel-head"><div><h3>Monthly schedule</h3><p>View school events by month.</p></div></div>
 <div className="schedule-calendar-head"><button type="button" aria-label="Previous month" onClick={()=>setMonth(m=>new Date(m.getFullYear(),m.getMonth()-1,1))}>‹</button><strong>{label}</strong><button type="button" aria-label="Next month" onClick={()=>setMonth(m=>new Date(m.getFullYear(),m.getMonth()+1,1))}>›</button></div>
 <div className="schedule-calendar-grid">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><div className="schedule-weekday" key={d}>{d}</div>)}{Array.from({length:offset},(_,i)=><div className="schedule-day empty" key={"e"+i}/>)}{Array.from({length:days},(_,i)=>{const key=monthKey+"-"+String(i+1).padStart(2,"0"),events=rows.filter(x=>x.start_date<=key&&(x.end_date||x.start_date)>=key);return <div className="schedule-day" key={i}><b>{i+1}</b>{events.slice(0,2).map(x=><span key={x.id} className={"schedule-dot "+x.event_type}>{title(x)}</span>)}{events.length>2&&<small>+{events.length-2}</small>}</div>;})}</div>
 <div className="schedule-event-list"><h4>{label} events</h4>{loading&&<p role="status">Loading events…</p>}{error&&<p role="alert">Could not load events. Please try again.</p>}{!loading&&!error&&!rows.length&&<p className="academics-empty">No scheduled events this month.</p>}{rows.map(x=><article key={x.id}><div><time>{x.start_date}{x.end_date&&x.end_date!==x.start_date?" – "+x.end_date:""}{x.start_time?" · "+x.start_time.slice(0,5):""}</time><strong>{title(x)}</strong><p>{x.description}</p><small>{types[x.event_type]??types.other}{x.location?" · "+x.location:""}</small></div></article>)}</div></section>;
}
