import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Download,
  FileText,
  Phone,
  Search,
  User,
  Users,
} from "lucide-react";

type Apartment = {
  number: number;
  type: string;
  rent: number;
  status: string;
  tenant: string;
};

type TenantInfo = {
  status?: string;
  tenantName?: string;
  phone?: string;
  identityNumber?: string;
};

type ExtraInfo = {
  floor?: string;
  parking?: string;
  electricityMeter?: string;
  waterMeter?: string;
  furnitureStatus?: string;
};

type ContractInfo = {
  contractNumber?: string;
  startDate?: string;
  endDate?: string;
  durationUnit?: string;
  durationValue?: number;
  insuranceAmount?: number;
  insuranceNotes?: string;
};

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const saved = window.localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const formatMoney = (value: number) =>
  `${value.toLocaleString("ar-SA", { maximumFractionDigits: 2 })} ريال`;

const formatDate = (value?: string) => {
  if (!value) return "غير محدد";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
};

export default function TenantDetails() {
  const [search, setSearch] = useState("");

  const apartments = readJson<Apartment[]>(
    "tumouh_star_building_apartments",
    []
  );
  const apartmentTypes = readJson<Record<number, string>>(
    "tumouh_star_apartment_types",
    {}
  );
  const tenantInfo = readJson<Record<number, TenantInfo>>(
    "tumouh_star_apartment_tenant_info",
    {}
  );
  const extraInfo = readJson<Record<number, ExtraInfo>>(
    "tumouh_star_apartment_extra_info",
    {}
  );
  const contractInfo = readJson<Record<number, ContractInfo>>(
    "tumouh_star_apartment_contract_info",
    {}
  );

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return apartments
      .map((apartment) => {
        const tenant = tenantInfo[apartment.number] ?? {};
        const extra = extraInfo[apartment.number] ?? {};
        const contract = contractInfo[apartment.number] ?? {};

        return {
          apartment,
          tenant,
          extra,
          contract,
          type: apartmentTypes[apartment.number] ?? apartment.type,
          name:
            tenant.tenantName ||
            (apartment.tenant !== "اسم المستأجر غير مضاف"
              ? apartment.tenant
              : ""),
          status: tenant.status || apartment.status,
        };
      })
      .filter((row) => {
        if (!term) return true;

        return [
          row.apartment.number,
          row.type,
          row.name,
          row.status,
          row.tenant.phone,
          row.tenant.identityNumber,
          row.contract.contractNumber,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);
      });
  }, [apartments, apartmentTypes, tenantInfo, extraInfo, contractInfo, search]);

  const rentedCount = rows.filter(
    (row) => row.status === "مؤجرة" || row.status === "مؤجرة للشركة"
  ).length;

  const vacantCount = rows.filter((row) => row.status === "شاغرة").length;

  const exportCsv = () => {
    const header = [
      "رقم الشقة",
      "النوع",
      "الحالة",
      "الإيجار الشهري",
      "اسم المستأجر",
      "الجوال",
      "رقم الهوية",
      "الدور",
      "المواقف",
      "عداد الكهرباء",
      "عداد المياه",
      "حالة الفرش",
      "رقم العقد",
      "بداية العقد",
      "نهاية العقد",
      "التأمين",
    ];

    const body = rows.map((row) => [
      row.apartment.number,
      row.type,
      row.status,
      row.apartment.rent,
      row.name || "",
      row.tenant.phone || "",
      row.tenant.identityNumber || "",
      row.extra.floor || "",
      row.extra.parking || "",
      row.extra.electricityMeter || "",
      row.extra.waterMeter || "",
      row.extra.furnitureStatus || "",
      row.contract.contractNumber || "",
      row.contract.startDate || "",
      row.contract.endDate || "",
      row.contract.insuranceAmount ?? 0,
    ]);

    const csv = [header, ...body]
      .map((line) =>
        line
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Tenant_Details.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div dir="rtl" className="min-h-screen w-full min-w-0 overflow-x-hidden bg-[#061426] p-3 text-white sm:p-5 md:p-6">
      <div className="mx-auto w-full max-w-[1600px] min-w-0">
        <div className="mb-4 rounded-2xl border border-[#d89b18]/50 bg-[#050505] p-4 shadow-xl sm:mb-6 sm:rounded-3xl sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between sm:gap-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-gray-300 hover:border-[#f0ad18]/50 hover:bg-[#f0ad18]/10 hover:text-[#f6c84a] sm:w-fit"
            >
              <ArrowLeft size={18} />
              رجوع
            </button>

            <div className="w-full text-center">
              <h1 className="text-xl font-black text-[#f6c84a] sm:text-2xl md:text-3xl">
                تفاصيل المستأجرين
              </h1>
              <p className="mt-1 text-xs font-semibold leading-5 text-gray-400 sm:text-sm">
                قاعدة بيانات المستأجرين والعقود وبيانات الشقق
              </p>
            </div>

            <button
              type="button"
              onClick={exportCsv}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#f0ad18]/40 bg-[#f0ad18]/10 px-4 py-2.5 text-sm font-black text-[#f6c84a] hover:bg-[#f0ad18]/20 sm:w-fit"
            >
              <Download size={18} />
              تصدير Excel
            </button>
          </div>
        </div>

        <div className="mb-4 grid min-w-0 grid-cols-1 gap-3 sm:mb-6 sm:grid-cols-3 sm:gap-4">
          <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:rounded-3xl sm:p-5">
            <div className="flex items-center gap-2 text-sm text-gray-400 sm:gap-3">
              <Building2 size={22} />
              <span className="font-bold">إجمالي الشقق</span>
            </div>
            <div className="mt-2 text-2xl font-black text-[#f6c84a] sm:mt-3 sm:text-3xl">
              {apartments.length}
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:rounded-3xl sm:p-5">
            <div className="flex items-center gap-2 text-sm text-gray-400 sm:gap-3">
              <Users size={22} />
              <span className="font-bold">الشقق المؤجرة</span>
            </div>
            <div className="mt-2 text-2xl font-black text-green-400 sm:mt-3 sm:text-3xl">
              {rentedCount}
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:rounded-3xl sm:p-5">
            <div className="flex items-center gap-2 text-sm text-gray-400 sm:gap-3">
              <User size={22} />
              <span className="font-bold">الشقق الشاغرة</span>
            </div>
            <div className="mt-2 text-2xl font-black text-red-400 sm:mt-3 sm:text-3xl">
              {vacantCount}
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.025] p-3 sm:mb-5 sm:rounded-3xl sm:p-4">
          <div className="relative">
            <Search
              size={19}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث برقم الشقة أو اسم المستأجر أو الجوال أو رقم العقد..."
              className="w-full rounded-2xl border border-white/10 bg-[#07182b] px-12 py-3.5 text-sm font-bold text-white outline-none placeholder:text-gray-600 focus:border-[#f0ad18]/60"
            />
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] sm:rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-xs sm:min-w-[1750px] sm:text-sm">
              <thead className="bg-white/[0.04] text-[#f6c84a]">
                <tr>
                  <th className="px-2 py-3 text-right sm:px-3 sm:py-4">الشقة</th>
                  <th className="px-2 py-3 text-right sm:px-3 sm:py-4">النوع</th>
                  <th className="px-2 py-3 text-right sm:px-3 sm:py-4">الحالة</th>
                  <th className="px-2 py-3 text-right sm:px-3 sm:py-4">الإيجار</th>
                  <th className="px-2 py-3 text-right sm:px-3 sm:py-4">المستأجر</th>
                  <th className="px-2 py-3 text-right sm:px-3 sm:py-4">الجوال</th>
                  <th className="px-2 py-3 text-right sm:px-3 sm:py-4">الهوية</th>
                  <th className="px-2 py-3 text-right sm:px-3 sm:py-4">الدور</th>
                  <th className="px-2 py-3 text-right sm:px-3 sm:py-4">المواقف</th>
                  <th className="px-2 py-3 text-right sm:px-3 sm:py-4">عداد الكهرباء</th>
                  <th className="px-2 py-3 text-right sm:px-3 sm:py-4">عداد المياه</th>
                  <th className="px-2 py-3 text-right sm:px-3 sm:py-4">الفرش</th>
                  <th className="px-2 py-3 text-right sm:px-3 sm:py-4">رقم العقد</th>
                  <th className="px-2 py-3 text-right sm:px-3 sm:py-4">بداية العقد</th>
                  <th className="px-2 py-3 text-right sm:px-3 sm:py-4">نهاية العقد</th>
                  <th className="px-2 py-3 text-right sm:px-3 sm:py-4">التأمين</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="px-4 py-10 text-center text-sm text-gray-500 sm:py-12">
                      لا توجد بيانات مطابقة للبحث.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.apartment.number}
                      className="border-t border-white/10 transition hover:bg-white/[0.025]"
                    >
                      <td className="px-2 py-3 font-black text-white sm:px-3 sm:py-4">
                        {row.apartment.number}
                      </td>
                      <td className="px-2 py-3 font-bold text-gray-300 sm:px-3 sm:py-4">
                        {row.type}
                      </td>
                      <td className="px-3 py-4">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-gray-300">
                          {row.status}
                        </span>
                      </td>
                      <td className="px-2 py-3 font-black text-[#f6c84a] sm:px-3 sm:py-4">
                        {formatMoney(Number(row.apartment.rent) || 0)}
                      </td>
                      <td className="px-2 py-3 font-bold text-gray-200 sm:px-3 sm:py-4">
                        {row.name || "غير مضاف"}
                      </td>
                      <td className="px-2 py-3 text-gray-400 sm:px-3 sm:py-4">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone size={15} />
                          {row.tenant.phone || "غير مضاف"}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-gray-400 sm:px-3 sm:py-4">
                        {row.tenant.identityNumber || "غير مضاف"}
                      </td>
                      <td className="px-2 py-3 text-gray-400 sm:px-3 sm:py-4">
                        {row.extra.floor || "غير محدد"}
                      </td>
                      <td className="px-2 py-3 text-gray-400 sm:px-3 sm:py-4">
                        {row.extra.parking || "غير محدد"}
                      </td>
                      <td className="px-2 py-3 text-gray-400 sm:px-3 sm:py-4">
                        {row.extra.electricityMeter || "غير محدد"}
                      </td>
                      <td className="px-2 py-3 text-gray-400 sm:px-3 sm:py-4">
                        {row.extra.waterMeter || "غير محدد"}
                      </td>
                      <td className="px-2 py-3 text-gray-400 sm:px-3 sm:py-4">
                        {row.extra.furnitureStatus || "غير محدد"}
                      </td>
                      <td className="px-2 py-3 font-bold text-gray-300 sm:px-3 sm:py-4">
                        {row.contract.contractNumber || "غير مضاف"}
                      </td>
                      <td className="px-2 py-3 text-gray-400 sm:px-3 sm:py-4">
                        {formatDate(row.contract.startDate)}
                      </td>
                      <td className="px-2 py-3 text-gray-400 sm:px-3 sm:py-4">
                        {formatDate(row.contract.endDate)}
                      </td>
                      <td className="px-2 py-3 font-bold text-gray-300 sm:px-3 sm:py-4">
                        {formatMoney(Number(row.contract.insuranceAmount) || 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-center text-[11px] font-bold text-gray-500 sm:text-xs">
          <FileText size={15} />
          البيانات المعروضة تُقرأ مباشرة من بيانات العمائر المحفوظة في المتصفح.
        </div>
      </div>
    </div>
  );
}
