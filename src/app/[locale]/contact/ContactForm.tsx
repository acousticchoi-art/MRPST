"use client";

import { useState } from "react";

export default function ContactForm({locale}:{locale:string}) {
  const isKo=locale==="ko";
  const [status,setStatus]=useState<"idle"|"sending"|"success"|"error">("idle");
  const [error,setError]=useState("");

  async function handleSubmit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");
    const form=new FormData(event.currentTarget);
    const payload={
      name:String(form.get("name")||"").trim(),
      email:String(form.get("email")||"").trim(),
      subject:String(form.get("subject")||"").trim(),
      message:String(form.get("message")||"").trim(),
      website:String(form.get("website")||"").trim(),
    };
    try {
      const response=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const result=await response.json();
      if(!response.ok) throw new Error(result.error||"메일 발송에 실패했습니다.");
      event.currentTarget.reset();
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error?err.message:"메일 발송 중 오류가 발생했습니다.");
      setStatus("error");
    }
  }

  return <form className="public-contact-form" onSubmit={handleSubmit}>
    <label>{isKo?"이름":"အမည်"}<input name="name" autoComplete="name" required maxLength={100} placeholder={isKo?"이름을 입력하세요":"အမည်ထည့်ပါ"}/></label>
    <label>{isKo?"이메일":"အီးမေးလ်"}<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="name@example.com"/></label>
    <label>{isKo?"제목":"အကြောင်းအရာ"}<input name="subject" required maxLength={160} placeholder={isKo?"문의 제목":"မေးမြန်းလိုသည့် ခေါင်းစဉ်"}/></label>
    <label>{isKo?"문의 내용":"မေးမြန်းချက်"}<textarea name="message" required rows={7} maxLength={5000} placeholder={isKo?"문의하실 내용을 입력하세요.":"မေးမြန်းလိုသည့် အကြောင်းအရာကို ရေးသားပါ။"}/></label>
    <div aria-hidden="true" style={{position:"absolute",left:"-10000px",width:1,height:1,overflow:"hidden"}}><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <button className="btn primary" type="submit" disabled={status==="sending"}>{status==="sending"?(isKo?"전송 중...":"ပေးပို့နေသည်..."):(isKo?"문의 보내기":"မေးမြန်းချက် ပေးပို့ရန်")} ↗</button>
    {status==="success"&&<p role="status" className="contact-form-note">{isKo?"문의가 정상적으로 접수되었습니다. 감사합니다.":"မေးမြန်းချက်ကို လက်ခံရရှိပါပြီ။ ကျေးဇူးတင်ပါသည်။"}</p>}
    {status==="error"&&<p role="alert" className="contact-form-note">{error}</p>}
  </form>;
}
