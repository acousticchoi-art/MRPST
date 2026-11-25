"use client";

import {useEffect,useState} from "react";

type Announcement={content_key:string;title:string;body:string;created_at:string};

function formatDate(value:string,locale:string){
  const date=new Date(value);
  return Number.isNaN(date.getTime())?"—":new Intl.DateTimeFormat(locale==="en"?"en-GB":locale==="ko"?"ko-KR":"my-MM",{year:"numeric",month:"long",day:"numeric"}).format(date);
}

export default function PublicAnnouncements({locale,announcements}:{locale:string;announcements:Announcement[]}){
  const [selected,setSelected]=useState<Announcement|null>(null);
  const ko=locale==="ko"; const en=locale==="en";
  useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setSelected(null);};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close);},[]);
  return <section className="public-announcements"><div className="public-announcements-heading"><span className="eyebrow">{en?"MRPST NEWS":ko?"MRPST 소식":"MRPST NEWS"}</span><h2>{en?"Announcements":ko?"공지사항":"ကြေညာချက်များ"}</h2></div><div className="public-announcements-list">{announcements.length>0?announcements.map(item=><button className="public-announcement" type="button" key={item.content_key} onClick={()=>setSelected(item)}><strong>{item.title}</strong><time dateTime={item.created_at}>{formatDate(item.created_at,locale)}</time></button>):<p className="public-announcements-empty">{en?"No announcements yet.":ko?"등록된 공지사항이 없습니다.":"ကြေညာချက် မရှိသေးပါ။"}</p>}</div>{selected&&<div className="announcement-modal-backdrop" role="presentation" onMouseDown={()=>setSelected(null)}><section className="announcement-modal" role="dialog" aria-modal="true" aria-labelledby="announcement-title" onMouseDown={event=>event.stopPropagation()}><button className="announcement-modal-close" type="button" onClick={()=>setSelected(null)} aria-label={en?"Close announcement":ko?"공지 닫기":"ပိတ်ရန်"}>×</button><span className="eyebrow">{en?"NOTICE":ko?"NOTICE":"ကြေညာချက်"}</span><h3 id="announcement-title">{selected.title}</h3><time dateTime={selected.created_at}>{en?"Published ":ko?"게시일 ":"ထုတ်ပြန်သည့်နေ့ "}{formatDate(selected.created_at,locale)}</time><p>{selected.body}</p></section></div>}</section>;
}
