import "./certificate.css";
import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getServerModuleAccess} from "@/lib/auth/server-access";
import CertificatePrintButton from "./CertificatePrintButton";

export const dynamic="force-dynamic";
export const revalidate=0;

type Kind="enrollment"|"graduation"|"record";
const statusKo:Record<string,string>={active:"재학",leave:"휴학",graduated:"졸업",withdrawn:"자퇴"};
const statusMy:Record<string,string>={active:"တက်ရောက်ဆဲ",leave:"ခွင့်ယူထား",graduated:"ဘွဲ့ရ",withdrawn:"ကျောင်းထွက်"};
const typeTitle={
  ko:{enrollment:"재학증명서",graduation:"졸업증명서",record:"학적확인서"},
  my:{enrollment:"ကျောင်းတက်ရောက်ကြောင်း ထောက်ခံစာ",graduation:"ဘွဲ့ရကြောင်း ထောက်ခံစာ",record:"ကျောင်းသားမှတ်တမ်း အတည်ပြုစာ"}
};
export default async function CertificatePage({params,searchParams}:{params:Promise<{locale:string;studentId:string}>;searchParams:Promise<{type?:string}>}){
 const {locale,studentId}=await params;
 const lang=locale==="my"?"my":"ko";
 const query=await searchParams;
 const kind:Kind=query.type==="graduation"?"graduation":query.type==="record"?"record":"enrollment";
 const access=await getServerModuleAccess("students");
 if(!access.ok){if(access.status===401)redirect(`/${locale}/login`);return <main className="student-cert-error">{access.error}</main>;}
 if(!/^[0-9a-f-]{36}$/i.test(studentId))notFound();
 const {data:student,error}=await access.supabase.from("students").select("id,student_number,full_name,full_name_my,full_name_en,program,cohort,admission_year,student_status,graduation_year,graduation_date,graduation_number").eq("id",studentId).maybeSingle();
 if(error||!student)notFound();
 const {data:graduation}=await access.supabase.from("student_graduations").select("degree_name,graduation_year,graduation_date,graduation_number,approved_at").eq("student_id",studentId).not("approved_at","is",null).order("approved_at",{ascending:false}).limit(1).maybeSingle();
 const approvedGraduation=student.student_status==="graduated"&&!!graduation;
 const valid=kind==="record"||(kind==="enrollment"&&student.student_status==="active")||(kind==="graduation"&&approvedGraduation);
 const t=lang==="ko"?{
  label:"STUDENT CERTIFICATES",page:"학생 증명서 출력",back:"학생 관리로 돌아가기",print:"인쇄 / PDF 저장",
  name:"성명",number:"학번",program:"과정",cohort:"학년 / 기수",admission:"입학 연도",status:"학적 상태",
  degree:"학위",graduation:"졸업일",date:"출력일",unknown:"미등록",reason:"현재 학적 상태 또는 승인된 졸업 이력으로는 이 종류의 증명서를 출력할 수 없습니다.",
  body:{enrollment:"위 학생이 본 신학교에 재학 중임을 등록된 학적 자료에 따라 확인합니다.",graduation:"위 학생이 본 신학교의 해당 과정을 졸업하였음을 승인된 졸업 기록에 따라 확인합니다.",record:"위 학생의 학적 정보가 본 신학교의 전산 기록에 등록되어 있음을 확인합니다."},
  warning:"이 문서는 관리자 시스템에서 생성한 확인용 출력본입니다. 별도의 직인이나 서명이 필요한 공식 제출용 서류는 학교의 확인을 받아야 합니다."
 }:{
  label:"STUDENT CERTIFICATES",page:"ကျောင်းသားထောက်ခံစာ ထုတ်ယူရန်",back:"ကျောင်းသားစာရင်းသို့ ပြန်သွားရန်",print:"ပုံနှိပ်ရန် / PDF သိမ်းရန်",
  name:"အမည်",number:"ကျောင်းသားနံပါတ်",program:"ပညာရေးအစီအစဉ်",cohort:"အတန်း / အုပ်စု",admission:"ဝင်ခွင့်နှစ်",status:"ကျောင်းသားအခြေအနေ",
  degree:"ဘွဲ့",graduation:"ဘွဲ့ရသည့်နေ့",date:"ထုတ်ယူသည့်နေ့",unknown:"မှတ်တမ်းမရှိ",reason:"လက်ရှိကျောင်းသားအခြေအနေ သို့မဟုတ် အတည်ပြုထားသည့် ဘွဲ့ရမှတ်တမ်းအရ ဤထောက်ခံစာကို ထုတ်ယူ၍မရပါ။",
  body:{enrollment:"ဤကျောင်းသားသည် ကျောင်း၏မှတ်တမ်းများအရ လက်ရှိတက်ရောက်နေကြောင်း အတည်ပြုပါသည်။",graduation:"ဤကျောင်းသားသည် အတည်ပြုထားသည့် ဘွဲ့ရမှတ်တမ်းအရ သက်ဆိုင်ရာသင်တန်းကို ပြီးမြောက်ကြောင်း အတည်ပြုပါသည်။",record:"ဤကျောင်းသား၏ အချက်အလက်များကို ကျောင်း၏မှတ်တမ်းတွင် မှတ်ပုံတင်ထားကြောင်း အတည်ပြုပါသည်။"},
  warning:"ဤစာရွက်စာတမ်းသည် စီမံခန့်ခွဲရေးစနစ်မှ ထုတ်ယူထားသည့် စစ်ဆေးရန်မိတ္တူဖြစ်သည်။ တရားဝင်တံဆိပ်နှင့် လက်မှတ်လိုအပ်ပါက ကျောင်း၏အတည်ပြုချက်ကို ရယူပါ။"
 };
 const title=typeTitle[lang][kind];
 const date=new Intl.DateTimeFormat(lang==="my"?"en-GB":"ko-KR",{timeZone:"Asia/Yangon",year:"numeric",month:"long",day:"numeric"}).format(new Date());
 const graduateDate=graduation?.graduation_date??student.graduation_date;
 const fields=[
  [t.number,student.student_number],[t.name,lang==="my"?(student.full_name_my||student.full_name):student.full_name],
  [t.program,student.program||t.unknown],[t.cohort,student.cohort||t.unknown],
  [t.admission,student.admission_year?String(student.admission_year):t.unknown],
  [t.status,(lang==="my"?statusMy:statusKo)[student.student_status]||student.student_status],
  ...(kind==="graduation"?[[t.degree,graduation?.degree_name||student.program||t.unknown],[t.graduation,graduateDate||t.unknown]]:[])
 ];
 return <main className="student-cert-page">
   <div className="student-cert-toolbar"><Link href={`/${locale}/admin/students`}>{t.back}</Link><strong>{t.page}</strong><div className="student-cert-links">{(["enrollment","graduation","record"] as Kind[]).map(type=><Link key={type} className={type===kind?"active":""} href={`/${locale}/admin/students/certificates/${studentId}?type=${type}`}>{typeTitle[lang][type]}</Link>)}</div>{valid&&<CertificatePrintButton label={t.print}/>}</div>
   {valid?<article className="student-cert-sheet">
    <header><img src="/mrpst-logo.png" alt="" width="72" height="72"/><div><span>MRPST</span><strong>Myanmar Reformed Presbyterian School of Theology</strong></div></header>
    <p className="student-cert-kicker">STUDENT CERTIFICATE</p><h1>{title}</h1>
    <dl>{fields.map(([label,value],index)=><div key={index}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <p className="student-cert-statement">{t.body[kind]}</p>
    <p className="student-cert-date">{t.date}: {date}</p>
    <footer><strong>Myanmar Reformed Presbyterian School of Theology</strong><p>{t.warning}</p></footer>
   </article>:<section className="student-cert-unavailable">{t.reason}</section>}
 </main>;
}
