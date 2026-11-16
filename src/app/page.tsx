"use client";
import {useEffect} from "react";

export default function IndexPage(){
  useEffect(()=>{
    let saved:"my"|"ko"="my";
    try{
      const local=window.localStorage.getItem("mrpst_locale");
      const cookie=document.cookie.split("; ").find(item=>item.startsWith("mrpst_locale="))?.split("=")[1];
      const preferred=local==="ko"||local==="my"?local:cookie;
      if(preferred==="ko"||preferred==="my") saved=preferred;
    }catch{}
    window.location.replace(`/${saved}`);
  },[]);
  return null;
}
