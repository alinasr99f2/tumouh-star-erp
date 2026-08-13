import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { projects } from "../../data/projects";
import { villas } from "../../data/villas";
import { supabase } from "../../utils/supabase";

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
const [itemId, setItemId] = useState("");

const [showAddCategory, setShowAddCategory] = useState(false);
const [showAddItem, setShowAddItem] = useState(false);

// ==========================================
// المراحل - تصميم محلي مؤقت
// سيتم ربطها بقاعدة البيانات لاحقًا من اللاب
// ==========================================
const [stages, setStages] = useState<any[]>(() => {
  try {
    const saved = localStorage.getItem("tumouh-expense-stages");
    if (saved) return JSON.parse(saved);
  } catch {}

  return [
    { id: "preliminary", name: "تمهيدي" },
    { id: "structural", name: "إنشائي" },
    { id: "finishing", name: "تشطيبي" },
    { id: "decorations", name: "ديكورات" },
  ];
});

const [stageId, setStageId] = useState("structural");
const [showAddStage, setShowAddStage] = useState(false);
const [newStageName, setNewStageName] = useState("");

const [newCategoryName, setNewCategoryName] = useState("");
const [newItemName, setNewItemName] = useState("");

const [categories, setCategories] = useState<
  { id: number; name: string }[]
>([]);

const [expenseItems, setExpenseItems] = useState<
  { id: number; name: string; category_id: number }[]
>([]);

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

useEffect(() => {
  try {
    localStorage.setItem("tumouh-expense-stages", JSON.stringify(stages));
  } catch {}
}, [stages]);

const projectVillas = useMemo(() => {
  console.log(projectId);

console.log(villas);

  if (!projectId) return [];

  return villas.filter(
    (v) => String(v.projectId) === String(projectId)
  );

}, [projectId]);
useEffect(() => {
  const loadCategoriesAndItems = async () => {
    const [
      { data: categoriesData, error: categoriesError },
      { data: itemsData, error: itemsError },
    ] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name")
        .order("id", { ascending: true }),

      supabase
        .from("expense_items")
        .select("id, name, category_id")
        .order("id", { ascending: true }),
    ]);

    if (categoriesError) {
      console.error(
        "خطأ في تحميل التصنيفات:",
        categoriesError
      );
      return;
    }

    if (itemsError) {
      console.error(
        "خطأ في تحميل البنود:",
        itemsError
      );
      return;
    }

    setCategories(categoriesData ?? []);
    setExpenseItems(itemsData ?? []);
  };

  if (open) {
    loadCategoriesAndItems();
  }
}, [open]);

