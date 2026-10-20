import { useEffect, useState } from "react";
import { Building2, Home, X, User, FileText, Coins, Paperclip, MessageSquare, Wallet, CalendarDays, Droplets, Zap, CircleAlert, MapPin, Pencil, Plus, Check, ChevronDown, Banknote, ReceiptText, FileDown, FileSpreadsheet, Printer } from "lucide-react";
import { supabase } from "../../utils/supabase";

export type ResidentialMapUnit = {
  id: string; apartment_number: string; building_name: string | null;
  apartment_type: string | null; apartment_status: string;
  rooms_count: number | null; rent_amount: number | null;
  rent_period: string | null; area_sqm: number | null;
  region: string | null; city: string | null; district_street: string | null;
  nearest_landmark: string | null; notes: string | null;
  archived_at: string | null; owner_id: string | null;
};

type Owner = { full_name: string; mobile: string | null; phone: string | null; email: string | null; nationality: string | null; identity_number: string | null };
const blankOwner = (): Owner => ({ full_name: "", mobile: "", phone: "", email: "", nationality: "", identity_number: "" });
type Tab = "البيانات الأساسية" | "بيانات المالك" | "العقد" | "المدفوعات" | "المستندات" | "الملاحظات";
const tabs = [
  { title: "البيانات الأساسية" as Tab, icon: Home },
  { title: "بيانات المالك" as Tab, icon: User },
  { title: "العقد" as Tab, icon: FileText },
  { title: "المدفوعات" as Tab, icon: Coins },
  { title: "المستندات" as Tab, icon: Paperclip },
  { title: "الملاحظات" as Tab, icon: MessageSquare },
];
const display = (value: string | number | null | undefined) => value === null || value === undefined || String(value).trim() === "" ? "غير محدد" : String(value);
const money = (value: number | null) => value === null ? "غير محدد" : `${Number(value).toLocaleString("ar-SA")} ريال`;
function Section({ title, icon: Icon, children }: { title: string; icon?: typeof Home; children: import("react").ReactNode }) {
  return <section className="min-w-0 overflow-hidden rounded-2xl border border-[#2a5275] bg-[#091b30]/90"><h3 className="flex items-center justify-end gap-2 border-b border-[#2a5275] bg-[#0b213a] px-4 py-2 text-right text-base font-black text-[#f6c84a]">{title}{Icon && <Icon size={16}/>}</h3><div className="space-y-2 p-2 sm:p-3">{children}</div></section>;
}
// المناطق الإدارية الـ13 ومدن شائعة؛ الخيارات الإضافية تُحمّل من قاعدة البيانات.
const SAUDI_LOCATIONS: Record<string, string[]> = {
  "منطقة الرياض": ["الرياض", "الخرج", "الدرعية", "المجمعة", "الزلفي", "شقراء", "الدوادمي", "القويعية", "الأفلاج", "وادي الدواسر", "حوطة بني تميم", "رماح", "ثادق", "حريملاء", "السليل", "عفيف", "الغاط"],
  "منطقة مكة المكرمة": ["مكة المكرمة", "جدة", "الطائف", "رابغ", "القنفذة", "الليث", "خليص", "الجموم", "بحرة", "أضم", "تربة", "الخرمة", "رنية"],
  "منطقة المدينة المنورة": ["المدينة المنورة", "ينبع", "العلا", "بدر", "خيبر", "المهد", "الحناكية", "العيص"],
  "المنطقة الشرقية": ["الدمام", "الخبر", "الظهران", "الجبيل", "الجبيل الصناعية", "القطيف", "الأحساء", "الهفوف", "المبرز", "رأس تنورة", "بقيق", "الخفجي", "النعيرية", "حفر الباطن", "قرية العليا", "سيهات", "صفوى", "تاروت"],
  "منطقة القصيم": ["بريدة", "عنيزة", "الرس", "البكيرية", "البدائع", "المذنب", "رياض الخبراء", "الأسياح", "الشماسية", "عيون الجواء"],
  "منطقة عسير": ["أبها", "خميس مشيط", "بيشة", "محايل عسير", "أحد رفيدة", "النماص", "تنومة", "سراة عبيدة", "ظهران الجنوب", "رجال ألمع", "بلقرن", "تثليث"],
  "منطقة تبوك": ["تبوك", "ضباء", "الوجه", "أملج", "حقل", "تيماء", "البدع"],
  "منطقة حائل": ["حائل", "بقعاء", "الشنان", "الغزالة", "الشملي", "موقق", "الحائط"],
  "منطقة الحدود الشمالية": ["عرعر", "رفحاء", "طريف", "العويقيلة"],
  "منطقة جازان": ["جازان", "صبيا", "أبو عريش", "صامطة", "بيش", "الدرب", "أحد المسارحة", "فرسان", "العارضة", "ضمد", "الريث", "فيفاء"],
  "منطقة نجران": ["نجران", "شرورة", "حبونا", "بدر الجنوب", "يدمة", "ثار", "خباش"],
  "منطقة الباحة": ["الباحة", "بلجرشي", "المندق", "المخواة", "قلوة", "العقيق", "القرى", "غامد الزناد"],
  "منطقة الجوف": ["سكاكا", "القريات", "دومة الجندل", "طبرجل", "صوير"],
};
const uniqueSorted = (values: string[]) => Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "ar"));
type LocationOption = { kind: "region" | "city"; name: string; region_name: string | null };

// إشعار نجاح مستقل عن نافذة التفاصيل؛ يظل ظاهرًا بعد إغلاقها لمدة خمس ثوانٍ.
function showApartmentSaveSuccess() {
  const previous = document.getElementById("aqary-apartment-save-toast");
  previous?.remove();
  const toast = document.createElement("div");
  toast.id = "aqary-apartment-save-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.dir = "rtl";
  toast.style.cssText = "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.58);backdrop-filter:blur(7px);font-family:Tahoma,Arial,sans-serif;";
  const panel = document.createElement("div");
  panel.style.cssText = "position:relative;width:min(470px,100%);overflow:hidden;border:1px solid #18bd8e;border-radius:23px;background:linear-gradient(135deg,#0d493d,#052b27);box-shadow:0 24px 80px #0009;color:#b8f7dc;text-align:center;padding:35px 22px 39px;";
  const icon = document.createElement("div");
  icon.textContent = "✓";
  icon.style.cssText = "display:grid;place-items:center;width:75px;height:75px;margin:0 auto 14px;border:1px solid #20c997;border-radius:50%;background:#095442;color:#adf9d9;font-size:52px;font-weight:700;";
  const title = document.createElement("h2");
  title.textContent = "تم حفظ الشقة بنجاح";
  title.style.cssText = "margin:0 0 10px;font-size:25px;font-weight:900;color:#b5f7d9;";
  const detail = document.createElement("p");
  detail.textContent = "تم حفظ بيانات الشقة بنجاح في Supabase.";
  detail.style.cssText = "margin:0 0 8px;font-size:14px;font-weight:600;color:#d2e9df;";
  const hint = document.createElement("p");
  hint.textContent = "تغلق الرسالة تلقائيًا بعد 5 ثوانٍ";
  hint.style.cssText = "margin:0;font-size:12px;font-weight:700;color:#8ee7c3;";
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "×";
  close.setAttribute("aria-label", "إغلاق رسالة النجاح");
  close.style.cssText = "position:absolute;top:13px;left:13px;width:26px;height:26px;border:1px solid #ffffff55;border-radius:50%;background:transparent;color:#b5f7d9;cursor:pointer;font-size:19px;line-height:1;";
  const track = document.createElement("div");
  track.style.cssText = "position:absolute;bottom:0;right:0;left:0;height:8px;background:#07382e;";
  const bar = document.createElement("div");
  bar.style.cssText = "height:100%;width:100%;transform-origin:right;background:linear-gradient(90deg,#00c89a,#ffe45d);transition:transform 5s linear;";
  track.appendChild(bar);
  panel.append(icon,title,detail,hint,close,track);
  toast.appendChild(panel);
  document.body.appendChild(toast);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const dismiss = () => { if (timer !== undefined) clearTimeout(timer); toast.remove(); };
  close.addEventListener("click", dismiss);
  toast.addEventListener("mousedown", event => { if (event.target === toast) dismiss(); });
  requestAnimationFrame(() => { requestAnimationFrame(() => { bar.style.transform = "scaleX(0)"; }); });
  timer = setTimeout(dismiss, 5000);
}

