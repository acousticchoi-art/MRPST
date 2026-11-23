import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canAccessModule, type ModuleKey, type MrpstRole } from "@/lib/auth/permissions";

type AccessFailure = { ok: false; status: 401 | 403 | 503; error: string };
type AccessSuccess = {
  ok: true;
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
  user: { id: string; email?: string };
  roles: MrpstRole[];
  permissions: { module_key: string; can_view: boolean; can_manage: boolean }[];
  canManage: boolean;
};

export async function getServerModuleAccess(module: ModuleKey): Promise<AccessFailure | AccessSuccess> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, status: 503, error: "서버 데이터베이스 설정을 확인할 수 없습니다." };

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false, status: 401, error: "로그인이 필요합니다." };

  const [{ data: roleRows, error: roleError }, { data: profile, error: profileError }, { data: permissions, error: permissionsError }] = await Promise.all([
    supabase.from("user_roles").select("role, department_id").eq("user_id", user.id),
    supabase.from("user_profiles").select("is_active").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_module_permissions").select("module_key, can_view, can_manage").eq("user_id", user.id)
  ]);

  const roles = (roleRows ?? []).map((row) => row.role as MrpstRole);
  const allowedPermissions = permissions ?? [];
  if (roleError || profileError || permissionsError || !roleRows?.length || profile?.is_active !== true ||
      !canAccessModule(roles, module, allowedPermissions)) {
    return { ok: false, status: 403, error: "이 메뉴의 데이터에 접근할 권한이 없습니다." };
  }

  const override = allowedPermissions.find((item) => item.module_key === module);
  const manageRoles: Record<ModuleKey, MrpstRole[]> = {
    finance: ["super_admin", "administrator", "finance_officer"],
    students: ["super_admin", "administrator", "student_officer", "academic_officer"],
    academics: ["super_admin", "administrator", "academic_officer"],
    facilities: ["super_admin", "administrator", "facility_manager"],
    library: ["super_admin", "administrator", "librarian"],
    meetings: ["super_admin", "administrator", "academic_officer", "faculty", "staff"],
    administration: ["super_admin"],
    website: ["super_admin", "administrator"]
  };
  const canManage = roles.includes("super_admin") ||
    (module !== "administration" && roles.includes("administrator")) ||
    (module !== "administration" && (override ? override.can_manage === true : roles.some((role) => manageRoles[module].includes(role))));

  return { ok: true, supabase, user, roles, permissions: allowedPermissions, canManage };
}
