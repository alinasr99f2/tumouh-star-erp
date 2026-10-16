import { useEffect, useMemo, useState } from "react";
import ExcelJS from "exceljs";
import { FileSpreadsheet, X, Upload, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { supabase } from "../../utils/supabase";

type Lookup = { id: number; name: string; stage_id?: number | null };
type Mapping = { id: number; sheet: string; nameCol: string; amountCol: string; startRow: number; endRow: string; title: string; enabled: boolean; quantityCol: string; specificationCol: string };
type Row = { key: string; sheet: string; rowNumber: number; name: string; amount: number; unitId: string; quantity: string; specification: string; categoryId: string; date: string; included: boolean; error?: string };
type Props = { projectId: number; projectName: string; accounts: Lookup[]; categories: Lookup[]; onClose: () => void; onImported: () => Promise<void> | void };
const money = (n: number) => n.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const valueText = (v: ExcelJS.CellValue): string => {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("text" in v) return String(v.text ?? "");
    if ("richText" in v) return v.richText.map((p) => p.text).join("");
    if ("result" in v) return String(v.result ?? "");
    return "";
  }
  return String(v);
};
// Accept genuine numeric Excel cells and unambiguous numeric text only.
// A malformed value such as "50,358,5" must never become 503585.
const amountOf = (v: ExcelJS.CellValue): number | null => {
  const raw = valueText(v).trim().replace(/[\s\u00a0\u202f]/g, "")
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)))
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)));
  if (!raw) return null;
  // Standard thousands separators are allowed; irregular comma groups are rejected.
  const standard = /^-?\d+(?:\.\d+)?$/;
  const thousands = /^-?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/;
  const arabicThousands = /^-?\d{1,3}(?:٬\d{3})+(?:٫\d+)?$/;
  const arabicDecimal = /^-?\d+(?:٫\d+)?$/;
  if (!(standard.test(raw) || thousands.test(raw) || arabicThousands.test(raw) || arabicDecimal.test(raw))) return null;
  const n = Number(raw.replace(/[,٬]/g, "").replace(/٫/g, "."));
  return Number.isFinite(n) ? n : null;
};

