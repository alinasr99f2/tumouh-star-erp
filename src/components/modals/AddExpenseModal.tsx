import { useEffect, useMemo, useState } from "react";

import ExpenseBasicInfo from "../expense/ExpenseBasicInfo";
import ExpensePayment from "../expense/ExpensePayment";
import ExpenseAttachments from "../expense/ExpenseAttachments";
import ExpenseNotes from "../expense/ExpenseNotes";
import ExpenseActions from "../expense/ExpenseActions";

import type {
  Expense,
  ExpenseCategory,
  ExpenseClassification,
} from "../../data/expenses";

import type { Villa } from "../../data/villas";

type Stage = {
  id: number;
  name: string;
  active?: boolean;
};

type AddExpenseModalProps = {
  isOpen: boolean;

  villas: Villa[];

  categories: ExpenseCategory[];

  classifications: ExpenseClassification[];

  onClose: () => void;

  onAddExpense: (expense: Expense) => void;

  onAddCategory: (
    name: string
  ) => ExpenseCategory;

  onAddClassification: (
    categoryId: string,
    name: string
  ) => ExpenseClassification;
};

const STAGES_KEY = "tumouh-expense-stages";

const FALLBACK_STAGES: Stage[] = [
  {
    id: 1,
    name: "تمهيدي",
    active: true,
  },
  {
    id: 2,
    name: "إنشائي",
    active: true,
  },
  {
    id: 3,
    name: "تشطيبي",
    active: true,
  },
  {
    id: 4,
    name: "ديكورات",
    active: true,
  },
];

