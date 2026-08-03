import type {
  Expense,
  ExpenseCategory,
  ExpenseClassification,
} from "../data/expenses";

import type { Villa } from "../data/villas";


type ExpensesPageProps = {
  expenses: Expense[];

  villas: Villa[];

  categories: ExpenseCategory[];

  classifications: ExpenseClassification[];

  onBack: () => void;

  onAddExpense: () => void;
};


function ExpensesPage({
  expenses,
  categories,
  onBack,
  onAddExpense,
}: ExpensesPageProps) {


  // ==========================================
  // TOTALS
  // ==========================================

  const totalExpenses =
    expenses.reduce(
      (total, expense) =>
        total + expense.amount,
      0
    );


  const projectExpenses =
    expenses
      .filter(
        (expense) =>
          expense.scope === "Project"
      )
      .reduce(
        (total, expense) =>
          total + expense.amount,
        0
      );


  const villaExpenses =
    expenses
      .filter(
        (expense) =>
          expense.scope === "Villa"
      )
      .reduce(
        (total, expense) =>
          total + expense.amount,
        0
      );


  // ==========================================
  // CATEGORY NAME
  // ==========================================

  const getCategoryName = (
    categoryId: string
  ) => {

    const category =
      categories.find(
        (item) =>
          item.id === categoryId
      );

    return category
      ? category.name
      : "غير مصنف";

  };


  // ==========================================
  // DISPLAY
  // ==========================================

  return (

    <div
      className="expenses-page"
      dir="rtl"
    >


      {/* =====================================
          PAGE HEADER
      ====================================== */}

      <div className="expenses-page-header">


        <div className="expenses-header-info">

          <button
            type="button"
            className="expenses-back-button"
            onClick={onBack}
          >
            ← العودة للوحة التحكم
          </button>


          <span className="expenses-page-label">
            مشروع فلل تبوك
          </span>


          <h1>
            إدارة المصروفات
          </h1>


          <p>
            تسجيل ومتابعة وتحليل جميع مصروفات المشروع والفلل
          </p>

        </div>


        <button
          type="button"
          className="expenses-add-button"
          onClick={onAddExpense}
        >
          <span>
            +
          </span>

          إضافة مصروف
        </button>


      </div>


      {/* =====================================
          SUMMARY
      ====================================== */}

      <div className="expenses-summary-grid">


        <div className="expenses-main-card">

          <span>
            إجمالي المصروفات
          </span>

          <strong>
            {totalExpenses.toLocaleString()}
          </strong>

          <small>
            ريال سعودي
          </small>

        </div>


        <div className="expenses-stat-card">

          <span>
            المصاريف العامة للمشروع
          </span>

          <strong>
            {projectExpenses.toLocaleString()}
          </strong>

          <small>
            ريال
          </small>

        </div>


        <div className="expenses-stat-card">

          <span>
            مصاريف الفلل
          </span>

          <strong>
            {villaExpenses.toLocaleString()}
          </strong>

          <small>
            ريال
          </small>

        </div>


        <div className="expenses-stat-card">

          <span>
            عدد المصروفات
          </span>

          <strong>
            {expenses.length.toLocaleString()}
          </strong>

          <small>
            عملية مسجلة
          </small>

        </div>


      </div>


      {/* =====================================
          TOOLBAR
      ====================================== */}

      <div className="expenses-toolbar">


        <div className="expenses-toolbar-title">

          <span>
            سجل المصروفات
          </span>

          <strong>
            جميع العمليات المالية
          </strong>

        </div>


        <div className="expenses-search">

          <input
            type="text"
            placeholder="بحث في المصروفات..."
          />

        </div>


      </div>


      {/* =====================================
          TABLE
      ====================================== */}

      <div className="expenses-table-container">


        <table className="expenses-table">


          <thead>

            <tr>

              <th>
                التاريخ
              </th>

              <th>
                الفئة
              </th>

              <th>
                البند
              </th>

              <th>
                نطاق المصروف
              </th>

              <th>
                الفيلا
              </th>

              <th>
                المورد / المقاول
              </th>

              <th>
                المبلغ
              </th>

              <th>
                الإجراءات
              </th>

            </tr>

          </thead>


          <tbody>


            {expenses.length === 0 ? (

              <tr>

                <td
                  colSpan={8}
                  className="expenses-empty"
                >

                  <div>

                    <strong>
                      لا توجد مصروفات مسجلة حتى الآن
                    </strong>

                    <span>
                      اضغط على إضافة مصروف لبدء تسجيل مصروفات المشروع
                    </span>

                  </div>

                </td>

              </tr>

            ) : (

              expenses
                .slice()
                .reverse()
                .map(
                  (expense) => (

                    <tr
                      key={expense.id}
                    >


                      <td>
                        {expense.date}
                      </td>


                      <td>

                        <span className="expense-category-badge">

                          {getCategoryName(
                            expense.categoryId
                          )}

                        </span>

                      </td>


                      <td>

                        {expense.itemName ||
                          expense.description ||
                          "—"}

                      </td>


                      <td>

                        {expense.scope ===
                        "Project"
                          ? "عام للمشروع"
                          : "خاص بفيلا"}

                      </td>


                      <td>

                        {expense.villaCode
                          ? `فيلا ${expense.villaCode}`
                          : "—"}

                      </td>


                      <td>

                        {expense.supplier ||
                          "—"}

                      </td>


                      <td>

                        <strong className="expense-amount">

                          {expense.amount.toLocaleString()}
                          {" "}
                          ريال

                        </strong>

                      </td>


                      <td>

                        <button
                          type="button"
                          className="expense-row-action"
                        >
                          عرض
                        </button>

                      </td>


                    </tr>

                  )
                )

            )}


          </tbody>


        </table>


      </div>


    </div>

  );

}


export default ExpensesPage;