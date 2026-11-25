import SiteHeader from "../../[locale]/SiteHeader";
import EnglishCalendar from "./EnglishCalendar";
export default function CalendarPage(){return <><SiteHeader locale="en" active="calendar"/><main className="academics-workspace" style={{maxWidth:1100,margin:"0 auto",padding:"40px 20px"}}><div className="academics-heading" style={{marginTop:36}}><span className="eyebrow">MRPST ACADEMIC CALENDAR</span><h1>Academic Calendar</h1><p>View academic dates and important school events throughout the year.</p></div><EnglishCalendar/></main></>;}
