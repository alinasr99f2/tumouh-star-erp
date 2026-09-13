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
  Image as ImageIcon,
} from "lucide-react";

type ApartmentStatus =
  | "مؤجرة"
  | "شاغرة"
  | "مؤجرة للشركة"
  | "محجوزة"
  | "تحت الصيانة";

type Apartment = {
  number: number;
  type: string;
  rent: number;
  status: ApartmentStatus;
  tenant: string;
};

type ApartmentExtraInfo = {
  floor: string;
  parking: "متوفر" | "لا يوجد" | "غير محدد";
  electricityMeter: "مشترك" | "فردي";
  waterMeter: "مشترك" | "فردي";
  furnitureStatus: "مفروشة" | "نص فرش" | "مفروشة بالكامل";
};

type ApartmentTenantInfo = {
  status: "تحت الصيانة" | "فارغة" | "محجوزة" | "مؤجرة";
  tenantName: string;
  phone: string;
  identityNumber: string;
};

const DEFAULT_APARTMENT_EXTRA_INFO: ApartmentExtraInfo = {
  floor: "",
  parking: "غير محدد",
  electricityMeter: "مشترك",
  waterMeter: "مشترك",
  furnitureStatus: "مفروشة بالكامل",
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

  // أنواع الشقق المخصصة لكل شقة + الأنواع الجديدة المحفوظة
  const [apartmentTypes, setApartmentTypes] =
    useState<Record<number, string>>(() => {
      try {
        const saved = window.localStorage.getItem(
          "tumouh_star_apartment_types"
        );
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    });

  const [customApartmentTypes, setCustomApartmentTypes] =
    useState<string[]>(() => {
      try {
        const saved = window.localStorage.getItem(
          "tumouh_star_custom_apartment_types"
        );
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    });

  const [apartmentExtraInfo, setApartmentExtraInfo] =
    useState<Record<number, ApartmentExtraInfo>>({});

  const [apartmentTenantInfo, setApartmentTenantInfo] =
    useState<Record<number, ApartmentTenantInfo>>({});

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

  const totalApartments = apartments.length;

  const rentedApartments = apartments.filter(
    (apartment) =>
      apartment.status === "مؤجرة" ||
      apartment.status === "مؤجرة للشركة"
  ).length;

  const reservedApartments = apartments.filter(
    (apartment) => apartment.status === "محجوزة"
  ).length;

  const maintenanceApartments = apartments.filter(
    (apartment) => apartment.status === "تحت الصيانة"
  ).length;

  const vacantApartments = apartments.filter(
    (apartment) => apartment.status === "شاغرة"
  ).length;

  const occupancyRate =
    totalApartments > 0
      ? ((rentedApartments / totalApartments) * 100).toFixed(2)
      : "0.00";

  const getApartmentColor = (
    status: ApartmentStatus
  ) => {
    if (status === "شاغرة") {
      return "bg-red-600 hover:bg-red-500";
    }

    if (status === "مؤجرة للشركة") {
      return "bg-blue-700 hover:bg-blue-600";
    }

    if (status === "محجوزة") {
      return "bg-blue-500 hover:bg-blue-400";
    }

    if (status === "تحت الصيانة") {
      return "bg-orange-600 hover:bg-orange-500";
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

    if (status === "محجوزة") {
      return {
        badge:
          "border-blue-400/30 bg-blue-500/10 text-blue-400",
        dot: "bg-blue-400",
      };
    }

    if (status === "تحت الصيانة") {
      return {
        badge:
          "border-orange-400/30 bg-orange-500/10 text-orange-400",
        dot: "bg-orange-400",
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

  const getApartmentExtraInfo = (
    apartmentNumber: number
  ): ApartmentExtraInfo => {
    return (
      apartmentExtraInfo[apartmentNumber] ??
      DEFAULT_APARTMENT_EXTRA_INFO
    );
  };

  const getApartmentTenantInfo = (
    apartment: Apartment
  ): ApartmentTenantInfo => {
    return (
      apartmentTenantInfo[apartment.number] ??
      {
        status: apartment.status === "شاغرة" ? "فارغة" : "مؤجرة",
        tenantName:
          apartment.status === "شاغرة"
            ? ""
            : apartment.tenant === "اسم المستأجر غير مضاف"
            ? ""
            : apartment.tenant,
        phone: "",
        identityNumber: "",
      }
    );
  };

  const updateApartmentTenantInfo = <K extends keyof ApartmentTenantInfo>(
    apartment: Apartment,
    key: K,
    value: ApartmentTenantInfo[K]
  ) => {
    setApartmentTenantInfo((current) => ({
      ...current,
      [apartment.number]: {
        ...getApartmentTenantInfo(apartment),
        [key]: value,
      },
    }));
  };

  const updateApartmentExtraInfo = <K extends keyof ApartmentExtraInfo>(
    apartmentNumber: number,
    key: K,
    value: ApartmentExtraInfo[K]
  ) => {
    setApartmentExtraInfo((current) => ({
      ...current,
      [apartmentNumber]: {
        ...getApartmentExtraInfo(apartmentNumber),
        [key]: value,
      },
    }));
  };

  const getApartmentType = (apartment: Apartment) => {
    return apartmentTypes[apartment.number] ?? apartment.type;
  };

  const updateApartmentType = (
    apartment: Apartment,
    value: string
  ) => {
    if (value === "__add_new__") {
      const newType = window.prompt(
        "اكتب اسم نوع الشقة الجديد:"
      )?.trim();

      if (!newType) {
        return;
      }

      setCustomApartmentTypes((current) => {
        const updated = current.includes(newType)
          ? current
          : [...current, newType];

        window.localStorage.setItem(
          "tumouh_star_custom_apartment_types",
          JSON.stringify(updated)
        );

        return updated;
      });

      setApartmentTypes((current) => {
        const updated = {
          ...current,
          [apartment.number]: newType,
        };

        window.localStorage.setItem(
          "tumouh_star_apartment_types",
          JSON.stringify(updated)
        );

        return updated;
      });

      return;
    }

    setApartmentTypes((current) => {
      const updated = {
        ...current,
        [apartment.number]: value,
      };

      window.localStorage.setItem(
        "tumouh_star_apartment_types",
        JSON.stringify(updated)
      );

      return updated;
    });
  };

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
      {/* BASIC INFO - 6 GLASS CARDS                            */}
      {/* ===================================================== */}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">

        {/* 1 - TOTAL APARTMENTS */}

        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-center shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-[#f0ad18]/70 hover:bg-white/[0.07] hover:shadow-[0_16px_45px_rgba(240,173,24,0.12)]">

          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f0ad18]/70 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="mb-3 flex items-center justify-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#f0ad18]/25 bg-[#f0ad18]/10">
              <Building2 size={19} className="text-[#f0ad18]" />
            </div>
            <span className="text-[11px] font-medium text-gray-500">
              01
            </span>
          </div>

          <div className="text-xs font-medium text-gray-400">
            إجمالي الشقق
          </div>

          <div className="mt-1 text-2xl font-black leading-none text-[#f0ad18]">
            {totalApartments}
          </div>

          <div className="mt-2 text-[11px] text-gray-500">
            شقة
          </div>

        </div>

        {/* 2 - RENTED */}

        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-center shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-green-400/70 hover:bg-white/[0.07] hover:shadow-[0_16px_45px_rgba(34,197,94,0.10)]">

          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-400/70 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="mb-3 flex items-center justify-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-green-400/25 bg-green-400/10">
              <User size={19} className="text-green-400" />
            </div>
            <span className="text-[11px] font-medium text-gray-500">
              02
            </span>
          </div>

          <div className="text-xs font-medium text-gray-400">
            إجمالي الشقق المؤجرة
          </div>

          <div className="mt-1 text-2xl font-black leading-none text-green-400">
            {rentedApartments}
          </div>

          <div className="mt-2 text-[11px] text-gray-500">
            شقة
          </div>

        </div>

        {/* 3 - RESERVED */}

        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-center shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-blue-400/70 hover:bg-white/[0.07] hover:shadow-[0_16px_45px_rgba(59,130,246,0.10)]">

          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/70 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="mb-3 flex items-center justify-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-400/10">
              <CalendarDays size={19} className="text-blue-400" />
            </div>
            <span className="text-[11px] font-medium text-gray-500">
              03
            </span>
          </div>

          <div className="text-xs font-medium text-gray-400">
            إجمالي الشقق المحجوزة
          </div>

          <div className="mt-1 text-2xl font-black leading-none text-blue-400">
            {reservedApartments}
          </div>

          <div className="mt-2 text-[11px] text-gray-500">
            شقة
          </div>

        </div>

        {/* 4 - MAINTENANCE */}

        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-center shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-orange-400/70 hover:bg-white/[0.07] hover:shadow-[0_16px_45px_rgba(251,146,60,0.10)]">

          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/70 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="mb-3 flex items-center justify-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-400/25 bg-orange-400/10">
              <AlertCircle size={19} className="text-orange-400" />
            </div>
            <span className="text-[11px] font-medium text-gray-500">
              04
            </span>
          </div>

          <div className="text-xs font-medium text-gray-400">
            إجمالي الشقق تحت الصيانة
          </div>

          <div className="mt-1 text-2xl font-black leading-none text-orange-400">
            {maintenanceApartments}
          </div>

          <div className="mt-2 text-[11px] text-gray-500">
            شقة
          </div>

        </div>

        {/* 5 - VACANT */}

        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-center shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-red-400/70 hover:bg-white/[0.07] hover:shadow-[0_16px_45px_rgba(248,113,113,0.10)]">

          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/70 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="mb-3 flex items-center justify-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/25 bg-red-400/10">
              <Home size={19} className="text-red-400" />
            </div>
            <span className="text-[11px] font-medium text-gray-500">
              05
            </span>
          </div>

          <div className="text-xs font-medium text-gray-400">
            إجمالي الشقق الفارغة
          </div>

          <div className="mt-1 text-2xl font-black leading-none text-red-400">
            {vacantApartments}
          </div>

          <div className="mt-2 text-[11px] text-gray-500">
            شقة
          </div>

        </div>

        {/* 6 - OCCUPANCY */}

        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-center shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-[#f6c84a]/70 hover:bg-white/[0.07] hover:shadow-[0_16px_45px_rgba(246,200,74,0.12)]">

          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f6c84a]/70 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="mb-3 flex items-center justify-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#f6c84a]/25 bg-[#f6c84a]/10">
              <CheckCircle2 size={19} className="text-[#f6c84a]" />
            </div>
            <span className="text-[11px] font-medium text-gray-500">
              06
            </span>
          </div>

          <div className="text-xs font-medium text-gray-400">
            نسبة الإشغال
          </div>

          <div className="mt-1 text-2xl font-black leading-none text-[#f6c84a]">
            {occupancyRate}%
          </div>

          <div className="mt-2 text-[11px] text-gray-500">
            من إجمالي الشقق
          </div>

        </div>

      </div>

      {/* ===================================================== */}
      {/* BUILDING INFORMATION                                  */}
      {/* ===================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">

        <div className="rounded-2xl border border-[#173858] bg-[#0b2039] p-6 xl:col-span-2">

          <h2 className="mb-5 text-center text-2xl font-bold text-[#f0ad18]">
            بيانات الاستثمار
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            <div className="rounded-xl bg-[#07182b] p-4 text-center">

              <div className="text-sm text-gray-400">
                الإيجار السنوي للمالك
              </div>

              <div className="mt-2 text-2xl font-bold">
                950,000 ريال
              </div>

            </div>

            <div className="rounded-xl bg-[#07182b] p-4 text-center">

              <div className="text-sm text-gray-400">
                قيمة الأثاث
              </div>

              <div className="mt-2 text-2xl font-bold">
                228,000 ريال
              </div>

            </div>

            <div className="rounded-xl bg-[#07182b] p-4 text-center">

              <div className="text-sm text-gray-400">
                الأجهزة الكهربائية
              </div>

              <div className="mt-2 text-2xl font-bold">
                130,000 ريال
              </div>

            </div>

            <div className="rounded-xl bg-[#07182b] p-4 text-center">

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

          <h2 className="mb-6 text-center text-2xl font-bold text-[#f0ad18]">
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

          <div className="flex justify-center gap-8 text-center text-sm">

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

        <h2 className="mb-6 text-center text-2xl font-bold text-[#f0ad18]">
          أنواع الشقق وأسعار الإيجار
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

          <div className="rounded-2xl border border-[#173858] bg-[#07182b] p-6 text-center">

            <div className="mb-4 flex items-center justify-center">

              <div className="text-center">

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

            <div className="mx-auto mt-5 h-2 max-w-[95%] overflow-hidden rounded-full bg-[#173858]">

              <div
                className="h-full bg-[#f0ad18]"
                style={{ width: "45.45%" }}
              />

            </div>

          </div>

          <div className="rounded-2xl border border-[#173858] bg-[#07182b] p-6 text-center">

            <div className="mb-4 flex items-center justify-center">

              <div className="text-center">

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

            <div className="mx-auto mt-5 h-2 max-w-[95%] overflow-hidden rounded-full bg-[#173858]">

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

            <div className="rounded-xl bg-[#07182b] p-5 text-center">

              <div className="text-sm text-gray-400">
                صافي الإيراد السنوي
              </div>

              <div className="mt-2 text-2xl font-bold text-green-400">
                1,512,000
              </div>

            </div>

            <div className="rounded-xl bg-[#07182b] p-5 text-center">

              <div className="text-sm text-gray-400">
                تكلفة الإيجار السنوي
              </div>

              <div className="mt-2 text-2xl font-bold text-red-400">
                950,000
              </div>

            </div>

            <div className="rounded-xl bg-[#07182b] p-5 text-center">

              <div className="text-sm text-gray-400">
                الفرق السنوي
              </div>

              <div className="mt-2 text-2xl font-bold text-[#f0ad18]">
                562,000
              </div>

            </div>

            <div className="rounded-xl bg-[#07182b] p-5 text-center">

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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-2 backdrop-blur-md sm:p-4"
          onClick={closeApartment}
        >

          <div
            className="relative flex max-h-[calc(100vh-16px)] w-full max-w-[1420px] flex-col overflow-hidden rounded-[28px] border border-[#d89b18]/70 bg-[#061426]/98 shadow-[0_0_80px_rgba(216,155,24,0.18)] sm:max-h-[calc(100vh-32px)]"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* GOLD LINE */}

            <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#f6c84a] to-transparent" />

            {/* ================================================= */}
            {/* MODAL HEADER                                      */}
            {/* ================================================= */}

            <div className="relative border-b border-white/10 bg-gradient-to-r from-[#050d18] via-[#0a2038] to-[#071a2d] px-5 py-3 lg:px-7">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={closeApartment}
                    aria-label="إغلاق"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <X size={23} />
                  </button>

                  <div>
                    <h2 className="text-xl font-bold text-[#f6c84a] lg:text-2xl">
                      تفاصيل الشقة
                    </h2>
                    <p className="mt-1 text-sm text-gray-400">
                      عمارة سنتر — تبوك
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div className="hidden sm:block">
                    <div className="text-xl font-black tracking-[0.08em] text-white lg:text-2xl">
                      TUMOUH STAR
                    </div>
                    <div className="text-sm font-semibold text-[#d89b18]">
                      طموح ستار
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#f0ad18]/40 bg-[#f0ad18]/10 shadow-[0_0_25px_rgba(240,173,24,0.12)]">
                    <Building2 size={25} className="text-[#f0ad18]" />
                  </div>
                </div>
              </div>
            </div>

            {/* ================================================= */}
            {/* MODAL HERO                                         */}
            {/* ================================================= */}

            <div className="grid shrink-0 grid-cols-1 gap-4 border-b border-white/10 bg-[#06182c] p-4 lg:grid-cols-[330px_1fr] lg:p-5" dir="ltr">
              <div className="relative min-h-[220px] overflow-hidden rounded-3xl border border-[#d89b18]/30 bg-[#0a1e33]">
                <img
                  src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85"
                  alt="صورة الشقة"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020813]/95 via-[#061426]/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-right" dir="rtl">
                  <div className="text-sm font-medium text-gray-300">شقة رقم</div>
                  <div className="mt-1 text-[76px] font-black leading-none text-[#f6c84a] drop-shadow-[0_0_25px_rgba(246,200,74,0.25)]">
                    {selectedApartment.number}
                  </div>
                  <div className={`mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold backdrop-blur-md ${getStatusColor(selectedApartment.status).badge}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${getStatusColor(selectedApartment.status).dot}`} />
                    {selectedApartment.status}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-[#2a5275] bg-white/[0.035] p-5 text-center backdrop-blur-xl transition hover:border-[#f0ad18]/50">
                  <div className="mb-4 flex flex-col items-center justify-center gap-2">
                    <span className="text-base font-semibold text-gray-300">
                      نوع الشقة
                    </span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/10">
                      <Home size={23} className="text-blue-400" />
                    </div>
                  </div>

                  <select
                    value={getApartmentType(selectedApartment)}
                    onChange={(event) =>
                      updateApartmentType(
                        selectedApartment,
                        event.target.value
                      )
                    }
                    className="mx-auto block w-full max-w-[230px] rounded-xl border border-white/10 bg-[#0b2039] px-3 py-2.5 text-center text-base font-bold text-white outline-none transition focus:border-blue-400/60"
                  >
                    <option value="غرفتين وصالة">
                      غرفتين وصالة
                    </option>
                    <option value="غرفة وصالة">
                      غرفة وصالة
                    </option>

                    {customApartmentTypes
                      .filter(
                        (type) =>
                          type !== "غرفتين وصالة" &&
                          type !== "غرفة وصالة"
                      )
                      .map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}

                    <option value="__add_new__">
                      + إضافة نوع جديد
                    </option>
                  </select>

                  <div className="mt-2 text-sm text-gray-500">
                    مساحة تقريبية 95 م²
                  </div>
                </div>

                <div className="rounded-2xl border border-[#2a5275] bg-white/[0.035] p-5 text-center backdrop-blur-xl transition hover:border-[#f0ad18]/50">
                  <div className="mb-4 flex flex-col items-center justify-center gap-2">
                    <span className="text-base font-semibold text-gray-300">قيمة الإيجار</span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#f0ad18]/20 bg-[#f0ad18]/10">
                      <Wallet size={23} className="text-[#f0ad18]" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-[#f6c84a]">{selectedApartment.rent.toLocaleString("ar-SA")}</div>
                  <div className="mt-2 text-sm text-gray-500">ريال / شهرياً</div>
                </div>

                <div className="rounded-2xl border border-[#2a5275] bg-white/[0.035] p-5 text-center backdrop-blur-xl transition hover:border-[#f0ad18]/50">
                  <div className="mb-4 flex flex-col items-center justify-center gap-2">
                    <span className="text-base font-semibold text-gray-300">تاريخ بداية العقد</span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-400/10">
                      <CalendarDays size={23} className="text-purple-400" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-white">01 - 06 - 2025</div>
                  <div className="mt-2 text-sm text-gray-500">منذ بداية العقد</div>
                </div>

                <div className="rounded-2xl border border-[#2a5275] bg-white/[0.035] p-5 text-center backdrop-blur-xl transition hover:border-[#f0ad18]/50">
                  <div className="mb-4 flex flex-col items-center justify-center gap-2">
                    <span className="text-base font-semibold text-gray-300">تاريخ نهاية العقد</span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                      <CalendarDays size={23} className="text-cyan-400" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-white">31 - 05 - 2026</div>
                  <div className="mt-2 text-sm font-semibold text-red-400">يحتاج تحديث البيانات</div>
                </div>
              </div>
            </div>

            {/* ================================================= */}
            {/* SECONDARY FINANCIAL / UTILITY CARDS               */}
            {/* ================================================= */}

            <div className="shrink-0 border-b border-white/10 bg-[#071a2d] p-3 lg:p-4" dir="rtl">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">

                {/* إضافة فاتورة أو مستحقات */}
                <button
                  type="button"
                  className="rounded-2xl border border-cyan-400/40 bg-cyan-400/[0.06] p-5 text-right transition hover:border-cyan-400/60 hover:bg-cyan-400/[0.10]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-gray-100">إضافة فاتورة أو مستحقات</p>
                      <p className="mt-1 text-sm text-gray-400">مياه، كهرباء أو مستحقات أخرى</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-[#07182b]">
                      <Receipt size={21} />
                    </div>
                  </div>
                  <div className="mt-4 text-base font-bold text-cyan-300">إضافة فاتورة +</div>
                </button>

                {/* إضافة تحصيل */}
                <button
                  type="button"
                  className="rounded-2xl border border-[#f0ad18]/60 bg-[#f0ad18]/10 p-5 text-right transition hover:bg-[#f0ad18]/20"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-gray-100">إضافة تحصيل إيجار</p>
                      <p className="mt-1 text-sm text-gray-400">تسجيل دفعة جديدة</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0ad18] text-[#07182b]">
                      <Plus size={22} />
                    </div>
                  </div>
                  <div className="mt-4 text-base font-bold text-[#f6c84a]">إضافة تحصيل +</div>
                </button>

                {/* إجمالي التحصيلات */}
                <div className="rounded-2xl border border-[#f0ad18]/25 bg-[#0b2039] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-200">إجمالي التحصيلات</p>
                      <p className="mt-1 text-[11px] text-gray-500">من تاريخ إلى تاريخ</p>
                    </div>
                    <Coins size={21} className="text-[#f0ad18]" />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <label className="text-[10px] text-gray-500">
                      من
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(event) => setFromDate(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#07182b] px-2 py-1.5 text-[11px] text-white outline-none focus:border-[#f0ad18]/60"
                      />
                    </label>
                    <label className="text-[10px] text-gray-500">
                      إلى
                      <input
                        type="date"
                        value={toDate}
                        onChange={(event) => setToDate(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#07182b] px-2 py-1.5 text-[11px] text-white outline-none focus:border-[#f0ad18]/60"
                      />
                    </label>
                  </div>

                  <div className="mt-3 text-2xl font-black text-green-400">
                    12,000 <span className="text-xs text-gray-500">ريال</span>
                  </div>
                </div>

                {/* فواتير المياه */}
                <div className="rounded-2xl border border-cyan-400/20 bg-[#0b2039] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-200">إجمالي فواتير المياه</p>
                      <p className="mt-1 text-xs text-cyan-300/80">تحديد الفترة</p>
                    </div>
                    <Droplets size={21} className="text-cyan-400" />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <label className="text-[10px] font-semibold text-gray-400">
                      من
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(event) => setFromDate(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#07182b] px-2 py-1.5 text-[11px] font-semibold text-white outline-none focus:border-cyan-400/60"
                      />
                    </label>
                    <label className="text-[10px] font-semibold text-gray-400">
                      إلى
                      <input
                        type="date"
                        value={toDate}
                        onChange={(event) => setToDate(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#07182b] px-2 py-1.5 text-[11px] font-semibold text-white outline-none focus:border-cyan-400/60"
                      />
                    </label>
                  </div>

                  <div className="mt-3 text-2xl font-black text-cyan-400">
                    320 <span className="text-xs font-semibold text-gray-500">ريال</span>
                  </div>
                </div>

                {/* فواتير الكهرباء */}
                <div className="rounded-2xl border border-yellow-400/20 bg-[#0b2039] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-200">إجمالي فواتير الكهرباء</p>
                      <p className="mt-1 text-xs text-yellow-300/80">تحديد الفترة</p>
                    </div>
                    <Zap size={21} className="text-yellow-400" />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <label className="text-[10px] font-semibold text-gray-400">
                      من
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(event) => setFromDate(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#07182b] px-2 py-1.5 text-[11px] font-semibold text-white outline-none focus:border-yellow-400/60"
                      />
                    </label>
                    <label className="text-[10px] font-semibold text-gray-400">
                      إلى
                      <input
                        type="date"
                        value={toDate}
                        onChange={(event) => setToDate(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#07182b] px-2 py-1.5 text-[11px] font-semibold text-white outline-none focus:border-yellow-400/60"
                      />
                    </label>
                  </div>

                  <div className="mt-3 text-2xl font-black text-yellow-400">
                    450 <span className="text-xs font-semibold text-gray-500">ريال</span>
                  </div>
                </div>

                {/* التحصيلات المتأخرة */}
                <div className="rounded-2xl border border-red-400/25 bg-[#301b29]/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-200">التحصيلات المتأخرة</p>
                      <p className="mt-1 text-xs text-gray-500">دفعة واحدة متأخرة</p>
                    </div>
                    <AlertCircle size={21} className="text-red-400" />
                  </div>
                  <div className="mt-3 text-2xl font-black text-red-400">4,000 <span className="text-xs text-gray-500">ريال</span></div>
                </div>

              </div>
            </div>

            {/* ================================================= */}
            {/* TABS                                               */}
            {/* ================================================= */}

            <div className="shrink-0 border-b border-white/10 bg-[#071a2d] px-3 py-2 lg:px-5">

              <div className="flex gap-2 overflow-x-auto">

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
                      className={`flex min-w-fit items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
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

            <div className="min-h-0 flex-1 overflow-y-auto bg-[#061426] p-4 lg:p-5">

              {/* BASIC */}

              {activeTab ===
                "البيانات الأساسية" && (

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

                  <div className="order-2 rounded-3xl border border-[#285273] bg-white/[0.025] p-6 backdrop-blur-xl lg:order-2">

                    <div className="relative mb-7 flex items-center justify-center">
                      <h3 className="text-2xl font-black text-white">
                        حالة الشقة والمستأجر
                      </h3>

                      <User
                        size={24}
                        className="absolute left-0 text-blue-400"
                      />
                    </div>

                    <div className="space-y-4">

                      {/* الحالة الحالية */}
                      <div className="flex min-h-[68px] items-center justify-between gap-5 rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="text-lg font-bold text-gray-200">
                          الحالة الحالية
                        </span>

                        <select
                          value={
                            getApartmentTenantInfo(
                              selectedApartment
                            ).status
                          }
                          onChange={(event) =>
                            updateApartmentTenantInfo(
                              selectedApartment,
                              "status",
                              event.target.value as ApartmentTenantInfo["status"]
                            )
                          }
                          className="min-w-[180px] rounded-xl border border-white/10 bg-[#0b2039] px-4 py-2.5 text-base font-bold text-white outline-none transition focus:border-[#f0ad18]/60"
                        >
                          <option value="تحت الصيانة">تحت الصيانة</option>
                          <option value="فارغة">فارغة</option>
                          <option value="محجوزة">محجوزة</option>
                          <option value="مؤجرة">مؤجرة</option>
                        </select>
                      </div>

                      {/* اسم المستأجر */}
                      <div className="flex min-h-[68px] items-center justify-between gap-5 rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="shrink-0 text-lg font-bold text-gray-200">
                          اسم المستأجر
                        </span>

                        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
                          <input
                            type="text"
                            value={
                              getApartmentTenantInfo(
                                selectedApartment
                              ).tenantName
                            }
                            onChange={(event) =>
                              updateApartmentTenantInfo(
                                selectedApartment,
                                "tenantName",
                                event.target.value
                              )
                            }
                            placeholder="اكتب اسم المستأجر"
                            className="w-full max-w-[280px] rounded-xl border border-white/10 bg-[#0b2039] px-4 py-2.5 text-right text-base font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-[#f0ad18]/60"
                          />
                          <Edit3
                            size={19}
                            className="shrink-0 text-[#f0ad18]"
                          />
                        </div>
                      </div>

                      {/* رقم الجوال */}
                      <div className="flex min-h-[68px] items-center justify-between gap-5 rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="shrink-0 text-lg font-bold text-gray-200">
                          رقم الجوال
                        </span>

                        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
                          <input
                            type="tel"
                            value={
                              getApartmentTenantInfo(
                                selectedApartment
                              ).phone
                            }
                            onChange={(event) =>
                              updateApartmentTenantInfo(
                                selectedApartment,
                                "phone",
                                event.target.value
                              )
                            }
                            placeholder="05XXXXXXXX"
                            className="w-full max-w-[280px] rounded-xl border border-white/10 bg-[#0b2039] px-4 py-2.5 text-left text-base font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-[#f0ad18]/60"
                          />
                          <Edit3
                            size={19}
                            className="shrink-0 text-[#f0ad18]"
                          />
                        </div>
                      </div>

                      {/* رقم الهوية */}
                      <div className="flex min-h-[68px] items-center justify-between gap-5 rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="shrink-0 text-lg font-bold text-gray-200">
                          رقم الهوية
                        </span>

                        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={
                              getApartmentTenantInfo(
                                selectedApartment
                              ).identityNumber
                            }
                            onChange={(event) =>
                              updateApartmentTenantInfo(
                                selectedApartment,
                                "identityNumber",
                                event.target.value
                              )
                            }
                            placeholder="اكتب رقم الهوية"
                            className="w-full max-w-[280px] rounded-xl border border-white/10 bg-[#0b2039] px-4 py-2.5 text-left text-base font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-[#f0ad18]/60"
                          />
                          <Edit3
                            size={19}
                            className="shrink-0 text-[#f0ad18]"
                          />
                        </div>
                      </div>

                    </div>

                  </div>

                  <div className="order-3 rounded-3xl border border-[#285273] bg-white/[0.025] p-5 backdrop-blur-xl lg:order-1">

                    <div className="relative mb-6 flex items-center justify-center">

                      <h3 className="text-xl font-bold text-white">
                        معلومات إضافية
                      </h3>

                      <Info
                        size={22}
                        className="absolute left-0 text-[#f0ad18]"
                      />

                    </div>

                    <div className="space-y-3">
                      {/* الدور */}
                      <div className="flex min-h-[68px] items-center justify-between gap-5 rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="flex shrink-0 items-center gap-2 text-lg font-bold text-gray-200">
                          <Building2 size={16} />
                          الدور
                        </span>

                        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                          <input
                            type="text"
                            value={
                              getApartmentExtraInfo(
                                selectedApartment.number
                              ).floor
                            }
                            onChange={(event) =>
                              updateApartmentExtraInfo(
                                selectedApartment.number,
                                "floor",
                                event.target.value
                              )
                            }
                            placeholder="اكتب الدور"
                            className="w-full max-w-[280px] rounded-xl border border-white/10 bg-[#0b2039] px-4 py-2.5 text-right text-base font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-[#f0ad18]/60"
                          />
                          <Edit3
                            size={19}
                            className="shrink-0 text-[#f0ad18]"
                          />
                        </div>
                      </div>

                      {/* موقف سيارة */}
                      <div className="flex min-h-[68px] items-center justify-between gap-5 rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="flex items-center gap-2 text-lg font-bold text-gray-200">
                          <Car size={16} />
                          موقف سيارة
                        </span>

                        <select
                          value={
                            getApartmentExtraInfo(
                              selectedApartment.number
                            ).parking
                          }
                          onChange={(event) =>
                            updateApartmentExtraInfo(
                              selectedApartment.number,
                              "parking",
                              event.target.value as ApartmentExtraInfo["parking"]
                            )
                          }
                          className="min-w-[180px] rounded-xl border border-white/10 bg-[#0b2039] px-4 py-2.5 text-base font-bold text-white outline-none transition focus:border-[#f0ad18]/60"
                        >
                          <option value="غير محدد">غير محدد</option>
                          <option value="متوفر">متوفر</option>
                          <option value="لا يوجد">لا يوجد</option>
                        </select>
                      </div>

                      {/* عداد الكهرباء */}
                      <div className="flex min-h-[68px] items-center justify-between gap-5 rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="flex items-center gap-2 text-lg font-bold text-gray-200">
                          <Zap size={16} />
                          عداد الكهرباء
                        </span>

                        <select
                          value={
                            getApartmentExtraInfo(
                              selectedApartment.number
                            ).electricityMeter
                          }
                          onChange={(event) =>
                            updateApartmentExtraInfo(
                              selectedApartment.number,
                              "electricityMeter",
                              event.target.value as ApartmentExtraInfo["electricityMeter"]
                            )
                          }
                          className="min-w-[180px] rounded-xl border border-white/10 bg-[#0b2039] px-4 py-2.5 text-base font-bold text-white outline-none transition focus:border-[#f0ad18]/60"
                        >
                          <option value="مشترك">مشترك</option>
                          <option value="فردي">فردي</option>
                        </select>
                      </div>

                      {/* عداد المياه */}
                      <div className="flex min-h-[68px] items-center justify-between gap-5 rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="flex items-center gap-2 text-lg font-bold text-gray-200">
                          <Droplets size={16} />
                          عداد المياه
                        </span>

                        <select
                          value={
                            getApartmentExtraInfo(
                              selectedApartment.number
                            ).waterMeter
                          }
                          onChange={(event) =>
                            updateApartmentExtraInfo(
                              selectedApartment.number,
                              "waterMeter",
                              event.target.value as ApartmentExtraInfo["waterMeter"]
                            )
                          }
                          className="min-w-[180px] rounded-xl border border-white/10 bg-[#0b2039] px-4 py-2.5 text-base font-bold text-white outline-none transition focus:border-[#f0ad18]/60"
                        >
                          <option value="مشترك">مشترك</option>
                          <option value="فردي">فردي</option>
                        </select>
                      </div>

                      {/* حالة الأثاث */}
                      <div className="flex min-h-[68px] items-center justify-between gap-5 rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="flex items-center gap-2 text-lg font-bold text-gray-200">
                          <Sofa size={16} />
                          حالة الأثاث
                        </span>

                        <select
                          value={
                            getApartmentExtraInfo(
                              selectedApartment.number
                            ).furnitureStatus
                          }
                          onChange={(event) =>
                            updateApartmentExtraInfo(
                              selectedApartment.number,
                              "furnitureStatus",
                              event.target.value as ApartmentExtraInfo["furnitureStatus"]
                            )
                          }
                          className="min-w-[180px] rounded-xl border border-white/10 bg-[#0b2039] px-4 py-2.5 text-base font-bold text-white outline-none transition focus:border-[#f0ad18]/60"
                        >
                          <option value="مفروشة">مفروشة</option>
                          <option value="نص فرش">نص فرش</option>
                          <option value="مفروشة بالكامل">
                            مفروشة بالكامل
                          </option>
                        </select>
                      </div>
                    </div>

                  </div>

                  <div className="order-4 rounded-3xl border border-[#285273] bg-white/[0.025] p-5 backdrop-blur-xl lg:order-3">
                    <div className="mb-5 flex items-center justify-between">
                      <h3 className="text-lg font-bold leading-relaxed">صورة الشقة</h3>
                      <ImageIcon size={21} className="text-cyan-400" />
                    </div>

                    <div className="space-y-3">
                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#061a2d]">
                        <img
                          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80"
                          alt="غرفة الشقة"
                          className="h-40 w-full object-cover"
                        />
                      </div>
                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#061a2d]">
                        <img
                          src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=80"
                          alt="مطبخ الشقة"
                          className="h-40 w-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                </div>

              )}

              {/* TENANT */}

              {activeTab ===
                "بيانات المستأجر" && (

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                  <div className="rounded-3xl border border-[#285273] bg-white/[0.025] p-7 backdrop-blur-xl">

                    <div className="mb-8 flex flex-col items-center justify-center text-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10 text-blue-400">
                        <User size={28} />
                      </div>

                      <h3 className="text-2xl font-black text-white">
                        بيانات المستأجر
                      </h3>

                      <p className="mt-2 text-base font-medium text-gray-400">
                        المعلومات الشخصية وبيانات التواصل
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">

                      {/* الاسم */}
                      <div className="rounded-2xl border border-white/5 bg-[#061a2d] p-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="text-lg font-bold text-gray-200">
                            اسم المستأجر
                          </span>
                          <Edit3 size={19} className="text-[#f0ad18]" />
                        </div>

                        <input
                          type="text"
                          value={
                            getApartmentTenantInfo(
                              selectedApartment
                            ).tenantName
                          }
                          onChange={(event) =>
                            updateApartmentTenantInfo(
                              selectedApartment,
                              "tenantName",
                              event.target.value
                            )
                          }
                          placeholder="اكتب اسم المستأجر"
                          className="w-full rounded-xl border border-white/10 bg-[#0b2039] px-4 py-3 text-right text-lg font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-[#f0ad18]/60"
                        />
                      </div>

                      {/* رقم الجوال */}
                      <div className="rounded-2xl border border-white/5 bg-[#061a2d] p-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="text-lg font-bold text-gray-200">
                            رقم الجوال
                          </span>
                          <Edit3 size={19} className="text-[#f0ad18]" />
                        </div>

                        <input
                          type="tel"
                          value={
                            getApartmentTenantInfo(
                              selectedApartment
                            ).phone
                          }
                          onChange={(event) =>
                            updateApartmentTenantInfo(
                              selectedApartment,
                              "phone",
                              event.target.value
                            )
                          }
                          placeholder="05XXXXXXXX"
                          className="w-full rounded-xl border border-white/10 bg-[#0b2039] px-4 py-3 text-left text-lg font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-[#f0ad18]/60"
                        />
                      </div>

                      {/* رقم الهوية */}
                      <div className="rounded-2xl border border-white/5 bg-[#061a2d] p-5 md:col-span-2">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="text-lg font-bold text-gray-200">
                            رقم الهوية
                          </span>
                          <Edit3 size={19} className="text-[#f0ad18]" />
                        </div>

                        <input
                          type="text"
                          inputMode="numeric"
                          value={
                            getApartmentTenantInfo(
                              selectedApartment
                            ).identityNumber
                          }
                          onChange={(event) =>
                            updateApartmentTenantInfo(
                              selectedApartment,
                              "identityNumber",
                              event.target.value
                            )
                          }
                          placeholder="اكتب رقم الهوية"
                          className="w-full rounded-xl border border-white/10 bg-[#0b2039] px-4 py-3 text-left text-lg font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-[#f0ad18]/60"
                        />
                      </div>

                    </div>

                  </div>

                  <div className="rounded-3xl border border-[#285273] bg-white/[0.025] p-7 backdrop-blur-xl">

                    <div className="mb-8 flex flex-col items-center justify-center text-center">

                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-green-400/20 bg-green-400/10 text-green-400">
                        <CheckCircle2 size={28} />
                      </div>

                      <h3 className="text-2xl font-black text-white">
                        حالة المستأجر
                      </h3>

                      <p className="mt-2 text-base font-medium text-gray-400">
                        ملخص التعامل مع المستأجر
                      </p>

                    </div>

                    <div className="space-y-4">

                      <div className="flex min-h-[70px] items-center justify-between rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="text-lg font-bold text-gray-300">
                          حالة الحساب
                        </span>
                        <span className="text-lg font-black text-green-400">
                          نشط
                        </span>
                      </div>

                      <div className="flex min-h-[70px] items-center justify-between rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="text-lg font-bold text-gray-300">
                          الالتزام بالسداد
                        </span>
                        <span className="text-lg font-black text-green-400">
                          منتظم
                        </span>
                      </div>

                      <div className="flex min-h-[70px] items-center justify-between rounded-2xl border border-white/5 bg-[#061a2d] px-5 py-4">
                        <span className="text-lg font-bold text-gray-300">
                          آخر دفعة
                        </span>
                        <span className="text-lg font-black text-white">
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

                            <div className="mt-1 text-sm leading-6 text-gray-400">
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

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-xl border border-blue-400/50 bg-blue-500/5 px-5 py-3 font-bold text-blue-400 transition hover:bg-blue-500/10"
                  >
                    <Edit3 size={18} />
                    تعديل البيانات
                  </button>

                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-xl border border-green-400/50 bg-green-500/10 px-5 py-3 font-bold text-green-400 transition hover:bg-green-500/15"
                  >
                    <CheckCircle2 size={18} />
                    حفظ
                  </button>
                </div>

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