
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
  if (!membership) throw new Error("لا توجد شركة حالية محددة لهذا الحساب. مسؤول المنصة يحتاج اختيار شركة للعمل عليها، مع عضوية أو وصول معتمد لها؛ لا يتم اختيار شركة تلقائيًا.");

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

  if (companyError) {
    throw new Error(`تعذر قراءة ربط الشركة السكنية: ${companyError.message}`);
  }
  if (!company) {
    throw new Error("الشركة الحالية ليس لها سجل مرتبط في residential_companies. يلزم إنشاء الربط للشركة المحددة في Staging.");
  }
  if (!company.active) {
    throw new Error("السجل السكني للشركة الحالية غير مفعّل.");
  }

  return {
    tenantId: membership.tenantId,
    companyId: company.id,
    role: membership.role,
    canWrite: ["owner", "admin", "manager"].includes(membership.role),
  };
}
