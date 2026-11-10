import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
  const { data: profile } = await admin.from("user_profiles").select("is_active").eq("user_id", caller.id).maybeSingle();
  const { data: role } = await admin.from("user_roles").select("role").eq("user_id", caller.id).eq("role", "super_admin").maybeSingle();
  if (profile?.is_active !== true || !role) return json({ error: "최고 관리자 권한이 필요합니다." }, 403);

  try {
    const body = await req.json();
    if (body.action === "create") {
      const email = String(body.email || "").trim().toLowerCase();
      const fullName = String(body.full_name || "").trim();
      const password = String(body.password || "");
      const preferredLocale = ["ko", "en", "my"].includes(body.preferred_locale) ? body.preferred_locale : "en";
      const requestedRole = String(body.role || "staff");
      const departmentId = body.department_id ? String(body.department_id) : null;
      const allowedRoles = ["administrator", "finance_officer", "academic_officer", "student_officer", "librarian", "facility_manager", "faculty", "staff"];
      if (!email || !fullName || password.length < 8 || !allowedRoles.includes(requestedRole)) {
        return json({ error: "이름, 이메일, 8자 이상의 비밀번호와 유효한 역할을 입력해 주세요." }, 400);
      }
      if (departmentId) {
        const { data: department } = await admin.from("departments").select("id").eq("id", departmentId).eq("is_active", true).maybeSingle();
        if (!department) return json({ error: "선택한 부서가 없거나 비활성 상태입니다." }, 400);
      }
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { full_name: fullName, preferred_locale: preferredLocale },
      });
      if (createError || !created.user) return json({ error: createError?.message || "계정을 생성하지 못했습니다." }, 400);
      const userId = created.user.id;
      const { error: profileError } = await admin.from("user_profiles").upsert({
        user_id: userId, full_name: fullName, email, preferred_locale: preferredLocale, is_active: true,
      });
      if (profileError) {
        await admin.auth.admin.deleteUser(userId);
        return json({ error: profileError.message }, 400);
      }
      const { error: roleError } = await admin.from("user_roles").insert({
        user_id: userId, role: requestedRole, department_id: departmentId, assigned_by: caller.id,
      });
      if (roleError) {
        await admin.from("user_profiles").delete().eq("user_id", userId);
        await admin.auth.admin.deleteUser(userId);
        return json({ error: roleError.message }, 400);
      }
      await admin.from("admin_audit_log").insert({
        actor_id: caller.id, entity_type: "user_role", entity_id: userId, action: "insert",
        details: { event: "account_created", email, full_name: fullName, role: requestedRole, department_id: departmentId },
      });
      return json({ user_id: userId });
    }

    if (body.action === "update_password") {
      const userId = String(body.user_id || "");
      const password = String(body.password || "");
      if (!userId || password.length < 8) return json({ error: "8자 이상의 새 비밀번호를 입력해 주세요." }, 400);
      const { data: target } = await admin.from("user_profiles").select("user_id,full_name,email").eq("user_id", userId).maybeSingle();
      if (!target) return json({ error: "대상 계정을 찾을 수 없습니다." }, 404);
      const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password });
      if (updateError) return json({ error: updateError.message }, 400);
      await admin.from("admin_audit_log").insert({
        actor_id: caller.id, entity_type: "user_profile", entity_id: userId, action: "update",
        details: { event: "password_changed", email: target.email || "", full_name: target.full_name || "" },
      });
      return json({ success: true });
    }
    return json({ error: "지원하지 않는 작업입니다." }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "요청을 처리하지 못했습니다." }, 500);
  }
});
