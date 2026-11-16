import type {Metadata} from "next";
export const metadata:Metadata={
 title:"MRPST | Myanmar Reformed Presbyterian School of Theology",
 description:"Official website and administration portal of Myanmar Reformed Presbyterian School of Theology (MRPST).",
 icons:{icon:"/mrpst-logo.svg",shortcut:"/mrpst-logo.svg",apple:"/mrpst-logo.svg"},
 appleWebApp:{capable:true,title:"MRPST",statusBarStyle:"default"}
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html><body>{children}</body></html>;}
