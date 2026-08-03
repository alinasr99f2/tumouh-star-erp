import { useState } from "react";

import ExpensesPage from "./ExpensesPage";
import AccountsPage from "./AccountsPage";
import FundingPage from "./FundingPage";
import CategoriesPage from "./CategoriesPage";

import ExpenseModal from "../../components/financial/ExpenseModal";

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
        <ExpensesPage />
      )}

      {activeTab === "accounts" && (
        <AccountsPage />
      )}

      {activeTab === "funding" && (
        <FundingPage />
      )}

      {activeTab === "categories" && (
        <CategoriesPage />
      )}

      {/* Modal */}

      <ExpenseModal
        open={openExpenseModal}
        onClose={() => setOpenExpenseModal(false)}
      />

    </div>

  );

}