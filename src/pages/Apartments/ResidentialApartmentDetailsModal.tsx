import { useEffect, useState } from "react";
import { Building2, Home, X, User, FileText, Coins, Paperclip, MessageSquare, Wallet, CalendarDays, Droplets, Zap, CircleAlert, MapPin, Pencil, Plus, Check, ChevronDown, Banknote, ReceiptText } from "lucide-react";
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

export default function ResidentialApartmentDetailsModal({ unit, companyId, onClose, onUnitUpdated }: { unit: ResidentialMapUnit; companyId: string; onClose: () => void; onUnitUpdated?: (patch: Partial<ResidentialMapUnit>) => void }) {
  const [financialModal, setFinancialModal] = useState<"charge" | "collectCharge" | null>(null);
  const [operationType, setOperationType] = useState("إيجار");
  const [operationAmount, setOperationAmount] = useState("");
  const [operationMonth, setOperationMonth] = useState(() => new Date().toLocaleDateString("en-CA").slice(0, 7));
  const [operationDate, setOperationDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [operationNotes, setOperationNotes] = useState("");
  const [periods, setPeriods] = useState<Record<string, { from: string; to: string }>>({});
  const currentMonth = () => { const now = new Date(); const year = now.getFullYear(); const month = now.getMonth(); const local = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`; return { from: local(1), to: local(new Date(year, month + 1, 0).getDate()) }; };
  const openFinancialAction = (kind: "charge" | "collectCharge") => {
    setOperationType("كهرباء");
    setOperationAmount(""); setOperationNotes("");
    setOperationMonth(new Date().toLocaleDateString("en-CA").slice(0, 7));
    setFinancialModal(kind);
  };
  const [activeTab, setActiveTab] = useState<Tab>("البيانات الأساسية");
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
  const [savingAll, setSavingAll] = useState(false);
  const [typeChoices, setTypeChoices] = useState<string[]>([]);
  const [statusChoices, setStatusChoices] = useState<string[]>([]);
  const [addingChoice, setAddingChoice] = useState<"type" | "status" | null>(null);
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
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
        supabase.from("residential_apartments").select("region,city").eq("company_id", companyId),
      ]);
      if (!active) return;
      const options: LocationOption[] = (custom.data || []) as LocationOption[];
      for (const row of existing.data || []) {
        if (row.region) options.push({ kind: "region", name: row.region, region_name: null });
        if (row.city && row.region) options.push({ kind: "city", name: row.city, region_name: row.region });
      }
      setLocationOptions(options);
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

  const persistField = async (patch: Partial<ResidentialMapUnit>): Promise<boolean> => {
    if (savingField) return false;
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
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") { if (financialModal) setFinancialModal(null); else onClose(); } };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, financialModal]);
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
  const status = editedUnit.apartment_status;
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
          const { data, error } = await supabase.from("residential_apartments")
            .update({ ...changes, updated_at: new Date().toISOString() })
            .eq("id", editedUnit.id).eq("company_id", companyId).select("id").maybeSingle();
          if (error || !data) throw new Error(error?.message || "تعذر حفظ تفاصيل الشقة.");
          setEditedUnit(prev => ({ ...prev, ...changes }));
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
      setSaveNotice("تم حفظ تعديلات الشقة وبيانات المالك بنجاح.");
    } catch (error) { setFieldError(error instanceof Error ? error.message : "تعذر حفظ التعديلات."); }
    finally { setSavingAll(false); }
  };
  const editableInfo = (field: typeof unitFields[number]) => {
    const value = unitDraft[field.key];
    const isLocation = field.key === "region" || field.key === "city";
    const common = "mt-1 h-9 w-full min-w-0 rounded-lg border border-[#315577] bg-[#071a2d] px-2 text-sm font-semibold text-white outline-none focus:border-amber-400";
    return <label key={field.key} className="block min-w-0 rounded-xl border border-[#294d6d] bg-[#102239] px-3 py-2 text-right">
      <span className="flex items-center justify-between gap-2 text-xs font-bold text-slate-300">
        <span>{field.label}</span>
        {isLocation && <button type="button" title={`إضافة ${field.label}`} aria-label={`إضافة ${field.label}`} onClick={() => { setAddingLocation(field.key === "region" ? "region" : "city"); setNewLocationName(""); setLocationError(""); }} className="flex h-6 w-6 items-center justify-center rounded-md border border-amber-400/50 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20"><Plus size={15}/></button>}
      </span>
      {field.kind === "select" ? <select value={value ?? ""} disabled={field.key === "city" && !unitDraft.region} onChange={e => updateDraft(field.key, e.target.value)} className={`${common} disabled:cursor-not-allowed disabled:opacity-50`}>
        <option value="">{field.key === "city" && !unitDraft.region ? "اختر المنطقة أولًا" : `اختر ${field.label}`}</option>
        {Array.from(new Set([...(field.choices || []), String(value ?? "")].filter(Boolean))).map(v => <option key={v} value={v}>{v}</option>)}
      </select> : <input type={field.kind === "number" ? "number" : "text"} min={field.kind === "number" ? 0 : undefined} step={field.kind === "number" ? "any" : undefined} value={value ?? ""} onChange={e => updateDraft(field.key, e.target.value, field.kind === "number")} className={common}/>}
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
          {/* الترتيب مطابق للمرجع: نهاية العقد، البداية، الإيجار، النوع والحالة، الصورة يسارًا. */}
          <div className="grid grid-cols-1 gap-1 border-b border-[#2a5275] bg-[#06182c] p-1 lg:grid-cols-[minmax(0,1fr)_320px]" dir="rtl">
            <div className="grid min-w-0 grid-cols-2 gap-1 sm:grid-cols-4" dir="rtl">
              <div className={`${card} flex min-h-[194px] flex-col items-center justify-center gap-2 p-2`}>
                <span className="text-xs font-bold text-slate-300">تاريخ نهاية العقد</span><CalendarDays size={26} className="text-cyan-400"/>
                <strong className="text-sm font-black text-white">غير مربوط</strong><span className="text-center text-[11px] text-slate-400">لم يُسجّل عقد لهذه الشقة</span>
              </div>
              <div className={`${card} flex min-h-[194px] flex-col items-center justify-center gap-2 p-2`}>
                <span className="text-xs font-bold text-slate-300">تاريخ بداية العقد</span><CalendarDays size={26} className="text-purple-400"/>
                <strong className="text-sm font-black text-white">غير مربوط</strong><span className="text-center text-[11px] text-slate-400">لم يُسجّل عقد لهذه الشقة</span>
              </div>
              <div className={`${card} flex min-h-[194px] flex-col items-center justify-center gap-2 p-2`}>
                <span className="text-xs font-bold text-slate-300">قيمة الإيجار</span><Wallet size={27} className="text-amber-400"/>
                <strong className="break-words text-xl font-black text-[#f6c84a]">{money(editedUnit.rent_amount)}</strong>
                <span className="text-xs text-slate-400">{display(editedUnit.rent_period)}</span>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                {([{ key: "type", title: "نوع الشقة", icon: Home, color: "text-blue-400", value: editedUnit.apartment_type || "", options: typeChoices, column: "apartment_type" },
                   { key: "status", title: "حالة الشقة", icon: User, color: "text-emerald-400", value: status, options: statusChoices, column: "apartment_status" }] as const).map(item => {
                  const Icon = item.icon;
                  return <div key={item.key} className={`${card} flex min-h-[95px] min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-1`}>
                    <span className="text-[11px] font-bold text-slate-300">{item.title}</span><Icon size={19} className={item.color}/>
                    <div className="flex w-full items-center gap-1">
                      <button type="button" title={`إضافة ${item.title} جديد`} onClick={() => { setAddingChoice(item.key); setNewChoice(""); }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20"><Plus size={17}/></button>
                      <div className="relative min-w-0 flex-1"><select aria-label={item.title} disabled={savingField} value={item.value} onChange={event => { void persistField({ [item.column]: event.target.value }); }} className="h-8 w-full appearance-none rounded-lg border border-[#2a5275] bg-[#0b213a] py-1 pr-2 pl-6 text-center text-xs font-black text-white outline-none focus:border-amber-400 disabled:opacity-50">
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
              {financialSummaries.map(item => { const Icon = item.icon; const range = periods[item.key] ?? currentMonth(); return <div key={item.key} className="min-w-0 rounded-xl border bg-[#0b223b] p-2.5 text-center" style={{borderColor:`${item.color}75`,background:item.key === "late" ? "linear-gradient(145deg,#3b1727,#0b223b)" : "linear-gradient(145deg,#112c43,#091a2f)"}}><div className="flex items-center justify-center gap-2"><Icon size={22} style={{color:item.color}}/><strong className="text-xs font-black text-white">{item.title}</strong></div><div className="mt-2 text-lg font-black" style={{color:item.color}}>— <span className="text-xs">ريال</span></div><p className="mt-1 text-[10px] text-slate-400">لم تُربط البيانات المالية بعد</p><div className="mt-2 grid grid-cols-2 gap-1"><label className="min-w-0 text-[10px] text-slate-300">من<input type="date" aria-label={`من - ${item.title}`} value={range.from} max={range.to} onChange={e=>setPeriods(prev=>({...prev,[item.key]:{...range,from:e.target.value}}))} className="mt-1 block h-8 w-full min-w-0 rounded-md border border-[#31506e] bg-[#08192b] px-1 text-center text-[10px] text-white [color-scheme:dark]"/></label><label className="min-w-0 text-[10px] text-slate-300">إلى<input type="date" aria-label={`إلى - ${item.title}`} value={range.to} min={range.from} onChange={e=>setPeriods(prev=>({...prev,[item.key]:{...range,to:e.target.value}}))} className="mt-1 block h-8 w-full min-w-0 rounded-md border border-[#31506e] bg-[#08192b] px-1 text-center text-[10px] text-white [color-scheme:dark]"/></label></div></div>; })}
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
            {activeTab === "العقد" && <Section title="بيانات العقد" icon={FileText}><p className="py-10 text-center text-sm text-gray-400">لم تُربط عقود الشقق السكنية بهذه النافذة بعد. لن يتم عرض عقود عمائر أخرى.</p></Section>}
            {activeTab === "المدفوعات" && <Section title="المدفوعات والتحصيلات" icon={Coins}><p className="py-10 text-center text-sm text-gray-400">لم تُربط السجلات المالية الخاصة بهذه الشقة بعد. لا توجد مبالغ افتراضية.</p></Section>}
            {activeTab === "المستندات" && <Section title="مستندات الشقة" icon={Paperclip}><p className="py-10 text-center text-sm text-gray-400">لم يتم ربط مستندات خاصة بهذه الشقة بعد.</p></Section>}
            {activeTab === "الملاحظات" && <Section title="ملاحظات الشقة" icon={MessageSquare}><p className="whitespace-pre-wrap break-words p-2 text-sm leading-7 text-white">{unitDraft.notes || "لا توجد ملاحظات"}</p></Section>}
          </div>
        </main>
        <footer className="flex shrink-0 flex-wrap items-center justify-center gap-3 border-t border-[#294d6d] bg-[#071a2d] px-4 py-3">{ownerError && <span role="alert" className="w-full text-center text-xs text-red-300">{ownerError}</span>}{saveNotice && <span role="status" className="w-full text-center text-xs text-emerald-300">{saveNotice}</span>}<button type="button" onClick={onClose} className="min-w-36 rounded-xl border border-amber-400/50 bg-amber-400/10 px-9 py-3.5 text-lg font-black text-amber-300 hover:bg-amber-400/20">إغلاق</button><button type="button" onClick={() => void saveAll()} disabled={savingAll || savingOwner || ownerLoading || savingField} className="flex min-w-36 items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500 px-9 py-3.5 text-lg font-black text-[#05291f] hover:bg-emerald-400 disabled:opacity-50"><Check size={17}/>{savingAll ? "جارٍ الحفظ..." : "حفظ"}</button></footer>
      </div>
             {financialModal && (() => {
         const isCollection = financialModal === "collectCharge";
         const title = isCollection ? "تحصيل فاتورة أو مستحقات" : "إضافة فاتورة أو مستحقات";
         const accent = isCollection ? "#f6c84a" : "#67e8f9";
         const inputClass = "mt-1.5 block h-11 w-full min-w-0 rounded-xl border border-sky-400/25 bg-[#0a2036] px-3 text-center text-sm font-semibold text-white outline-none focus:border-cyan-300";
         return <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-3 backdrop-blur-xl sm:p-5" onMouseDown={event => { if (event.target === event.currentTarget) setFinancialModal(null); }}>
           <div dir="rtl" role="dialog" aria-modal="true" aria-label={title} className="relative flex w-full flex-col overflow-hidden rounded-[28px] border bg-[#061426] text-white shadow-[0_0_100px_rgba(0,0,0,.6)]" style={{width:"min(1120px, calc(100vw - 32px))",maxWidth:"1120px",maxHeight:"min(800px, calc(100dvh - 32px))",borderColor:`${accent}88`,boxSizing:"border-box"}}>
             <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[2px]" style={{background:`linear-gradient(90deg,transparent,${accent},transparent)`}}/>
             <header className="relative shrink-0 border-b border-white/10 bg-gradient-to-r from-[#050d18] via-[#09213a] to-[#061426] px-5 py-4 sm:px-7">
               <div className="flex items-center justify-center gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border bg-white/5" style={{color:accent,borderColor:`${accent}66`}}>{isCollection?<Banknote size={30}/>:<ReceiptText size={30}/>}</span><div className="min-w-0 text-center"><h2 className="text-xl font-black sm:text-2xl lg:text-3xl" style={{color:accent}}>{title}</h2><p className="mt-1 text-xs font-semibold text-slate-400 sm:text-sm">تسجيل العملية للشقة المحددة</p></div><button type="button" onClick={()=>setFinancialModal(null)} aria-label="إغلاق" className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-rose-500/20"><X size={22}/></button></div>
             </header>
             <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
               <div className="mb-4 rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-2.5 text-center text-xs font-semibold leading-5 text-amber-200">الشقة المحددة: {editedUnit.apartment_number} — {editedUnit.building_name || "شقة سكنية"} — لا يمكن تغييرها من هذه العملية. الحفظ في قاعدة البيانات غير مفعّل حاليًا.</div>
               <div className="grid min-h-0 grid-cols-1 gap-5 lg:grid-cols-[1fr_1.1fr]">
                 <section className="flex min-h-[330px] min-w-0 flex-col rounded-3xl border border-cyan-400/25 bg-[#081c31]/85 p-4 sm:p-5">
                   <div className="mb-4 text-center"><h3 className="text-xl font-black text-white">اختيار الشقق <span className="text-sm text-cyan-300">(1 محددة)</span></h3><p className="mt-1 text-xs text-slate-400">الشقة مفتوحة من نافذة تفاصيلها ومحددة تلقائيًا</p></div>
                   <div className="mb-3 grid grid-cols-2 gap-2"><div className="rounded-lg border border-white/10 bg-[#0b2137] p-2 text-center text-xs">{editedUnit.apartment_type || "نوع غير محدد"}</div><div className="rounded-lg border border-white/10 bg-[#0b2137] p-2 text-center text-xs">{editedUnit.apartment_status}</div></div>
                   <div className="flex items-center justify-between gap-3 rounded-xl border border-cyan-300/50 bg-[#0c2138] px-3 py-3"><span className="min-w-0"><strong className="block text-sm">شقة {editedUnit.apartment_number}</strong><small className="block truncate text-xs text-slate-400">{editedUnit.apartment_type || "غير محدد"} · {editedUnit.apartment_status}</small></span><input type="checkbox" checked readOnly disabled aria-label="الشقة محددة تلقائيًا" className="h-5 w-5 shrink-0 accent-cyan-400"/></div>
                   <div className="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-300/5 px-3 py-2 text-center text-xs font-bold text-cyan-200">تم اختيار شقة واحدة — لا يمكن تغيير التحديد</div>
                 </section>
                 <section className="min-w-0 rounded-3xl border border-cyan-400/25 bg-[#081c31]/85 p-4 sm:p-5"><div className="mb-4 text-center"><h3 className="text-xl font-black text-white">بيانات المستحق</h3><p className="mt-1 text-xs text-slate-400">تُطبق البيانات على الشقة المحددة فقط</p></div>
                   <div className="space-y-3">
                     <label className="block text-center text-sm font-bold">نوع المستحق<select value={operationType} onChange={e=>setOperationType(e.target.value)} className={inputClass}>{["كهرباء","مياه","صيانة","مستحقات أخرى"].map(v=><option key={v}>{v}</option>)}</select></label>
                     <label className="block text-center text-sm font-bold">المبلغ لكل شقة (ريال)<input type="number" min="0" value={operationAmount} onChange={e=>setOperationAmount(e.target.value)} placeholder="اكتب المبلغ" className={inputClass}/></label>
                     <label className="block text-center text-sm font-bold">المستحق عن شهر / أشهر<input type="month" value={operationMonth} onChange={e=>setOperationMonth(e.target.value)} className={inputClass}/></label>
                     <label className="block text-center text-sm font-bold">تاريخ {isCollection?"التحصيل":"الإدخال"}<input type="date" value={operationDate} onChange={e=>setOperationDate(e.target.value)} className={inputClass}/></label>
                     <label className="block text-center text-sm font-bold">ملاحظات<textarea rows={3} value={operationNotes} onChange={e=>setOperationNotes(e.target.value)} placeholder="اكتب أي ملاحظات إضافية..." className="mt-1.5 block w-full resize-y rounded-xl border border-sky-400/25 bg-[#0a2036] p-3 text-center text-sm text-white outline-none focus:border-cyan-300"/></label>
                     <div className="overflow-hidden rounded-xl border border-cyan-300/20 bg-[#071b2b]"><div className="flex items-center justify-between px-3 py-2 text-xs"><span>عدد الشقق المحددة</span><strong className="text-cyan-300">1</strong></div><div className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-xs"><span>إجمالي العملية</span><strong className="text-cyan-300">{operationAmount && Number.isFinite(Number(operationAmount)) ? Number(operationAmount).toLocaleString("ar-SA") : "—"} ريال</strong></div></div>
                   </div>
                 </section>
               </div>
             </main>
             <footer className="grid shrink-0 grid-cols-2 gap-3 border-t border-white/10 bg-[#07172a] p-3 sm:px-5"><button type="button" onClick={()=>setFinancialModal(null)} className="min-h-12 rounded-xl border border-white/15 bg-white/5 text-base font-black text-slate-200 transition hover:bg-white/10">✕ إغلاق</button><button type="button" disabled title="الحفظ غير مفعّل حتى ربط القسم بقاعدة البيانات" className="min-h-12 cursor-not-allowed rounded-xl bg-gradient-to-l from-cyan-600/50 to-blue-600/50 text-base font-black text-white opacity-55">✓ حفظ العملية</button></footer>
           </div>
         </div>;
       })()}
    </div>
  );
}
