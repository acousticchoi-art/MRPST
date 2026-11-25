import ExistingPage from "../../../[locale]/admin/[module]/page";
export default async function Page({params}:{params:Promise<{module:string}>}){const {module}=await params;return <ExistingPage params={Promise.resolve({locale:"en",module})}/>;}
