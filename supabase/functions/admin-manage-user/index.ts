import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin, Access-Control-Request-Headers",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !serviceKey) return json({ error: "Unauthorized" }, 401);
  const callerClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
  const { data: { user: caller }, error: authError } = await callerClient.auth.getUser();
  if (authError || !caller) return json({ error: "로그인이 필요합니다." }, 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const createProvisionedUser = async (attributes: {
    email: string;
    password: string;
    email_confirm: boolean;
    user_metadata: Record<string, unknown>;
  }) => {
    const token = crypto.randomUUID();
    const { error: tokenError } = await admin.from("mrpst_auth_user_creation_tokens").insert({
      token,
      email: attributes.email,
    });
    if (tokenError) return { data: { user: null }, error: tokenError };

    const result = await admin.auth.admin.createUser({
      ...attributes,
      user_metadata: { ...attributes.user_metadata, mrpst_admin_provisioning_token: token },
    });
    if (result.error || !result.data.user) {
      await admin.from("mrpst_auth_user_creation_tokens").delete().eq("token", token);
      return result;
    }
    const { mrpst_admin_provisioning_token: _consumedToken, ...cleanUserMetadata } = result.data.user.user_metadata ?? {};
    const { error: metadataCleanupError } = await admin.auth.admin.updateUserById(result.data.user.id, { user_metadata: cleanUserMetadata });
    if (metadataCleanupError) {
      // Fail closed: do not leave a provisioned user with the internal token in metadata.
      await admin.auth.admin.deleteUser(result.data.user.id);
      await admin.from("mrpst_auth_user_creation_tokens").delete().eq("token", token);
      return { data: { user: null }, error: metadataCleanupError };
    }
    return result;
  };
  const { data: profile } = await admin.from("user_profiles").select("is_active").eq("user_id", caller.id).maybeSingle();
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", caller.id);
  const callerRoles = (roles ?? []).map((item: { role: string }) => item.role);
  const isSuperAdmin = callerRoles.includes("super_admin");
  const { data: canManageStudents, error: permissionError } = await admin.rpc("mrpst_can_manage_module", { target_user: caller.id, target_module: "students" });
  if (profile?.is_active !== true || permissionError || canManageStudents !== true) return json({ error: "학생 계정 발급 권한이 필요합니다." }, 403);

  try {
    const body = await req.json();
    if (body.action !== "create_student" && !isSuperAdmin) return json({ error: "최고 관리자 권한이 필요합니다." }, 403);
    if (body.action === "create_student") {
      const studentId = String(body.student_id || "");
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!studentId || !email || password.length < 8) return json({ error: "학생, 이메일과 8자 이상의 초기 비밀번호가 필요합니다." }, 400);
      const { data: student, error: studentError } = await admin.from("students")
        .select("id,student_number,full_name,auth_user_id,email").eq("id", studentId).maybeSingle();
      if (studentError || !student) return json({ error: "학생 정보를 찾을 수 없습니다." }, 404);
      if (student.auth_user_id) return json({ error: "이미 로그인 계정이 연결된 학생입니다." }, 409);
      const { data: created, error: createError } = await createProvisionedUser({
        email, password, email_confirm: true,
        user_metadata: { full_name: student.full_name, student_number: student.student_number, preferred_locale: "my" },
      });
      if (createError || !created.user) return json({ error: createError?.message || "계정을 생성하지 못했습니다." }, 400);
      const userId = created.user.id;
      const { error: profileError } = await admin.from("user_profiles").upsert({
        user_id: userId, full_name: student.full_name, email, preferred_locale: "my", is_active: true,
      });
      if (profileError) { await admin.auth.admin.deleteUser(userId); return json({ error: profileError.message }, 400); }
      const { error: roleError } = await admin.from("user_roles").insert({ user_id: userId, role: "student", assigned_by: caller.id });
      if (roleError) {
        await admin.from("user_profiles").delete().eq("user_id", userId);
        await admin.auth.admin.deleteUser(userId);
        return json({ error: roleError.message }, 400);
      }
      const { error: linkError } = await admin.from("students").update({ auth_user_id: userId, email }).eq("id", studentId).is("auth_user_id", null);
      if (linkError) {
        await admin.from("user_roles").delete().eq("user_id", userId);
        await admin.from("user_profiles").delete().eq("user_id", userId);
        await admin.auth.admin.deleteUser(userId);
        return json({ error: linkError.message }, 400);
      }
      const { error: auditError } = await admin.from("admin_audit_log").insert({
        actor_id: caller.id, entity_type: "student_account", entity_id: studentId, action: "insert",
        details: { event: "student_account_created", student_number: student.student_number, email },
      });
      return json({ user_id: userId, email, student_number: student.student_number, audit_logged: !auditError, audit_warning: auditError ? "학생 계정은 생성되었지만 변경 이력 기록에 실패했습니다." : undefined });
    }

    if (body.action === "create") {
      const email = String(body.email || "").trim().toLowerCase();
      const fullName = String(body.full_name || "").trim();
      const password = String(body.password || "");
      const preferredLocale = ["ko", "en", "my"].includes(body.preferred_locale) ? body.preferred_locale : "en";
      const requestedRole = String(body.role || "staff");
      const departmentId = body.department_id ? String(body.department_id) : null;
      const allowedRoles = ["administrator", "finance_officer", "academic_officer", "student_officer", "librarian", "facility_manager", "faculty", "staff"];
      if (!email || !fullName || password.length < 8 || !allowedRoles.includes(requestedRole)) return json({ error: "이름, 이메일, 8자 이상의 비밀번호와 유효한 역할을 입력해 주세요." }, 400);
      if (departmentId) {
        const { data: department } = await admin.from("departments").select("id").eq("id", departmentId).eq("is_active", true).maybeSingle();
        if (!department) return json({ error: "선택한 부서가 없거나 비활성 상태입니다." }, 400);
      }
      const { data: created, error: createError } = await createProvisionedUser({
        email, password, email_confirm: true,
        user_metadata: { full_name: fullName, preferred_locale: preferredLocale },
      });
      if (createError || !created.user) return json({ error: createError?.message || "계정을 생성하지 못했습니다." }, 400);
      const userId = created.user.id;
      const { error: profileError } = await admin.from("user_profiles").upsert({ user_id: userId, full_name: fullName, email, preferred_locale: preferredLocale, is_active: true });
      if (profileError) { await admin.auth.admin.deleteUser(userId); return json({ error: profileError.message }, 400); }
      const { error: roleError } = await admin.from("user_roles").insert({ user_id: userId, role: requestedRole, department_id: departmentId, assigned_by: caller.id });
      if (roleError) {
        await admin.from("user_profiles").delete().eq("user_id", userId);
        await admin.auth.admin.deleteUser(userId);
        return json({ error: roleError.message }, 400);
      }
      const { error: auditError } = await admin.from("admin_audit_log").insert({ actor_id: caller.id, entity_type: "user_role", entity_id: userId, action: "insert", details: { event: "account_created", email, full_name: fullName, role: requestedRole, department_id: departmentId } });
      return json({ user_id: userId, audit_logged: !auditError, audit_warning: auditError ? "계정은 생성되었지만 변경 이력 기록에 실패했습니다." : undefined });
    }
    if (body.action === "update_password") {
      const userId = String(body.user_id || "");
      const password = String(body.password || "");
      if (!userId || password.length < 8) return json({ error: "8자 이상의 새 비밀번호를 입력해 주세요." }, 400);
      const { data: target } = await admin.from("user_profiles").select("user_id,full_name,email").eq("user_id", userId).maybeSingle();
      if (!target) return json({ error: "대상 계정을 찾을 수 없습니다." }, 404);
      const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password });
      if (updateError) return json({ error: updateError.message }, 400);
      const { error: auditError } = await admin.from("admin_audit_log").insert({ actor_id: caller.id, entity_type: "user_profile", entity_id: userId, action: "update", details: { event: "password_changed", email: target.email || "", full_name: target.full_name || "" } });
      return json({ success: true, audit_logged: !auditError, audit_warning: auditError ? "비밀번호는 변경되었지만 변경 이력 기록에 실패했습니다." : undefined });
    }
    return json({ error: "지원하지 않는 작업입니다." }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "요청을 처리하지 못했습니다." }, 500);
  }
});
