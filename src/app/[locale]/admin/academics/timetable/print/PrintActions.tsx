"use client";

import {useEffect} from "react";

function fitTimetableToOnePage(){
 const sheet=document.querySelector<HTMLElement>(".lecture-print-sheet");
 if(!sheet)return;
 const copy=sheet.cloneNode(true) as HTMLElement;
 copy.classList.add("lecture-print-measure");
 copy.style.removeProperty("--timetable-print-scale");
 document.body.appendChild(copy);
 // The measurement element uses the same 285mm A4 landscape content width
 // and print typography, without affecting the visible preview.
 const availableHeight=(194/25.4)*96;
 const height=Math.max(copy.scrollHeight,copy.getBoundingClientRect().height);
 copy.remove();
 const scale=height>0?Math.min(1,availableHeight/height):1;
 sheet.style.setProperty("--timetable-print-scale",String(Math.max(.1,scale*.985).toFixed(4)));
}

export default function PrintActions({label}:{label:string}){
 useEffect(()=>{const prepare=()=>fitTimetableToOnePage();window.addEventListener("beforeprint",prepare);return()=>window.removeEventListener("beforeprint",prepare);},[]);
 return <button type="button" className="timetable-print-action" onClick={()=>{fitTimetableToOnePage();window.print();}}>{label}</button>;
}
