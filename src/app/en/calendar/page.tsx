import SiteHeader from "../../[locale]/SiteHeader";
import EnglishCalendar from "./EnglishCalendar";
import {getPublishedWebsiteContent,inlinePageValues,websiteCopy} from "@/lib/website-content";
import InlinePageEditor from "../../[locale]/InlinePageEditor";

export default async function CalendarPage(){
 const locale="en";
 const content=await getPublishedWebsiteContent(locale);
 const hero=websiteCopy(content,"calendar-hero",{title:"Academic Calendar",body:"View academic dates and important school events throughout the year."});
 return <InlinePageEditor pageKey="calendar" locale={locale} initialValues={inlinePageValues(content,"calendar")}><SiteHeader locale={locale} active="calendar"/><main className="academics-workspace" style={{maxWidth:1100,margin:"0 auto",padding:"40px 20px"}}><div className="academics-heading" style={{marginTop:36}}><span className="eyebrow">MRPST ACADEMIC CALENDAR</span><h1>{hero.title}</h1><p>{hero.body}</p></div><div data-no-inline-edit><EnglishCalendar/></div></main></InlinePageEditor>;
}
