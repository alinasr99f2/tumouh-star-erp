
import { supabase } from "./supabase";

export type ResidentialTenantContext = {
  tenantId: string;
  companyId: string;
  role: string;
  canWrite: boolean;
};

export async function resolveResidentialTenant(): Promise<ResidentialTenantContext> {
  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError || !auth.user) {
    throw new Error("يجب تسجيل الدخول أولًا.");
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("tenant_memberships")
    .select("tenant_id, role, active")
    .eq("user_id", auth.user.id)
    .eq("active", true);

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  if (!memberships || memberships.length === 0) {
    throw new Error("حسابك غير مرتبط بمكتب عقاري نشط.");
  }

  if (memberships.length > 1) {
    throw new Error("حسابك مرتبط بأكثر من مكتب. يجب اختيار المكتب الحالي أولًا.");
  }

  const membership = memberships[0];

  const { data: tenant, error: tenantError } = await supabase
    .from("platform_tenants")
    .select("id, status")
    .eq("id", membership.tenant_id)
    .single();

  if (tenantError || !tenant || tenant.status !== "active") {
    throw new Error("المكتب غير نشط أو تعذر التحقق من بياناته.");
  }

  const { data: company, error: companyError } = await supabase
    .from("residential_companies")
    .select("id, active")
    .eq("tenant_id", membership.tenant_id)
    .maybeSingle();

  if (companyError || !company || !company.active) {
    throw new Error("لا توجد شركة سكنية مفعلة مرتبطة بهذا المكتب.");
  }

  return {
    tenantId: membership.tenant_id,
    companyId: company.id,
    role: membership.role,
    canWrite: ["owner", "admin", "manager"].includes(membership.role),
  };
}
