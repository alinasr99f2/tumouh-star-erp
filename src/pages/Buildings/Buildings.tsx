
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Building2,
  Hammer,
  CheckCircle2,
  PauseCircle,
  Search,
  MapPin,
  Home,
  Wallet,
  ChevronLeft,
} from "lucide-react";

type BuildingStatus =
  | "قيد التنفيذ"
  | "مكتمل"
  | "متوقف";

type Building = {
  id: number;
  name: string;
  city: string;
  status: BuildingStatus;
  units: number;
  occupiedUnits: number;
  progress: number;
  annualRent: number;
};

const buildings: Building[] = [
  {
    id: 1,
    name: "عمارة سنتر",
    city: "تبوك",
    status: "قيد التنفيذ",
    units: 44,
    occupiedUnits: 0,
    progress: 72,
    annualRent: 950000,
  },
];

type Filter = "الكل" | BuildingStatus;

export default function Buildings() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const [filter, setFilter] =
    useState<Filter>("الكل");

  const filteredBuildings = useMemo(() => {
    return buildings.filter((building) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        building.name
          .toLowerCase()
          .includes(searchValue) ||
        building.city
          .toLowerCase()
          .includes(searchValue);

      const matchesFilter =
        filter === "الكل" ||
        building.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  const stats = [
    {
      title: "إجمالي العمائر",
      value: buildings.length,
      icon: Building2,
      iconClass: "text-[#F6D878]",
      bgClass: "bg-[#C49A3A]/10",
      borderClass: "border-[#C49A3A]/30",
      glowClass: "hover:shadow-[#C49A3A]/10",
    },
    {
      title: "قيد التنفيذ",
      value: buildings.filter(
        (building) =>
          building.status === "قيد التنفيذ"
      ).length,
      icon: Hammer,
      iconClass: "text-[#F6D878]",
      bgClass: "bg-[#C49A3A]/10",
      borderClass: "border-[#C49A3A]/30",
      glowClass: "hover:shadow-[#C49A3A]/10",
    },
    {
      title: "مكتمل",
      value: buildings.filter(
        (building) =>
          building.status === "مكتمل"
      ).length,
      icon: CheckCircle2,
      iconClass: "text-emerald-300",
      bgClass: "bg-emerald-400/10",
      borderClass: "border-emerald-400/25",
      glowClass: "hover:shadow-emerald-400/10",
    },
    {
      title: "متوقف",
      value: buildings.filter(
        (building) =>
          building.status === "متوقف"
      ).length,
      icon: PauseCircle,
      iconClass: "text-red-300",
      bgClass: "bg-red-400/10",
      borderClass: "border-red-400/25",
      glowClass: "hover:shadow-red-400/10",
    },
  ];

  return (
    <div
      className="space-y-6"
      dir="rtl"
    >
      {/* =========================
          عنوان الصفحة
      ========================= */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">
            العمائر
          </h1>

          <p className="mt-2 text-[#9CBAB0]">
            إدارة جميع عمائر شركة طموح ستار.
          </p>
        </div>

        <button
          type="button"
          className="
            rounded-xl
            border
            border-[#C49A3A]/30
            bg-gradient-to-r
            from-[#D4AD4D]
            to-[#F6D878]
            px-6
            py-3
            font-bold
            text-[#16352B]
            shadow-lg
            shadow-[#C49A3A]/10
            transition-all
            duration-300
            hover:-translate-y-0.5
            hover:shadow-xl
            hover:shadow-[#C49A3A]/20
          "
        >
          + عمارة جديدة
        </button>
      </div>

      {/* =========================
          البحث
      ========================= */}

      <div className="relative">
        <Search
          size={19}
          className="
            absolute
            right-4
            top-1/2
            -translate-y-1/2
            text-[#77998D]
          "
        />

        <input
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="ابحث باسم العمارة أو المدينة..."
          className="
            w-full
            rounded-xl
            border
            border-[#C49A3A]/20
            bg-gradient-to-r
            from-[#0B4537]
            to-[#073529]
            py-3
            pl-4
            pr-11
            text-sm
            text-white
            outline-none
            transition-all
            placeholder:text-[#77998D]
            focus:border-[#D4AD4D]/60
            focus:ring-2
            focus:ring-[#C49A3A]/10
          "
        />
      </div>

      {/* =========================
          الفلاتر
      ========================= */}

      <div className="flex flex-wrap gap-2">
        {(
          [
            "الكل",
            "قيد التنفيذ",
            "مكتمل",
            "متوقف",
          ] as Filter[]
        ).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`
              rounded-xl
              border
              px-4
              py-2
              text-sm
              font-medium
              transition-all
              duration-300
              ${
                filter === item
                  ? "border-[#D4AD4D]/50 bg-gradient-to-r from-[#C49A3A] to-[#F6D878] text-[#16352B] shadow-md shadow-[#C49A3A]/10"
                  : "border-white/10 bg-[#0B4537] text-[#B4CEC5] hover:border-[#C49A3A]/30 hover:bg-[#0E5141]"
              }
            `}
          >
            {item}
          </button>
        ))}
      </div>

      {/* =========================
          الإحصائيات
      ========================= */}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className={`
                group
                relative
                overflow-hidden
                rounded-2xl
                border
                ${item.borderClass}
                bg-gradient-to-br
                from-[#0B4537]
                via-[#073529]
                to-[#05261F]
                p-6
                text-center
                shadow-lg
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-xl
                ${item.glowClass}
              `}
            >
              {/* Background Glow */}
              <div
                className="
                  pointer-events-none
                  absolute
                  -right-10
                  -top-10
                  h-28
                  w-28
                  rounded-full
                  bg-[#C49A3A]/[0.04]
                  blur-3xl
                  transition-all
                  duration-300
                  group-hover:bg-[#C49A3A]/[0.08]
                "
              />

              <div className="relative z-10 flex flex-col items-center gap-4">
                <div
                  className={`
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    ${item.borderClass}
                    ${item.bgClass}
                    transition-transform
                    duration-300
                    group-hover:scale-110
                  `}
                >
                  <Icon
                    size={28}
                    className={item.iconClass}
                  />
                </div>

                <p className="text-sm font-medium text-[#B4CEC5]">
                  {item.title}
                </p>

                <h2 className="text-4xl font-bold leading-none text-white">
                  {item.value}
                </h2>
              </div>

              {/* Bottom Accent */}
              <div
                className="
                  absolute
                  bottom-0
                  left-1/2
                  h-1
                  w-0
                  -translate-x-1/2
                  rounded-full
                  bg-[#D4AD4D]
                  transition-all
                  duration-300
                  group-hover:w-1/3
                "
              />
            </div>
          );
        })}
      </div>

      {/* =========================
          قائمة العمائر
      ========================= */}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            قائمة العمائر
          </h2>

          <span className="text-sm text-[#8EADA2]">
            {filteredBuildings.length} عمارة
          </span>
        </div>

        {filteredBuildings.length === 0 ? (
          <div
            className="
              rounded-2xl
              border
              border-[#C49A3A]/20
              bg-gradient-to-br
              from-[#0B4537]
              to-[#05261F]
              p-12
              text-center
              text-[#9CBAB0]
            "
          >
            لا توجد عمائر مطابقة للبحث أو الفلتر.
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {filteredBuildings.map((building) => {
              const occupancy =
                building.units > 0
                  ? Math.round(
                      (building.occupiedUnits /
                        building.units) *
                        100
                    )
                  : 0;

              const statusColor =
                building.status === "مكتمل"
                  ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                  : building.status === "متوقف"
                  ? "border-red-400/25 bg-red-400/10 text-red-300"
                  : "border-[#C49A3A]/30 bg-[#C49A3A]/10 text-[#F6D878]";

              return (
                <div
                  key={building.id}
                  className="
                    group
                    relative
                    overflow-hidden
                    rounded-2xl
                    border
                    border-[#C49A3A]/20
                    bg-gradient-to-br
                    from-[#0B4537]
                    via-[#073529]
                    to-[#05261F]
                    shadow-lg
                    shadow-black/10
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:border-[#D4AD4D]/50
                    hover:shadow-xl
                    hover:shadow-[#C49A3A]/10
                  "
                >
                  {/* Background Decoration */}
                  <div
                    className="
                      pointer-events-none
                      absolute
                      -bottom-20
                      -left-16
                      h-44
                      w-44
                      rounded-full
                      bg-[#C49A3A]/[0.04]
                      blur-3xl
                      transition-all
                      duration-500
                      group-hover:bg-[#C49A3A]/[0.08]
                    "
                  />

                  {/* =====================
                      رأس الكارت
                  ===================== */}

                  <div className="relative z-10 border-b border-white/10 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-4">
                        {/* Building Icon */}
                        <div
                          className="
                            flex
                            h-14
                            w-14
                            shrink-0
                            items-center
                            justify-center
                            rounded-2xl
                            border
                            border-[#C49A3A]/30
                            bg-[#C49A3A]/10
                            transition-transform
                            duration-300
                            group-hover:scale-105
                          "
                        >
                          <Building2
                            size={29}
                            className="text-[#F6D878]"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-bold text-white">
                              {building.name}
                            </h3>

                            <span
                              className={`
                                rounded-full
                                border
                                px-3
                                py-1
                                text-xs
                                font-medium
                                ${statusColor}
                              `}
                            >
                              {building.status}
                            </span>
                          </div>

                          <div
                            className="
                              mt-2
                              flex
                              items-center
                              gap-1.5
                              text-sm
                              text-[#9CBAB0]
                            "
                          >
                            <MapPin
                              size={15}
                              className="text-[#D4AD4D]"
                            />

                            {building.city}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/buildings/${building.id}`
                          )
                        }
                        className="
                          flex
                          shrink-0
                          items-center
                          gap-1
                          text-sm
                          font-medium
                          text-[#F6D878]
                          transition-colors
                          hover:text-white
                        "
                      >
                        التفاصيل

                        <ChevronLeft size={17} />
                      </button>
                    </div>
                  </div>

                  {/* =====================
                      بيانات العمارة
                  ===================== */}

                  <div
                    className="
                      relative
                      z-10
                      grid
                      grid-cols-3
                      divide-x
                      divide-x-reverse
                      divide-white/10
                    "
                  >
                    {/* Units */}
                    <div className="p-5 text-center">
                      <Home
                        size={19}
                        className="mx-auto mb-2 text-[#D4AD4D]"
                      />

                      <p className="text-xs text-[#8EADA2]">
                        الوحدات
                      </p>

                      <p className="mt-1 font-bold text-white">
                        {building.units}
                      </p>
                    </div>

                    {/* Annual Rent */}
                    <div className="p-5 text-center">
                      <Wallet
                        size={19}
                        className="mx-auto mb-2 text-emerald-300"
                      />

                      <p className="text-xs text-[#8EADA2]">
                        الإيجار السنوي
                      </p>

                      <p className="mt-1 text-sm font-bold text-white">
                        {building.annualRent.toLocaleString(
                          "ar-SA"
                        )}{" "}
                        ريال
                      </p>
                    </div>

                    {/* Occupancy */}
                    <div className="p-5 text-center">
                      <Building2
                        size={19}
                        className="mx-auto mb-2 text-[#C4A4E8]"
                      />

                      <p className="text-xs text-[#8EADA2]">
                        الإشغال
                      </p>

                      <p className="mt-1 font-bold text-white">
                        {occupancy}%
                      </p>
                    </div>
                  </div>

                  {/* =====================
                      نسبة الإنجاز
                  ===================== */}

                  <div className="relative z-10 border-t border-white/10 p-6">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-[#9CBAB0]">
                        نسبة الإنجاز
                      </span>

                      <span className="font-bold text-[#F6D878]">
                        {building.progress}%
                      </span>
                    </div>

                    {/* Progress Background */}
                    <div
                      className="
                        h-3
                        overflow-hidden
                        rounded-full
                        border
                        border-white/[0.04]
                        bg-[#123D32]
                      "
                    >
                      {/* Progress Value */}
                      <div
                        className="
                          h-full
                          rounded-full
                          bg-gradient-to-r
                          from-[#A9822F]
                          via-[#D4AD4D]
                          to-[#F6D878]
                          shadow-[0_0_12px_rgba(212,173,77,0.25)]
                          transition-all
                          duration-500
                        "
                        style={{
                          width: `${building.progress}%`,
                        }}
                      />
                    </div>

                    {/* =====================
                        زر عرض التفاصيل
                    ===================== */}

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/buildings/${building.id}`
                        )
                      }
                      className="
                        mt-5
                        flex
                        w-full
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        border
                        border-[#C49A3A]/30
                        bg-[#C49A3A]/10
                        px-5
                        py-3
                        font-bold
                        text-[#F6D878]
                        transition-all
                        duration-300
                        hover:border-[#D4AD4D]
                        hover:bg-gradient-to-r
                        hover:from-[#C49A3A]
                        hover:to-[#F6D878]
                        hover:text-[#16352B]
                        hover:shadow-lg
                        hover:shadow-[#C49A3A]/10
                      "
                    >
                      اعرض التفاصيل

                      <ChevronLeft size={18} />
                    </button>
                  </div>

                  {/* Bottom Accent */}
                  <div
                    className="
                      absolute
                      bottom-0
                      left-1/2
                      h-1
                      w-0
                      -translate-x-1/2
                      rounded-full
                      bg-gradient-to-r
                      from-[#A9822F]
                      to-[#F6D878]
                      transition-all
                      duration-300
                      group-hover:w-1/3
                    "
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}