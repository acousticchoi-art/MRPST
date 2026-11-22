"use client";
export default function PrintActions({label}:{label:string}){
 return <button type="button" className="timetable-print-action" onClick={()=>window.print()}>{label}</button>;
}
