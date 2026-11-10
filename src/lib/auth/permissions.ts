export type MrpstRole="super_admin"|"administrator"|"finance_officer"|"academic_officer"|"student_officer"|"librarian"|"facility_manager"|"faculty"|"staff";
export type ModuleKey="finance"|"students"|"academics"|"facilities"|"library"|"meetings"|"administration"|"website";
export const MODULES:Record<ModuleKey,{title:string;description:string;roles:M[]}> = {
 finance:{title:"Financial Management",description:"General finance, special funds, scholarship fund, budgets and approvals.",roles:["super_admin","administrator","finance_officer"]},
 students:{title:"Student Management",description:"Student profiles, academic records and student scholarships.",roles:["super_admin","administrator","student_officer","academic_officer"]},
 academics:{title:"Academic Management",description:"Departments, courses, semesters, class schedules and academic results.",roles:["super_admin","administrator","academic_officer","faculty"]},
 facilities:{title:"School Facilities",description:"Buildings, equipment inventory, vehicles, maintenance and repairs.",roles:["super_admin","administrator","facility_manager"]},
 library:{title:"Library Management",description:"Book catalogue, circulation, loans, returns and library members.",roles:["super_admin","administrator","librarian"]},
 meetings:{title:"Meeting Materials",description:"Academic committee, faculty and staff meeting records and documents.",roles:["super_admin","administrator","academic_officer","faculty","staff"]},
 administration:{title:"Administration & Settings",description:"User accounts, roles, department assignments and audit history.",roles:["super_admin"]},
 website:{title:"Website CMS",description:"Public website content, institutional history, announcements and contact details.",roles:["super_admin","administrator"]}
};
type M = MrpstRole;
export function canAccessModule(roles:M[],module:ModuleKey){return roles.some(role=>MODULES[module].roles.includes(role));}
export function getModuleKey(value:string):ModuleKey|null{return Object.prototype.hasOwnProperty.call(MODULES,value)?value as ModuleKey:null;}
export function roleLabel(role:M){return ({super_admin:"Super Administrator",administrator:"Administrator",finance_officer:"Finance Officer",academic_officer:"Academic Officer",student_officer:"Student Officer",librarian:"Librarian",facility_manager:"Facility Manager",faculty:"Faculty",staff:"Staff"} as const)[role];}
