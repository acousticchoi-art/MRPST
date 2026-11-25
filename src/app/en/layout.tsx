import "../globals.css";
import "../auth.css";
import "../admin.css";
import "../admin-workflows.css";
import "../admin-design-system.css";
import "../registration.css";
import "../typography.css";
import "../responsive.css";
import LocalePreference from "../[locale]/LocalePreference";
export default function EnglishLayout({children}:{children:React.ReactNode}){
 return <div lang="en"><LocalePreference locale="en"/>{children}</div>;
}
