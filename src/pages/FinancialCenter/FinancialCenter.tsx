import { useEffect, useState } from "react";

import {
  Receipt,
  Wallet,
  Landmark,
  FolderTree,
} from "lucide-react";

import ExpensesPage from "./ExpensesPage";
import AccountsPage from "./AccountsPage";
import FundingPage from "./FundingPage";
import CategoriesPage from "./CategoriesPage";

import { supabase } from "../../utils/supabase";
import { financialEngine } from "../../core/engine/financial.engine";
import ExpenseModal from "../../components/financial/ExpenseModal";
import FundingModal from "./FundingModal";


import { projects } from "../../data/projects";
import { expenseDistributions }
from "../../data/expenseDistributions";
import {
  applyFunding,
  createLedgerEntry,
} from "../../services/financialEngine";
import { distributionEngine } from "../../core/engine/distribution.engine";


type Tab =
  | "expenses"
  | "accounts"
  | "funding"
  | "categories";

export default function FinancialCenter() {

  const [activeTab, setActiveTab] =
    useState<Tab>("expenses");

  const [openExpenseModal, setOpenExpenseModal] =
    useState(false);

  const [openFundingModal, setOpenFundingModal] =
    useState(false);
  const [selectedAccountId, setSelectedAccountId] =
  useState<number | null>(null);

const [selectedAccount, setSelectedAccount] =
  useState<any | null>(null);


  const [expenses, setExpenses] =
    useState<any[]>([]);

  const [funding, setFunding] =
    useState<any[]>([]);

  const [ledger, setLedger] =
    useState<any[]>([]);

  const [accounts, setAccounts] =
useState<any[]>([]);

  const [categories, setCategories] =
    useState<any[]>([]);

  const [expenseItems, setExpenseItems] =
    useState<any[]>([]);
const [openAccountModal, setOpenAccountModal] =
  useState(false);

const [newAccountName, setNewAccountName] =
  useState("");

const [newAccountType, setNewAccountType] =
  useState("عهدة");
useEffect(() => {
  const loadAccounts = async () => {
  const [
    { data: accountsData, error: accountsError },
    { data: fundingData, error: fundingError },
    { data: expensesData, error: expensesError },
    { data: categoriesData, error: categoriesError },
    { data: itemsData, error: itemsError },
  ] = await Promise.all([
    supabase
      .from("accounts")
      .select("*")
      .order("id", { ascending: true }),

    supabase
      .from("funding")
      .select("id, account_id, amount"),

    supabase
      .from("expenses")
      .select("*")
      .order("id", { ascending: false }),

    supabase
      .from("categories")
      .select("id, name")
      .order("id", { ascending: true }),

    supabase
      .from("expense_items")
      .select("id, name, category_id")
      .order("id", { ascending: true }),
  ]);
console.log("ACCOUNTS FROM SUPABASE:", accountsData);
console.log("ACCOUNTS ERROR:", accountsError);
  if (accountsError) {
    console.error("خطأ في تحميل الحسابات:", accountsError);
    return;
  }

  if (fundingError) {
    console.error("خطأ في تحميل التغذية:", fundingError);
    return;
  }

  if (expensesError) {
  console.error("خطأ في تحميل المصروفات:", expensesError);
}

  if (categoriesError) {
    console.error("خطأ في تحميل التصنيفات:", categoriesError);
  } else {
    setCategories(categoriesData ?? []);
  }

  if (itemsError) {
    console.error("خطأ في تحميل البنود:", itemsError);
  } else {
    setExpenseItems(itemsData ?? []);
  }

  const fundingRows = fundingData ?? [];
  const expenseRows = expensesData ?? [];

  setExpenses(expenseRows);
  const formattedAccounts = (accountsData ?? []).map((account) => {

    const accountFunding = fundingRows.filter(
      (item) =>
        Number(item.account_id) === Number(account.id)
    );

    const accountExpenses = expenseRows.filter(
      (item) =>
        Number(item.account_id) === Number(account.id)
    );

    const totalFunding = accountFunding.reduce(
      (sum, item) =>
        sum + Number(item.amount ?? 0),
      0
    );

    const totalExpenses = accountExpenses.reduce(
  (sum, item) =>
    sum + Number(item.total ?? 0),
  0
);

    const operationsCount =
      accountFunding.length +
      accountExpenses.length;

    return {
  id: account.id,
  name: account.name,
  type: account.type ?? "عهدة",
  currentBalance: Number(account.balance ?? 0),
 totalFunding: totalFunding,
totalExpenses: totalExpenses,

operationsCount: operationsCount,
};
  });

  setAccounts(formattedAccounts);
};
const loadFunding = async () => {
  const { data, error } = await supabase
    .from("funding")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error("خطأ في تحميل عمليات التغذية:", error);
    return;
  }

  if (data) {
    setFunding(data);
  }
};
  loadAccounts();
  loadFunding();
}, []);

  const handleSaveExpense = async (
  expense: any
): Promise<boolean> => {
  try {
    // 1️⃣ التأكد من اختيار العهدة
    if (!expense.accountId) {
      alert("من فضلك اختر العهدة التي تم دفع المصروف منها");
      return false;
    }

    const accountId = Number(expense.accountId);
    const expenseTotal = Number(expense.total ?? 0);

    if (!expenseTotal || expenseTotal <= 0) {
      alert("من فضلك أدخل مبلغ المصروف");
      return false;
    }

    // 2️⃣ الحصول على العهدة الحالية
    const account = accounts.find(
      (item) => Number(item.id) === accountId
    );

    if (!account) {
      alert("العهدة المختارة غير موجودة");
      return false;
    }

    const currentBalance = Number(
      account.currentBalance ?? 0
    );

    // 3️⃣ التأكد من وجود رصيد كافٍ
    if (expenseTotal > currentBalance) {
      alert(
        `رصيد العهدة غير كافٍ.\nالرصيد الحالي: ${currentBalance.toLocaleString()} ريال`
      );
      return false;
    }

    // 4️⃣ حفظ المصروف في Supabase
    const { data: savedExpense, error: expenseError } =
      await supabase
        .from("expenses")
        .insert([
          {
            entry_date: expense.entryDate || null,

            expense_date: expense.expenseDate || null,

            supplier: expense.supplier || null,

            project_id: expense.projectId
              ? Number(expense.projectId)
              : null,

            villa_id: expense.villaId || null,

            account_id: accountId,

            category_id: expense.categoryId
              ? Number(expense.categoryId)
              : null,

            item_id: expense.itemId
              ? Number(expense.itemId)
              : null,

            voucher_no: expense.voucherNo || null,

            amount: Number(expense.amount ?? 0),

            tax: Number(expense.tax ?? 0),

            total: expenseTotal,

            payment_method:
              expense.paymentMethod || null,

            description:
              expense.description || null,
          },
        ])
        .select()
        .single();

    if (expenseError) {
      console.error(
        "خطأ في حفظ المصروف:",
        expenseError
      );

      alert(
        `حدث خطأ أثناء حفظ المصروف:\n${expenseError.message}`
      );

      return false;
    }

    // 5️⃣ حساب الرصيد الجديد للعهدة
    const newBalance =
      currentBalance - expenseTotal;

    // 6️⃣ تحديث رصيد العهدة في Supabase
    const { error: accountError } =
      await supabase
        .from("accounts")
        .update({
          balance: newBalance,
        })
        .eq("id", accountId);

    if (accountError) {
      console.error(
        "خطأ في تحديث رصيد العهدة:",
        accountError
      );

      alert(
        "تم تسجيل المصروف لكن حدث خطأ أثناء تحديث رصيد العهدة"
      );

      return false;
    }

    // 7️⃣ تجهيز البيانات بالشكل الذي يفهمه جدول المصروفات
    const finalExpense = {
      id: savedExpense?.id ?? expense.id,

      entryDate:
        savedExpense?.entry_date ??
        expense.entryDate ??
        "-",

      expenseDate:
        savedExpense?.expense_date ??
        expense.expenseDate ??
        "-",

      supplier:
        savedExpense?.supplier ??
        expense.supplier ??
        "",

      projectId:
        savedExpense?.project_id ??
        expense.projectId ??
        "",

      villaId:
        savedExpense?.villa_id ??
        expense.villaId ??
        null,

      accountId:
        savedExpense?.account_id ??
        accountId,

      categoryId:
        savedExpense?.category_id ??
        expense.categoryId ??
        "",

      itemId:
        savedExpense?.item_id ??
        expense.itemId ??
        null,

      voucherNo:
        savedExpense?.voucher_no ??
        expense.voucherNo ??
        "",

      amount:
        Number(
          savedExpense?.amount ??
          expense.amount ??
          0
        ),

      tax:
        Number(
          savedExpense?.tax ??
          expense.tax ??
          0
        ),

      total:
        Number(
          savedExpense?.total ??
          expenseTotal
        ),

      paymentMethod:
        savedExpense?.payment_method ??
        expense.paymentMethod ??
        "",

      description:
        savedExpense?.description ??
        expense.description ??
        "",
    };

    // 8️⃣ تحديث جدول المصروفات على الشاشة
    setExpenses((prev) => [
      ...prev,
      finalExpense,
    ]);

    // 9️⃣ تحديث سجل العمليات
    setLedger((prev) => [
      ...prev,
      createLedgerEntry(
        "expense",
        finalExpense
      ),
    ]);

    // 🔟 تحديث بيانات العهدة على الشاشة
    setAccounts((prev) =>
      prev.map((item) =>
        Number(item.id) === accountId
          ? {
              ...item,
              currentBalance: newBalance,
              totalExpenses:
                Number(item.totalExpenses ?? 0) +
                expenseTotal,
              operationsCount:
                Number(item.operationsCount ?? 0) +
                1,
            }
          : item
      )
    );

    // 1️⃣1️⃣ توزيع المصروف على المشاريع
    const distribution =
      distributionEngine.distributeExpense(
        finalExpense,
        projects
      );

    if (Array.isArray(distribution)) {
      expenseDistributions.push(
        ...distribution
      );
    } else if (distribution) {
      expenseDistributions.push(
        distribution
      );
    }

    console.log(
      "تم حفظ المصروف:",
      finalExpense
    );

    console.log(
      "الرصيد الجديد للعهدة:",
      newBalance
    );

    // إغلاق نافذة المصروف
    setOpenExpenseModal(false);

    return true;

  } catch (error) {
    console.error(
      "خطأ غير متوقع أثناء حفظ المصروف:",
      error
    );

    alert(
      "حدث خطأ غير متوقع أثناء حفظ المصروف"
    );

    return false;
  }
};

  
  const handleSaveFunding = async (item: any) => {
  try {
    // 1️⃣ حفظ عملية التغذية في Supabase
    const { data, error } = await supabase
      .from("funding")
      .insert([
        {
          account_id: item.accountId,
          amount: Number(item.amount),
          funding_date: item.fundingDate,
          source: item.source ?? null,
          description: item.description ?? null,
          project_id: null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("خطأ في حفظ التغذية:", error);
      alert("حدث خطأ أثناء حفظ التغذية");
      return;
    }

    // 2️⃣ إضافة العملية للقائمة الحالية
    setFunding((prev) => [
      ...prev,
      data,
    ]);

    // 3️⃣ تحديث سجل الحركات
    setLedger((prev) => [
      ...prev,
      createLedgerEntry("funding", data),
    ]);

    // 4️⃣ تحديث رصيد العهدة في الشاشة
    setAccounts((prev) =>
      prev.map((account) =>
        Number(account.id) === Number(item.accountId)
          ? {
              ...account,
              currentBalance:
                Number(account.currentBalance) +
                Number(item.amount),
              totalFunding:
                Number(account.totalFunding) +
                Number(item.amount),
            }
          : account
      )
    );

    // 5️⃣ تحديث الرصيد فعليًا داخل جدول accounts
    const account = accounts.find(
      (a) => Number(a.id) === Number(item.accountId)
    );

    if (account) {
      const newBalance =
        Number(account.currentBalance) +
        Number(item.amount);

      const { error: updateError } = await supabase
        .from("accounts")
        .update({
          balance: newBalance,
        })
        .eq("id", item.accountId);

      if (updateError) {
        console.error(
          "خطأ في تحديث رصيد العهدة:",
          updateError
        );
      }
    }

    // 6️⃣ إغلاق النافذة
    setOpenFundingModal(false);

  } catch (error) {
    console.error("خطأ غير متوقع:", error);
    alert("حدث خطأ أثناء حفظ التغذية");
  }
};
const handleAddFundingForAccount = (
  accountId: number
) => {
  setSelectedAccountId(accountId);
  setOpenFundingModal(true);
};

const handleViewAccount = (account: any) => {
  setSelectedAccount(account);
};
const handleAddAccount = async () => {
  const name = newAccountName.trim();

  if (!name) {
    alert("من فضلك اكتب اسم العهدة");
    return;
  }

  try {
    const { data, error } = await supabase
      .from("accounts")
      .insert([
        {
          name: name,
          type: newAccountType,
          balance: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("خطأ في إضافة العهدة:", error);
      alert("حدث خطأ أثناء إضافة العهدة");
      return;
    }

    const newAccount = {
      id: data.id,
      name: data.name,
      type: data.type ?? "عهدة",
      currentBalance: Number(data.balance ?? 0),
      totalFunding: 0,
      totalExpenses: 0,
      operationsCount: 0,
    };

    setAccounts((prev) => [
      ...prev,
      newAccount,
    ]);

    setNewAccountName("");
    setNewAccountType("عهدة");
    setOpenAccountModal(false);

  } catch (error) {
    console.error("خطأ غير متوقع:", error);
    alert("حدث خطأ أثناء إضافة العهدة");
  }
};
  return (

    <div className="space-y-8">

      <div className="rounded-[28px] border border-white/10 bg-[#081B33] p-8">

        <h1 className="text-4xl font-bold text-white">
          💰 المركز المالي
        </h1>

        <p className="mt-3 text-lg text-gray-400">
          إدارة المصروفات والعهد والتغذية والبنود المالية
        </p>

      </div>

      <div className="space-y-8">
        {/* Dashboard */}

<div className="grid grid-cols-4 gap-5">

  <div className="rounded-[28px] border border-emerald-400/20 bg-[#102947] p-6">
    <p className="text-sm text-gray-400">
      إجمالي الأرصدة
    </p>

    <h2 className="mt-3 text-4xl font-bold text-emerald-400">
      {accounts.reduce(
        (sum, acc) => sum + acc.currentBalance,
        0
      ).toLocaleString()}
    </h2>

    <span className="text-sm text-gray-500">
      ريال
    </span>
  </div>

  <div className="rounded-[28px] border border-red-400/20 bg-[#102947] p-6">
    <p className="text-sm text-gray-400">
      إجمالي المصروفات
    </p>

    <h2 className="mt-3 text-4xl font-bold text-red-400">
      {expenses.reduce(
        (sum, item) => sum + Number(item.total ?? 0),
        0
      ).toLocaleString()}
    </h2>

    <span className="text-sm text-gray-500">
      ريال
    </span>
  </div>

  <div className="rounded-[28px] border border-sky-400/20 bg-[#102947] p-6">
    <p className="text-sm text-gray-400">
      إجمالي التغذية
    </p>

    <h2 className="mt-3 text-4xl font-bold text-sky-400">
      {funding.reduce(
        (sum, item) => sum + Number(item.amount ?? 0),
        0
      ).toLocaleString()}
    </h2>

    <span className="text-sm text-gray-500">
      ريال
    </span>
  </div>

  <div className="rounded-[28px] border border-yellow-400/20 bg-[#102947] p-6">
    <p className="text-sm text-gray-400">
      عدد العمليات
    </p>

    <h2 className="mt-3 text-4xl font-bold text-yellow-400">
      {expenses.length + funding.length}
    </h2>

    <span className="text-sm text-gray-500">
      عملية
    </span>
  </div>

</div>

        <div className="w-full">

          <div className="rounded-[28px] border border-white/10 bg-[#081B33] p-6">

            <div className="mb-8 flex items-center justify-between">

              <div>

                <h2 className="text-3xl font-bold text-white">
                  الأقسام المالية
                </h2>

                <p className="mt-2 text-gray-400">
                  اختر القسم الذي تريد العمل عليه
                </p>

              </div>

              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-5 py-3 font-bold text-yellow-400">

                4 أقسام

              </div>

            </div>

            <div className="grid grid-cols-4 gap-5">

           
            <div
  onClick={() => setActiveTab("expenses")}
  className={`cursor-pointer rounded-[28px] border p-6 h-[230px]
  transition-all duration-500 ease-out ${
    activeTab === "expenses"
      ? "border-yellow-400 bg-gradient-to-br from-yellow-400 to-yellow-500 text-[#081B33] shadow-2xl"
      : "border-white/10 bg-[#102947] hover:border-yellow-400 hover:-translate-y-2 hover:scale-[1.03] hover:shadow-[0_20px_45px_rgba(0,0,0,.35)]"
  }`}
>

  <div className="flex items-center justify-between">

    <div
      className={`flex h-20 w-20 items-center justify-center rounded-[24px] border ${
        activeTab === "expenses"
          ? "border-white/30 bg-white/20"
          : "border-yellow-400/20 bg-yellow-400/10"
      }`}
    >
      <Receipt size={52} strokeWidth={2.4} />
    </div>

    <Receipt
      size={22}
      className={
        activeTab === "expenses"
          ? "opacity-70"
          : "text-yellow-400 opacity-40"
      }
    />

  </div>

  <h3 className="mt-7 text-[30px] font-extrabold">
    المصروفات
  </h3>

  <p
    className={`mt-3 text-base leading-7 ${
      activeTab === "expenses"
        ? "text-[#081B33]/80"
        : "text-gray-400"
    }`}
  >
    إدارة جميع المصروفات والفواتير
  </p>

  <div
    className={`my-5 h-px ${
      activeTab === "expenses"
        ? "bg-[#081B33]/20"
        : "bg-white/10"
    }`}
  />

  <div className="flex items-end justify-between">

    <div>

      <div className="text-4xl font-extrabold">
        {expenses.length}
      </div>

      <div
        className={`mt-1 text-sm ${
          activeTab === "expenses"
            ? "text-[#081B33]/70"
            : "text-gray-400"
        }`}
      >
        إجمالي المصروفات
      </div>

    </div>

    <div
      className={`rounded-xl px-3 py-1 text-xs font-bold ${
        activeTab === "expenses"
          ? "bg-white/20"
          : "bg-yellow-400/10 text-yellow-400"
      }`}
    >
      نشط
    </div>

  </div>

</div>
<div
  onClick={() => setActiveTab("accounts")}
  className={`cursor-pointer rounded-[28px] border p-6 h-[230px]
  transition-all duration-500 ease-out ${
    activeTab === "accounts"
      ? "border-emerald-400 bg-gradient-to-br from-emerald-400 to-emerald-500 text-[#081B33] shadow-2xl"
      : "border-white/10 bg-[#102947] hover:border-emerald-400 hover:-translate-y-2 hover:scale-[1.03] hover:shadow-[0_20px_45px_rgba(0,0,0,.35)]"
  }`}
>

  <div className="flex items-center justify-between">

    <div
      className={`flex h-20 w-20 items-center justify-center rounded-[24px] border ${
        activeTab === "accounts"
          ? "border-white/30 bg-white/20"
          : "border-emerald-400/20 bg-emerald-400/10"
      }`}
    >
      <Wallet size={52} strokeWidth={2.4} />
    </div>

    <Wallet
      size={22}
      className={
        activeTab === "accounts"
          ? "opacity-70"
          : "text-emerald-400 opacity-40"
      }
    />

  </div>

  <h3 className="mt-7 text-[30px] font-extrabold">
    العهد المالية
  </h3>

  <p
    className={`mt-3 text-base leading-7 ${
      activeTab === "accounts"
        ? "text-[#081B33]/80"
        : "text-gray-400"
    }`}
  >
    إدارة الحسابات والأرصدة المالية
  </p>

  <div
    className={`my-5 h-px ${
      activeTab === "accounts"
        ? "bg-[#081B33]/20"
        : "bg-white/10"
    }`}
  />

  <div className="flex items-end justify-between">

    <div>

      <div className="text-4xl font-extrabold">
        {accounts.length}
      </div>

      <div
        className={`mt-1 text-sm ${
          activeTab === "accounts"
            ? "text-[#081B33]/70"
            : "text-gray-400"
        }`}
      >
        عدد الحسابات
      </div>

    </div>

    <div
      className={`rounded-xl px-3 py-1 text-xs font-bold ${
        activeTab === "accounts"
          ? "bg-white/20"
          : "bg-emerald-400/10 text-emerald-400"
      }`}
    >
      نشط
    </div>

  </div>

</div>
<div
  onClick={() => setActiveTab("funding")}
  className={`cursor-pointer rounded-[28px] border p-6 h-[230px]
  transition-all duration-500 ease-out ${
    activeTab === "funding"
      ? "border-sky-400 bg-gradient-to-br from-sky-400 to-cyan-500 text-[#081B33] shadow-2xl"
      : "border-white/10 bg-[#102947] hover:border-sky-400 hover:-translate-y-2 hover:scale-[1.03] hover:shadow-[0_20px_45px_rgba(0,0,0,.35)]"
  }`}
>

  <div className="flex items-center justify-between">

    <div
      className={`flex h-20 w-20 items-center justify-center rounded-[24px] border ${
        activeTab === "funding"
          ? "border-white/30 bg-white/20"
          : "border-sky-400/20 bg-sky-400/10"
      }`}
    >
      <Landmark size={52} strokeWidth={2.4} />
    </div>

    <Landmark
      size={22}
      className={
        activeTab === "funding"
          ? "opacity-70"
          : "text-sky-400 opacity-40"
      }
    />

  </div>

  <h3 className="mt-7 text-[30px] font-extrabold">
    التغذية
  </h3>

  <p
    className={`mt-3 text-base leading-7 ${
      activeTab === "funding"
        ? "text-[#081B33]/80"
        : "text-gray-400"
    }`}
  >
    تسجيل جميع عمليات تغذية الحسابات
  </p>

  <div
    className={`my-5 h-px ${
      activeTab === "funding"
        ? "bg-[#081B33]/20"
        : "bg-white/10"
    }`}
  />

  <div className="flex items-end justify-between">

    <div>

      <div className="text-4xl font-extrabold">
        {funding.length}
      </div>

      <div
        className={`mt-1 text-sm ${
          activeTab === "funding"
            ? "text-[#081B33]/70"
            : "text-gray-400"
        }`}
      >
        عمليات التغذية
      </div>

    </div>

    <div
      className={`rounded-xl px-3 py-1 text-xs font-bold ${
        activeTab === "funding"
          ? "bg-white/20"
          : "bg-sky-400/10 text-sky-400"
      }`}
    >
      نشط
    </div>

  </div>

</div>
<div
  onClick={() => setActiveTab("categories")}
  className={`cursor-pointer rounded-[28px] border p-6 h-[230px]
  transition-all duration-500 ease-out ${
    activeTab === "categories"
      ? "border-orange-400 bg-gradient-to-br from-orange-400 to-amber-500 text-[#081B33] shadow-2xl"
      : "border-white/10 bg-[#102947] hover:border-orange-400 hover:-translate-y-2 hover:scale-[1.03] hover:shadow-[0_20px_45px_rgba(0,0,0,.35)]"
  }`}
>

  <div className="flex items-center justify-between">

    <div
      className={`flex h-20 w-20 items-center justify-center rounded-[24px] border ${
        activeTab === "categories"
          ? "border-white/30 bg-white/20"
          : "border-orange-400/20 bg-orange-400/10"
      }`}
    >
      <FolderTree size={52} strokeWidth={2.4} />
    </div>

    <FolderTree
      size={22}
      className={
        activeTab === "categories"
          ? "opacity-70"
          : "text-orange-400 opacity-40"
      }
    />

  </div>

  <h3 className="mt-7 text-[30px] font-extrabold">
    البنود
  </h3>

  <p
    className={`mt-3 text-base leading-7 ${
      activeTab === "categories"
        ? "text-[#081B33]/80"
        : "text-gray-400"
    }`}
  >
    إدارة وتصنيف بنود المصروفات
  </p>

  <div
    className={`my-5 h-px ${
      activeTab === "categories"
        ? "bg-[#081B33]/20"
        : "bg-white/10"
    }`}
  />

  <div className="flex items-end justify-between">

    <div>

      <div className="text-4xl font-extrabold">
        {expenseItems.length}
      </div>

      <div
        className={`mt-1 text-sm ${
          activeTab === "categories"
            ? "text-[#081B33]/70"
            : "text-gray-400"
        }`}
      >
        عدد البنود
      </div>

    </div>

    <div
      className={`rounded-xl px-3 py-1 text-xs font-bold ${
        activeTab === "categories"
          ? "bg-white/20"
          : "bg-orange-400/10 text-orange-400"
      }`}
    >
      نشط
    </div>

  </div>

</div>

</div>

</div>
</div>
{/* المحتوى */}

<div>

  <div className="mb-6 flex justify-end">

    {activeTab === "expenses" && (

      <button
        onClick={() => setOpenExpenseModal(true)}
        className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-[#081B33] hover:bg-yellow-500"
      >
        + إضافة مصروف
      </button>

    )}

    
  </div>

    {activeTab === "expenses" && (
    <>
      <ExpensesPage
        expenses={expenses}
        accounts={accounts}
        onAddExpense={() => setOpenExpenseModal(true)}
      />

      {/* نافذة إضافة المصروف تظهر مباشرة أسفل جدول المصروفات */}
      <ExpenseModal
        open={openExpenseModal}
        onClose={() => setOpenExpenseModal(false)}
        onSave={handleSaveExpense}
        accounts={accounts}
        onAddAccount={() => setOpenAccountModal(true)}
      />
    </>
  )}

  {activeTab === "accounts" && (
    <AccountsPage
      accounts={accounts}
      onAddAccount={() => setOpenAccountModal(true)}
      onAddFunding={handleAddFundingForAccount}
      onViewAccount={handleViewAccount}
    />
  )}

  {activeTab === "funding" && (
    <FundingPage
      onAddFunding={() => setOpenFundingModal(true)}
    />
  )}

  {activeTab === "categories" && (
    <CategoriesPage />
  )}

  {/* نافذة التغذية */}
  <FundingModal
    open={openFundingModal}
    selectedAccountId={selectedAccountId}
    onClose={() => {
      setOpenFundingModal(false);
      setSelectedAccountId(null);
    }}
    onSave={handleSaveFunding}
  />

  {/* نافذة إضافة عهدة */}
  {openAccountModal && (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4">

      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#081B33] p-7 shadow-2xl">

        {/* العنوان */}

        <div className="mb-6 flex items-center justify-between">

          <div>
            <h2 className="text-2xl font-bold text-white">
              إضافة عهدة جديدة
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              إنشاء عهدة مالية جديدة
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setOpenAccountModal(false);
              setNewAccountName("");
              setNewAccountType("عهدة");
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl text-gray-400 hover:bg-white/10 hover:text-white"
          >
            ×
          </button>

        </div>

        {/* اسم العهدة */}

        <div className="mb-5">

          <label className="mb-2 block text-sm font-bold text-gray-300">
            اسم العهدة
          </label>

          <input
            type="text"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            placeholder="مثال: عهدة المشتريات"
            className="w-full rounded-2xl border border-white/10 bg-[#102947] px-4 py-4 text-white outline-none placeholder:text-gray-500 focus:border-yellow-400/50"
            autoFocus
          />

        </div>

        {/* نوع العهدة */}

        <div className="mb-7">

          <label className="mb-2 block text-sm font-bold text-gray-300">
            نوع العهدة
          </label>

          <select
            value={newAccountType}
            onChange={(e) => setNewAccountType(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-[#102947] px-4 py-4 text-white outline-none focus:border-yellow-400/50"
          >
            <option value="عهدة">
              عهدة
            </option>
          </select>

        </div>

        {/* الأزرار */}

        <div className="grid grid-cols-2 gap-3">

          <button
            type="button"
            onClick={() => {
              setOpenAccountModal(false);
              setNewAccountName("");
              setNewAccountType("عهدة");
            }}
            className="h-12 rounded-xl border border-white/10 bg-white/5 font-bold text-gray-300 hover:bg-white/10 hover:text-white"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleAddAccount}
            className="h-12 rounded-xl bg-green-500 font-bold text-white hover:bg-green-600"
          >
            + إنشاء العهدة
          </button>

                               </div>
      </div>
    </div>
  )}

  </div>
  </div>
  </div>

);
}
