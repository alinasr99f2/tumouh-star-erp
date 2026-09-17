import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Edit3,
  FileText,
  RefreshCw,
  Search,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";

type BuildingCharge = {
  type: string;
  amount: string;
  date: string;
  notes: string;
  apartmentNumber?: number;
  rentMonths?: number;
};

const formatMoney = (value: number) =>
  `${value.toLocaleString("ar-SA", { maximumFractionDigits: 2 })} ريال`;

const formatDate = (value: string) => {
  if (!value) return "غير محدد";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
};

const readCharges = (key: string): BuildingCharge[] => {
  try {
    const saved = window.localStorage.getItem(key);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function FinancialDetails() {
  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState("2026-09-30");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [editing, setEditing] = useState<{
    key: "tumouh_star_building_charges" | "tumouh_star_building_collections";
    index: number;
    item: BuildingCharge;
  } | null>(null);

  const data = useMemo(() => {
    void refreshKey;

    const charges = readCharges("tumouh_star_building_charges").map((item, index) => ({
      ...item,
      source: "مستحق",
      storageKey: "tumouh_star_building_charges" as const,
      index,
    }));

    const collections = readCharges("tumouh_star_building_collections").map(
      (item, index) => ({
        ...item,
        source: "تحصيل",
        storageKey: "tumouh_star_building_collections" as const,
        index,
      })
    );

    return [...charges, ...collections]
      .filter((item) => {
        if (item.date && (item.date < fromDate || item.date > toDate)) {
          return false;
        }

        const term = search.trim().toLowerCase();
        if (!term) return true;

        return (
          String(item.apartmentNumber ?? "").includes(term) ||
          item.type.toLowerCase().includes(term) ||
          item.notes.toLowerCase().includes(term) ||
          item.source.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [fromDate, toDate, search, refreshKey]);

  const totals = useMemo(() => {
    const allCharges = readCharges("tumouh_star_building_charges").filter(
      (item) => !item.date || (item.date >= fromDate && item.date <= toDate)
    );
    const allCollections = readCharges("tumouh_star_building_collections").filter(
      (item) => !item.date || (item.date >= fromDate && item.date <= toDate)
    );

    const due = allCharges.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const collected = allCollections.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );

    return {
      due,
      collected,
      remaining: Math.max(due - collected, 0),
      operations: allCharges.length + allCollections.length,
    };
  }, [fromDate, toDate, refreshKey]);

  const deleteItem = (
    key: "tumouh_star_building_charges" | "tumouh_star_building_collections",
    index: number
  ) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه العملية؟")) return;

    const items = readCharges(key);
    items.splice(index, 1);
    window.localStorage.setItem(key, JSON.stringify(items));
    setRefreshKey((value) => value + 1);
  };

  const saveEdit = () => {
    if (!editing) return;

    const items = readCharges(editing.key);
    items[editing.index] = editing.item;
    window.localStorage.setItem(editing.key, JSON.stringify(items));
    setEditing(null);
    setRefreshKey((value) => value + 1);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#061426] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border border-[#d89b18]/50 bg-[#050505] p-5 shadow-xl sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-gray-300 transition hover:border-[#f0ad18]/50 hover:bg-[#f0ad18]/10 hover:text-[#f6c84a]"
            >
              <ArrowLeft size={18} />
              رجوع
            </button>

            <div className="text-center">
              <h1 className="text-2xl font-black text-[#f6c84a] sm:text-3xl">
                تفاصيل الحركات المالية
              </h1>
              <p className="mt-1 text-sm font-semibold text-gray-400">
                المستحقات والتحصيلات المسجلة للعمارة حسب الفترة المحددة
              </p>
            </div>

            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              className="flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-gray-300 transition hover:border-[#f0ad18]/50 hover:bg-[#f0ad18]/10 hover:text-[#f6c84a]"
            >
              <RefreshCw size={18} />
              تحديث
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-center gap-3 text-gray-400">
              <CircleDollarSign size={22} />
              <span className="font-bold">إجمالي المستحقات</span>
            </div>
            <div className="mt-3 text-2xl font-black text-[#f6c84a]">
              {formatMoney(totals.due)}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-center gap-3 text-gray-400">
              <WalletCards size={22} />
              <span className="font-bold">إجمالي المحصل</span>
            </div>
            <div className="mt-3 text-2xl font-black text-green-400">
              {formatMoney(totals.collected)}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-center gap-3 text-gray-400">
              <CircleDollarSign size={22} />
              <span className="font-bold">المتبقي</span>
            </div>
            <div className="mt-3 text-2xl font-black text-red-400">
              {formatMoney(totals.remaining)}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-center gap-3 text-gray-400">
              <FileText size={22} />
              <span className="font-bold">عدد العمليات</span>
            </div>
            <div className="mt-3 text-2xl font-black text-white">
              {totals.operations}
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-3xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="text-center text-xs font-bold text-gray-400">
              من تاريخ
              <div className="relative mt-1.5">
                <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={17} />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#07182b] px-10 py-2.5 text-center text-sm font-bold text-white outline-none focus:border-[#f0ad18]/60"
                />
              </div>
            </label>

            <label className="text-center text-xs font-bold text-gray-400">
              إلى تاريخ
              <div className="relative mt-1.5">
                <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={17} />
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#07182b] px-10 py-2.5 text-center text-sm font-bold text-white outline-none focus:border-[#f0ad18]/60"
                />
              </div>
            </label>

            <label className="text-center text-xs font-bold text-gray-400">
              بحث
              <div className="relative mt-1.5">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={17} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="رقم الشقة أو نوع العملية..."
                  className="w-full rounded-xl border border-white/10 bg-[#07182b] px-10 py-2.5 text-center text-sm font-bold text-white outline-none placeholder:text-gray-600 focus:border-[#f0ad18]/60"
                />
              </div>
            </label>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
          <div className="overflow-x-auto">
            <table className="min-w-[950px] w-full text-sm">
              <thead className="bg-white/[0.04] text-[#f6c84a]">
                <tr>
                  <th className="px-4 py-4 text-right">التاريخ</th>
                  <th className="px-4 py-4 text-right">النوع</th>
                  <th className="px-4 py-4 text-right">الشقة</th>
                  <th className="px-4 py-4 text-right">الحركة</th>
                  <th className="px-4 py-4 text-right">المبلغ</th>
                  <th className="px-4 py-4 text-right">الملاحظات</th>
                  <th className="px-4 py-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      لا توجد عمليات في الفترة المحددة.
                    </td>
                  </tr>
                ) : (
                  data.map((item, rowIndex) => (
                    <tr key={`${item.storageKey}-${item.index}-${rowIndex}`} className="border-t border-white/10">
                      <td className="px-4 py-4 font-bold text-gray-300">{formatDate(item.date)}</td>
                      <td className="px-4 py-4 font-bold text-gray-300">{item.type || "غير محدد"}</td>
                      <td className="px-4 py-4 font-black text-white">{item.apartmentNumber ?? "العمارة"}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full border px-3 py-1 text-xs font-black ${
                          item.source === "تحصيل"
                            ? "border-green-400/30 bg-green-500/10 text-green-400"
                            : "border-red-400/30 bg-red-500/10 text-red-400"
                        }`}>
                          {item.source}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-black text-[#f6c84a]">
                        {formatMoney(Number(item.amount) || 0)}
                      </td>
                      <td className="max-w-[320px] px-4 py-4 text-gray-400">
                        {item.notes || "لا توجد ملاحظات"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setEditing({
                                key: item.storageKey,
                                index: item.index,
                                item: {
                                  type: item.type,
                                  amount: item.amount,
                                  date: item.date,
                                  notes: item.notes,
                                  apartmentNumber: item.apartmentNumber,
                                  rentMonths: item.rentMonths,
                                },
                              })
                            }
                            className="rounded-lg border border-blue-400/30 bg-blue-500/10 p-2 text-blue-300 hover:bg-blue-500/20"
                            title="تعديل"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteItem(item.storageKey, item.index)}
                            className="rounded-lg border border-red-400/30 bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20"
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-[#f0ad18]/30 bg-[#07182b] p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black text-[#f6c84a]">تعديل العملية</h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <label className="text-sm font-bold text-gray-400">
                نوع العملية
                <input
                  value={editing.item.type}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      item: { ...editing.item, type: event.target.value },
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#061426] px-4 py-3 text-white outline-none focus:border-[#f0ad18]/60"
                />
              </label>

              <label className="text-sm font-bold text-gray-400">
                المبلغ
                <input
                  type="number"
                  value={editing.item.amount}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      item: { ...editing.item, amount: event.target.value },
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#061426] px-4 py-3 text-white outline-none focus:border-[#f0ad18]/60"
                />
              </label>

              <label className="text-sm font-bold text-gray-400">
                التاريخ
                <input
                  type="date"
                  value={editing.item.date}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      item: { ...editing.item, date: event.target.value },
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#061426] px-4 py-3 text-white outline-none focus:border-[#f0ad18]/60"
                />
              </label>

              <label className="text-sm font-bold text-gray-400">
                الملاحظات
                <textarea
                  value={editing.item.notes}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      item: { ...editing.item, notes: event.target.value },
                    })
                  }
                  rows={4}
                  className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-[#061426] px-4 py-3 text-white outline-none focus:border-[#f0ad18]/60"
                />
              </label>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-black text-gray-300 hover:bg-white/10"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="rounded-xl bg-[#f0ad18] px-4 py-3 font-black text-black hover:bg-[#f6c84a]"
              >
                حفظ التعديل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
