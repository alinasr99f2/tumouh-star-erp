import { useState } from "react";

import type { Villa } from "../../data/villas";

import type {
  Expense,
  ExpenseCategory,
  ExpenseClassification,
  ExpenseScope,
  PaymentMethod,
} from "../../data/expenses";


type AddExpenseModalProps = {
  isOpen: boolean;

  villas: Villa[];

  categories: ExpenseCategory[];

  classifications: ExpenseClassification[];

  onClose: () => void;

  onAddExpense: (expense: Expense) => void;

  onAddCategory: (name: string) => ExpenseCategory;

  onAddClassification: (
    categoryId: string,
    name: string
  ) => ExpenseClassification;
};


function AddExpenseModal({
  isOpen,
  villas,
  categories,
  classifications,
  onClose,
  onAddExpense,
  onAddCategory,
  onAddClassification,
}: AddExpenseModalProps) {

  const today =
    new Date().toISOString().split("T")[0];


  // ==========================================
  // FORM STATE
  // ==========================================

  const [date, setDate] =
    useState(today);

  const [amount, setAmount] =
    useState("");

  const [scope, setScope] =
    useState<ExpenseScope>("Project");

  const [villaCode, setVillaCode] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [
    classificationId,
    setClassificationId
  ] = useState("");

  const [itemName, setItemName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [supplier, setSupplier] =
    useState("");

  const [
    paymentMethod,
    setPaymentMethod
  ] = useState<PaymentMethod>("Cash");

  const [
    invoiceNumber,
    setInvoiceNumber
  ] = useState("");

  const [notes, setNotes] =
    useState("");


  // ==========================================
  // FILTER CLASSIFICATIONS
  // ==========================================

  const availableClassifications =
    classifications.filter(
      (classification) =>
        classification.categoryId ===
          categoryId &&
        classification.isActive
    );


  // ==========================================
  // RESET
  // ==========================================

  const resetForm = () => {

    setDate(today);

    setAmount("");

    setScope("Project");

    setVillaCode("");

    setCategoryId("");

    setClassificationId("");

    setItemName("");

    setDescription("");

    setSupplier("");

    setPaymentMethod("Cash");

    setInvoiceNumber("");

    setNotes("");

  };


  // ==========================================
  // CLOSE
  // ==========================================

  const handleClose = () => {

    resetForm();

    onClose();

  };


  // ==========================================
  // ADD CATEGORY
  // ==========================================

  const handleAddCategory = () => {

    const name = window.prompt(
      "اكتب اسم فئة المصروف الجديدة"
    );

    if (!name || !name.trim()) {
      return;
    }

    const newCategory =
      onAddCategory(name.trim());

    setCategoryId(
      newCategory.id
    );

    setClassificationId("");

  };


  // ==========================================
  // ADD CLASSIFICATION
  // ==========================================

  const handleAddClassification = () => {

    if (!categoryId) {

      alert(
        "اختر فئة المصروف أولاً"
      );

      return;

    }


    const name = window.prompt(
      "اكتب اسم التصنيف الجديد"
    );


    if (!name || !name.trim()) {
      return;
    }


    const newClassification =
      onAddClassification(
        categoryId,
        name.trim()
      );


    setClassificationId(
      newClassification.id
    );

  };


  // ==========================================
  // SUBMIT
  // ==========================================

  const [saveMode, setSaveMode] =
  useState<"close" | "continue">("close");

  
  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {

    event.preventDefault();


    if (!date) {

      alert(
        "من فضلك أدخل تاريخ المصروف"
      );

      return;

    }


    if (Number(amount) <= 0) {

      alert(
        "من فضلك أدخل مبلغ صحيح"
      );

      return;

    }


    if (!categoryId) {

      alert(
        "من فضلك اختر فئة المصروف"
      );

      return;

    }


    if (
      scope === "Villa" &&
      !villaCode
    ) {

      alert(
        "من فضلك اختر الفيلا"
      );

      return;

    }


    const newExpense: Expense = {

      id:
        `EXP-${Date.now()}`,

      projectId:
        "TABUK",

      date,

      amount:
        Number(amount),

      scope,

      villaCode:
        scope === "Villa"
          ? villaCode
          : null,

      categoryId,

      classificationId,

      itemName:
        itemName.trim(),

      description:
        description.trim(),

      supplier:
        supplier.trim(),

      paymentMethod,

      invoiceNumber:
        invoiceNumber.trim(),

      notes:
        notes.trim(),

      createdAt:
        new Date().toISOString(),

    };


    onAddExpense(newExpense);

if (saveMode === "continue") {
  setAmount("");
  setItemName("");
  setDescription("");
  setSupplier("");
  setInvoiceNumber("");
  setNotes("");

  return;
}

resetForm();
onClose();
};

if (!isOpen) {
  return null;
}



  return (

    <div
      className="modal-overlay"
      onMouseDown={(event) => {

        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
        }

      }}
    >

      <div
        className="villa-modal expense-modal"
        dir="rtl"
      >


        {/* =====================================
            HEADER
        ====================================== */}

        <div className="modal-header">

          <div>

            <span className="modal-label">
              مشروع فلل تبوك
            </span>

            <h2>
              إضافة مصروف جديد
            </h2>

            <p>
              تسجيل وتصنيف مصروفات المشروع والفلل
            </p>

          </div>


          <button
            type="button"
            className="modal-close"
            onClick={handleClose}
          >
            ×
          </button>

        </div>


        {/* =====================================
            FORM
        ====================================== */}

        <form
          className="villa-form"
          onSubmit={handleSubmit}
        >


          {/* =====================================
              BASIC DATA
          ====================================== */}

          <div className="form-section-title">
            بيانات المصروف
          </div>


          <div className="form-grid">


            <div className="form-field">

              <label>
                تاريخ المصروف *
              </label>

              <input
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(
                    event.target.value
                  )
                }
                required
              />

            </div>


            <div className="form-field">

              <label>
                المبلغ (ريال) *
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(event) =>
                  setAmount(
                    event.target.value
                  )
                }
                required
              />

            </div>

          </div>


          {/* =====================================
              EXPENSE SCOPE
          ====================================== */}

          <div className="form-section-title">
            نطاق المصروف
          </div>


          <div className="expense-scope-options">

  <button
    type="button"
    className={`expense-scope-card ${
      scope === "Project" ? "active" : ""
    }`}
    onClick={() => {
      setScope("Project");
      setVillaCode("");
    }}
  >
    <div className="expense-scope-check">
      {scope === "Project" ? "✓" : ""}
    </div>

    <div className="expense-scope-icon">
      🏗️
    </div>

    <div className="expense-scope-text">
      <strong>مصروف عام للمشروع</strong>
      <span>غير مرتبط بفيلا محددة</span>
    </div>
  </button>


  <button
    type="button"
    className={`expense-scope-card ${
      scope === "Villa" ? "active" : ""
    }`}
    onClick={() => setScope("Villa")}
  >
    <div className="expense-scope-check">
      {scope === "Villa" ? "✓" : ""}
    </div>

    <div className="expense-scope-icon">
      🏠
    </div>

    <div className="expense-scope-text">
      <strong>مصروف خاص بفيلا</strong>
      <span>تحميل المصروف على فيلا محددة</span>
    </div>
  </button>

