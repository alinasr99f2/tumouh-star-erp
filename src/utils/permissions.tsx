import * as React from "react";
import { createContext, useContext, useMemo } from "react";
import { supabase } from "./supabase";
import {
  getActiveTenant,
  setActiveTenant,
} from "./tenantSession";
/**
 * =========================================================
 * مفاتيح الصلاحيات
 * =========================================================
 *
 * ملاحظة:
 * - الصلاحيات القديمة تم الإبقاء عليها للتوافق مع الكود الحالي.
 * - الصلاحيات الجديدة الخاصة بالعمائر أضيفت بشكل تفصيلي.
 * - مسؤول النظام يحصل تلقائيًا على جميع الصلاحيات.
 */

export type PermissionKey =
  // =======================================================
  // Dashboard
  // =======================================================
  | "dashboard_view"

  // =======================================================
  // Projects - الصلاحيات الحالية
  // =======================================================
  | "projects_view"
  | "projects_add"
  | "projects_edit"
  | "projects_delete"

  // =======================================================
  // Buildings - الصلاحيات العامة الحالية
  // =======================================================
  | "buildings_view"
  | "buildings_add"
  | "buildings_edit"
  | "buildings_delete"

  // =======================================================
  // Buildings - تفاصيل العمارة
  // =======================================================
  | "building_details_view"
  | "building_details_edit"

  // =======================================================
  // Apartments
  // =======================================================
  | "apartments_view"
  | "apartments_add"
  | "apartments_edit"
  | "apartments_delete"

  // =======================================================
  // Apartment Types - أنواع الشقق
  // =======================================================
  | "apartment_types_view"
  | "apartment_types_add"
  | "apartment_types_edit"
  | "apartment_types_delete"

  // =======================================================
  // Tenants - المستأجرين
  // =======================================================
  | "tenants_view"
  | "tenants_edit"

  // =======================================================
  // Contracts - العقود
  // =======================================================
  | "contracts_view"
  | "contracts_edit"

  // =======================================================
  // Rentals - الإيجارات
  // =======================================================
  | "rentals_view"
  | "rentals_add"
  | "rentals_edit"
  | "rentals_delete"

  // =======================================================
  // Invoices / Charges - الفواتير والمستحقات
  // =======================================================
  | "invoices_view"
  | "invoices_add"
  | "invoices_edit"
  | "invoices_delete"

  // =======================================================
  // Collections - التحصيلات
  // =======================================================
  | "collections_view"
  | "collections_add"
  | "collections_edit"
  | "collections_delete"

  // =======================================================
  // Apartment Map - خريطة الشقق
  // =======================================================
  | "apartment_map_view"
  | "apartment_map_edit"
  | "apartment_map_rent_edit"
  | "apartment_map_type_edit"

  // =======================================================
  // Reports - التقارير
  // =======================================================
  | "reports_view"
  | "reports_print"
  | "reports_export"

  // =======================================================
  // Financial - المركز المالي / الصلاحيات الحالية
  // =======================================================
  | "financial_view"
  | "financial_add"
  | "financial_edit"
  | "financial_delete"
  | "expenses_view"
  | "expenses_add"
  | "expenses_edit"
  | "expenses_delete"
  | "accounts_view"
  | "accounts_add"
  | "accounts_edit"
  | "accounts_delete"
  | "funding_view"
  | "funding_add"
  | "funding_edit"
  | "funding_delete"
  | "financial_settings_view"
  | "financial_settings_add"
  | "financial_settings_edit"
  | "financial_settings_delete"
  | "suppliers_view"
  | "suppliers_add"
  | "suppliers_edit"
  | "suppliers_delete"

  // =======================================================
  // Users
  // =======================================================
  | "users_view"
  | "users_add"
  | "users_edit"
  | "users_delete"

  // =======================================================
  // Settings
  // =======================================================
  | "building_apartment_add"
  | "building_apartment_edit"
  | "building_apartment_delete"
  | "reports_add"
  | "reports_edit"
  | "reports_delete"
  | "settings_add"
  | "settings_edit"
  | "settings_delete"
  | "settings_view"
  | "activity_logs_view";


