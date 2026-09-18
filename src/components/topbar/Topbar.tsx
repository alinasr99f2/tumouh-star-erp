import {
  Bell,
  CalendarDays,
  Search,
  Moon,
  Globe,
  ChevronDown,
  Menu,
} from "lucide-react";

type TopbarProps = {
  onMobileMenu?: () => void;
};

function Topbar({ onMobileMenu }: TopbarProps) {
  return (
    <header className="h-16 sm:h-18 lg:h-20 bg-[#081B33] border-b border-white/10 px-3 sm:px-5 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">

      {/* Mobile Menu */}

      <button
        type="button"
        aria-label="فتح القائمة الجانبية"
        onClick={onMobileMenu}
        className="flex lg:hidden w-9 h-9 sm:w-10 sm:h-10 items-center justify-center rounded-lg sm:rounded-xl bg-[#102947] hover:bg-[#16375d] transition shrink-0"
      >
        <Menu size={20} />
      </button>

      {/* Left */}

      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">

        <button className="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-lg sm:rounded-xl bg-[#102947] hover:bg-[#16375d] transition flex items-center justify-center shrink-0">

          <Bell size={18} className="sm:w-5 sm:h-5" />

        </button>

        <button className="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-lg sm:rounded-xl bg-[#102947] hover:bg-[#16375d] transition flex items-center justify-center shrink-0">

          <Moon size={17} className="sm:w-[18px] sm:h-[18px]" />

        </button>

        <button className="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-lg sm:rounded-xl bg-[#102947] hover:bg-[#16375d] transition flex items-center justify-center shrink-0">

          <Globe size={17} className="sm:w-[18px] sm:h-[18px]" />

        </button>

      </div>

      {/* Center */}

      <div className="flex-1 flex justify-center min-w-0">

        <div className="relative w-full max-w-[450px]">

          <Search
            size={18}
            className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-4 text-gray-400"
          />

          <input
            type="text"
            placeholder="ابحث داخل النظام..."
            className="w-full h-10 sm:h-11 lg:h-12 rounded-xl sm:rounded-2xl bg-[#102947] border border-white/10 pr-10 sm:pr-12 pl-3 sm:pl-4 outline-none text-sm sm:text-base text-white placeholder:text-gray-500 focus:border-yellow-400 transition"
          />

        </div>

      </div>

      {/* Right */}

      <div className="flex items-center gap-2 sm:gap-3 lg:gap-5 min-w-0">

        <div className="text-left hidden sm:block">

          <h3 className="font-semibold text-sm lg:text-base whitespace-nowrap">
            علي نصر
          </h3>

          <p className="text-xs text-gray-400">
            Supervisor
          </p>

        </div>

        <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center font-bold text-[#081B33] shrink-0">
          A
        </div>

        <ChevronDown size={16} className="sm:w-[18px] sm:h-[18px] text-gray-400 shrink-0" />

        <div className="flex items-center gap-1.5 sm:gap-2 text-gray-300 mr-1 sm:mr-3 lg:mr-6 shrink-0">

          <CalendarDays size={16} className="sm:w-[18px] sm:h-[18px]" />

          <span className="text-xs sm:text-sm whitespace-nowrap">
            28 يوليو 2026
          </span>

        </div>

      </div>

    </header>
  );
}

export default Topbar;
