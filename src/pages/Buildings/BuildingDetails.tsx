import { useState } from "react";
import {
  X,
  Building2,
  Home,
  CalendarDays,
  Wallet,
  User,
  Phone,
  Users,
  Car,
  Zap,
  Droplets,
  Sofa,
  FileText,
  MessageSquare,
  Paperclip,
  Coins,
  MapPin,
  Edit3,
  Trash2,
  Info,
  CheckCircle2,
  Plus,
  AlertCircle,
  ArrowUpRight,
  Receipt,
} from "lucide-react";

type ApartmentStatus =
  | "مؤجرة"
  | "شاغرة"
  | "مؤجرة للشركة";

type Apartment = {
  number: number;
  type: string;
  rent: number;
  status: ApartmentStatus;
  tenant: string;
};

type ApartmentTab =
  | "البيانات الأساسية"
  | "بيانات المستأجر"
  | "العقد"
  | "المدفوعات"
  | "المستندات"
  | "الملاحظات";

export default function BuildingDetails() {
  const [selectedApartment, setSelectedApartment] =
    useState<Apartment | null>(null);

  const [activeTab, setActiveTab] =
    useState<ApartmentTab>("البيانات الأساسية");

  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState("2026-09-30");

  const apartments: Apartment[] = Array.from(
    { length: 44 },
    (_, index) => {
      const number = index + 1;

      const vacant = number >= 40;

      const company = [
        5,
        6,
        7,
        8,
        9,
        15,
        16,
        17,
        18,
        19,
        20,
      ].includes(number);

      return {
        number,
        type:
          number <= 20
            ? "غرفتين وصالة"
            : "غرفة وصالة",
        rent:
          number <= 20
            ? 4000
            : 3000,
        status: vacant
          ? "شاغرة"
          : company
          ? "مؤجرة للشركة"
          : "مؤجرة",
        tenant: vacant
          ? "لا يوجد مستأجر"
          : company
          ? "شركة طموح ستار"
          : "اسم المستأجر غير مضاف",
      };
    }
  );

  const getApartmentColor = (
    status: ApartmentStatus
  ) => {
    if (status === "شاغرة") {
      return "bg-red-600 hover:bg-red-500";
    }

    if (status === "مؤجرة للشركة") {
      return "bg-blue-700 hover:bg-blue-600";
    }

    return "bg-green-700 hover:bg-green-600";
  };

  const getStatusColor = (
    status: ApartmentStatus
  ) => {
    if (status === "شاغرة") {
      return {
        badge:
          "border-red-400/30 bg-red-500/10 text-red-400",
        dot: "bg-red-400",
      };
    }

    if (status === "مؤجرة للشركة") {
      return {
        badge:
          "border-blue-400/30 bg-blue-500/10 text-blue-400",
        dot: "bg-blue-400",
      };
    }

    return {
      badge:
        "border-green-400/30 bg-green-500/10 text-green-400",
      dot: "bg-green-400",
    };
  };

  const apartmentTabs: {
    title: ApartmentTab;
    icon: typeof Home;
  }[] = [
    {
      title: "البيانات الأساسية",
      icon: Home,
    },
    {
      title: "بيانات المستأجر",
      icon: User,
    },
    {
      title: "العقد",
      icon: FileText,
    },
    {
      title: "المدفوعات",
      icon: Coins,
    },
    {
      title: "المستندات",
      icon: Paperclip,
    },
    {
      title: "الملاحظات",
      icon: MessageSquare,
    },
  ];

  const openApartment = (
    apartment: Apartment
  ) => {
    setSelectedApartment(apartment);
    setActiveTab("البيانات الأساسية");
  };

  const closeApartment = () => {
    setSelectedApartment(null);
    setActiveTab("البيانات الأساسية");
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#061426] p-6 text-white"
    >

      {/* ===================================================== */}
      {/* HEADER                                                 */}
      {/* ===================================================== */}

      <div className="mb-6 rounded-2xl border border-[#d89b18] bg-[#050505] p-6 shadow-lg">

        <div className="flex items-center justify-between gap-6">

          <div>

            <h1 className="text-3xl font-bold text-[#f0ad18]">
              عمارة سنتر
            </h1>

            <p className="mt-2 text-gray-300">
              تفاصيل الاستثمار والعقود والإيرادات
            </p>

          </div>

          <div className="text-left">

            <div className="text-2xl font-bold text-white">
              Tumouh Star
            </div>

            <div className="text-[#d89b18]">
              ERP System
            </div>

          </div>

        </div>

      </div>

      {/* ===================================================== */}
      {/* BASIC INFO - 4 CARDS                                 */}
      {/* ===================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

        {/* TOTAL APARTMENTS */}

        <div className="rounded-2xl border border-[#173858] bg-[#0b2039] p-5 shadow-lg transition hover:border-[#f0ad18]/40">

          <div className="text-sm text-gray-400">
            إجمالي الشقق
          </div>

          <div className="mt-2 text-4xl font-bold text-[#f0ad18]">
            44
          </div>

          <div className="mt-1 text-gray-400">
            شقة
          </div>

        </div>

        {/* RENTED */}

        <div className="rounded-2xl border border-[#173858] bg-[#0b2039] p-5 shadow-lg transition hover:border-green-400/40">

          <div className="text-sm text-gray-400">
            الشقق المؤجرة
          </div>

          <div className="mt-2 text-4xl font-bold text-green-400">
            39
          </div>

          <div className="mt-1 text-gray-400">
            شقة
          </div>

        </div>

        {/* VACANT */}

        <div className="rounded-2xl border border-[#173858] bg-[#0b2039] p-5 shadow-lg transition hover:border-red-400/40">

          <div className="text-sm text-gray-400">
            الشقق الشاغرة
          </div>

          <div className="mt-2 text-4xl font-bold text-red-400">
            5
          </div>

          <div className="mt-1 text-gray-400">
            شقق
          </div>

        </div>

        {/* OCCUPANCY */}

        <div className="rounded-2xl border border-[#173858] bg-[#0b2039] p-5 shadow-lg transition hover:border-[#f0ad18]/40">

          <div className="text-sm text-gray-400">
            نسبة الإشغال
          </div>

          <div className="mt-2 text-4xl font-bold text-[#f0ad18]">
            88.64%
          </div>

          <div className="mt-1 text-gray-400">
            من إجمالي الشقق
          </div>

        </div>

      </div>

      {/* ===================================================== */}
      {/* COLLECTION & BILLS - NEW 5 CARDS                     */}
      {/* ===================================================== */}

      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">

        {/* ================================================= */}
        {/* TOTAL COLLECTIONS                                  */}
        {/* ================================================= */}

        <div className="relative overflow-hidden rounded-3xl border border-[#f0ad18]/30 bg-gradient-to-br from-[#102b47] via-[#0b2039] to-[#071526] p-5 shadow-xl backdrop-blur-xl xl:col-span-1">

          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#f0ad18]/10 blur-3xl" />

          <div className="relative">

            <div className="mb-4 flex items-start justify-between">

              <div>

                <p className="text-sm text-gray-400">
                  إجمالي التحصيلات
                </p>

                <h3 className="mt-1 text-lg font-bold text-white">
                  تحصيلات الإيجار
                </h3>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#f0ad18]/30 bg-[#f0ad18]/10">

                <Coins
                  size={22}
                  className="text-[#f0ad18]"
                />

              </div>

            </div>

            {/* DATE FILTER */}

            <div className="space-y-3">

              <div>

                <label className="mb-1 block text-xs text-gray-500">
                  من تاريخ
                </label>

                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) =>
                    setFromDate(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#061426] px-3 py-2 text-sm text-white outline-none transition focus:border-[#f0ad18]/60"
                />

              </div>

              <div>

                <label className="mb-1 block text-xs text-gray-500">
                  إلى تاريخ
                </label>

                <input
                  type="date"
                  value={toDate}
                  onChange={(event) =>
                    setToDate(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#061426] px-3 py-2 text-sm text-white outline-none transition focus:border-[#f0ad18]/60"
                />

              </div>

            </div>

            {/* RESULT */}

            <div className="mt-4 rounded-2xl border border-[#f0ad18]/20 bg-[#f0ad18]/5 p-4">

              <div className="flex items-center justify-between">

                <span className="text-xs text-gray-400">
                  نتيجة الفترة
                </span>

                <ArrowUpRight
                  size={16}
                  className="text-green-400"
                />

              </div>

              <div className="mt-1 text-2xl font-black text-[#f6c84a]">
                126,000
              </div>

              <div className="text-xs text-gray-500">
                ريال
              </div>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* ADD RENT COLLECTION                               */}
        {/* ================================================= */}

        <button
          type="button"
          className="group relative overflow-hidden rounded-3xl border border-[#f0ad18]/50 bg-gradient-to-br from-[#f0ad18]/15 via-[#0b2039] to-[#071526] p-5 text-right shadow-xl transition duration-300 hover:-translate-y-1 hover:border-[#f6c84a] hover:shadow-[0_0_35px_rgba(240,173,24,0.15)]"
        >

          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#f0ad18]/10 blur-3xl transition group-hover:bg-[#f0ad18]/20" />

          <div className="relative">

            <div className="mb-5 flex items-start justify-between">

              <div>

                <p className="text-sm text-gray-400">
                  العمليات المالية
                </p>

                <h3 className="mt-1 text-xl font-bold text-white">
                  إضافة تحصيل إيجار
                </h3>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0ad18] text-[#07182b] shadow-lg transition group-hover:scale-110">

                <Plus
                  size={26}
                  strokeWidth={2.5}
                />

              </div>

            </div>

            <p className="text-sm leading-6 text-gray-400">
              تسجيل دفعة إيجار جديدة وربطها بالشقة والمستأجر والعقد.
            </p>

            <div className="mt-5 flex items-center justify-between">

              <span className="text-sm font-bold text-[#f6c84a]">
                إضافة تحصيل
              </span>

              <ArrowUpRight
                size={19}
                className="text-[#f0ad18] transition group-hover:-translate-x-1"
              />

            </div>

          </div>

        </button>

        {/* ================================================= */}
        {/* WATER BILLS                                       */}
        {/* ================================================= */}

        <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#0d2943] via-[#0b2039] to-[#071526] p-5 shadow-xl">

          <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative">

            <div className="mb-5 flex items-start justify-between">

              <div>

                <p className="text-sm text-gray-400">
                  المرافق
                </p>

                <h3 className="mt-1 text-lg font-bold">
                  فواتير المياه
                </h3>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">

                <Droplets
                  size={22}
                  className="text-cyan-400"
                />

              </div>

            </div>

            <div className="text-3xl font-black text-cyan-400">
              8,450
            </div>

            <div className="mt-1 text-xs text-gray-500">
              ريال إجمالي الفواتير
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">

              <span className="text-xs text-gray-500">
                هذا الشهر
              </span>

              <span className="text-sm font-bold text-white">
                44 فاتورة
              </span>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* ELECTRICITY BILLS                                 */}
        {/* ================================================= */}

        <div className="relative overflow-hidden rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-[#152c40] via-[#0b2039] to-[#071526] p-5 shadow-xl">

          <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-yellow-400/10 blur-3xl" />

          <div className="relative">

            <div className="mb-5 flex items-start justify-between">

              <div>

                <p className="text-sm text-gray-400">
                  المرافق
                </p>

                <h3 className="mt-1 text-lg font-bold">
                  فواتير الكهرباء
                </h3>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-yellow-400/20 bg-yellow-400/10">

                <Zap
                  size={22}
                  className="text-yellow-400"
                />

              </div>

            </div>

            <div className="text-3xl font-black text-yellow-400">
              12,780
            </div>

            <div className="mt-1 text-xs text-gray-500">
              ريال إجمالي الفواتير
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">

              <span className="text-xs text-gray-500">
                هذا الشهر
              </span>

              <span className="text-sm font-bold text-white">
                44 فاتورة
              </span>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* LATE COLLECTIONS                                  */}
        {/* ================================================= */}

        <div className="relative overflow-hidden rounded-3xl border border-red-400/25 bg-gradient-to-br from-[#301b29] via-[#0b2039] to-[#071526] p-5 shadow-xl">

          <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-red-500/10 blur-3xl" />

          <div className="relative">

            <div className="mb-5 flex items-start justify-between">

              <div>

                <p className="text-sm text-gray-400">
                  متابعة التحصيل
                </p>

                <h3 className="mt-1 text-lg font-bold">
                  التحصيلات المتأخرة
                </h3>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10">

                <AlertCircle
                  size={22}
                  className="text-red-400"
                />

              </div>

            </div>

            <div className="text-3xl font-black text-red-400">
              18,500
            </div>

            <div className="mt-1 text-xs text-gray-500">
              ريال مستحق متأخر
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">

              <span className="text-xs text-gray-500">
                عدد الحالات
              </span>

              <span className="text-sm font-bold text-red-400">
                6 حالات
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* ===================================================== */}
      {/* BUILDING INFORMATION                                  */}
      {/* ===================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">

        <div className="rounded-2xl border border-[#173858] bg-[#0b2039] p-6 xl:col-span-2">

          <h2 className="mb-5 text-2xl font-bold text-[#f0ad18]">
            بيانات الاستثمار
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            <div className="rounded-xl bg-[#07182b] p-4">

              <div className="text-sm text-gray-400">
                الإيجار السنوي للمالك
              </div>

              <div className="mt-2 text-2xl font-bold">
                950,000 ريال
              </div>

            </div>

            <div className="rounded-xl bg-[#07182b] p-4">

              <div className="text-sm text-gray-400">
                قيمة الأثاث
              </div>

              <div className="mt-2 text-2xl font-bold">
                228,000 ريال
              </div>

            </div>

            <div className="rounded-xl bg-[#07182b] p-4">

              <div className="text-sm text-gray-400">
                الأجهزة الكهربائية
              </div>

              <div className="mt-2 text-2xl font-bold">
                130,000 ريال
              </div>

            </div>

            <div className="rounded-xl bg-[#07182b] p-4">

              <div className="text-sm text-gray-400">
                إجمالي الاستثمار
              </div>

              <div className="mt-2 text-2xl font-bold text-[#f0ad18]">
                1,308,000 ريال
              </div>

            </div>

          </div>

        </div>

        {/* OCCUPANCY */}

        <div className="rounded-2xl border border-[#173858] bg-[#0b2039] p-6">

          <h2 className="mb-6 text-2xl font-bold text-[#f0ad18]">
            حالة الإشغال
          </h2>

          <div className="mb-6 flex justify-center">

            <div className="relative flex h-44 w-44 items-center justify-center rounded-full bg-[#173858]">

              <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-[#0b2039]">

                <span className="text-3xl font-bold">
                  88.64%
                </span>

                <span className="text-sm text-gray-400">
                  نسبة الإشغال
                </span>

              </div>

            </div>

          </div>

          <div className="flex justify-between text-sm">

            <div>
              <span className="ml-2 inline-block h-3 w-3 rounded-full bg-green-500" />
              مؤجرة: 39
            </div>

            <div>
              <span className="ml-2 inline-block h-3 w-3 rounded-full bg-red-500" />
              شاغرة: 5
            </div>

          </div>

        </div>

      </div>

      {/* ===================================================== */}
      {/* APARTMENT TYPES                                       */}
      {/* ===================================================== */}

      <div className="mb-6 rounded-2xl border border-[#173858] bg-[#0b2039] p-6">

        <h2 className="mb-6 text-2xl font-bold text-[#f0ad18]">
          أنواع الشقق وأسعار الإيجار
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

          <div className="rounded-2xl border border-[#173858] bg-[#07182b] p-6">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h3 className="text-xl font-bold">
                  شقة غرفتين وصالة
                </h3>

                <p className="mt-1 text-gray-400">
                  20 شقة
                </p>

              </div>

              <div className="text-2xl font-bold text-[#f0ad18]">
                4,000
              </div>

            </div>

            <div className="text-gray-400">
              ريال / شهريًا
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#173858]">

              <div
                className="h-full bg-[#f0ad18]"
                style={{ width: "45.45%" }}
              />

            </div>

          </div>

          <div className="rounded-2xl border border-[#173858] bg-[#07182b] p-6">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h3 className="text-xl font-bold">
                  شقة غرفة وصالة
                </h3>

                <p className="mt-1 text-gray-400">
                  24 شقة
                </p>

              </div>

              <div className="text-2xl font-bold text-[#f0ad18]">
                3,000
              </div>

            </div>

            <div className="text-gray-400">
              ريال / شهريًا
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#173858]">

              <div
                className="h-full bg-[#f0ad18]"
                style={{ width: "54.55%" }}
              />

            </div>

          </div>

        </div>

      </div>

      {/* ===================================================== */}
      {/* REVENUE + FINANCIAL                                   */}
      {/* ===================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">

        <div className="rounded-2xl border border-[#173858] bg-[#0b2039] p-6">

          <h2 className="mb-6 text-2xl font-bold text-[#f0ad18]">
            الإيرادات الشهرية
          </h2>

          <div className="space-y-4">

            <div className="flex items-center justify-between border-b border-[#173858] pb-4">

              <span className="text-gray-300">
                إيرادات الشقق المؤجرة
              </span>

              <span className="text-xl font-bold">
                126,000 ريال
              </span>

            </div>

            <div className="flex items-center justify-between border-b border-[#173858] pb-4">

              <span className="text-gray-300">
                متوسط الإيراد الشهري
              </span>

              <span className="text-xl font-bold text-[#f0ad18]">
                126,000 ريال
              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-gray-300">
                الإيراد السنوي المتوقع
              </span>

              <span className="text-xl font-bold text-green-400">
                1,512,000 ريال
              </span>

            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-[#173858] bg-[#0b2039] p-6">

          <h2 className="mb-6 text-2xl font-bold text-[#f0ad18]">
            المؤشرات المالية
          </h2>

          <div className="grid grid-cols-2 gap-4">

            <div className="rounded-xl bg-[#07182b] p-5">

              <div className="text-sm text-gray-400">
                صافي الإيراد السنوي
              </div>

              <div className="mt-2 text-2xl font-bold text-green-400">
                1,512,000
              </div>

            </div>

            <div className="rounded-xl bg-[#07182b] p-5">

              <div className="text-sm text-gray-400">
                تكلفة الإيجار السنوي
              </div>

              <div className="mt-2 text-2xl font-bold text-red-400">
                950,000
              </div>

            </div>

            <div className="rounded-xl bg-[#07182b] p-5">

              <div className="text-sm text-gray-400">
                الفرق السنوي
              </div>

              <div className="mt-2 text-2xl font-bold text-[#f0ad18]">
                562,000
              </div>

            </div>

            <div className="rounded-xl bg-[#07182b] p-5">

              <div className="text-sm text-gray-400">
                مدة العقد
              </div>

              <div className="mt-2 text-2xl font-bold">
                5 سنوات
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ===================================================== */}
      {/* APARTMENT MAP                                         */}
      {/* ===================================================== */}

      <div className="rounded-2xl border border-[#173858] bg-[#0b2039] p-6">

        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>

            <h2 className="text-2xl font-bold text-[#f0ad18]">
              خريطة الشقق
            </h2>

            <p className="mt-1 text-gray-400">
              اضغط على رقم الشقة لعرض تفاصيلها
            </p>

          </div>

          <div className="flex flex-wrap gap-4 text-sm">

            <span>
              <span className="ml-2 inline-block h-3 w-3 rounded-full bg-green-500" />
              مؤجرة
            </span>

            <span>
              <span className="ml-2 inline-block h-3 w-3 rounded-full bg-blue-500" />
              مؤجرة للشركة
            </span>

            <span>
              <span className="ml-2 inline-block h-3 w-3 rounded-full bg-red-500" />
              شاغرة
            </span>

          </div>

        </div>

        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11">

          {apartments.map((apartment) => (

            <button
              key={apartment.number}
              type="button"
              onClick={() =>
                openApartment(apartment)
              }
              className={`h-12 rounded-lg border border-white/10 font-bold text-lg text-white transition duration-200 hover:scale-105 ${getApartmentColor(
                apartment.status
              )}`}
            >
              {apartment.number}
            </button>

          ))}

        </div>

      </div>

      {/* ===================================================== */}
      {/* APARTMENT DETAILS MODAL                               */}
      {/* ===================================================== */}

      {selectedApartment && (

        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md sm:p-6 lg:p-8"
          onClick={closeApartment}
        >

          <div
            className="relative my-auto w-full max-w-[1280px] overflow-hidden rounded-[28px] border border-[#d89b18]/70 bg-[#061426]/95 shadow-[0_0_80px_rgba(216,155,24,0.18)]"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* GOLD LINE */}

            <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#f6c84a] to-transparent" />

            {/* ================================================= */}
            {/* MODAL HEADER                                      */}
            {/* ================================================= */}

            <div className="relative border-b border-white/10 bg-gradient-to-r from-[#071a30] via-[#0a2038] to-[#071a30] px-6 py-5 lg:px-8">

              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex items-center gap-4">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#f0ad18]/40 bg-[#f0ad18]/10 shadow-[0_0_25px_rgba(240,173,24,0.12)]">

                    <Building2
                      size={30}
                      className="text-[#f0ad18]"
                    />

                  </div>

                  <div>

                    <h2 className="text-2xl font-bold text-[#f6c84a] lg:text-3xl">
                      تفاصيل الشقة
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                      عمارة سنتر — تبوك
                    </p>

                  </div>

                </div>

                <div className="hidden text-center lg:block">

                  <div className="text-2xl font-bold tracking-wide text-white">
                    TUMOUH STAR
                  </div>

                  <div className="text-sm text-[#d89b18]">
                    طموح ستار
                  </div>

                </div>

                <button
                  type="button"
                  onClick={closeApartment}
                  className="absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-400 lg:static"
                >
                  <X size={23} />
                </button>

              </div>

            </div>

            {/* ================================================= */}
            {/* MODAL HERO                                         */}
            {/* ================================================= */}

            <div className="grid grid-cols-1 gap-5 border-b border-white/10 bg-[#06182c] p-5 lg:grid-cols-[310px_1fr] lg:p-6">

              {/* NUMBER */}

              <div className="relative min-h-[230px] overflow-hidden rounded-3xl border border-[#d89b18]/30 bg-gradient-to-br from-[#122f4b] via-[#081b31] to-[#040c17]">

                <div className="absolute inset-0 opacity-20">

                  <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#f0ad18] blur-3xl" />

                  <div className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-blue-500 blur-3xl" />

                </div>

                <div className="relative flex h-full flex-col items-center justify-center">

                  <div className="mb-2 text-sm font-medium text-gray-400">
                    شقة رقم
                  </div>

                  <div className="text-[92px] font-black leading-none text-[#f6c84a] drop-shadow-[0_0_25px_rgba(246,200,74,0.2)]">
                    {selectedApartment.number}
                  </div>

                  <div
                    className={`mt-5 flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-bold ${
                      getStatusColor(
                        selectedApartment.status
                      ).badge
                    }`}
                  >

                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        getStatusColor(
                          selectedApartment.status
                        ).dot
                      }`}
                    />

                    {selectedApartment.status}

                  </div>

                </div>

              </div>

              {/* HERO CARDS */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <div className="rounded-2xl border border-[#2a5275] bg-white/[0.035] p-5 backdrop-blur-xl transition hover:border-[#f0ad18]/50">

                  <div className="mb-5 flex items-center justify-between">

                    <span className="text-sm text-gray-400">
                      نوع الشقة
                    </span>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/10">

                      <Home
                        size={23}
                        className="text-blue-400"
                      />

                    </div>

                  </div>

                  <div className="text-xl font-bold">
                    {selectedApartment.type}
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    وحدة سكنية مفروشة
                  </div>

                </div>

                <div className="rounded-2xl border border-[#2a5275] bg-white/[0.035] p-5 backdrop-blur-xl transition hover:border-[#f0ad18]/50">

                  <div className="mb-5 flex items-center justify-between">

                    <span className="text-sm text-gray-400">
                      قيمة الإيجار
                    </span>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#f0ad18]/20 bg-[#f0ad18]/10">

                      <Wallet
                        size={23}
                        className="text-[#f0ad18]"
                      />

                    </div>

                  </div>

                  <div className="text-2xl font-bold text-[#f6c84a]">
                    {selectedApartment.rent.toLocaleString(
                      "ar-SA"
                    )}
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    ريال / شهريًا
                  </div>

                </div>

                <div className="rounded-2xl border border-[#2a5275] bg-white/[0.035] p-5 backdrop-blur-xl transition hover:border-[#f0ad18]/50">

                  <div className="mb-5 flex items-center justify-between">

                    <span className="text-sm text-gray-400">
                      بداية العقد
                    </span>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-400/10">

                      <CalendarDays
                        size={23}
                        className="text-purple-400"
                      />

                    </div>

                  </div>

                  <div className="text-lg font-bold">
                    01 - 06 - 2025
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    تاريخ البداية
                  </div>

                </div>

                <div className="rounded-2xl border border-[#2a5275] bg-white/[0.035] p-5 backdrop-blur-xl transition hover:border-[#f0ad18]/50">

                  <div className="mb-5 flex items-center justify-between">

                    <span className="text-sm text-gray-400">
                      نهاية العقد
                    </span>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">

                      <CalendarDays
                        size={23}
                        className="text-cyan-400"
                      />

                    </div>

                  </div>

                  <div className="text-lg font-bold">
                    31 - 05 - 2026
                  </div>

                  <div className="mt-2 text-xs text-red-400">
                    يحتاج تحديث البيانات
                  </div>

                </div>

              </div>

            </div>

            {/* ================================================= */}
            {/* TABS                                               */}
            {/* ================================================= */}

            <div className="border-b border-white/10 bg-[#071a2d] px-4 py-3 lg:px-6">

              <div className="flex gap-2 overflow-x-auto pb-1">

                {apartmentTabs.map((tab) => {

                  const Icon = tab.icon;

                  const active =
                    activeTab === tab.title;

                  return (

                    <button
                      key={tab.title}
                      type="button"
                      onClick={() =>
                        setActiveTab(tab.title)
                      }
                      className={`flex min-w-fit items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                        active
                          ? "border-[#f0ad18]/60 bg-gradient-to-r from-[#f0ad18] to-[#d99a12] text-[#07182b] shadow-[0_0_20px_rgba(240,173,24,0.18)]"
                          : "border-white/10 bg-white/[0.025] text-gray-400 hover:border-[#f0ad18]/30 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >

                      <Icon size={18} />

                      {tab.title}

                    </button>

                  );
                })}

              </div>

            </div>

            {/* ================================================= */}
            {/* TAB CONTENT                                        */}
            {/* ================================================= */}

            <div className="max-h-[520px] overflow-y-auto bg-[#061426] p-5 lg:p-6">

              {/* BASIC */}

              {activeTab ===
                "البيانات الأساسية" && (

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

                  <div className="rounded-3xl border border-[#285273] bg-white/[0.025] p-5 backdrop-blur-xl">

                    <div className="mb-5 flex items-center justify-between">

                      <h3 className="text-lg font-bold">
                        حالة الشقة والمستأجر
                      </h3>

                      <User
                        size={21}
                        className="text-blue-400"
                      />

                    </div>

                    <div className="space-y-3">

                      <div className="flex items-center justify-between rounded-xl bg-[#061a2d] p-3">

                        <span className="text-sm text-gray-400">
                          الحالة الحالية
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${
                            getStatusColor(
                              selectedApartment.status
                            ).badge
                          }`}
                        >
                          {selectedApartment.status}
                        </span>

                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-[#061a2d] p-3">

                        <span className="text-sm text-gray-400">
                          اسم المستأجر
                        </span>

                        <span className="font-semibold">
                          {selectedApartment.tenant}
                        </span>

                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-[#061a2d] p-3">

                        <span className="text-sm text-gray-400">
                          رقم الجوال
                        </span>

                        <span className="font-semibold">
                          05XXXXXXXX
                        </span>

                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-[#061a2d] p-3">

                        <span className="text-sm text-gray-400">
                          عدد السكان
                        </span>

                        <span className="font-semibold">
                          4 أفراد
                        </span>

                      </div>

                    </div>

                  </div>

                  <div className="rounded-3xl border border-[#285273] bg-white/[0.025] p-5 backdrop-blur-xl">

                    <div className="mb-5 flex items-center justify-between">

                      <h3 className="text-lg font-bold">
                        معلومات إضافية
                      </h3>

                      <Info
                        size={21}
                        className="text-[#f0ad18]"
                      />

                    </div>

                    <div className="space-y-3">

                      <div className="flex items-center justify-between rounded-xl bg-[#061a2d] p-3">

                        <span className="flex items-center gap-2 text-sm text-gray-400">
                          <Car size={16} />
                          موقف سيارة
                        </span>

                        <span className="font-semibold text-green-400">
                          متوفر
                        </span>

                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-[#061a2d] p-3">

                        <span className="flex items-center gap-2 text-sm text-gray-400">
                          <Zap size={16} />
                          عداد الكهرباء
                        </span>

                        <span className="font-semibold">
                          مشترك
                        </span>

                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-[#061a2d] p-3">

                        <span className="flex items-center gap-2 text-sm text-gray-400">
                          <Droplets size={16} />
                          عداد المياه
                        </span>

                        <span className="font-semibold">
                          مشترك
                        </span>

                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-[#061a2d] p-3">

                        <span className="flex items-center gap-2 text-sm text-gray-400">
                          <Sofa size={16} />
                          حالة الأثاث
                        </span>

                        <span className="font-semibold">
                          مفروشة بالكامل
                        </span>

                      </div>

                    </div>

                  </div>

                  <div className="rounded-3xl border border-[#285273] bg-white/[0.025] p-5 backdrop-blur-xl">

                    <div className="mb-5 flex items-center justify-between">

                      <h3 className="text-lg font-bold">
                        ملخص مالي
                      </h3>

                      <Receipt
                        size={21}
                        className="text-[#f0ad18]"
                      />

                    </div>

                    <div className="space-y-4">

                      <div className="rounded-xl bg-[#061a2d] p-4">

                        <div className="text-sm text-gray-500">
                          الإيجار الشهري
                        </div>

                        <div className="mt-1 text-xl font-bold text-[#f0ad18]">
                          {selectedApartment.rent.toLocaleString(
                            "ar-SA"
                          )}{" "}
                          ريال
                        </div>

                      </div>

                      <div className="rounded-xl bg-[#061a2d] p-4">

                        <div className="text-sm text-gray-500">
                          المدفوع
                        </div>

                        <div className="mt-1 text-xl font-bold text-green-400">
                          {selectedApartment.rent.toLocaleString(
                            "ar-SA"
                          )}{" "}
                          ريال
                        </div>

                      </div>

                      <div className="rounded-xl bg-[#061a2d] p-4">

                        <div className="text-sm text-gray-500">
                          المتأخر
                        </div>

                        <div className="mt-1 text-xl font-bold text-red-400">
                          0 ريال
                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              )}

              {/* TENANT */}

              {activeTab ===
                "بيانات المستأجر" && (

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                  <div className="rounded-3xl border border-[#285273] bg-white/[0.025] p-6">

                    <div className="mb-6 flex items-center gap-3">

                      <div className="rounded-xl bg-blue-400/10 p-3 text-blue-400">
                        <User size={23} />
                      </div>

                      <div>

                        <h3 className="text-xl font-bold">
                          بيانات المستأجر
                        </h3>

                        <p className="text-sm text-gray-500">
                          المعلومات الشخصية وبيانات التواصل
                        </p>

                      </div>

                    </div>

                    <div className="grid gap-4 md:grid-cols-2">

                      <div className="rounded-xl bg-[#061a2d] p-4">
                        <div className="text-sm text-gray-500">
                          الاسم
                        </div>
                        <div className="mt-2 font-bold">
                          {selectedApartment.tenant}
                        </div>
                      </div>

                      <div className="rounded-xl bg-[#061a2d] p-4">
                        <div className="text-sm text-gray-500">
                          رقم الجوال
                        </div>
                        <div className="mt-2 font-bold">
                          05XXXXXXXX
                        </div>
                      </div>

                      <div className="rounded-xl bg-[#061a2d] p-4">
                        <div className="text-sm text-gray-500">
                          رقم الهوية
                        </div>
                        <div className="mt-2 font-bold">
                          10XXXXXXXX
                        </div>
                      </div>

                      <div className="rounded-xl bg-[#061a2d] p-4">
                        <div className="text-sm text-gray-500">
                          عدد أفراد الأسرة
                        </div>
                        <div className="mt-2 font-bold">
                          4 أفراد
                        </div>
                      </div>

                    </div>

                  </div>

                  <div className="rounded-3xl border border-[#285273] bg-white/[0.025] p-6">

                    <div className="mb-6 flex items-center gap-3">

                      <div className="rounded-xl bg-green-400/10 p-3 text-green-400">
                        <CheckCircle2 size={23} />
                      </div>

                      <div>

                        <h3 className="text-xl font-bold">
                          حالة المستأجر
                        </h3>

                        <p className="text-sm text-gray-500">
                          ملخص التعامل مع المستأجر
                        </p>

                      </div>

                    </div>

                    <div className="space-y-4">

                      <div className="flex items-center justify-between rounded-xl bg-[#061a2d] p-4">
                        <span className="text-gray-400">
                          حالة الحساب
                        </span>
                        <span className="font-bold text-green-400">
                          نشط
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-[#061a2d] p-4">
                        <span className="text-gray-400">
                          الالتزام بالسداد
                        </span>
                        <span className="font-bold text-green-400">
                          منتظم
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-[#061a2d] p-4">
                        <span className="text-gray-400">
                          آخر دفعة
                        </span>
                        <span className="font-bold">
                          01 / 05 / 2026
                        </span>
                      </div>

                    </div>

                  </div>

                </div>

              )}

              {/* CONTRACT */}

              {activeTab === "العقد" && (

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

                  <div className="rounded-3xl border border-[#285273] bg-white/[0.025] p-6">

                    <FileText
                      size={28}
                      className="mb-4 text-[#f0ad18]"
                    />

                    <div className="text-sm text-gray-500">
                      رقم العقد
                    </div>

                    <div className="mt-2 text-xl font-bold">
                      CNT-001-{selectedApartment.number}
                    </div>

                  </div>

                  <div className="rounded-3xl border border-[#285273] bg-white/[0.025] p-6">

                    <CalendarDays
                      size={28}
                      className="mb-4 text-blue-400"
                    />

                    <div className="text-sm text-gray-500">
                      بداية العقد
                    </div>

                    <div className="mt-2 text-xl font-bold">
                      01 - 06 - 2025
                    </div>

                  </div>

                  <div className="rounded-3xl border border-[#285273] bg-white/[0.025] p-6">

                    <CalendarDays
                      size={28}
                      className="mb-4 text-red-400"
                    />

                    <div className="text-sm text-gray-500">
                      نهاية العقد
                    </div>

                    <div className="mt-2 text-xl font-bold">
                      31 - 05 - 2026
                    </div>

                  </div>

                  <div className="rounded-3xl border border-[#285273] bg-white/[0.025] p-6 lg:col-span-3">

                    <h3 className="mb-5 text-xl font-bold">
                      تفاصيل العقد
                    </h3>

                    <div className="grid gap-4 md:grid-cols-3">

                      <div className="rounded-xl bg-[#061a2d] p-4">
                        <div className="text-sm text-gray-500">
                          قيمة الإيجار
                        </div>
                        <div className="mt-2 text-xl font-bold text-[#f0ad18]">
                          {selectedApartment.rent.toLocaleString(
                            "ar-SA"
                          )}{" "}
                          ريال
                        </div>
                      </div>

                      <div className="rounded-xl bg-[#061a2d] p-4">
                        <div className="text-sm text-gray-500">
                          مدة العقد
                        </div>
                        <div className="mt-2 text-xl font-bold">
                          سنة واحدة
                        </div>
                      </div>

                      <div className="rounded-xl bg-[#061a2d] p-4">
                        <div className="text-sm text-gray-500">
                          التأمين
                        </div>
                        <div className="mt-2 text-xl font-bold">
                          غير محدد
                        </div>
                      </div>

                    </div>

                  </div>

                </div>

              )}

              {/* PAYMENTS */}

              {activeTab ===
                "المدفوعات" && (

                <div className="space-y-5">

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                    <div className="rounded-3xl border border-green-400/20 bg-green-500/[0.04] p-6">
                      <div className="text-sm text-gray-400">
                        المدفوع هذا العام
                      </div>
                      <div className="mt-2 text-3xl font-bold text-green-400">
                        48,000 ريال
                      </div>
                    </div>

                    <div className="rounded-3xl border border-[#f0ad18]/20 bg-[#f0ad18]/[0.04] p-6">
                      <div className="text-sm text-gray-400">
                        قيمة الإيجار الشهري
                      </div>
                      <div className="mt-2 text-3xl font-bold text-[#f0ad18]">
                        {selectedApartment.rent.toLocaleString(
                          "ar-SA"
                        )}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-blue-400/20 bg-blue-500/[0.04] p-6">
                      <div className="text-sm text-gray-400">
                        حالة السداد
                      </div>
                      <div className="mt-2 text-2xl font-bold text-blue-400">
                        منتظم
                      </div>
                    </div>

                  </div>

                  <div className="overflow-hidden rounded-3xl border border-[#285273]">

                    <div className="border-b border-white/10 bg-[#071a2d] p-5">

                      <h3 className="text-xl font-bold">
                        سجل الدفعات
                      </h3>

                    </div>

                    <div className="divide-y divide-white/5">

                      {[
                        "01 / 05 / 2026",
                        "01 / 04 / 2026",
                        "01 / 03 / 2026",
                        "01 / 02 / 2026",
                      ].map((date) => (

                        <div
                          key={date}
                          className="flex items-center justify-between bg-[#061426] p-5"
                        >

                          <div>

                            <div className="font-bold">
                              دفعة شهرية
                            </div>

                            <div className="mt-1 text-sm text-gray-500">
                              {date}
                            </div>

                          </div>

                          <div className="font-bold text-green-400">
                            {selectedApartment.rent.toLocaleString(
                              "ar-SA"
                            )}{" "}
                            ريال
                          </div>

                        </div>

                      ))}

                    </div>

                  </div>

                </div>

              )}

              {/* DOCUMENTS */}

              {activeTab ===
                "المستندات" && (

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

                  {[
                    "عقد الإيجار",
                    "صورة الهوية",
                    "إيصال التأمين",
                    "محضر الاستلام",
                    "صور الشقة",
                    "مستندات إضافية",
                  ].map((document) => (

                    <div
                      key={document}
                      className="group rounded-3xl border border-[#285273] bg-white/[0.025] p-6 transition hover:border-[#f0ad18]/40"
                    >

                      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0ad18]/10 text-[#f0ad18]">

                        <Paperclip size={25} />

                      </div>

                      <div className="font-bold">
                        {document}
                      </div>

                      <div className="mt-2 text-sm text-gray-500">
                        لم يتم رفع المستند بعد
                      </div>

                      <button
                        type="button"
                        className="mt-5 rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-400 transition hover:border-[#f0ad18]/40 hover:text-[#f0ad18]"
                      >
                        إضافة مستند
                      </button>

                    </div>

                  ))}

                </div>

              )}

              {/* NOTES */}

              {activeTab ===
                "الملاحظات" && (

                <div className="rounded-3xl border border-[#285273] bg-white/[0.025] p-6">

                  <div className="mb-6 flex items-center gap-3">

                    <div className="rounded-xl bg-purple-400/10 p-3 text-purple-400">
                      <MessageSquare size={23} />
                    </div>

                    <div>

                      <h3 className="text-xl font-bold">
                        ملاحظات الشقة
                      </h3>

                      <p className="text-sm text-gray-500">
                        سجل الملاحظات والمعلومات المهمة
                      </p>

                    </div>

                  </div>

                  <div className="rounded-2xl border border-dashed border-white/10 bg-[#061a2d] p-10 text-center">

                    <MessageSquare
                      size={42}
                      className="mx-auto text-gray-600"
                    />

                    <div className="mt-4 text-gray-400">
                      لا توجد ملاحظات مسجلة حاليًا
                    </div>

                    <button
                      type="button"
                      className="mt-5 rounded-xl bg-[#f0ad18] px-5 py-3 font-bold text-[#07182b] transition hover:bg-[#f6c84a]"
                    >
                      + إضافة ملاحظة
                    </button>

                  </div>

                </div>

              )}

            </div>

            {/* ================================================= */}
            {/* MODAL FOOTER                                      */}
            {/* ================================================= */}

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 bg-[#050f1d] p-5 sm:flex-row sm:items-center sm:justify-between lg:px-6">

              <div className="flex flex-wrap gap-3">

                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-400/50 bg-red-500/5 px-5 py-3 font-bold text-red-400 transition hover:bg-red-500/10"
                >

                  <Trash2 size={18} />

                  أرشفة / إلغاء الشقة

                </button>

                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-blue-400/50 bg-blue-500/5 px-5 py-3 font-bold text-blue-400 transition hover:bg-blue-500/10"
                >

                  <Edit3 size={18} />

                  تعديل البيانات

                </button>

              </div>

              <button
                type="button"
                onClick={closeApartment}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#f0ad18]/60 bg-[#f0ad18]/10 px-7 py-3 font-bold text-[#f6c84a] transition hover:bg-[#f0ad18] hover:text-[#07182b]"
              >

                إغلاق

                <X size={19} />

              </button>

            </div>

          </div>

        </div>

      )}

      {/* ===================================================== */}
      {/* FOOTER                                                 */}
      {/* ===================================================== */}

      <div className="mt-6 text-center text-sm text-gray-500">
        Tumouh Star ERP System — تفاصيل عمارة سنتر
      </div>

    </div>
  );
}