import { projects } from "../../data/projects";
import { expenseCategories } from "../../data/expenseCategories";

type Expense = {
  id: string;

  entryDate?: string;

  expenseDate?: string;

  projectId: string;

  accountId: string;

  categoryId: string;

  supplier: string;

  voucherNo?: string;

  paymentMethod?: string;

  amount: number;

  tax: number;

  total: number;
};

type Account = {
  id: number;
  name: string;
  type: string;
  currentBalance: number;
  totalFunding: number;
  totalExpenses: number;
  operationsCount: number;
};

type ExpensesPageProps = {
  expenses: Expense[];
  accounts: Account[];
  onAddExpense?: () => void;
};

export default function ExpensesPage({
  expenses,
  accounts,
  onAddExpense,
}: ExpensesPageProps) {

  const getProjectName = (id: string) => {
    return (
      projects.find((p) => String(p.id) === String(id))
        ?.name ?? "-"
    );
  };

  const getAccountName = (id: string) => {
  return (
    accounts.find(
      (a) => String(a.id) === String(id)
    )?.name ?? "-"
  );
};

  const getCategoryName = (id: string) => {
    return (
      expenseCategories.find(
        (c) => String(c.id) === String(id)
      )?.name ?? "-"
    );
  };
const today = new Date();

const todayExpenses = expenses
  .filter((expense) => {

    if (!expense.expenseDate) return false;

    const d = new Date(expense.expenseDate);

    return (
  expense.expenseDate ===
  today.toISOString().split("T")[0]
);

  })
  .reduce(
    (sum, expense) =>
      sum + expense.total,
    0
  );

const weekExpenses = expenses
  .filter((expense) => {

    if (!expense.expenseDate) return false;

    const d = new Date(expense.expenseDate);

    const diff =
      (today.getTime() - d.getTime()) /
      (1000 * 60 * 60 * 24);

    return diff <= 7;

  })
  .reduce(
    (sum, expense) =>
      sum + expense.total,
    0
  );

const monthExpenses = expenses
  .filter((expense) => {

    if (!expense.expenseDate) return false;

    const d = new Date(expense.expenseDate);

    return (
      d.getMonth() ===
        today.getMonth() &&
      d.getFullYear() ===
        today.getFullYear()
    );

  })
  .reduce(
    (sum, expense) =>
      sum + expense.total,
    0
  );

const yearExpenses = expenses
  .filter((expense) => {

    if (!expense.expenseDate) return false;

    const d = new Date(expense.expenseDate);

    return (
      d.getFullYear() ===
      today.getFullYear()
    );

  })
  .reduce(
    (sum, expense) =>
      sum + expense.total,
    0
  );
  return (
    <div className="space-y-6">

      {/* Statistics */}

      <div className="grid grid-cols-4 gap-6">

        <div className="rounded-2xl border border-white/10 bg-[#081B33] p-6">
          <p className="text-gray-400">مصروفات اليوم</p>
          <h2 className="mt-3 text-3xl font-bold text-white">
            {todayExpenses.toLocaleString()} ريال
          </h2>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#081B33] p-6">
          <p className="text-gray-400">مصروفات الأسبوع</p>
          <h2 className="mt-3 text-3xl font-bold text-white">
            {weekExpenses.toLocaleString()} ريال
          </h2>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#081B33] p-6">
          <p className="text-gray-400">مصروفات الشهر</p>
          <h2 className="mt-3 text-3xl font-bold text-white">
            {monthExpenses.toLocaleString()} ريال
          </h2>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#081B33] p-6">
          <p className="text-gray-400">إجمالي السنة</p>
          <h2 className="mt-3 text-3xl font-bold text-yellow-400">
            {yearExpenses.toLocaleString()} ريال
          </h2>
        </div>

      </div>

      {/* Toolbar */}

      <div className="rounded-2xl border border-white/10 bg-[#081B33] p-5">

        <div className="flex items-center justify-between">

          <button
  type="button"
  onClick={onAddExpense}
  className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-[#081B33] transition hover:bg-yellow-300"
>
  + إضافة مصروف
</button>

          <input
            type="text"
            placeholder="بحث..."
            className="w-80 rounded-xl border border-white/10 bg-[#102947] px-4 py-3 outline-none"
          />

        </div>

      </div>

      {/* Table */}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#081B33]">

        <table className="w-full">

          <thead className="bg-[#102947]">

            <tr>

              <th className="p-4">
  تاريخ الإدخال
</th>

<th>
  تاريخ المصروف
</th>

<th>
  رقم الفاتورة
</th>
              <th>المشروع</th>
              <th>العهدة</th>
              <th>البند</th>
             <th>المورد</th>

<th>طريقة الدفع</th>
              <th>قبل الضريبة</th>
              <th>الضريبة</th>
              <th>الإجمالي</th>
              <th>الإجراءات</th>

            </tr>

          </thead>

          <tbody>
                      {expenses.length === 0 ? (

  <tr>
    <td
      colSpan={12}
      className="py-20 text-center text-gray-500"
    >
      لا توجد بيانات حتى الآن
    </td>
  </tr>

) : (

  expenses.map((expense) => (

    <tr
      key={expense.id}
      className="border-t border-white/10 hover:bg-[#102947]"
    >

      {/* تاريخ الإدخال */}
      <td className="p-3 text-center">
        {expense.entryDate
          ? new Date(expense.entryDate).toLocaleDateString("ar-SA")
          : "-"}
      </td>

      {/* تاريخ المصروف */}
      <td className="p-3 text-center">
        {expense.expenseDate
          ? new Date(expense.expenseDate).toLocaleDateString("ar-SA")
          : "-"}
      </td>

      {/* المشروع */}
      <td className="p-3 text-center">
        {getProjectName(expense.projectId)}
      </td>

      {/* رقم الفاتورة */}
      <td className="p-3 text-center">
        {expense.voucherNo || "-"}
      </td>

      {/* المورد */}
      <td className="p-3 text-center">
        {expense.supplier || "-"}
      </td>

      {/* البند */}
      <td className="p-3 text-center">
        {getCategoryName(expense.categoryId)}
      </td>

      {/* الحساب */}
      <td className="p-3 text-center">
        {getAccountName(expense.accountId)}
      </td>

      {/* طريقة الدفع */}
      <td className="p-3 text-center">

        {expense.paymentMethod === "Cash"
          ? "💵 نقدًا"
          : expense.paymentMethod === "Bank Transfer"
          ? "🏦 تحويل"
          : expense.paymentMethod === "Card"
          ? "💳 بطاقة"
          : expense.paymentMethod === "Cheque"
          ? "🧾 شيك"
          : expense.paymentMethod === "Other"
          ? "💰 أخرى"
          : "-"}

      </td>

      {/* المبلغ */}
      <td className="p-3 text-center">
        {(Number(expense.amount) || 0).toLocaleString()}
      </td>

      {/* الضريبة */}
      <td className="p-3 text-center">
        {(Number(expense.tax) || 0).toLocaleString()}
      </td>

      {/* الإجمالي */}
      <td className="p-3 text-center font-bold text-yellow-400">
        {(Number(expense.total) || 0).toLocaleString()}
      </td>

      {/* الإجراءات */}
      <td className="p-3 text-center">

        <div className="flex justify-center gap-2">

          <button
            type="button"
            className="rounded-lg bg-sky-500 px-3 py-1 text-sm text-white hover:bg-sky-600"
          >
            عرض
          </button>

          <button
            type="button"
            className="rounded-lg bg-yellow-500 px-3 py-1 text-sm text-white hover:bg-yellow-600"
          >
            تعديل
          </button>

          <button
            type="button"
            className="rounded-lg bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
          >
            إلغاء
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

  );

}