const resetForm = () => {
  setExpenseDate(today);
  setSupplier("");
  setProjectId("");
  setVillaId("");
  setAccountId("");
  setStageId("structural");
  setCategoryId("");
  setItemId("");
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
itemId: itemId ? Number(itemId) : null,
    stageId,
    stageName:
      stages.find((stage) => String(stage.id) === String(stageId))?.name ?? null,
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
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">

    <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#081B33] p-8 shadow-2xl">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">

        <h2 className="text-3xl font-bold text-white">
          إضافة مصروف جديد
        </h2>

        <button
          type="button"
          onClick={onClose}
          className="text-2xl text-gray-400 transition hover:text-red-400"
        >
          ✕
        </button>

      </div>

      {/* Form */}
      <div className="grid grid-cols-2 gap-5">

        {/* تاريخ الإدخال */}
        <Input
          label="تاريخ الإدخال"
          type="date"
          value={entryDate}
          readOnly
        />

        {/* تاريخ المصروف */}
        <Input
          label="تاريخ المصروف"
          type="date"
          value={expenseDate}
          onChange={setExpenseDate}
        />

        {/* المورد */}
        <Input
          label="المورد"
          value={supplier}
          onChange={setSupplier}
        />

        {/* المشروع */}
        <Select
          label="المشروع"
          value={projectId}
          onChange={setProjectId}
          options={projects.map((p) => ({
            value: p.id,
            label: p.name,
          }))}
        />

        {/* الفيلا */}
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

        {/* المرحلة */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm text-gray-300">
              المرحلة
            </label>

            <button
              type="button"
              onClick={() => {
                setNewStageName("");
                setShowAddStage(true);
              }}
              className="
                flex h-7 w-7
                items-center justify-center
                rounded-lg
                bg-yellow-400
                font-bold
                text-[#081B33]
                transition
                hover:bg-yellow-300
              "
              title="إضافة مرحلة جديدة"
            >
              +
            </button>
          </div>

          <select
            value={stageId}
            onChange={(e) => setStageId(e.target.value)}
            className="
              h-12 w-full
              rounded-xl
              border border-white/10
              bg-[#102947]
              px-4
              text-white
              outline-none
              focus:border-yellow-400
            "
          >
            {stages.map((stage) => (
              <option
                key={stage.id}
                value={stage.id}
              >
                {stage.name}
              </option>
            ))}
          </select>
        </div>

        {/* العهدة */}
        <Select
          label="العهدة"
          value={accountId}
          onChange={setAccountId}
          showAddButton
          onAdd={() =>
            alert("زر إضافة العهدة جاهز للتصميم، وسيتم ربطه بقاعدة البيانات لاحقًا.")
          }
          options={accounts.map((account) => ({
            value: account.id,
            label: `${account.name} (${Number(
              account.currentBalance || 0
            ).toLocaleString()} ريال)`,
          }))}
        />

        {/* التصنيف */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm text-gray-300">
              التصنيف
            </label>

            <button
              type="button"
              onClick={() => setShowAddCategory(true)}
              className="
                flex h-7 w-7
                items-center justify-center
                rounded-lg
                bg-yellow-400
                font-bold
                text-[#081B33]
                transition
                hover:bg-yellow-300
              "
            >
              +
            </button>
          </div>

          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setItemId("");
            }}
            className="
              h-12 w-full
              rounded-xl
              border border-white/10
              bg-[#102947]
              px-4
              text-white
              outline-none
              focus:border-yellow-400
            "
          >
            <option value="">
              اختر التصنيف...
            </option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* البند */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm text-gray-300">
              البند
            </label>

            <button
              type="button"
              disabled={!categoryId}
              onClick={() =>
                alert("زر إضافة البند جاهز للتصميم، وسيتم ربطه بقاعدة البيانات لاحقًا.")
              }
              className="
                flex h-7 w-7
                items-center justify-center
                rounded-lg
                bg-yellow-400
                font-bold
                text-[#081B33]
                transition
                hover:bg-yellow-300
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
              title="إضافة بند"
            >
              +
            </button>
          </div>

          <select
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            disabled={!categoryId}
            className="
              h-12 w-full
              rounded-xl
              border border-white/10
              bg-[#102947]
              px-4
              text-white
              outline-none
              focus:border-yellow-400
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <option value="">
              {categoryId
                ? "اختر البند..."
                : "اختر التصنيف أولاً"}
            </option>

            {expenseItems
              .filter(
                (item) =>
                  String(item.category_id) ===
                  String(categoryId)
              )
              .map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
          </select>
        </div>

        {/* رقم الفاتورة */}
        <Input
          label="رقم الفاتورة"
          value={voucherNo}
          onChange={setVoucherNo}
        />

        {/* المبلغ قبل الضريبة */}
        <Input
          label="المبلغ قبل الضريبة"
          type="number"
          value={amount}
          onChange={setAmount}
        />

        {/* الضريبة */}
        <Input
          label="الضريبة %"
          type="number"
          value={taxPercent}
          onChange={setTaxPercent}
        />

        {/* إجمالي الفاتورة */}
        <Input
          label="إجمالي الفاتورة"
          type="number"
          value={String(total)}
          readOnly
        />

        {/* طريقة الدفع */}
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
          className="
            w-full
            rounded-xl
            border border-white/10
            bg-[#102947]
            p-4
            text-white
            outline-none
            focus:border-yellow-400
          "
        />

      </div>

      {/* Attachment */}
      <div className="mt-6">

        <label className="mb-2 block text-sm text-gray-300">
          إرفاق فاتورة
        </label>

        <input
          type="file"
          className="
            block w-full
            rounded-xl
            border border-white/10
            bg-[#102947]
            p-3
            text-white
          "
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

      {/* ==========================================
          ADD STAGE MODAL - LOCAL DESIGN ONLY
      ========================================== */}
      {showAddStage && (
        <div
          className="
            fixed inset-0 z-[120]
            flex items-center justify-center
            bg-black/70 p-4
            backdrop-blur-sm
          "
          onClick={() => setShowAddStage(false)}
        >
          <div
            className="
              w-full max-w-md
              rounded-3xl
              border border-white/10
              bg-[#081B33]
              p-7
              shadow-2xl
            "
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-extrabold text-white">
                  إضافة مرحلة جديدة
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  أضف مرحلة للمشروع لاستخدامها في المصروفات
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddStage(false)}
                className="
                  flex h-10 w-10
                  items-center justify-center
                  rounded-xl
                  border border-white/10
                  bg-white/5
                  text-xl text-gray-300
                  transition
                  hover:bg-red-500/10
                  hover:text-red-400
                "
              >
                ✕
              </button>
            </div>

            <Input
              label="اسم المرحلة"
              value={newStageName}
              onChange={setNewStageName}
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddStage(false)}
                className="
                  rounded-xl
                  border border-white/10
                  px-5 py-3
                  font-bold text-gray-300
                  transition
                  hover:bg-white/5
                  hover:text-white
                "
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={() => {
                  const name = newStageName.trim();

                  if (!name) {
                    alert("من فضلك أدخل اسم المرحلة");
                    return;
                  }

                  const newStage = {
                    id: `stage-${Date.now()}`,
                    name,
                  };

                  setStages((prev) => [...prev, newStage]);
                  setStageId(newStage.id);
                  setNewStageName("");
                  setShowAddStage(false);
                }}
                className="
                  rounded-xl
                  bg-yellow-400
                  px-6 py-3
                  font-bold
                  text-[#081B33]
                  transition
                  hover:bg-yellow-300
                "
              >
                + إضافة المرحلة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

}

type InputProps = {
  label: string;
  type?: string;
  value?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
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
        onChange={(e) => onChange?.(e.target.value)}
        className="
          h-12
          w-full
          rounded-xl
          border
          border-white/10
          bg-[#102947]
          px-4
          text-white
          outline-none
          focus:border-yellow-400
        "
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
  onChange?: (value: string) => void;
  showAddButton?: boolean;
  onAdd?: () => void;
};

function Select({
  label,
  value = "",
  options = [],
  onChange,
  showAddButton = false,
  onAdd,
}: SelectProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm text-gray-300">
          {label}
        </label>

        {showAddButton && (
          <button
            type="button"
            onClick={onAdd}
            className="
              flex h-7 w-7
              items-center justify-center
              rounded-lg
              bg-yellow-400
              font-bold
              text-[#081B33]
              transition
              hover:bg-yellow-300
            "
            title={`إضافة ${label}`}
          >
            +
          </button>
        )}
      </div>

      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="
          h-12
          w-full
          rounded-xl
          border
          border-white/10
          bg-[#102947]
          px-4
          text-white
          outline-none
          focus:border-yellow-400
        "
      >
        <option value="">
          اختر...
        </option>

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