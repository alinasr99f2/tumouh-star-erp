import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../utils/supabase";
import {
  Building2,
  Home,
  Plus,
  Search,
  SlidersHorizontal,
  KeyRound,
  UserRound,
  MapPin,
  Ruler,
  Banknote,
  Pencil,
  Trash2,
  Eye,
  X,
  ChevronDown,
  LayoutGrid,
  List,
  Archive, RefreshCw, CalendarPlus, UserRoundPlus, SearchCheck, CalendarClock, Droplets, Zap, ReceiptText, CalendarCheck2, FileBarChart2, ContactRound, CalendarDays, ArrowUpLeft,
} from "lucide-react";

type ApartmentStatus = string;
type RentCategory = "يومي" | "شهري" | "سنوي";

// Custom dropdown choices are saved only in this browser until a tenant-scoped backend is connected.
const CHOICE_STORAGE_KEY = "aqary-smart-apartments-custom-choices-v1";
type CustomChoices = { cities: Record<string, string[]>; types: string[]; statuses: string[] };
const EMPTY_CUSTOM_CHOICES: CustomChoices = { cities: {}, types: [], statuses: [] };
const DEFAULT_APARTMENT_TYPES = ["غرفة وصالة", "غرفتين وصالة", "ثلاث غرف وصالة", "أربع غرف وصالة", "دوبلكس", "استوديو"];
const DEFAULT_APARTMENT_STATUSES = ["متاحة", "مؤجرة", "محجوزة"];
function readCustomChoices(): CustomChoices {
  try {
    const raw = window.localStorage.getItem(CHOICE_STORAGE_KEY);
    if (!raw) return { cities: {}, types: [], statuses: [] };
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return { ...EMPTY_CUSTOM_CHOICES };
    const obj = value as Record<string, unknown>;
    const strings = (v: unknown): string[] => Array.isArray(v) ? v.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
    const cities: Record<string, string[]> = {};
    if (obj.cities && typeof obj.cities === "object" && !Array.isArray(obj.cities)) {
      for (const [region, entries] of Object.entries(obj.cities)) cities[region] = strings(entries);
    }
    return { cities, types: strings(obj.types), statuses: strings(obj.statuses) };
  } catch { return { cities: {}, types: [], statuses: [] }; }
}


const SAUDI_REGIONS: Record<string, string[]> = {
  "المنطقة الشرقية": ["الدمام", "الخبر", "الظهران", "الجبيل", "القطيف", "رأس تنورة", "بقيق", "الأحساء", "حفر الباطن", "النعيرية", "الخفجي", "قرية العليا"],
  "منطقة الرياض": ["الرياض", "الخرج", "الدرعية", "المجمعة", "الدوادمي", "القويعية", "وادي الدواسر", "الزلفي", "شقراء", "عفيف"],
  "منطقة مكة المكرمة": ["مكة المكرمة", "جدة", "الطائف", "رابغ", "القنفذة", "الليث", "خليص", "الجموم"],
  "منطقة المدينة المنورة": ["المدينة المنورة", "ينبع", "العلا", "بدر", "خيبر", "مهد الذهب"],
  "منطقة القصيم": ["بريدة", "عنيزة", "الرس", "البكيرية", "المذنب", "البدائع", "رياض الخبراء"],
  "منطقة عسير": ["أبها", "خميس مشيط", "بيشة", "محايل عسير", "النماص", "رجال ألمع", "ظهران الجنوب"],
  "منطقة تبوك": ["تبوك", "ضباء", "الوجه", "أملج", "حقل", "تيماء"],
  "منطقة حائل": ["حائل", "بقعاء", "الشنان", "الغزالة"],
  "منطقة الحدود الشمالية": ["عرعر", "رفحاء", "طريف", "العويقيلة"],
  "منطقة جازان": ["جازان", "صبيا", "أبو عريش", "صامطة", "بيش", "الدرب", "فرسان"],
  "منطقة نجران": ["نجران", "شرورة", "حبونا", "يدمة"],
  "منطقة الباحة": ["الباحة", "بلجرشي", "المندق", "المخواة", "قلوة"],
  "منطقة الجوف": ["سكاكا", "دومة الجندل", "القريات", "طبرجل"],
};

type Apartment = {
  id: string;
  number: string;
  type: string;
  rooms: number;
  area: number;
  price: number;
  location: string;
  buildingName?: string;
  rentCategory?: RentCategory;
  region?: string;
  city?: string;
  district?: string;
  landmark?: string;
  status: ApartmentStatus;
  tenant?: string;
  notes?: string;
};

const RESIDENTIAL_COMPANY_ID = "61bed49c-bc21-476a-865b-1d28db791ad2";

type ResidentialRow = {
  id: string; apartment_number: string; building_name: string | null;
  rooms_count: number; rent_amount: number; rent_period: string;
  area_sqm: number | null; apartment_type: string | null;
  apartment_status: string; region: string | null; city: string | null;
  district_street: string | null; nearest_landmark: string | null;
  notes: string | null;
};

function fromResidentialRow(row: ResidentialRow): Apartment {
  const region = row.region ?? "";
  const city = row.city ?? "";
  const district = row.district_street ?? "";
  return {
    id: row.id, number: row.apartment_number,
    buildingName: row.building_name ?? undefined,
    rooms: row.rooms_count, area: Number(row.area_sqm ?? 0),
    price: Number(row.rent_amount),
    rentCategory: (["يومي", "شهري", "سنوي"].includes(row.rent_period) ? row.rent_period : "سنوي") as RentCategory,
    type: row.apartment_type ?? "غير محدد", status: row.apartment_status,
    region, city, district, landmark: row.nearest_landmark ?? "",
    location: [region, city, district].filter(Boolean).join(" - ") || "غير محدد",
    notes: row.notes ?? "",
  };
}

const initialApartments: Apartment[] = [];

const formatPrice = (value: number) =>
  new Intl.NumberFormat("ar-SA").format(value);

type ArtKind = "building" | "rented" | "vacant" | "reserved" | "rent" | "dues" | "water" | "electric";

