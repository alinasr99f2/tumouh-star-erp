import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import Sidebar from "../components/sidebar/Sidebar";
import Topbar from "../components/topbar/Topbar";
import { supabase } from "../utils/supabase";

function MainLayout() {
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          "خطأ أثناء تسجيل الخروج:",
          error
        );

        alert(
          "حدث خطأ أثناء تسجيل الخروج، حاول مرة أخرى"
        );

        return;
      }

      setShowLogoutModal(false);

      navigate("/login", {
        replace: true,
      });

    } catch (error) {
      console.error(
        "خطأ غير متوقع أثناء تسجيل الخروج:",
        error
      );

      alert(
        "حدث خطأ أثناء تسجيل الخروج، حاول مرة أخرى"
      );

    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      dir="rtl"
    >

      {/* Sidebar */}
      <Sidebar
        onLogout={() => setShowLogoutModal(true)}
      />

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


      {/* ==========================================
          LOGOUT CONFIRMATION MODAL
      ========================================== */}

      {showLogoutModal && (
        <div
          className="
            fixed
            inset-0
            z-[9999]
            flex
            items-center
            justify-center
            bg-black/60
            p-6
            backdrop-blur-md
          "
          onClick={() => {
            if (!loggingOut) {
              setShowLogoutModal(false);
            }
          }}
        >

          {/* Modal */}
          <div
            className="
              w-full
              max-w-md
              rounded-[28px]
              border
              border-white/10
              bg-[#081B33]
              p-8
              text-center
              shadow-2xl
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* Logout Icon */}
            <div
              className="
                mx-auto
                mb-5
                flex
                h-20
                w-20
                items-center
                justify-center
                rounded-3xl
                border
                border-red-400/20
                bg-red-500/10
                text-red-400
              "
            >
              <svg
                width="38"
                height="38"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />

                <path d="M16 17l5-5-5-5" />

                <path d="M21 12H9" />
              </svg>
            </div>


            {/* Title */}
            <h2
              className="
                text-2xl
                font-black
                text-white
              "
            >
              تسجيل الخروج
            </h2>


            {/* Message */}
            <p
              className="
                mt-3
                leading-7
                text-gray-400
              "
            >
              هل أنت متأكد من رغبتك في تسجيل الخروج؟
            </p>


            {/* Buttons */}
            <div
              className="
                mt-8
                grid
                grid-cols-2
                gap-4
              "
            >

              {/* Cancel */}
              <button
                type="button"
                disabled={loggingOut}
                onClick={() =>
                  setShowLogoutModal(false)
                }
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/5
                  px-5
                  py-3
                  font-bold
                  text-gray-300
                  transition-all
                  duration-300
                  hover:bg-white/10
                  hover:text-white
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                لا، إلغاء
              </button>


              {/* Confirm Logout */}
              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="
                  rounded-2xl
                  bg-red-500
                  px-5
                  py-3
                  font-bold
                  text-white
                  transition-all
                  duration-300
                  hover:bg-red-600
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {loggingOut
                  ? "جاري تسجيل الخروج..."
                  : "نعم، تسجيل الخروج"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default MainLayout;