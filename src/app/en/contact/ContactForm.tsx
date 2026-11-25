"use client";

export default function ContactForm({locale}:{locale:string}) {

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
    <label>{"Name"}<input name="name" autoComplete="name" required maxLength={100} placeholder={"Enter your name"}/></label>
    <label>{"Email"}<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="name@example.com"/></label>
    <label>{"Subject"}<input name="subject" required maxLength={160} placeholder={"e.g. Admissions and academic programs"}/></label>
    <label>{"Message"}<textarea name="message" required rows={7} maxLength={5000} placeholder={"Please enter your enquiry."}/></label>
    <button className="btn primary" type="submit">{"Compose email"} ↗</button>
    <p className="contact-form-note">{"This opens your email application with the recipient and your message filled in."}</p>
  </form>;
}