export default function ResidentialApartmentDetailsModal({ unit, companyId, onClose, onUnitUpdated }: { unit: ResidentialMapUnit; companyId: string; onClose: () => void; onUnitUpdated?: (patch: Partial<ResidentialMapUnit>) => void }) {
  const [financialModal, setFinancialModal] = useState<"charge" | "collectCharge" | null>(null);
  const [detailModal, setDetailModal] = useState<"collections" | "water" | "electric" | "late" | null>(null);
  const [operationType, setOperationType] = useState("إيجار");
  const [operationAmount, setOperationAmount] = useState("");
  const [operationMonth, setOperationMonth] = useState(() => new Date().toLocaleDateString("en-CA").slice(0, 7));
  const [operationDate, setOperationDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [operationNotes, setOperationNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [periods, setPeriods] = useState<Record<string, { from: string; to: string }>>({});
  const currentMonth = () => { const now = new Date(); const year = now.getFullYear(); const month = now.getMonth(); const local = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`; return { from: local(1), to: local(new Date(year, month + 1, 0).getDate()) }; };
  const openFinancialAction = (kind: "charge" | "collectCharge") => {
    setOperationType(kind === "collectCharge" ? "إيجار" : "كهرباء");
    setOperationAmount(""); setOperationNotes(""); setPaymentMethod(""); setOperationError(""); setSelectedChargeId(""); setSelectedInstallmentId("");
    setOperationMonth(new Date().toLocaleDateString("en-CA").slice(0, 7));
    setFinancialModal(kind);
  };
  type ChargeRow = { id: string; charge_type: string; title: string; amount: number; issued_at: string; due_date: string };
  type ChargePaymentRow = { charge_id: string; amount: number; paid_at: string };
  type RentReceiptRow = { id: string; amount: number; paid_at: string; contract_id: string };
  type InstallmentRow = { id: string; contract_id: string; amount: number; due_date: string };
  type AllocationRow = { installment_id: string; amount: number };
  const [charges, setCharges] = useState<ChargeRow[]>([]);
  const [chargePayments, setChargePayments] = useState<ChargePaymentRow[]>([]);
  const [rentReceipts, setRentReceipts] = useState<RentReceiptRow[]>([]);
  const [installments, setInstallments] = useState<InstallmentRow[]>([]);
  const [rentAllocations, setRentAllocations] = useState<AllocationRow[]>([]);
  const [financeLoading, setFinanceLoading] = useState(true);
  const [financeError, setFinanceError] = useState("");
  const [operationError, setOperationError] = useState("");
  const [operationSaving, setOperationSaving] = useState(false);
  const [selectedChargeId, setSelectedChargeId] = useState("");
  const [selectedInstallmentId, setSelectedInstallmentId] = useState("");
  const [dueDate, setDueDate] = useState(() => new Date().toLocaleDateString("en-CA"));

  const refreshFinancials = async () => {
    setFinanceLoading(true); setFinanceError("");
    const contractsResult = await supabase.from("residential_contracts").select("id").eq("company_id", companyId).eq("apartment_id", unit.id);
    if (contractsResult.error) { setFinanceError(contractsResult.error.message); setFinanceLoading(false); return; }
    const ids = (contractsResult.data ?? []).map(c => c.id);
    const [chargeResult, paymentResult, receiptResult, installmentResult, allocationResult] = await Promise.all([
      supabase.from("residential_charges").select("id,charge_type,title,amount,issued_at,due_date").eq("company_id",companyId).eq("apartment_id",unit.id),
      supabase.from("residential_charge_payments").select("charge_id,amount,paid_at").eq("company_id",companyId),
      ids.length ? supabase.from("residential_rent_receipts").select("id,amount,paid_at,contract_id").eq("company_id",companyId).in("contract_id",ids) : Promise.resolve({data:[],error:null}),
      ids.length ? supabase.from("residential_rent_installments").select("id,contract_id,amount,due_date").eq("company_id",companyId).in("contract_id",ids) : Promise.resolve({data:[],error:null}),
      supabase.from("residential_rent_allocations").select("installment_id,amount").eq("company_id",companyId)
    ]);
    const error = chargeResult.error || paymentResult.error || receiptResult.error || installmentResult.error || allocationResult.error;
    if (error) setFinanceError(error.message);
    else {
      setCharges((chargeResult.data ?? []) as ChargeRow[]);
      const chargeIds = new Set((chargeResult.data ?? []).map(c => c.id));
      setChargePayments(((paymentResult.data ?? []) as ChargePaymentRow[]).filter(x => chargeIds.has(x.charge_id)));
      setRentReceipts((receiptResult.data ?? []) as RentReceiptRow[]);
      const ownInstallments = (installmentResult.data ?? []) as InstallmentRow[];
      setInstallments(ownInstallments);
      const installmentIds = new Set(ownInstallments.map(i => i.id));
      setRentAllocations(((allocationResult.data ?? []) as AllocationRow[]).filter(a => installmentIds.has(a.installment_id)));
    }
    setFinanceLoading(false);
  };
  useEffect(() => { void refreshFinancials(); }, [companyId, unit.id]);
  const paidOnCharge = (id: string) => chargePayments.filter(p=>p.charge_id===id).reduce((sum,p)=>sum+Number(p.amount),0);
  const selectedCharge = charges.find(c=>c.id===selectedChargeId);
  const paidOnInstallment = (id: string) => rentAllocations.filter(a => a.installment_id === id).reduce((sum, a) => sum + Number(a.amount), 0);
  const selectedInstallment = installments.find(i => i.id === selectedInstallmentId);
  const availableInstallments = installments.filter(i => Number(i.amount) - paidOnInstallment(i.id) > 0.001).sort((a,b) => a.due_date.localeCompare(b.due_date));
  const formatSAR = (amount: number) => Number(amount).toLocaleString("en-US", { maximumFractionDigits: 2 });
  const financialBreakdown = (key: string, from: string, to: string) => {
    const inRange = (date: string) => date.slice(0, 10) >= from && date.slice(0, 10) <= to;
    const today = new Date().toLocaleDateString("en-CA");
    const asOf = to < today ? to : today;
    const paidFor = (id: string) => chargePayments.filter(p => p.charge_id === id && p.paid_at.slice(0, 10) <= asOf).reduce((sum, p) => sum + Number(p.amount), 0);
    if (key === "collections") {
      const rentRows = rentReceipts.filter(r => inRange(r.paid_at)).map(r => ({ id: `rent-${r.id}`, title: "تحصيل إيجار", date: r.paid_at.slice(0, 10), due: "—", total: Number(r.amount), collected: Number(r.amount), remaining: 0, status: "محصّل" }));
      const billRows = chargePayments.filter(p => inRange(p.paid_at)).map((p, index) => ({ id: `bill-${p.charge_id}-${index}`, title: charges.find(c => c.id === p.charge_id)?.title || "تحصيل فاتورة", date: p.paid_at.slice(0, 10), due: charges.find(c => c.id === p.charge_id)?.due_date || "—", total: Number(p.amount), collected: Number(p.amount), remaining: 0, status: "محصّل" }));
      return [...rentRows, ...billRows];
    }
    if (key === "water" || key === "electric") return charges.filter(c => c.charge_type === (key === "water" ? "water" : "electricity") && inRange(c.issued_at)).map(c => { const paid = paidFor(c.id); return { id: c.id, title: c.title, date: c.issued_at, due: c.due_date, total: Number(c.amount), collected: paid, remaining: Math.max(0, Number(c.amount) - paid), status: paid >= Number(c.amount) ? "مسددة" : paid > 0 ? "مسددة جزئيًا" : "غير مسددة" }; });
    const billLate = charges.filter(c => c.due_date >= from && c.due_date < asOf).map(c => { const paid = paidFor(c.id); return { id: c.id, title: c.title, date: c.issued_at, due: c.due_date, total: Number(c.amount), collected: paid, remaining: Math.max(0, Number(c.amount) - paid), status: "متأخرة" }; }).filter(r => r.remaining > 0);
    const rentLate = installments.filter(i => i.due_date >= from && i.due_date < asOf).map(i => { const paid = rentAllocations.filter(a => a.installment_id === i.id).reduce((sum, a) => sum + Number(a.amount), 0); return { id: i.id, title: "قسط إيجار", date: "—", due: i.due_date, total: Number(i.amount), collected: paid, remaining: Math.max(0, Number(i.amount) - paid), status: "متأخرة" }; }).filter(r => r.remaining > 0);
    return [...rentLate, ...billLate];
  };
  const financialTotals = (key: string, from: string, to: string) => {
    const rows = financialBreakdown(key, from, to);
    const sum = (field: "total" | "collected" | "remaining") => rows.reduce((acc, row) => acc + row[field], 0);
    return { total: key === "late" ? sum("remaining") : sum("total"), collected: sum("collected"), remaining: sum("remaining"), rows };
  };
  const saveFinancialOperation = async () => {
    if (operationSaving) return;
    setOperationError("");
    const amount=Number(operationAmount);
    if (!Number.isFinite(amount) || amount<=0) { setOperationError("أدخل مبلغًا صحيحًا أكبر من صفر."); return; }
    if (!operationDate) { setOperationError("اختر تاريخ العملية."); return; }
    if (financialModal === "collectCharge" && !paymentMethod) { setOperationError("اختر طريقة التحصيل قبل حفظ العملية."); return; }
    setOperationSaving(true);
    try {
      if (financialModal === "charge") {
        if (!dueDate || !operationMonth) throw new Error("اختر تاريخ الاستحقاق والشهر.");
        const kind=operationType==="مياه"?"water":operationType==="كهرباء"?"electricity":"other";
        const {error}=await supabase.from("residential_charges").insert({
          company_id:companyId, apartment_id:unit.id, charge_type:kind, title:operationType+" - "+operationMonth,
          amount, issued_at:operationDate, due_date:dueDate, notes:operationNotes.trim()||null
        });
        if(error) throw error;
      } else if (operationType === "إيجار") {
        if (!selectedInstallment) throw new Error("اختر قسط الإيجار المطلوب تحصيله من عقد الشقة.");
        // Re-read the installment and its allocations before saving to reduce stale-balance errors.
        const { data: freshInstallment, error: installmentError } = await supabase.from("residential_rent_installments")
          .select("id,contract_id,amount").eq("id", selectedInstallment.id).eq("company_id", companyId).maybeSingle();
        if (installmentError || !freshInstallment) throw new Error(installmentError?.message || "لم يتم العثور على قسط الإيجار.");
        const { data: linkedContract, error: contractError } = await supabase.from("residential_contracts")
          .select("id").eq("id", freshInstallment.contract_id).eq("company_id", companyId).eq("apartment_id", unit.id).maybeSingle();
        if (contractError || !linkedContract) throw new Error(contractError?.message || "القسط غير مرتبط بعقد هذه الشقة.");
        const { data: previousAllocations, error: allocationError } = await supabase.from("residential_rent_allocations")
          .select("amount").eq("company_id", companyId).eq("installment_id", freshInstallment.id);
        if (allocationError) throw allocationError;
        const remaining = Number(freshInstallment.amount) - (previousAllocations || []).reduce((sum, row) => sum + Number(row.amount), 0);
        if (remaining <= 0.001) throw new Error("هذا القسط مسدد بالكامل.");
        if (amount > remaining + 0.001) throw new Error("مبلغ التحصيل أكبر من المتبقي على قسط الإيجار.");
        const { data: receipt, error: receiptError } = await supabase.from("residential_rent_receipts").insert({
          company_id: companyId, contract_id: freshInstallment.contract_id, amount,
          payment_method: paymentMethod, notes: operationNotes.trim() || null,
          paid_at: new Date(operationDate + "T12:00:00").toISOString()
        }).select("id").single();
        if (receiptError || !receipt) throw new Error(receiptError?.message || "تعذر تسجيل إيصال الإيجار.");
        const { error: linkError } = await supabase.from("residential_rent_allocations").insert({
          company_id: companyId, receipt_id: receipt.id, installment_id: freshInstallment.id, amount
        });
        if (linkError) {
          const { error: rollbackError } = await supabase.from("residential_rent_receipts").delete().eq("id", receipt.id).eq("company_id", companyId);
          if (rollbackError) throw new Error(`تم حفظ إيصال الإيجار لكن تعذر ربطه بالقسط أو التراجع عنه. لا تعيد التحصيل قبل مراجعة السجل. ${linkError.message}`);
          throw new Error("تعذر ربط التحصيل بقسط الإيجار؛ تم التراجع عن الإيصال: " + linkError.message);
        }
      } else {
        if(!selectedCharge) throw new Error("اختر الفاتورة المطلوب تحصيلها.");
        if ((operationType === "مياه" && selectedCharge.charge_type !== "water") ||
            (operationType === "كهرباء" && selectedCharge.charge_type !== "electricity") ||
            (["صيانة", "مستحقات أخرى"].includes(operationType) && !["other", "maintenance"].includes(selectedCharge.charge_type)))
          throw new Error("الفاتورة المختارة لا تتوافق مع نوع المستحق.");
        const remaining=Number(selectedCharge.amount)-paidOnCharge(selectedCharge.id);
        if(amount>remaining+0.001) throw new Error("مبلغ التحصيل أكبر من المتبقي على الفاتورة.");
        const {error}=await supabase.from("residential_charge_payments").insert({
          company_id:companyId,charge_id:selectedCharge.id,amount,paid_at:new Date(operationDate+"T12:00:00").toISOString(),
          payment_method:paymentMethod,notes:operationNotes.trim()||null
        });
        if(error) throw error;
      }
      setFinancialModal(null); setOperationAmount(""); setSelectedChargeId(""); setSelectedInstallmentId("");
      await refreshFinancials();
    } catch(e) { setOperationError(e instanceof Error?e.message:"تعذر حفظ العملية."); }
    finally {setOperationSaving(false);}
  };

   // Report exports use the same filtered rows displayed in the selected financial card.
   const exportFinancialExcel = (title: string, range: { from: string; to: string }, rows: ReturnType<typeof financialBreakdown>, totals: ReturnType<typeof financialTotals>) => {
     const columns = ["البيان", "تاريخ العملية", "تاريخ الاستحقاق", "الإجمالي", "المحصّل", "المتبقي", "الحالة"];
     const quote = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
     const csv = [
       ["AQARY SMART - عقاري سمارت"],
       ["اسم التقرير", title],
       ["الشركة", editedUnit.building_name || "شقة سكنية"],
       ["رقم الشقة", editedUnit.apartment_number],
       ["من", range.from, "إلى", range.to],
       [], columns,
       ...rows.map(row => [row.title, row.date, row.due, row.total, row.collected, row.remaining, row.status]),
       [], ["الإجمالي", totals.total, "المحصّل", totals.collected, "المتبقي", totals.remaining],
     ].map(line => line.map(quote).join(",")).join("\r\n");
     const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
     const url = URL.createObjectURL(blob);
     const link = document.createElement("a");
     link.href = url;
     link.download = `AQARY_${editedUnit.apartment_number.replace(/[^\w-]/g, "_")}_${range.from}_${range.to}.csv`;
     document.body.appendChild(link);
     link.click();
     link.remove();
     setTimeout(() => URL.revokeObjectURL(url), 1000);
   };

   const printFinancialReport = (title: string, range: { from: string; to: string }, rows: ReturnType<typeof financialBreakdown>, totals: ReturnType<typeof financialTotals>, mode: "pdf" | "print") => {
     const escapeHtml = (value: string | number) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
     const popup = window.open("", "_blank", "width=1100,height=800");
     if (!popup) { window.alert("يرجى السماح بفتح النوافذ المنبثقة لطباعة التقرير."); return; }
     const reportRows = rows.map((row, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(row.title)}</td><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.due)}</td><td>${formatSAR(row.total)}</td><td>${formatSAR(row.collected)}</td><td>${formatSAR(row.remaining)}</td><td>${escapeHtml(row.status)}</td></tr>`).join("");
     const reportHtml = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${escapeHtml(title)} - ${escapeHtml(editedUnit.apartment_number)}</title><style>
       @page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{font-family:Tahoma,Arial,sans-serif;color:#13283b;margin:0;background:#fff;font-size:12px}header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #b48a2c;padding:8px 0 16px}.brand{display:flex;align-items:center;gap:12px}.brand-mark{width:60px;height:60px;background:#123a2d;color:#d9b65a;border-radius:12px;display:grid;place-items:center;font-size:30px;font-weight:bold}.brand strong{font-size:23px;color:#143f32}.brand small{display:block;color:#92722b;font-size:13px}h1{font-size:24px;text-align:center;color:#173e31;margin:18px 0}.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}.meta div,.summary div{border:1px solid #d9dfdd;border-radius:8px;padding:11px;background:#f8faf9}.meta span,.summary span{display:block;color:#566879;font-size:12px;margin-bottom:7px}.meta strong,.summary strong{font-size:16px}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:15px 0}.summary strong{font-size:20px;color:#173e31}table{width:100%;border-collapse:collapse;table-layout:auto}th{background:#173e31;color:#fff;padding:12px 8px;font-size:12px}td{border-bottom:1px solid #d7e0dc;padding:11px 8px;text-align:center;font-size:12px;overflow-wrap:anywhere}tbody tr:nth-child(even){background:#f5f8f6}footer{margin-top:20px;padding-top:10px;border-top:1px solid #d1d9d5;display:flex;justify-content:space-between;color:#64748b}.hint{padding:12px;background:#fff8df;border:1px solid #e7cf87;margin-bottom:16px;border-radius:8px}@media print{.hint{display:none}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}tr{break-inside:avoid}}
       </style></head><body><header><div class="brand"><div class="brand-mark">⌂</div><div><strong>AQARY SMART</strong><small>عقاري سمارت</small></div></div><div style="text-align:left">تقرير مالي للشقة<br><b>${escapeHtml(editedUnit.apartment_number)}</b></div></header>
       <h1>${escapeHtml(title)}</h1><div class="meta"><div><span>اسم العمارة / المشروع</span><strong>${escapeHtml(editedUnit.building_name || "شقة سكنية")}</strong></div><div><span>رقم الشقة</span><strong>${escapeHtml(editedUnit.apartment_number)}</strong></div><div><span>الفترة من</span><strong>${escapeHtml(range.from)}</strong></div><div><span>الفترة إلى</span><strong>${escapeHtml(range.to)}</strong></div></div>
       <div class="summary"><div><span>الإجمالي</span><strong>${formatSAR(totals.total)} ريال</strong></div><div><span>المحصّل</span><strong>${formatSAR(totals.collected)} ريال</strong></div><div><span>المتبقي</span><strong>${formatSAR(totals.remaining)} ريال</strong></div></div>
       ${mode === "pdf" ? '<div class="hint">لحفظ نسخة PDF اختر «حفظ بتنسيق PDF / Save as PDF» من نافذة الطباعة.</div>' : ""}
       <table><thead><tr>${["م", "البيان", "تاريخ العملية", "تاريخ الاستحقاق", "الإجمالي", "المحصّل", "المتبقي", "الحالة"].map(x => `<th>${x}</th>`).join("")}</tr></thead><tbody>${reportRows || '<tr><td colspan="8">لا توجد عمليات خلال الفترة المحددة</td></tr>'}</tbody></table>
       <footer><span>تم إصدار التقرير بواسطة عقاري سمارت</span><span>تاريخ الإصدار: ${escapeHtml(new Date().toLocaleString("en-GB"))}</span></footer></body></html>`;
     popup.document.open();
     popup.document.write(reportHtml);
     popup.document.close();
     popup.focus();
     // Wait for the new document to render before opening the browser's native print/PDF dialog.
     popup.setTimeout(() => popup.print(), 350);
   };

  const [activeTab, setActiveTab] = useState<Tab>("البيانات الأساسية");
  type ContractRecord = { id: string; contract_number?: string | null; contract_type?: string | null; contract_date?: string | null; start_date: string; end_date: string; rent_amount: number; rent_period: string; status: string; tenant_id?: string | null; notes?: string | null; created_at?: string | null; created_by?: string | null };
  type TenantRecord = Record<string, unknown>;
  const [apartmentContracts, setApartmentContracts] = useState<ContractRecord[]>([]);
  const [contractTenants, setContractTenants] = useState<Record<string, TenantRecord>>({});
  const [contractCreators, setContractCreators] = useState<Record<string, string>>({});
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contractsError, setContractsError] = useState("");
  useEffect(() => {
    if (activeTab !== "العقد") return;
    let cancelled = false;
    setContractsLoading(true); setContractsError("");
    setContractCreators({});
    void (async () => {
      const result = await supabase.from("residential_contracts")
        .select("id,contract_number,contract_type,contract_date,start_date,end_date,rent_amount,rent_period,status,tenant_id,notes,created_at,created_by")
        .eq("company_id", companyId).eq("apartment_id", unit.id)
        .order("start_date", { ascending: false });
      if (cancelled) return;
      if (result.error) { setContractsError(result.error.message); setContractsLoading(false); return; }
      const contracts = (result.data ?? []) as ContractRecord[];
      setApartmentContracts(contracts);
      const creatorIds = [...new Set(contracts.map(c => c.created_by).filter((id): id is string => Boolean(id)))];
      if (creatorIds.length) {
        const creatorsResult = await supabase.from("users")
          .select("auth_user_id,name")
          .in("auth_user_id", creatorIds);
        if (cancelled) return;
        if (creatorsResult.error) {
          console.warn("تعذر تحميل أسماء محرري العقود:", creatorsResult.error.message);
        } else {
          setContractCreators(Object.fromEntries((creatorsResult.data ?? [])
            .filter(row => row.auth_user_id && row.name)
            .map(row => [String(row.auth_user_id), String(row.name)])));
        }
      }
      const tenantIds = [...new Set(contracts.map(c => c.tenant_id).filter((id): id is string => Boolean(id)))];
      if (tenantIds.length) {
        const tenantsResult = await supabase.from("residential_tenants").select("*").eq("company_id", companyId).in("id", tenantIds);
        if (cancelled) return;
        if (tenantsResult.error) setContractsError("تم تحميل العقود، لكن تعذر تحميل بيانات المستأجرين: " + tenantsResult.error.message);
        else setContractTenants(Object.fromEntries((tenantsResult.data ?? []).map(t => [String(t.id), t as TenantRecord])));
      } else setContractTenants({});
      setContractsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [activeTab, companyId, unit.id]);
  const contractDate = (value?: string | null) => value ? value.slice(0, 10).split("-").reverse().join("/") : "غير مسجل";
  const tenantText = (tenant: TenantRecord | undefined, ...keys: string[]) => {
    for (const key of keys) { const value = tenant?.[key]; if (value !== undefined && value !== null && String(value).trim()) return String(value); }
    return "غير مسجل";
  };
  const contractField = (label: string, value: string | number, accent = false) => (
    <div className="min-w-0 rounded-xl border border-[#294d6d] bg-[#0a2037] p-3 text-center">
      <span className="mb-1 block text-sm font-bold text-slate-300">{label}</span>
      <strong className={`block break-words text-base font-black sm:text-lg ${accent ? "text-[#f6c84a]" : "text-white"}`}>{value}</strong>
    </div>
  );

  const [owner, setOwner] = useState<Owner | null>(null);
  const [ownerForm, setOwnerForm] = useState<Owner>(blankOwner);
  const [ownerDirty, setOwnerDirty] = useState(false);
  const [savingOwner, setSavingOwner] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerError, setOwnerError] = useState("");
  const [editedUnit, setEditedUnit] = useState<ResidentialMapUnit>(unit);
  const [unitDraft, setUnitDraft] = useState<ResidentialMapUnit>(unit);
  const [unitDirty, setUnitDirty] = useState(false);
  // Match the apartment map: an active, in-date lease overrides the displayed status only.
  const [hasCurrentLease, setHasCurrentLease] = useState(false);
  const [currentLeaseDates, setCurrentLeaseDates] = useState<{ start_date: string; end_date: string; rent_amount: number; rent_period: string } | null>(null);
  const [leaseStatusLoading, setLeaseStatusLoading] = useState(true);
  const [leaseStatusError, setLeaseStatusError] = useState("");
  useEffect(() => {
    let active = true;
    setHasCurrentLease(false);
    setCurrentLeaseDates(null);
    setLeaseStatusLoading(true);
    setLeaseStatusError("");
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    void (async () => {
      const { data, error } = await supabase.from("residential_contracts")
        .select("id,start_date,end_date,rent_amount,rent_period")
        .eq("company_id", companyId)
        .eq("apartment_id", unit.id)
        .eq("status", "نشط")
        .lte("start_date", today)
        .gte("end_date", today)
        .order("start_date", { ascending: false })
        .limit(1);
      if (!active) return;
      if (error) setLeaseStatusError("تعذر التحقق من حالة عقد الشقة: " + error.message);
      else {
        setHasCurrentLease((data?.length ?? 0) > 0);
        setCurrentLeaseDates(data?.[0] ? { start_date: data[0].start_date, end_date: data[0].end_date, rent_amount: Number(data[0].rent_amount), rent_period: data[0].rent_period } : null);
      }
      setLeaseStatusLoading(false);
    })();
    return () => { active = false; };
  }, [companyId, unit.id]);

  const [savingAll, setSavingAll] = useState(false);
  const [typeChoices, setTypeChoices] = useState<string[]>([]);
  const [statusChoices, setStatusChoices] = useState<string[]>([]);
  const [addingChoice, setAddingChoice] = useState<"type" | "status" | null>(null);
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [addressSuggestions, setAddressSuggestions] = useState<{ district_street: string; nearest_landmark: string; region: string; city: string }[]>([]);
  const [addingLocation, setAddingLocation] = useState<"region" | "city" | null>(null);
  const [newLocationName, setNewLocationName] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [newChoice, setNewChoice] = useState("");
  const [editingNumber, setEditingNumber] = useState(false);
  const [newNumber, setNewNumber] = useState(unit.apartment_number);
  const [savingField, setSavingField] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const choiceKey = "aqary-smart-apartments-custom-choices-v1";
  useEffect(() => {
    setEditedUnit(unit); setUnitDraft(unit); setUnitDirty(false); setNewNumber(unit.apartment_number); setEditingNumber(false); setFieldError("");
  }, [unit]);
  useEffect(() => {
    let cancelled = false;
    let stored: { types?: string[]; statuses?: string[] } = {};
    try { stored = JSON.parse(window.localStorage.getItem(choiceKey) || "{}"); } catch { /* ignore malformed cache */ }
    const types = ["غرفة وصالة", "غرفتين وصالة", "ثلاث غرف وصالة", "أربع غرف وصالة", "دوبلكس", "استوديو", ...(stored.types || [])];
    const statuses = ["متاحة", "مؤجرة", "محجوزة", ...(stored.statuses || [])];
    void (async () => {
      const { data } = await supabase.from("residential_apartments")
        .select("apartment_type,apartment_status").eq("company_id", companyId);
      if (cancelled) return;
      const rows = data || [];
      setTypeChoices(Array.from(new Set([...types, ...rows.map(row => row.apartment_type || ""), unit.apartment_type || ""].filter(Boolean))));
      setStatusChoices(Array.from(new Set([...statuses, ...rows.map(row => row.apartment_status || ""), unit.apartment_status].filter(Boolean))));
    })();
    return () => { cancelled = true; };
  }, [companyId, unit.id]);
  useEffect(() => {
    let active = true;
    void (async () => {
      const [custom, existing] = await Promise.all([
        supabase.from("residential_location_options").select("kind,name,region_name").eq("company_id", companyId),
        supabase.from("residential_apartments").select("region,city,district_street,nearest_landmark").eq("company_id", companyId),
      ]);
      if (!active) return;
      const options: LocationOption[] = (custom.data || []) as LocationOption[];
      for (const row of existing.data || []) {
        if (row.region) options.push({ kind: "region", name: row.region, region_name: null });
        if (row.city && row.region) options.push({ kind: "city", name: row.city, region_name: row.region });
      }
      setLocationOptions(options);
       setAddressSuggestions((existing.data || []).map(row => ({ region: row.region || "", city: row.city || "", district_street: row.district_street || "", nearest_landmark: row.nearest_landmark || "" })));
    })();
    return () => { active = false; };
  }, [companyId]);

  const regionChoices = uniqueSorted([...Object.keys(SAUDI_LOCATIONS), ...locationOptions.filter(o => o.kind === "region").map(o => o.name), unitDraft.region || ""]);
  const cityChoices = uniqueSorted([
    ...(SAUDI_LOCATIONS[unitDraft.region || ""] || []),
    ...locationOptions.filter(o => o.kind === "city" && o.region_name === unitDraft.region).map(o => o.name),
    ...(unitDraft.city ? [unitDraft.city] : []),
  ]);
  const saveNewLocation = async () => {
    const name = newLocationName.trim();
    if (!addingLocation || !name || savingLocation) return;
    if (addingLocation === "city" && !unitDraft.region) { setLocationError("اختر المنطقة الإدارية أولًا قبل إضافة مدينة."); return; }
    const regionName = addingLocation === "city" ? unitDraft.region : null;
    if (addingLocation === "region" ? regionChoices.includes(name) : cityChoices.includes(name)) {
      setLocationError("هذا الاختيار موجود بالفعل في القائمة."); return;
    }
    setSavingLocation(true); setLocationError("");
    const { error } = await supabase.from("residential_location_options").insert({ company_id: companyId, kind: addingLocation, name, region_name: regionName });
    setSavingLocation(false);
    if (error) { setLocationError(`تعذر حفظ الاختيار في قاعدة البيانات: ${error.message}`); return; }
    setLocationOptions(prev => [...prev, { kind: addingLocation, name, region_name: regionName }]);
    if (addingLocation === "region") {
      setUnitDraft(prev => ({ ...prev, region: name, city: "" }));
    } else setUnitDraft(prev => ({ ...prev, city: name }));
    setUnitDirty(true); setAddingLocation(null); setNewLocationName(""); setSaveNotice("");
  };

   const contractLockedFields = ["apartment_status", "rent_amount", "rent_period"] as const;
   const checkContractFields = async (keys: string[]) => {
     if (!keys.some(key => contractLockedFields.some(locked => locked === key))) return;
     const now = new Date();
     const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
     const { data, error } = await supabase.from("residential_contracts")
       .select("id").eq("company_id", companyId).eq("apartment_id", unit.id)
       .eq("status", "نشط").lte("start_date", today).gte("end_date", today).limit(1);
     if (error) throw new Error("تعذر التحقق من العقد: " + error.message);
     if (data?.length) throw new Error("لا يمكن تعديل حالة الشقة أو قيمة الإيجار أو فترته أثناء سريان العقد. يتم تعديل بيانات الإيجار من العقد نفسه.");
   };

  const persistField = async (patch: Partial<ResidentialMapUnit>): Promise<boolean> => {
    if (savingField) return false;
    if (Object.keys(patch).some(key => contractLockedFields.some(locked => locked === key)) && (hasCurrentLease || leaseStatusLoading || leaseStatusError)) { setFieldError("بيانات الحالة والإيجار مقفولة أثناء سريان العقد أو لحين التحقق منه."); return false; }
     try { await checkContractFields(Object.keys(patch)); } catch (error) { setFieldError(error instanceof Error ? error.message : "تعذر التحقق من العقد."); return false; }
    setSavingField(true); setFieldError("");
    const { error } = await supabase.from("residential_apartments")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", unit.id).eq("company_id", companyId);
    setSavingField(false);
    if (error) { setFieldError(`تعذر حفظ التعديل: ${error.message}`); return false; }
    setEditedUnit(previous => ({ ...previous, ...patch }));
    setUnitDraft(previous => ({ ...previous, ...patch }));
    onUnitUpdated?.(patch);
    return true;
  };
  const addChoice = () => {
    const value = newChoice.trim();
    if (!value || !addingChoice) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem(choiceKey) || "{}");
      const key = addingChoice === "type" ? "types" : "statuses";
      saved[key] = Array.from(new Set([...(Array.isArray(saved[key]) ? saved[key] : []), value]));
      window.localStorage.setItem(choiceKey, JSON.stringify(saved));
    } catch { setFieldError("تعذر حفظ الاختيار الجديد محليًا."); return; }
    if (addingChoice === "type") setTypeChoices(prev => Array.from(new Set([...prev, value])));
    else setStatusChoices(prev => Array.from(new Set([...prev, value])));
    setAddingChoice(null); setNewChoice("");
  };

  useEffect(() => {
    let active = true;
    setActiveTab("البيانات الأساسية"); setOwner(null); setOwnerForm(blankOwner()); setOwnerDirty(false); setOwnerError(""); setSaveNotice("");
    if (!unit.owner_id) { setOwnerLoading(false); return; }
    setOwnerLoading(true);
    void (async () => {
      const { data, error } = await supabase.from("property_owners")
        .select("full_name,mobile,phone,email,nationality,identity_number")
        .eq("company_id", companyId).eq("id", unit.owner_id).maybeSingle();
      if (!active) return;
      if (error) setOwnerError("تعذر تحميل بيانات المالك.");
      else { setOwner(data as Owner | null); setOwnerForm(data ? (data as Owner) : blankOwner()); }
      setOwnerLoading(false);
    })();
    return () => { active = false; };
  }, [unit.id, unit.owner_id, companyId]);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") { if (detailModal) setDetailModal(null); else if (financialModal) setFinancialModal(null); else onClose(); } };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, financialModal, detailModal]);
  const changeOwner = (field: keyof Owner, value: string) => {
    setOwnerForm(previous => ({ ...previous, [field]: value }));
    setOwnerDirty(true); setOwnerError(""); setSaveNotice("");
  };
  const saveOwner = async () => {
    if (savingOwner || ownerLoading || savingField) return;
    if (!ownerDirty) { setSaveNotice("لا توجد تغييرات جديدة للحفظ."); return; }
    if (!ownerForm.full_name.trim()) { setOwnerError("اسم المالك مطلوب لحفظ بيانات المالك."); return; }
    if (ownerForm.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerForm.email.trim())) { setOwnerError("البريد الإلكتروني غير صحيح."); return; }
    setSavingOwner(true); setOwnerError(""); setSaveNotice("");
    const payload = {
      full_name: ownerForm.full_name.trim(),
      mobile: ownerForm.mobile?.trim() || null,
      phone: ownerForm.phone?.trim() || null,
      email: ownerForm.email?.trim() || null,
      nationality: ownerForm.nationality?.trim() || null,
      identity_number: ownerForm.identity_number?.trim() || null,
    };
    try {
      if (editedUnit.owner_id) {
        const { data, error } = await supabase.from("property_owners")
          .update(payload).eq("id", editedUnit.owner_id).eq("company_id", companyId).select("id").single();
        if (error || !data) throw new Error(error?.message || "لم يتم العثور على المالك");
      } else {
        const { data, error } = await supabase.from("property_owners")
          .insert({ ...payload, company_id: companyId }).select("id").single();
        if (error || !data) throw new Error(error?.message || "تعذر إنشاء المالك");
        const { error: linkError } = await supabase.from("residential_apartments")
          .update({ owner_id: data.id, updated_at: new Date().toISOString() })
          .eq("id", editedUnit.id).eq("company_id", companyId);
        if (linkError) throw new Error(`تم إنشاء المالك ولكن تعذر ربطه بالشقة: ${linkError.message}`);
        setEditedUnit(previous => ({ ...previous, owner_id: data.id }));
        onUnitUpdated?.({ owner_id: data.id });
      }
      setOwner(payload); setOwnerDirty(false); setSaveNotice("تم حفظ بيانات المالك بنجاح.");
    } catch (error) {
      setOwnerError(error instanceof Error ? error.message : "تعذر حفظ بيانات المالك.");
    } finally { setSavingOwner(false); }
  };
  const ownerFields: { key: keyof Owner; label: string; type?: string }[] = [
    { key: "full_name", label: "اسم المالك" },
    { key: "mobile", label: "رقم الجوال", type: "tel" },
    { key: "identity_number", label: "رقم الهوية / الإقامة" },
    { key: "phone", label: "رقم الهاتف", type: "tel" },
    { key: "nationality", label: "الجنسية" },
    { key: "email", label: "البريد الإلكتروني", type: "email" },
  ];
  const ownerEditor = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {ownerFields.map(field => <label key={field.key} className="block rounded-xl border border-[#294d6d] bg-[#102239] px-3 py-3 text-right">
        <span className="mb-2 block text-sm font-bold text-slate-200">{field.label}</span>
        <input type={field.type || "text"} dir={field.type === "email" || field.type === "tel" ? "ltr" : "rtl"}
          value={ownerForm[field.key] ?? ""} onChange={event => changeOwner(field.key, event.target.value)}
          placeholder={`أدخل ${field.label}`} className="h-11 w-full min-w-0 rounded-lg border border-[#315577] bg-[#071a2d] px-3 py-2 text-sm text-white outline-none focus:border-amber-400" />
      </label>)}
    </div>
  );
  const status = hasCurrentLease ? "مؤجرة" : editedUnit.apartment_status;
  const card = "rounded-2xl border border-[#2a5275] bg-[#102239] text-center";
  const financialActions = [
    { title: "إضافة فاتورة أو مستحقات", icon: FileText, color: "#22d3ee", kind: "charge" as const, note: "إضافة للشقة المحددة" },
    { title: "إضافة تحصيل فاتورة أو إيجار", icon: Wallet, color: "#f6c84a", kind: "collectCharge" as const, note: "تحصيل للشقة المحددة" },
  ];
  const financialSummaries = [
    { key: "collections", title: "إجمالي التحصيلات", icon: Coins, color: "#f6c84a" },
    { key: "water", title: "إجمالي فواتير المياه", icon: Droplets, color: "#22d3ee" },
    { key: "electric", title: "إجمالي فواتير الكهرباء", icon: Zap, color: "#fbbf24" },
    { key: "late", title: "التحصيلات المتأخرة", icon: CircleAlert, color: "#fb7185" },
  ];
  const unitFields: { key: keyof ResidentialMapUnit; label: string; kind?: "number" | "select"; choices?: string[] }[] = [
    { key: "apartment_number", label: "رقم الشقة" },
    { key: "apartment_type", label: "نوع الشقة", kind: "select", choices: typeChoices },
    { key: "apartment_status", label: "حالة الشقة", kind: "select", choices: statusChoices },
    { key: "rent_amount", label: "قيمة الإيجار", kind: "number" },
    { key: "rent_period", label: "فترة الإيجار", kind: "select", choices: ["يومي", "شهري", "سنوي"] },
    { key: "rooms_count", label: "عدد الغرف", kind: "number" },
    { key: "area_sqm", label: "المساحة (م²)", kind: "number" },
    { key: "region", label: "المنطقة الإدارية", kind: "select", choices: regionChoices },
    { key: "city", label: "المدينة", kind: "select", choices: cityChoices },
    { key: "district_street", label: "الحي / الشارع" },
    { key: "nearest_landmark", label: "أقرب معلم" },
    { key: "building_name", label: "اسم العمارة" },
  ];
  const updateDraft = (key: keyof ResidentialMapUnit, value: string, numeric = false) => {
    setUnitDraft(prev => key === "region" ? ({ ...prev, region: value, city: value === prev.region ? prev.city : "" }) : ({ ...prev, [key]: numeric ? (value.trim() === "" ? null : Number(value)) : value }));
    setUnitDirty(true); setFieldError(""); setSaveNotice("");
  };
  const saveAll = async () => {
    if (savingAll || savingOwner || savingField || ownerLoading) return;
    if (unitDirty && contractLockedFields.some(key => unitDraft[key] !== editedUnit[key]) && (hasCurrentLease || leaseStatusLoading || leaseStatusError)) { setFieldError("لا يمكن تعديل حالة الشقة أو قيمة الإيجار أو فترته أثناء سريان العقد."); return; }
    setSavingAll(true); setFieldError(""); setOwnerError(""); setSaveNotice("");
    try {
      if (unitDirty) {
        if (!unitDraft.apartment_number.trim()) throw new Error("رقم الشقة مطلوب.");
        if ([unitDraft.rent_amount, unitDraft.rooms_count, unitDraft.area_sqm].some(v => v !== null && (!Number.isFinite(v) || v < 0))) throw new Error("تحقق من القيم الرقمية للشقة.");
        const changes: Record<string, string | number | null> = {};
        for (const field of unitFields) {
          if (unitDraft[field.key] !== editedUnit[field.key]) changes[field.key] = unitDraft[field.key] as string | number | null;
        }
        if (unitDraft.notes !== editedUnit.notes) changes.notes = unitDraft.notes;
        if (Object.keys(changes).length) {
          await checkContractFields(Object.keys(changes));
          const { data, error } = await supabase.from("residential_apartments")
            .update({ ...changes, updated_at: new Date().toISOString() })
            .eq("id", editedUnit.id).eq("company_id", companyId).select("id").maybeSingle();
          if (error || !data) throw new Error(error?.message || "تعذر حفظ تفاصيل الشقة.");
          setEditedUnit(prev => ({ ...prev, ...changes }));
           if (changes.district_street || changes.nearest_landmark) setAddressSuggestions(prev => [...prev, { region: String(changes.region ?? unitDraft.region ?? ""), city: String(changes.city ?? unitDraft.city ?? ""), district_street: String(changes.district_street ?? unitDraft.district_street ?? ""), nearest_landmark: String(changes.nearest_landmark ?? unitDraft.nearest_landmark ?? "") }]);
          onUnitUpdated?.(changes as Partial<ResidentialMapUnit>);
        }
        setUnitDirty(false);
      }
      if (ownerDirty) {
        if (!ownerForm.full_name.trim()) throw new Error("اسم المالك مطلوب لحفظ بيانات المالك.");
        if (ownerForm.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerForm.email.trim())) throw new Error("البريد الإلكتروني غير صحيح.");
        const payload = {
          full_name: ownerForm.full_name.trim(), mobile: ownerForm.mobile?.trim() || null,
          phone: ownerForm.phone?.trim() || null, email: ownerForm.email?.trim() || null,
          nationality: ownerForm.nationality?.trim() || null, identity_number: ownerForm.identity_number?.trim() || null,
        };
        let ownerId = editedUnit.owner_id;
        if (ownerId) {
          const { data: linked, error: lookupError } = await supabase.from("residential_apartments")
            .select("id").eq("company_id", companyId).eq("owner_id", ownerId).limit(2);
          if (lookupError) throw new Error(lookupError.message);
          if ((linked || []).length > 1) ownerId = null; // نسخة مستقلة حتى لا تتغير بيانات مالك شقق أخرى
        }
        if (ownerId) {
          const { data, error } = await supabase.from("property_owners").update(payload)
            .eq("id", ownerId).eq("company_id", companyId).select("id").maybeSingle();
          if (error || !data) throw new Error(error?.message || "تعذر تحديث المالك.");
        } else {
          const { data, error } = await supabase.from("property_owners")
            .insert({ ...payload, company_id: companyId }).select("id").single();
          if (error || !data) throw new Error(error?.message || "تعذر إنشاء سجل المالك.");
          const { data: linked, error: linkError } = await supabase.from("residential_apartments")
            .update({ owner_id: data.id, updated_at: new Date().toISOString() })
            .eq("id", editedUnit.id).eq("company_id", companyId).select("id").maybeSingle();
          if (linkError || !linked) throw new Error(linkError?.message || "تعذر ربط المالك بالشقة.");
          setEditedUnit(prev => ({ ...prev, owner_id: data.id }));
          setUnitDraft(prev => ({ ...prev, owner_id: data.id }));
          onUnitUpdated?.({ owner_id: data.id });
        }
        setOwner(payload); setOwnerDirty(false);
      }
       showApartmentSaveSuccess();
       onClose();
    } catch (error) { setFieldError(error instanceof Error ? error.message : "تعذر حفظ التعديلات."); }
    finally { setSavingAll(false); }
  };
  const editableInfo = (field: typeof unitFields[number]) => {
    const value = field.key === "apartment_status" && hasCurrentLease ? "مؤجرة" : field.key === "rent_amount" && currentLeaseDates ? currentLeaseDates.rent_amount : field.key === "rent_period" && currentLeaseDates ? currentLeaseDates.rent_period : unitDraft[field.key];
     const isContractLocked = contractLockedFields.some(key => key === field.key) && (hasCurrentLease || leaseStatusLoading || Boolean(leaseStatusError));
     const isAddress = field.key === "district_street" || field.key === "nearest_landmark";
    const isLocation = field.key === "region" || field.key === "city";
    const common = "mt-1 h-9 w-full min-w-0 rounded-lg border border-[#315577] bg-[#071a2d] px-2 text-sm font-semibold text-white outline-none focus:border-amber-400";
    return <label key={field.key} className="block min-w-0 rounded-xl border border-[#294d6d] bg-[#102239] px-3 py-2 text-right">
      <span className="flex items-center justify-between gap-2 text-xs font-bold text-slate-300">
        <span>{field.label}</span>
        {isLocation && <button type="button" title={`إضافة ${field.label}`} aria-label={`إضافة ${field.label}`} onClick={() => { setAddingLocation(field.key === "region" ? "region" : "city"); setNewLocationName(""); setLocationError(""); }} className="flex h-6 w-6 items-center justify-center rounded-md border border-amber-400/50 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20"><Plus size={15}/></button>}
      </span>
      {field.kind === "select" ? <select value={value ?? ""} disabled={(field.key === "city" && !unitDraft.region) || isContractLocked} onChange={e => updateDraft(field.key, e.target.value)} className={`${common} disabled:cursor-not-allowed disabled:opacity-50`}>
        <option value="">{field.key === "city" && !unitDraft.region ? "اختر المنطقة أولًا" : `اختر ${field.label}`}</option>
        {Array.from(new Set([...(field.choices || []), String(value ?? "")].filter(Boolean))).map(v => <option key={v} value={v}>{v}</option>)}
      </select> : <input type={field.kind === "number" ? "number" : "text"} min={field.kind === "number" ? 0 : undefined} step={field.kind === "number" ? "any" : undefined} value={value ?? ""} disabled={isContractLocked} onChange={e => updateDraft(field.key, e.target.value, field.kind === "number")} list={isAddress ? `aqary-address-${field.key}-${unit.id}` : undefined} title={isContractLocked ? "هذه القيمة مرتبطة بالعقد الساري ولا يمكن تعديلها من هنا" : undefined} className={`${common} disabled:cursor-not-allowed disabled:opacity-60`}/>}
      {isAddress && <datalist id={`aqary-address-${field.key}-${unit.id}`}>
        {uniqueSorted(addressSuggestions.filter(row => (!unitDraft.region || !row.region || row.region === unitDraft.region) && (!unitDraft.city || !row.city || row.city === unitDraft.city)).map(row => row[field.key as "district_street" | "nearest_landmark"])).map(name => <option key={name} value={name}/>)}
      </datalist>}
      {isContractLocked && <span className="mt-1 block text-[10px] text-amber-300">{leaseStatusLoading ? "جارٍ التحقق من العقد..." : leaseStatusError ? "تعذر التحقق من العقد" : "مرتبط بالعقد الساري — للعرض فقط"}</span>}
    </label>;
  };
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-2 backdrop-blur-md sm:p-4" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={`تفاصيل الشقة ${unit.apartment_number}`} dir="rtl" style={{ width: "min(1220px, calc(100vw - 32px))", maxWidth: "1220px", marginInline: "auto" }} className="relative flex max-h-[calc(100dvh-16px)] min-w-0 flex-col overflow-hidden rounded-[23px] border border-[#d89b18]/75 bg-[#061426] shadow-[0_0_80px_rgba(216,155,24,0.18)] sm:max-h-[min(850px,calc(100dvh-40px))]">
        <div className="absolute inset-x-0 top-0 z-10 h-[2px] bg-gradient-to-r from-transparent via-[#f6c84a] to-transparent" />
        <header className="relative shrink-0 border-b border-white/10 bg-gradient-to-r from-[#050d18] via-[#0a2038] to-[#071a2d] px-3 py-1 lg:px-4">
          <div className="flex min-h-[38px] items-center justify-between gap-4">
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#f0ad18]/40 bg-[#f0ad18]/10"><Building2 size={25} className="text-[#f0ad18]"/></span><div className="hidden sm:block"><p className="text-lg font-black tracking-wider text-white">AQARY SMART</p><p className="text-xs font-semibold text-[#d89b18]">عقاري سمارت</p></div></div>
            <div className="min-w-0 text-center"><h2 className="text-xl font-black text-[#f6c84a] lg:text-2xl">تفاصيل الشقة</h2><p className="truncate text-xs font-semibold text-gray-300">{unit.building_name || "شقة سكنية مستقلة"}</p></div>
            <button type="button" onClick={onClose} aria-label="إغلاق" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:border-red-400/40 hover:text-red-400"><X size={24}/></button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          {/* بداية العقد، نهاية العقد، الإيجار، النوع والحالة، الصورة يسارًا. */}
          <div className="grid grid-cols-1 gap-1 border-b border-[#2a5275] bg-[#06182c] p-1 lg:grid-cols-[minmax(0,1fr)_320px]" dir="rtl">
            <div className="grid min-w-0 grid-cols-2 gap-1 sm:grid-cols-4" dir="rtl">
              <div className={`${card} flex min-h-[194px] flex-col items-center justify-center gap-2 p-2`}>
                <span className="text-xs font-bold text-slate-300">تاريخ بداية العقد</span><CalendarDays size={26} className="text-green-400"/>
                <strong className="text-sm font-black text-white">{leaseStatusLoading ? "جارٍ التحميل..." : currentLeaseDates ? currentLeaseDates.start_date.split("-").reverse().join("/") : "غير مربوط"}</strong><span className="text-center text-[11px] text-slate-400">{leaseStatusError || (currentLeaseDates ? "تاريخ بداية العقد الساري" : "لا يوجد عقد ساري حاليًا")}</span>
              </div>
              <div className={`${card} flex min-h-[194px] flex-col items-center justify-center gap-2 p-2`}>
                <span className="text-xs font-bold text-slate-300">تاريخ نهاية العقد</span><CalendarDays size={26} className="text-red-400"/>
                <strong className="text-sm font-black text-white">{leaseStatusLoading ? "جارٍ التحميل..." : currentLeaseDates ? currentLeaseDates.end_date.split("-").reverse().join("/") : "غير مربوط"}</strong><span className="text-center text-[11px] text-slate-400">{leaseStatusError || (currentLeaseDates ? "تاريخ انتهاء العقد الساري" : "لا يوجد عقد ساري حاليًا")}</span>
              </div>
              <div className={`${card} flex min-h-[194px] flex-col items-center justify-center gap-2 p-2`}>
                <span className="text-xs font-bold text-slate-300">قيمة الإيجار</span><Wallet size={27} className="text-amber-400"/>
                <strong className="break-words text-xl font-black text-[#f6c84a]">{money(currentLeaseDates ? currentLeaseDates.rent_amount : editedUnit.rent_amount)}</strong>
                <span className="text-xs text-slate-400">{display(currentLeaseDates ? currentLeaseDates.rent_period : editedUnit.rent_period)}</span>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                {([{ key: "type", title: "نوع الشقة", icon: Home, color: "text-blue-400", value: editedUnit.apartment_type || "", options: typeChoices, column: "apartment_type" },
                   { key: "status", title: "حالة الشقة", icon: User, color: "text-emerald-400", value: status, options: statusChoices, column: "apartment_status" }] as const).map(item => {
                  const Icon = item.icon;
                  return <div key={item.key} className={`${card} flex min-h-[95px] min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-1`}>
                    <span className="text-[11px] font-bold text-slate-300">{item.title}</span><Icon size={19} className={item.color}/>
                    <div className="flex w-full items-center gap-1">
                      <button type="button" title={`إضافة ${item.title} جديد`} disabled={item.key === "status" && (hasCurrentLease || leaseStatusLoading || Boolean(leaseStatusError))} onClick={() => { setAddingChoice(item.key); setNewChoice(""); }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20"><Plus size={17}/></button>
                      <div className="relative min-w-0 flex-1"><select aria-label={item.title} disabled={savingField || (item.key === "status" && (hasCurrentLease || leaseStatusLoading || Boolean(leaseStatusError)))} value={item.value} onChange={event => { void persistField({ [item.column]: event.target.value }); }} className="h-8 w-full appearance-none rounded-lg border border-[#2a5275] bg-[#0b213a] py-1 pr-2 pl-6 text-center text-xs font-black text-white outline-none focus:border-amber-400 disabled:opacity-50">
                        {!item.value && <option value="">اختر {item.title}</option>}
                        {item.options.map(option => <option key={option} value={option}>{option}</option>)}
                      </select><ChevronDown size={13} className="pointer-events-none absolute left-1.5 top-2.5 text-slate-300"/></div>
                    </div>
                  </div>;
                })}
              </div>
            </div>
            <div className="relative min-h-[185px] overflow-hidden rounded-xl border border-[#d89b18]/30 bg-[#0a1e33] lg:min-h-[194px]">
              <img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85" alt="صورة توضيحية للشقة" className="absolute inset-0 h-full w-full object-cover"/>
              <div className="absolute inset-0 bg-gradient-to-t from-[#020813]/95 via-[#061426]/15 to-transparent"/>
              <div className="absolute bottom-2 right-2 left-2 text-right">
                <p className="text-xs text-gray-300">شقة رقم</p>
                <div className="flex items-center justify-start gap-2">
                  {editingNumber ? <div className="flex min-w-0 items-center gap-1"><input autoFocus aria-label="رقم الشقة الجديد" value={newNumber} onChange={event => setNewNumber(event.target.value)} className="min-w-0 w-28 rounded-lg border border-amber-400 bg-[#061426] px-2 py-1 text-xl font-black text-white"/><button type="button" disabled={savingField || !newNumber.trim()} onClick={() => { void persistField({ apartment_number: newNumber.trim() }).then(ok => { if (ok) setEditingNumber(false); }); }} className="rounded-lg bg-emerald-600 p-2 text-white"><Check size={16}/></button><button type="button" onClick={() => setEditingNumber(false)} className="rounded-lg bg-slate-700 p-2 text-white"><X size={16}/></button></div> : <><strong className="max-w-full break-all text-4xl font-black text-[#f6c84a]">{editedUnit.apartment_number}</strong><button type="button" aria-label="تعديل رقم الشقة" title="تعديل رقم الشقة" onClick={() => { setNewNumber(editedUnit.apartment_number); setEditingNumber(true); }} className="rounded-lg border border-amber-400/60 bg-[#0b213a]/85 p-1.5 text-amber-300 hover:bg-amber-400/20"><Pencil size={17}/></button></>}
                </div>
                <span className="mt-1 inline-flex rounded-full border border-emerald-400/30 bg-[#0a2830]/90 px-2 py-0.5 text-[11px] font-bold text-emerald-200">{status}</span>
              </div>
            </div>
          </div>
          {leaseStatusError && <p role="alert" className="border-b border-amber-500/40 bg-amber-950/50 px-3 py-2 text-xs text-amber-200">{leaseStatusError}</p>}
          {fieldError && <p role="alert" className="border-b border-red-500/40 bg-red-950/60 px-3 py-2 text-xs text-red-200">{fieldError}</p>}
                     {addingLocation && <div className="border-b border-amber-400/30 bg-[#0b213a] p-3" dir="rtl">
             <p className="mb-2 text-sm font-bold text-amber-300">إضافة {addingLocation === "region" ? "منطقة إدارية" : `مدينة تابعة لـ ${unitDraft.region || "منطقة غير محددة"}`}</p>
             <div className="flex flex-wrap gap-2"><input autoFocus value={newLocationName} onChange={e => { setNewLocationName(e.target.value); setLocationError(""); }} onKeyDown={e => { if (e.key === "Enter") void saveNewLocation(); }} placeholder={addingLocation === "region" ? "اسم المنطقة الجديدة" : "اسم المدينة الجديدة"} className="min-w-40 flex-1 rounded-lg border border-[#2a5275] bg-[#061426] px-3 py-2 text-sm text-white"/><button type="button" disabled={savingLocation || !newLocationName.trim()} onClick={() => void saveNewLocation()} className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-black text-[#061426] disabled:opacity-50">{savingLocation ? "جارٍ الحفظ..." : "إضافة وحفظ"}</button><button type="button" onClick={() => { setAddingLocation(null); setLocationError(""); }} className="rounded-lg border border-white/20 px-3 py-2 text-white">إلغاء</button></div>
             {locationError && <p role="alert" className="mt-2 text-xs text-red-300">{locationError}</p>}
             <p className="mt-1 text-[11px] text-slate-400">الاختيار الجديد يُحفظ للشركة في قاعدة البيانات ويظهر في قوائم الشقق الأخرى.</p>
           </div>}
{addingChoice && <div className="border-b border-amber-400/30 bg-[#0b213a] p-3"><p className="mb-2 text-sm font-bold text-amber-300">إضافة {addingChoice === "type" ? "نوع شقة" : "حالة شقة"} جديدة</p><div className="flex gap-2"><input autoFocus value={newChoice} onChange={event => setNewChoice(event.target.value)} onKeyDown={event => { if (event.key === "Enter") addChoice(); }} placeholder="اكتب الاسم الجديد" className="min-w-0 flex-1 rounded-lg border border-[#2a5275] bg-[#061426] px-3 py-2 text-sm text-white"/><button type="button" onClick={addChoice} className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-black text-[#061426]">إضافة</button><button type="button" onClick={() => setAddingChoice(null)} className="rounded-lg border border-white/20 px-3 py-2 text-white">إلغاء</button></div><p className="mt-1 text-[11px] text-slate-400">الاختيار الجديد سيُحفظ في قائمة هذا المتصفح، واختيارك للشقة سيُحفظ في قاعدة البيانات.</p></div>}
          <div className="border-b border-[#2a5275] bg-[#071b30] p-2" dir="rtl">
            <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {financialActions.map(item => { const Icon = item.icon; return <button key={item.kind} type="button" onClick={() => openFinancialAction(item.kind)} className="group relative flex min-h-[65px] items-center justify-center gap-3 overflow-hidden rounded-xl border bg-[#0b223b] px-3 py-2 text-center transition hover:-translate-y-0.5 hover:brightness-125" style={{borderColor: `${item.color}85`, background: "linear-gradient(140deg,#102d43,#07182b)"}}><span className="rounded-xl border p-2" style={{color:item.color,borderColor:`${item.color}70`,background:`${item.color}12`}}><Icon size={25}/></span><span><strong className="block text-sm font-black text-white">{item.title}</strong><small className="mt-1 block text-[11px] text-slate-400">{item.note}</small></span><Plus size={17} style={{color:item.color}}/></button>; })}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                             {financialSummaries.map(item => {
                 const Icon = item.icon;
                 const range = periods[item.key] ?? currentMonth();
                 const totals = financialTotals(item.key, range.from, range.to);
                 return <div key={item.key} className="min-w-0 rounded-xl border bg-[#0b223b] p-2.5 text-center" style={{borderColor:`${item.color}75`,background:item.key === "late" ? "linear-gradient(145deg,#3b1727,#0b223b)" : "linear-gradient(145deg,#112c43,#091a2f)"}}>
                   <button type="button" onClick={() => setDetailModal(item.key as "collections" | "water" | "electric" | "late")} className="block w-full rounded-lg text-center transition hover:brightness-125" title={`عرض تفاصيل ${item.title}`}>
                     <span className="flex items-center justify-center gap-2"><Icon size={22} style={{color:item.color}}/><strong className="text-xs font-black text-white">{item.title}</strong></span>
                     <span className="mt-2 block text-lg font-black" style={{color:item.color}}>{financeLoading ? "جارٍ التحميل" : financeError ? "—" : formatSAR(totals.total)} <span className="text-xs">ريال</span></span>
                     {!financeLoading && !financeError && item.key !== "late" && item.key !== "collections" && <span className="mt-1 grid grid-cols-2 gap-1 text-[11px] font-bold"><span className="rounded-md bg-emerald-500/10 px-1 py-1 text-emerald-300">المحصّل: {formatSAR(totals.collected)}</span><span className="rounded-md bg-rose-500/10 px-1 py-1 text-rose-300">المتبقي: {formatSAR(totals.remaining)}</span></span>}
                     <span className="mt-1 block text-[10px] text-slate-400">{financeError ? "خطأ: "+financeError : "اضغط لعرض التفاصيل"}</span>
                   </button>
                   <div className="mt-2 grid grid-cols-2 gap-1"><label className="min-w-0 text-[10px] text-slate-300">من<input type="date" aria-label={`من - ${item.title}`} value={range.from} max={range.to} onChange={e=>setPeriods(prev=>({...prev,[item.key]:{...range,from:e.target.value}}))} className="mt-1 block h-8 w-full min-w-0 rounded-md border border-[#31506e] bg-[#08192b] px-1 text-center text-[10px] text-white [color-scheme:dark]"/></label><label className="min-w-0 text-[10px] text-slate-300">إلى<input type="date" aria-label={`إلى - ${item.title}`} value={range.to} min={range.from} onChange={e=>setPeriods(prev=>({...prev,[item.key]:{...range,to:e.target.value}}))} className="mt-1 block h-8 w-full min-w-0 rounded-md border border-[#31506e] bg-[#08192b] px-1 text-center text-[10px] text-white [color-scheme:dark]"/></label></div>
                 </div>;
               })}
            </div>
          </div>
          <nav aria-label="أقسام تفاصيل الشقة" className="border-b border-[#2a5275] bg-[#071a2d] px-2 py-2"><div className="flex gap-1.5 overflow-x-auto" dir="rtl">{tabs.map(tab => { const Icon = tab.icon; return <button key={tab.title} type="button" onClick={() => setActiveTab(tab.title)} className={`flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-black transition sm:text-sm ${activeTab === tab.title ? "border-[#f0ad18]/60 bg-gradient-to-r from-[#f0ad18] to-[#d99a12] text-[#07182b]" : "border-[#294d6d] bg-[#0b213a] text-gray-200 hover:border-[#f0ad18]/40"}`}><Icon size={16}/>{tab.title}</button>; })}</div></nav>
          <div className="bg-[#061426] p-2 sm:p-3">
            {activeTab === "البيانات الأساسية" && <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.35fr_1fr]" dir="rtl">
              <Section title="تفاصيل الشقة" icon={Building2}>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {unitFields.map(editableInfo)}
                </div>
                <label className="block rounded-xl border border-[#294d6d] bg-[#102239] p-3 text-right"><span className="mb-1 block text-xs font-bold text-slate-300">ملاحظات الشقة</span><textarea rows={2} value={unitDraft.notes ?? ""} onChange={e => updateDraft("notes", e.target.value)} className="w-full rounded-lg border border-[#315577] bg-[#071a2d] p-2 text-sm text-white"/></label>
              </Section>
              <Section title="بيانات المالك" icon={User}>
                {ownerLoading ? <p className="py-5 text-center text-slate-300">جارٍ تحميل بيانات المالك...</p> : ownerEditor}
              </Section>
            </div>}
            {activeTab === "بيانات المالك" && <Section title="بيانات مالك الشقة" icon={User}>{ownerLoading ? <p className="py-5 text-center text-slate-300">جارٍ تحميل بيانات المالك...</p> : ownerEditor}</Section>}
            {activeTab === "العقد" && <Section title="بيانات العقود المسجلة للشقة" icon={FileText}>
              {contractsLoading ? <p className="py-8 text-center text-sm text-slate-300">جارٍ تحميل بيانات العقود...</p> : <>
                {contractsError && <p role="alert" className="rounded-lg border border-rose-400/40 bg-rose-950/30 p-3 text-center text-sm text-rose-200">{contractsError}</p>}
                {!apartmentContracts.length && !contractsError && <p className="py-8 text-center text-sm text-slate-300">لا يوجد عقد مسجل لهذه الشقة حتى الآن.</p>}
                <div className="space-y-4">
                  {apartmentContracts.map(contract => {
                    const tenant = contract.tenant_id ? contractTenants[contract.tenant_id] : undefined;
                    const contractInstallments = installments.filter(row => row.contract_id === contract.id).sort((a,b) => a.due_date.localeCompare(b.due_date));
                    const today = new Date().toLocaleDateString("en-CA");
                    const isCurrent = contract.status === "نشط" && contract.start_date <= today && contract.end_date >= today;
                    const paidInstallment = (id: string) => rentAllocations.filter(a => a.installment_id === id).reduce((sum,a) => sum + Number(a.amount),0);
                    const rentTotal = contractInstallments.length ? contractInstallments.reduce((sum,row) => sum + Number(row.amount),0) : Number(contract.rent_amount);
                    const rentCollected = contractInstallments.length ? contractInstallments.reduce((sum,row) => sum + paidInstallment(row.id),0) : rentReceipts.filter(r => r.contract_id === contract.id).reduce((sum,r) => sum + Number(r.amount),0);
                    return <article key={contract.id} className="overflow-hidden rounded-2xl border border-[#b78b28]/60 bg-[#071b30]">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#b78b28]/35 bg-gradient-to-l from-[#173b32] to-[#0b213a] px-4 py-3">
                        <div className="flex items-center gap-2 text-right"><FileText size={21} className="text-[#f6c84a]"/><div><h4 className="text-base font-black text-[#f6c84a] sm:text-lg">عقد رقم {display(contract.contract_number)}</h4><p className="text-xs text-slate-300">الشقة {editedUnit.apartment_number} — {editedUnit.building_name || "شقة سكنية"}</p></div></div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-black ${isCurrent ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300" : "border-amber-400/40 bg-amber-400/10 text-amber-200"}`}>{contract.status}{isCurrent ? " — ساري حاليًا" : ""}</span>
                      </div>
                      <div className="space-y-4 p-3 sm:p-4">
                        <div><h5 className="mb-2 text-sm font-black text-[#f6c84a]">معلومات العقد</h5>
                          <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
                            {contractField("رقم العقد", display(contract.contract_number), true)}
                            {contractField("قيمة الإيجار", `${formatSAR(Number(contract.rent_amount))} ريال`, true)}
                            {contractField("نوع العقد", display(contract.contract_type))}
                            {contractField("تاريخ تحرير العقد", contractDate(contract.created_at || contract.contract_date))}
                            {contractField("تحرير بواسطة", contract.created_by ? (contractCreators[contract.created_by] || "غير مسجل") : "غير مسجل")}
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                            {contractField("حالة العقد", display(contract.status))}
                            {contractField("تاريخ البداية", contractDate(contract.start_date))}
                            {contractField("تاريخ النهاية", contractDate(contract.end_date))}
                            {contractField("فترة الإيجار", display(contract.rent_period))}
                          </div>
                        </div>
                        <div><h5 className="mb-2 text-sm font-black text-[#f6c84a]">بيانات المستأجر</h5><div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{contractField("اسم المستأجر", tenantText(tenant,"full_name","tenant_name","name"))}{contractField("رقم الجوال", tenantText(tenant,"mobile","phone","mobile_number","phone_number"))}{contractField("رقم الهوية / الإقامة", tenantText(tenant,"identity_number","national_id","id_number","iqama_number"))}</div></div>
                        <div><h5 className="mb-2 text-sm font-black text-[#f6c84a]">الملخص المالي للعقد</h5><div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{contractField("إجمالي الأقساط المسجلة", `${formatSAR(rentTotal)} ريال`, true)}{contractField("إجمالي المحصّل", `${formatSAR(rentCollected)} ريال`)}{contractField("المتبقي", `${formatSAR(Math.max(0,rentTotal-rentCollected))} ريال`)}</div></div>
                        <div><h5 className="mb-2 text-sm font-black text-[#f6c84a]">جدول أقساط الإيجار</h5>{financeLoading ? <p className="text-xs text-slate-400">جارٍ تحميل الأقساط...</p> : financeError ? <p className="text-xs text-rose-300">تعذر تحميل الأقساط: {financeError}</p> : contractInstallments.length ? <div className="overflow-x-auto rounded-xl border border-[#294d6d]"><table className="w-full min-w-[620px] text-center text-xs sm:text-sm"><thead className="bg-[#153550] text-[#f6c84a]"><tr>{["م","تاريخ الاستحقاق","قيمة القسط","المحصّل","المتبقي","الحالة"].map(h=><th key={h} className="px-2 py-3">{h}</th>)}</tr></thead><tbody>{contractInstallments.map((row,index) => { const paid=paidInstallment(row.id); const remaining=Math.max(0,Number(row.amount)-paid); return <tr key={row.id} className="border-t border-[#294d6d] text-slate-100"><td className="px-2 py-3">{index+1}</td><td>{contractDate(row.due_date)}</td><td>{formatSAR(Number(row.amount))}</td><td className="text-emerald-300">{formatSAR(paid)}</td><td className="text-rose-300">{formatSAR(remaining)}</td><td>{remaining===0?"مسدد":paid>0?"مسدد جزئيًا":row.due_date<today?"متأخر":"مستحق"}</td></tr>; })}</tbody></table></div> : <p className="rounded-lg border border-[#294d6d] p-3 text-center text-xs text-slate-400">لا توجد أقساط مسجلة لهذا العقد.</p>}</div>
                        {contract.notes && <div><h5 className="mb-2 text-sm font-black text-[#f6c84a]">ملاحظات العقد</h5><p className="whitespace-pre-wrap rounded-xl border border-[#294d6d] bg-[#0a2037] p-3 text-sm leading-7 text-white">{contract.notes}</p></div>}
                      </div>
                    </article>;
                  })}
                </div>
              </>}
            </Section>}
            {activeTab === "المدفوعات" && <Section title="المدفوعات والتحصيلات" icon={Coins}><p className="py-10 text-center text-sm text-gray-400">لم تُربط السجلات المالية الخاصة بهذه الشقة بعد. لا توجد مبالغ افتراضية.</p></Section>}
            {activeTab === "المستندات" && <Section title="مستندات الشقة" icon={Paperclip}><p className="py-10 text-center text-sm text-gray-400">لم يتم ربط مستندات خاصة بهذه الشقة بعد.</p></Section>}
            {activeTab === "الملاحظات" && <Section title="ملاحظات الشقة" icon={MessageSquare}><p className="whitespace-pre-wrap break-words p-2 text-sm leading-7 text-white">{unitDraft.notes || "لا توجد ملاحظات"}</p></Section>}
          </div>
        </main>
        <footer className="flex shrink-0 flex-wrap items-center justify-center gap-3 border-t border-[#294d6d] bg-[#071a2d] px-4 py-3">{ownerError && <span role="alert" className="w-full text-center text-xs text-red-300">{ownerError}</span>}{saveNotice && <span role="status" className="w-full text-center text-xs text-emerald-300">{saveNotice}</span>}<button type="button" onClick={onClose} className="min-w-36 rounded-xl border border-amber-400/50 bg-amber-400/10 px-9 py-3.5 text-lg font-black text-amber-300 hover:bg-amber-400/20">إغلاق</button><button type="button" onClick={() => void saveAll()} disabled={savingAll || savingOwner || ownerLoading || savingField} className="flex min-w-36 items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500 px-9 py-3.5 text-lg font-black text-[#05291f] hover:bg-emerald-400 disabled:opacity-50"><Check size={17}/>{savingAll ? "جارٍ الحفظ..." : "حفظ"}</button></footer>
      </div>
             {detailModal && (() => {
               const item = financialSummaries.find(x => x.key === detailModal)!;
               const range = periods[detailModal] ?? currentMonth();
               const totals = financialTotals(detailModal, range.from, range.to);
               const Icon = item.icon;
               const canExport = !financeLoading && !financeError;
               return <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/90 p-3 backdrop-blur-xl sm:p-6" onMouseDown={e => { if (e.target === e.currentTarget) setDetailModal(null); }}>
                 <div role="dialog" aria-modal="true" aria-label={`تفاصيل ${item.title}`} dir="rtl" className="flex w-full max-w-[1240px] max-h-[90dvh] min-h-[min(560px,85dvh)] flex-col overflow-hidden rounded-[26px] border border-[#d89b18]/70 bg-[#061426] text-white shadow-[0_0_80px_rgba(216,155,24,0.13)]">
                   <header className="shrink-0 border-b border-[#315577] bg-gradient-to-l from-[#102f47] via-[#0b213a] to-[#061426] px-4 py-4 sm:px-7 sm:py-5">
                     <div className="flex flex-wrap items-center justify-between gap-4">
                       <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl border border-[#d89b18]/40 bg-[#d89b18]/10"><Icon size={27} style={{color:item.color}}/></span><div><h3 className="text-xl font-black text-[#f6c84a] sm:text-2xl">{item.title}</h3><p className="mt-1 text-sm font-semibold text-slate-300 sm:text-base">الشقة {editedUnit.apartment_number} — {editedUnit.building_name || "شقة سكنية"}</p><p className="mt-1 text-sm text-slate-400">الفترة: {range.from} إلى {range.to}</p></div></div>
                       <div className="flex flex-wrap items-center gap-2">
                         <button type="button" onClick={() => setDetailModal(null)} aria-label="إغلاق التفاصيل" className="grid h-11 w-11 place-items-center rounded-xl border border-white/20 bg-white/5 text-white hover:bg-white/10"><X size={23}/></button>
                       </div>
                     </div>
                   </header>
                   <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                     <div className={`mb-5 grid gap-3 ${detailModal === "late" || detailModal === "collections" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-3"}`}>
                       {([{label:detailModal === "late" ? "إجمالي المتأخرات غير المسددة" : "الإجمالي",value:totals.total,color:item.color},...(detailModal === "late" || detailModal === "collections" ? [] : [{label:"المحصّل",value:totals.collected,color:"#86efac"},{label:"المتبقي",value:totals.remaining,color:"#fda4af"}])]).map(box => <div key={box.label} className="rounded-2xl border border-[#315577] bg-[#102a42] px-5 py-5 text-center"><p className="text-base font-bold text-slate-200">{box.label}</p><strong className="mt-2 block text-2xl font-black sm:text-3xl" style={{color:box.color}}>{formatSAR(box.value)} <span className="text-base">ريال</span></strong></div>)}
                     </div>
                     <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h4 className="text-lg font-black text-[#f6c84a] sm:text-xl">سجل العمليات المالية</h4><span className="rounded-lg border border-[#315577] bg-[#102239] px-3 py-2 text-sm font-bold text-slate-300">عدد العمليات: {totals.rows.length}</span></div>
                     {financeError ? <p role="alert" className="rounded-xl border border-rose-400/40 p-6 text-center text-base text-rose-300">{financeError}</p> : financeLoading ? <p className="p-8 text-center text-base text-slate-300">جارٍ تحميل البيانات...</p> : totals.rows.length === 0 ? <p className="rounded-xl border border-[#315577] p-12 text-center text-base text-slate-300">لا توجد عمليات خلال الفترة المحددة.</p> : <div className="overflow-x-auto rounded-xl border border-[#315577]"><table className="w-full min-w-[940px] border-collapse text-center text-sm sm:text-base"><thead className="bg-[#14314d] text-amber-300"><tr>{["البيان","تاريخ العملية","الاستحقاق","الإجمالي","المحصّل",...(detailModal === "collections" ? [] : ["المتبقي"]),"الحالة"].map(h=><th key={h} className="whitespace-nowrap border-b border-[#315577] px-4 py-4 text-sm font-black sm:text-base">{h}</th>)}</tr></thead><tbody>{totals.rows.map(row=><tr key={row.id} className="border-b border-[#24425e] bg-[#081b30] hover:bg-[#12314b]"><td className="px-4 py-4 font-semibold text-white">{row.title}</td><td className="whitespace-nowrap px-4 py-4">{row.date}</td><td className="whitespace-nowrap px-4 py-4">{row.due}</td><td className="whitespace-nowrap px-4 py-4 font-bold">{formatSAR(row.total)}</td><td className="whitespace-nowrap px-4 py-4 font-bold text-emerald-300">{formatSAR(row.collected)}</td>{detailModal !== "collections" && <td className="whitespace-nowrap px-4 py-4 font-bold text-rose-300">{formatSAR(row.remaining)}</td>}<td className="whitespace-nowrap px-4 py-4 font-bold text-amber-200">{row.status}</td></tr>)}</tbody></table></div>}
                   </div>
                   <footer className="shrink-0 border-t border-[#315577] bg-[#081b30] p-3 sm:p-4">
                     <div className="grid grid-cols-3 gap-2 sm:gap-3">
                       <button type="button" disabled={!canExport} onClick={() => exportFinancialExcel(item.title, range, totals.rows, totals)} title="تصدير ملف CSV متوافق مع Excel" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-500/15 px-2 text-sm font-black text-emerald-200 transition hover:bg-emerald-500/25 disabled:opacity-40 sm:text-base"><FileSpreadsheet size={19}/> تصدير Excel</button>
                       <button type="button" disabled={!canExport} onClick={() => printFinancialReport(item.title, range, totals.rows, totals, "pdf")} title="فتح نافذة الطباعة واختيار حفظ بتنسيق PDF" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-rose-400/50 bg-rose-500/15 px-2 text-sm font-black text-rose-200 transition hover:bg-rose-500/25 disabled:opacity-40 sm:text-base"><FileDown size={19}/> حفظ PDF</button>
                       <button type="button" disabled={!canExport} onClick={() => printFinancialReport(item.title, range, totals.rows, totals, "print")} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-sky-400/50 bg-sky-500/15 px-2 text-sm font-black text-sky-200 transition hover:bg-sky-500/25 disabled:opacity-40 sm:text-base"><Printer size={19}/> طباعة</button>
                     </div>
                     <button type="button" onClick={() => setDetailModal(null)} className="mx-auto mt-3 block min-w-40 rounded-xl border border-amber-400/50 bg-amber-400/10 px-8 py-2 text-base font-black text-amber-300 hover:bg-amber-400/20">إغلاق</button>
                   </footer>
                 </div>
               </div>;
             })()}
             {financialModal && (() => {
         const isCollection = financialModal === "collectCharge";
         const title = isCollection ? "تحصيل فاتورة أو إيجار" : "إضافة فاتورة أو مستحقات";
         const accent = isCollection ? "#f6c84a" : "#67e8f9";
         const inputClass = "mt-1.5 block h-11 w-full min-w-0 rounded-xl border border-sky-400/25 bg-[#0a2036] px-3 text-center text-sm font-semibold text-white outline-none focus:border-cyan-300";
         return <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-3 backdrop-blur-xl sm:p-5" onMouseDown={event => { if (event.target === event.currentTarget) setFinancialModal(null); }}>
           <div dir="rtl" role="dialog" aria-modal="true" aria-label={title} className="relative flex w-full flex-col overflow-hidden rounded-[28px] border bg-[#061426] text-white shadow-[0_0_100px_rgba(0,0,0,.6)]" style={{width:"min(1120px, calc(100vw - 32px))",maxWidth:"1120px",maxHeight:"min(800px, calc(100dvh - 32px))",borderColor:`${accent}88`,boxSizing:"border-box"}}>
             <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[2px]" style={{background:`linear-gradient(90deg,transparent,${accent},transparent)`}}/>
             <header className="relative shrink-0 border-b border-white/10 bg-gradient-to-r from-[#050d18] via-[#09213a] to-[#061426] px-5 py-4 sm:px-7">
               <div className="flex items-center justify-center gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border bg-white/5" style={{color:accent,borderColor:`${accent}66`}}>{isCollection?<Banknote size={30}/>:<ReceiptText size={30}/>}</span><div className="min-w-0 text-center"><h2 className="text-xl font-black sm:text-2xl lg:text-3xl" style={{color:accent}}>{title}</h2><p className="mt-1 text-xs font-semibold text-slate-400 sm:text-sm">تسجيل العملية للشقة المحددة</p></div><button type="button" onClick={()=>setFinancialModal(null)} aria-label="إغلاق" className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-rose-500/20"><X size={22}/></button></div>
             </header>
             <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
               <div className="mb-4 rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-2.5 text-center text-xs font-semibold leading-5 text-amber-200">الشقة المحددة: {editedUnit.apartment_number} — {editedUnit.building_name || "شقة سكنية"} — لا يمكن تغييرها من هذه العملية.</div>
               <div className="grid min-h-0 grid-cols-1 gap-5 lg:grid-cols-[1fr_1.1fr]">
                 <section className="flex min-h-[330px] min-w-0 flex-col rounded-3xl border border-cyan-400/25 bg-[#081c31]/85 p-4 sm:p-5">
                   <div className="mb-4 text-center"><h3 className="text-xl font-black text-white">اختيار الشقق <span className="text-sm text-cyan-300">(1 محددة)</span></h3><p className="mt-1 text-xs text-slate-400">الشقة مفتوحة من نافذة تفاصيلها ومحددة تلقائيًا</p></div>
                   <div className="mb-3 grid grid-cols-2 gap-2"><div className="rounded-lg border border-white/10 bg-[#0b2137] p-2 text-center text-xs">{editedUnit.apartment_type || "نوع غير محدد"}</div><div className="rounded-lg border border-white/10 bg-[#0b2137] p-2 text-center text-xs">{status}</div></div>
                   <div className="flex items-center justify-between gap-3 rounded-xl border border-cyan-300/50 bg-[#0c2138] px-3 py-3"><span className="min-w-0"><strong className="block text-sm">شقة {editedUnit.apartment_number}</strong><small className="block truncate text-xs text-slate-400">{editedUnit.apartment_type || "غير محدد"} · {status}</small></span><input type="checkbox" checked readOnly disabled aria-label="الشقة محددة تلقائيًا" className="h-5 w-5 shrink-0 accent-cyan-400"/></div>
                   <div className="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-300/5 px-3 py-2 text-center text-xs font-bold text-cyan-200">تم اختيار شقة واحدة — لا يمكن تغيير التحديد</div>
                 </section>
                 <section className="min-w-0 rounded-3xl border border-cyan-400/25 bg-[#081c31]/85 p-4 sm:p-5"><div className="mb-4 text-center"><h3 className="text-xl font-black text-white">بيانات المستحق</h3><p className="mt-1 text-xs text-slate-400">تُطبق البيانات على الشقة المحددة فقط</p></div>
                   <div className="space-y-3">
                     <label className="block text-center text-sm font-bold">نوع المستحق<select value={operationType} onChange={e=>{setOperationType(e.target.value);setSelectedChargeId("");setSelectedInstallmentId("");setOperationAmount("");}} className={inputClass}>{(isCollection ? ["إيجار","كهرباء","مياه","صيانة","مستحقات أخرى"] : ["كهرباء","مياه","صيانة","مستحقات أخرى"]).map(v=><option key={v}>{v}</option>)}</select></label>
                     {isCollection && operationType === "إيجار" && <label className="block text-center text-sm font-bold">قسط الإيجار المطلوب تحصيله<select value={selectedInstallmentId} onChange={e=>{setSelectedInstallmentId(e.target.value);setOperationAmount("");}} className={inputClass}><option value="">اختر قسط إيجار غير مسدد</option>{availableInstallments.map(i=><option key={i.id} value={i.id}>استحقاق {i.due_date.split("-").reverse().join("/")} — المتبقي {formatSAR(Math.max(0,Number(i.amount)-paidOnInstallment(i.id)))} ريال</option>)}</select>{!financeLoading && !financeError && !availableInstallments.length && <span className="mt-2 block text-xs text-amber-300">لا توجد أقساط إيجار غير مسددة مسجلة لهذه الشقة.</span>}{selectedInstallment && <span className="mt-2 block text-xs text-emerald-300">قيمة القسط: {formatSAR(Number(selectedInstallment.amount))} ريال — المحصّل: {formatSAR(paidOnInstallment(selectedInstallment.id))} ريال — المتبقي: {formatSAR(Math.max(0,Number(selectedInstallment.amount)-paidOnInstallment(selectedInstallment.id)))} ريال</span>}</label>}
                     {isCollection && operationType !== "إيجار" && <label className="block text-center text-sm font-bold">الفاتورة المطلوب تحصيلها<select value={selectedChargeId} onChange={e=>{setSelectedChargeId(e.target.value);setOperationAmount("");}} className={inputClass}><option value="">اختر فاتورة غير مسددة</option>{charges.filter(c=>Number(c.amount)-paidOnCharge(c.id)>0 && (operationType==="مياه"?c.charge_type==="water":operationType==="كهرباء"?c.charge_type==="electricity":["other","maintenance"].includes(c.charge_type))).map(c=><option key={c.id} value={c.id}>{c.title} — المتبقي {formatSAR(Number(c.amount)-paidOnCharge(c.id))} ريال</option>)}</select></label>}
                     {!isCollection && <label className="block text-center text-sm font-bold">تاريخ الاستحقاق<input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className={inputClass}/></label>}
                     <label className="block text-center text-sm font-bold">المبلغ لكل شقة (ريال)<input type="number" min="0" value={operationAmount} onChange={e=>setOperationAmount(e.target.value)} placeholder="اكتب المبلغ" className={inputClass}/></label>
                     {!(isCollection && operationType === "إيجار") && <label className="block text-center text-sm font-bold">المستحق عن شهر / أشهر<input type="month" value={operationMonth} onChange={e=>setOperationMonth(e.target.value)} className={inputClass}/></label>}
                     {isCollection && <label className="block text-center text-sm font-bold">طريقة التحصيل <span className="text-rose-300">*</span><select required value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)} className={inputClass}><option value="">اختر طريقة التحصيل</option>{["نقدي","تحويل بنكي","شبكة","شيك"].map(method=><option key={method} value={method}>{method}</option>)}</select></label>}
                     <label className="block text-center text-sm font-bold">تاريخ {isCollection?"التحصيل":"الإدخال"}<input type="date" value={operationDate} onChange={e=>setOperationDate(e.target.value)} className={inputClass}/></label>
                     <label className="block text-center text-sm font-bold">ملاحظات<textarea rows={3} value={operationNotes} onChange={e=>setOperationNotes(e.target.value)} placeholder="اكتب أي ملاحظات إضافية..." className="mt-1.5 block w-full resize-y rounded-xl border border-sky-400/25 bg-[#0a2036] p-3 text-center text-sm text-white outline-none focus:border-cyan-300"/></label>
                     <div className="overflow-hidden rounded-xl border border-cyan-300/20 bg-[#071b2b]"><div className="flex items-center justify-between px-3 py-2 text-xs"><span>عدد الشقق المحددة</span><strong className="text-cyan-300">1</strong></div><div className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-xs"><span>إجمالي العملية</span><strong className="text-cyan-300">{operationAmount && Number.isFinite(Number(operationAmount)) ? Number(operationAmount).toLocaleString("ar-SA") : "—"} ريال</strong></div></div>
                   </div>
                 </section>
               </div>
             </main>
             <footer className="grid shrink-0 grid-cols-2 gap-3 border-t border-white/10 bg-[#07172a] p-3 sm:px-5"><button type="button" onClick={()=>setFinancialModal(null)} className="min-h-12 rounded-xl border border-white/15 bg-white/5 text-base font-black text-slate-200 transition hover:bg-white/10">✕ إغلاق</button><button type="button" onClick={()=>void saveFinancialOperation()} disabled={operationSaving} className="min-h-12 rounded-xl bg-gradient-to-l from-cyan-600 to-blue-600 text-base font-black text-white disabled:opacity-55">{operationSaving?"جارٍ الحفظ...":"✓ حفظ العملية"}</button>{operationError && <p role="alert" className="col-span-2 text-center text-xs text-red-300">{operationError}</p>}</footer>
           </div>
         </div>;
       })()}
    </div>
  );
}
