import Link from "next/link";
import {redirect} from "next/navigation";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import StudentSignOut from "./StudentSignOut";
export default async function StudentPortal({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;const supabase=await createSupabaseServerClient();if(!supabase)redirect(`/${locale}/student-login`);
 const {data:{user}}=await supabase.auth.getUser();if(!user)redirect(`/${locale}/student-login`);
 const {data:role}=await supabase.from("user_roles").select("role").eq("user_id",user.id).eq("role","student").maybeSingle();if(!role)redirect(`/${locale}/admin`);
 const {data:student,error}=await supabase.from("students").select("id,student_number,full_name,program,current_semester,admission_year,student_status").eq("auth_user_id",user.id).maybeSingle();
 if(error||!student)return <main className="module-page"><section className="module-page-content"><h1>학생 정보를 찾을 수 없습니다.</h1><p>학교 행정실에 계정 연결을 확인해 주세요.</p></section></main>;
 const {data:records}=await supabase.from("student_academic_records").select("academic_year,term,course_code,course_name,credits,score,grade").eq("student_id",student.id).order("academic_year",{ascending:false});
 return <main className="module-page"><header className="module-page-top"><Link href={`/${locale}`}>MRPST</Link><div className="module-page-tools"><span>{student.full_name} · 학생 포털</span><StudentSignOut locale={locale}/></div></header><section className="module-page-content"><span className="eyebrow">STUDENT PORTAL</span><h1>{student.full_name}</h1><p>학번 {student.student_number} · {student.program||"과정 미지정"}</p><div className="module-placeholder"><strong>학적 정보</strong><p>입학 연도: {student.admission_year??"—"}</p><p>현재 학기: {student.current_semester??"—"}</p><p>학적 상태: {student.student_status}</p></div><h2>수강 및 성적 기록</h2><div className="student-table-wrap"><table className="student-table"><thead><tr><th>학년도</th><th>학기</th><th>과목</th><th>학점</th><th>점수</th><th>성적</th></tr></thead><tbody>{(records??[]).map((r,i)=><tr key={i}><td>{r.academic_year}</td><td>{r.term}</td><td>{r.course_name}</td><td>{r.credits??"—"}</td><td>{r.score??"—"}</td><td>{r.grade??"—"}</td></tr>)}</tbody></table>{!records?.length&&<p>등록된 성적 기록이 없습니다.</p>}</div></section></main>;
}