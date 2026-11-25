import ExistingPage from "../../../../../[locale]/admin/students/certificates/[studentId]/page";
export const dynamic="force-dynamic";
export const revalidate=0;
export default async function Page({params,searchParams}:{params:Promise<{studentId:string}>;searchParams:Promise<{type?:string}>}){const {studentId}=await params;return <ExistingPage params={Promise.resolve({locale:"en",studentId})} searchParams={searchParams}/>;}
