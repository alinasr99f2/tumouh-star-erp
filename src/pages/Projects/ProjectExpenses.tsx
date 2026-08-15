import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  WalletCards,
  Plus,
  Receipt,
} from "lucide-react";

import { projects } from "../../data/projects";
import { supabase } from "../../utils/supabase";

type ProjectExpense = {
  id: number | string;
  description: string | null;
  amount_before_tax: number | string | null;
  tax: number | string | null;
  total: number | string | null;
  payment_method: string | null;
  invoice_number: string | null;
  created_at?: string | null;
};

const getExpenseTotal = (expense: ProjectExpense) => {
  const total = Number(expense.total);

  if (Number.isFinite(total)) {
    return total;
  }

  return (
    Number(expense.amount_before_tax ?? 0) +
    Number(expense.tax ?? 0)
  );
};

export default function ProjectExpenses() {
  const { id } = useParams();
  const navigate = useNavigate();

  const project = projects.find(
    (p) => p.id === Number(id)
  );

  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExpenses = async () => {
    if (!project) return;

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("expenses")
      .select(`
        id,
        description,
        amount_before_tax,
        tax,
        total,
        payment_method,
        invoice_number,
        created_at
      `)
      .eq("project_id", project.id)
      .order("id", { ascending: false });

    if (error) {
      console.error(
        "خطأ في تحميل مصروفات المشروع:",
        error
      );

      setError(error.message);
      setExpenses([]);
    } else {
      setExpenses(
        (data ?? []) as ProjectExpense[]
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    loadExpenses();
  }, [project?.id]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce(
      (sum, expense) =>
        sum + getExpenseTotal(expense),
      0
    );
  }, [expenses]);

  if (!project) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-extrabold text-white">
          المشروع غير موجود
        </h1>

        <button
          type="button"
          onClick={() => navigate("/projects")}
          className="mt-6 rounded-xl bg-yellow-400 px-6 py-3 font-bold text-[#081B33] transition hover:bg-yellow-500"
        >
          رجوع للمشاريع
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">

      {/* =========================
          HEADER
      ========================= */}
      <div
        className="
          relative
          overflow-hidden
          rounded-3xl
          border
          border-white/10
          bg-gradient-to-br
          from-[#173C63]
          via-[#0D2948]
          to-[#101C2D]
          px-8
          py-7
          shadow-xl
        "
      >
        <div className="flex items-center justify-between gap-5">

          <button
            type="button"
            onClick={() =>
              navigate(`/projects/${project.id}`)
            }
            className="
              flex
              items-center
              gap-2
              rounded-xl
              border
              border-white/10
              bg-white/5
              px-4
              py-2
              text-sm
              font-bold
              text-gray-300
              transition
              hover:bg-white/10
              hover:text-white
            "
          >
            <ArrowLeft size={17} />
            رجوع للمشروع
          </button>

          <div className="text-right">
            <p className="text-sm font-bold text-yellow-400">
              المصروفات
            </p>

            <h1 className="mt-1 text-3xl font-extrabold text-white">
              مصروفات {project.name}
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              جميع المصروفات المسجلة على المشروع
            </p>
          </div>

        </div>
      </div>


      {/* =========================
          SUMMARY
      ========================= */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

        {/* Total */}
        <div
          className="
            rounded-3xl
            border
            border-rose-400/20
            bg-gradient-to-br
            from-[#4C2B3B]
            via-[#362336]
            to-[#211A2C]
            p-6
            shadow-xl
          "
        >
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-bold text-gray-400">
                إجمالي مصروفات المشروع
              </p>

              <p className="mt-3 text-4xl font-extrabold text-white">
                {totalExpenses.toLocaleString("ar-SA")}
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-400">
                ريال
              </p>
            </div>

            <div
              className="
                flex
                h-20
                w-20
                items-center
                justify-center
                rounded-3xl
                border
                border-white/10
                bg-white/5
                text-white
              "
            >
              <WalletCards size={40} />
            </div>

          </div>
        </div>


        {/* Count */}
        <div
          className="
            rounded-3xl
            border
            border-blue-400/20
            bg-gradient-to-br
            from-[#173F68]
            via-[#123455]
            to-[#0B2139]
            p-6
            shadow-xl
          "
        >
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-bold text-gray-400">
                عدد المصروفات
              </p>

              <p className="mt-3 text-4xl font-extrabold text-white">
                {expenses.length}
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-400">
                عملية
              </p>
            </div>

            <div
              className="
                flex
                h-20
                w-20
                items-center
                justify-center
                rounded-3xl
                border
                border-white/10
                bg-white/5
                text-white
              "
            >
              <Receipt size={40} />
            </div>

          </div>
        </div>

      </div>


      {/* =========================
          EXPENSES TABLE
      ========================= */}
      <section
        className="
          overflow-hidden
          rounded-3xl
          border
          border-white/10
          bg-gradient-to-br
          from-[#102A43]
          via-[#102337]
          to-[#0B1928]
          shadow-xl
        "
      >

        {/* Table Header */}
        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-white/10
            px-6
            py-5
          "
        >
          <div className="text-right">
            <h2 className="text-xl font-extrabold text-white">
              سجل المصروفات
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              جميع المصروفات المسجلة على هذا المشروع
            </p>
          </div>

          <button
            type="button"
            className="
              flex
              items-center
              gap-2
              rounded-xl
              bg-yellow-400
              px-5
              py-3
              font-extrabold
              text-[#081B33]
              transition
              hover:bg-yellow-500
            "
          >
            <Plus size={18} />
            إضافة مصروف
          </button>
        </div>


        {/* Loading */}
        {loading && (
          <div className="px-6 py-12 text-center text-gray-400">
            جاري تحميل المصروفات...
          </div>
        )}


        {/* Error */}
        {!loading && error && (
          <div className="px-6 py-12 text-center text-rose-300">
            {error}
          </div>
        )}


        {/* Empty */}
        {!loading &&
          !error &&
          expenses.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-400">
              لا توجد مصروفات مسجلة لهذا المشروع حتى الآن.
            </div>
          )}


        {/* Rows */}
        {!loading &&
          !error &&
          expenses.length > 0 && (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px] text-sm">

                <thead>
                  <tr className="border-b border-white/10 bg-black/10 text-gray-400">

                    <th className="px-5 py-4 text-center">
                      #
                    </th>

                    <th className="px-5 py-4 text-right">
                      البيان
                    </th>

                    <th className="px-5 py-4 text-center">
                      قبل الضريبة
                    </th>

                    <th className="px-5 py-4 text-center">
                      الضريبة
                    </th>

                    <th className="px-5 py-4 text-center">
                      الإجمالي
                    </th>

                    <th className="px-5 py-4 text-center">
                      طريقة الدفع
                    </th>

                    <th className="px-5 py-4 text-center">
                      رقم الفاتورة
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {expenses.map((expense, index) => {

                    const total =
                      getExpenseTotal(expense);

                    return (
                      <tr
                        key={expense.id}
                        className="
                          border-b
                          border-white/10
                          transition
                          hover:bg-white/5
                        "
                      >

                        <td className="px-5 py-5 text-center">
                          <span
                            className="
                              inline-flex
                              h-9
                              w-9
                              items-center
                              justify-center
                              rounded-xl
                              border
                              border-blue-400/20
                              bg-blue-400/10
                              font-extrabold
                              text-blue-300
                            "
                          >
                            {index + 1}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-right">
                          <span className="font-bold text-white">
                            {expense.description ||
                              "بدون بيان"}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-center text-gray-300">
                          {Number(
                            expense.amount_before_tax ?? 0
                          ).toLocaleString("ar-SA")}
                        </td>

                        <td className="px-5 py-5 text-center text-gray-300">
                          {Number(
                            expense.tax ?? 0
                          ).toLocaleString("ar-SA")}
                        </td>

                        <td className="px-5 py-5 text-center">
                          <span className="font-extrabold text-yellow-400">
                            {total.toLocaleString("ar-SA")}
                          </span>

                          <span className="mr-1 text-xs text-gray-500">
                            ريال
                          </span>
                        </td>

                        <td className="px-5 py-5 text-center text-gray-300">
                          {expense.payment_method ||
                            "-"}
                        </td>

                        <td className="px-5 py-5 text-center text-gray-300">
                          {expense.invoice_number ||
                            "-"}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>

              </table>

            </div>
          )}

      </section>

    </div>
  );
}