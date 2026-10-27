import { supabase } from './supabase';

export type ActiveTenant = { tenantId: string; role: string };
const key = (userId: string) => `aqary_active_tenant_${userId}`;

/** The selection is a UI scope only. RLS must authorize every request. */
export async function getTenantMemberships(): Promise<ActiveTenant[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('يجب تسجيل الدخول أولًا');
  const { data, error } = await supabase.from('tenant_memberships')
    .select('tenant_id,role,active,platform_tenants!inner(status)')
    .eq('user_id', user.id).eq('active', true).eq('platform_tenants.status', 'active');
  if (error) throw new Error(`تعذر تحميل عضويات الشركات: ${error.message}`);
  return (data ?? []).map((m: any) => ({ tenantId: m.tenant_id, role: m.role }));
}

export async function getActiveTenant(): Promise<ActiveTenant | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const memberships = await getTenantMemberships();
  const selected = sessionStorage.getItem(key(user.id));
  const matching = memberships.find(m => m.tenantId === selected);
  if (matching) return matching;
  if (memberships.length === 1) {
    sessionStorage.setItem(key(user.id), memberships[0].tenantId);
    return memberships[0];
  }
  // Never guess when the same user belongs to multiple tenants.
  return null;
}

export async function setActiveTenant(tenantId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('يجب تسجيل الدخول أولًا');
  const memberships = await getTenantMemberships();
  if (!memberships.some(m => m.tenantId === tenantId)) throw new Error('الشركة غير مصرح بها');
  sessionStorage.setItem(key(user.id), tenantId);
  window.dispatchEvent(new Event('aqary:tenant-changed'));
}

export async function clearActiveTenant(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) sessionStorage.removeItem(key(user.id));
  window.dispatchEvent(new Event('aqary:tenant-changed'));
}
