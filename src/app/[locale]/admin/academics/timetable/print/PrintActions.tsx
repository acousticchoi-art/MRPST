"use client";

import {useEffect,useState} from "react";

function fitTimetableToOnePage(){
 const sheet=document.querySelector<HTMLElement>(".lecture-print-sheet");
 if(!sheet)return;
 const myanmar=sheet.dataset.printLang==="my";
 const copy=sheet.cloneNode(true) as HTMLElement;
 copy.classList.add("lecture-print-measure");
 copy.style.removeProperty("--timetable-print-scale");
 document.body.appendChild(copy);
 // Measure after the selected script font has loaded. A4 landscape is 297 x
 // 210mm; leave room for browser rounding and printer pagination.
 const availableHeightMm=myanmar?174:188;
 const availableHeight=(availableHeightMm/25.4)*96;
 const height=Math.max(copy.scrollHeight,copy.getBoundingClientRect().height);
 copy.remove();
 const scale=height>0?Math.min(1,availableHeight/height):1;
 sheet.style.setProperty("--timetable-print-scale",String(Math.max(.08,scale*.97).toFixed(4)));
}

export default function PrintActions({label}:{label:string}){
 const [printing,setPrinting]=useState(false);
 useEffect(()=>{
  const prepare=()=>fitTimetableToOnePage();
  window.addEventListener("beforeprint",prepare);
  // Fonts can finish loading after hydration, especially Myanmar webfonts.
  // Recalculate before the next native print shortcut as well.
  document.fonts?.ready.then(prepare).catch(()=>{});
  return()=>window.removeEventListener("beforeprint",prepare);
 },[]);
 const print=async()=>{
  if(printing)return;
  setPrinting(true);
  try{
   // Wait for Myanmar glyph metrics so line wraps in print match measurement.
   await document.fonts?.ready;
   fitTimetableToOnePage();
   window.print();
  }finally{setPrinting(false);}
 };
 return <button type="button" className="timetable-print-action" disabled={printing} onClick={()=>void print()}>{label}</button>;
}
