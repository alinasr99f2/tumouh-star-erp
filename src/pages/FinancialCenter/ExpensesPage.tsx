import { projects } from "../../data/projects";
import { financialAccounts } from "../../data/financialAccounts";
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

type ExpensesPageProps = {
  expenses: Expense[];
};

export default function ExpensesPage({
  expenses,
}: ExpensesPageProps) {

  const getProjectName = (id: string) => {
    return (
      projects.find((p) => String(p.id) === String(id))
        ?.name ?? "-"
    );
  };

  const getAccountName = (id: string) => {
    return (
      financialAccounts.find(
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

          <button className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-[#081B33]">
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
                colSpan={9}
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

  <td className="p-4">
    {expense.entryDate ?? "-"}
  </td>

  <td>
    {expense.expenseDate ?? "-"}
  </td>

  <td>
    {expense.voucherNo || "-"}
  </td>

  <td>
    {getProjectName(expense.projectId)}
  </td>

  <td>
    {getAccountName(expense.accountId)}
  </td>

  <td>
    {getCategoryName(expense.categoryId)}
  </td>

  <td>
    {expense.supplier}
  </td>

  <td>

    {expense.paymentMethod === "cash"
      ? "💵 نقدًا"
      : expense.paymentMethod === "bank"
      ? "🏦 تحويل"
      : expense.paymentMethod === "card"
      ? "💳 بطاقة"
      : "-"}

  </td>

  <td>
    {expense.amount.toLocaleString()}
  </td>

  <td>
    {expense.tax.toLocaleString()}
  </td>

  <td className="font-bold text-yellow-400">
    {expense.total.toLocaleString()}
  </td>

  <td>

    <div className="flex justify-center gap-2">

      <button className="rounded-lg bg-sky-500 px-3 py-1 text-sm text-white hover:bg-sky-600">
        عرض
      </button>

      <button className="rounded-lg bg-yellow-500 px-3 py-1 text-sm text-white hover:bg-yellow-600">
        تعديل
      </button>

      <button className="rounded-lg bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600">
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