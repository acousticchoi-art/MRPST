// Shared file-format validation. No database access in this module.
export const backupTables=[
  "academic_calendar_events","academic_class_sessions","academic_course_syllabi","academic_courses",
  "academic_enrollments","academic_grades","academic_instructors","academic_teaching_assignments",
  "academic_terms","academic_timetable_entries","academic_timetable_events","academic_timetable_slots",
  "departments","donor_contributions","facility_buildings","facility_inventory","facility_maintenance",
  "facility_vehicle_logs","facility_vehicles","finance_accounts","finance_budget_lines","finance_budgets",
  "finance_donors","finance_funds","finance_periods","journal_entries","journal_lines",
  "library_books","library_loans","library_members","meeting_action_items","meeting_materials",
  "meeting_participants","meetings","scholarship_awards","scholarship_disbursements","student_academic_records",
  "student_graduations","student_promotion_batches","student_promotion_items","student_status_history",
  "student_term_enrollments","students","website_contents"
] as const;
export type Row=Record<string,unknown>;
export const restoreColumns={
 departments:"id code name_en name_my name_ko is_active created_at",
 students:"id student_number full_name full_name_my full_name_en gender date_of_birth admission_year program cohort student_status phone email guardian_name guardian_phone notes created_by created_at updated_at program_code current_semester admission_term graduation_year graduation_term graduation_date graduation_number auth_user_id",
 academic_grades:"id student_id course_id term_id score grade remarks entered_by created_at updated_at",
 academic_calendar_events:"id title description event_type start_date end_date start_time end_time location is_published created_by updated_by created_at updated_at",
 facility_buildings:"id building_code name location floors area_sqm building_status description created_by created_at updated_at",
 facility_inventory:"id asset_code name category building_id quantity condition_status purchase_date purchase_cost currency assigned_to notes created_by created_at updated_at",
 library_books:"id isbn title author publisher publication_year category language shelf_location total_copies description created_by created_at updated_at",
 website_contents:"id content_type content_key locale title body is_published sort_order created_by updated_by created_at updated_at"
} as const;
export type RestoreTable=keyof typeof restoreColumns;
export const isRestoreTable=(value:unknown):value is RestoreTable=>typeof value==="string"&&Object.prototype.hasOwnProperty.call(restoreColumns,value);
export const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isRecord=(x:unknown):x is Row=>x!==null&&typeof x==="object"&&!Array.isArray(x);
export function validateRows(rows:unknown,table?:RestoreTable):Row[]{
 if(!Array.isArray(rows)||rows.length>50000)throw Error("invalid_file");
 const seen=new Set<string>();
 const columns=table?restoreColumns[table].split(" "):null;
 for(const row of rows){
  if(!isRecord(row)||typeof row.id!=="string"||!uuidPattern.test(row.id)||seen.has(row.id.toLowerCase()))throw Error("invalid_file");
  if(columns&&(Object.keys(row).length!==columns.length||!columns.every(c=>Object.prototype.hasOwnProperty.call(row,c))))throw Error("invalid_file");
  seen.add(row.id.toLowerCase());
 }
 return rows;
}
export function validateBackup(value:unknown){
 if(!isRecord(value)||value.format!=="mrpst-operational-backup"||value.version!==2||value.table_count!==backupTables.length||typeof value.generated_at!=="string"||!Number.isFinite(Date.parse(value.generated_at))||!isRecord(value.tables)||!isRecord(value.row_counts))throw Error("invalid_file");
 if(Object.keys(value.tables).length!==backupTables.length||Object.keys(value.row_counts).length!==backupTables.length)throw Error("invalid_file");
 const tables:Record<string,Row[]>={};
 for(const table of backupTables){
  const rows=validateRows(value.tables[table],isRestoreTable(table)?table:undefined);
  if(value.row_counts[table]!==rows.length)throw Error("invalid_file");
  tables[table]=rows;
 }
 return {generatedAt:value.generated_at,tables};
}
