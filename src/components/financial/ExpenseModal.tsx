import { projects } from "../../data/projects";
import { financialAccounts } from "../../data/financialAccounts";
import { expenseCategories } from "../../data/expenseCategories";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ExpenseModal({
  open,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">

      <div className="w-[950px] rounded-3xl border border-white/10 bg-[#081B33] p-8 shadow-2xl">

        {/* Header */}

        <div className="mb-8 flex items-center justify-between">

          <h2 className="text-3xl font-bold text-white">
            إضافة مصروف جديد
          </h2>

          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-red-400"
          >
            ✕
          </button>

        </div>

        {/* Form */}

        <div className="grid grid-cols-2 gap-5">

          <Input
            label="التاريخ"
            type="date"
          />

          <Input
            label="المورد"
          />

          <Select
  label="المشروع"
  options={projects.map((p) => ({
    value: p.id,
    label: p.name,
  }))}
/>

          <Select
  label="العهدة"
  options={financialAccounts
    .filter((a) => a.active)
    .map((a) => ({
      value: a.id,
      label: `${a.name} (${a.currentBalance.toLocaleString()} ريال)`,
    }))}
/>

          <Select
  label="البند"
  options={expenseCategories.map((c) => ({
    value: c.id,
    label: c.name,
  }))}
/>

          <Input
            label="رقم الفاتورة"
          />

          <Input
            label="المبلغ قبل الضريبة"
            type="number"
          />

          <Input
            label="الضريبة %"
            type="number"
          />

          <Input
            label="إجمالي الفاتورة"
            type="number"
          />

          <Select
            label="طريقة الدفع"
          />

        </div>

        {/* Description */}

        <div className="mt-6">

          <label className="mb-2 block text-sm text-gray-300">
            الوصف
          </label>

          <textarea
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-[#102947] p-4 outline-none focus:border-yellow-400"
          />

        </div>

        {/* Attachment */}

        <div className="mt-6">

          <label className="mb-2 block text-sm text-gray-300">
            إرفاق فاتورة
          </label>

          <input
            type="file"
            className="block w-full rounded-xl border border-white/10 bg-[#102947] p-3"
          />

        </div>

        {/* Buttons */}

        <div className="mt-8 flex justify-end gap-4">

          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-6 py-3 text-white hover:bg-white/5"
          >
            إلغاء
          </button>

          <button
            className="rounded-xl bg-yellow-400 px-8 py-3 font-bold text-[#081B33] hover:bg-yellow-500"
          >
            حفظ المصروف
          </button>

        </div>

      </div>

    </div>
  );
}

type InputProps = {
  label: string;
  type?: string;
};

function Input({
  label,
  type = "text",
}: InputProps) {

  return (

    <div>

      <label className="mb-2 block text-sm text-gray-300">
        {label}
      </label>

      <input
        type={type}
        className="h-12 w-full rounded-xl border border-white/10 bg-[#102947] px-4 text-white outline-none focus:border-yellow-400"
      />

    </div>

  );

}

type SelectOption = {
  value: number | string;
  label: string;
};

type SelectProps = {
  label: string;
  options?: SelectOption[];
};

function Select({
  label,
  options = [],
}: SelectProps) {
  return (
    <div>
      <label className="mb-2 block text-sm text-gray-300">
        {label}
      </label>

      <select
        className="h-12 w-full rounded-xl border border-white/10 bg-[#102947] px-4 text-white outline-none focus:border-yellow-400"
      >
        <option value="">اختر...</option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}