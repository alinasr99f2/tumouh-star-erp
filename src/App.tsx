import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
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
import FinancialDetails from "./pages/Buildings/FinancialDetails";
import TenantDetails from "./pages/Buildings/TenantDetails";
import FinancialCenter from "./pages/FinancialCenter/FinancialCenter";

function ProtectedRoute() {
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setHasSession(!!session);
      setSessionReady(true);
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

  return <MainLayout />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* صفحة تسجيل الدخول متاحة بدون Session */}
        <Route path="/login" element={<Login />} />

        {/* جميع صفحات النظام محمية بتسجيل الدخول */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={<Navigate to="/home" replace />}
          />

          <Route path="/home" element={<Home />} />

          <Route
            path="/dashboard"
            element={<CompanyDashboard />}
          />

          <Route
            path="/projects"
            element={<Projects />}
          />

          {/* الرسوم البيانية للمشروع */}
          <Route
            path="/projects/:id/charts"
            element={<ProjectCharts />}
          />

          {/* الكميات المستخدمة للمشروع */}
          <Route
            path="/projects/:id/quantities"
            element={<ProjectQuantities />}
          />

          {/* تفاصيل المشروع */}
          <Route
            path="/projects/:id"
            element={<ProjectDetails />}
          />

          {/* مصاريف المشروع */}
          <Route
            path="/projects/:id/expenses"
            element={<ProjectExpenses />}
          />

          {/* العمائر */}
          <Route
            path="/buildings"
            element={<Buildings />}
          />

          {/* تفاصيل العمارة */}
          <Route
            path="/buildings/:id"
            element={<BuildingDetails />}
          />

          {/* صفحات فرعية للعمائر */}
          <Route
            path="/buildings/financial-details"
            element={<FinancialDetails />}
          />

          <Route
            path="/buildings/tenant-details"
            element={<TenantDetails />}
          />

          {/* المركز المالي */}
          <Route
            path="/financial"
            element={<FinancialCenter />}
          />

          {/* أي رابط غير معروف داخل النظام */}
          <Route
            path="*"
            element={<Navigate to="/home" replace />}
          />
        </Route>

        {/* أي رابط غير معروف وغير محمي */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
