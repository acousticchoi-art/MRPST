import ExistingPage from "../../../../../[locale]/admin/academics/timetable/print/page";
export const dynamic="force-dynamic";
export const revalidate=0;
export default function Page({searchParams}:{searchParams:Promise<{term?:string;department?:string}>}){return <ExistingPage params={Promise.resolve({locale:"en"})} searchParams={searchParams}/>;}
