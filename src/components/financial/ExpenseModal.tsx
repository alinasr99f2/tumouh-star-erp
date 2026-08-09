import { useMemo, useState } from "react";

import { projects } from "../../data/projects";
import { expenseCategories } from "../../data/expenseCategories";
import { villas } from "../../data/villas";

type Account = {
  id: number;
  name: string;
  type: string;
  currentBalance: number;
  totalFunding: number;
  totalExpenses: number;
  operationsCount: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (expense: any) => Promise<boolean>;
  accounts: Account[];
};

export default function ExpenseModal({
  open,
  onClose,
  onSave,
  accounts,
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
const resetForm = () => {
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
};

const handleSave = async (addAnother = false) => {

  if (!accountId) {
    alert("من فضلك اختر العهدة");
    return;
  }

  if (!projectId) {
    alert("من فضلك اختر المشروع");
    return;
  }

  if (!categoryId) {
    alert("من فضلك اختر البند");
    return;
  }

  if (!amount || Number(amount) <= 0) {
    alert("من فضلك أدخل مبلغ المصروف");
    return;
  }

  const savedVillaId =
    villaId === "general" ? null : villaId;

  const expense = {
    id: crypto.randomUUID(),

    entryDate,
    expenseDate,
    supplier,
    projectId,
    villaId: savedVillaId,
    accountId: Number(accountId),
    categoryId,
    voucherNo,
    amount: Number(amount),
    tax,
    total,
    paymentMethod,
    description,
    createdAt: new Date().toISOString(),
  };

 const success = await onSave(expense);

if (!success) {
  return;
}

console.log(expense);

resetForm();

if (!addAnother) {
  onClose();
}

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
    value: "general",
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
  options={accounts.map((account) => ({
    value: account.id,
    label: `${account.name} (${Number(
      account.currentBalance || 0
    ).toLocaleString()} ريال)`,
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

        <div className="mt-8 flex justify-end gap-3">

  {/* إلغاء */}

  <button
    type="button"
    onClick={onClose}
    className="
      rounded-xl
      border border-white/10
      px-6 py-3
      font-bold
      text-white
      transition
      hover:bg-white/5
    "
  >
    إلغاء
  </button>


  {/* حفظ وإضافة مصروف آخر */}

  <button
    type="button"
    onClick={() => handleSave(true)}
    className="
      rounded-xl
      border border-green-400/30
      bg-green-500/10
      px-6 py-3
      font-bold
      text-green-400
      transition
      hover:border-green-400
      hover:bg-green-500
      hover:text-white
    "
  >
    + حفظ وإضافة آخر
  </button>


  {/* حفظ المصروف */}

  <button
    type="button"
    onClick={() => handleSave(false)}
    className="
      rounded-xl
      bg-yellow-400
      px-8 py-3
      font-bold
      text-[#081B33]
      transition
      hover:bg-yellow-300
    "
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

