type TranslationResponse={canManage:boolean;body:string|null};
// Share only simultaneous requests; never cache a permission or data across visits.
let inFlight:Promise<TranslationResponse>|undefined;
export function loadAdminTranslations():Promise<TranslationResponse>{
  if(!inFlight){
    inFlight=fetch("/api/admin/data/website?scope=admin-translations",{cache:"no-store",credentials:"same-origin",headers:{Accept:"application/json"}})
      .then(async response=>{
        if(!response.ok)throw new Error("Unable to load admin translations.");
        const data=await response.json();
        return {canManage:data?.canManage===true,body:typeof data?.body==="string"?data.body:null};
      }).finally(()=>{inFlight=undefined;});
  }
  return inFlight;
}
