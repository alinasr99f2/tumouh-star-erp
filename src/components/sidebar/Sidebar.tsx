import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LogOut,
  Circle,
  ChevronDown,
} from "lucide-react";

import { sidebarMenu } from "../../data/menu";

type SidebarProps = {
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};
function Sidebar({
  onLogout,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const location = useLocation();
  const [openBuildings, setOpenBuildings] = useState(
    location.pathname.startsWith("/buildings")
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="إغلاق القائمة الجانبية"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
        />
      )}

    <aside
      className={`
        fixed
        inset-y-0
        right-0
        z-50
        w-[85vw]
        max-w-[300px]
        lg:relative
        lg:inset-auto
        lg:z-auto
        lg:w-[240px]
        xl:w-[270px]
        shrink-0
        h-screen
        flex
        flex-col
        bg-[#081B33]
        border-l
        border-white/10
        text-white
        transition-transform
        duration-300
        ease-in-out
        lg:translate-x-0
        ${mobileOpen ? "translate-x-0" : "translate-x-full"}
      `}
    >

      {/* Header */}
      <div className="px-4 sm:px-5 lg:px-6 pt-6 sm:pt-7 lg:pt-8 pb-5 sm:pb-6 border-b border-white/10">

        <div className="flex items-center gap-4">

          <div
            className="
              w-12 h-12 sm:w-14 sm:h-14 lg:w-16
              lg:h-16
              rounded-3xl
              bg-gradient-to-br
              from-yellow-300
              via-yellow-400
              to-yellow-500
              flex
              items-center
              justify-center
              shadow-xl
            "
          >

            <div
              className="
                w-10 h-10 sm:w-11 sm:h-11 lg:w-12
                lg:h-12
                rounded-2xl
                bg-black
                shadow-xl
                flex
                items-center
                justify-center
              "
            >

              <span className="text-yellow-400 text-xl sm:text-2xl font-black">
                ★
              </span>

            </div>

          </div>

          <div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-wide">
              Tumouh Star
            </h1>

            <p className="text-gray-400 text-xs sm:text-sm">
              ERP System
            </p>

          </div>

        </div>

      </div>


      {/* User */}
      <div className="px-3 sm:px-4 lg:px-5 pt-4 sm:pt-5">

        <div
          className="
            rounded-3xl
            bg-white/5
            border
            border-white/10
            backdrop-blur-md
            p-4 sm:p-5
          "
        >

          <div className="flex items-center gap-4">

            <div
              className="
                w-11 h-11 sm:w-12 sm:h-12 lg:w-14
                lg:h-14
                rounded-full
                bg-gradient-to-br
                from-yellow-400
                to-yellow-500
                flex
                items-center
                justify-center
                text-[#081B33]
                font-bold
                text-lg
                shadow-lg
              "
            >
              A
            </div>

            <div>

              <h3 className="font-bold">
                Ali Nasr
              </h3>

              <p className="text-gray-400 text-xs sm:text-sm">
                Supervisor
              </p>

            </div>

          </div>

          <div className="mt-3 sm:mt-4 flex items-center gap-2">

            <Circle
              size={10}
              fill="#22c55e"
              className="text-green-500"
            />

            <span className="text-green-400 text-sm">
              Online
            </span>

          </div>

        </div>

      </div>


      {/* Menu */}
      <div
        className="
          flex-1
          overflow-y-auto
          overflow-x-hidden
          mt-4 sm:mt-5 lg:mt-6
          px-3 sm:px-4
          pb-4 sm:pb-5
        "
      >

        <p className="text-xs text-gray-500 px-2 sm:px-3 mb-3 sm:mb-4 uppercase tracking-widest">
          MAIN MENU
        </p>

        <div className="space-y-1.5 sm:space-y-2">

          {sidebarMenu.map((item) => {

            const hasChildren =
              Array.isArray(item.children) &&
              item.children.length > 0;

            if (hasChildren) {
              const isBuildingsSection =
                item.path === "/buildings";

              const isChildActive =
                item.children?.some((child) =>
                  location.pathname.startsWith(child.path)
                ) ?? false;

              return (
                <div key={item.title} className="space-y-1">

                  <div className="flex items-center gap-1">

                    <NavLink
                      to={item.path}
                      end
                      onClick={onMobileClose}
                      className={({ isActive }) =>
                        `
                        group
                        relative
                        flex
                        flex-1
                        items-center
                        gap-3 sm:gap-4
                        rounded-2xl
                        px-3 sm:px-4
                        py-3 sm:py-3.5
                        transition-all
                        duration-300
                        ${
                          isActive || isChildActive
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-[#081B33] font-bold shadow-xl scale-[1.02]"
                            : "text-gray-200 hover:bg-white/5 hover:text-white hover:translate-x-1"
                        }
                      `
                      }
                    >

                      <item.icon
                        size={21}
                        className="
                          transition-transform
                          duration-300
                          group-hover:scale-110
                        "
                      />

                      <span className="flex-1">
                        {item.title}
                      </span>

                    </NavLink>

                    {isBuildingsSection && (
                      <button
                        type="button"
                        aria-label={
                          openBuildings
                            ? "إخفاء قائمة العمائر الفرعية"
                            : "إظهار قائمة العمائر الفرعية"
                        }
                        aria-expanded={openBuildings}
                        onClick={() =>
                          setOpenBuildings((current) => !current)
                        }
                        className="
                          flex
                          h-11
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-2xl
                          border
                          border-white/10
                          bg-white/5
                          text-gray-400
                          transition-all
                          duration-300
                          hover:bg-white/10
                          hover:text-white
                        "
                      >

                        <ChevronDown
                          size={18}
                          className={`
                            transition-transform
                            duration-300
                            ${
                              openBuildings
                                ? "rotate-180"
                                : ""
                            }
                          `}
                        />

                      </button>
                    )}

                  </div>

                  {isBuildingsSection &&
                    openBuildings && (
                      <div
                        className="
                          mr-5
                          space-y-1
                          border-r
                          border-white/10
                          pr-2
                        "
                      >

                        {item.children?.map((child) => (

                          <NavLink
                            key={child.title}
                            to={child.path}
                            className={({ isActive }) =>
                              `
                              group
                              flex
                              items-center
                              gap-2 sm:gap-3
                              rounded-xl
                              px-2.5 sm:px-3
                              py-2 sm:py-2.5
                              text-sm
                              transition-all
                              duration-300
                              ${
                                isActive
                                  ? "bg-yellow-400/15 text-yellow-400 font-bold"
                                  : "text-gray-400 hover:bg-white/5 hover:text-white"
                              }
                            `
                            }
                          >

                            <child.icon
                              size={17}
                              className="
                                transition-transform
                                duration-300
                                group-hover:scale-110
                              "
                            />

                            <span>
                              {child.title}
                            </span>

                          </NavLink>

                        ))}

                      </div>
                    )}

                </div>
              );
            }

            return (

              <NavLink
                key={item.title}
                to={item.path}
                end={item.path === "/"}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `
                  group
                  relative
                  flex
                  items-center
                  gap-4
                  rounded-2xl
                  px-4
                  py-3.5
                  transition-all
                  duration-300
                  ${
                    isActive
                      ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-[#081B33] font-bold shadow-xl scale-[1.02]"
                      : "text-gray-200 hover:bg-white/5 hover:text-white hover:translate-x-1"
                  }
                `
                }
              >

                <item.icon
                  size={21}
                  className="
                    transition-transform
                    duration-300
                    group-hover:scale-110
                  "
                />

                <span className="flex-1">
                  {item.title}
                </span>

              </NavLink>

            );

          })}

        </div>

      </div>


      {/* Footer */}
      <div
        className="
          border-t
          border-white/10
          p-3 sm:p-4 lg:p-5
          space-y-3 sm:space-y-4
        "
      >

        <div
          className="
            rounded-2xl
            bg-white/5
            border
            border-white/10
            p-3 sm:p-4
          "
        >

          <p className="text-xs text-gray-500">
            النظام
          </p>

          <h4 className="font-semibold mt-1">
            Tumouh Star ERP
          </h4>

          <p className="text-xs text-gray-400 mt-2">
            Version 1.0.0
          </p>

        </div>


        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          className="
            w-full
            rounded-2xl
            bg-red-500/10
            hover:bg-red-500
            border
            border-red-500/20
            py-2.5 sm:py-3
            flex
            items-center
            justify-center
            gap-3
            text-red-400
            hover:text-white
            transition-all
            duration-300
            cursor-pointer
          "
        >

          <LogOut size={20} />

          تسجيل الخروج

        </button>

      </div>

    </aside>
    </>
  );
}

export default Sidebar;
