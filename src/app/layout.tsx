import type {Metadata} from "next";
export const metadata:Metadata={title:"MRPST | Myanmar Reformed Presbyterian Seminary",description:"Official website and administration portal of MRPST."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html><body>{children}</body></html>;}