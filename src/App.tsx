import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import CompanyDashboard from "./pages/Dashboard/CompanyDashboard";
import Projects from "./pages/Projects/Projects";
import ProjectDetails from "./pages/Projects/ProjectDetails";
import FinancialCenter from "./pages/FinancialCenter/FinancialCenter";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route element={<MainLayout />}>

          {/* لوحة التحكم */}
          <Route
            path="/"
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

          {/* المركز المالي */}
          <Route
            path="/financial"
            element={<FinancialCenter />}
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;