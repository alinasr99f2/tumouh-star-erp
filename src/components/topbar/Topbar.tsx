import {
  Bell,
  CalendarDays,
  Search,
  Moon,
  Globe,
  ChevronDown,
} from "lucide-react";

function Topbar() {
  return (
    <header className="h-20 bg-[#081B33] border-b border-white/10 px-8 flex items-center justify-between">

      {/* Left */}

      <div className="flex items-center gap-4">

        <button className="w-11 h-11 rounded-xl bg-[#102947] hover:bg-[#16375d] transition flex items-center justify-center">

          <Bell size={20} />

        </button>

        <button className="w-11 h-11 rounded-xl bg-[#102947] hover:bg-[#16375d] transition flex items-center justify-center">

          <Moon size={18} />

        </button>

        <button className="w-11 h-11 rounded-xl bg-[#102947] hover:bg-[#16375d] transition flex items-center justify-center">

          <Globe size={18} />

        </button>

      </div>

      {/* Center */}

      <div className="flex-1 flex justify-center">

        <div className="relative w-[450px]">

          <Search
            size={18}
            className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400"
          />

          <input
            type="text"
            placeholder="ابحث داخل النظام..."
            className="w-full h-12 rounded-2xl bg-[#102947] border border-white/10 pr-12 pl-4 outline-none text-white placeholder:text-gray-500 focus:border-yellow-400 transition"
          />

        </div>

      </div>

      {/* Right */}

      <div className="flex items-center gap-5">

        <div className="text-left">

          <h3 className="font-semibold">
            علي نصر
          </h3>

          <p className="text-xs text-gray-400">
            Supervisor
          </p>

        </div>

        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center font-bold text-[#081B33]">
          A
        </div>

        <ChevronDown size={18} className="text-gray-400" />

        <div className="flex items-center gap-2 text-gray-300 mr-6">

          <CalendarDays size={18} />

          <span className="text-sm">
            28 يوليو 2026
          </span>

        </div>

      </div>

    </header>
  );
}

export default Topbar;