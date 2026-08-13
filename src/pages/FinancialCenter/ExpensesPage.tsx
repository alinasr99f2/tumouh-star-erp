import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../utils/supabase";
import { projects } from "../../data/projects";

type Expense = {
  id: string | number;

  entryDate?: string | null;
  expenseDate?: string | null;

  projectId?: string | number | null;
  accountId?: string | number | null;
  accountName?: string | null;

  categoryId?: string | number | null;
  itemId?: string | number | null;
  itemName?: string | null;

  supplier?: string | null;
  supplierName?: string | null;
  voucherNo?: string | null;
  invoiceNo?: string | null;

  paymentMethod?: string | null;

  stageId?: string | number | null;
  stageName?: string | null;

  amount?: number | string | null;
  tax?: number | string | null;
  total?: number | string | null;

  description?: string | null;
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

type Category = {
  id: number;
  name: string;
};

type ExpenseItem = {
  id: number;
  name: string;
  category_id: number;
};

type ExpensesPageProps = {
  expenses: Expense[];
  accounts: Account[];

  onAddExpense?: () => void;

  onViewExpense?: (expense: Expense) => void;

  onEditExpense?: (expense: Expense) => void;

  onDeleteExpense?: (expense: Expense) => void;
};


type RawExpense = Expense & {
  entry_date?: string | null;
  expense_date?: string | null;
  project_id?: string | number | null;
  account_id?: string | number | null;
  category_id?: string | number | null;
  item_id?: string | number | null;
  voucher_no?: string | null;
  invoice_no?: string | null;
invoice_number?: string | null;
voucher_number?: string | null;
  payment_method?: string | null;
  amount_before_tax?: number | string | null;
  before_tax?: number | string | null;
  subtotal?: number | string | null;
  net_amount?: number | string | null;
  tax_amount?: number | string | null;
  vat?: number | string | null;
  total_amount?: number | string | null;
  grand_total?: number | string | null;
  stage_id?: string | number | null;
  stage_name?: string | null;
  phase_id?: string | number | null;
  phase_name?: string | null;
  stage?: string | null;
  phase?: string | null;
  account_name?: string | null;
  accountName?: string | null;
  item_name?: string | null;
  itemName?: string | null;
  created_at?: string | null;
};

const normalizeExpense = (
  expense: RawExpense
): Expense => {
  const taxValue =
    expense.tax ??
    expense.tax_amount ??
    expense.vat ??
    0;

  const rawTotalValue =
    expense.total ??
    expense.total_amount ??
    expense.grand_total ??
    null;

  const explicitAmount =
    expense.amount ??
    expense.amount_before_tax ??
    expense.before_tax ??
    expense.subtotal ??
    expense.net_amount ??
    null;

  // بعض السجلات القديمة عندنا فيها amount = 0 بينما الإجمالي
  // والضريبة محفوظان بشكل صحيح. في هذه الحالة نحسب قبل الضريبة
  // من الإجمالي - الضريبة بدل عرض 0.
  const amountNumber = Number(explicitAmount ?? 0);
  const taxNumber = Number(taxValue ?? 0);
  const totalNumber =
    rawTotalValue === null || rawTotalValue === undefined || rawTotalValue === ""
      ? amountNumber + taxNumber
      : Number(rawTotalValue);

  // لو amount القديم محفوظ بصفر/فارغ، احسب قبل الضريبة فعليًا من الإجمالي - الضريبة.
  // ولو الضريبة = 0، فقبل الضريبة يساوي الإجمالي.
  const amountValue =
    amountNumber === 0 && totalNumber > 0
      ? Math.max(totalNumber - taxNumber, 0)
      : amountNumber;

  const totalValue = totalNumber;

  return {
    ...expense,
    id: expense.id,
    entryDate:
      expense.entryDate ??
      expense.entry_date ??
      expense.created_at ??
      null,
    expenseDate:
      expense.expenseDate ??
      expense.expense_date ??
      null,
    projectId:
      expense.projectId ??
      expense.project_id ??
      null,
    accountId:
      expense.accountId ??
      expense.account_id ??
      null,
    accountName:
      expense.accountName ??
      expense.account_name ??
      null,
    categoryId:
      expense.categoryId ??
      expense.category_id ??
      null,
    itemId:
      expense.itemId ??
      expense.item_id ??
      null,
    itemName:
      expense.itemName ??
      expense.item_name ??
      null,
    supplier:
      expense.supplier ??
      expense.supplierName ??
      expense.supplierName ??
      null,
    supplierName:
      expense.supplierName ??
      expense.supplierName ??
      expense.supplier ??
      null,
    voucherNo:
      expense.voucherNo ??
      expense.voucher_no ??
      expense.voucher_number ??
      expense.invoiceNo ??
      expense.invoice_no ??
      expense.invoice_number ??
      null,
    invoiceNo:
      expense.invoiceNo ??
      expense.invoice_no ??
      expense.invoice_number ??
      expense.voucherNo ??
      expense.voucher_no ??
      expense.voucher_number ??
      null,
    stageId:
      expense.stageId ??
      expense.stage_id ??
      expense.phase_id ??
      null,
    stageName:
      expense.stageName ??
      expense.stage_name ??
      expense.phase_name ??
      (typeof expense.stage === "string" ? expense.stage : null) ??
      (typeof expense.phase === "string" ? expense.phase : null) ??
      null,
    paymentMethod:
      expense.paymentMethod ??
      expense.payment_method ??
      null,
    amount: amountValue,
    tax: taxValue,
    total: totalValue,
    description: expense.description ?? null,
  };
};

const ViewBox = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/10
        bg-[#102947]
        p-4
      "
    >
      <p className="mb-2 text-xs text-gray-400">
        {label}
      </p>

      <p className="font-bold text-white">
        {value || "-"}
      </p>
    </div>
  );
};

