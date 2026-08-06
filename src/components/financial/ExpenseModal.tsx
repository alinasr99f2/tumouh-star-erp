import { useMemo, useState } from "react";

import { projects } from "../../data/projects";
import { financialAccounts } from "../../data/financialAccounts";
import { expenseCategories } from "../../data/expenseCategories";
import { villas } from "../../data/villas";

type Props = {

  open: boolean;

  onClose: () => void;

  onSave: (expense: any) => void;

};

export default function ExpenseModal({

  open,

  onClose,

  onSave,

}: Props) {


  
const today = new Date().toISOString().split("T")[0];

const [entryDate] = useState(today);

const [expenseDate, setExpenseDate] = useState(today);
const [supplier, setSupplier] = useState("");
const [projectId, setProjectId] = useState("");
const [villaCode, setVillaCode] = useState("");
const [villaId, setVillaId] = useState("");
const [accountId, setAccountId] = useState("");
const [categoryId, setCategoryId] = useState("");
const [voucherNo, setVoucherNo] = useState("");

const [amount, setAmount] = useState("");
const [taxPercent, setTaxPercent] = useState("15");

const [paymentMethod, setPaymentMethod] =
  useState("");

const [description, setDescription] =
  useState("");

const tax = useMemo(() => {
  const value = Number(amount || 0);
  return value * Number(taxPercent || 0) / 100;
}, [amount, taxPercent]);

const total = useMemo(() => {
  return Number(amount || 0) + tax;
}, [amount, tax]);

const projectVillas = useMemo(() => {
  console.log(projectId);

console.log(villas);

  if (!projectId) return [];

  return villas.filter(
    (v) => String(v.projectId) === String(projectId)
  );

}, [projectId]);
const handleSave = () => {

  const expense = {

    id: crypto.randomUUID(),

    entryDate,
expenseDate,

    supplier,

    projectId,

    villaId,

    accountId,

    categoryId,

    voucherNo,

    amount: Number(amount),

    tax,

    total,

    paymentMethod,

    description,

    createdAt: new Date().toISOString(),

  };

  onSave(expense);
  console.log(expense);
setExpenseDate(today);
setSupplier("");
setProjectId("");
setVillaId("");
setAccountId("");
setCategoryId("");
setVoucherNo("");
setAmount("");
setTaxPercent("15");
setPaymentMethod("");
setDescription("");
  onClose();

};

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
  label="تاريخ الإدخال"
  type="date"
  value={entryDate}
  readOnly
/>

<Input
  label="تاريخ المصروف"
  type="date"
  value={expenseDate}
  onChange={setExpenseDate}
/>

          <Input
  label="المورد"
  value={supplier}
  onChange={setSupplier}
/>

         <Select
  label="المشروع"
  value={projectId}
  onChange={setProjectId}
  options={projects.map((p) => ({
    value: p.id,
    label: p.name,
  }))}
/>
<Select
  label="الفيلا"

  value={villaId}

  onChange={setVillaId}

  options={[
    {
      value: "",
      label: "🏘️ مصروف عام على المشروع",
    },

    ...projectVillas.map((villa) => ({
      value: villa.code,
label: `${villa.block} - فيلا ${villa.code}`,
    })),
  ]}
/>
<Select
  label="العهدة"
  value={accountId}
  onChange={setAccountId}
  options={financialAccounts
    .filter((a) => a.active)
    .map((a) => ({
      value: a.id,
      label: `${a.name} (${a.currentBalance.toLocaleString()} ريال)`,
    }))}
/>

          <Select
  label="البند"
  value={categoryId}
  onChange={setCategoryId}
  options={expenseCategories.map((c) => ({
    value: c.id,
    label: c.name,
  }))}
/>

          <Input
  label="رقم الفاتورة"
  value={voucherNo}
  onChange={setVoucherNo}
/>

          <Input
  label="المبلغ قبل الضريبة"
  type="number"
  value={amount}
  onChange={setAmount}
/>

         <Input
  label="الضريبة %"
  type="number"
  value={taxPercent}
  onChange={setTaxPercent}
/>

          <Input
  label="إجمالي الفاتورة"
  type="number"
  value={String(total)}
  readOnly
/>

          <Select
  label="طريقة الدفع"
  value={paymentMethod}
  onChange={setPaymentMethod}
  options={[
    {
      value: "cash",
      label: "💵 نقدًا",
    },
    {
      value: "bank",
      label: "🏦 تحويل بنكي",
    },
    {
      value: "card",
      label: "💳 بطاقة",
    },
  ]}
/>

        </div>

        {/* Description */}

        <div className="mt-6">

          <label className="mb-2 block text-sm text-gray-300">
            الوصف
          </label>

          <textarea
  rows={4}
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  className="w-full rounded-xl border border-white/10 bg-[#102947] p-4 text-white outline-none focus:border-yellow-400"
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

  onClick={handleSave}

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

  value?: string;

  readOnly?: boolean;

  onChange?: (
    value: string
  ) => void;

};

function Input({

  label,

  type = "text",

  value = "",

  readOnly = false,

  onChange,

}: InputProps) {

  return (

    <div>

      <label className="mb-2 block text-sm text-gray-300">

        {label}

      </label>

      <input

        type={type}

        value={value}

        readOnly={readOnly}

        onChange={(e)=>

          onChange?.(
            e.target.value
          )

        }

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

  value?: string;

  options?: SelectOption[];

  onChange?: (
    value: string
  ) => void;

};

function Select({

  label,

  value = "",

  options = [],

  onChange,

}: SelectProps) {

  return (

    <div>

      <label className="mb-2 block text-sm text-gray-300">

        {label}

      </label>

      <select

        value={value}

        onChange={(e)=>

          onChange?.(
            e.target.value
          )

        }

        className="h-12 w-full rounded-xl border border-white/10 bg-[#102947] px-4 text-white outline-none focus:border-yellow-400"

      >

        <option value="">

          اختر...

        </option>

        {options.map((option)=>(

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

