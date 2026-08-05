import { useMemo, useState } from "react";

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

type AddExpenseModalProps = {

  isOpen: boolean;

  villas: Villa[];

  categories: ExpenseCategory[];

  classifications: ExpenseClassification[];

  onClose: () => void;

  onAddExpense: (
    expense: Expense
  ) => void;

  onAddCategory: (
    name: string
  ) => ExpenseCategory;

  onAddClassification: (
    categoryId: string,
    name: string
  ) => ExpenseClassification;

};

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

  if (!isOpen) return null;

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const [operationNo] =
    useState(Date.now());

  const [date,setDate] =
    useState(today);

  const [projectId] =
    useState("TABUK");

  const [projectName] =
    useState("مشروع فلل تبوك");

  const [operationType,
  setOperationType] =
    useState("");

  const [categoryId,
  setCategoryId] =
    useState("");

  const [classificationId,
  setClassificationId] =
    useState("");

  const [supplier,
  setSupplier] =
    useState("");

  const [voucherNo,
  setVoucherNo] =
    useState("");

  const [description,
  setDescription] =
    useState("");

  const [amount,
  setAmount] =
    useState("");

  const [taxPercent,
  setTaxPercent] =
    useState("15");

  const [paymentMethod,
  setPaymentMethod] =
    useState("Cash");

  const [paymentSource,
  setPaymentSource] =
    useState("");

  const [currency,
  setCurrency] =
    useState("SAR");

  const [status,
  setStatus] =
    useState("Paid");

  const [custodyId,
  setCustodyId] =
    useState("");

  const [attachments,
  setAttachments] =
    useState<File[]>([]);

  const [notes,
  setNotes] =
    useState("");

  const tax =
    useMemo(()=>{

      return Number(amount||0)
      *
      Number(taxPercent||0)
      /100;

    },[
      amount,
      taxPercent
    ]);

  const total =
    useMemo(()=>{

      return Number(amount||0)
      + tax;

    },[
      amount,
      tax
    ]);

  const handleSave = () => {

    const expense: Expense = {

      id:
      crypto.randomUUID(),

      operationNo,

      date,

      projectId,

      projectName,

      operationType,

      categoryId,

      classificationId,

      supplier,

      paymentMethod,

      amount:
      Number(amount),

      tax,

      total,

      voucherNo,

      description,

      paymentSource,

      custodyId,

      currency,

      status,

      attachment: "",

      notes,

      createdAt:
      new Date()
      .toISOString(),

    };

    onAddExpense(
      expense
    );

    onClose();

  };
  const handleSaveAndNew = () => {

  const expense: Expense = {

    id: crypto.randomUUID(),

    operationNo,

    date,

    projectId,

    projectName,

    operationType,

    categoryId,

    classificationId,

    supplier,

    paymentMethod,

    amount: Number(amount),

    tax,

    total,

    voucherNo,

    description,

    paymentSource,

    custodyId,

    currency,

    status,

    attachment: "",

    notes,

    createdAt: new Date().toISOString(),

  };

  onAddExpense(expense);

  setSupplier("");

  setVoucherNo("");

  setDescription("");

  setAmount("");

  setNotes("");

};

return (

  <div className="modal-overlay">

    <div
      className="expense-modal"
      dir="rtl"
    >

      <div className="modal-header">

        <div>

          <h2>

            إضافة مصروف جديد

          </h2>

          <span>

            مشروع فلل تبوك

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

      <div className="modal-body">

        <ExpenseBasicInfo

          operationNo={operationNo}

          date={date}

          projectName={projectName}

          operationType={operationType}

          categoryId={categoryId}

          classificationId={classificationId}

          supplier={supplier}

          voucherNo={voucherNo}

          description={description}

          categories={categories}

          classifications={classifications}

          onDateChange={setDate}

          onOperationTypeChange={setOperationType}

          onCategoryChange={setCategoryId}

          onClassificationChange={setClassificationId}

          onSupplierChange={setSupplier}

          onVoucherChange={setVoucherNo}

          onDescriptionChange={setDescription}

          onAddCategory={() => {}}

          onAddClassification={() => {}}

        />

        <ExpensePayment

          amount={amount}

          taxPercent={taxPercent}

          tax={tax}

          total={total}

          paymentMethod={paymentMethod}

          paymentSource={paymentSource}

          currency={currency}

          status={status}

          custodyId={custodyId}

          onAmountChange={setAmount}

          onTaxPercentChange={setTaxPercent}

          onPaymentMethodChange={setPaymentMethod}

          onPaymentSourceChange={setPaymentSource}

          onCurrencyChange={setCurrency}

          onStatusChange={setStatus}

          onCustodyChange={setCustodyId}

        />

        <ExpenseAttachments

          attachments={attachments}

          onFilesChange={setAttachments}

        />

        <ExpenseNotes

          notes={notes}

          onNotesChange={setNotes}

        />
               <ExpenseActions
          onCancel={onClose}
          onSave={handleSave}
          onSaveAndNew={handleSaveAndNew}
        />

      </div>

    </div>

  </div>

);

}