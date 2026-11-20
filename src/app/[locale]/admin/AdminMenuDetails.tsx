"use client";

import {useEffect,useRef,type ReactNode} from "react";

export default function AdminMenuDetails({children}:{children:ReactNode}){
  const detailsRef=useRef<HTMLDetailsElement>(null);

  useEffect(()=>{
    const query=window.matchMedia("(max-width:650px)");
    const sync=()=>{if(detailsRef.current)detailsRef.current.open=!query.matches;};
    sync();
    query.addEventListener("change",sync);
    return()=>query.removeEventListener("change",sync);
  },[]);

  return <details ref={detailsRef} className="admin-menu-details">{children}</details>;
}