/**
 * خريطة الصلاحيات
 */
type PermissionsMap = Record<PermissionKey, boolean>;


/**
 * =========================================================
 * جميع الصلاحيات الموجودة بالنظام
 * =========================================================
 *
 * أي Permission جديد لازم يتضاف هنا أيضًا.
 * لأن هذه القائمة هي التي تحدد الصلاحيات التي يتم
 * تحميلها وتطبيعها من قاعدة البيانات.
 */
const ALL_PERMISSIONS: PermissionKey[] = [
  // Dashboard
  "dashboard_view",

  // Projects
  "projects_view",
  "projects_add",
  "projects_edit",
  "projects_delete",

  // Buildings
  "buildings_view",
  "buildings_add",
  "buildings_edit",
  "buildings_delete",

  // Building Details
  "building_details_view",
  "building_details_edit",

  // Apartments
  "apartments_view",
  "apartments_add",
  "apartments_edit",
  "apartments_delete",

  // Apartment Types
  "apartment_types_view",
  "apartment_types_add",
  "apartment_types_edit",
  "apartment_types_delete",

  // Tenants
  "tenants_view",
  "tenants_edit",

  // Contracts
  "contracts_view",
  "contracts_edit",

  // Rentals
  "rentals_view",
  "rentals_add",
  "rentals_edit",
  "rentals_delete",

  // Invoices / Charges
  "invoices_view",
  "invoices_add",
  "invoices_edit",
  "invoices_delete",

  // Collections
  "collections_view",
  "collections_add",
  "collections_edit",
  "collections_delete",

  // Apartment Map
  "apartment_map_view",
  "apartment_map_edit",
  "apartment_map_rent_edit",
  "apartment_map_type_edit",

  // Reports
  "reports_view",
  "reports_print",
  "reports_export",

  // Financial
  "financial_view",
  "financial_add",
  "financial_edit",
  "financial_delete",
  "expenses_view",
  "expenses_add",
  "expenses_edit",
  "expenses_delete",
  "accounts_view",
  "accounts_add",
  "accounts_edit",
  "accounts_delete",
  "funding_view",
  "funding_add",
  "funding_edit",
  "funding_delete",
  "financial_settings_view",
  "financial_settings_add",
  "financial_settings_edit",
  "financial_settings_delete",
  "suppliers_view",
  "suppliers_add",
  "suppliers_edit",
  "suppliers_delete",

  // Users
  "users_view",
  "users_add",
  "users_edit",
  "users_delete",

  // Additional permissions exposed in UsersPermissions
  "building_apartment_add",
  "building_apartment_edit",
  "building_apartment_delete",
  "reports_add",
  "reports_edit",
  "reports_delete",
  "settings_add",
  "settings_edit",
  "settings_delete",

  // Settings
  "settings_view",
  "activity_logs_view",
];


/**
 * صلاحيات فارغة
 */
const emptyPermissions: PermissionsMap = ALL_PERMISSIONS.reduce(
  (result, permission) => {
    result[permission] = false;
    return result;
  },
  {} as PermissionsMap
);


/**
 * =========================================================
 * Context
 * =========================================================
 */
type PermissionsContextValue = {
  permissions: PermissionsMap;

  loading: boolean;

  can: (permission: PermissionKey) => boolean;

  hasPermission: (permission: PermissionKey) => boolean;

  canAny: (...permissions: PermissionKey[]) => boolean;

  canAll: (...permissions: PermissionKey[]) => boolean;

  isSystemOwner: boolean;

  refreshPermissions: () => Promise<void>;
  activeTenantId: string | null;
  availableTenants: { tenantId: string; role: string }[];
  selectTenant: (tenantId: string) => Promise<void>;
  tenantError: string | null;
};


const PermissionsContext =
  createContext<PermissionsContextValue | null>(null);