// Split Excel values such as "148 M" into numeric quantity and its unit label.
const quantityParts = (value: string): { quantity: string; unit: string } => {
  const clean = value.trim().replace(/[٠-٩]/g, (ch) => String("٠١٢٣٤٥٦٧٨٩".indexOf(ch)));
  const match = clean.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/);
  if (!match) return { quantity: "", unit: clean };
  return { quantity: match[1].replace(",", "."), unit: match[2].trim() };
};
const columnNumber = (s: string) => { const t = s.trim().toUpperCase(); if (!/^[A-Z]{1,3}$/.test(t)) return 0; return [...t].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0); };
const columnName = (index: number) => { let n = index, s = ""; while (n > 0) { n--; s = String.fromCharCode(65 + n % 26) + s; n = Math.floor(n / 26); } return s; };
const hashFile = async (buffer: ArrayBuffer) => { const digest = await crypto.subtle.digest("SHA-256", buffer); return Array.from(new Uint8Array(digest)).map((x) => x.toString(16).padStart(2, "0")).join(""); };
// Detect a contiguous expense block without relying on the workbook filename.
const detectExpenseBlock = (sheet: ExcelJS.Worksheet): Omit<Mapping, "id" | "sheet" | "enabled" | "quantityCol" | "specificationCol"> => {
  const headerRow = Math.min(2, sheet.rowCount);
  const candidates: { nameCol: number; amountCol: number; startRow: number; endRow: number; score: number; title: string }[] = [];
  for (let nameCol = 1; nameCol <= Math.min(sheet.columnCount || 20, 80); nameCol++) {
    for (let amountCol = nameCol + 1; amountCol <= Math.min(nameCol + 4, sheet.columnCount || 20, 80); amountCol++) {
      for (let startRow = 2; startRow <= Math.min(sheet.rowCount, 12); startRow++) {
        let endRow = startRow - 1;
        let count = 0;
        for (let r = startRow; r <= sheet.rowCount; r++) {
          const name = valueText(sheet.getRow(r).getCell(nameCol).value).trim();
          const amount = amountOf(sheet.getRow(r).getCell(amountCol).value);
          if (!name || amount === null || amount <= 0) break;
          count++;
          endRow = r;
        }
        if (count < 2) continue;
        const header = valueText(sheet.getRow(startRow - 1).getCell(amountCol).value).trim();
        const groupTitle = valueText(sheet.getRow(startRow - 1).getCell(nameCol).value).trim();
        const headerScore = /مدفوعات|مصروفات|مباشرة|expenses/i.test(header + " " + groupTitle) ? 100000 : 0;
        const score = headerScore - nameCol * 100 - amountCol * 10 + count - startRow;
        candidates.push({ nameCol, amountCol, startRow, endRow, score, title: groupTitle || header || "مصروفات" });
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  return best
    ? { nameCol: columnName(best.nameCol), amountCol: columnName(best.amountCol), startRow: best.startRow, endRow: String(best.endRow), title: best.title }
    : { nameCol: "A", amountCol: "C", startRow: 3, endRow: "", title: "مجموعة مصروفات" };
};
const inputClass = "w-full rounded-lg border border-white/20 bg-[#0A4537] px-3 py-2 text-sm text-white outline-none focus:border-yellow-400";

export default function ExpenseExcelImport({ projectId, projectName, accounts, categories, onClose, onImported }: Props) {
  const personal = accounts.find((a) => /الحساب\s*الشخصي/.test(a.name));
  const [accountId, setAccountId] = useState(String(personal?.id ?? ""));
  const [categoryId, setCategoryId] = useState("");
  const [bulkUnitId, setBulkUnitId] = useState("");
  const [date, setDate] = useState(today());
  const [workbook, setWorkbook] = useState<ExcelJS.Workbook | null>(null);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [units, setUnits] = useState<Lookup[]>([]);
  const [fileName, setFileName] = useState("");
  const [fileHash, setFileHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [previewReady, setPreviewReady] = useState(false);
  const [previewWarnings, setPreviewWarnings] = useState<string[]>([]);
  const selected = useMemo(() => rows.filter((r) => r.included), [rows]);
  const total = useMemo(() => selected.reduce((sum, r) => sum + r.amount, 0), [selected]);
  const invalid = selected.filter((r) => !!r.error || !r.name.trim() || !Number.isFinite(r.amount) || r.amount <= 0 || (r.quantity.trim() !== "" && (!Number.isFinite(Number(r.quantity)) || Number(r.quantity) <= 0)) || !(r.categoryId || categoryId) || !/^\d{4}-\d{2}-\d{2}$/.test(r.date));
  const sheets = workbook?.worksheets ?? [];
  const updateMapping = (id: number, patch: Partial<Mapping>) => { setMappings((p) => p.map((m) => m.id === id ? { ...m, ...patch } : m)); setPreviewReady(false); };
  const changeRow = (key: string, patch: Partial<Row>) => setRows((p) => p.map((r) => r.key === key ? { ...r, ...patch } : r));
  const addMapping = () => { setMappings((p) => [...p, { id: Math.max(0, ...p.map((m) => m.id)) + 1, sheet: sheets[0]?.name ?? "", ...detectExpenseBlock(sheets[0]), title: `مجموعة ${p.length + 1}`, enabled: true, quantityCol: "", specificationCol: "" }]); setPreviewReady(false); };
  // Units are optional and are loaded from the same master list as the expense form.
  useEffect(() => {
    let active = true;
    supabase.from("expense_units").select("id, name").order("name").then(({ data, error }) => {
      if (active) { if (error) setMessage(`تعذر تحميل الوحدات: ${error.message}`); else setUnits(data ?? []); }
    });
    return () => { active = false; };
  }, []);
  const readFile = async (file?: File) => {
    if (!file) return;
    setLoading(true); setMessage(""); setRows([]); setWorkbook(null); setMappings([]); setPreviewReady(false); setPreviewWarnings([]); setFileHash(""); setFileName(file.name);
    try {
      if (!/\.xlsx$/i.test(file.name)) throw new Error("اختر ملف Excel بصيغة xlsx.");
      const buffer = await file.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);
      if (!wb.worksheets.length) throw new Error("ملف Excel لا يحتوي على أوراق عمل.");
      setWorkbook(wb);
      setFileHash(await hashFile(buffer));
      const first = wb.worksheets[0];
      setMappings([{ id: 1, sheet: first.name, ...detectExpenseBlock(first), enabled: true, quantityCol: "", specificationCol: "" }]);
      setMessage("تم فتح الملف. حدد ورقة العمل وعمود الاسم وعمود المبلغ ونطاق الصفوف لكل مجموعة، ثم اضغط «معاينة المصروفات». اسم الملف لا يؤثر على القراءة.");
    } catch (err: any) { setMessage(err?.message ?? "تعذر قراءة الملف"); }
    finally { setLoading(false); }
  };
  const preview = () => {
    if (!workbook) return;
    const found: Row[] = [];
    const seen = new Set<string>();
    const warnings: string[] = [];
    const groupSummaries: string[] = [];
    let badMappings = 0;
    for (const m of mappings.filter((x) => x.enabled)) {
      let groupCount = 0;
      let groupTotal = 0;
      const sheet = workbook.getWorksheet(m.sheet);
      const nameColumn = columnNumber(m.nameCol), amountColumn = columnNumber(m.amountCol);
      const quantityColumn = m.quantityCol ? columnNumber(m.quantityCol) : 0;
      const specificationColumn = m.specificationCol ? columnNumber(m.specificationCol) : 0;
      const end = m.endRow.trim() ? Number(m.endRow) : (sheet?.rowCount ?? 0);
      if (!sheet || !nameColumn || !amountColumn || nameColumn === amountColumn || !Number.isInteger(m.startRow) || m.startRow < 1 || !Number.isInteger(end) || end < m.startRow) { badMappings++; continue; }
      for (let n = m.startRow; n <= Math.min(end, sheet.rowCount); n++) {
        const row = sheet.getRow(n);
        const name = valueText(row.getCell(nameColumn).value).trim();
        const amount = amountOf(row.getCell(amountColumn).value);
        // Blank rows, headings and section totals are not expenses.
        if (!name || /^(?:الإجمالي|اجمالي|المجموع|total|مدفوعات من الحساب الشخصي|مدفوعات مباشرة|قيمة تغذية الحساب الشخصي)\s*[:：-]?$/i.test(name)) continue;
        const key = `${sheet.name}:${n}:${nameColumn}:${amountColumn}`;
        if (seen.has(key)) continue; // The same Excel row cannot be imported twice from overlapping mappings.
        seen.add(key);
        if (amount === null && !valueText(row.getCell(amountColumn).value).trim()) continue;
        if (amount !== null && amount > 0) { groupCount++; groupTotal += amount; }
        if (amount === null) warnings.push(`الصف ${n} في «${sheet.name}»: قيمة المبلغ «${valueText(row.getCell(amountColumn).value)}» غير صحيحة؛ تم استبعادها من الإجمالي حتى تصحيحها.`);
        const rawQuantity = quantityColumn ? valueText(row.getCell(quantityColumn).value) : "";
        const parsedQuantity = quantityParts(rawQuantity);
        const rawSpecification = specificationColumn ? valueText(row.getCell(specificationColumn).value).trim() : "";
        const matchedUnit = units.find((u) => u.name.trim().toLocaleLowerCase() === parsedQuantity.unit.toLocaleLowerCase());
        found.push({ key, sheet: sheet.name, rowNumber: n, name, amount: amount ?? 0, unitId: bulkUnitId || (matchedUnit ? String(matchedUnit.id) : ""), quantity: parsedQuantity.quantity, specification: rawSpecification, categoryId: "", date, included: amount !== null && amount > 0, error: amount === null ? "المبلغ غير صالح في Excel؛ راجع الخلية الأصلية" : undefined });
      }
      groupSummaries.push(`${m.title}: ${groupCount} مصروف — ${money(groupTotal)} ريال (الأعمدة ${m.nameCol.toUpperCase()}/${m.amountCol.toUpperCase()}، الصفوف ${m.startRow}–${Math.min(end, sheet.rowCount)})`);
      if (m.endRow.trim() === "") warnings.push(`المجموعة «${m.title}» بلا صف نهاية محدد؛ راجع نطاق الصفوف قبل الحفظ.`);
    }
    setPreviewWarnings([...groupSummaries, ...warnings]);
    setRows(found);
    setPreviewReady(true);
    setMessage(badMappings ? `يوجد ${badMappings} مجموعة بإعدادات أعمدة أو صفوف غير صحيحة. صححها وأعد المعاينة.` : found.length ? `تمت معاينة ${found.length} صف. راجع البيانات وحدد المطلوب قبل الحفظ. لن يُخصم أي مبلغ حتى تؤكد الاستيراد.` : "لم يتم العثور على مصروفات. تأكد من أعمدة الاسم والمبلغ وبداية ونهاية الصفوف.");
  };
  const save = async () => {
    if (!previewReady || !fileHash) { setMessage("اعمل معاينة للبيانات أولًا."); return; }
    if (!accountId || !accounts.some((a) => String(a.id) === accountId)) { setMessage("اختر عهدة صحيحة."); return; }
    if (previewWarnings.some((w) => w.includes("بلا صف نهاية"))) { setMessage("حدد صف النهاية لكل مجموعة حتى لا تدخل مصروفات من أقسام أخرى بالخطأ."); return; }
    if (!selected.length || invalid.length) { setMessage(`راجع الصفوف: يوجد ${invalid.length} صف غير صالح أو بدون تصنيف.`); return; }
    if (!window.confirm(`تأكيد استيراد ${selected.length} مصروف إلى «${projectName}»؟\nالعهدة: ${accounts.find((a) => String(a.id) === accountId)?.name}\nالإجمالي: ${money(total)} ريال\nسيتم خصم الإجمالي من العهدة بواسطة قاعدة البيانات مرة واحدة.`)) return;
    setSaving(true); setMessage("");
    try {
      const payload = selected.map((r) => ({ name: r.name.trim(), amount: r.amount, date: r.date, category_id: Number(r.categoryId || categoryId), unit_id: r.unitId ? Number(r.unitId) : null, quantity: r.quantity.trim() ? Number(r.quantity) : null, specification: r.specification.trim() || null, source_row: r.rowNumber, source_sheet: r.sheet, source_key: r.key }));
      // Send the original workbook fingerprint and exact Excel row locations.
      // Supabase now blocks only previously imported rows, not the entire workbook.
      const { data, error } = await supabase.rpc("import_project_expenses_excel", { p_project_id: projectId, p_account_id: Number(accountId), p_file_hash: fileHash, p_file_name: fileName, p_rows: payload });
      if (error) throw error;
      setMessage(`تم استيراد ${data?.imported_count ?? selected.length} مصروف بنجاح.`);
      await onImported();
      onClose();
    } catch (err: any) { setMessage(`فشل الاستيراد: ${err?.message ?? "خطأ غير معروف"}`); }
    finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3" dir="rtl">
    <div className="flex max-h-[96vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-emerald-400/20 bg-[#062E26] text-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0A4537] px-5 py-3"><h2 className="flex items-center gap-2 text-lg font-extrabold"><FileSpreadsheet className="text-yellow-400" /> استيراد مصروفات Excel المرن — {projectName}</h2><button onClick={onClose} disabled={saving} className="rounded-lg p-2 hover:bg-white/10" aria-label="إغلاق"><X /></button></div>
      <div className="space-y-4 overflow-y-auto p-4">
        <p className="text-xs text-emerald-100/80">اختر أي ملف xlsx مهما كان اسمه. لكل مجموعة حدد الورقة، عمود اسم المصروف، عمود المبلغ، وأرقام الصفوف. لا تحدد أعمدة تغذية العهدة كمصروفات.</p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <label className="space-y-1 text-sm">ملف Excel (.xlsx)<span className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-yellow-400/50 bg-white/5 px-3 py-2"><Upload size={17}/><span className="truncate">{fileName || "اختيار ملف"}</span></span><input type="file" accept=".xlsx" disabled={saving || loading} onChange={(e) => readFile(e.target.files?.[0])} className="sr-only" /></label>
          <label className="space-y-1 text-sm">العهدة لكل المصروفات المختارة<select value={accountId} onChange={(e) => setAccountId(e.target.value)} disabled={saving} className={inputClass}><option value="">اختر العهدة</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
          <label className="space-y-1 text-sm">التصنيف الموحد<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={saving} className={inputClass}><option value="">اختر التصنيف</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="space-y-1 text-sm">الوحدة (الموحدة للكل)<select value={bulkUnitId} onChange={(e) => { const value = e.target.value; setBulkUnitId(value); setRows((previous) => previous.map((row) => ({ ...row, unitId: value }))); }} disabled={saving} className={inputClass}><option value="">بدون وحدة — تطبيق على الكل</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
          <label className="space-y-1 text-sm">التاريخ الافتراضي<input type="date" value={date} onChange={(e) => { setDate(e.target.value); setRows((p) => p.map((r) => ({ ...r, date: e.target.value }))); }} disabled={saving} className={inputClass}/></label>
        </div>
        {workbook && <section className="space-y-2 rounded-xl border border-emerald-400/20 bg-[#083A30] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-yellow-300">تحديد مجموعات الأعمدة المراد استيرادها</h3><button onClick={addMapping} disabled={saving} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold"><Plus size={16}/> إضافة مجموعة أعمدة</button></div>
          {mappings.map((m) => { const sheet = workbook.getWorksheet(m.sheet); const cols = Array.from({ length: Math.min(Math.max(sheet?.columnCount ?? 20, 20), 150) }, (_, i) => ({ value: columnName(i + 1), label: `${columnName(i + 1)}${sheet ? ` — ${valueText(sheet.getRow(1).getCell(i + 1).value).slice(0, 25)}` : ""}` })); return <div key={m.id} className="grid items-end gap-2 rounded-lg border border-white/10 bg-white/5 p-3 md:grid-cols-12">
            <label className="flex items-center gap-2 text-xs md:col-span-1"><input type="checkbox" checked={m.enabled} onChange={(e) => updateMapping(m.id, { enabled: e.target.checked })}/> تفعيل</label>
            <label className="space-y-1 text-xs md:col-span-2">اسم المجموعة<input className={inputClass} value={m.title} onChange={(e) => updateMapping(m.id, { title: e.target.value })}/></label>
            <label className="space-y-1 text-xs md:col-span-2">ورقة العمل<select className={inputClass} value={m.sheet} onChange={(e) => updateMapping(m.id, { sheet: e.target.value })}>{sheets.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}</select></label>
            <label className="space-y-1 text-xs md:col-span-2">عمود اسم المصروف<select className={inputClass} value={m.nameCol.toUpperCase()} onChange={(e) => updateMapping(m.id, { nameCol: e.target.value })}>{cols.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
            <label className="space-y-1 text-xs md:col-span-2">عمود المبلغ<select className={inputClass} value={m.amountCol.toUpperCase()} onChange={(e) => updateMapping(m.id, { amountCol: e.target.value })}>{cols.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
            <label className="space-y-1 text-xs md:col-span-2">عمود الكمية (اختياري)<select className={inputClass} value={m.quantityCol} onChange={(e) => updateMapping(m.id, { quantityCol: e.target.value })}><option value="">بدون</option>{cols.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
            <label className="space-y-1 text-xs md:col-span-2">عمود المواصفة (اختياري)<select className={inputClass} value={m.specificationCol} onChange={(e) => updateMapping(m.id, { specificationCol: e.target.value })}><option value="">بدون</option>{cols.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
            <label className="space-y-1 text-xs md:col-span-1">من صف<input type="number" min={1} className={inputClass} value={m.startRow} onChange={(e) => updateMapping(m.id, { startRow: Number(e.target.value) })}/></label>
            <label className="space-y-1 text-xs md:col-span-1">إلى صف<input type="number" min={1} placeholder="الآخر" className={inputClass} value={m.endRow} onChange={(e) => updateMapping(m.id, { endRow: e.target.value })}/></label>
            <button title="حذف المجموعة" onClick={() => { setMappings((p) => p.filter((x) => x.id !== m.id)); setPreviewReady(false); }} className="flex justify-center rounded-lg bg-red-500/20 p-2 text-red-300"><Trash2 size={18}/></button>
          </div>; })}
          <button disabled={loading || saving || !mappings.some((m) => m.enabled)} onClick={preview} className="rounded-xl bg-yellow-400 px-5 py-2 font-extrabold text-[#062E26] disabled:opacity-40">معاينة المصروفات من الأعمدة المحددة</button>
        </section>}
        {loading && <p>جارٍ قراءة ملف Excel...</p>}
        {message && <p className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200"><AlertTriangle size={18} className="shrink-0"/>{message}</p>}
        {previewReady && previewWarnings.length > 0 && <div className="space-y-1 rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-3 text-xs text-yellow-100">{previewWarnings.map((w, i) => <p key={i}>{w}</p>)}</div>}
        {previewReady && <><div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/5 p-3 text-sm"><span><strong>المحدد: {selected.length} / {rows.length}</strong> | <strong>الإجمالي: {money(total)} ريال</strong> {invalid.length > 0 && <span className="text-amber-300">| تحتاج مراجعة: {invalid.length}</span>}</span><div className="flex gap-3"><button className="text-yellow-300 underline" onClick={() => setRows((p) => p.map((r) => ({ ...r, included: true })))}>تحديد الكل</button><button className="text-yellow-300 underline" onClick={() => setRows((p) => p.map((r) => ({ ...r, included: false })))}>إلغاء الكل</button></div></div>
          <div className="max-h-[39vh] overflow-auto rounded-xl border border-white/10"><table className="w-full min-w-[1450px] text-right text-sm"><thead className="sticky top-0 z-10 bg-[#0A4537]"><tr>{["إضافة", "الورقة", "صف Excel", "اسم المصروف / البند", "المبلغ", "الوحدة (اختياري)", "الكمية (اختياري)", "المواصفة (اختياري)", "التصنيف", "التاريخ"].map((h) => <th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{rows.map((r) => <tr key={r.key} className={`border-t border-white/10 ${r.included && (!r.name.trim() || r.amount <= 0 || !(r.categoryId || categoryId)) ? "bg-amber-500/10" : ""}`}><td className="p-2"><input type="checkbox" checked={r.included} disabled={saving} onChange={(e) => changeRow(r.key, { included: e.target.checked })}/></td><td className="p-2">{r.sheet}</td><td className="p-2">{r.rowNumber}</td><td className="p-2"><input value={r.name} disabled={saving} onChange={(e) => changeRow(r.key, { name: e.target.value })} className="w-full min-w-48 rounded-lg bg-white/10 p-2"/></td><td className="p-2"><input type="number" title={r.error || ""} step="0.01" min="0.01" value={r.amount} disabled={saving} onChange={(e) => changeRow(r.key, { amount: Number(e.target.value), error: undefined })} className="w-28 rounded-lg bg-white/10 p-2"/></td><td className="p-2"><select value={r.unitId} disabled={saving} onChange={(e) => changeRow(r.key, { unitId: e.target.value })} className="w-36 rounded-lg bg-[#0A4537] p-2"><option value="">بدون وحدة</option>{units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></td><td className="p-2"><input type="number" step="any" min="0" placeholder="اختياري" value={r.quantity} disabled={saving} onChange={(e) => changeRow(r.key, { quantity: e.target.value })} className="w-24 rounded-lg bg-white/10 p-2"/></td><td className="p-2"><input value={r.specification} placeholder="مثال: 5 BAG" disabled={saving} onChange={(e) => changeRow(r.key, { specification: e.target.value })} className="w-32 rounded-lg bg-white/10 p-2"/></td><td className="p-2"><select value={r.categoryId} disabled={saving} onChange={(e) => changeRow(r.key, { categoryId: e.target.value })} className="w-44 rounded-lg bg-[#0A4537] p-2"><option value="">التصنيف الموحد</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></td><td className="p-2"><input type="date" value={r.date} disabled={saving} onChange={(e) => changeRow(r.key, { date: e.target.value })} className="rounded-lg bg-white/10 p-2"/></td></tr>)}</tbody></table></div></>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#0A4537] p-4"><span className="text-xs text-white/70">يتم إنشاء البنود وربط المصروفات وخصمها من العهدة بواسطة الدالة الحالية في Supabase. يمكن استيراد نفس الملف أكثر من مرة لنفس المشروع والعهدة، بشرط اختيار صفوف لم تُستورد سابقًا.</span><div className="flex gap-2"><button onClick={onClose} disabled={saving} className="rounded-xl border border-white/20 px-5 py-2">إلغاء</button><button onClick={save} disabled={saving || loading || !previewReady || !selected.length || invalid.length > 0 || !accountId || previewWarnings.some((w) => w.includes("بلا صف نهاية"))} className="rounded-xl bg-yellow-400 px-5 py-2 font-extrabold text-[#062E26] disabled:opacity-40">{saving ? "جارٍ الاستيراد..." : `تأكيد استيراد ${selected.length} مصروف`}</button></div></div>
    </div>
  </div>;
}
