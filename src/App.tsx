import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useEffect, useState } from "react";

import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login/Login";
import { supabase } from "./utils/supabase";

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

import UsersPermissions from "./pages/Users/UsersPermissions";
import ContactUs from "./pages/Contact/ContactUs";
import Apartments from "./pages/Apartments/Apartments";

function ProtectedRoute() {

  const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

  const [sessionReady, setSessionReady] = useState(DEV_MODE);
  const [hasSession, setHasSession] = useState(DEV_MODE);

  useEffect(() => {

    // تشغيل النظام بدون تسجيل دخول على جهاز العمل
    if (DEV_MODE) {
      setHasSession(true);
      setSessionReady(true);
      return;
    }
    let mounted = true;

    const checkSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        setHasSession(!!user);
      } catch (error) {
        console.error("خطأ أثناء التحقق من تسجيل الدخول:", error);

        if (!mounted) return;

        setHasSession(false);
      } finally {
        if (mounted) {
          setSessionReady(true);
        }
      }
    };

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setHasSession(!!session);
      setSessionReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!sessionReady) {
    return null;
  }

  if (!hasSession) {
    return <Navigate to="/login" replace />;
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
            <Route
              path="/dashboard"
              element={<CompanyDashboard />}
            />


            {/* =========================================
                المشاريع
            ========================================= */}
            <Route
  path="/projects"
  element={<Projects />}
/>

<Route
  path="/projects/financial"
  element={<FinancialCenter />}
/>

<Route
  path="/projects/:id/charts"
  element={<ProjectCharts />}
/>

<Route
  path="/projects/:id/quantities"
  element={<ProjectQuantities />}
/>

<Route
  path="/projects/:id/expenses"
  element={<ProjectExpenses />}
/>

<Route
  path="/projects/:id"
  element={<ProjectDetails />}
/>

            {/* =========================================
                العمائر
            ========================================= */}
            <Route
              path="/buildings"
              element={<Buildings />}
            />

            {/* الصفحات الثابتة للعمائر يجب أن تسبق :id */}
            <Route
              path="/buildings/financial-details"
              element={<FinancialDetails />}
            />

            <Route
              path="/buildings/tenant-details"
              element={<TenantDetails />}
            />

            {/* خريطة الشقق */}
            <Route
              path="/buildings/:id/apartments"
              element={<ApartmentMap />}
            />

            {/* تفاصيل العمارة */}
            <Route
              path="/buildings/:id"
              element={<BuildingDetails />}
            />


            {/* =========================================
                المركز المالي
            ========================================= */}
            <Route
  path="/projects/financial"
  element={<FinancialCenter />}
/>

{/* الرابط القديم يتحول تلقائياً للمركز المالي الخاص بالمشاريع */}
<Route
  path="/financial"
  element={<Navigate to="/projects/financial" replace />}
/>


            {/* =========================================
                الشقق المتاحة / المؤجرة
            ========================================= */}
           <Route
  path="/apartments"
  element={<Apartments />}
/>


            {/* =========================================
                المستخدمين والصلاحيات
            ========================================= */}
            <Route
              path="/users-permissions"
              element={<UsersPermissions />}
            />


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