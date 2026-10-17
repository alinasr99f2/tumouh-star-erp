import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../utils/supabase";
import { FileSpreadsheet, Upload, X, AlertTriangle, CheckCircle2 } from "lucide-react";

type Mode = "new" | "existing";
type BuildingChoice = { id: number; name: string; units: number };
type FieldKey = "number" | "propertyType" | "apartmentType" | "contract" | "tenant" | "phone" | "identity" | "start" | "end" | "annualRent" | "monthlyRent" | "floor" | "parking" | "electricity" | "water" | "furniture";
const FIELDS: { key: FieldKey; label: string }[] = [
  {key:"number",label:"رقم الشقة / الوحدة"},{key:"propertyType",label:"نوع العقار (عوائل / أفراد)"},
  {key:"apartmentType",label:"نوع الشقة"},{key:"tenant",label:"اسم المستأجر"},
  {key:"contract",label:"رقم العقد"},{key:"start",label:"بداية العقد"},
  {key:"end",label:"نهاية العقد"},{key:"annualRent",label:"الإيجار السنوي"},
  {key:"monthlyRent",label:"الإيجار الشهري"},{key:"phone",label:"رقم الجوال"},
  {key:"identity",label:"رقم الهوية"},{key:"floor",label:"الدور"},
  {key:"parking",label:"موقف السيارة"},{key:"electricity",label:"عداد الكهرباء"},
  {key:"water",label:"عداد المياه"},{key:"furniture",label:"حالة الأثاث"},
];
const colName = (index: number) => { let n=index+1, result=""; while(n>0){n--;result=String.fromCharCode(65+n%26)+result;n=Math.floor(n/26);}return result; };

type ImportRow = { number: string; propertyType: string; apartmentType: string; contract: string; tenant: string; phone: string; identity: string; start: string; end: string; annualRent: number; monthlyRent: number; floor: string; parking: string; electricity: string; water: string; furniture: string; errors: string[] };
const amount = (v: string) => Number(v.replace(/[,،\s]/g, "")) || 0;
// Excel date cells may be serial numbers, real Date values, or formatted text.
// Read the original worksheet cell by its absolute address (e.g. E5), not a
// zero-based array whose offset depends on the worksheet's !ref range.
const date = (value: unknown, formatted = "", date1904 = false): string => {
  if (value == null || value === "") return "";
  const iso = (y: number, m: number, d: number) => {
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() + 1 !== m || dt.getUTCDate() !== d) return "";
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };
  if (value instanceof Date && !Number.isNaN(value.getTime())) return iso(value.getUTCFullYear(), value.getUTCMonth()+1, value.getUTCDate());
  const text = String(value).trim();
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(text)) { const [y,m,d] = text.split("-").map(Number); return iso(y,m,d); }
  const displayed = formatted.trim();
  const candidate = /^\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4}$/.test(displayed) ? displayed : text;
  if (/^\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4}$/.test(candidate)) {
    const [d,m,y] = candidate.split(/[\/.-]/).map(Number);
    return iso(y,m,d);
  }
  if (typeof value === "number" || /^\d{5}(?:\.\d+)?$/.test(text)) {
    const serial = Number(value);
    const parsed = XLSX.SSF.parse_date_code(serial, {date1904});
    if (parsed) return iso(parsed.y, parsed.m, parsed.d);
  }
  return text;
};
const FLOOR_NAMES: Record<number, string> = {0:"الأرضي",1:"الأول",2:"الثاني",3:"الثالث",4:"الرابع",5:"الخامس",6:"السادس",7:"السابع",8:"الثامن",9:"التاسع",10:"العاشر"};
const inferFloor = (apartmentNumber: string): string | null => {
  const match = apartmentNumber.trim().match(/^(\d+)\s*\/\s*\d+[A-Za-z]*$/);
  if (!match) return null;
  const floor = Number(match[1]);
  if (!Number.isSafeInteger(floor) || floor < 0) return null;
  return FLOOR_NAMES[floor] ?? `الدور ${floor}`;
};
const validDate = (v: string) => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)));
const obj = (v: unknown): Record<string, any> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, any> : {};

