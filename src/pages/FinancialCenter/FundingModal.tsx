import { useState } from "react";

import { projects } from "../../data/projects";
import { financialAccounts } from "../../data/financialAccounts";

type Props = {

  open: boolean;

  onClose: () => void;

  onSave: (funding: any) => void;

};

export default function FundingModal({

  open,

  onClose,

  onSave,

}: Props) {


  
const today = new Date().toISOString().split("T")[0];

const [entryDate] = useState(today);

const [expenseDate, setExpenseDate] = useState(today);
const [projectId, setProjectId] = useState("");
const [accountId, setAccountId] = useState("");
const [voucherNo, setVoucherNo] = useState("");

const [amount, setAmount] = useState("");

const [paymentMethod, setPaymentMethod] =
  useState("");

const [description, setDescription] =
  useState("");



const handleSave = () => {

  const funding = {

  id: crypto.randomUUID(),

  entryDate,

  fundingDate: expenseDate,

  projectId,

  accountId,

  amount: Number(amount),

  paymentMethod,

  referenceNo: voucherNo,

  notes: description,

  createdAt: new Date().toISOString(),

};

  onSave(funding);
  console.log(funding);
setExpenseDate(today);
setProjectId("");
setAccountId("");
setVoucherNo("");
setAmount("");
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
            إضافة تغذية مالية
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
  label="تاريخ التغذية"
  type="date"
  value={expenseDate}
  onChange={setExpenseDate}
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

         

          <Input
  label="رقم المرجع"
  value={voucherNo}
  onChange={setVoucherNo}
/>

          <Input
  label="مبلغ التغذية"
  type="number"
  value={amount}
  onChange={setAmount}
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
            إرفاق مستند
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
            حفظ التغذية
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

