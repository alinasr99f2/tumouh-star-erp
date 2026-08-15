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
import FinancialCenter from "./pages/FinancialCenter/FinancialCenter";

function App() {
  const isDevMode =
    import.meta.env.VITE_DEV_MODE === "true";

  return (
    <BrowserRouter>

      <Routes>

        {/* =========================
            تسجيل الدخول
        ========================= */}
        <Route
          path="/login"
          element={<Login />}
        />


        {/* =========================
            النظام الرئيسي
        ========================= */}
        <Route element={<MainLayout />}>

          {/* فتح الموقع لأول مرة */}
          <Route
            path="/"
            element={
              <Navigate
                to={isDevMode ? "/home" : "/login"}
                replace
              />
            }
          />


          {/* الشاشة الرئيسية */}
          <Route
            path="/home"
            element={<Home />}
          />


          {/* لوحة التحكم */}
          <Route
            path="/dashboard"
            element={<CompanyDashboard />}
          />


          {/* المشاريع */}
          <Route
            path="/projects"
            element={<Projects />}
          />


          {/* تفاصيل المشروع */}
          <Route
            path="/projects/:id"
            element={<ProjectDetails />}
          />

          {/* مصروفات المشروع */}
<Route
  path="/projects/:id/expenses"
  element={<ProjectExpenses />}
/>


          {/* المركز المالي */}
          <Route
            path="/financial"
            element={<FinancialCenter />}
          />

        </Route>


        {/* أي رابط غير معروف */}
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