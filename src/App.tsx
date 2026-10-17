import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
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
import ProjectDetails from "./pages/Projects/ProjectDetails";
import ProjectExpenses from "./pages/Projects/ProjectExpenses";
import ProjectQuantities from "./pages/Projects/ProjectQuantities";
import ProjectCharts from "./pages/Projects/ProjectCharts";

import Buildings from "./pages/Buildings/Buildings";
import BuildingDetails from "./pages/Buildings/BuildingDetails";
import ApartmentMap from "./pages/Buildings/ApartmentMap";
import FinancialDetails from "./pages/Buildings/FinancialDetails";
import TenantDetails from "./pages/Buildings/TenantDetails";

import FinancialCenter from "./pages/FinancialCenter/FinancialCenter";

import ContactUs from "./pages/Contact/ContactUs";
import Apartments from "./pages/Apartments/Apartments";
import ApartmentsHub from "./pages/Apartments/ApartmentsHub";
import ActivityLog from "./pages/ActivityLog/ActivityLog";
function ProtectedRoute() {
  const DEV_MODE = import.meta.env.DEV && import.meta.env.VITE_DEV_MODE === "true";
  const [sessionReady, setSessionReady] = useState(DEV_MODE);
  const [hasSession, setHasSession] = useState(DEV_MODE);

  useEffect(() => {
    if (DEV_MODE) return;
    let mounted = true;
    let closing = false;
    const check = async () => {
      if (closing) return;
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!mounted) return;
      if (error || !user) {
        setHasSession(false);
        setSessionReady(true);
        return;
      }
      const reason = sessionExpiryReason(user.id);
      if (reason) {
        closing = true;
        setHasSession(false);
        setSessionReady(true);
        try { await endManagedSession(reason); }
        catch (err) { console.error("تعذر إنهاء الجلسة:", err); }
        finally { if (mounted) window.location.replace("/login"); }
        return;
      }
      setHasSession(true);
      setSessionReady(true);
    };
    const onActivity = () => {
      // Check expiry BEFORE accepting activity so an expired session cannot revive.
      void check();
      // Only update last activity if the stored session is still valid.
      const id = sessionStorage.getItem("aqary_session_user_v1");
      if (id && !sessionExpiryReason(id)) recordActivity();
    };
    const onWake = () => { void check(); };
    const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
    events.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
    window.addEventListener("focus", onWake);
    document.addEventListener("visibilitychange", onWake);
    const timer = window.setInterval(() => { void check(); }, 15000);
    void check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === "SIGNED_OUT") {
        setHasSession(false);
        setSessionReady(true);
      }
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.clearInterval(timer);
      events.forEach((event) => window.removeEventListener(event, onActivity));
      window.removeEventListener("focus", onWake);
      document.removeEventListener("visibilitychange", onWake);
    };
  }, []);

  if (!sessionReady) return null;
  if (!hasSession) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function PermissionRoute({
  permission,
}: {
  permission: PermissionKey;
}) {
  const { loading, hasPermission } = usePermissions();

  const [showDenied, setShowDenied] = useState(false);

  const handleClose = useCallback(() => {
    setShowDenied(false);
    window.location.replace("/home");
  }, []);

  useEffect(() => {
    if (!loading && !hasPermission(permission)) {
      setShowDenied(true);
    }
  }, [loading, permission, hasPermission]);

  if (loading) {
    return null;
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
              <Route path="/projects/:id/charts" element={<ProjectCharts />} />
            </Route>

<Route element={<PermissionRoute permission="projects_view" />}>
              <Route path="/projects/:id/quantities" element={<ProjectQuantities />} />
            </Route>

<Route element={<PermissionRoute permission="projects_view" />}>
              <Route path="/projects/:id/expenses" element={<ProjectExpenses />} />
            </Route>

<Route element={<PermissionRoute permission="projects_view" />}>
              <Route path="/projects/:id" element={<ProjectDetails />} />
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