export default function AddExpenseModal({
  isOpen,
  villas,
  categories,
  classifications,
  onClose,
  onAddExpense,
  onAddCategory,
  onAddClassification,
}: AddExpenseModalProps) {
  const today = new Date()
    .toISOString()
    .split("T")[0];

  const [operationNo] = useState(Date.now());

  const [date, setDate] = useState(today);

  const [projectId] = useState("TABUK");

  const [projectName] = useState(
    "مشروع فلل تبوك"
  );

  const [
    operationType,
    setOperationType,
  ] = useState("");

  const [
    stages,
    setStages,
  ] = useState<Stage[]>([]);

  const [
    stageId,
    setStageId,
  ] = useState<number | null>(null);

  const [
    categoryId,
    setCategoryId,
  ] = useState("");

  const [
    classificationId,
    setClassificationId,
  ] = useState("");

  const [
    supplier,
    setSupplier,
  ] = useState("");

  const [
    voucherNo,
    setVoucherNo,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    amount,
    setAmount,
  ] = useState("");

  const [
    taxPercent,
    setTaxPercent,
  ] = useState("15");

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("Cash");

  const [
    paymentSource,
    setPaymentSource,
  ] = useState("");

  const [
    currency,
    setCurrency,
  ] = useState("SAR");

  const [
    status,
    setStatus,
  ] = useState("Paid");

  const [
    custodyId,
    setCustodyId,
  ] = useState("");

  const [
    attachments,
    setAttachments,
  ] = useState<File[]>([]);

  const [
    notes,
    setNotes,
  ] = useState("");

  /*
   * =========================================================
   * قراءة المراحل من CategoriesPage
   * =========================================================
   */

  const loadStages = () => {
    try {
      const saved =
        localStorage.getItem(STAGES_KEY);

      let loadedStages: Stage[] = [];

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          loadedStages = parsed.filter(
            (stage): stage is Stage =>
              stage &&
              typeof stage.id === "number" &&
              typeof stage.name === "string"
          );
        }
      }

      /*
       * لو مفيش مراحل محفوظة نستخدم
       * المراحل الافتراضية.
       */
      if (loadedStages.length === 0) {
        loadedStages = FALLBACK_STAGES;
      }

      /*
       * نعرض المراحل الفعالة فقط.
       */
      const activeStages =
        loadedStages.filter(
          (stage) =>
            stage.active !== false
        );

      const finalStages =
        activeStages.length > 0
          ? activeStages
          : loadedStages;

      setStages(finalStages);

      /*
       * الافتراضي = إنشائي
       */
      const constructionStage =
        finalStages.find(
          (stage) =>
            stage.name.trim() ===
            "إنشائي"
        );

      if (constructionStage) {
        setStageId(
          constructionStage.id
        );
        return;
      }

      /*
       * لو إنشائي مش موجودة
       * اختار أول مرحلة.
       */
      if (finalStages.length > 0) {
        setStageId(
          finalStages[0].id
        );
      } else {
        setStageId(null);
      }
    } catch (error) {
      console.error(
        "Error loading expense stages:",
        error
      );

      setStages(FALLBACK_STAGES);

      setStageId(2);
    }
  };

  /*
   * تحميل المراحل عند فتح المودال
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    loadStages();
  }, [isOpen]);

  /*
   * لو أضفنا مرحلة من صفحة التصنيفات
   * نعيد تحميلها فورًا.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleFinancialUpdate = () => {
      loadStages();
    };

    window.addEventListener(
      "tumouh-financial-data-updated",
      handleFinancialUpdate
    );

    return () => {
      window.removeEventListener(
        "tumouh-financial-data-updated",
        handleFinancialUpdate
      );
    };
  }, [isOpen]);

  /*
   * لو المراحل نفسها اتغيرت في localStorage
   * من تبويب آخر.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleStorage = (
      event: StorageEvent
    ) => {
      if (
        event.key === STAGES_KEY
      ) {
        loadStages();
      }
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [isOpen]);

  /*
   * =========================================================
   * الحسابات
   * =========================================================
   */

  const tax = useMemo(() => {
    return (
      Number(amount || 0) *
      Number(taxPercent || 0) /
      100
    );
  }, [
    amount,
    taxPercent,
  ]);

  const total = useMemo(() => {
    return (
      Number(amount || 0) +
      tax
    );
  }, [
    amount,
    tax,
  ]);

  /*
   * =========================================================
   * إنشاء المصروف
   *
   * مهم:
   * نستخدم cast في النهاية لأن Expense type
   * الموجود عندك مختلف عن الحقول القديمة
   * التي كانت مستخدمة في المودال.
   *
   * ونضيف stageId كبيانات إضافية بدون
   * كسر TypeScript.
   * =========================================================
   */

  const createExpense = (): Expense => {
    const expenseData = {
      id: crypto.randomUUID(),

      voucherNo,

      date,

      expenseDate: date,

      projectId,

      categoryId,

      classificationId,

      supplier,

      paymentMethod,

      amount: Number(amount || 0),

      tax,

      total,

      status,

      stageId,

      stageName:
        stages.find(
          (stage) =>
            stage.id === stageId
        )?.name || "",

      operationNo,

      projectName,

      operationType,

      paymentSource,

      custodyId,

      currency,

      description,

      attachment: "",

      notes,

      createdAt:
        new Date().toISOString(),
    };

    return expenseData as unknown as Expense;
  };

  /*
   * =========================================================
   * حفظ المصروف
   * =========================================================
   */

  const handleSave = () => {
    const expense =
      createExpense();

    onAddExpense(expense);

    onClose();
  };

  /*
   * =========================================================
   * حفظ وإضافة جديد
   * =========================================================
   */

  const handleSaveAndNew = () => {
    const expense =
      createExpense();

    onAddExpense(expense);

    /*
     * تنظيف بيانات المصروف فقط.
     *
     * المرحلة تظل إنشائي
     * لأنها الاختيار الافتراضي.
     */

    setSupplier("");

    setVoucherNo("");

    setDescription("");

    setAmount("");

    setNotes("");
  };

  /*
   * =========================================================
   * لا نعرض شيء لو المودال مقفول
   * =========================================================
   */

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div
        className="expense-modal"
        dir="rtl"
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="modal-header">
          <div>
            <h2>
              إضافة مصروف جديد
            </h2>

            <span>
              {projectName}
            </span>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* ================================================= */}
        {/* BODY */}
        {/* ================================================= */}

        <div className="modal-body">

          <ExpenseBasicInfo
            operationNo={
              operationNo
            }

            date={date}

            projectName={
              projectName
            }

            operationType={
              operationType
            }

            stageId={stageId}

            stages={stages}

            categoryId={
              categoryId
            }

            classificationId={
              classificationId
            }

            supplier={
              supplier
            }

            voucherNo={
              voucherNo
            }

            description={
              description
            }

            categories={
              categories
            }

            classifications={
              classifications
            }

            onDateChange={
              setDate
            }

            onOperationTypeChange={
              setOperationType
            }

            onStageChange={
              setStageId
            }

            onCategoryChange={
              setCategoryId
            }

            onClassificationChange={
              setClassificationId
            }

            onSupplierChange={
              setSupplier
            }

            onVoucherChange={
              setVoucherNo
            }

            onDescriptionChange={
              setDescription
            }

            onAddCategory={() => {
              onAddCategory("");
            }}

            onAddClassification={() => {
              onAddClassification(
                categoryId,
                ""
              );
            }}
          />

          <ExpensePayment
            amount={
              amount
            }

            taxPercent={
              taxPercent
            }

            tax={
              tax
            }

            total={
              total
            }

            paymentMethod={
              paymentMethod
            }

            paymentSource={
              paymentSource
            }

            currency={
              currency
            }

            status={
              status
            }

            custodyId={
              custodyId
            }

            onAmountChange={
              setAmount
            }

            onTaxPercentChange={
              setTaxPercent
            }

            onPaymentMethodChange={
              setPaymentMethod
            }

            onPaymentSourceChange={
              setPaymentSource
            }

            onCurrencyChange={
              setCurrency
            }

            onStatusChange={
              setStatus
            }

            onCustodyChange={
              setCustodyId
            }
          />

          <ExpenseAttachments
            attachments={
              attachments
            }

            onFilesChange={
              setAttachments
            }
          />

          <ExpenseNotes
            notes={
              notes
            }

            onNotesChange={
              setNotes
            }
          />

          <ExpenseActions
            onCancel={
              onClose
            }

            onSave={
              handleSave
            }

            onSaveAndNew={
              handleSaveAndNew
            }
          />

        </div>
      </div>
    </div>
  );
}