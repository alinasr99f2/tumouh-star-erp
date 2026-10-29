import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { useEffect,useCallback, useState } from "react";
import PermissionDeniedModal from "./components/PermissionDeniedModal";

import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login/Login";
import { supabase } from "./utils/supabase";
import { sessionExpiryReason, recordActivity, endManagedSession } from "./utils/sessionGuard";
import { PermissionsProvider, usePermissions, type PermissionKey } from "./utils/permissions";
import Home from "./pages/Home/Home";
import CompanyDashboard from "./pages/Dashboard/CompanyDashboard";

import Projects from "./pages/Projects/Projects";





import Buildings from "./pages/Buildings/Buildings";
import BuildingDetails from "./pages/Buildings/BuildingDetails";
import ApartmentMap from "./pages/Buildings/ApartmentMap";
import FinancialDetails from "./pages/Buildings/FinancialDetails";
import TenantDetails from "./pages/Buildings/TenantDetails";

import FinancialCenter from "./pages/FinancialCenter/FinancialCenter";

import ContactUs from "./pages/Contact/ContactUs";
import Apartments from "./pages/Apartments/Apartments";
import ResidentialApartmentMap from "./pages/Apartments/ResidentialApartmentMap";
import ApartmentsHub from "./pages/Apartments/ApartmentsHub";
import ActivityLog from "./pages/ActivityLog/ActivityLog";
function ProtectedRoute() {
  const DEV_MODE = import.meta.env.DEV && import.meta.env.VITE_DEV_MODE === "true";
  const [sessionReady, setSessionReady] = useState(DEV_MODE);
  const [hasSession, setHasSession] = useState(DEV_MODE);
  const [sessionError, setSessionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (DEV_MODE) return;
    let mounted = true;
    let closing = false;
    let checking = false;
    let checkedOnce = false;
    const timeout = window.setTimeout(() => {
      if (mounted && !checkedOnce && !closing) {
        setSessionError(true);
        setSessionReady(true);
      }
    }, 12000);

    const check = async () => {
      if (closing || checking) return;
      checking = true;
      try {
        // Read the local expiry first. This avoids refreshing activity or
        // unmounting the protected route before the audit RPC completes.
        const storedUserId = sessionStorage.getItem("aqary_session_user_v1");
        const localReason = storedUserId ? sessionExpiryReason(storedUserId) : null;
        if (localReason && localReason !== "missing") {
          closing = true;
          try {
            await endManagedSession(localReason);
          } catch (err) {
            console.error("تعذر إنهاء الجلسة:", err);
          } finally {
            if (mounted) window.location.replace("/login");
          }
          return;
        }

        const { data: { user }, error } = await supabase.auth.getUser();
        if (!mounted || closing) return;
        if (error) {
          // No saved auth session is normal before the user signs in.
          // Only actual connectivity/auth-service errors show the retry screen.
          const missingSession =
            error.name === "AuthSessionMissingError" ||
            (error.message || "").toLowerCase().includes("auth session missing");
          if (missingSession) {
            checkedOnce = true;
            window.clearTimeout(timeout);
            setSessionError(false);
            setHasSession(false);
            setSessionReady(true);
            return;
          }
          console.warn("تعذر التحقق من الجلسة مؤقتًا:", error);
          setSessionError(true);
          setSessionReady(true);
          return;
        }
        if (!user) {
          checkedOnce = true;
          window.clearTimeout(timeout);
          setSessionError(false);
          setHasSession(false);
          setSessionReady(true);
          return;
        }
        const reason = sessionExpiryReason(user.id);
        if (reason) {
          closing = true;
          try {
            await endManagedSession(reason);
          } catch (err) {
            console.error("تعذر إنهاء الجلسة:", err);
          } finally {
            if (mounted) window.location.replace("/login");
          }
          return;
        }
        checkedOnce = true;
        window.clearTimeout(timeout);
        setSessionError(false);
        setHasSession(true);
        setSessionReady(true);
      } catch (err) {
        console.error("تعذر فحص الجلسة:", err);
        if (mounted && !closing) {
          setSessionError(true);
          setSessionReady(true);
        }
      } finally {
        checking = false;
      }
    };

    const onActivity = () => {
      if (closing || !checkedOnce) return;
      const id = sessionStorage.getItem("aqary_session_user_v1");
      if (id && !sessionExpiryReason(id)) recordActivity();
      void check();
    };
    const onWake = () => { void check(); };
    const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
    events.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
    window.addEventListener("focus", onWake);
    document.addEventListener("visibilitychange", onWake);
    const timer = window.setInterval(() => { void check(); }, 15000);
    void check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted || closing) return;
      if (event === "SIGNED_OUT") {
        setHasSession(false);
        setSessionReady(true);
      }
    });
    return () => {
      mounted = false;
      window.clearTimeout(timeout);
      subscription.unsubscribe();
      window.clearInterval(timer);
      events.forEach((event) => window.removeEventListener(event, onActivity));
      window.removeEventListener("focus", onWake);
      document.removeEventListener("visibilitychange", onWake);
    };
  }, [retryCount]);

  if (!sessionReady) return <div dir="rtl" style={{ padding: 32, textAlign: "center" }}>جاري التحقق من الجلسة...</div>;
  if (sessionError) return (
    <div dir="rtl" style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#062f26", color: "#fff", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 460 }}>
        <h2>تعذر الاتصال بخدمة تسجيل الدخول</h2>
        <p>لم نتمكن من التحقق من الجلسة حاليًا. لم يتم تسجيل خروجك تلقائيًا أو تجاوز حماية النظام.</p>
        <button type="button" onClick={() => { setSessionReady(false); setSessionError(false); setRetryCount((n) => n + 1); }} style={{ background: "#d9b34c", color: "#062f26", border: 0, borderRadius: 10, padding: "12px 24px", cursor: "pointer", fontWeight: 700 }}>إعادة المحاولة</button>
      </div>
    </div>
  );
  if (!hasSession) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function PermissionRoute({
  permission,
}: {
  permission: PermissionKey;
}) {
  const { loading, hasPermission, activeTenantId, tenantError } = usePermissions();
  const navigate = useNavigate();

  const [showDenied, setShowDenied] = useState(false);

  const handleClose = useCallback(() => {
    setShowDenied(false);
    navigate("/home", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!loading && activeTenantId && !tenantError && !hasPermission(permission)) {
      setShowDenied(true);
    } else {
      setShowDenied(false);
    }
  }, [loading, permission, hasPermission, activeTenantId, tenantError]);

  if (loading || !activeTenantId) {
    return null;
  }

  if (tenantError) {
    return <div dir="rtl" style={{ padding: 32 }} role="alert">تعذر تحميل صلاحيات الشركة: {tenantError}</div>;
  }

  if (!hasPermission(permission)) {
    return (
      <>
        <PermissionDeniedModal
          open={showDenied}
          message="عذرًا، غير مسموح للمستخدم الحالي بعرض هذه الصفحة."
          onClose={handleClose}
        />
      </>
    );
  }

  return <Outlet />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================================
            تسجيل الدخول
        ========================================= */}
        <Route
          path="/login"
          element={<Login />}
        />


        <Route path="/reset-password" element={<Login />} />

        {/* =========================================
            حماية جميع صفحات النظام
        ========================================= */}
        <Route element={<ProtectedRoute />}>
          <Route element={<PermissionsProvider><Outlet /></PermissionsProvider>}>

          {/* =========================================
              الـ Main Layout
          ========================================= */}
          <Route element={<MainLayout />}>

            {/* الصفحة الرئيسية */}
            <Route
              path="/"
              element={<Navigate to="/home" replace />}
            />

            <Route
              path="/home"
              element={<Home />}
            />


            {/* =========================================
                لوحة التحكم
            ========================================= */}
            <Route element={<PermissionRoute permission="dashboard_view" />}>
              <Route
                path="/dashboard"
                element={<CompanyDashboard />}
              />
            </Route>


            {/* =========================================
                المشاريع
            ========================================= */}
            <Route element={<PermissionRoute permission="projects_view" />}>
              <Route path="/projects" element={<Projects />} />
            </Route>

