import "../globals.css";
import "../auth.css";
import "../admin.css";
import "../registration.css";
import {notFound} from "next/navigation";
import {cookies} from "next/headers";
const locales=["en","my","ko"];
export function generateStaticParams(){return locales.map(locale=>({locale}));}
export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){
 const {locale}=await params;
 if(!locales.includes(locale))notFound();
 const jar=await cookies();
 jar.set("mrpst_locale",locale,{path:"/",maxAge:60*60*24*365,sameSite:"lax",httpOnly:true});
 return <div lang={locale}>{children}</div>;
}