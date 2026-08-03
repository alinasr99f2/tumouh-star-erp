import type { Villa } from "./villas";


// ==========================================
// EXPENSE SCOPE
// ==========================================

export type ExpenseScope =
  | "Project"
  | "Villa";


// ==========================================
// PAYMENT METHOD
// ==========================================

export type PaymentMethod =
  | "Cash"
  | "Bank Transfer"
  | "Card"
  | "Cheque"
  | "Other";


// ==========================================
// EXPENSE CATEGORY
// ==========================================

export interface ExpenseCategory {
  id: string;

  name: string;

  isActive: boolean;

  createdAt: string;
}


// ==========================================
// EXPENSE CLASSIFICATION
// ==========================================

export interface ExpenseClassification {
  id: string;

  categoryId: string;

  name: string;

  isActive: boolean;

  createdAt: string;
}


// ==========================================
// EXPENSE
// ==========================================

export interface Expense {
  id: string;

  projectId: string;

  date: string;

  amount: number;


  // ======================
  // SCOPE
  // ======================

  scope: ExpenseScope;

  villaCode: Villa["code"] | null;


  // ======================
  // CLASSIFICATION
  // ======================

  categoryId: string;

  classificationId: string;

  itemName: string;


  // ======================
  // DETAILS
  // ======================

  description: string;

  supplier: string;

  paymentMethod: PaymentMethod;

  invoiceNumber: string;

  notes: string;


  // ======================
  // SYSTEM DATA
  // ======================

  createdAt: string;
}


// ==========================================
// INITIAL CATEGORIES
// ==========================================

export const initialExpenseCategories:
  ExpenseCategory[] = [

  {
    id: "CAT-001",
    name: "مواد البناء",
    isActive: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: "CAT-002",
    name: "العمالة",
    isActive: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: "CAT-003",
    name: "الكهرباء",
    isActive: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: "CAT-004",
    name: "السباكة",
    isActive: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: "CAT-005",
    name: "التكييف",
    isActive: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: "CAT-006",
    name: "التشطيبات",
    isActive: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: "CAT-007",
    name: "المقاولين",
    isActive: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: "CAT-008",
    name: "النقل",
    isActive: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: "CAT-009",
    name: "المصاريف الإدارية",
    isActive: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: "CAT-010",
    name: "أخرى",
    isActive: true,
    createdAt: new Date().toISOString(),
  },

];


// ==========================================
// INITIAL CLASSIFICATIONS
// ==========================================

export const initialExpenseClassifications:
  ExpenseClassification[] = [];


// ==========================================
// INITIAL EXPENSES
// ==========================================

export const initialExpenses:
  Expense[] = [];