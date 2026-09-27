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

function ProtectedRoute() {
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!mounted) return;
        setHasSession(!!user);
      } catch (error) {
        console.error("خطأ أثناء التحقق من تسجيل الدخول:", error);
        if (!mounted) return;
        setHasSession(false);
      } finally {
        if (mounted) setSessionReady(true);
      }
    };

    void checkSession();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        setHasSession(!!session);
        setSessionReady(true);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!sessionReady) return null;
  if (!hasSession) return <Navigate to="/login" replace />;

  return <Outlet />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/dashboard" element={<CompanyDashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id/charts" element={<ProjectCharts />} />
            <Route path="/projects/:id/quantities" element={<ProjectQuantities />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/projects/:id/expenses" element={<ProjectExpenses />} />
            <Route path="/buildings" element={<Buildings />} />
            <Route path="/buildings/:id/apartments" element={<ApartmentMap />} />
            <Route path="/buildings/:id" element={<BuildingDetails />} />
            <Route path="/buildings/financial-details" element={<FinancialDetails />} />
            <Route path="/buildings/tenant-details" element={<TenantDetails />} />
            <Route path="/financial" element={<FinancialCenter />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
