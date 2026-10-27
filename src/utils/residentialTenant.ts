
import { supabase } from "./supabase";
import { getActiveTenant } from "./tenantSession";

export type ResidentialTenantContext = {
  tenantId: string;
  companyId: string;
  role: string;
  canWrite: boolean;
};

export async function resolveResidentialTenant(): Promise<ResidentialTenantContext> {
  const membership = await getActiveTenant();
  if (!membership) throw new Error("اختر المكتب الحالي أولًا من قائمة الشركات.");

  const { data: tenant, error: tenantError } = await supabase
    .from("platform_tenants")
    .select("id, status")
    .eq("id", membership.tenantId)
    .single();

  if (tenantError || !tenant || tenant.status !== "active") {
    throw new Error("المكتب غير نشط أو تعذر التحقق من بياناته.");
  }

  const { data: company, error: companyError } = await supabase
    .from("residential_companies")
    .select("id, active")
    .eq("tenant_id", membership.tenantId)
    .maybeSingle();

  if (companyError || !company || !company.active) {
    throw new Error("لا توجد شركة سكنية مفعلة مرتبطة بهذا المكتب.");
  }

  return {
    tenantId: membership.tenantId,
    companyId: company.id,
    role: membership.role,
    canWrite: ["owner", "admin", "manager"].includes(membership.role),
  };
}
