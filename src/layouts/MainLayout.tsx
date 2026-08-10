import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import Topbar from "../components/topbar/Topbar";

function MainLayout() {
  return (
    <div className="flex flex-row h-full">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Navigation */}
        <Topbar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#071321] p-6">

          <div className="mx-auto h-full max-w-[1700px]">
            <Outlet />
          </div>

        </main>

      </div>

    </div>
  );
}

export default MainLayout;