export default function ExpensesPage({
  expenses,
  accounts,
  onAddExpense,
  onViewExpense,
  onEditExpense,
  onDeleteExpense,
}: ExpensesPageProps) {
  // =====================================================
  // المصروفات
  //
  // الصفحة كانت تعتمد فقط على expenses القادمة من Dashboard.
  // لو Dashboard لم يحمّل البيانات القديمة، كانت الصفحة تظهر
  // "لا توجد بيانات حتى الآن" رغم أن البيانات موجودة في Supabase.
  // لذلك نحمّل المصروفات مباشرة من جدول expenses هنا أيضًا.
  // =====================================================
  const [loadedExpenses, setLoadedExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesError, setExpensesError] = useState<string | null>(null);

  const loadExpenses = async () => {
    setExpensesLoading(true);
    setExpensesError(null);

    const { data, error } = await supabase
      .from("expenses")
      .select("*");

    if (error) {
      console.error("خطأ في تحميل المصروفات:", error);
      setExpensesError(error.message);
      setLoadedExpenses([]);
      setExpensesLoading(false);
      return;
    }

    const rows = ((data ?? []) as RawExpense[])
      .map(normalizeExpense)
      .sort((a, b) => {
        const dateA = String(a.expenseDate ?? a.entryDate ?? "");
        const dateB = String(b.expenseDate ?? b.entryDate ?? "");
        return dateB.localeCompare(dateA);
      });

    setLoadedExpenses(rows);
    setExpensesLoading(false);
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  // نستخدم البيانات التي تم تحميلها مباشرة من Supabase عندما تكون موجودة،
  // وإلا نرجع للبيانات القادمة من Dashboard.
  const sourceExpenses = useMemo(() => {
    return loadedExpenses.length > 0 ? loadedExpenses : expenses;
  }, [loadedExpenses, expenses]);

  const normalizedExpenses = useMemo(() => {
    return sourceExpenses.map(normalizeExpense);
  }, [sourceExpenses]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);

  const [search, setSearch] = useState("");

  // =========================================
  // تحميل التصنيفات والبنود من Supabase
  // =========================================

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
      } else {
        setCategories(categoriesData ?? []);
      }

      if (itemsError) {
        console.error(
          "خطأ في تحميل البنود:",
          itemsError
        );
      } else {
        setExpenseItems(itemsData ?? []);
      }
    };

    loadCategoriesAndItems();
  }, []);

  // =========================================
  // أسماء المشروع والعهدة والتصنيف والبند
  // =========================================

  const getProjectName = (
    id?: string | number | null
  ) => {
    if (id === null || id === undefined || id === "") {
      return "-";
    }

    return (
      projects.find(
        (project) =>
          String(project.id) === String(id)
      )?.name ?? "-"
    );
  };

  const getAccountName = (
    id?: string | number | null
  ) => {
    if (id === null || id === undefined || id === "") {
      return "-";
    }

    return (
      accounts.find(
        (account) =>
          String(account.id) === String(id)
      )?.name ?? "-"
    );
  };

  const getCategoryName = (
    id?: string | number | null
  ) => {
    if (id === null || id === undefined || id === "") {
      return "-";
    }

    return (
      categories.find(
        (category) =>
          String(category.id) === String(id)
      )?.name ?? "-"
    );
  };

  const getItemName = (
    id?: string | number | null
  ) => {
    if (id === null || id === undefined || id === "") {
      return "-";
    }

    return (
      expenseItems.find(
        (item) =>
          String(item.id) === String(id)
      )?.name ?? "-"
    );
  };

  const getStageName = (expense: Expense) => {
    if (expense.stageName) return expense.stageName;

    const id = String(expense.stageId ?? "").trim().toLowerCase();

    const knownStages: Record<string, string> = {
      structural: "إنشائي",
      finishing: "تشطيبي",
      decorations: "ديكورات",
    };

    return knownStages[id] ?? (expense.stageId ? String(expense.stageId) : "-");
  };

  // =========================================
  // التاريخ بدون مشاكل timezone
  // =========================================

  const getDateString = (
    value?: string | null
  ) => {
    if (!value) return "";

    return String(value).split("T")[0];
  };

  const formatDate = (
    value?: string | null
  ) => {
    const date = getDateString(value);

    if (!date) return "-";

    const parts = date.split("-");

    if (parts.length !== 3) {
      return date;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // =========================================
  // تاريخ اليوم
  // =========================================

  const today = new Date();

  const todayString =
    `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;

  // =========================================
  // بداية الفترة الأسبوعية: اليوم + 6 أيام قبله
  // =========================================

  const getRolling7DayStart = () => {
    const date = new Date(today);
    date.setDate(date.getDate() - 6);

    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  };

  const weekStartString = getRolling7DayStart();

  // =========================================
  // حساب إجمالي اليوم
  // =========================================

  const todayExpenses = useMemo(() => {
    return normalizedExpenses
      .filter(
        (expense) =>
          getDateString(expense.expenseDate) ===
          todayString
      )
      .reduce(
        (sum, expense) =>
          sum + Number(expense.total ?? 0),
        0
      );
  }, [normalizedExpenses, todayString]);

  // =========================================
  // حساب إجمالي الأسبوع
  // =========================================

  const weekExpenses = useMemo(() => {
    return normalizedExpenses
      .filter((expense) => {
        const date = getDateString(
          expense.expenseDate
        );

        if (!date) return false;

        return (
          date >= weekStartString &&
          date <= todayString
        );
      })
      .reduce(
        (sum, expense) =>
          sum + Number(expense.total ?? 0),
        0
      );
  }, [
    normalizedExpenses,
    weekStartString,
    todayString,
  ]);

  // =========================================
  // حساب إجمالي الشهر
  // =========================================

  const monthExpenses = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    const monthString =
      `${year}-${String(month).padStart(
        2,
        "0"
      )}`;

    return normalizedExpenses
      .filter((expense) => {
        const date = getDateString(
          expense.expenseDate
        );

        return date.startsWith(
          monthString
        );
      })
      .reduce(
        (sum, expense) =>
          sum + Number(expense.total ?? 0),
        0
      );
  }, [normalizedExpenses, todayString]);

  // =========================================
  // حساب إجمالي السنة
  // =========================================

  const yearExpenses = useMemo(() => {
    const yearString =
      String(today.getFullYear());

    return normalizedExpenses
      .filter((expense) => {
        const date = getDateString(
          expense.expenseDate
        );

        return date.startsWith(
          yearString
        );
      })
      .reduce(
        (sum, expense) =>
          sum + Number(expense.total ?? 0),
        0
      );
  }, [normalizedExpenses, todayString]);

  // =========================================
  // البحث
  // =========================================

  const filteredExpenses = useMemo(() => {
    const text = search.trim().toLowerCase();

    if (!text) {
      return normalizedExpenses;
    }

    return normalizedExpenses.filter((expense) => {
      const project = getProjectName(
        String(expense.projectId ?? "")
      ).toLowerCase();

      const account = getAccountName(
        String(expense.accountId ?? "")
      ).toLowerCase();

      const category = getCategoryName(
        String(expense.categoryId ?? "")
      ).toLowerCase();

      const item = getItemName(
        String(expense.itemId ?? "")
      ).toLowerCase();

      const supplier = String(
        expense.supplier ?? ""
      ).toLowerCase();

      const voucher = String(
        expense.voucherNo ?? ""
      ).toLowerCase();

      return (
        project.includes(text) ||
        account.includes(text) ||
        category.includes(text) ||
        item.includes(text) ||
        supplier.includes(text) ||
        voucher.includes(text) ||
        String(getStageName(expense)).toLowerCase().includes(text)
      );
    });
  }, [
    normalizedExpenses,
    accounts,
    categories,
    expenseItems,
    search,
  ]);
  // =========================================
  // طريقة الدفع
  // =========================================

  const getPaymentMethod = (
    value?: string | null
  ) => {
    switch (
      String(value ?? "")
        .trim()
        .toLowerCase()
    ) {
      case "cash":
      case "نقد":
      case "نقدًا":
      case "نقدا":
        return "💵 نقدًا";

      case "bank":
      case "bank transfer":
      case "bank_transfer":
      case "transfer":
      case "تحويل":
      case "تحويل بنكي":
        return "🏦 تحويل بنكي";

      case "card":
      case "credit card":
      case "debit card":
      case "بطاقة":
        return "💳 بطاقة";

      case "cheque":
      case "check":
      case "شيك":
        return "🧾 شيك";

      case "other":
      case "أخرى":
      case "اخرى":
        return "💰 أخرى";

      default:
        return value ? String(value) : "-";
    }
  };

  // =========================================
  // عرض
  // =========================================

  const [selectedExpense, setSelectedExpense] =
  useState<Expense | null>(null);

  const handleView = (expense: Expense) => {
    setSelectedExpense(expense);
  };

  // =========================================
  // تعديل
  // =========================================

  const handleEdit = (
    expense: Expense
  ) => {
    if (onEditExpense) {
      onEditExpense(expense);
      return;
    }

    alert(
      "زر التعديل جاهز، وسنربطه الآن بنافذة تعديل المصروف."
    );
  };

  // =========================================
  // حذف
  // =========================================

  const handleDelete = async (
    expense: Expense
  ) => {
    const confirmed =
      window.confirm(
        "هل أنت متأكد من حذف هذا المصروف؟\n\n" +
          `الإجمالي: ${Number(
            expense.total ?? 0
          ).toLocaleString()} ريال`
      );

    if (!confirmed) return;

    if (onDeleteExpense) {
      onDeleteExpense(expense);
      return;
    }

    const { error } =
      await supabase
        .from("expenses")
        .delete()
        .eq("id", expense.id);

    if (error) {
      console.error(
        "خطأ في حذف المصروف:",
        error
      );

      alert(
        `تعذر حذف المصروف:\n${error.message}`
      );

      return;
    }

    alert("تم حذف المصروف بنجاح.");

    // تحديث الجدول مباشرة بعد الحذف بدون إعادة تحميل الموقع بالكامل.
    await loadExpenses();
  };

  // =========================================
  // الواجهة
  // =========================================

  return (
    <div
      dir="rtl"
      className="space-y-6"
    >
      {/* ===================================== */}
      {/* الإحصائيات */}
      {/* ===================================== */}

      <div className="grid grid-cols-4 gap-5">

        {/* اليوم */}

        <div className="rounded-2xl border border-orange-400/20 bg-[#081B33] p-5">
          <p className="text-sm text-gray-400">
            مصروفات اليوم
          </p>

          <h2 className="mt-3 text-3xl font-bold text-orange-400">
            {todayExpenses.toLocaleString()}
          </h2>

          <span className="text-sm text-gray-500">
            ريال
          </span>
        </div>

        {/* الأسبوع */}

        <div className="rounded-2xl border border-purple-400/20 bg-[#081B33] p-5">
          <p className="text-sm text-gray-400">
            مصروفات الأسبوع
          </p>

          <h2 className="mt-3 text-3xl font-bold text-purple-400">
            {weekExpenses.toLocaleString()}
          </h2>

          <span className="text-sm text-gray-500">
            ريال
          </span>
        </div>

        {/* الشهر */}

        <div className="rounded-2xl border border-emerald-400/20 bg-[#081B33] p-5">
          <p className="text-sm text-gray-400">
            مصروفات الشهر
          </p>

          <h2 className="mt-3 text-3xl font-bold text-emerald-400">
            {monthExpenses.toLocaleString()}
          </h2>

          <span className="text-sm text-gray-500">
            ريال
          </span>
        </div>

        {/* السنة */}

        <div className="rounded-2xl border border-yellow-400/20 bg-[#081B33] p-5">
          <p className="text-sm text-gray-400">
            إجمالي السنة
          </p>

          <h2 className="mt-3 text-3xl font-bold text-yellow-400">
            {yearExpenses.toLocaleString()}
          </h2>

          <span className="text-sm text-gray-500">
            ريال
          </span>
        </div>

      </div>

      {/* ===================================== */}
      {/* شريط الأدوات */}
      {/* ===================================== */}

      <div className="rounded-2xl border border-white/10 bg-[#081B33] p-5">

        <div className="flex items-center justify-between gap-4">

          <button
            type="button"
            onClick={onAddExpense}
            className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-[#081B33] transition hover:bg-yellow-300"
          >
            + إضافة مصروف
          </button>

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="بحث بالمشروع أو العهدة أو البند أو المورد..."
            className="w-full max-w-xl rounded-xl border border-white/10 bg-[#102947] px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-yellow-400"
          />

        </div>

      </div>

      {/* ===================================== */}
      {/* الجدول */}
      {/* ===================================== */}

      {expensesError && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-right text-sm text-red-300">
          <div className="font-bold">تعذر تحميل المصروفات من قاعدة البيانات</div>
          <div className="mt-1 text-xs opacity-80">{expensesError}</div>
          <button
            type="button"
            onClick={loadExpenses}
            className="mt-3 rounded-lg bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#081B33]">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1500px]">

            <thead className="bg-[#102947]">

              <tr>

                <th className="p-4 text-center text-sm text-white">
                  تاريخ الإدخال
                </th>

                <th className="p-4 text-center text-sm text-white">
                  تاريخ المصروف
                </th>

                <th className="p-4 text-center text-sm text-white">
                  رقم الفاتورة
                </th>

                <th className="p-4 text-center text-sm text-white">
                  المشروع
                </th>

                <th className="p-4 text-center text-sm text-white">
                  المرحلة
                </th>

                <th className="p-4 text-center text-sm text-white">
                  العهدة
                </th>

                <th className="p-4 text-center text-sm text-white">
                  التصنيف
                </th>

                <th className="p-4 text-center text-sm text-white">
                  البند
                </th>

                <th className="p-4 text-center text-sm text-white">
                  المورد
                </th>

                <th className="p-4 text-center text-sm text-white">
                  طريقة الدفع
                </th>

                <th className="p-4 text-center text-sm text-white">
                  قبل الضريبة
                </th>

                <th className="p-4 text-center text-sm text-white">
                  الضريبة
                </th>

                <th className="p-4 text-center text-sm text-white">
                  الإجمالي
                </th>

                <th className="p-4 text-center text-sm text-white">
                  الإجراءات
                </th>

              </tr>

            </thead>

            <tbody>

              {expensesLoading ? (

                <tr>
                  <td
                    colSpan={14}
                    className="p-12 text-center text-gray-400"
                  >
                    جاري تحميل المصروفات...
                  </td>
                </tr>

              ) : filteredExpenses.length === 0 ? (

                <tr>

                  <td
                    colSpan={14}
                    className="p-12 text-center text-gray-500"
                  >
                    لا توجد بيانات حتى الآن
                  </td>

                </tr>

              ) : (

                filteredExpenses.map(
                  (expense) => (

                    <tr
                      key={expense.id}
                      className="border-t border-white/10 transition hover:bg-[#102947]"
                    >

                      {/* تاريخ الإدخال */}

                      <td className="p-3 text-center text-gray-300">
                        {formatDate(
                          expense.entryDate
                        )}
                      </td>

                      {/* تاريخ المصروف */}

                      <td className="p-3 text-center text-gray-300">
                        {formatDate(
                          expense.expenseDate
                        )}
                      </td>

                      {/* رقم الفاتورة */}

                      <td className="p-3 text-center">
                        {expense.voucherNo || "-"}
                      </td>

                      {/* المشروع */}

                      <td className="p-3 text-center">
                        {getProjectName(
                          expense.projectId
                        )}
                      </td>

                      {/* المرحلة */}

                      <td className="p-3 text-center">
                        <span
                          className="inline-flex items-center gap-2 rounded-lg border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-300"
                          title="مرحلة المشروع"
                        >
                          <span aria-hidden="true">🏗️</span>
                          <span>{getStageName(expense)}</span>
                        </span>
                      </td>

                      {/* العهدة */}

                      <td className="p-3 text-center">
                        {expense.accountName ?? getAccountName(expense.accountId)}
                      </td>

                      {/* التصنيف */}

                      <td className="p-3 text-center">
                        {getCategoryName(
                          expense.categoryId
                        )}
                      </td>

                      {/* البند */}

                      <td className="p-3 text-center">
                        {expense.itemName ?? getItemName(expense.itemId)}
                      </td>

                      {/* المورد */}

                      <td className="p-3 text-center">
                        {expense.supplier || "-"}
                      </td>

                      {/* طريقة الدفع */}

                      <td className="p-3 text-center">
                        {getPaymentMethod(
                          expense.paymentMethod
                        )}
                      </td>

                      {/* قبل الضريبة */}

                      <td className="p-3 text-center font-semibold">
  {Number(
    expense.amount ?? 0
  ).toLocaleString()}
</td>

                      {/* الضريبة */}

                      <td className="p-3 text-center">
                        {Number(
                          expense.tax ?? 0
                        ).toLocaleString()}
                      </td>

                      {/* الإجمالي */}

                      <td className="p-3 text-center font-bold text-yellow-400">
                        {Number(
                          expense.total ?? 0
                        ).toLocaleString()}
                      </td>

                      {/* الإجراءات */}

                      <td className="p-3">

                        <div className="flex justify-center gap-2">

                          <button
  type="button"
  onClick={() => handleView(expense)}
  className="
    rounded-lg
    bg-sky-500
    px-3
    py-2
    text-xs
    font-bold
    text-white
    transition
    hover:bg-sky-600
  "
>
  👁 عرض
</button>

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                expense
                              )
                            }
                            className="rounded-lg bg-yellow-500 px-3 py-2 text-xs font-bold text-[#081B33] transition hover:bg-yellow-400"
                          >
                            ✏ تعديل
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                expense
                              )
                            }
                            className="rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-600"
                          >
                            🗑 حذف
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>
{selectedExpense && (
  <div
    className="
      fixed
      inset-0
      z-[200]
      flex
      items-center
      justify-center
      bg-black/70
      p-4
      backdrop-blur-sm
    "
    onClick={() =>
      setSelectedExpense(null)
    }
  >

    <div
      dir="rtl"
      className="
        w-full
        max-w-4xl
        overflow-hidden
        rounded-[28px]
        border
        border-white/10
        bg-[#081B33]
        shadow-2xl
      "
      onClick={(e) =>
        e.stopPropagation()
      }
    >

      {/* Header */}

      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-white/10
          bg-[#102947]
          px-7
          py-5
        "
      >

        <div>

          <h2 className="text-2xl font-bold text-white">
            تفاصيل المصروف
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            رقم العملية: #{selectedExpense.id}
          </p>

        </div>

        <button
          type="button"
          onClick={() =>
            setSelectedExpense(null)
          }
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-white/5
            text-xl
            text-gray-400
            transition
            hover:bg-red-500/20
            hover:text-red-400
          "
        >
          ✕
        </button>

      </div>


      {/* Content */}

      <div className="p-7">

        {/* المعلومات الأساسية */}

        <div className="mb-6 grid grid-cols-2 gap-4">

          <ViewBox
            label="تاريخ الإدخال"
            value={formatDate(
              selectedExpense.entryDate
            )}
          />

          <ViewBox
            label="تاريخ المصروف"
            value={formatDate(
              selectedExpense.expenseDate
            )}
          />

          <ViewBox
            label="المشروع"
            value={getProjectName(
              selectedExpense.projectId
            )}
          />

          <ViewBox
            label="العهدة"
            value={
              selectedExpense.accountName ??
              getAccountName(selectedExpense.accountId)
            }
          />

          <ViewBox
            label="المرحلة"
            value={`🏗️ ${getStageName(selectedExpense)}`}
          />

          <ViewBox
            label="التصنيف"
            value={getCategoryName(
              selectedExpense.categoryId
            )}
          />

          <ViewBox
            label="البند"
            value={
              selectedExpense.itemName ??
              getItemName(selectedExpense.itemId)
            }
          />

          <ViewBox
            label="المورد"
            value={
              selectedExpense.supplier ||
              "-"
            }
          />

          <ViewBox
            label="رقم الفاتورة"
            value={
              selectedExpense.voucherNo ||
              "-"
            }
          />

          <ViewBox
            label="طريقة الدفع"
            value={getPaymentMethod(
              selectedExpense.paymentMethod
            )}
          />

        </div>


        {/* المبالغ */}

        <div className="grid grid-cols-3 gap-4">

          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-[#102947]
              p-5
            "
          >

            <p className="text-sm text-gray-400">
              قبل الضريبة
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {Number(
                selectedExpense.amount ?? 0
              ).toLocaleString()}
              <span className="mr-2 text-sm text-gray-500">
                ريال
              </span>
            </p>

          </div>


          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-[#102947]
              p-5
            "
          >

            <p className="text-sm text-gray-400">
              الضريبة
            </p>

            <p className="mt-2 text-2xl font-bold text-orange-400">
              {Number(
                selectedExpense.tax ?? 0
              ).toLocaleString()}
              <span className="mr-2 text-sm text-gray-500">
                ريال
              </span>
            </p>

          </div>


          <div
            className="
              rounded-2xl
              border
              border-yellow-400/20
              bg-yellow-400/10
              p-5
            "
          >

            <p className="text-sm text-gray-400">
              إجمالي الفاتورة
            </p>

            <p className="mt-2 text-2xl font-bold text-yellow-400">
              {Number(
                selectedExpense.total ?? 0
              ).toLocaleString()}
              <span className="mr-2 text-sm text-gray-500">
                ريال
              </span>
            </p>

          </div>

        </div>


        {/* الوصف */}

        {selectedExpense.description && (
          <div
            className="
              mt-6
              rounded-2xl
              border
              border-white/10
              bg-[#102947]
              p-5
            "
          >

            <p className="mb-2 text-sm text-gray-400">
              الوصف
            </p>

            <p className="leading-7 text-white">
              {selectedExpense.description}
            </p>

          </div>
        )}

      </div>


      {/* Footer */}

      <div
        className="
          flex
          justify-end
          border-t
          border-white/10
          bg-[#102947]
          px-7
          py-4
        "
      >

        <button
          type="button"
          onClick={() =>
            setSelectedExpense(null)
          }
          className="
            rounded-xl
            bg-yellow-400
            px-7
            py-3
            font-bold
            text-[#081B33]
            transition
            hover:bg-yellow-300
          "
        >
          إغلاق
        </button>

      </div>

    </div>

  </div>
)}
    </div>
  );
}