import "../globals.css";
import "../auth.css";
import "../admin.css";
import "../registration.css";
import {notFound,redirect} from "next/navigation";
import LocalePreference from "./LocalePreference";
const locales=["my","ko"];
export function generateStaticParams(){return locales.map(locale=>({locale}));}
export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){
 const {locale}=await params;
 if(locale==="en")redirect("/ko");
 if(!locales.includes(locale))notFound();
 return <div lang={locale}><LocalePreference locale={locale}/>{children}</div>;
}