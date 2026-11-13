import {redirect} from "next/navigation";
import {cookies} from "next/headers";
export default async function IndexPage(){
 const jar=await cookies();
 const saved=jar.get("mrpst_locale")?.value;
 redirect(saved==="ko"||saved==="my"?`/${saved}`:"/ko");
}