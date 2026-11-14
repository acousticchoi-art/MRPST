import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_LENGTH = { name: 100, email: 254, subject: 160, message: 5000 };

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const email = typeof payload.email === "string" ? payload.email.trim() : "";
    const subject = typeof payload.subject === "string" ? payload.subject.trim() : "";
    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    const website = typeof payload.website === "string" ? payload.website.trim() : "";

    if (website) return NextResponse.json({ ok: true });

    if (!name || !email || !subject || !message ||
        name.length > MAX_LENGTH.name || email.length > MAX_LENGTH.email ||
        subject.length > MAX_LENGTH.subject || message.length > MAX_LENGTH.message ||
        !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) ||
        /[\\r\\n]/.test(email) || /[\\r\\n]/.test(subject)) {
      return NextResponse.json({ error: "အချက်အလက်များကို မှန်ကန်စွာ ဖြည့်သွင်းပေးပါ။" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    const to = process.env.CONTACT_TO_EMAIL || "acousticchoi@gmail.com";
    if (!apiKey || !from) {
      return NextResponse.json({ error: "အီးမေးလ်ပို့ခြင်းစနစ်ကို ပြင်ဆင်နေဆဲဖြစ်ပါသည်။" }, { status: 503 });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: "[MRPST ဝက်ဘ်ဆိုက်မှ မေးမြန်းချက်] " + subject,
        text: [
          "MRPST ဝက်ဘ်ဆိုက်မှ မေးမြန်းချက်အသစ်တစ်စောင် လက်ခံရရှိပါသည်။",
          "",
          "အမည်: " + name,
          "အီးမေးလ်: " + email,
          "",
          "မေးမြန်းချက် ခေါင်းစဉ်:",
          subject,
          "",
          "မေးမြန်းချက် အသေးစိတ်:",
          message,
          "",
          "ဤအီးမေးလ်ကို ပြန်လည်ဖြေကြားရန် Reply ကို နှိပ်ပါ။",
        ].join("\\n"),
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "အီးမေးလ်ပို့ရာတွင် အမှားဖြစ်ပွားခဲ့ပါသည်။ ထပ်မံကြိုးစားပေးပါ။" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "တောင်းဆိုမှုကို လုပ်ဆောင်၍ မရနိုင်ပါ။" }, { status: 400 });
  }
}
