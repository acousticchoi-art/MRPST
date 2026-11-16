import type {Metadata} from "next";
export const metadata:Metadata={
 title:"MRPST | Myanmar Reformed Presbyterian School of Theology",
 description:"Official website and administration portal of Myanmar Reformed Presbyterian School of Theology (MRPST).",
 icons:{icon:"/mrpst-logo.png",shortcut:"/mrpst-logo.png",apple:"/mrpst-logo.png"},
 appleWebApp:{capable:true,title:"MRPST",statusBarStyle:"default"}
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html><body>{children}</body></html>;}