function CardIllustration({ kind }: { kind: ArtKind }) {
  const accent: Record<ArtKind, string> = {
    building: "#67d7f7", rented: "#f8ca66", vacant: "#61e6b3", reserved: "#c3a3fa",
    rent: "#f5c766", dues: "#f8d88a", water: "#62dff0", electric: "#f8cf53",
  };
  const color = accent[kind];
  const building = (roof = false) => <>
    {roof && <path d="M35 48 91 13l56 35" stroke={color} strokeWidth="8" strokeLinejoin="round" strokeLinecap="round"/>}
    <rect x="43" y="35" width="95" height="116" rx="11" fill="#123b36" stroke={color} strokeWidth="4"/>
    {[0,1,2].map(r=>[0,1,2].map(c=><rect key={`${r}-${c}`} x={57+c*24} y={50+r*27} width="14" height="17" rx="3" fill={color} opacity={0.65+(r+c)%2*0.25}/>))}
    <rect x="80" y="121" width="21" height="30" rx="3" fill="#092c2a" stroke={color} strokeWidth="3"/>
  </>;
  return <svg viewBox="0 0 190 172" fill="none" aria-hidden="true" className="h-[104px] w-[128px] drop-shadow-[0_10px_13px_rgba(0,0,0,.3)] sm:h-[116px] sm:w-[142px]">
    <defs><linearGradient id={`glass-${kind}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={color} stopOpacity=".30"/><stop offset="1" stopColor={color} stopOpacity=".04"/></linearGradient></defs>
    <ellipse cx="95" cy="160" rx="74" ry="8" fill={color} opacity=".14"/>
    <circle cx="94" cy="78" r="69" fill={`url(#glass-${kind})`} opacity=".42"/>
    {kind === "building" && building()}
    {kind === "rented" && <>{building()}<circle cx="142" cy="119" r="29" fill="#082a27" stroke={color} strokeWidth="4"/><circle cx="134" cy="113" r="8" stroke={color} strokeWidth="4"/><path d="m139 119 16 16m-9-7 7-7m-1 12 7-7" stroke={color} strokeWidth="4" strokeLinecap="round"/></>}
    {kind === "vacant" && <>{building(true)}<circle cx="142" cy="122" r="27" fill="#082a27" stroke={color} strokeWidth="4"/><path d="m129 122 9 9 18-20" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/></>}
    {kind === "reserved" && <><rect x="28" y="34" width="133" height="111" rx="13" fill="#183b39" stroke={color} strokeWidth="4"/><rect x="28" y="34" width="133" height="27" rx="12" fill={color} opacity=".8"/><path d="M58 24v26m74-26v26" stroke={color} strokeWidth="9" strokeLinecap="round"/>{[0,1].map(r=>[0,1,2,3].map(c=><rect key={`${r}-${c}`} x={44+c*27} y={76+r*26} width="17" height="15" rx="3" fill={color} opacity=".55"/>))}<circle cx="140" cy="122" r="27" fill="#0b2b29" stroke={color} strokeWidth="4"/><path d="m127 121 9 9 17-20" stroke={color} strokeWidth="5" strokeLinecap="round"/></>}
    {kind === "rent" && <><rect x="23" y="43" width="144" height="94" rx="17" fill="#174239" stroke={color} strokeWidth="4"/><rect x="31" y="57" width="128" height="22" rx="5" fill={color} opacity=".30"/><circle cx="96" cy="103" r="25" fill="#0d2f2b" stroke={color} strokeWidth="4"/><text x="96" y="113" fontSize="30" fontWeight="bold" textAnchor="middle" fill={color}>﷼</text></>}
    {kind === "dues" && <><path d="M49 24h78l12 16v110l-14-8-14 8-14-8-14 8-14-8-20 8V24Z" fill="#163b35" stroke={color} strokeWidth="4" strokeLinejoin="round"/><path d="M68 58h51M68 77h51M68 96h30" stroke={color} strokeWidth="6" strokeLinecap="round" opacity=".75"/><circle cx="125" cy="116" r="24" fill="#0c302b" stroke={color} strokeWidth="4"/><path d="m114 116 8 8 15-18" stroke={color} strokeWidth="4" strokeLinecap="round"/></>}
    {kind === "water" && <><path d="M95 15C78 44 43 80 43 108a52 52 0 0 0 104 0c0-28-35-64-52-93Z" fill="#105064" stroke={color} strokeWidth="5"/><path d="M62 109c0 20 13 32 32 34" stroke="#c9faff" strokeWidth="7" strokeLinecap="round" opacity=".8"/><path d="M96 61c-10 15-19 26-19 37" stroke="#b2f5ff" strokeWidth="6" strokeLinecap="round" opacity=".6"/></>}
    {kind === "electric" && <><path d="M105 14 47 94h47l-10 65 62-91h-48l7-54Z" fill="#a97813" stroke={color} strokeWidth="5" strokeLinejoin="round"/><path d="M103 41 76 84h33l-8 44 28-48H95l8-39Z" fill={color} opacity=".85"/></>}
  </svg>;
}

export default function Apartments() {
  const [apartments, setApartments] = useState<Apartment[]>(initialApartments);
  const [loadingApartments, setLoadingApartments] = useState(true);
  const [savingApartment, setSavingApartment] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadResidentialApartments = async () => {
    setLoadingApartments(true);
    setLoadError("");
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) {
      setApartments([]); setCanWrite(false);
      setLoadError("يجب تسجيل الدخول بحساب مصرح له لعرض الشقق السكنية.");
      setLoadingApartments(false); return;
    }
    const { data: membership, error: membershipError } = await supabase
      .from("residential_company_users").select("role")
      .eq("company_id", RESIDENTIAL_COMPANY_ID).eq("user_id", auth.user.id).maybeSingle();
    if (membershipError || !membership) {
      setApartments([]); setCanWrite(false);
      setLoadError(membershipError?.message ?? "حسابك غير مرتبط بشركة طموح ستار في نظام الشقق السكنية.");
      setLoadingApartments(false); return;
    }
    setCanWrite(membership.role === "owner");
    const { data, error } = await supabase.from("residential_apartments")
      .select("id,apartment_number,building_name,rooms_count,rent_amount,rent_period,area_sqm,apartment_type,apartment_status,region,city,district_street,nearest_landmark,notes")
      .eq("company_id", RESIDENTIAL_COMPANY_ID).order("created_at", { ascending: false });
    if (error) { setApartments([]); setLoadError(`تعذر تحميل الشقق: ${error.message}`); }
    else setApartments(((data ?? []) as ResidentialRow[]).map(fromResidentialRow));
    setLoadingApartments(false);
  };

  useEffect(() => { void loadResidentialApartments(); }, []);
  const [customChoices, setCustomChoices] = useState<CustomChoices>(readCustomChoices);
  const [choiceEditor, setChoiceEditor] = useState<"city" | "type" | "status" | null>(null);
  const [newChoice, setNewChoice] = useState("");
  const [choiceError, setChoiceError] = useState("");
  const apartmentTypes = useMemo(() => Array.from(new Set([...DEFAULT_APARTMENT_TYPES, ...customChoices.types])), [customChoices.types]);
  const apartmentStatuses = useMemo(() => Array.from(new Set([...DEFAULT_APARTMENT_STATUSES, ...customChoices.statuses])), [customChoices.statuses]);
  useEffect(() => {
    try { window.localStorage.setItem(CHOICE_STORAGE_KEY, JSON.stringify(customChoices)); }
    catch { /* Storage may be unavailable in private browsing. */ }
  }, [customChoices]);
  const openChoiceEditor = (kind: "city" | "type" | "status") => {
    setChoiceEditor(kind); setNewChoice(""); setChoiceError("");
  };
  const saveChoice = () => {
    const name = newChoice.trim().replace(/\s+/g, " ");
    if (!name) { setChoiceError("اكتب الاسم أولًا."); return; }
    if (name.length > 80) { setChoiceError("الاسم طويل جدًا (الحد الأقصى 80 حرفًا)."); return; }
    if (choiceEditor === "city") {
      if (!form.region) { setChoiceError("اختر المنطقة الإدارية أولًا."); return; }
      if (availableCities.some(v => v.toLocaleLowerCase("ar") === name.toLocaleLowerCase("ar"))) { setChoiceError("المدينة موجودة بالفعل ضمن المنطقة المختارة."); return; }
      setCustomChoices(prev => ({ ...prev, cities: { ...prev.cities, [form.region]: [...(prev.cities[form.region] ?? []), name] } }));
      setForm(prev => ({ ...prev, city: name }));
    } else if (choiceEditor === "type") {
      if (apartmentTypes.some(v => v.toLocaleLowerCase("ar") === name.toLocaleLowerCase("ar"))) { setChoiceError("نوع الشقة موجود بالفعل."); return; }
      setCustomChoices(prev => ({ ...prev, types: [...prev.types, name] }));
      setForm(prev => ({ ...prev, type: name }));
    } else if (choiceEditor === "status") {
      if (apartmentStatuses.some(v => v.toLocaleLowerCase("ar") === name.toLocaleLowerCase("ar"))) { setChoiceError("حالة الشقة موجودة بالفعل."); return; }
      setCustomChoices(prev => ({ ...prev, statuses: [...prev.statuses, name] }));
      setForm(prev => ({ ...prev, status: name, tenant: "" }));
    }
    setChoiceEditor(null); setNewChoice(""); setChoiceError("");
  };

  type ResidentialTenant = { id: string; full_name: string; phone: string | null; identity_number: string | null; nationality: string | null; email: string | null; notes: string | null };
  const [tenants, setTenants] = useState<ResidentialTenant[]>([]);
  const [tenantModal, setTenantModal] = useState(false);
  const [nationalities, setNationalities] = useState<string[]>(["سعودي", "مصري", "يمني", "سوداني", "سوري", "أردني", "باكستاني", "هندي", "فلبيني"]);
  const [nationalityEditor, setNationalityEditor] = useState(false);
  const [newNationality, setNewNationality] = useState("");
  const [nationalityError, setNationalityError] = useState("");
  const [savingNationality, setSavingNationality] = useState(false);
  const loadNationalities = async () => {
    const { data, error } = await supabase.from("residential_nationalities").select("name")
      .eq("company_id", RESIDENTIAL_COMPANY_ID).order("name");
    if (!error) setNationalities(prev => Array.from(new Set([...prev, ...(data ?? []).map(item => item.name as string)])));
  };
  useEffect(() => { void loadNationalities(); }, []);
  const saveNationality = async () => {
    const name = newNationality.trim().replace(/\s+/g, " ");
    if (!canWrite) { setNationalityError("ليس لديك صلاحية إضافة جنسية."); return; }
    if (!name) { setNationalityError("اكتب الجنسية أولًا."); return; }
    if (name.length > 80) { setNationalityError("الحد الأقصى 80 حرفًا."); return; }
    if (nationalities.some(v => v.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setTenantForm(prev => ({...prev, nationality: name})); setNationalityEditor(false); return;
    }
    setSavingNationality(true); setNationalityError("");
    const { error } = await supabase.from("residential_nationalities").insert({company_id: RESIDENTIAL_COMPANY_ID, name});
    setSavingNationality(false);
    if (error) { setNationalityError(`تعذر حفظ الجنسية: ${error.message}. تأكد من تنفيذ ملف SQL المرفق.`); return; }
    setNationalities(prev => [...prev, name].sort((a,b)=>a.localeCompare(b,"ar")));
    setTenantForm(prev => ({...prev, nationality: name}));
    setNewNationality(""); setNationalityEditor(false);
  };
  const [savingTenant, setSavingTenant] = useState(false);
  const [tenantError, setTenantError] = useState("");
  const [tenantForm, setTenantForm] = useState({ full_name: "", phone: "", identity_number: "", nationality: "", email: "", notes: "" });
  const loadResidentialTenants = async () => {
    const { data, error } = await supabase.from("residential_tenants")
      .select("id,full_name,phone,identity_number,nationality,email,notes")
      .eq("company_id", RESIDENTIAL_COMPANY_ID).order("created_at", { ascending: false });
    if (error) { setTenantError(`تعذر تحميل العملاء: ${error.message}`); return; }
    setTenants((data ?? []) as ResidentialTenant[]);
    setNationalities(prev => Array.from(new Set([...prev, ...(data ?? []).map(item => item.nationality).filter((v): v is string => typeof v === "string" && !!v.trim())])));
  };
  useEffect(() => { void loadResidentialTenants(); }, []);
  const saveResidentialTenant = async () => {
    if (savingTenant) return;
    if (!canWrite) { setTenantError("ليس لديك صلاحية إضافة العملاء."); return; }
    const full_name = tenantForm.full_name.trim();
    if (!full_name) { setTenantError("اسم العميل مطلوب."); return; }
    if (tenantForm.email.trim() && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(tenantForm.email.trim())) {
      setTenantError("البريد الإلكتروني غير صحيح."); return;
    }
    setSavingTenant(true); setTenantError("");
    const { error } = await supabase.from("residential_tenants").insert({
      company_id: RESIDENTIAL_COMPANY_ID, full_name,
      phone: tenantForm.phone.trim() || null,
      identity_number: tenantForm.identity_number.trim() || null,
      nationality: tenantForm.nationality.trim() || null,
      email: tenantForm.email.trim() || null,
      notes: tenantForm.notes.trim() || null,
    });
    setSavingTenant(false);
    if (error) { setTenantError(`تعذر حفظ العميل: ${error.message}`); return; }
    setTenantModal(false);
    setTenantForm({ full_name: "", phone: "", identity_number: "", nationality: "", email: "", notes: "" });
    await loadResidentialTenants();
    setActionNotice("تم تسجيل العميل الجديد بنجاح.");
  };

  const [search, setSearch] = useState("");
  const [detailCategory, setDetailCategory] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const isSaveSuccess = actionNotice?.startsWith("تم حفظ بيانات الشقة في Supabase بنجاح") || actionNotice === "تم تسجيل العميل الجديد بنجاح.";
  useEffect(() => {
    if (!isSaveSuccess) return;
    const timeout = window.setTimeout(() => setActionNotice(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [actionNotice, isSaveSuccess]);
  const [operationModal, setOperationModal] = useState<"charge" | "collectCharge" | "rent" | "collectRent" | "types" | null>(null);
  const [operationType, setOperationType] = useState("كهرباء");
  const [operationAmount, setOperationAmount] = useState("");
  const [operationDate, setOperationDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [operationMonth, setOperationMonth] = useState(() => new Date().toLocaleDateString("en-CA").slice(0, 7));
  const [operationNotes, setOperationNotes] = useState("");
  const [operationApartments, setOperationApartments] = useState<string[]>([]);
  const [operationSearch, setOperationSearch] = useState("");
  const openOperationModal = (kind: "charge" | "collectCharge" | "rent" | "collectRent" | "types") => {
    setOperationType("كهرباء"); setOperationAmount(""); setOperationNotes("");
    setOperationApartments([]); setOperationSearch(""); setOperationModal(kind);
  };
  const [archivePicker, setArchivePicker] = useState(false);
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<"الكل" | ApartmentStatus>(
    "الكل"
  );
  const [typeFilter, setTypeFilter] = useState("الكل");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showModal, setShowModal] = useState(false);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(
    null
  );
  const [selectedApartment, setSelectedApartment] =
    useState<Apartment | null>(null);

  const [form, setForm] = useState({
    number: "",
    type: "غرفتين وصالة",
    rooms: "2",
    area: "",
    price: "",
    location: "",
    buildingName: "",
    rentCategory: "سنوي" as RentCategory,
    region: "",
    city: "",
    district: "",
    landmark: "",
    status: "متاحة" as ApartmentStatus,
    tenant: "",
    notes: "",
  });

  const availableCities = useMemo(() => Array.from(new Set([...(SAUDI_REGIONS[form.region] ?? []), ...(customChoices.cities[form.region] ?? [])])), [form.region, customChoices.cities]);

  const types = useMemo(
    () => ["الكل", ...Array.from(new Set([...apartmentTypes, ...apartments.map((item) => item.type)]))],
    [apartments, apartmentTypes]
  );

  const filteredApartments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return apartments.filter((apartment) => {
      if (archivedIds.includes(apartment.id)) return false;
      const matchesSearch =
        !query ||
        apartment.number.toLowerCase().includes(query) ||
        apartment.type.toLowerCase().includes(query) ||
        apartment.location.toLowerCase().includes(query) ||
        apartment.tenant?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "الكل" || apartment.status === statusFilter;

      const matchesType =
        typeFilter === "الكل" || apartment.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [apartments, archivedIds, search, statusFilter, typeFilter]);

  const activeApartments = apartments.filter((item) => !archivedIds.includes(item.id));
  const availableCount = activeApartments.filter(
    (item) => item.status === "متاحة"
  ).length;
  const reservedCount = activeApartments.filter((item) => item.status === "محجوزة").length;
  const rentedCount = activeApartments.filter(
    (item) => item.status === "مؤجرة"
  ).length;


  const resetForm = () => {
    setForm({
      number: "",
      type: "غرفتين وصالة",
      rooms: "2",
      area: "",
      price: "",
      location: "",
      buildingName: "",
      rentCategory: "سنوي",
      region: "",
      city: "",
      district: "",
      landmark: "",
      status: "متاحة",
      tenant: "",
      notes: "",
    });
    setEditingApartment(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (apartment: Apartment) => {
    setEditingApartment(apartment);
    setForm({
      number: apartment.number,
      type: apartment.type,
      rooms: String(apartment.rooms),
      area: String(apartment.area),
      price: String(apartment.price),
      location: apartment.location,
      buildingName: apartment.buildingName ?? "",
      rentCategory: apartment.rentCategory ?? "سنوي",
      region: apartment.region ?? "",
      city: apartment.city ?? "",
      district: apartment.district ?? (apartment.region ? "" : apartment.location),
      landmark: apartment.landmark ?? "",
      status: apartment.status,
      tenant: apartment.tenant ?? "",
      notes: apartment.notes ?? "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (savingApartment) return;
    if (!canWrite) { setActionNotice("ليس لديك صلاحية إضافة أو تعديل الشقق لهذه الشركة."); return; }
    const number = form.number.trim();
    const price = Number(form.price);
    const area = Number(form.area);
    const rooms = Number(form.rooms);
    if (!number || !form.area.trim() || !form.price.trim() ||
        !Number.isFinite(price) || price < 0 || !Number.isFinite(area) || area <= 0 ||
        !Number.isInteger(rooms) || rooms < 0) {
      setActionNotice("تأكد من رقم الشقة والمساحة والإيجار وعدد الغرف؛ القيم يجب أن تكون صحيحة."); return;
    }
    setSavingApartment(true);
    const payload = {
      company_id: RESIDENTIAL_COMPANY_ID,
      apartment_number: number,
      building_name: form.buildingName.trim() || null,
      rooms_count: rooms,
      rent_amount: price,
      rent_period: form.rentCategory,
      area_sqm: area,
      apartment_type: form.type,
      apartment_status: form.status,
      region: form.region || null,
      city: form.city || null,
      district_street: form.district.trim() || null,
      nearest_landmark: form.landmark.trim() || null,
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const query = editingApartment
      ? supabase.from("residential_apartments").update(payload)
          .eq("id", editingApartment.id).eq("company_id", RESIDENTIAL_COMPANY_ID)
      : supabase.from("residential_apartments").insert(payload);
    const { data, error } = await query.select("id").single();
    setSavingApartment(false);
    if (error || !data) {
      setActionNotice(`تعذر حفظ الشقة: ${error?.message ?? "لم يتم تأكيد الحفظ"}`); return;
    }
    setShowModal(false);
    resetForm();
    await loadResidentialApartments();
    setActionNotice("تم حفظ بيانات الشقة في Supabase بنجاح. بيانات المستأجر والعقد تُسجل من وحدتها المستقلة لاحقًا.");
  };

  const handleDelete = async (id: string) => {
    if (!canWrite) { setActionNotice("ليس لديك صلاحية حذف الشقق."); return; }
    const apartment = apartments.find((item) => item.id === id);
    if (!apartment || !window.confirm(`هل أنت متأكد من حذف ${apartment.number}؟`)) return;
    const { data, error } = await supabase.from("residential_apartments")
      .delete().eq("id", id).eq("company_id", RESIDENTIAL_COMPANY_ID)
      .select("id").maybeSingle();
    if (error || !data) {
      setActionNotice(`تعذر حذف الشقة: ${error?.message ?? "لم يتم تأكيد الحذف، وقد تكون الشقة مرتبطة بعقد"}`); return;
    }
    setArchivedIds((current) => current.filter((item) => item !== id));
    if (selectedApartment?.id === id) setSelectedApartment(null);
    await loadResidentialApartments();
    setActionNotice("تم حذف الشقة من قاعدة البيانات.");
  };

  return (
    <div className="min-h-full w-full px-4 pb-8 pt-4 text-white sm:px-6 lg:px-8">
      {/* Independent apartments dashboard — visual layout only; no building_state writes */}
      <section className="mx-auto max-w-[1600px]" dir="rtl">
        {/* Premium independent visual dashboard. Financial and contract data remain unconnected. */}
        <div className="relative mb-5 overflow-hidden rounded-[28px] border border-amber-300/35 bg-[#031e1b]/90 shadow-[0_20px_60px_rgba(0,0,0,.35)]">
          <div className="pointer-events-none absolute inset-0 opacity-70" style={{backgroundImage:"radial-gradient(ellipse at 50% 0%,rgba(0,170,131,.21),transparent 65%),linear-gradient(125deg,transparent 30%,rgba(234,189,75,.07) 55%,transparent 80%)"}} />
          <div className="pointer-events-none absolute -left-16 top-4 h-56 w-56 rounded-full border border-amber-400/15" />
          <div className="pointer-events-none absolute -right-16 top-4 h-56 w-56 rounded-full border border-amber-400/15" />
          <div className="relative flex flex-col items-center px-4 pb-7 pt-7 text-center sm:px-8">
            <div className="mb-3 grid h-16 w-16 place-items-center rounded-[23px] border border-amber-300/60 bg-gradient-to-br from-amber-200/20 via-[#153d31] to-[#08241f] text-amber-300 shadow-[0_0_28px_rgba(244,190,65,.25),inset_0_1px_0_rgba(255,255,255,.24)]"><Building2 size={34} strokeWidth={1.7}/></div>
            <h1 className="text-center text-[clamp(1.55rem,3vw,2.7rem)] font-black leading-tight tracking-wide text-white"><span className="text-amber-300">إدارة</span> الشقق والعقود</h1>
            <p className="mt-2 text-center text-sm font-semibold text-emerald-100/70">الشقق المتاحة والمؤجرة والحجوزات والتحصيلات</p>
            <div className="mt-6 grid w-full max-w-[1220px] grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_160px_160px_160px]">
              <div className="group relative min-w-0"><Search size={21} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-emerald-300"/><input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder="ابحث بالاسم أو رقم الهاتف أو رقم العقد أو رقم الشقة..." aria-label="البحث في الشقق" className="h-[66px] w-full rounded-2xl border border-emerald-300/45 bg-[#064138]/60 pr-12 pl-5 text-center text-sm font-semibold text-white shadow-[inset_0_1px_8px_rgba(0,0,0,.25),0_0_20px_rgba(14,192,148,.12)] outline-none backdrop-blur-xl placeholder:text-emerald-100/45 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/15"/></div>
              <button type="button" onClick={()=>setDetailCategory("تقارير الشقق")} className="group flex min-h-[66px] items-center justify-center gap-3 rounded-2xl border border-emerald-300/55 bg-gradient-to-br from-emerald-400/20 to-[#072e28] px-3 font-black text-white shadow-[0_0_22px_rgba(0,210,160,.12)] transition hover:-translate-y-1 hover:border-emerald-200"><FileBarChart2 className="text-emerald-300" size={26}/>تقارير الشقق</button>
              <button type="button" onClick={()=>setDetailCategory("تقارير العملاء")} className="group flex min-h-[66px] items-center justify-center gap-3 rounded-2xl border border-amber-300/60 bg-gradient-to-br from-amber-300/20 to-[#342a16]/60 px-3 font-black text-white shadow-[0_0_22px_rgba(242,182,45,.12)] transition hover:-translate-y-1 hover:border-amber-200"><ContactRound className="text-amber-300" size={26}/>تقارير العملاء</button>
              <button type="button" onClick={()=>setDetailCategory("تقارير الشهر")} className="group flex min-h-[66px] items-center justify-center gap-2 rounded-2xl border border-sky-300/55 bg-gradient-to-br from-sky-400/20 to-[#092b31] px-2 text-sm font-black text-white shadow-[0_0_22px_rgba(56,189,248,.12)] transition hover:-translate-y-1 hover:border-sky-200"><CalendarDays className="shrink-0 text-sky-300" size={24}/>تقارير الشهر</button>
            </div>
          </div>
        </div>

        {/* Eleven coordinated action cards — visual styling only; original handlers preserved. */}
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {([
            {label:"إضافة شقة",icon:<Plus size={35}/>,click:openAddModal,color:"#10B981",base:"#0C4439"},
            {label:"حذف / أرشفة شقة",icon:<Trash2 size={34}/>,click:()=>setArchivePicker(true),color:"#FB7185",base:"#452A37"},
            {label:"تحديث البيانات",icon:<RefreshCw size={34}/>,click:()=>{setSearch("");setStatusFilter("الكل");setTypeFilter("الكل");setActionNotice("تم تحديث العرض المحلي وإلغاء عوامل التصفية. هذه الصفحة غير مرتبطة بقاعدة البيانات بعد.");},color:"#38BDF8",base:"#123E50"},
            {label:"حجز جديد",icon:<CalendarPlus size={34}/>,click:()=>setActionNotice("الحجوزات الجديدة تحتاج إلى ربط نظام الحجوزات بقاعدة البيانات. لم يتم إنشاء حجز."),color:"#FBBF24",base:"#4A3E1D"},
            {label:"عميل جديد",icon:<UserRoundPlus size={34}/>,click:()=>{setTenantError("");setTenantModal(true);},color:"#C4B5FD",base:"#373052"},
            {label:"استعلام جديد",icon:<SearchCheck size={34}/>,click:()=>setActionNotice("نموذج الاستعلامات سيُربط بوحدة العملاء والاستعلامات لاحقًا. لم يتم حفظ استعلام."),color:"#22D3EE",base:"#10434B"},
          ]).map((a)=><button key={a.label} type="button" onClick={a.click}
            style={{borderColor:`${a.color}95`,background:`linear-gradient(155deg, ${a.base} 0%, #092c29 58%, #051c1a 100%)`,boxShadow:`inset 0 1px 0 ${a.color}35, 0 10px 26px rgba(0,0,0,.24)`}}
            className="group relative flex min-h-[120px] flex-col items-center justify-center gap-3 overflow-hidden rounded-[20px] border px-2 py-4 text-center font-black text-white backdrop-blur-2xl transition duration-300 hover:-translate-y-1.5 hover:brightness-125">
            <span className="pointer-events-none absolute inset-x-5 top-0 h-px opacity-70" style={{background:`linear-gradient(90deg,transparent,${a.color},transparent)`}}/>
            <span className="pointer-events-none absolute -right-5 -top-8 h-24 w-24 rounded-full opacity-15 blur-2xl" style={{backgroundColor:a.color}}/>
            <span className="relative transition-transform duration-300 group-hover:scale-110" style={{color:a.color,filter:`drop-shadow(0 0 10px ${a.color}50)`}}>{a.icon}</span>
            <span className="relative text-xs sm:text-sm">{a.label}</span>
          </button>)}
        </div>

        {/* Independent action cards. Modals do not write to building_state. */}
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {([
            {kind:"charge" as const,label:"إضافة فاتورة أو مستحقات",icon:<ReceiptText size={32}/>,color:"#FCD34D",base:"#463B20"},
            {kind:"collectCharge" as const,label:"تحصيل فاتورة أو مستحقات",icon:<Banknote size={32}/>,color:"#34D399",base:"#104B3C"},
            {kind:"rent" as const,label:"إضافة إيجار",icon:<CalendarPlus size={32}/>,color:"#60A5FA",base:"#1B3D60"},
            {kind:"collectRent" as const,label:"تحصيل إيجار",icon:<Banknote size={32}/>,color:"#A78BFA",base:"#39335C"},
            {kind:"types" as const,label:"أنواع الشقق",icon:<Building2 size={32}/>,color:"#67E8F9",base:"#174450"},
          ]).map((item)=><button key={item.kind} type="button" onClick={()=>openOperationModal(item.kind)}
            style={{borderColor:`${item.color}95`,background:`linear-gradient(155deg, ${item.base} 0%, #092c29 58%, #051c1a 100%)`,boxShadow:`inset 0 1px 0 ${item.color}35, 0 10px 26px rgba(0,0,0,.24)`}}
            className="group relative flex min-h-[135px] flex-col items-center justify-center gap-3 overflow-hidden rounded-[22px] border p-3 text-center backdrop-blur-2xl transition duration-300 hover:-translate-y-1.5 hover:brightness-125">
            <span className="pointer-events-none absolute inset-x-5 top-0 h-px opacity-70" style={{background:`linear-gradient(90deg,transparent,${item.color},transparent)`}}/>
            <span className="pointer-events-none absolute -right-5 -top-8 h-24 w-24 rounded-full opacity-15 blur-2xl" style={{backgroundColor:item.color}}/>
            <span className="relative rounded-2xl border bg-white/5 p-3 transition-transform duration-300 group-hover:scale-110" style={{color:item.color,borderColor:`${item.color}50`,filter:`drop-shadow(0 0 8px ${item.color}30)`}}>{item.icon}</span>
            <span className="relative text-xs font-black text-white sm:text-sm">{item.label}</span>
          </button>)}
        </div>

        <button type="button" onClick={()=>setDetailCategory("العقود القريبة من الانتهاء")} className="group relative mb-5 w-full overflow-hidden rounded-[25px] border border-amber-300/75 bg-gradient-to-l from-[#052e27] via-[#05221e] to-[#24351e] text-white shadow-[0_0_23px_rgba(244,191,53,.23),inset_0_1px_0_rgba(255,255,255,.18)] transition hover:border-amber-200 hover:shadow-[0_0_36px_rgba(244,191,53,.33)]">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent via-amber-100/[.035] to-transparent"/>
          <div className="relative grid min-h-[192px] grid-cols-1 items-center gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_1.6fr_minmax(0,1fr)]">
            <div className="hidden h-[154px] items-center justify-center lg:flex" aria-hidden="true"><svg width="230" height="152" viewBox="0 0 230 152" fill="none"><ellipse cx="115" cy="137" rx="106" ry="12" fill="#CDA84B" opacity=".16"/><rect x="44" y="24" width="115" height="108" rx="14" fill="#A47B27" stroke="#F4D06B" strokeWidth="2"/><rect x="52" y="38" width="99" height="86" rx="8" fill="#132C26"/><rect x="52" y="38" width="99" height="22" rx="7" fill="#D2AA48"/><path d="M74 18v23M130 18v23" stroke="#F7DE92" strokeWidth="9" strokeLinecap="round"/>{[0,1,2].map((i)=>[0,1,2].map((j)=><rect key={`${i}-${j}`} x={65+j*27} y={71+i*17} width="15" height="10" rx="2" fill="#E9C568" opacity={i===2&&j===2?.4:1}/>))}<circle cx="162" cy="110" r="30" fill="#0C332B" stroke="#F4D06B" strokeWidth="5"/><path d="M162 90v20l14 9" stroke="#F4D06B" strokeWidth="5" strokeLinecap="round"/><circle cx="162" cy="110" r="3" fill="#F4D06B"/></svg></div>
            <div className="flex flex-col items-center gap-2 text-center"><span className="rounded-full border border-amber-300/45 bg-amber-300/15 px-4 py-1 text-xs font-black text-amber-200">تنبيه العقود</span><h2 className="text-xl font-black text-amber-100 sm:text-2xl">العقود القريبة من الانتهاء</h2><p className="max-w-lg text-xs leading-6 text-emerald-100/65">متابعة العقود التي اقترب موعد انتهائها وتجديدها في الوقت المناسب</p><div className="mt-2 grid w-full max-w-lg grid-cols-2 gap-3"><div className="rounded-2xl border border-emerald-300/20 bg-black/20 p-3"><p className="text-xs text-emerald-100/60">عدد العقود القريبة</p><strong className="mt-1 block text-2xl text-white">—</strong></div><div className="rounded-2xl border border-amber-300/25 bg-black/20 p-3"><p className="text-xs text-emerald-100/60">أقرب تاريخ انتهاء</p><strong className="mt-1 block text-xl text-white">—</strong></div></div></div>
            <div className="flex justify-center"><span className="rounded-xl border border-amber-300/75 bg-amber-300/10 px-5 py-3 text-sm font-black text-amber-200 shadow-[0_0_15px_rgba(255,193,56,.15)]">عرض العقود وتواريخ الانتهاء ←</span></div>
          </div>
        </button>

        {/* Premium illustrated occupancy cards — local data only */}
        <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {([
            {label:"إجمالي الشقق",value:activeApartments.length,art:"building" as ArtKind,accent:"border-sky-300/55",note:"عرض التفاصيل"},
            {label:"إجمالي المؤجرة",value:rentedCount,art:"rented" as ArtKind,accent:"border-amber-300/55",note:"عرض التفاصيل"},
            {label:"إجمالي الفارغة",value:availableCount,art:"vacant" as ArtKind,accent:"border-emerald-300/55",note:"عرض التفاصيل"},
            {label:"إجمالي المحجوزة",value:reservedCount,art:"reserved" as ArtKind,accent:"border-violet-300/55",note:"عرض التفاصيل"},
          ]).map(item=><button key={item.label} type="button" onClick={()=>setDetailCategory(item.label)} className={`group relative flex min-h-[225px] flex-col items-center justify-center overflow-hidden rounded-[24px] border bg-gradient-to-br from-white/[.13] via-[#104036]/85 to-[#031c1a] px-3 py-4 text-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,.2),0_14px_30px_rgba(0,0,0,.3)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:brightness-110 ${item.accent}`}>
            <div className="pointer-events-none absolute -top-14 -right-14 h-40 w-40 rounded-full bg-white/[.06] blur-2xl"/>
            <div className="relative mb-1 transition duration-300 group-hover:scale-110"><CardIllustration kind={item.art}/></div>
            <h3 className="relative text-sm font-black sm:text-base">{item.label}</h3>
            <strong className="relative mt-1 text-3xl font-black tabular-nums">{item.value??"—"}</strong>
            <span className="relative mt-1 text-[11px] text-emerald-100/65">{item.note}</span>
          </button>)}
        </div>

        {/* Premium illustrated financial cards — no fabricated financial figures */}
        <div className="mb-6">
          <div className="mb-4 flex flex-col items-center text-center"><h2 className="text-2xl font-black text-amber-300">✦ الملخص المالي ✦</h2><p className="mt-1 text-xs text-emerald-100/60">ستظهر القيم بعد ربط البيانات المالية والفترة الزمنية</p></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {([
              {label:"إجمالي الإيجارات",art:"rent" as ArtKind,accent:"border-amber-300/55"},
              {label:"إجمالي المستحقات",art:"dues" as ArtKind,accent:"border-yellow-300/50"},
              {label:"إجمالي فواتير المياه",art:"water" as ArtKind,accent:"border-cyan-300/55"},
              {label:"إجمالي فواتير الكهرباء",art:"electric" as ArtKind,accent:"border-orange-300/55"},
            ]).map(item=><div key={item.label} className={`relative flex min-h-[288px] flex-col items-center overflow-hidden rounded-[24px] border bg-gradient-to-br from-white/[.13] via-[#0d3a32] to-[#041e1b] p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_14px_30px_rgba(0,0,0,.25)] backdrop-blur-2xl ${item.accent}`}>
              <div className="pointer-events-none absolute -top-10 left-0 h-28 w-28 rounded-full bg-white/[.05] blur-xl"/>
              <CardIllustration kind={item.art}/>
              <h3 className="mt-1 text-sm font-black text-white sm:text-base">{item.label}</h3>
              <div className="mt-2 text-2xl font-black text-white">— <span className="text-xs text-emerald-100/55">ريال</span></div>
              <div className="mt-auto grid w-full grid-cols-2 gap-2 pt-4">
                <div className="rounded-2xl border border-emerald-300/40 bg-emerald-400/10 px-2 py-3"><p className="text-xs font-black text-emerald-200">التحصيل</p><strong className="mt-1 block text-xl text-white">—</strong></div>
                <div className="rounded-2xl border border-amber-300/40 bg-amber-400/10 px-2 py-3"><p className="text-xs font-black text-amber-200">المتبقي</p><strong className="mt-1 block text-xl text-white">—</strong></div>
              </div>
            </div>)}
          </div>
        </div>

        {/* Filters */}
        <section className="mb-5 rounded-[24px] border border-sky-300/15 bg-slate-950/40 p-4 shadow-xl backdrop-blur-xl">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-200">
            <SlidersHorizontal size={18} className="text-amber-300" />
            تصفية وبحث الشقق
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(170px,1fr)_minmax(170px,1fr)_auto]">
            <FilterSelect
              value={statusFilter}
              onChange={(value) =>
                setStatusFilter(value as "الكل" | ApartmentStatus)
              }
              options={["الكل", ...apartmentStatuses]}
              label="الحالة"
            />

            <FilterSelect
              value={typeFilter}
              onChange={setTypeFilter}
              options={types}
              label="نوع الشقة"
            />

            <div className="flex h-12 overflow-hidden rounded-xl border border-white/10 bg-white/[0.045]">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex w-14 items-center justify-center transition ${
                  viewMode === "grid"
                    ? "bg-amber-300/15 text-amber-200"
                    : "text-slate-400 hover:bg-white/5"
                }`}
                title="عرض البطاقات"
              >
                <LayoutGrid size={19} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex w-14 items-center justify-center transition ${
                  viewMode === "list"
                    ? "bg-amber-300/15 text-amber-200"
                    : "text-slate-400 hover:bg-white/5"
                }`}
                title="عرض القائمة"
              >
                <List size={19} />
              </button>
            </div>
          </div>
        </section>

        {/* Content */}
        {loadError && <div className="mb-4 rounded-xl border border-rose-400/40 bg-rose-950/40 p-4 text-center text-sm text-rose-100">{loadError}</div>}
        {loadingApartments && <div className="mb-4 text-center text-sm text-emerald-200">جارٍ تحميل الشقق السكنية...</div>}
        {filteredApartments.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/15 bg-slate-950/35 px-6 py-20 text-center backdrop-blur-xl">
            <Home size={46} className="mx-auto mb-4 text-slate-500" />
            <h2 className="text-xl font-bold text-white">لا توجد شقق</h2>
            <p className="mt-2 text-sm text-slate-400">
              لا توجد شقق مضافة في هذا القسم حاليًا، أو لا توجد نتائج مطابقة للبحث.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredApartments.map((apartment) => (
              <ApartmentCard
                key={apartment.id}
                apartment={apartment}
                onView={() => setSelectedApartment(apartment)}
                onEdit={() => openEditModal(apartment)}
                onDelete={() => handleDelete(apartment.id)}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/45 shadow-xl backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-right">
                <thead className="border-b border-white/10 bg-white/[0.04] text-xs text-slate-400">
                  <tr>
                    <th className="px-5 py-4">الشقة</th>
                    <th className="px-5 py-4">النوع</th>
                    <th className="px-5 py-4">المساحة</th>
                    <th className="px-5 py-4">قيمة الإيجار</th>
                    <th className="px-5 py-4">الموقع</th>
                    <th className="px-5 py-4">الحالة</th>
                    <th className="px-5 py-4">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredApartments.map((apartment) => (
                    <tr
                      key={apartment.id}
                      className="transition hover:bg-white/[0.035]"
                    >
                      <td className="px-5 py-4 font-bold text-white">
                        {apartment.number}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {apartment.type}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {apartment.area} م²
                      </td>
                      <td className="px-5 py-4 font-bold text-amber-200">
                        {formatPrice(apartment.price)} ريال / {apartment.rentCategory ?? "سنوي"}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {apartment.location}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={apartment.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <SmallAction
                            icon={<Eye size={16} />}
                            label="عرض"
                            onClick={() => setSelectedApartment(apartment)}
                          />
                          <SmallAction
                            icon={<Pencil size={16} />}
                            label="تعديل"
                            onClick={() => openEditModal(apartment)}
                          />
                          <SmallAction
                            icon={<Trash2 size={16} />}
                            label="حذف"
                            danger
                            onClick={() => handleDelete(apartment.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {tenantModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-2 backdrop-blur-lg sm:p-5" dir="rtl"
          onMouseDown={event => { if (event.target === event.currentTarget && !savingTenant) setTenantModal(false); }}>
          <div role="dialog" aria-modal="true" aria-label="إضافة عميل جديد"
            className="relative w-full max-w-[1180px] overflow-hidden rounded-[30px] border border-amber-300/65 bg-[#052d27] text-white shadow-[0_30px_100px_rgba(0,0,0,.7)]"
            style={{maxHeight:"calc(100dvh - 24px)"}}>
            <div className="pointer-events-none absolute inset-0 bg-cover bg-center" style={{backgroundImage:"url('/add-client-bg.png')"}} />
            <div className="pointer-events-none absolute inset-0 bg-[#04261f]/40 lg:bg-transparent" />
            <button type="button" disabled={savingTenant} onClick={()=>setTenantModal(false)} aria-label="إغلاق النافذة"
              className="absolute left-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-amber-200/60 bg-[#032b25]/80 text-white hover:bg-emerald-700"><X size={21}/></button>
            <div className="relative grid max-h-[calc(100dvh-24px)] grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:overflow-hidden">
              <div className="min-w-0 p-5 sm:p-8 lg:max-h-[calc(100dvh-24px)] lg:overflow-y-auto lg:p-9">
                <div className="mb-5 flex items-center gap-3 border-b border-amber-300/25 pb-4">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl border border-amber-300/60 bg-emerald-950/80 text-amber-300"><UserRoundPlus size={31}/></span>
                  <div><h2 className="text-2xl font-black text-white sm:text-3xl">بيانات العميل</h2><p className="mt-1 text-xs text-emerald-100/75 sm:text-sm">الرجاء تعبئة البيانات التالية بدقة</p></div>
                </div>
                <form onSubmit={event=>{event.preventDefault();void saveResidentialTenant();}}>
                  <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    {([ ["full_name","الاسم الكامل *","text","أدخل الاسم الكامل للعميل"], ["phone","رقم الجوال","tel","05xxxxxxxx"], ["identity_number","رقم الهوية / الإقامة","text","أدخل رقم الهوية أو الإقامة"], ["email","البريد الإلكتروني","email","example@email.com"] ] as const).map(([key,label,type,placeholder])=>(
                      <label key={key} className="block text-sm font-bold text-emerald-50">{label}
                        <input value={tenantForm[key]} onChange={e=>setTenantForm(prev=>({...prev,[key]:e.target.value}))}
                          type={type} placeholder={placeholder} required={key==="full_name"}
                          className="mt-2 h-12 w-full rounded-xl border border-emerald-300/45 bg-[#013d32]/85 px-4 text-right text-sm text-white outline-none placeholder:text-emerald-100/45 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20" />
                      </label>
                    ))}
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-bold text-emerald-50">الجنسية</label>
                      <div className="flex gap-2">
                        <select value={tenantForm.nationality} onChange={e=>setTenantForm(prev=>({...prev,nationality:e.target.value}))}
                          className="h-12 min-w-0 flex-1 rounded-xl border border-emerald-300/45 bg-[#013d32] px-3 text-white outline-none focus:border-amber-300">
                          <option value="">اختر الجنسية</option>
                          {nationalities.map(item=><option key={item} value={item}>{item}</option>)}
                        </select>
                        <button type="button" onClick={()=>{setNewNationality("");setNationalityError("");setNationalityEditor(true);}}
                          className="flex h-12 shrink-0 items-center gap-2 rounded-xl border border-amber-300 bg-amber-300/15 px-4 font-black text-amber-200 transition hover:bg-amber-300/25"><Plus size={20}/> إضافة</button>
                      </div>
                    </div>
                    <label className="block text-sm font-bold text-emerald-50 sm:col-span-2">ملاحظات
                      <textarea value={tenantForm.notes} onChange={e=>setTenantForm(prev=>({...prev,notes:e.target.value}))} rows={3} maxLength={500}
                        placeholder="أدخل أي ملاحظات إضافية عن العميل (اختياري)"
                        className="mt-2 w-full resize-y rounded-xl border border-emerald-300/45 bg-[#013d32]/85 p-3 text-sm text-white outline-none placeholder:text-emerald-100/45 focus:border-amber-300" />
                      <span className="mt-1 block text-left text-xs text-emerald-100/55">{tenantForm.notes.length}/500</span>
                    </label>
                  </div>
                  {tenantError && <p role="alert" className="mt-3 rounded-xl border border-rose-300/50 bg-rose-950/70 p-3 text-sm text-rose-100">{tenantError}</p>}
                  <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
                    <button type="submit" disabled={savingTenant || !canWrite}
                      className="h-13 min-h-12 flex-1 rounded-xl border border-yellow-200/70 bg-gradient-to-b from-[#f8d675] to-[#bf9024] px-5 text-base font-black text-[#05281f] shadow-[0_5px_20px_rgba(245,189,62,.22)] disabled:opacity-50">{savingTenant?"جارٍ حفظ العميل...":"حفظ العميل"}</button>
                    <button type="button" disabled={savingTenant} onClick={()=>setTenantModal(false)} className="min-h-12 flex-1 rounded-xl border border-emerald-200/70 bg-emerald-950/65 px-5 font-black text-white">إلغاء</button>
                  </div>
                </form>
              </div>
              <div className="relative hidden min-h-[620px] flex-col justify-end p-7 text-center lg:flex" dir="rtl">
                <div className="rounded-2xl border border-amber-200/30 bg-[#032a24]/65 p-4 backdrop-blur-sm">
                  <h3 className="text-2xl font-black text-amber-200">إضافة عميل جديد</h3>
                  <p className="mt-2 text-sm leading-7 text-white/85">سجّل بيانات المستأجر واحفظها بأمان لربطها بالعقود والشقق لاحقًا</p>
                  <p className="mt-2 text-xs text-amber-100/70">العملاء المسجلون: {tenants.length}</p>
                </div>
              </div>
            </div>
            {nationalityEditor && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" onMouseDown={e=>{if(e.target===e.currentTarget&&!savingNationality)setNationalityEditor(false);}}>
                <form onSubmit={e=>{e.preventDefault();void saveNationality();}} className="w-full max-w-md rounded-[24px] border border-amber-300/65 bg-gradient-to-br from-[#0b493b] to-[#03261f] p-6 shadow-2xl">
                  <h3 className="mb-2 flex items-center gap-2 text-xl font-black text-amber-200"><Plus size={22}/> إضافة جنسية جديدة</h3>
                  <p className="mb-4 text-xs leading-6 text-emerald-100/75">سيتم حفظ الجنسية في Supabase لتظهر لاحقًا لجميع المستخدمين المصرح لهم في نفس الشركة.</p>
                  <label className="block text-sm font-bold">اسم الجنسية
                    <input autoFocus value={newNationality} maxLength={80} onChange={e=>setNewNationality(e.target.value)} placeholder="مثال: مصري"
                      className="mt-2 h-12 w-full rounded-xl border border-emerald-300/45 bg-[#02382f] px-4 text-white outline-none focus:border-amber-300" />
                  </label>
                  {nationalityError && <p role="alert" className="mt-3 text-sm text-rose-200">{nationalityError}</p>}
                  <div className="mt-5 flex gap-3">
                    <button type="submit" disabled={savingNationality || !canWrite} className="min-h-12 flex-1 rounded-xl bg-amber-300 font-black text-emerald-950 disabled:opacity-50">{savingNationality?"جارٍ الحفظ...":"حفظ الجنسية"}</button>
                    <button type="button" disabled={savingNationality} onClick={()=>setNationalityEditor(false)} className="min-h-12 flex-1 rounded-xl border border-white/25 font-bold">إلغاء</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
      {operationModal && (() => {
        const isTypes = operationModal === "types";
        const isCollection = operationModal === "collectCharge" || operationModal === "collectRent";
        const isRent = operationModal === "rent" || operationModal === "collectRent";
        const title = isTypes ? "أنواع الشقق" : isRent ? (isCollection ? "تحصيل إيجار" : "إضافة إيجار") : (isCollection ? "تحصيل فاتورة أو مستحقات" : "إضافة فاتورة أو مستحقات");
        const visible = activeApartments.filter(a => a.number.toLowerCase().includes(operationSearch.toLowerCase()) || (a.tenant || "").toLowerCase().includes(operationSearch.toLowerCase()));
        const accent = isTypes ? "#93c5fd" : isCollection ? "#f6c84a" : "#67e8f9";
        const inputClass = "mt-1.5 block h-11 w-full min-w-0 rounded-xl border border-sky-400/25 bg-[#0a2036] px-3 text-center text-sm font-semibold text-white outline-none focus:border-cyan-300";
        return (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-3 backdrop-blur-xl sm:p-5" onMouseDown={e => { if (e.target === e.currentTarget) setOperationModal(null); }}>
            <div dir="rtl" role="dialog" aria-modal="true" aria-label={title}
              className="relative flex w-full flex-col overflow-hidden rounded-[28px] border bg-[#061426] text-white shadow-[0_0_100px_rgba(0,0,0,.6)]"
              style={{ width: "min(1120px, calc(100vw - 32px))", maxWidth: "1120px", maxHeight: "min(800px, calc(100dvh - 32px))", borderColor: `${accent}88`, boxSizing: "border-box" }}>
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[2px]" style={{background:`linear-gradient(90deg,transparent,${accent},transparent)`}} />
              <header className="relative shrink-0 border-b border-white/10 bg-gradient-to-r from-[#050d18] via-[#09213a] to-[#061426] px-5 py-4 sm:px-7">
                <div className="flex items-center justify-center gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border bg-white/5" style={{color:accent,borderColor:`${accent}66`}}>{isTypes ? <Building2 size={30}/> : isCollection ? <Banknote size={30}/> : isRent ? <CalendarPlus size={30}/> : <ReceiptText size={30}/>}</span>
                  <div className="min-w-0 text-center"><h2 className="text-xl font-black sm:text-2xl lg:text-3xl" style={{color:accent}}>{title}</h2><p className="mt-1 text-xs font-semibold text-slate-400 sm:text-sm">{isTypes ? "إدارة أنواع الشقق وأرقامها" : "تسجيل العملية للشقق المحددة"}</p></div>
                  <button type="button" onClick={()=>setOperationModal(null)} aria-label="إغلاق" className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-rose-500/20"><X size={22}/></button>
                </div>
              </header>
              <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
                <div className="mb-4 rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-2.5 text-center text-xs font-semibold leading-5 text-amber-200">هذه النافذة للمعاينة والتجهيز فقط. الحفظ في قاعدة البيانات غير مفعّل حاليًا، ولن تتأثر بيانات العمائر.</div>
                {isTypes ? (
                  <div className="grid min-h-0 grid-cols-1 gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                    <section className="rounded-3xl border border-blue-400/25 bg-[#081c31]/85 p-4 sm:p-5">
                      <div className="mb-4 text-center"><h3 className="text-lg font-black text-blue-200">أنواع الشقق المتاحة</h3><p className="text-xs text-slate-400">الأنواع المسجلة داخل هذه الصفحة</p></div>
                      <div className="max-h-[390px] space-y-2 overflow-y-auto pr-1">{types.filter(t=>t!=="الكل").length ? types.filter(t=>t!=="الكل").map(t=><div key={t} className="flex items-center justify-between gap-2 rounded-xl border border-blue-300/15 bg-[#0b2137] p-3 text-sm"><strong>{t}</strong><span className="text-blue-300">{activeApartments.filter(a=>a.type===t).length} شقة</span></div>) : <p className="py-12 text-center text-sm text-slate-400">لا توجد أنواع مسجلة حاليًا.</p>}</div>
                    </section>
                    <section className="rounded-3xl border border-blue-400/25 bg-[#081c31]/85 p-4 sm:p-5">
                      <div className="mb-5 text-center"><h3 className="text-lg font-black text-blue-200">إضافة نوع وتحديد الشقق</h3><p className="text-xs text-slate-400">سيتم تفعيل الإدارة بعد ربط بيانات الشقق والصلاحيات</p></div>
                      <label className="mb-4 block text-center text-sm font-bold">اسم نوع الشقة<input disabled placeholder="اكتب اسم النوع الجديد" className={`${inputClass} disabled:opacity-50`}/></label>
                      <label className="mb-4 block text-center text-sm font-bold">قيمة الإيجار الشهري (ريال)<input disabled placeholder="0.00" className={`${inputClass} disabled:opacity-50`}/></label>
                      <div className="rounded-2xl border border-blue-300/15 bg-[#0a2036] px-4 py-10 text-center text-sm text-slate-400">اختيار أرقام الشقق وتوزيع الأنواع سيتاح بعد الربط</div>
                    </section>
                  </div>
                ) : (
                  <div className="grid min-h-0 grid-cols-1 gap-5 lg:grid-cols-[1fr_1.1fr]">
                    <section className="flex min-h-[440px] min-w-0 flex-col rounded-3xl border border-cyan-400/25 bg-[#081c31]/85 p-4 sm:p-5">
                      <div className="mb-4 text-center"><h3 className="text-xl font-black text-white">اختيار الشقق <span className="text-sm text-cyan-300">({operationApartments.length} محددة)</span></h3><p className="mt-1 text-xs text-slate-400">حدد الشقق المطلوب تسجيل العملية لها</p></div>
                      <div className="mb-3 flex flex-wrap gap-2"><button type="button" onClick={()=>setOperationApartments(activeApartments.map(a=>a.number))} className="flex-1 rounded-xl border border-cyan-400/35 bg-cyan-400/10 px-3 py-2 text-sm font-bold text-cyan-200">✓ تحديد الكل</button><button type="button" onClick={()=>setOperationApartments([])} className="rounded-xl border border-white/15 px-3 py-2 text-sm text-slate-300">إلغاء التحديد</button></div>
                      <div className="mb-3 grid grid-cols-2 gap-2"><div className="rounded-lg border border-white/10 bg-[#0b2137] p-2 text-center text-xs">كل أنواع الشقق</div><div className="rounded-lg border border-white/10 bg-[#0b2137] p-2 text-center text-xs">كل الحالات</div></div>
                      <input value={operationSearch} onChange={e=>setOperationSearch(e.target.value)} placeholder="ابحث برقم الشقة أو اسم المستأجر..." aria-label="بحث الشقق" className={`${inputClass} mb-3 mt-0`}/>
                      <div className="min-h-[180px] max-h-[340px] flex-1 space-y-1.5 overflow-y-auto rounded-xl border border-white/10 bg-[#08172a] p-2">{visible.length ? visible.map(a=><label key={a.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0c2138] px-3 py-2.5 transition hover:border-cyan-300/40"><span className="min-w-0"><strong className="block text-sm">شقة {a.number}</strong><small className="block truncate text-xs text-slate-400">{a.type} · {a.status}</small></span><input type="checkbox" checked={operationApartments.includes(a.number)} onChange={e=>setOperationApartments(prev=>e.target.checked?[...prev,a.number]:prev.filter(n=>n!==a.number))} className="h-5 w-5 shrink-0 accent-cyan-400"/></label>) : <p className="py-14 text-center text-sm text-slate-400">لا توجد شقق مرتبطة بهذه الصفحة أو مطابقة للبحث حاليًا.</p>}</div>
                      <div className="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-300/5 px-3 py-2 text-center text-xs font-bold text-cyan-200">تم اختيار {operationApartments.length} شقة</div>
                    </section>
                    <section className="min-w-0 rounded-3xl border border-cyan-400/25 bg-[#081c31]/85 p-4 sm:p-5">
                      <div className="mb-4 text-center"><h3 className="text-xl font-black text-white">بيانات {isRent ? "الإيجار" : "المستحق"}</h3><p className="mt-1 text-xs text-slate-400">نفس البيانات تُطبق على جميع الشقق المحددة</p></div>
                      <div className="space-y-3">
                        {!isRent && <label className="block text-center text-sm font-bold">نوع المستحق<select value={operationType} onChange={e=>setOperationType(e.target.value)} className={inputClass}><option>كهرباء</option><option>مياه</option><option>صيانة</option><option>مستحقات أخرى</option></select></label>}
                        <label className="block text-center text-sm font-bold">المبلغ لكل شقة (ريال)<input type="number" min="0" value={operationAmount} onChange={e=>setOperationAmount(e.target.value)} placeholder="اكتب المبلغ" className={inputClass}/></label>
                        <label className="block text-center text-sm font-bold">المستحق عن شهر / أشهر<input type="month" value={operationMonth} onChange={e=>setOperationMonth(e.target.value)} className={inputClass}/></label>
                        <label className="block text-center text-sm font-bold">تاريخ {isCollection ? "التحصيل" : "الإدخال"}<input type="date" value={operationDate} onChange={e=>setOperationDate(e.target.value)} className={inputClass}/></label>
                        <label className="block text-center text-sm font-bold">ملاحظات<textarea rows={3} value={operationNotes} onChange={e=>setOperationNotes(e.target.value)} placeholder="اكتب أي ملاحظات إضافية..." className="mt-1.5 block w-full resize-y rounded-xl border border-sky-400/25 bg-[#0a2036] p-3 text-center text-sm text-white outline-none focus:border-cyan-300"/></label>
                        <div className="overflow-hidden rounded-xl border border-cyan-300/20 bg-[#071b2b]"><div className="flex items-center justify-between px-3 py-2 text-xs"><span>عدد الشقق المحددة</span><strong className="text-cyan-300">{operationApartments.length}</strong></div><div className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-xs"><span>إجمالي العملية</span><strong className="text-cyan-300">{operationAmount && Number.isFinite(Number(operationAmount)) ? formatPrice(Math.max(0,Number(operationAmount))*operationApartments.length) : "—"} ريال</strong></div></div>
                      </div>
                    </section>
                  </div>
                )}
              </main>
              <footer className="grid shrink-0 grid-cols-2 gap-3 border-t border-white/10 bg-[#07172a] p-3 sm:px-5"><button type="button" onClick={()=>setOperationModal(null)} className="min-h-12 rounded-xl border border-white/15 bg-white/5 text-base font-black text-slate-200 transition hover:bg-white/10">✕ إغلاق</button><button type="button" disabled title="الحفظ غير مفعّل حتى ربط القسم بقاعدة البيانات" className="min-h-12 cursor-not-allowed rounded-xl bg-gradient-to-l from-cyan-600/50 to-blue-600/50 text-base font-black text-white opacity-55">✓ {isTypes ? "حفظ توزيع النوع" : "حفظ العملية"}</button></footer>
            </div>
          </div>
        );
      })()}
      {actionNotice && (isSaveSuccess ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" dir="rtl" role="status" aria-live="polite">
          <style>{`@keyframes residential-save-progress { from { width: 100%; } to { width: 0%; } }`}</style>
          <div className="relative w-full max-w-[580px] overflow-hidden rounded-[28px] border border-emerald-300/50 bg-gradient-to-br from-[#104d3d] via-[#092d27] to-[#061c1a] px-7 pb-9 pt-10 text-center text-white shadow-[0_24px_90px_rgba(0,0,0,.6),0_0_35px_rgba(52,211,153,.15)] sm:px-10">
            <button type="button" onClick={() => setActionNotice(null)} aria-label="إغلاق رسالة النجاح" className="absolute left-4 top-4 rounded-xl border border-white/15 bg-white/5 p-2 text-emerald-100 transition hover:bg-white/15"><X size={20}/></button>
            <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full border-2 border-emerald-300/60 bg-emerald-400/15 text-4xl font-black text-emerald-200 shadow-[0_0_35px_rgba(52,211,153,.25)]">✓</div>
            <h2 className="mb-4 text-2xl font-black text-emerald-200 sm:text-3xl">{actionNotice === "تم تسجيل العميل الجديد بنجاح." ? "تم حفظ العميل بنجاح" : "تم حفظ الشقة بنجاح"}</h2>
            <p className="mx-auto max-w-md text-base font-semibold leading-8 text-emerald-50/90 sm:text-lg">{actionNotice === "تم تسجيل العميل الجديد بنجاح." ? "تم تسجيل بيانات العميل في Supabase بنجاح." : "تم حفظ بيانات الشقة في Supabase بنجاح."}</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-emerald-100/65">{actionNotice === "تم تسجيل العميل الجديد بنجاح." ? "يمكن الآن استخدام بيانات العميل عند إنشاء عقد إيجار." : "بيانات المستأجر والعقد تُسجّل من وحدتها المستقلة لاحقًا."}</p>
            <div className="mt-7 text-sm font-bold text-emerald-200/85">تُغلق الرسالة تلقائيًا بعد 5 ثوانٍ</div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-black/35" dir="ltr">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 shadow-[0_0_14px_rgba(110,231,183,.7)]" style={{ width: "100%", animation: "residential-save-progress 5s linear forwards" }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4" onMouseDown={(e)=>{if(e.target===e.currentTarget)setActionNotice(null)}}><div dir="rtl" className="w-full max-w-md rounded-2xl border border-amber-400/35 bg-[#09271f] p-6 text-white"><h2 className="mb-3 text-lg font-black text-amber-300">تنبيه</h2><p className="text-sm leading-7">{actionNotice}</p><button type="button" onClick={()=>setActionNotice(null)} className="mt-5 rounded-xl bg-amber-400/20 px-5 py-2 font-bold">إغلاق</button></div></div>
      ))}
      {detailCategory && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4" onMouseDown={(e)=>{if(e.target===e.currentTarget)setDetailCategory(null)}}><div dir="rtl" className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-amber-400/35 bg-[#09271f] p-6 text-white"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black text-amber-300">{detailCategory}</h2><button type="button" onClick={()=>setDetailCategory(null)}><X/></button></div>{["إجمالي الشقق","إجمالي المؤجرة","إجمالي الفارغة","إجمالي المحجوزة"].includes(detailCategory) ? <div className="space-y-2">{activeApartments.filter((a)=>detailCategory==="إجمالي الشقق" || (detailCategory==="إجمالي المؤجرة" ? a.status==="مؤجرة" : detailCategory==="إجمالي المحجوزة" ? a.status==="محجوزة" : a.status==="متاحة")).map((a)=><div key={a.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"><strong>{a.number}</strong><span className="text-sm text-emerald-100/70">{a.type} • {a.status}</span></div>)}</div> : <p className="leading-7 text-emerald-100/75">لم تُربط بيانات {detailCategory} بعد. لا توجد تفاصيل موثوقة يمكن عرضها حاليًا.</p>}<p className="mt-4 text-xs text-amber-200/70">هذه الصفحة مستقلة عن بيانات العمائر. بيانات التقارير والعقود لم تُربط بعد.</p></div></div>}
      {archivePicker && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4" onMouseDown={(e)=>{if(e.target===e.currentTarget)setArchivePicker(false)}}><div dir="rtl" className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-amber-400/35 bg-[#09271f] p-6 text-white"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black text-amber-300">أرشفة الشقق المحلية</h2><button type="button" onClick={()=>setArchivePicker(false)}><X/></button></div><p className="mb-4 text-xs text-emerald-100/60">الأرشفة هنا مؤقتة داخل الصفحة ولا تعدّل بيانات Supabase.</p>{apartments.map((a)=><div key={a.id} className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-white/10 p-3"><span>{a.number}</span><button type="button" onClick={()=>setArchivedIds((current)=>current.includes(a.id)?current.filter((id)=>id!==a.id):[...current,a.id])} className="rounded-lg border border-amber-300/30 px-3 py-1 text-sm text-amber-200">{archivedIds.includes(a.id)?"استعادة":"أرشفة"}</button></div>)}</div></div>}

       {/* Add / edit apartment — residential_apartments only, never building_state */}
      <style>{`.apartment-entry-modal label{display:block;min-width:0}.apartment-entry-modal label>span{font-size:14px;font-weight:800;margin-bottom:7px;color:#f1f8f4}.apartment-entry-modal label>input,.apartment-entry-modal label>select{height:48px;min-width:0;width:100%;background:#062b25;border:1px solid rgba(180,220,198,.36);border-radius:12px;padding:0 14px;font-size:14px;box-sizing:border-box}.apartment-entry-modal label>input:focus,.apartment-entry-modal label>select:focus{border-color:#e5bc54;outline:none}`}</style>
      {/* Add / edit modal — compact layout matching Add Building */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowModal(false); }}>
          <div dir="rtl" role="dialog" aria-modal="true" aria-label={editingApartment ? "تعديل بيانات الشقة" : "إضافة شقة جديدة"}
            className="apartment-entry-modal relative flex w-full flex-col overflow-hidden rounded-[26px] border border-amber-400/50 bg-[#04271f] text-white shadow-[0_25px_85px_rgba(0,0,0,.7)]"
            style={{ maxWidth: "1160px", maxHeight: "min(850px, 94dvh)" }}>
            <header className="relative flex shrink-0 items-center justify-center border-b border-amber-300/30 bg-[#06382e] px-14 py-4 text-center">
              <div className="flex flex-col items-center gap-1">
                <p className="text-[11px] font-extrabold tracking-[.18em] text-amber-300">AQARY SMART</p>
                <h2 className="flex items-center justify-center gap-2 text-2xl font-black text-white sm:text-[28px]"><Home size={25} className="text-amber-300"/>{editingApartment ? "تعديل بيانات الشقة" : "إضافة شقة جديدة"}</h2>
                <p className="text-sm font-medium text-emerald-100/80">أدخل بيانات الشقة وموقعها بالتفصيل</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} aria-label="إغلاق" className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl border border-white/20 bg-white/5 hover:bg-white/10"><X size={20}/></button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
              <div className="grid min-h-full grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
                <div className="min-w-0 overflow-y-auto p-5 sm:p-7 lg:max-h-[720px]">
                  <div className="mb-3 flex items-center gap-2 border-b border-amber-300/20 pb-2 text-base font-black text-amber-200"><Building2 size={18}/> بيانات الشقة الأساسية</div>
                  <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                    <FormInput label="رقم / اسم الشقة *" value={form.number} onChange={(value) => setForm({ ...form, number: value })} placeholder="مثال: 1/6A أو شقة 101" />
                    <FormInput label="اسم العمارة" value={form.buildingName} onChange={(value) => setForm({ ...form, buildingName: value })} placeholder="مثال: عمارة سنتر" />
                    <FormInput label="عدد الغرف" type="number" value={form.rooms} onChange={(value) => setForm({ ...form, rooms: value })} placeholder="2" />
                    <FormInput label={`قيمة الإيجار (${form.rentCategory}) بالريال *`} type="number" value={form.price} onChange={(value) => setForm({ ...form, price: value })} placeholder="مثال: 2500" />
                    <FormSelect label="الفئة / مدة الإيجار" value={form.rentCategory} onChange={(value) => setForm({ ...form, rentCategory: value as RentCategory })} options={["يومي", "شهري", "سنوي"]} />
                    <FormInput label="المساحة (م²) *" type="number" value={form.area} onChange={(value) => setForm({ ...form, area: value })} placeholder="100" />
                    <div className="relative min-w-0">
                      <button type="button" title="إضافة نوع الشقة" aria-label="إضافة نوع الشقة" onClick={() => openChoiceEditor("type")} className="absolute left-0 top-0 z-10 grid h-6 w-6 place-items-center rounded-md border border-amber-300/55 bg-amber-300/15 text-amber-200 transition hover:bg-amber-300/30"><Plus size={15} strokeWidth={2.6}/></button>
                      <FormSelect label="نوع الشقة" value={form.type} onChange={(value) => setForm({ ...form, type: value })} options={apartmentTypes} />
                    </div>
                    <div className="relative min-w-0">
                      <button type="button" title="إضافة حالة الشقة" aria-label="إضافة حالة الشقة" onClick={() => openChoiceEditor("status")} className="absolute left-0 top-0 z-10 grid h-6 w-6 place-items-center rounded-md border border-amber-300/55 bg-amber-300/15 text-amber-200 transition hover:bg-amber-300/30"><Plus size={15} strokeWidth={2.6}/></button>
                      <FormSelect label="حالة الشقة" value={form.status} onChange={(value) => setForm({ ...form, status: value as ApartmentStatus, tenant: value === "مؤجرة" ? form.tenant : "" })} options={apartmentStatuses} />
                    </div>
                    {form.status === "مؤجرة" && <FormInput label="اسم المستأجر" value={form.tenant} onChange={(value) => setForm({ ...form, tenant: value })} placeholder="اسم المستأجر" />}
                  </div>
                  <div className="mb-3 mt-5 flex items-center gap-2 border-b border-amber-300/20 pb-2 text-base font-black text-amber-200"><MapPin size={18}/> الموقع والعنوان</div>
                  <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                    <FormSelect label="المنطقة الإدارية" value={form.region} onChange={(value) => setForm({ ...form, region: value, city: "" })} options={["", ...Object.keys(SAUDI_REGIONS)]} />
                    <div className="relative min-w-0">
                      <button type="button" title="إضافة المدينة / المحافظة" aria-label="إضافة المدينة / المحافظة" onClick={() => openChoiceEditor("city")} className="absolute left-0 top-0 z-10 grid h-6 w-6 place-items-center rounded-md border border-amber-300/55 bg-amber-300/15 text-amber-200 transition hover:bg-amber-300/30"><Plus size={15} strokeWidth={2.6}/></button>
                      <FormSelect label="المدينة / المحافظة" value={form.city} onChange={(value) => setForm({ ...form, city: value })} options={["", ...availableCities]} />
                    </div>
                    <FormInput label="الحي / الشارع" value={form.district} onChange={(value) => setForm({ ...form, district: value })} placeholder="مثال: حي الفناتير" />
                    <FormInput label="أقرب معلم" value={form.landmark} onChange={(value) => setForm({ ...form, landmark: value })} placeholder="مثال: صيدلية النهدي" />
                  </div>
                  <label className="mt-4 block min-w-0"><span className="mb-1.5 block text-xs font-bold text-emerald-50">ملاحظات إضافية</span><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={2} placeholder="اكتب أي ملاحظات خاصة بالشقة..." className="w-full resize-y rounded-xl border border-emerald-200/35 bg-[#062b25] px-4 py-3 text-sm text-white outline-none placeholder:text-emerald-100/40 focus:border-amber-300/70"/></label>
                </div>
                <aside className="relative hidden min-h-[540px] overflow-hidden border-r border-amber-300/20 lg:block" style={{ backgroundImage: "linear-gradient(0deg,rgba(2,31,26,.5),rgba(2,31,26,.05)),url('/aqary-smart-background.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#031e19]/75 via-transparent to-[#031e19]/10"/>
                  <div className="relative flex h-full flex-col items-center justify-end px-6 pb-9 text-center">
                    <div className="w-full max-w-[320px] rounded-2xl border border-amber-300/35 bg-[#042a23]/85 px-6 py-5 shadow-2xl backdrop-blur-sm">
                      <h3 className="text-2xl font-black text-amber-200">أضف شقتك الجديدة</h3>
                      <p className="mt-3 text-sm leading-7 text-emerald-100/90">إدارة منظمة لشققك وعقاراتك داخل عقاري سمارت</p>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
            <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-amber-300/25 bg-[#052a23] px-5 py-3 sm:px-6">
              <button type="button" onClick={() => setShowModal(false)} className="min-h-12 rounded-xl border border-emerald-200/25 bg-white/5 px-6 text-sm font-bold text-emerald-100 hover:bg-white/10">إلغاء</button>
              <button type="button" onClick={() => { void handleSave(); }} disabled={savingApartment || !canWrite} className="min-h-12 rounded-xl border border-amber-200/40 bg-gradient-to-l from-[#f3d477] to-[#b88828] px-7 text-sm font-black text-[#09251f] shadow-lg hover:brightness-110">{savingApartment ? "جارٍ الحفظ..." : editingApartment ? "حفظ التعديلات" : "حفظ وإضافة الشقة"}</button>
            </footer>
          </div>
        </div>
      )}

      {choiceEditor && showModal && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setChoiceEditor(null); }}>
          <div dir="rtl" role="dialog" aria-modal="true" aria-label="إضافة اختيار جديد" className="relative mx-auto w-full max-w-[490px] overflow-hidden rounded-[24px] border border-amber-300/45 bg-gradient-to-b from-[#0b3a30] to-[#05251f] text-white shadow-[0_28px_90px_rgba(0,0,0,.65)]" style={{ width: "min(490px, calc(100vw - 32px))", maxHeight: "calc(100dvh - 36px)", boxSizing: "border-box" }}>
            <div className="relative border-b border-amber-300/25 bg-[#0a332b] px-7 pb-5 pt-7 text-center">
              <button type="button" onClick={() => setChoiceEditor(null)} aria-label="إغلاق" className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/85 transition hover:bg-white/15"><X size={19}/></button>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/40 bg-amber-300/10 text-2xl font-black text-amber-200">+</div>
              <h3 className="text-center text-[22px] font-black leading-8 text-amber-200">{choiceEditor === "city" ? "إضافة مدينة / محافظة" : choiceEditor === "type" ? "إضافة نوع شقة" : "إضافة حالة شقة"}</h3>
              <p className="mt-1 text-center text-sm font-medium text-emerald-100/75">أدخل الاسم الجديد لإضافته إلى قائمة الاختيارات</p>
            </div>
            <div className="px-7 pb-7 pt-6 text-center">
              {choiceEditor === "city" && <p className="mb-5 rounded-xl border border-amber-300/20 bg-amber-200/5 px-3 py-3 text-center text-sm text-emerald-100">المنطقة المختارة: <strong className="text-amber-200">{form.region || "اختر المنطقة أولًا"}</strong></p>}
              <label className="block text-center text-base font-extrabold text-white">الاسم الجديد
                <input autoFocus value={newChoice} onChange={(event) => { setNewChoice(event.target.value); setChoiceError(""); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); saveChoice(); } }} maxLength={80} placeholder={choiceEditor === "city" ? "مثال: الجبيل الصناعية" : choiceEditor === "type" ? "مثال: شقة مفروشة" : "مثال: تحت الصيانة"} className="mt-3 h-[52px] w-full rounded-xl border border-emerald-200/35 bg-[#031e1a] px-4 text-center text-base font-semibold text-white placeholder:text-emerald-100/40 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-300/15"/>
              </label>
              {choiceError && <p role="alert" className="mt-3 text-center text-sm font-bold text-rose-300">{choiceError}</p>}
              <p className="mx-auto mt-4 max-w-[390px] text-center text-[13px] leading-6 text-emerald-100/70">سيُحفظ الاختيار في هذا المتصفح فقط. المزامنة بين الأجهزة تحتاج إلى ربط قاعدة البيانات.</p>
              <div className="mt-6 grid grid-cols-[1fr_1.7fr] gap-3">
                <button type="button" onClick={() => setChoiceEditor(null)} className="min-h-[48px] rounded-xl border border-white/20 bg-white/5 px-4 text-base font-bold text-white transition hover:bg-white/10">إلغاء</button>
                <button type="button" onClick={saveChoice} className="min-h-[48px] rounded-xl border border-amber-200/30 bg-gradient-to-l from-[#f3d477] to-[#b88828] px-4 text-base font-black text-[#09251f] shadow-md transition hover:brightness-110">حفظ وإضافة</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details modal */}
      {selectedApartment && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedApartment(null);
          }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-sky-300/20 bg-[#071f1b] shadow-2xl">
            <div className="border-b border-white/10 bg-gradient-to-l from-sky-500/10 to-transparent p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-300/25 bg-sky-400/10">
                    <Home size={28} className="text-sky-200" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-white">
                      {selectedApartment.number}
                    </h2>
                    <p className="text-sm text-slate-400">
                      {selectedApartment.type}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedApartment(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-white/10">
              <DetailItem
                icon={<Ruler size={18} />}
                label="المساحة"
                value={`${selectedApartment.area} م²`}
              />
              <DetailItem
                icon={<Banknote size={18} />}
                label="قيمة الإيجار"
                value={`${formatPrice(selectedApartment.price)} ريال / ${selectedApartment.rentCategory ?? "سنوي"}`}
              />
              <DetailItem
                icon={<MapPin size={18} />}
                label="الموقع"
                value={selectedApartment.location}
              />
              <DetailItem
                icon={<Building2 size={18} />}
                label="عدد الغرف"
                value={`${selectedApartment.rooms} غرف`}
              />
            </div>

            <div className="p-6">
              <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div>
                  <p className="text-xs text-slate-500">حالة الشقة</p>
                  <div className="mt-2">
                    <StatusBadge status={selectedApartment.status} />
                  </div>
                </div>

                {selectedApartment.tenant && (
                  <div className="text-left">
                    <p className="text-xs text-slate-500">المستأجر</p>
                    <p className="mt-1 font-bold text-white">
                      {selectedApartment.tenant}
                    </p>
                  </div>
                )}
              </div>

              {selectedApartment.notes && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="mb-1 text-xs text-slate-500">ملاحظات</p>
                  <p className="text-sm leading-7 text-slate-300">
                    {selectedApartment.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <label className="relative">
      <span className="absolute right-4 top-1.5 z-10 text-[10px] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-[#09251f] px-4 pb-0 pt-3 text-sm font-bold text-white outline-none transition focus:border-amber-300/45"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#09251f] text-white">
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 mt-1 -translate-y-1/2 text-slate-400"
      />
    </label>
  );
}

function ApartmentCard({
  apartment,
  onView,
  onEdit,
  onDelete,
}: {
  apartment: Apartment;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const available = apartment.status === "متاحة";

  return (
    <article className="group overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/45 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-amber-300/25">
      <div
        className={`h-1.5 w-full ${
          available
            ? "bg-gradient-to-l from-emerald-400 via-emerald-500 to-transparent"
            : "bg-gradient-to-l from-amber-300 via-amber-500 to-transparent"
        }`}
      />

      <div className="p-5">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                available
                  ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
                  : "border-amber-300/20 bg-amber-400/10 text-amber-200"
              }`}
            >
              <Home size={24} />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-white">
                {apartment.number}
              </h3>
              <p className="text-xs text-slate-400">{apartment.type}</p>
            </div>
          </div>

          <StatusBadge status={apartment.status} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <InfoBox
            icon={<Ruler size={15} />}
            label="المساحة"
            value={`${apartment.area} م²`}
          />
          <InfoBox
            icon={<Building2 size={15} />}
            label="الغرف"
            value={`${apartment.rooms}`}
          />
          <InfoBox
            icon={<Banknote size={15} />}
            label="قيمة الإيجار"
            value={`${formatPrice(apartment.price)} ريال / ${apartment.rentCategory ?? "سنوي"}`}
          />
          <InfoBox
            icon={<MapPin size={15} />}
            label="الموقع"
            value={apartment.location}
          />
        </div>

        {apartment.tenant && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-300/10 bg-amber-300/[0.04] px-3 py-2 text-xs text-slate-300">
            <UserRound size={15} className="text-amber-200" />
            المستأجر: <strong className="text-white">{apartment.tenant}</strong>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onView}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-sky-300/15 bg-sky-400/[0.07] text-xs font-bold text-sky-100 transition hover:bg-sky-400/15"
          >
            <Eye size={15} />
            عرض
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-amber-300/15 bg-amber-400/[0.07] text-xs font-bold text-amber-100 transition hover:bg-amber-400/15"
          >
            <Pencil size={15} />
            تعديل
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-red-300/15 bg-red-400/[0.06] text-xs font-bold text-red-200 transition hover:bg-red-400/15"
          >
            <Trash2 size={15} />
            حذف
          </button>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: ApartmentStatus }) {
  const available = status === "متاحة";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold ${
        available
          ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200"
          : "border-amber-300/25 bg-amber-400/10 text-amber-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          available ? "bg-emerald-300" : "bg-amber-300"
        }`}
      />
      {status}
    </span>
  );
}

function InfoBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-2.5">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] text-slate-500">
        {icon}
        {label}
      </div>
      <div className="truncate text-xs font-bold text-slate-200">{value}</div>
    </div>
  );
}

function SmallAction({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
        danger
          ? "border-red-300/15 bg-red-400/5 text-red-200 hover:bg-red-400/15"
          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-slate-300">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/45 focus:bg-white/[0.07]"
      />
    </label>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-slate-300">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-white/10 bg-[#09251f] px-4 text-sm font-bold text-white outline-none transition focus:border-amber-300/45"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#09251f] text-white">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#09251f] p-5">
      <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
        {icon}
        {label}
      </div>
      <div className="font-bold text-white">{value}</div>
    </div>
  );
}
