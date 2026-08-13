import { useEffect, useState } from "react";

import {
  Receipt,
  Wallet,
  Landmark,
  FolderTree,
  Layers3,
  Tags,
  ListPlus,
  Plus,
  Eye,
  ArrowUpRight,
} from "lucide-react";

import ExpensesPage from "./ExpensesPage";
import FundingPage from "./FundingPage";

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

  // ==========================================
  // إدارة المراحل والتصنيفات والبنود
  // ==========================================
  const [stages, setStages] = useState<any[]>(() => {
    const saved = localStorage.getItem("tumouh-expense-stages");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore and use defaults
      }
    }
    return [
      { id: "preliminary", name: "تمهيدي" },
      { id: "structural", name: "إنشائي" },
      { id: "finishing", name: "تشطيبي" },
      { id: "decorations", name: "ديكورات" },
    ];
  });

  const [openStageModal, setOpenStageModal] = useState(false);
  const [openCategoryModal, setOpenCategoryModal] = useState(false);
  const [openItemModal, setOpenItemModal] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategoryId, setNewItemCategoryId] = useState("");

  // ==========================================
  // حساب إجمالي المصروف بشكل موحّد
  // ==========================================
  const getExpenseTotal = (item: any) => {
    const directTotal = Number(
      item?.total ??
      item?.grand_total ??
      item?.total_amount ??
      item?.totalAmount ??
      0
    );

    if (Number.isFinite(directTotal) && directTotal > 0) {
      return directTotal;
    }

    const amount = Number(
      item?.amount ??
      item?.subtotal ??
      item?.before_tax ??
      item?.totalBeforeTax ??
      0
    );

    const tax = Number(
      item?.tax ??
      item?.tax_amount ??
      0
    );

    return amount + tax;
  };

  useEffect(() => {
    localStorage.setItem("tumouh-expense-stages", JSON.stringify(stages));
  }, [stages]);

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
  .select("id, account_id, amount")
  .not("account_id", "is", null),

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

  // حتى لو فشل استعلام واحد، نظل نعرض أي بيانات نجحت في التحميل.
  setFunding(fundingRows);
  setExpenses(expenseRows);

  let savedStageMap: Record<string, { id?: string | number; name?: string }> = {};
  try {
    savedStageMap = JSON.parse(
      localStorage.getItem("tumouh-expense-stage-map") || "{}"
    );
  } catch {
    savedStageMap = {};
  }

  const expensesWithStages = expenseRows.map((row) => {
    const savedStage = savedStageMap[String(row.id)];
    return {
      ...row,
      stageId:
        row.stage_id ??
        row.stageId ??
        row.phase_id ??
        row.phaseId ??
        savedStage?.id ??
        null,
      stageName:
        row.stage_name ??
        row.stageName ??
        row.phase_name ??
        row.phaseName ??
        savedStage?.name ??
        null,
    };
  });

  setExpenses(expensesWithStages);
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
      (sum, item) => sum + getExpenseTotal(item),
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

    // حفظ المرحلة محليًا للمصروف حتى تظل ظاهرة بعد إعادة فتح الصفحة.
    if (savedExpense?.id && expense.stageId) {
      try {
        const currentMap = JSON.parse(
          localStorage.getItem("tumouh-expense-stage-map") || "{}"
        );
        currentMap[String(savedExpense.id)] = {
          id: expense.stageId,
          name: expense.stageName ?? null,
        };
        localStorage.setItem(
          "tumouh-expense-stage-map",
          JSON.stringify(currentMap)
        );
      } catch {
        // لا نوقف حفظ المصروف بسبب localStorage
      }
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

      stageId:
        savedExpense?.stage_id ??
        savedExpense?.phase_id ??
        expense.stageId ??
        null,

      stageName:
        savedExpense?.stage_name ??
        savedExpense?.phase_name ??
        expense.stageName ??
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
  const totalExpensesAmount = expenses.reduce(
    (sum, item) => sum + getExpenseTotal(item),
    0
  );

  const totalAccounts = accounts.length;

  // نعتمد على رقم العملية id حتى لا تتكرر نفس العملية في الإجماليات
  // إذا وصلت البيانات للحالة أكثر من مرة.
  const uniqueFunding = Array.from(
  new Map(
    funding.map((item) => [String(item.id), item])
  ).values()
);

  const uniqueExpenses = Array.from(
    new Map(
      expenses.map((item) => [String(item.id), item])
    ).values()
  );

  const totalFundingOperations = uniqueFunding.length;

  const totalFundingAmount = uniqueFunding.reduce(
    (sum, item) => sum + Number(item.amount ?? 0),
    0
  );

 

  // إجمالي العمليات الحقيقي = التغذية الحقيقية + المصروفات الحقيقية.
  const totalOperationsCount =
    uniqueFunding.length + uniqueExpenses.length;

  const totalExpenseItems = expenseItems.length;
  const totalCategories = categories.length;
  const totalStages = stages.length;

  const handleAddStage = () => {
    const name = newStageName.trim();
    if (!name) {
      alert("من فضلك اكتب اسم المرحلة");
      return;
    }
    if (stages.some((stage) => stage.name.trim().toLowerCase() === name.toLowerCase())) {
      alert("هذه المرحلة موجودة بالفعل");
      return;
    }
    setStages((prev) => [
      ...prev,
      { id: `stage-${Date.now()}`, name },
    ]);
    setNewStageName("");
    setOpenStageModal(false);
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      alert("من فضلك اكتب اسم التصنيف");
      return;
    }

    const exists = categories.some(
      (category) => category.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      alert("هذا التصنيف موجود بالفعل");
      return;
    }

    const { data, error } = await supabase
      .from("categories")
      .insert([{ name }])
      .select("id, name")
      .single();

    if (error) {
      console.error("خطأ في إضافة التصنيف:", error);
      alert(`تعذر إضافة التصنيف:\n${error.message}`);
      return;
    }

    setCategories((prev) => [...prev, data]);
    setNewCategoryName("");
    setOpenCategoryModal(false);
  };

  const handleAddItem = async () => {
    const name = newItemName.trim();
    if (!name) {
      alert("من فضلك اكتب اسم البند");
      return;
    }
    if (!newItemCategoryId) {
      alert("من فضلك اختر التصنيف");
      return;
    }

    const exists = expenseItems.some(
      (item) =>
        String(item.category_id) === String(newItemCategoryId) &&
        item.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      alert("هذا البند موجود بالفعل داخل التصنيف المختار");
      return;
    }

    const { data, error } = await supabase
      .from("expense_items")
      .insert([{
        name,
        category_id: Number(newItemCategoryId),
      }])
      .select("id, name, category_id")
      .single();

    if (error) {
      console.error("خطأ في إضافة البند:", error);
      alert(`تعذر إضافة البند:\n${error.message}`);
      return;
    }

    setExpenseItems((prev) => [...prev, data]);
    setNewItemName("");
    setNewItemCategoryId("");
    setOpenItemModal(false);
  };

  return (

    <div className="space-y-8">

      <div className="rounded-[28px] border border-white/10 bg-[#081B33] p-8 text-center">

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
      {totalExpensesAmount.toLocaleString()}
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
      {totalFundingAmount.toLocaleString()}
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
      {totalOperationsCount}
    </h2>

    <span className="text-sm text-gray-500">
      عملية
    </span>
  </div>

</div>

        <div className="w-full">

          <div className="rounded-[28px] border border-white/10 bg-[#081B33] p-6">

            <div className="relative mb-8 flex items-center justify-center text-center">

              <div>
                <h2 className="text-3xl font-bold text-white">
                  الأقسام المالية
                </h2>
                <p className="mt-2 text-gray-400">
                  اختر القسم الذي تريد العمل عليه
                </p>
              </div>

              <div className="absolute left-0 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-5 py-3 font-bold text-yellow-400">
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
        {totalExpensesAmount.toLocaleString()}
      </div>

      <div
        className={`mt-1 text-sm ${
          activeTab === "expenses"
            ? "text-[#081B33]/70"
            : "text-gray-400"
        }`}
      >
        إجمالي المصروفات (ريال)
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
        {totalAccounts}
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
        {totalFundingOperations}
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

  <div className="mt-5 grid grid-cols-3 gap-3 text-center">
    <div className={`rounded-2xl px-3 py-3 ${activeTab === "categories" ? "bg-white/20" : "bg-white/5"}`}>
      <div className="text-2xl font-extrabold">{totalExpenseItems}</div>
      <div className={`mt-1 text-xs ${activeTab === "categories" ? "text-[#081B33]/70" : "text-gray-400"}`}>إجمالي البنود</div>
    </div>
    <div className={`rounded-2xl px-3 py-3 ${activeTab === "categories" ? "bg-white/20" : "bg-white/5"}`}>
      <div className="text-2xl font-extrabold">{totalCategories}</div>
      <div className={`mt-1 text-xs ${activeTab === "categories" ? "text-[#081B33]/70" : "text-gray-400"}`}>إجمالي التصنيفات</div>
    </div>
    <div className={`rounded-2xl px-3 py-3 ${activeTab === "categories" ? "bg-white/20" : "bg-white/5"}`}>
      <div className="text-2xl font-extrabold">{totalStages}</div>
      <div className={`mt-1 text-xs ${activeTab === "categories" ? "text-[#081B33]/70" : "text-gray-400"}`}>إجمالي المراحل</div>
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
/>
      
    </>
  )}

  {activeTab === "accounts" && (
    <div dir="rtl" className="space-y-6">
      <div className="relative flex items-center justify-center rounded-3xl border border-white/10 bg-[#081B33] p-6 text-center">
        <div>
          <h2 className="text-3xl font-extrabold text-white">العهد المالية</h2>
          <p className="mt-2 text-gray-400">إدارة جميع العهد والأرصدة المالية</p>
        </div>
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-6 py-4 text-center">
          <div className="text-3xl font-extrabold text-emerald-400">{accounts.length}</div>
          <div className="mt-1 text-sm text-gray-400">إجمالي العهد</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {accounts.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-white/10 bg-[#081B33] p-12 text-center text-gray-500">
            لا توجد عهد مالية مدخلة حتى الآن
          </div>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="rounded-3xl border border-white/10 bg-[#102947] p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-extrabold text-white">{account.name}</h3>
                  <p className="mt-1 text-sm text-gray-400">{account.type || "عهدة مالية"}</p>
                </div>
                <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-400">
                  <Wallet size={28} />
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-[#081B33] p-5">
                <p className="text-sm text-gray-400">الرصيد الحالي</p>
                <p className="mt-2 text-3xl font-extrabold text-yellow-400">
                  {Number(account.currentBalance ?? 0).toLocaleString()} <span className="text-sm text-gray-500">ريال</span>
                </p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-red-400/10 p-3">
                  <div className="text-lg font-bold text-red-400">{Number(account.totalExpenses ?? 0).toLocaleString()}</div>
                  <div className="text-xs text-gray-400">المصروفات</div>
                </div>
                <div className="rounded-xl bg-green-400/10 p-3">
                  <div className="text-lg font-bold text-green-400">{Number(account.totalFunding ?? 0).toLocaleString()}</div>
                  <div className="text-xs text-gray-400">التغذية</div>
                </div>
                <div className="rounded-xl bg-sky-400/10 p-3">
                  <div className="text-lg font-bold text-sky-400">{Number(account.operationsCount ?? 0)}</div>
                  <div className="text-xs text-gray-400">عدد العمليات</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => handleViewAccount(account)} className="flex items-center justify-center gap-2 rounded-xl border border-sky-400/30 bg-sky-400/10 py-3 font-bold text-sky-300 hover:bg-sky-400/20">
                  <Eye size={18} /> عرض
                </button>
                <button type="button" onClick={() => handleAddFundingForAccount(Number(account.id))} className="flex items-center justify-center gap-2 rounded-xl bg-green-500 py-3 font-bold text-white hover:bg-green-600">
                  <Plus size={18} /> تغذية
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )}

  {activeTab === "funding" && (
    <FundingPage
      onAddFunding={() => setOpenFundingModal(true)}
    />
  )}

   {activeTab === "categories" && (
  <div dir="rtl" className="space-y-6">

    {/* عنوان القسم */}
    <div className="rounded-3xl border border-white/10 bg-[#081B33] p-6 text-center">
      <h2 className="text-3xl font-extrabold text-white">
        البنود والمراحل والتصنيفات
      </h2>

      <p className="mt-2 text-gray-400">
        إدارة المراحل والتصنيفات وبنود المصروفات من مكان واحد
      </p>
    </div>

    {/* كروت الإضافة */}
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

      {/* إضافة مرحلة */}
      <button
        type="button"
        onClick={() => setOpenStageModal(true)}
        className="group rounded-3xl border border-yellow-400/20 bg-[#102947] p-7 text-right transition hover:-translate-y-1 hover:border-yellow-400 hover:bg-[#153457]"
      >
        <div className="flex items-center justify-between">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
            <Layers3 size={34} />
          </div>

          <Plus className="text-yellow-400 opacity-60 group-hover:opacity-100" />
        </div>

        <h3 className="mt-6 text-2xl font-extrabold text-white">
          إضافة مرحلة
        </h3>

        <p className="mt-2 text-gray-400">
          إضافة مرحلة جديدة لاستخدامها مع المصروفات
        </p>

        <div className="mt-5 text-sm font-bold text-yellow-400">
          {stages.length} مراحل مسجلة
        </div>
      </button>


      {/* إضافة تصنيف */}
      <button
        type="button"
        onClick={() => setOpenCategoryModal(true)}
        className="group rounded-3xl border border-purple-400/20 bg-[#102947] p-7 text-right transition hover:-translate-y-1 hover:border-purple-400 hover:bg-[#153457]"
      >
        <div className="flex items-center justify-between">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-400/10 text-purple-300">
            <Tags size={34} />
          </div>

          <Plus className="text-purple-300 opacity-60 group-hover:opacity-100" />
        </div>

        <h3 className="mt-6 text-2xl font-extrabold text-white">
          إضافة تصنيف
        </h3>

        <p className="mt-2 text-gray-400">
          إضافة تصنيف جديد للمصروفات
        </p>

        <div className="mt-5 text-sm font-bold text-purple-300">
          {categories.length} تصنيف مسجل
        </div>
      </button>


      {/* إضافة بند */}
      <button
        type="button"
        onClick={() => setOpenItemModal(true)}
        className="group rounded-3xl border border-orange-400/20 bg-[#102947] p-7 text-right transition hover:-translate-y-1 hover:border-orange-400 hover:bg-[#153457]"
      >
        <div className="flex items-center justify-between">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-400/10 text-orange-300">
            <ListPlus size={34} />
          </div>

          <Plus className="text-orange-300 opacity-60 group-hover:opacity-100" />
        </div>

        <h3 className="mt-6 text-2xl font-extrabold text-white">
          إضافة بند
        </h3>

        <p className="mt-2 text-gray-400">
          إضافة بند وربطه بالتصنيف المناسب
        </p>

        <div className="mt-5 text-3xl font-extrabold text-orange-300">
          {expenseItems.length}
        </div>

        <div className="text-sm text-gray-400">
          إجمالي عدد البنود
        </div>
      </button>

    </div>


    {/* ============================= */}
    {/* الجداول الثلاثة */}
    {/* ============================= */}

    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">


      {/* جدول البنود */}
      <div className="overflow-hidden rounded-3xl border border-orange-400/20 bg-[#081B33]">

        <div className="flex items-center justify-between border-b border-white/10 bg-[#102947] px-5 py-4">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-400/10 text-orange-300">
              <ListPlus size={22} />
            </div>

            <div>
              <h3 className="font-extrabold text-white">
                البنود
              </h3>

              <p className="text-xs text-gray-400">
                بنود المصروفات
              </p>
            </div>
          </div>

          <span className="rounded-xl bg-orange-400/10 px-3 py-1 text-sm font-bold text-orange-300">
            {expenseItems.length}
          </span>

        </div>


        <div className="max-h-[330px] overflow-y-auto">

          {expenseItems.length === 0 ? (

            <div className="px-5 py-10 text-center text-gray-500">
              لا توجد بنود حتى الآن
            </div>

          ) : (

            <table className="w-full text-sm">

              <thead className="sticky top-0 bg-[#102947] text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-right">
                    #
                  </th>

                  <th className="px-4 py-3 text-right">
                    اسم البند
                  </th>

                  <th className="px-4 py-3 text-right">
                    التصنيف
                  </th>
                </tr>
              </thead>


              <tbody>

                {expenseItems.map((item, index) => {

                  const category = categories.find(
                    (c) =>
                      String(c.id) ===
                      String(item.category_id)
                  );

                  return (
                    <tr
                      key={item.id}
                      className="border-t border-white/10 hover:bg-white/5"
                    >

                      <td className="px-4 py-3 text-gray-500">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3 font-bold text-white">
                        {item.name}
                      </td>

                      <td className="px-4 py-3 text-gray-400">
                        {category?.name ?? "-"}
                      </td>

                    </tr>
                  );

                })}

              </tbody>

            </table>

          )}

        </div>

      </div>



      {/* جدول التصنيفات */}
      <div className="overflow-hidden rounded-3xl border border-purple-400/20 bg-[#081B33]">

        <div className="flex items-center justify-between border-b border-white/10 bg-[#102947] px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-400/10 text-purple-300">
              <Tags size={22} />
            </div>

            <div>
              <h3 className="font-extrabold text-white">
                التصنيفات
              </h3>

              <p className="text-xs text-gray-400">
                تصنيفات المصروفات
              </p>
            </div>

          </div>

          <span className="rounded-xl bg-purple-400/10 px-3 py-1 text-sm font-bold text-purple-300">
            {categories.length}
          </span>

        </div>


        <div className="max-h-[330px] overflow-y-auto">

          {categories.length === 0 ? (

            <div className="px-5 py-10 text-center text-gray-500">
              لا توجد تصنيفات حتى الآن
            </div>

          ) : (

            <table className="w-full text-sm">

              <thead className="sticky top-0 bg-[#102947] text-gray-400">
                <tr>

                  <th className="px-4 py-3 text-right">
                    #
                  </th>

                  <th className="px-4 py-3 text-right">
                    اسم التصنيف
                  </th>

                  <th className="px-4 py-3 text-right">
                    عدد البنود
                  </th>

                </tr>
              </thead>


              <tbody>

                {categories.map((category, index) => {

                  const categoryItems =
                    expenseItems.filter(
                      (item) =>
                        String(item.category_id) ===
                        String(category.id)
                    );

                  return (

                    <tr
                      key={category.id}
                      className="border-t border-white/10 hover:bg-white/5"
                    >

                      <td className="px-4 py-3 text-gray-500">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3 font-bold text-white">
                        {category.name}
                      </td>

                      <td className="px-4 py-3 font-bold text-purple-300">
                        {categoryItems.length}
                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          )}

        </div>

      </div>



      {/* جدول المراحل */}
      <div className="overflow-hidden rounded-3xl border border-yellow-400/20 bg-[#081B33]">

        <div className="flex items-center justify-between border-b border-white/10 bg-[#102947] px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-300">
              <Layers3 size={22} />
            </div>

            <div>
              <h3 className="font-extrabold text-white">
                المراحل
              </h3>

              <p className="text-xs text-gray-400">
                مراحل تنفيذ الأعمال
              </p>
            </div>

          </div>

          <span className="rounded-xl bg-yellow-400/10 px-3 py-1 text-sm font-bold text-yellow-300">
            {stages.length}
          </span>

        </div>


        <div className="max-h-[330px] overflow-y-auto">

          {stages.length === 0 ? (

            <div className="px-5 py-10 text-center text-gray-500">
              لا توجد مراحل حتى الآن
            </div>

          ) : (

            <table className="w-full text-sm">

              <thead className="sticky top-0 bg-[#102947] text-gray-400">
                <tr>

                  <th className="px-4 py-3 text-right">
                    #
                  </th>

                  <th className="px-4 py-3 text-right">
                    اسم المرحلة
                  </th>

                  <th className="px-4 py-3 text-right">
                    الحالة
                  </th>

                </tr>
              </thead>


              <tbody>

                {stages.map((stage, index) => (

                  <tr
                    key={stage.id}
                    className="border-t border-white/10 hover:bg-white/5"
                  >

                    <td className="px-4 py-3 text-gray-500">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3 font-bold text-white">
                      {stage.name}
                    </td>

                    <td className="px-4 py-3">

                      <span className="rounded-lg bg-green-400/10 px-2 py-1 text-xs font-bold text-green-400">
                        نشطة
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          )}

        </div>

      </div>

    </div>

  </div>
)}

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