export default function BuildingExcelImport({ buildings, onClose, onComplete }: { buildings: BuildingChoice[]; onClose: () => void; onComplete: (id: number) => void }) {
  const [mode, setMode] = useState<Mode>("new");
  const [buildingId, setBuildingId] = useState("");
  const [name, setName] = useState(""); const [number, setNumber] = useState(""); const [address, setAddress] = useState(""); const [count, setCount] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetName, setSheetName] = useState("");
  const [firstRow, setFirstRow] = useState("2");
  const [lastRow, setLastRow] = useState("");
  const [columns, setColumns] = useState<Record<FieldKey,string>>(() => Object.fromEntries(FIELDS.map(f=>[f.key,""])) as Record<FieldKey,string>);
  const [busy, setBusy] = useState(false);
  const [createdBuildingId, setCreatedBuildingId] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [successProgress, setSuccessProgress] = useState(0);
  useEffect(() => {
    if (successId === null) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      setSuccessProgress(Math.min(100, ((Date.now() - started) / 5000) * 100));
    }, 40);
    const redirect = window.setTimeout(() => onComplete(successId), 5000);
    return () => { window.clearInterval(timer); window.clearTimeout(redirect); };
  }, [successId, onComplete]);
  const [autoApartmentType, setAutoApartmentType] = useState(true);
  const [autoFloor, setAutoFloor] = useState(true);
  const [error, setError] = useState("");
  const selected = buildings.find(b => String(b.id) === buildingId);
  const total = mode === "new" ? Number(count) : selected?.units ?? 0;
  const sheet = workbook && sheetName ? workbook.Sheets[sheetName] : null;
  const maxColumn = useMemo(() => { if(!sheet) return 0; const range=XLSX.utils.decode_range(sheet["!ref"]||"A1"); return Math.min(200,range.e.c+1); },[sheet]);
  const problems = rows.flatMap((r,i) => r.errors.map(e => `صف ${Number(firstRow)+i} (${r.number || "بدون رقم"}): ${e}`));
  const occupied = rows.filter(r => !!r.tenant).length;
  const readFile = async (file?: File) => {
    if (!file) return;
    setError(""); setRows([]); setFileName(file.name);
    try {
      const wb = XLSX.read(await file.arrayBuffer(), {type:"array",cellDates:false});
      setWorkbook(wb); setSheetName(wb.SheetNames[0] || "");
      const first=wb.SheetNames[0] && wb.Sheets[wb.SheetNames[0]];
      setLastRow(first ? String(XLSX.utils.decode_range(first["!ref"]||"A1").e.r+1) : "");
      setColumns(Object.fromEntries(FIELDS.map(f=>[f.key,""])) as Record<FieldKey,string>);
    } catch(e) {setError(e instanceof Error?e.message:"تعذر فتح الملف");}
  };
  const preview = () => {
    setError(""); setRows([]);
    if(!sheet) return setError("اختر ملف Excel والشيت أولًا.");
    const from=Number(firstRow), to=Number(lastRow);
    if(!Number.isInteger(from)||!Number.isInteger(to)||from<1||to<from||to-from>9999) return setError("حدد صف البداية والنهاية بشكل صحيح (بحد أقصى 10000 صف).");
    if(!columns.number) return setError("حدد عمود رقم الشقة على الأقل.");
    const chosen=FIELDS.filter(f=>columns[f.key]).map(f=>columns[f.key].toUpperCase());
    if(new Set(chosen).size!==chosen.length) return setError("لا يمكن ربط نفس عمود Excel بأكثر من حقل.");
    const cellAt = (line: number, key: FieldKey): XLSX.CellObject | undefined => {
      const letter = columns[key];
      if (!letter) return undefined;
      return sheet[`${letter.toUpperCase()}${line}`] as XLSX.CellObject | undefined;
    };
    const get = (line: number, key: FieldKey) => {
      const cell = cellAt(line, key);
      return cell?.v == null ? "" : String(cell.v).trim();
    };
    const getDate = (line: number, key: "start" | "end") => {
      const cell = cellAt(line, key);
      return date(cell?.v, cell?.w || "", Boolean(workbook?.Workbook?.WBProps?.date1904));
    };
    const seen=new Set<string>(); const parsed:ImportRow[]=[];
    for(let line=from;line<=to;line++){
      if(!FIELDS.some(f=>columns[f.key] && get(line,f.key))) continue;
      const n=get(line,"number"), contract=get(line,"contract"), tenant=get(line,"tenant");
      const start=getDate(line,"start"), end=getDate(line,"end");
      const annualRent=amount(get(line,"annualRent")),monthlyRent=amount(get(line,"monthlyRent"));
      const errors:string[]=[];
      if(!n) errors.push("رقم الشقة مطلوب");
      if(seen.has(n)) errors.push("رقم شقة مكرر داخل نطاق الاستيراد");
      seen.add(n);
      if ((contract || start || end) && !tenant) errors.push("يوجد رقم عقد أو تواريخ بدون اسم مستأجر؛ حدد المستأجر أو تجاهل أعمدة العقد");
      if ((start && !end) || (!start && end)) errors.push("حدد تاريخ بداية العقد ونهايته معًا، أو اترك التاريخين فارغين");
      if(!validDate(start)||!validDate(end)||(start&&end&&start>end)) errors.push("تواريخ العقد غير صحيحة");
      if(annualRent<0||monthlyRent<0) errors.push("قيمة إيجار غير صحيحة");
      const inferredType = /[A-Za-z]/.test(n) ? "غرفة وصالة" : "غرفتين وصالة";
      const inferredFloor = inferFloor(n);
      if (autoFloor && n && inferredFloor === null) errors.push("لا يمكن تحديد الدور تلقائيًا: يجب أن يكون رقم الشقة مثل 1/1 أو 2/2Y. يمكنك إلغاء التحديد التلقائي واختيار عمود الدور يدويًا");
      parsed.push({number:n,propertyType:get(line,"propertyType"),apartmentType:(autoApartmentType ? inferredType : get(line,"apartmentType")),contract,tenant,phone:get(line,"phone"),identity:get(line,"identity"),start,end,annualRent,monthlyRent,floor:(autoFloor ? inferredFloor ?? "" : get(line,"floor")),parking:get(line,"parking"),electricity:get(line,"electricity"),water:get(line,"water"),furniture:get(line,"furniture"),errors});
    }
    if(!parsed.length) return setError("لم يتم العثور على صفوف بها بيانات في النطاق المحدد.");
    setRows(parsed);
  };
  const save = async () => {
    if (busy) return;
    setError("");
    if (!rows.length) return setError("اعمل معاينة للبيانات أولًا قبل الحفظ.");
    if (problems.length) return setError("راجع تنبيهات الاستيراد الموجودة أسفل المعاينة أولًا.");
    if (mode === "new" && (!name.trim() || !number.trim() || !address.trim() || !Number.isInteger(total) || total < 1)) return setError("أكمل بيانات العمارة وعدد الشقق الصحيح.");
    if (mode === "existing" && !selected) return setError("اختر العمارة المطلوب تحديثها.");
    if (total < rows.length) return setError("عدد صفوف الشقق أكبر من العدد الإجمالي للعمارة.");
    setBusy(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser(); if (authError || !user) throw new Error("يلزم تسجيل الدخول أولًا.");
      let id = mode === "new" ? createdBuildingId ?? undefined : selected?.id;
      let existing: Record<string, any> = {};
      if (mode === "existing" || (mode === "new" && id)) {
        const { data, error: loadError } = await supabase.from("building_state").select("*").eq("building_id",id!).maybeSingle(); if (loadError) throw loadError;
        existing = obj(data);
        // Updating an occupied unit is deliberately blocked until a separate conflict-resolution flow is added.
        const old = Array.isArray(existing.apartments) ? existing.apartments as Record<string, any>[] : [];
        const byOld = new Map(old.map(a => [String(a.number),a]));
        const tenants = obj(existing.apartment_tenant_info), contracts = obj(existing.apartment_contract_info);
        const conflicts = mode === "existing" ? rows.filter(r => {
          const a = byOld.get(r.number);
          return a && (String(a.status).includes("مؤجرة") || String(a.status).includes("محجوزة") || !!obj(tenants[r.number]).tenantName || !!obj(contracts[r.number]).contractNumber);
        }) : [];
        if (conflicts.length) throw new Error(`لا يمكن الكتابة فوق شقق لها بيانات قائمة: ${conflicts.slice(0,8).map(r=>r.number).join("، ")}. راجعها يدويًا أولًا.`);
      } else {
        const { data, error: createError } = await supabase.from("buildings").insert({ name:name.trim(), building_number:number.trim(), address:address.trim(), building_type:"عمارة سكنية", units_count:total, created_by:user.id }).select("id").single();
        if (createError) throw createError; id = Number(data.id);
        setCreatedBuildingId(id);
      }
      const old = Array.isArray(existing.apartments) ? existing.apartments as Record<string,any>[] : [];
      // A failed first import may have left a building with generated placeholder units.
      // Reuse that building on retry and replace only pristine placeholders.
      const isPlaceholder = (a: Record<string, any>) =>
        /^\d+$/.test(String(a.number ?? "")) &&
        (!a.tenant || a.tenant === "لا يوجد مستأجر") &&
        (!a.status || a.status === "شاغرة") &&
        (!a.type || a.type === "غير محدد") && !Number(a.rent);
      const importNumbers = new Set(rows.map(r => r.number));
      const pristinePlaceholders = old.length > 0 &&
        old.every(a => isPlaceholder(a)) &&
        !Object.keys(obj(existing.apartment_tenant_info)).length &&
        !Object.keys(obj(existing.apartment_contract_info)).length;
      const initialOld = pristinePlaceholders ? old.filter(a => importNumbers.has(String(a.number))) : old;
      const map = new Map(initialOld.map(a => [String(a.number), {...a}]));
      const types = {...obj(existing.apartment_types)}, extras = {...obj(existing.apartment_extra_info)}, tenants = {...obj(existing.apartment_tenant_info)}, contracts = {...obj(existing.apartment_contract_info)};
      for (const r of rows) {
        const hasLease = !!r.tenant;
        const status = hasLease ? "مؤجرة" : "شاغرة";
        const prev = map.get(r.number) ?? {};
        map.set(r.number,{...prev,id: (typeof prev.id === "string" && prev.id.trim()) ? prev.id : crypto.randomUUID(),number:r.number,type:r.apartmentType || prev.type || "غير محدد",rent:r.monthlyRent || (r.annualRent ? r.annualRent / 12 : 0),status,tenant:r.tenant || "لا يوجد مستأجر"});
        if (r.apartmentType) types[r.number] = r.apartmentType;
        extras[r.number] = {...obj(extras[r.number]), ...(r.propertyType ? {propertyType:r.propertyType} : {}), ...(r.floor ? {floor:r.floor} : {}), ...(r.parking ? {parking:r.parking} : {}), ...(r.electricity ? {electricityMeter:r.electricity} : {}), ...(r.water ? {waterMeter:r.water} : {}), ...(r.furniture ? {furnitureStatus:r.furniture} : {})};
        if (r.tenant) tenants[r.number] = {...obj(tenants[r.number]),status,tenantName:r.tenant,phone:r.phone,identityNumber:r.identity};
        if (r.tenant && (r.contract || r.start || r.end)) contracts[r.number] = {...obj(contracts[r.number]),contractNumber:r.contract,startDate:r.start,endDate:r.end,durationUnit:"year",durationValue:1,insuranceAmount:0,insuranceNotes:""};
      }
      if (mode === "existing" && map.size > total) throw new Error("عدد الشقق بعد الاستيراد يتجاوز إجمالي العدد المسجل للعمارة. عدّل العدد أولًا أو راجع أرقام الشقق.");
      if (mode === "new" || pristinePlaceholders) { let next = 1; while (map.size < total) { const n = String(next++); if (!map.has(n)) map.set(n,{id:crypto.randomUUID(),number:n,type:"غير محدد",rent:0,status:"شاغرة",tenant:"لا يوجد مستأجر"}); } }
      // The database validates every apartment object and requires a stable ID.
      // Preserve existing IDs and generate UUIDs only for records missing one.
      const apartmentsWithIds = Array.from(map.values()).map(apartment => ({
        ...apartment,
        id: typeof apartment.id === "string" && apartment.id.trim() ? apartment.id : crypto.randomUUID(),
      }));
      const payload = { building_id:id!, apartments:apartmentsWithIds, apartment_types:types, custom_apartment_types:existing.custom_apartment_types ?? [], custom_apartment_statuses:existing.custom_apartment_statuses ?? [], apartment_type_rents:existing.apartment_type_rents ?? {}, apartment_extra_info:extras, apartment_tenant_info:tenants, apartment_contract_info:contracts, building_charges:existing.building_charges ?? [], building_collections:existing.building_collections ?? [], updated_at:new Date().toISOString() };
      const { error: saveError } = await supabase.from("building_state").upsert(payload,{onConflict:"building_id"});
      if (saveError) throw new Error(`تعذر حفظ تفاصيل العمارة في Supabase: ${saveError.message} (${saveError.code ?? "unknown"})`);
      const { data: verified, error: verifyError } = await supabase.from("building_state")
        .select("apartments, apartment_tenant_info, apartment_contract_info, apartment_extra_info")
        .eq("building_id", id!).maybeSingle();
      if (verifyError) throw new Error(`تعذر التحقق من الاستيراد: ${verifyError.message}`);
      const savedApartments = Array.isArray(verified?.apartments) ? verified.apartments : [];
      const savedByNumber = new Map(savedApartments.map((a: Record<string, any>) => [String(a.number), a]));
      const savedTenants = obj(verified?.apartment_tenant_info);
      const savedContracts = obj(verified?.apartment_contract_info);
      const savedExtras = obj(verified?.apartment_extra_info);
      const missing = rows.filter(r => {
        const a = savedByNumber.get(r.number) as Record<string, any> | undefined;
        if (!a || (r.tenant && (a.tenant !== r.tenant || obj(savedTenants[r.number]).tenantName !== r.tenant))) return true;
        if (r.contract && obj(savedContracts[r.number]).contractNumber !== r.contract) return true;
        if (r.start && obj(savedContracts[r.number]).startDate !== r.start) return true;
        if (r.end && obj(savedContracts[r.number]).endDate !== r.end) return true;
        if (r.propertyType && obj(savedExtras[r.number]).propertyType !== r.propertyType) return true;
        return false;
      });
      if (missing.length) throw new Error(`لم يكتمل حفظ ${missing.length} شقة. لم تُعرض رسالة نجاح. راجع الشقق: ${missing.slice(0, 8).map(r => r.number).join("، ")}`);
      setSuccessProgress(0);
      setSuccessId(id!);
    } catch(e) { setError(`${e instanceof Error ? e.message : "فشل الاستيراد"}${mode === "new" && createdBuildingId ? ` — العمارة أُنشئت برقم داخلي ${createdBuildingId}؛ اضغط حفظ مرة أخرى لإكمال التفاصيل دون إنشاء عمارة مكررة.` : ""}`); } finally { setBusy(false); }
  };
  const inputClass = "w-full rounded-xl border border-amber-400/30 bg-[#082C23] px-3 py-2.5 text-white outline-none focus:border-amber-300";
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-2 sm:p-5" dir="rtl">
    <div className="relative max-h-[94dvh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-amber-400/40 bg-[#063126] p-4 text-white shadow-2xl sm:p-6">
      {successId !== null && <div className="absolute inset-0 z-[110] flex items-center justify-center bg-[#031D17]/95 p-5" role="status" aria-live="polite">
        <div className="w-full max-w-md rounded-3xl border border-amber-300/60 bg-[#0A3C30] p-7 text-center shadow-[0_0_55px_rgba(245,193,66,0.16)]">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-300/10 text-amber-300"><CheckCircle2 size={46}/></div>
          <h3 className="mb-2 text-2xl font-extrabold text-amber-300">تم الاستيراد والإضافة بنجاح</h3>
          <p className="mb-5 text-sm text-emerald-100">تم حفظ بيانات العمارة والشقق في قاعدة البيانات بنجاح.</p>
          <div className="h-2.5 overflow-hidden rounded-full border border-amber-300/40 bg-[#05251E]" dir="ltr"><div className="h-full rounded-full bg-gradient-to-r from-[#B98727] via-[#F8D66C] to-[#FFF0A0] transition-[width] duration-75" style={{width:`${successProgress}%`}} /></div>
          <p className="mt-3 text-xs text-amber-100/80">سيتم فتح العمارة تلقائيًا خلال {Math.max(0, Math.ceil((100-successProgress)/20))} ثوانٍ</p>
          <button type="button" onClick={() => onComplete(successId)} className="mt-5 rounded-xl border border-amber-300/60 px-5 py-2 text-sm font-bold text-amber-200">فتح العمارة الآن</button>
        </div>
      </div>}
      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-xl font-bold text-amber-300"><FileSpreadsheet/> استيراد العمائر من Excel</h2><button onClick={onClose} disabled={busy} aria-label="إغلاق"><X/></button></div>
      <p className="mb-4 text-sm text-emerald-100/80">ارفع أي ملف Excel، وحدد الشيت وحرف العمود لكل بيان، ثم نطاق الصفوف المطلوب استيراده. لا يشترط قالب ثابت.</p>
      <div className="mb-4 flex flex-wrap gap-2">{(["new","existing"] as Mode[]).map(m=><button key={m} type="button" onClick={()=>{setMode(m);setError("");setRows([]);}} className={`rounded-xl px-4 py-2 font-semibold ${mode===m?"bg-amber-400 text-[#062D22]":"border border-amber-400/40"}`}>{m==="new"?"عمارة جديدة":"تحديث عمارة موجودة"}</button>)}</div>
      {mode==="new"?<div className="mb-4 grid gap-3 sm:grid-cols-2"><input className={inputClass} placeholder="اسم العمارة" value={name} onChange={e=>setName(e.target.value)}/><input className={inputClass} placeholder="رقم العمارة" value={number} onChange={e=>setNumber(e.target.value)}/><input className={inputClass} placeholder="العنوان" value={address} onChange={e=>setAddress(e.target.value)}/><input className={inputClass} type="number" min="1" placeholder="إجمالي عدد الشقق" value={count} onChange={e=>setCount(e.target.value)}/></div>:<select className={`${inputClass} mb-4`} value={buildingId} onChange={e=>setBuildingId(e.target.value)}><option value="">اختر العمارة</option>{buildings.map(b=><option key={b.id} value={b.id}>{b.name} — {b.units} شقة</option>)}</select>}
      <label className="mb-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-amber-400/50 bg-white/5 p-4 text-center"><Upload className="text-amber-300"/><span>{fileName||"اختر ملف Excel بصيغة xlsx أو xls"}</span><input className="sr-only" type="file" accept=".xlsx,.xls" onChange={e=>void readFile(e.target.files?.[0])}/></label>
      {workbook && <>
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <label className="text-sm text-amber-100">ورقة العمل (الشيت)<select className={`${inputClass} mt-1`} value={sheetName} onChange={e=>{setSheetName(e.target.value);setRows([]);const sh=workbook.Sheets[e.target.value];setLastRow(sh?String(XLSX.utils.decode_range(sh["!ref"]||"A1").e.r+1):"");}}>{workbook.SheetNames.map(n=><option key={n} value={n}>{n}</option>)}</select></label>
          <label className="text-sm text-amber-100">من صف رقم<input className={`${inputClass} mt-1`} type="number" min="1" value={firstRow} onChange={e=>{setFirstRow(e.target.value);setRows([]);}}/></label>
          <label className="text-sm text-amber-100">إلى صف رقم<input className={`${inputClass} mt-1`} type="number" min="1" value={lastRow} onChange={e=>{setLastRow(e.target.value);setRows([]);}}/></label>
        </div>
        <label className="mb-3 flex cursor-pointer items-center gap-3 rounded-xl border border-amber-400/30 bg-white/5 p-3 text-sm text-emerald-100">
          <input type="checkbox" checked={autoApartmentType} onChange={e=>{setAutoApartmentType(e.target.checked);setRows([]);}} className="h-4 w-4 accent-amber-400" />
          <span><b className="text-amber-300">تحديد نوع الشقة تلقائيًا من رقمها</b> — وجود حرف إنجليزي مثل 1/7A = غرفة وصالة، وبدون حرف مثل 1/1 = غرفتين وصالة. عند إلغاء الاختيار يمكنك تحديد عمود نوع الشقة يدويًا.</span>
        </label>
        <label className="mb-3 flex cursor-pointer items-center gap-3 rounded-xl border border-amber-400/30 bg-white/5 p-3 text-sm text-emerald-100">
          <input type="checkbox" checked={autoFloor} onChange={e=>{setAutoFloor(e.target.checked);setRows([]);}} className="h-4 w-4 accent-amber-400" />
          <span><b className="text-amber-300">تحديد الدور تلقائيًا من رقم الشقة</b> — 1/1 أو 1/7A = الأول، 2/2 أو 2/2Y = الثاني. عند إلغاء الاختيار يمكنك اختيار عمود الدور يدويًا.</span>
        </label>
        <h3 className="mb-2 font-bold text-amber-300">تحديد أعمدة البيانات حسب حرف Excel</h3>
        <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{FIELDS.map(field=><label key={field.key} className="text-sm text-emerald-100">{field.label}{field.key==="number"&&<span className="text-amber-300"> *</span>}<select className={`${inputClass} mt-1`} value={columns[field.key]} onChange={e=>{setColumns(prev=>({...prev,[field.key]:e.target.value}));setRows([]);}} disabled={(field.key==="apartmentType" && autoApartmentType) || (field.key==="floor" && autoFloor)}><option value="">بدون / تجاهل</option>{Array.from({length:maxColumn},(_,i)=>colName(i)).map(letter=><option key={letter} value={letter}>العمود {letter}</option>)}</select></label>)}</div>
        <p className="mb-3 text-xs text-amber-100/75">الخانات غير المحددة سيتم تجاهلها. لازم تحدد عمود رقم الشقة. الصفوف الفارغة يتم تخطيها.</p>
        <button type="button" onClick={preview} className="mb-4 rounded-xl bg-amber-400 px-5 py-2.5 font-bold text-[#16352B]">معاينة البيانات حسب الأعمدة المختارة</button>
      </>}
      {!!rows.length&&<><div className="mb-3 flex flex-wrap gap-3 text-sm"><span>الصفوف: <b>{rows.length}</b></span><span>بها مستأجر: <b>{occupied}</b></span><span>بدون مستأجر: <b>{rows.length-occupied}</b></span><span>عدد شقق العمارة: <b>{total||"غير محدد"}</b></span></div><div className="max-h-64 overflow-auto rounded-xl border border-amber-400/30"><table className="w-full min-w-[850px] text-right text-sm"><thead className="sticky top-0 bg-[#164D3C] text-amber-200"><tr>{["الشقة","الدور","نوع العقار","نوع الشقة","المستأجر","العقد","البداية","النهاية","الإيجار السنوي","الحالة"].map(h=><th className="border-b border-amber-400/30 p-2" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i} className="border-b border-white/10"><td className="p-2">{r.number}</td><td className="p-2">{r.floor}</td><td className="p-2">{r.propertyType}</td><td className="p-2">{r.apartmentType}</td><td className="p-2">{r.tenant}</td><td className="p-2">{r.contract}</td><td className="p-2">{r.start}</td><td className="p-2">{r.end}</td><td className="p-2">{r.annualRent}</td><td className="p-2">{r.tenant?"مؤجرة":"شاغرة"}</td></tr>)}</tbody></table></div></>}
      {(!!problems.length||!!error)&&<div className="mt-3 rounded-xl border border-red-400/50 bg-red-950/40 p-3 text-sm text-red-200"><div className="flex items-center gap-2 font-bold"><AlertTriangle size={17}/> تنبيهات الاستيراد</div>{error&&<p>{error}</p>}{problems.slice(0,12).map((p,i)=><p key={i}>{p}</p>)}</div>}
      {!!rows.length && mode === "new" && (!name.trim() || !number.trim() || !address.trim() || !Number.isInteger(total) || total < 1) && <p className="mt-3 rounded-xl border border-amber-400/50 bg-amber-400/10 p-3 text-sm text-amber-200">قبل الحفظ: اكتب اسم العمارة ورقمها وعنوانها وإجمالي عدد الشقق (رقم أكبر من صفر). زر الحفظ سيعرض التفاصيل الناقصة عند الضغط.</p>}
      {!!rows.length && mode === "new" && total > 0 && total < rows.length && <p className="mt-3 text-sm text-red-200">إجمالي الشقق ({total}) أقل من عدد الصفوف المستوردة ({rows.length}).</p>}
      <p className="mt-3 text-xs text-amber-100/80">لن يتم إنشاء فواتير أو تحصيلات. تحديث العمارة يمنع الكتابة فوق الشقق المؤجرة أو المحجوزة أو ذات العقود المسجلة.</p>
      <div className="mt-5 flex flex-wrap justify-end gap-3"><button onClick={onClose} disabled={busy} className="rounded-xl border border-white/30 px-5 py-2">إلغاء</button><button onClick={()=>void save()} disabled={busy||successId!==null} className="rounded-xl bg-gradient-to-r from-[#C49A3A] to-[#F6D878] px-6 py-2 font-bold text-[#16352B] disabled:opacity-50">{busy?"جاري الاستيراد...":"حفظ الاستيراد بعد المراجعة"}</button></div>
    </div>
  </div>;
}
