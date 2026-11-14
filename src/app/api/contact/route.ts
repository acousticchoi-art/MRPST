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
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        /[\r\n]/.test(email) || /[\r\n]/.test(subject)) {
      return NextResponse.json({ error: "입력 내용을 확인해 주세요." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    const to = process.env.CONTACT_TO_EMAIL || "acousticchoi@gmail.com";
    if (!apiKey || !from) {
      return NextResponse.json({ error: "문의 메일 설정이 아직 완료되지 않았습니다." }, { status: 503 });
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
        subject: "[MRPST 홈페이지 문의] " + subject,
        text: [
          "MRPST 홈페이지에서 새 문의가 접수되었습니다.",
          "",
          "이름: " + name,
          "이메일: " + email,
          "",
          "문의 내용:",
          message,
        ].join("\n"),
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "요청을 처리하지 못했습니다." }, { status: 400 });
  }
}
