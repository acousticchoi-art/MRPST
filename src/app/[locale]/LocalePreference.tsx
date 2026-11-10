"use client";
import {useEffect} from "react";
export default function LocalePreference({locale}:{locale:string}){
 useEffect(()=>{
  try{
   window.localStorage.setItem("mrpst_locale",locale);
   document.cookie=`mrpst_locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }catch{}
 },[locale]);
 return null;
}