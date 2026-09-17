import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Login from "./pages/Login/Login";

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

function App() {
  const isDevMode =
    import.meta.env.VITE_DEV_MODE === "true";

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<MainLayout />}>
          <Route
            path="/"
            element={
              <Navigate
                to={isDevMode ? "/home" : "/login"}
                replace
              />
            }
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

          {/* تفاصيل الحركات المالية للعمارة */}
          <Route
            path="/buildings/financial-details"
            element={<FinancialDetails />}
          />

          {/* تفاصيل المستأجرين للعمارة */}
          <Route
            path="/buildings/tenant-details"
            element={<TenantDetails />}
          />

          {/* تفاصيل العمارة */}
          <Route
            path="/buildings/:id"
            element={<BuildingDetails />}
          />

          {/* المركز المالي */}
          <Route
            path="/financial"
            element={<FinancialCenter />}
          />
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to={isDevMode ? "/home" : "/login"}
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