</div>

            <div className="form-field form-field-full">

              <label>
                اختر الفيلا *
              </label>

              <select
                value={villaCode}
                onChange={(event) =>
                  setVillaCode(
                    event.target.value
                  )
                }
                required
              >

                <option value="">
                  اختر الفيلا
                </option>

                {villas.map(
                  (villa) => (

                    <option
                      key={villa.code}
                      value={villa.code}
                    >
                      الفيلا {villa.code}
                      {" — "}
                      {villa.plotArea} م²
                    </option>

                  )
                )}

              </select>

            </div>

        


          {/* =====================================
              CLASSIFICATION
          ====================================== */}

          <div className="form-section-title">
            تصنيف المصروف
          </div>


          <div className="form-grid">


            {/* CATEGORY */}

            <div className="form-field">

              <label>
                الفئة *
              </label>


              <div className="input-with-button">

                <select
                  value={categoryId}
                  onChange={(event) => {

                    setCategoryId(
                      event.target.value
                    );

                    setClassificationId("");

                  }}
                  required
                >

                  <option value="">
                    اختر الفئة
                  </option>


                  {categories
                    .filter(
                      (category) =>
                        category.isActive
                    )
                    .map(
                      (category) => (

                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>

                      )
                    )}

                </select>


                <button
                  type="button"
                  className="small-add-button"
                  onClick={
                    handleAddCategory
                  }
                  title="إضافة فئة جديدة"
                >
                  +
                </button>

              </div>

            </div>


            {/* CLASSIFICATION */}

            <div className="form-field">

              <label>
                التصنيف
              </label>


              <div className="input-with-button">

                <select
                  value={
                    classificationId
                  }
                  onChange={(event) =>
                    setClassificationId(
                      event.target.value
                    )
                  }
                  disabled={!categoryId}
                >

                  <option value="">
                    اختر التصنيف
                  </option>


                  {availableClassifications.map(
                    (classification) => (

                      <option
                        key={
                          classification.id
                        }
                        value={
                          classification.id
                        }
                      >
                        {
                          classification.name
                        }
                      </option>

                    )
                  )}

                </select>


                <button
                  type="button"
                  className="small-add-button"
                  onClick={
                    handleAddClassification
                  }
                  title="إضافة تصنيف جديد"
                >
                  +
                </button>

              </div>

            </div>


            {/* ITEM */}

            <div className="form-field">

              <label>
                البند
              </label>

              <input
                type="text"
                placeholder="مثال: كابلات 6 مم"
                value={itemName}
                onChange={(event) =>
                  setItemName(
                    event.target.value
                  )
                }
              />

            </div>


            {/* SUPPLIER */}

            <div className="form-field">

              <label>
                المورد / المقاول
              </label>

              <input
                type="text"
                placeholder="اسم المورد أو المقاول"
                value={supplier}
                onChange={(event) =>
                  setSupplier(
                    event.target.value
                  )
                }
              />

            </div>

          </div>


          {/* =====================================
              PAYMENT
          ====================================== */}

          <div className="form-section-title">
            بيانات الدفع
          </div>


          <div className="form-grid">


            <div className="form-field">

              <label>
                طريقة الدفع
              </label>

              <select
                value={paymentMethod}
                onChange={(event) => {

                  const value =
                    event.target.value;

                  if (
                    value === "Cash" ||
                    value === "Bank Transfer" ||
                    value === "Card" ||
                    value === "Cheque" ||
                    value === "Other"
                  ) {

                    setPaymentMethod(
                      value
                    );

                  }

                }}
              >

                <option value="Cash">
                  نقدي
                </option>

                <option value="Bank Transfer">
                  تحويل بنكي
                </option>

                <option value="Card">
                  بطاقة
                </option>

                <option value="Cheque">
                  شيك
                </option>

                <option value="Other">
                  أخرى
                </option>

              </select>

            </div>


            <div className="form-field">

              <label>
                رقم الفاتورة / المرجع
              </label>

              <input
                type="text"
                placeholder="اختياري"
                value={invoiceNumber}
                onChange={(event) =>
                  setInvoiceNumber(
                    event.target.value
                  )
                }
              />

            </div>

          </div>


          {/* =====================================
              DESCRIPTION
          ====================================== */}

          <div className="form-field form-field-full">

            <label>
              وصف المصروف
            </label>

            <input
              type="text"
              placeholder="وصف مختصر للمصروف"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
            />

          </div>


          <div className="form-field form-field-full">

            <label>
              ملاحظات
            </label>

            <textarea
              rows={3}
              placeholder="أي ملاحظات إضافية..."
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
            />

          </div>


          {/* =====================================
              ACTIONS
          ====================================== */}

          <div className="modal-actions expense-modal-actions">

  <button
    type="button"
    className="cancel-button"
    onClick={handleClose}
  >
    إلغاء
  </button>

  <button
    type="submit"
    className="save-and-close-button"
    onClick={() => setSaveMode("close")}
  >
    ✓ حفظ وإغلاق
  </button>

  <button
    type="submit"
    className="save-villa-button save-and-continue-button"
    onClick={() => setSaveMode("continue")}
  >
    ＋ حفظ وإضافة مصروف آخر
  </button>

</div>


        </form>

      </div>

    </div>

  );

}

export default AddExpenseModal;