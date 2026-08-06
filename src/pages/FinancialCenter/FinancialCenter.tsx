import { useState } from "react";

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

import { financialEngine } from "../../core/engine/financial.engine";
import ExpenseModal from "../../components/financial/ExpenseModal";
import FundingModal from "./FundingModal";

import { financialAccounts } from "../../data/financialAccounts";
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

  const [expenses, setExpenses] =
    useState<any[]>([]);

  const [funding, setFunding] =
    useState<any[]>([]);

  const [ledger, setLedger] =
    useState<any[]>([]);

  const [accounts, setAccounts] =
    useState(financialAccounts);

  const handleSaveExpense = (expense: any) => {
    const distribution =
  distributionEngine.distributeExpense(
    expense,
    projects
  );
if (Array.isArray(distribution)) {
  expenseDistributions.push(...distribution);
} else if (distribution) {
  expenseDistributions.push(distribution);
}
console.log(distribution);

  financialEngine.addExpense(expense);
  
  

  setExpenses((prev) => [
    ...prev,
    expense,
  ]);

  setLedger((prev) => [
    ...prev,
    createLedgerEntry(
      "expense",
      expense
    ),
  ]);

  setAccounts((prev) =>
    prev.map((account) => {

      if (account.id !== expense.accountId)
        return account;

      return {
        ...account,
        currentBalance:
          account.currentBalance - expense.total,
        totalExpenses:
          account.totalExpenses + expense.total,
      };

    })
  );

};

  const handleSaveFunding = (item: any) => {

  financialEngine.addFunding(item);

  setFunding((prev) => [
    ...prev,
    item,
  ]);

  setLedger((prev) => [
    ...prev,
    createLedgerEntry(
      "funding",
      item
    ),
  ]);

  setAccounts((prev) =>
    applyFunding(prev, item)
  );

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
        (sum, item) => sum + item.total,
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
        (sum, item) => sum + item.amount,
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
      {ledger.length}
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
        0
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

    {activeTab === "funding" && (

      <button
        onClick={() => setOpenFundingModal(true)}
        className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-[#081B33] hover:bg-yellow-500"
      >
        + إضافة تغذية
      </button>

    )}

  </div>

  {activeTab === "expenses" && (
    <ExpensesPage expenses={expenses} />
  )}

  {activeTab === "accounts" && (
    <AccountsPage accounts={accounts} />
  )}

  {activeTab === "funding" && (
    <FundingPage
      onAddFunding={() =>
        setOpenFundingModal(true)
      }
    />
  )}

  {activeTab === "categories" && (
    <CategoriesPage />
  )}

</div>

</div>

<ExpenseModal
  open={openExpenseModal}
  onClose={() => setOpenExpenseModal(false)}
  onSave={handleSaveExpense}
/>

<FundingModal
  open={openFundingModal}
  onClose={() => setOpenFundingModal(false)}
  onSave={handleSaveFunding}
/>

</div>

);

}