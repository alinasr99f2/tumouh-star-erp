import { NavLink } from "react-router-dom";
import {
  LogOut,
  
  Circle,
} from "lucide-react";

import { sidebarMenu } from "../../data/menu";

function Sidebar() {
  return (
    <aside
      className="
        w-72
        h-screen
        flex
        flex-col
        shrink-0
        bg-[#081B33]
        border-l
        border-white/10
        text-white
      "
    >
      {/* Header */}

      <div className="px-6 pt-8 pb-6 border-b border-white/10">

        <div className="flex items-center gap-4">

          <div
            className="
              w-16
              h-16
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
                w-12
                h-12
                rounded-2xl
                bg-black
                shadow-xl
                flex
                items-center
                justify-center
              "
            >

              <span className="text-yellow-400 text-2xl font-black">
                ★
              </span>

            </div>

          </div>

          <div>

            <h1 className="text-2xl font-extrabold tracking-wide">
              Tumouh Star
            </h1>

            <p className="text-gray-400 text-sm">
              ERP System
            </p>

          </div>

        </div>

      </div>

      {/* User */}

      <div className="px-5 pt-5">

        <div
          className="
            rounded-3xl
            bg-white/5
            border
            border-white/10
            backdrop-blur-md
            p-5
          "
        >

          <div className="flex items-center gap-4">

            <div
              className="
                w-14
                h-14
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

              <p className="text-gray-400 text-sm">
                Supervisor
              </p>

            </div>

          </div>

          <div className="mt-4 flex items-center gap-2">

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
          mt-6
          px-4
          pb-5
        "
      >

        <p className="text-xs text-gray-500 px-3 mb-4 uppercase tracking-widest">
          MAIN MENU
        </p>

        <div className="space-y-2">

          {sidebarMenu.map((item) => (

            <NavLink
              key={item.title}
              to={item.path}
              end={item.path === "/"}
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

          ))}

        </div>

      </div>

      {/* Footer */}

      <div
        className="
          border-t
          border-white/10
          p-5
          space-y-4
        "
      >

        <div
          className="
            rounded-2xl
            bg-white/5
            border
            border-white/10
            p-4
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

        <button
          type="button"
          className="
            w-full
            rounded-2xl
            bg-red-500/10
            hover:bg-red-500
            border
            border-red-500/20
            py-3
            flex
            items-center
            justify-center
            gap-3
            text-red-400
            hover:text-white
            transition-all
            duration-300
          "
        >

          <LogOut size={20} />

          تسجيل الخروج

        </button>

      </div>

    </aside>
  );
}

export default Sidebar;