<Route element={<PermissionRoute permission="projects_view" />}>
              <Route path="/projects/:id/charts" element={<Navigate to="/projects" replace />} />
            </Route>

<Route element={<PermissionRoute permission="projects_view" />}>
              <Route path="/projects/:id/quantities" element={<Navigate to="/projects" replace />} />
            </Route>

<Route element={<PermissionRoute permission="projects_view" />}>
              <Route path="/projects/:id/expenses" element={<Navigate to="/projects" replace />} />
            </Route>

<Route element={<PermissionRoute permission="projects_view" />}>
              <Route path="/projects/:id" element={<Navigate to="/projects" replace />} />
            </Route>

            {/* =========================================
                العمائر
            ========================================= */}
            <Route element={<PermissionRoute permission="buildings_view" />}>
              <Route path="/buildings" element={<Buildings />} />
            </Route>

            {/* الصفحات الثابتة للعمائر يجب أن تسبق :id */}
            <Route element={<PermissionRoute permission="buildings_view" />}>
              <Route path="/buildings/financial-details" element={<FinancialDetails />} />
            </Route>

            <Route element={<PermissionRoute permission="buildings_view" />}>
              <Route path="/buildings/tenant-details" element={<TenantDetails />} />
            </Route>

            {/* خريطة الشقق */}
            <Route element={<PermissionRoute permission="apartment_map_view" />}>
              <Route path="/buildings/:id/apartments" element={<ApartmentMap />} />
            </Route>

            {/* تفاصيل العمارة */}
            <Route element={<PermissionRoute permission="building_details_view" />}>
              <Route path="/buildings/:id" element={<BuildingDetails />} />
            </Route>


            {/* =========================================
                المركز المالي
            ========================================= */}
            <Route element={<PermissionRoute permission="financial_view" />}>
              <Route path="/projects/financial" element={<FinancialCenter />} />
            </Route>

{/* الرابط القديم يتحول تلقائياً للمركز المالي الخاص بالمشاريع */}
<Route
  path="/financial"
  element={<Navigate to="/projects/financial" replace />}
/>


            {/* =========================================
                الشقق المتاحة / المؤجرة
            ========================================= */}
            <Route element={<PermissionRoute permission="apartments_view" />}>
              <Route path="/apartments-hub" element={<ApartmentsHub />} />
              <Route path="/apartments" element={<Apartments />} />
              <Route path="/rooms" element={null} />
              <Route path="/apartments/map" element={<ResidentialApartmentMap />} />
            </Route>


           {/* =========================================
    المستخدمين والصلاحيات
========================================= */}
<Route element={<PermissionRoute permission="users_view" />}>
              <Route path="/users-permissions" element={null} />
            </Route>


{/* =========================================
    سجل النشاط
========================================= */}
<Route element={<PermissionRoute permission="activity_logs_view" />}>
  <Route path="/activity-log" element={<ActivityLog />} />
</Route>


            {/* =========================================
                تواصل معنا
            ========================================= */}
            <Route
              path="/contact-us"
              element={<ContactUs />}
            />


            {/* =========================================
                أي رابط غير معروف داخل النظام
            ========================================= */}
            <Route
              path="*"
              element={<Navigate to="/home" replace />}
            />

          </Route>
          </Route>
        </Route>


        {/* =========================================
            أي رابط غير معروف خارج النظام
        ========================================= */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}


export default App;