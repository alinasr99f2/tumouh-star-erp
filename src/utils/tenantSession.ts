import { supabase } from "./supabase";

export type ActiveTenant = { tenantId: string; role: string };
const key = (userId: string) => `aqary_active_tenant_${userId}`;

/** UI selection only. Database RLS and server RPCs must independently enforce access. */
export async function getTenantMemberships(): Promise<ActiveTenant[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("يجب تسجيل الدخول أولًا");
  const { data, error } = await supabase.rpc("get_my_active_tenant_memberships");
  if (error) throw new Error(`تعذر تحميل عضويات الشركات: ${error.message}`);
  return ((data ?? []) as Array<{ tenant_id: string; role: string }>).filter(m => m.tenant_id).map(m => ({ tenantId: m.tenant_id, role: m.role }));
}

/** The owner can select any company exposed by the server-authorized directory. */
async function getSelectableTenants(): Promise<ActiveTenant[]> {
  const { data: owner, error: ownerError } = await supabase.rpc("is_my_platform_system_owner");
  if (ownerError) throw new Error(`تعذر التحقق من مسؤول المنصة: ${ownerError.message}`);
  if (owner === true) {
    const { data, error } = await supabase.rpc("get_my_tenant_directory");
    if (error) throw new Error(`تعذر تحميل دليل الشركات: ${error.message}`);
    return ((data ?? []) as Array<{ tenant_id: string; tenant_name: string }>).filter(t => t.tenant_id).map(t => ({ tenantId: t.tenant_id, role: "platform_owner" }));
  }
  return getTenantMemberships();
}

export async function getActiveTenant(): Promise<ActiveTenant | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const tenants = await getSelectableTenants();
  const selected = sessionStorage.getItem(key(user.id));
  const matching = tenants.find(t => t.tenantId === selected);
  if (matching) return matching;
  if (tenants.length) {
    sessionStorage.setItem(key(user.id), tenants[0].tenantId);
    return tenants[0];
  }
  sessionStorage.removeItem(key(user.id));
  return null;
}

export async function setActiveTenant(tenantId: string): Promise<void> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("يجب تسجيل الدخول أولًا");
  const allowed = await getSelectableTenants();
  if (!allowed.some(t => t.tenantId === tenantId)) throw new Error("الشركة غير مصرح بها");
  sessionStorage.setItem(key(user.id), tenantId);
  window.dispatchEvent(new Event("aqary:tenant-changed"));
}

export async function clearActiveTenant(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) sessionStorage.removeItem(key(user.id));
  window.dispatchEvent(new Event("aqary:tenant-changed"));
}
