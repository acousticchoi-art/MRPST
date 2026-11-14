"use client";

export default function ContactForm({locale}:{locale:string}) {
  const isKo=locale==="ko";
  function handleSubmit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form=new FormData(event.currentTarget);
    const name=String(form.get("name")||"").trim();
    const email=String(form.get("email")||"").trim();
    const subject=String(form.get("subject")||"").trim();
    const message=String(form.get("message")||"").trim();
    const body=[`Name: ${name}`,`Email: ${email}`,"",message].join("\n");
    const mailto=`mailto:acousticchoi@gmail.com?subject=${encodeURIComponent(subject||"MRPST Website Enquiry")}&body=${encodeURIComponent(body)}`;
    window.location.href=mailto;
  }
  return <form className="public-contact-form" onSubmit={handleSubmit}>
    <label>{isKo?"이름":"အမည်"}<input name="name" autoComplete="name" required maxLength={100} placeholder={isKo?"이름을 입력하세요":"အမည်ထည့်ပါ"}/></label>
    <label>{isKo?"이메일":"အီးမေးလ်"}<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="name@example.com"/></label>
    <label>{isKo?"제목":"အကြောင်းအရာ"}<input name="subject" required maxLength={160} placeholder={isKo?"문의 제목":"မေးမြန်းလိုသည့် ခေါင်းစဉ်"}/></label>
    <label>{isKo?"문의 내용":"မေးမြန်းချက်"}<textarea name="message" required rows={7} maxLength={5000} placeholder={isKo?"문의하실 내용을 입력하세요.":"မေးမြန်းလိုသည့် အကြောင်းအရာကို ရေးသားပါ။"}/></label>
    <button className="btn primary" type="submit">{isKo?"이메일 작성하기":"အီးမေးလ်ဖြင့် ပေးပို့ရန်"} ↗</button>
    <p className="contact-form-note">{isKo?"버튼을 누르면 기기에 설정된 이메일 앱이 열리고, 작성한 내용이 수신 주소에 입력됩니다.":"ခလုတ်ကိုနှိပ်ပါက သင့်စက်ရှိ အီးမေးလ်အက်ပ် ပွင့်လာပြီး အချက်အလက်များကို ဖြည့်သွင်းပေးပါမည်။"}</p>
  </form>;
}
