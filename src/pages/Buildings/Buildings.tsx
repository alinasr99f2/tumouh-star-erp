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

type Filter =
  | "الكل"
  | BuildingStatus;

export default function Buildings() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const [filter, setFilter] =
    useState<Filter>("الكل");

  const filteredBuildings =
    useMemo(() => {
      return buildings.filter((building) => {
        const matchesSearch =
          building.name
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          building.city
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesFilter =
          filter === "الكل" ||
          building.status === filter;

        return (
          matchesSearch &&
          matchesFilter
        );
      });
    }, [search, filter]);

  const stats = [
    {
      title: "إجمالي العمائر",
      value: buildings.length,
      icon: Building2,
      iconClass: "text-blue-400",
      bgClass: "bg-blue-500/10",
    },
    {
      title: "قيد التنفيذ",
      value: buildings.filter(
        (b) =>
          b.status === "قيد التنفيذ"
      ).length,
      icon: Hammer,
      iconClass: "text-yellow-400",
      bgClass: "bg-yellow-500/10",
    },
    {
      title: "مكتمل",
      value: buildings.filter(
        (b) =>
          b.status === "مكتمل"
      ).length,
      icon: CheckCircle2,
      iconClass: "text-green-400",
      bgClass: "bg-green-500/10",
    },
    {
      title: "متوقف",
      value: buildings.filter(
        (b) =>
          b.status === "متوقف"
      ).length,
      icon: PauseCircle,
      iconClass: "text-red-400",
      bgClass: "bg-red-500/10",
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

      <div className="flex items-center justify-between gap-4">

        <div>
          <h1 className="text-3xl font-bold text-white">
            العمائر
          </h1>

          <p className="mt-2 text-gray-400">
            إدارة جميع عمائر شركة طموح ستار.
          </p>
        </div>

        <button
          type="button"
          className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-[#081B33] transition hover:bg-yellow-500"
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
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
        />

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="ابحث باسم العمارة أو المدينة..."
          className="w-full rounded-xl border border-white/10 bg-[#081B33] py-3 pr-11 pl-4 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-yellow-400/50"
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
            onClick={() =>
              setFilter(item)
            }
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === item
                ? "bg-yellow-400 text-[#081B33]"
                : "bg-[#081B33] text-gray-300 hover:bg-[#102844]"
            }`}
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
              className="rounded-2xl border border-white/10 bg-[#081B33] p-6"
            >

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-gray-400">
                    {item.title}
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-white">
                    {item.value}
                  </h2>

                </div>

                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.bgClass}`}
                >
                  <Icon
                    size={28}
                    className={item.iconClass}
                  />
                </div>

              </div>

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

          <span className="text-sm text-gray-500">
            {filteredBuildings.length} عمارة
          </span>

        </div>

        {filteredBuildings.length === 0 ? (

          <div className="rounded-2xl border border-white/10 bg-[#081B33] p-12 text-center text-gray-400">
            لا توجد عمائر مطابقة للبحث أو الفلتر.
          </div>

        ) : (

          <div className="grid gap-6 xl:grid-cols-2">

            {filteredBuildings.map(
              (building) => {

                const occupancy =
                  building.units > 0
                    ? Math.round(
                        (building.occupiedUnits /
                          building.units) *
                          100
                      )
                    : 0;

                return (

                  <div
                    key={building.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-[#081B33]"
                  >

                    {/* =====================
                        رأس الكارت
                    ===================== */}

                    <div className="border-b border-white/10 p-6">

                      <div className="flex items-start justify-between gap-4">

                        <div className="flex items-start gap-4">

                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-400/10">

                            <Building2
                              size={29}
                              className="text-yellow-400"
                            />

                          </div>

                          <div>

                            <div className="flex items-center gap-3">

                              <h3 className="text-xl font-bold text-white">
                                {building.name}
                              </h3>

                              <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-medium text-yellow-400">
                                {building.status}
                              </span>

                            </div>

                            <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-400">

                              <MapPin size={15} />

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
                          className="flex items-center gap-1 text-sm font-medium text-yellow-400 transition hover:text-yellow-300"
                        >

                          التفاصيل

                          <ChevronLeft
                            size={17}
                          />

                        </button>

                      </div>

                    </div>

                    {/* =====================
                        بيانات العمارة
                    ===================== */}

                    <div className="grid grid-cols-3 divide-x divide-x-reverse divide-white/10">

                      <div className="p-5 text-center">

                        <Home
                          size={19}
                          className="mx-auto mb-2 text-blue-400"
                        />

                        <p className="text-xs text-gray-500">
                          الوحدات
                        </p>

                        <p className="mt-1 font-bold text-white">
                          {building.units}
                        </p>

                      </div>

                      <div className="p-5 text-center">

                        <Wallet
                          size={19}
                          className="mx-auto mb-2 text-green-400"
                        />

                        <p className="text-xs text-gray-500">
                          الإيجار السنوي
                        </p>

                        <p className="mt-1 font-bold text-white">
                          {building.annualRent.toLocaleString(
                            "ar-SA"
                          )}{" "}
                          ريال
                        </p>

                      </div>

                      <div className="p-5 text-center">

                        <Building2
                          size={19}
                          className="mx-auto mb-2 text-purple-400"
                        />

                        <p className="text-xs text-gray-500">
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

                    <div className="border-t border-white/10 p-6">

                      <div className="mb-2 flex items-center justify-between text-sm">

                        <span className="text-gray-400">
                          نسبة الإنجاز
                        </span>

                        <span className="font-bold text-white">
                          {building.progress}%
                        </span>

                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-[#142C49]">

                        <div
                          className="h-full rounded-full bg-yellow-400 transition-all"
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
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 font-bold text-yellow-400 transition hover:bg-yellow-400 hover:text-[#081B33]"
                      >
                        اعرض التفاصيل

                        <ChevronLeft
                          size={18}
                        />
                      </button>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        )}

      </div>

    </div>
  );
}