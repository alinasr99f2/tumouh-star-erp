
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
  Edit3,
  X,
  Save,
  DoorOpen,
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

const initialBuildings: Building[] = [
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

  const [buildings, setBuildings] =
    useState<Building[]>(initialBuildings);

  const [search, setSearch] = useState("");

  const [filter, setFilter] =
    useState<Filter>("الكل");

  const [editingBuilding, setEditingBuilding] =
    useState<Building | null>(null);

  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editStatus, setEditStatus] =
    useState<BuildingStatus>("قيد التنفيذ");

  const filteredBuildings = useMemo(() => {
    return buildings.filter((building) => {
      const normalizedSearch = search
        .trim()
        .toLowerCase();

      const matchesSearch =
        building.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        building.city
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesFilter =
        filter === "الكل" ||
        building.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [buildings, search, filter]);

  const stats = [
    {
      title: "إجمالي العمائر",
      value: buildings.length,
      icon: Building2,
      iconClass: "text-[#F6D878]",
      borderClass: "border-[#C49A3A]/40",
      bgClass: "bg-[#C49A3A]/10",
      glowClass: "shadow-[#C49A3A]/10",
    },
    {
      title: "قيد التنفيذ",
      value: buildings.filter(
        (building) =>
          building.status === "قيد التنفيذ"
      ).length,
      icon: Hammer,
      iconClass: "text-[#F6D878]",
      borderClass: "border-[#C49A3A]/40",
      bgClass: "bg-[#C49A3A]/10",
      glowClass: "shadow-[#C49A3A]/10",
    },
    {
      title: "مكتمل",
      value: buildings.filter(
        (building) =>
          building.status === "مكتمل"
      ).length,
      icon: CheckCircle2,
      iconClass: "text-emerald-300",
      borderClass: "border-emerald-400/30",
      bgClass: "bg-emerald-400/10",
      glowClass: "shadow-emerald-500/10",
    },
    {
      title: "متوقف",
      value: buildings.filter(
        (building) =>
          building.status === "متوقف"
      ).length,
      icon: PauseCircle,
      iconClass: "text-red-300",
      borderClass: "border-red-400/30",
      bgClass: "bg-red-400/10",
      glowClass: "shadow-red-500/10",
    },
  ];

  const openEditModal = (building: Building) => {
    setEditingBuilding(building);
    setEditName(building.name);
    setEditCity(building.city);
    setEditStatus(building.status);
  };

  const closeEditModal = () => {
    setEditingBuilding(null);
    setEditName("");
    setEditCity("");
    setEditStatus("قيد التنفيذ");
  };

  const saveBuildingChanges = () => {
    if (!editingBuilding) return;

    const trimmedName = editName.trim();
    const trimmedCity = editCity.trim();

    if (!trimmedName || !trimmedCity) {
      alert("من فضلك أدخل اسم العمارة والعنوان.");
      return;
    }

    setBuildings((previousBuildings) =>
      previousBuildings.map((building) =>
        building.id === editingBuilding.id
          ? {
              ...building,
              name: trimmedName,
              city: trimmedCity,
              status: editStatus,
            }
          : building
      )
    );

    closeEditModal();
  };

  return (
    <>
      <div
        className="space-y-8 pb-8"
        dir="rtl"
      >
        {/* =========================
            عنوان الصفحة
        ========================= */}

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div>
            <h1 className="text-3xl font-extrabold text-white md:text-4xl">
              العمائر
            </h1>

            <p className="mt-3 text-base text-[#B4CEC5]">
              إدارة جميع عمائر شركة طموح ستار
            </p>
          </div>

          <button
            type="button"
            className="
              rounded-2xl
              border border-[#D4AD4D]
              bg-gradient-to-r from-[#C49A3A] to-[#F6D878]
              px-6 py-3
              font-bold
              text-[#16352B]
              shadow-lg shadow-[#C49A3A]/10
              transition-all duration-300
              hover:-translate-y-0.5
              hover:shadow-xl
            "
          >
            + عمارة جديدة
          </button>
        </div>

        {/* =========================
            البحث
        ========================= */}

        <div className="flex justify-center">
          <div className="group relative w-full max-w-xl">
            <Search
              size={21}
              className="
                absolute right-4 top-1/2
                -translate-y-1/2
                text-[#9ABDB0]
                transition-colors
                group-focus-within:text-[#F6D878]
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
                rounded-2xl
                border border-[#C49A3A]/30
                bg-gradient-to-r
                from-[#0B4537]
                via-[#073529]
                to-[#05261F]
                py-4
                pr-12 pl-5
                text-base
                text-white
                placeholder:text-[#8EADA2]
                shadow-lg shadow-black/10
                outline-none
                transition-all duration-300
                hover:border-[#C49A3A]/60
                focus:border-[#D4AD4D]
                focus:ring-2
                focus:ring-[#D4AD4D]/20
              "
            />
          </div>
        </div>

        {/* =========================
            الفلاتر
        ========================= */}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {(
            [
              "الكل",
              "قيد التنفيذ",
              "مكتمل",
              "متوقف",
            ] as Filter[]
          ).map((item) => {
            const isActive = filter === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`
                  min-w-[125px]
                  rounded-2xl
                  border
                  px-6 py-3
                  text-sm
                  font-bold
                  transition-all duration-300
                  ${
                    isActive
                      ? `
                        border-[#D4AD4D]
                        bg-gradient-to-r
                        from-[#C49A3A]
                        to-[#F6D878]
                        text-[#16352B]
                        shadow-lg
                        shadow-[#C49A3A]/20
                      `
                      : `
                        border-[#C49A3A]/25
                        bg-gradient-to-r
                        from-[#0B4537]
                        to-[#05261F]
                        text-[#C5D9D1]
                        hover:-translate-y-0.5
                        hover:border-[#D4AD4D]
                        hover:text-[#F6D878]
                        hover:shadow-lg
                        hover:shadow-[#C49A3A]/10
                      `
                  }
                `}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* =========================
            الإحصائيات
        ========================= */}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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
                  ${item.glowClass}
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:shadow-xl
                `}
              >
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`
                      flex h-14 w-14
                      items-center justify-center
                      rounded-2xl
                      border
                      ${item.borderClass}
                      ${item.bgClass}
                      transition-transform duration-300
                      group-hover:scale-110
                    `}
                  >
                    <Icon
                      size={28}
                      className={item.iconClass}
                    />
                  </div>

                  <p className="text-sm font-semibold text-[#B4CEC5]">
                    {item.title}
                  </p>

                  <h2 className="text-4xl font-extrabold leading-none text-white">
                    {item.value}
                  </h2>
                </div>

                <div
                  className="
                    absolute bottom-0 left-1/2
                    h-1 w-0
                    -translate-x-1/2
                    rounded-full
                    bg-[#D4AD4D]
                    transition-all duration-300
                    group-hover:w-1/3
                  "
                />
              </div>
            );
          })}
        </div>

        {/* =========================
            عنوان قائمة العمائر
        ========================= */}

        <div className="space-y-5">
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex items-center justify-center gap-3">
              <div
                className="
                  flex h-12 w-12
                  items-center justify-center
                  rounded-2xl
                  border border-[#C49A3A]/50
                  bg-[#C49A3A]/10
                "
              >
                <Building2
                  size={25}
                  className="text-[#F6D878]"
                />
              </div>

              <h2 className="text-2xl font-extrabold text-white md:text-3xl">
                قائمة العمائر
              </h2>
            </div>

            <span
              className="
                rounded-full
                border border-[#C49A3A]/30
                bg-[#C49A3A]/10
                px-5 py-2
                text-sm font-semibold
                text-[#F6D878]
              "
            >
              {filteredBuildings.length} عمارة
            </span>
          </div>

          {/* =========================
              قائمة الكروت
          ========================= */}

          {filteredBuildings.length === 0 ? (
            <div
              className="
                rounded-2xl
                border border-dashed border-[#C49A3A]/40
                bg-gradient-to-br
                from-[#0B4537]
                via-[#073529]
                to-[#05261F]
                p-12
                text-center
                text-[#8EADA2]
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

                const vacantUnits =
                  Math.max(
                    building.units -
                      building.occupiedUnits,
                    0
                  );

                return (
                  <div
                    key={building.id}
                    className="
                      overflow-hidden
                      rounded-3xl
                      border border-[#C49A3A]/25
                      bg-gradient-to-br
                      from-[#0B4537]
                      via-[#073529]
                      to-[#05261F]
                      shadow-xl shadow-black/10
                      transition-all duration-300
                      hover:border-[#C49A3A]/55
                      hover:shadow-2xl
                    "
                  >
                    {/* =====================
                        رأس الكارت
                    ===================== */}

                    <div
                      className="
                        border-b border-white/10
                        p-6
                      "
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-4">
                          <div
                            className="
                              flex h-14 w-14 shrink-0
                              items-center justify-center
                              rounded-2xl
                              border border-[#C49A3A]/40
                              bg-[#C49A3A]/10
                            "
                          >
                            <Building2
                              size={29}
                              className="text-[#F6D878]"
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xl font-extrabold text-white">
                                {building.name}
                              </h3>

                              <span
                                className="
                                  rounded-full
                                  border border-[#C49A3A]/35
                                  bg-[#C49A3A]/10
                                  px-3 py-1
                                  text-xs font-bold
                                  text-[#F6D878]
                                "
                              >
                                {building.status}
                              </span>
                            </div>

                            <div
                              className="
                                mt-2 flex items-center
                                gap-1.5
                                text-sm
                                text-[#B4CEC5]
                              "
                            >
                              <MapPin size={16} />
                              <span>{building.city}</span>
                            </div>
                          </div>
                        </div>

                        {/* زر التعديل بالقلم */}
                        <button
                          type="button"
                          title="تعديل بيانات العمارة"
                          onClick={() =>
                            openEditModal(building)
                          }
                          className="
                            flex h-11 w-11 shrink-0
                            items-center justify-center
                            rounded-xl
                            border border-[#C49A3A]/40
                            bg-[#C49A3A]/10
                            text-[#F6D878]
                            transition-all duration-300
                            hover:-translate-y-0.5
                            hover:border-[#D4AD4D]
                            hover:bg-[#C49A3A]/25
                          "
                        >
                          <Edit3 size={19} />
                        </button>
                      </div>
                    </div>

                    {/* =====================
                        بيانات العمارة
                    ===================== */}

                    <div
                      className="
                        grid
                        grid-cols-2
                        divide-x divide-x-reverse
                        divide-y
                        divide-white/10
                        md:grid-cols-4
                        md:divide-y-0
                      "
                    >
                      {/* إجمالي الشقق */}
                      <div className="p-5 text-center">
                        <Home
                          size={21}
                          className="mx-auto mb-3 text-[#F6D878]"
                        />

                        <p className="text-sm font-semibold text-[#B4CEC5]">
                          إجمالي الشقق
                        </p>

                        <p className="mt-2 text-xl font-extrabold text-white">
                          {building.units}
                        </p>
                      </div>

                      {/* الشقق الفارغة */}
                      <div className="p-5 text-center">
                        <DoorOpen
                          size={21}
                          className="mx-auto mb-3 text-emerald-300"
                        />

                        <p className="text-sm font-semibold text-[#B4CEC5]">
                          الشقق الفارغة
                        </p>

                        <p className="mt-2 text-xl font-extrabold text-white">
                          {vacantUnits}
                        </p>
                      </div>

                      {/* الإيجار السنوي */}
                      <div className="p-5 text-center">
                        <Wallet
                          size={21}
                          className="mx-auto mb-3 text-[#F6D878]"
                        />

                        <p className="text-sm font-semibold text-[#B4CEC5]">
                          الإيجار السنوي
                        </p>

                        <p className="mt-2 text-base font-extrabold text-white">
                          {building.annualRent.toLocaleString(
                            "ar-SA"
                          )}{" "}
                          ريال
                        </p>
                      </div>

                      {/* نسبة الإشغال */}
                      <div className="p-5 text-center">
                        <Building2
                          size={21}
                          className="mx-auto mb-3 text-[#D4AD4D]"
                        />

                        <p className="text-sm font-semibold text-[#B4CEC5]">
                          نسبة الإشغال
                        </p>

                        <p className="mt-2 text-xl font-extrabold text-white">
                          {occupancy}%
                        </p>
                      </div>
                    </div>

                    {/* =====================
                        نسبة الإنجاز
                    ===================== */}

                    <div
                      className="
                        border-t border-white/10
                        p-6
                      "
                    >
                      <div className="mb-3 flex items-center justify-between text-sm">
                        <span className="font-semibold text-[#B4CEC5]">
                          نسبة الإنجاز
                        </span>

                        <span className="font-extrabold text-[#F6D878]">
                          {building.progress}%
                        </span>
                      </div>

                      <div
                        className="
                          h-3
                          overflow-hidden
                          rounded-full
                          bg-[#031F18]
                        "
                      >
                        <div
                          className="
                            h-full
                            rounded-full
                            bg-gradient-to-r
                            from-[#B88B2D]
                            to-[#F6D878]
                            transition-all duration-500
                          "
                          style={{
                            width: `${building.progress}%`,
                          }}
                        />
                      </div>

                      {/* زر عرض التفاصيل */}
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/buildings/${building.id}`
                          )
                        }
                        className="
                          mt-5
                          flex w-full
                          items-center justify-center
                          gap-2
                          rounded-2xl
                          border border-[#C49A3A]/40
                          bg-[#C49A3A]/10
                          px-5 py-4
                          font-extrabold
                          text-[#F6D878]
                          transition-all duration-300
                          hover:-translate-y-0.5
                          hover:bg-gradient-to-r
                          hover:from-[#C49A3A]
                          hover:to-[#F6D878]
                          hover:text-[#16352B]
                        "
                      >
                        عرض تفاصيل العمارة

                        <ChevronLeft size={19} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* =========================
          نافذة تعديل بيانات العمارة
      ========================= */}

      {editingBuilding && (
        <div
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            bg-black/70
            p-4
            backdrop-blur-sm
          "
          dir="rtl"
        >
          <div
            className="
              w-full max-w-lg
              overflow-hidden
              rounded-3xl
              border border-[#C49A3A]/40
              bg-gradient-to-br
              from-[#0B4537]
              via-[#073529]
              to-[#05261F]
              shadow-2xl shadow-black/40
            "
          >
            {/* رأس النافذة */}
            <div
              className="
                flex items-center justify-between
                border-b border-white/10
                px-6 py-5
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex h-11 w-11
                    items-center justify-center
                    rounded-xl
                    border border-[#C49A3A]/40
                    bg-[#C49A3A]/10
                  "
                >
                  <Edit3
                    size={20}
                    className="text-[#F6D878]"
                  />
                </div>

                <h2 className="text-xl font-extrabold text-white">
                  تعديل بيانات العمارة
                </h2>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="
                  flex h-10 w-10
                  items-center justify-center
                  rounded-xl
                  text-[#B4CEC5]
                  transition
                  hover:bg-white/10
                  hover:text-white
                "
                title="إغلاق"
              >
                <X size={21} />
              </button>
            </div>

            {/* محتوى النافذة */}
            <div className="space-y-5 p-6">
              {/* اسم العمارة */}
              <div>
                <label
                  htmlFor="building-name"
                  className="mb-2 block text-sm font-bold text-[#D5E5DE]"
                >
                  اسم العمارة
                </label>

                <input
                  id="building-name"
                  type="text"
                  value={editName}
                  onChange={(event) =>
                    setEditName(event.target.value)
                  }
                  className="
                    w-full
                    rounded-xl
                    border border-[#C49A3A]/30
                    bg-[#031F18]/70
                    px-4 py-3
                    text-white
                    outline-none
                    transition
                    placeholder:text-[#8EADA2]
                    focus:border-[#D4AD4D]
                    focus:ring-2
                    focus:ring-[#D4AD4D]/20
                  "
                  placeholder="اكتب اسم العمارة"
                />
              </div>

              {/* العنوان */}
              <div>
                <label
                  htmlFor="building-city"
                  className="mb-2 block text-sm font-bold text-[#D5E5DE]"
                >
                  العنوان / المدينة
                </label>

                <input
                  id="building-city"
                  type="text"
                  value={editCity}
                  onChange={(event) =>
                    setEditCity(event.target.value)
                  }
                  className="
                    w-full
                    rounded-xl
                    border border-[#C49A3A]/30
                    bg-[#031F18]/70
                    px-4 py-3
                    text-white
                    outline-none
                    transition
                    placeholder:text-[#8EADA2]
                    focus:border-[#D4AD4D]
                    focus:ring-2
                    focus:ring-[#D4AD4D]/20
                  "
                  placeholder="اكتب العنوان أو المدينة"
                />
              </div>

              {/* الحالة */}
              <div>
                <label
                  htmlFor="building-status"
                  className="mb-2 block text-sm font-bold text-[#D5E5DE]"
                >
                  حالة العمارة
                </label>

                <select
                  id="building-status"
                  value={editStatus}
                  onChange={(event) =>
                    setEditStatus(
                      event.target.value as BuildingStatus
                    )
                  }
                  className="
                    w-full
                    rounded-xl
                    border border-[#C49A3A]/30
                    bg-[#031F18]
                    px-4 py-3
                    text-white
                    outline-none
                    transition
                    focus:border-[#D4AD4D]
                    focus:ring-2
                    focus:ring-[#D4AD4D]/20
                  "
                >
                  <option value="قيد التنفيذ">
                    قيد التنفيذ
                  </option>

                  <option value="مكتمل">
                    مكتمل
                  </option>

                  <option value="متوقف">
                    متوقف
                  </option>
                </select>
              </div>

              {/* أزرار النافذة */}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={saveBuildingChanges}
                  className="
                    flex flex-1
                    items-center justify-center
                    gap-2
                    rounded-xl
                    bg-gradient-to-r
                    from-[#C49A3A]
                    to-[#F6D878]
                    px-5 py-3
                    font-extrabold
                    text-[#16352B]
                    shadow-lg shadow-[#C49A3A]/10
                    transition
                    hover:brightness-110
                  "
                >
                  <Save size={18} />
                  حفظ التعديلات
                </button>

                <button
                  type="button"
                  onClick={closeEditModal}
                  className="
                    flex flex-1
                    items-center justify-center
                    gap-2
                    rounded-xl
                    border border-white/15
                    bg-white/5
                    px-5 py-3
                    font-bold
                    text-[#D5E5DE]
                    transition
                    hover:bg-white/10
                  "
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}