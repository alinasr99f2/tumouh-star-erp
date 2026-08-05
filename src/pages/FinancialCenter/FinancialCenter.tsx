import { useState } from "react";

import ExpensesPage from "./ExpensesPage";
import AccountsPage from "./AccountsPage";
import FundingPage from "./FundingPage";
import CategoriesPage from "./CategoriesPage";
import { financialAccounts } from "../../data/financialAccounts";
import {
  applyExpense,
  applyFunding,
  createLedgerEntry,
} from "../../services/financialEngine";
import ExpenseModal from "../../components/financial/ExpenseModal";
import FundingModal from "./FundingModal";

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

const [expenses, setExpenses] = useState<any[]>([]);

const [accounts, setAccounts] =
  useState(financialAccounts);

const [openFundingModal, setOpenFundingModal] =
  useState(false);

const [funding, setFunding] = useState<any[]>([]);
const [ledger, setLedger] = useState<any[]>([]);
const handleSaveExpense = (expense: any) => {

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
const handleSaveFunding = (item: any) => {

  setFunding((prev) => [

    ...prev,

    item,

  ]);
  setLedger((prev) => [

  ...prev,

  createLedgerEntry(
    "funding",
    funding
  ),

]);

setAccounts((prev) =>
  applyExpense(prev, expense)
);

};
      return {

        ...account,

        currentBalance:
          account.currentBalance -
          expense.total,

        totalExpenses:
          account.totalExpenses +
          expense.total,

      };

    })

  );

  console.log(expense);

};
const handleSaveFunding = (funding: any) => {

  setFunding((prev) => [

    ...prev,

    funding,

  ]);

  setAccounts((prev) =>
  applyFunding(prev, funding)
);

};
  return (

    <div className="space-y-8">

      {/* Header */}

      <div className="rounded-3xl border border-white/10 bg-[#081B33] p-8">

        <h1 className="text-4xl font-bold text-white">
          💰 المركز المالي
        </h1>

        <p className="mt-3 text-lg text-gray-400">
          إدارة المصروفات والعهد والتغذية والبنود المالية
        </p>

      </div>

      {/* Tabs */}

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div className="flex flex-wrap gap-3">

          <button
            onClick={() => setActiveTab("expenses")}
            className={`rounded-xl px-6 py-3 font-semibold transition ${
              activeTab === "expenses"
                ? "bg-yellow-400 text-[#081B33]"
                : "border border-white/10 bg-[#081B33] text-white"
            }`}
          >
            📑 المصروفات
          </button>

          <button
            onClick={() => setActiveTab("accounts")}
            className={`rounded-xl px-6 py-3 font-semibold transition ${
              activeTab === "accounts"
                ? "bg-yellow-400 text-[#081B33]"
                : "border border-white/10 bg-[#081B33] text-white"
            }`}
          >
            👤 العهد
          </button>

          <button
            onClick={() => setActiveTab("funding")}
            className={`rounded-xl px-6 py-3 font-semibold transition ${
              activeTab === "funding"
                ? "bg-yellow-400 text-[#081B33]"
                : "border border-white/10 bg-[#081B33] text-white"
            }`}
          >
            💵 التغذية
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`rounded-xl px-6 py-3 font-semibold transition ${
              activeTab === "categories"
                ? "bg-yellow-400 text-[#081B33]"
                : "border border-white/10 bg-[#081B33] text-white"
            }`}
          >
            🏷 البنود
          </button>

        </div>

        {activeTab === "expenses" && (

          <button
            onClick={() => setOpenExpenseModal(true)}
            className="
              rounded-xl
              bg-yellow-400
              px-6
              py-3
              font-bold
              text-[#081B33]
              transition
              hover:bg-yellow-500
            "
          >
            + إضافة مصروف
          </button>

        )}

      </div>

      {/* Pages */}

      {activeTab === "expenses" && (
       <ExpensesPage
  expenses={expenses}
  />
      )}

     {activeTab === "accounts" && (
  <AccountsPage
    accounts={accounts}
  />
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

      {/* Modal */}

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