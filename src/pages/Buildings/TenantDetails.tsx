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
    <div dir="rtl" className="min-h-screen bg-[#061426] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 rounded-3xl border border-[#d89b18]/50 bg-[#050505] p-5 shadow-xl sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-gray-300 hover:border-[#f0ad18]/50 hover:bg-[#f0ad18]/10 hover:text-[#f6c84a]"
            >
              <ArrowLeft size={18} />
              رجوع
            </button>

            <div className="text-center">
              <h1 className="text-2xl font-black text-[#f6c84a] sm:text-3xl">
                تفاصيل المستأجرين
              </h1>
              <p className="mt-1 text-sm font-semibold text-gray-400">
                قاعدة بيانات المستأجرين والعقود وبيانات الشقق
              </p>
            </div>

            <button
              type="button"
              onClick={exportCsv}
              className="flex w-fit items-center gap-2 rounded-xl border border-[#f0ad18]/40 bg-[#f0ad18]/10 px-4 py-2.5 text-sm font-black text-[#f6c84a] hover:bg-[#f0ad18]/20"
            >
              <Download size={18} />
              تصدير Excel
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-center gap-3 text-gray-400">
              <Building2 size={22} />
              <span className="font-bold">إجمالي الشقق</span>
            </div>
            <div className="mt-3 text-3xl font-black text-[#f6c84a]">
              {apartments.length}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-center gap-3 text-gray-400">
              <Users size={22} />
              <span className="font-bold">الشقق المؤجرة</span>
            </div>
            <div className="mt-3 text-3xl font-black text-green-400">
              {rentedCount}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-center gap-3 text-gray-400">
              <User size={22} />
              <span className="font-bold">الشقق الشاغرة</span>
            </div>
            <div className="mt-3 text-3xl font-black text-red-400">
              {vacantCount}
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-3xl border border-white/10 bg-white/[0.025] p-4">
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

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
          <div className="overflow-x-auto">
            <table className="min-w-[1750px] w-full text-sm">
              <thead className="bg-white/[0.04] text-[#f6c84a]">
                <tr>
                  <th className="px-3 py-4 text-right">الشقة</th>
                  <th className="px-3 py-4 text-right">النوع</th>
                  <th className="px-3 py-4 text-right">الحالة</th>
                  <th className="px-3 py-4 text-right">الإيجار</th>
                  <th className="px-3 py-4 text-right">المستأجر</th>
                  <th className="px-3 py-4 text-right">الجوال</th>
                  <th className="px-3 py-4 text-right">الهوية</th>
                  <th className="px-3 py-4 text-right">الدور</th>
                  <th className="px-3 py-4 text-right">المواقف</th>
                  <th className="px-3 py-4 text-right">عداد الكهرباء</th>
                  <th className="px-3 py-4 text-right">عداد المياه</th>
                  <th className="px-3 py-4 text-right">الفرش</th>
                  <th className="px-3 py-4 text-right">رقم العقد</th>
                  <th className="px-3 py-4 text-right">بداية العقد</th>
                  <th className="px-3 py-4 text-right">نهاية العقد</th>
                  <th className="px-3 py-4 text-right">التأمين</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="px-4 py-12 text-center text-gray-500">
                      لا توجد بيانات مطابقة للبحث.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.apartment.number}
                      className="border-t border-white/10 transition hover:bg-white/[0.025]"
                    >
                      <td className="px-3 py-4 font-black text-white">
                        {row.apartment.number}
                      </td>
                      <td className="px-3 py-4 font-bold text-gray-300">
                        {row.type}
                      </td>
                      <td className="px-3 py-4">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-gray-300">
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-4 font-black text-[#f6c84a]">
                        {formatMoney(Number(row.apartment.rent) || 0)}
                      </td>
                      <td className="px-3 py-4 font-bold text-gray-200">
                        {row.name || "غير مضاف"}
                      </td>
                      <td className="px-3 py-4 text-gray-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone size={15} />
                          {row.tenant.phone || "غير مضاف"}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-gray-400">
                        {row.tenant.identityNumber || "غير مضاف"}
                      </td>
                      <td className="px-3 py-4 text-gray-400">
                        {row.extra.floor || "غير محدد"}
                      </td>
                      <td className="px-3 py-4 text-gray-400">
                        {row.extra.parking || "غير محدد"}
                      </td>
                      <td className="px-3 py-4 text-gray-400">
                        {row.extra.electricityMeter || "غير محدد"}
                      </td>
                      <td className="px-3 py-4 text-gray-400">
                        {row.extra.waterMeter || "غير محدد"}
                      </td>
                      <td className="px-3 py-4 text-gray-400">
                        {row.extra.furnitureStatus || "غير محدد"}
                      </td>
                      <td className="px-3 py-4 font-bold text-gray-300">
                        {row.contract.contractNumber || "غير مضاف"}
                      </td>
                      <td className="px-3 py-4 text-gray-400">
                        {formatDate(row.contract.startDate)}
                      </td>
                      <td className="px-3 py-4 text-gray-400">
                        {formatDate(row.contract.endDate)}
                      </td>
                      <td className="px-3 py-4 font-bold text-gray-300">
                        {formatMoney(Number(row.contract.insuranceAmount) || 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-gray-500">
          <FileText size={15} />
          البيانات المعروضة تُقرأ مباشرة من بيانات العمائر المحفوظة في المتصفح.
        </div>
      </div>
    </div>
  );
}