/**
 * =========================================================
 * Permissions Provider
 * =========================================================
 */
export function PermissionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [permissions, setPermissions] =
    React.useState<PermissionsMap>(emptyPermissions);

  const [loading, setLoading] =
    React.useState(true);

  const [isSystemOwner, setIsSystemOwner] =
    React.useState(false);

  const [activeTenantId, setActiveTenantId] = React.useState<string | null>(null);
  const [availableTenants, setAvailableTenants] = React.useState<{ tenantId: string; role: string }[]>([]);
  const [tenantError, setTenantError] = React.useState<string | null>(null);
  const requestVersion = React.useRef(0);
  // Avoid reloading permissions for a token refresh / tab focus SIGNED_IN event.
  const verifiedAuthUserId = React.useRef<string | null>(null);

  // Read all active company memberships from the authenticated, tenant-scoped RPC.
  // Do not derive the switcher list from the currently selected company.
  const loadCompanyMemberships = async (): Promise<{ tenantId: string; role: string }[]> => {
    const { data, error } = await supabase.rpc("get_my_active_tenant_memberships");
    if (error) throw new Error(`تعذر تحميل الشركات المتاحة: ${error.message}`);
    const memberships = (data ?? []) as Array<{ tenant_id: string; role: string }>;
    const unique = new Map<string, { tenantId: string; role: string }>();
    for (const item of memberships) {
      if (item.tenant_id) unique.set(item.tenant_id, { tenantId: item.tenant_id, role: item.role });
    }
    if (import.meta.env.DEV) console.info("[AQARY staging] Switchable companies:", unique.size);
    return [...unique.values()];
  };

  const loadPermissions = async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    try {
      if (import.meta.env.DEV && import.meta.env.VITE_DEV_MODE === "true") {
        setPermissions(ALL_PERMISSIONS.reduce((out, code) => { out[code] = true; return out; }, {} as PermissionsMap));
        setIsSystemOwner(true);
        setTenantError('وضع المعاينة لا يتيح اختبار عزل بيانات Supabase.');
        return;
      }
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.info("AQARY AUTH CONTEXT", {
        configuredProject: (() => { try { return new URL(import.meta.env.VITE_SUPABASE_URL).hostname; } catch { return "invalid URL"; } })(),
        hasSession: Boolean(session),
        sessionUserId: session?.user?.id ?? null,
        authenticatedUserId: user?.id ?? null,
        userMatchesSession: Boolean(session && user && session.user.id === user.id),
        authError: authError?.message ?? null,
      });
      if (authError) throw authError;
      if (!user) {
        verifiedAuthUserId.current = null;
        setPermissions(emptyPermissions);
        setActiveTenantId(null);
        setAvailableTenants([]);
        setIsSystemOwner(false);
        return;
      }
      verifiedAuthUserId.current = user.id;
      const { data: platformOwner, error: ownerError } = await supabase.rpc('is_my_platform_system_owner');
      // Platform-owner status is separate from tenant permissions.
      // A failure in this optional check must not block valid tenant permissions.
      if (ownerError) console.warn("Platform owner check failed:", ownerError.message);
      // Platform owner is verified by a server-side RPC, never by email or local state.
      // Tenant data access remains subject to database RLS.
      if (!ownerError && platformOwner === true) {
        setIsSystemOwner(true);
        setPermissions(ALL_PERMISSIONS.reduce((out, code) => {
          out[code] = true;
          return out;
        }, {} as PermissionsMap));
        // A platform owner may open the platform even without a selected tenant.
        // Tenant-specific data requests still require a valid tenant and server authorization.
        try {
          const { data: directory, error: directoryError } = await supabase.rpc("get_my_tenant_directory");
          if (directoryError) throw new Error(`تعذر تحميل دليل شركات المنصة: ${directoryError.message}`);
          const ownerCompanies = [...new Set(
            ((directory ?? []) as Array<{ tenant_id: string; tenant_name: string }>).map(item => item.tenant_id).filter(Boolean)
          )].map(tenantId => ({ tenantId, role: "platform_owner" }));
          const ownerActive = await getActiveTenant();
          if (version !== requestVersion.current) return;
          setAvailableTenants(ownerCompanies);
          setActiveTenantId(ownerActive && ownerCompanies.some(t => t.tenantId === ownerActive.tenantId) ? ownerActive.tenantId : ownerCompanies[0]?.tenantId ?? null);
        } catch (membershipError) {
          if (version !== requestVersion.current) return;
          console.warn('Platform owner tenant listing unavailable:', membershipError);
          setAvailableTenants([]);
          setActiveTenantId(null);
        }
        setTenantError(null);
        return;
      }
      const memberships = await loadCompanyMemberships();
      const active = await getActiveTenant();
      if (version !== requestVersion.current) return;
      setAvailableTenants(memberships);
      setActiveTenantId(active?.tenantId ?? null);
      setIsSystemOwner(!ownerError && platformOwner === true);

      if (!active) {
        setPermissions(emptyPermissions);
        setTenantError(memberships.length > 0 ? 'اختر الشركة الحالية لعرض صلاحياتها وبياناتها.' : 'لا توجد شركة نشطة مرتبطة بالحساب.');
        return;
      }
      // Fetch permissions through a narrowly scoped server-side function.
      // The function validates auth.uid(), active membership and tenant ID.
      // It does not depend on client-side nested RLS joins.
      const { data: permissionRows, error: permissionError } = await supabase.rpc(
        "get_my_tenant_permission_codes",
        { p_tenant_id: active.tenantId }
      );
      // Diagnostic only: do not print session tokens or API keys.
      console.info("AQARY STAGING PERMISSIONS", {
        tenantId: active.tenantId,
        userId: user.id,
        count: permissionRows?.length ?? 0,
        codes: (permissionRows ?? []).map((row: { code?: string }) => row.code),
        error: permissionError?.message ?? null,
        errorCode: permissionError?.code ?? null,
      });
      if (permissionError) throw permissionError;
      if (version !== requestVersion.current) return;

      const codes = new Set<string>(
        (permissionRows ?? [])
          .map((row: { code?: string }) => row.code)
          .filter((code: unknown): code is string => typeof code === "string")
      );
      // Zero assigned permissions is valid: keep all permissions disabled.
      // Do not convert an empty permission set into a loading error.
      const normalized = ALL_PERMISSIONS.reduce((out, code) => {
        out[code] = codes.has(code);
        return out;
      }, {} as PermissionsMap);
      // Backward-compatible route key, derived only from tenant-scoped permissions.
      normalized.financial_view = normalized.financial_view || normalized.accounts_view || normalized.expenses_view || normalized.funding_view;
      normalized.financial_add = normalized.financial_add || normalized.accounts_add || normalized.expenses_add || normalized.funding_add;
      normalized.financial_edit = normalized.financial_edit || normalized.accounts_edit || normalized.expenses_edit || normalized.funding_edit;
      normalized.financial_delete = normalized.financial_delete || normalized.accounts_delete || normalized.expenses_delete || normalized.funding_delete;
      setPermissions(normalized);
      setTenantError(null);
    } catch (err) {
      if (version !== requestVersion.current) return;
      setPermissions(emptyPermissions);
      setTenantError(err instanceof Error ? err.message : 'تعذر تحميل صلاحيات الشركة');
      console.error('Tenant permissions:', err);
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  };

  const selectTenant = async (tenantId: string) => {
    if (!availableTenants.some(t => t.tenantId === tenantId)) throw new Error('الشركة غير مصرح بها');
    setPermissions(emptyPermissions);
    setLoading(true);
    setTenantError(null);
    await setActiveTenant(tenantId); // event reloads tenant-scoped permissions
  };

  React.useEffect(() => {
    void loadPermissions();
    const onTenantChange = () => { void loadPermissions(); };
    window.addEventListener('aqary:tenant-changed', onTenantChange);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        verifiedAuthUserId.current = null;
        requestVersion.current++;
        setPermissions(emptyPermissions);
        setActiveTenantId(null);
        setAvailableTenants([]);
        setIsSystemOwner(false);
      } else if (event === 'SIGNED_IN') {
        // Supabase may emit SIGNED_IN again on refocus for the same account.
        // A genuinely different account must reload its own permissions.
        const nextUserId = session?.user?.id ?? null;
        if (nextUserId && verifiedAuthUserId.current && nextUserId !== verifiedAuthUserId.current) {
          requestVersion.current++;
          setPermissions(emptyPermissions);
          setActiveTenantId(null);
          setIsSystemOwner(false);
          verifiedAuthUserId.current = null;
          void loadPermissions();
        }
      } else if (event === 'USER_UPDATED') {
        void loadPermissions();
      }
    });
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('aqary:tenant-changed', onTenantChange);

    };
  }, []);

  /**
   * =========================================================
   * Context Value
   * =========================================================
   */
  const value =
    useMemo<PermissionsContextValue>(
      () => ({
        permissions,

        loading,

        isSystemOwner,
        activeTenantId, availableTenants, selectTenant, tenantError,


        /**
         * فحص صلاحية واحدة
         */
        hasPermission: (permission) =>
          isSystemOwner || (Boolean(activeTenantId) && permissions[permission] === true),


        /**
         * alias لنفس الفحص
         */
        can: (permission) =>
          isSystemOwner || (Boolean(activeTenantId) && permissions[permission] === true),


        /**
         * المستخدم يحتاج واحدة على الأقل
         */
        canAny: (...requiredPermissions) =>
          isSystemOwner || (Boolean(activeTenantId) && requiredPermissions.some(
            (permission) =>
              permissions[permission] === true
          )),


        /**
         * المستخدم يحتاج جميع الصلاحيات
         */
        canAll: (...requiredPermissions) =>
          isSystemOwner || (Boolean(activeTenantId) && requiredPermissions.every(
            (permission) =>
              permissions[permission] === true
          )),


        /**
         * إعادة تحميل الصلاحيات
         */
        refreshPermissions: loadPermissions,
      }),

      [
        permissions,
        loading,
        isSystemOwner, activeTenantId, availableTenants, tenantError,
      ]
    );


  return (
    <PermissionsContext.Provider value={value}>
      {(!loading && !activeTenantId && !isSystemOwner && !(import.meta.env.DEV && import.meta.env.VITE_DEV_MODE === "true")) ? (
        <div dir="rtl" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: 32, background: '#063b2f', color: '#fff' }}>
          <div style={{ textAlign: 'center', maxWidth: 520 }}>
            <h2>اختيار الشركة الحالية</h2>
            <p>{tenantError ?? 'اختر الشركة التي تريد العمل على بياناتها.'}</p>
            {availableTenants.length > 0 && <select aria-label="اختر الشركة الحالية" value="" onChange={e => { void selectTenant(e.target.value).catch(err => setTenantError(String(err))); }} style={{ padding: 12, minWidth: 280, borderRadius: 10, color: '#103e32' }}>
              <option value="" disabled>اختر الشركة</option>
              {availableTenants.map(t => <option key={t.tenantId} value={t.tenantId}>{`شركة ${t.tenantId.slice(0, 8)} — ${t.role}`}</option>)}
            </select>}
            <div style={{ marginTop: 16 }}><button type="button" onClick={() => { void loadPermissions(); }} style={{ padding: '9px 20px', borderRadius: 8 }}>إعادة المحاولة</button></div>
          </div>
        </div>
      ) : <React.Fragment key={activeTenantId ?? "no-tenant"}>{children}</React.Fragment>}
    </PermissionsContext.Provider>
  );
}


/**
 * =========================================================
 * Hook
 * =========================================================
 */
export function usePermissions() {
  const context =
    useContext(PermissionsContext);


  if (!context) {
    throw new Error(
      "usePermissions يجب استخدامه داخل PermissionsProvider"
    );
  }


  return context;
}