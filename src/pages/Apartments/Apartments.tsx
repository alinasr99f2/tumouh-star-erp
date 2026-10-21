import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../utils/supabase";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  Home,
  Map as MapIcon,
  UserRoundCheck,
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
  Archive, RefreshCw, CalendarPlus, UserRoundPlus, SearchCheck, CalendarClock, Droplets, Zap, ReceiptText, CalendarCheck2, FileBarChart2, ContactRound, CalendarDays, ArrowUpLeft, FilePlus2,
} from "lucide-react";

type ApartmentStatus = string;
type RentCategory = "يومي" | "شهري" | "سنوي";

// Custom dropdown choices are saved only in this browser until a tenant-scoped backend is connected.
const CHOICE_STORAGE_KEY = "aqary-smart-apartments-custom-choices-v1";
const roundRent = (value: number) => Math.round(value * 100) / 100;
const priceForPeriod = (monthly: number | undefined, period: string) => monthly === undefined ? undefined : roundRent(period === "سنوي" ? monthly * 12 : period === "يومي" ? monthly * 12 / 365 : monthly);
const rentString = (value: number | undefined) => value === undefined ? "" : String(value);
type TypeCatalog = { names: Record<string,string>; prices: Record<string,number>; hidden: string[] };
const EMPTY_TYPE_CATALOG: TypeCatalog = { names: {}, prices: {}, hidden: [] };
type ApartmentTypeRow = { id: string; name: string; monthly_price: number };

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
  ownerId?: string | null;
  archivedAt?: string | null;
};

const RESIDENTIAL_COMPANY_ID = "61bed49c-bc21-476a-865b-1d28db791ad2";

type ResidentialRow = {
  id: string; apartment_number: string; building_name: string | null;
  rooms_count: number; rent_amount: number; rent_period: string;
  area_sqm: number | null; apartment_type: string | null;
  apartment_status: string; region: string | null; city: string | null;
  district_street: string | null; nearest_landmark: string | null;
  notes: string | null; owner_id: string | null; archived_at: string | null;
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
    notes: row.notes ?? "", ownerId: row.owner_id, archivedAt: row.archived_at,
  };
}

const initialApartments: Apartment[] = [];

const formatPrice = (value: number) =>
  new Intl.NumberFormat("ar-SA").format(value);
const formatFinancialPrice = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

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
  const navigate = useNavigate();
  const location = useLocation();
  const [apartments, setApartments] = useState<Apartment[]>(initialApartments);
  const [loadingApartments, setLoadingApartments] = useState(true);
  const [savingApartment, setSavingApartment] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [refreshingData, setRefreshingData] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState("");
  const [leaseFinance, setLeaseFinance] = useState<{due:number; total:number; collected:number; remaining:number; error:string; loading:boolean}>({due:0,total:0,collected:0,remaining:0,error:"",loading:true});
  const [leaseStatusError, setLeaseStatusError] = useState("");
  const [rentByContract, setRentByContract] = useState<Record<string, { due: number; collected: number; remaining: number }>>({});
  type BillRow = { id: string; apartment_id: string; charge_type: string; title: string; amount: number; issued_at: string; due_date: string };
  type BillPayment = { charge_id: string; amount: number; paid_at: string };
  const [billRows, setBillRows] = useState<BillRow[]>([]);
  const [billPayments, setBillPayments] = useState<BillPayment[]>([]);
  const [billsLoading, setBillsLoading] = useState(true);
  const [billsError, setBillsError] = useState("");
  const loadBills = async () => {
    setBillsLoading(true); setBillsError("");
    const [bills, payments] = await Promise.all([
      supabase.from("residential_charges").select("id,apartment_id,charge_type,title,amount,issued_at,due_date").eq("company_id", RESIDENTIAL_COMPANY_ID),
      supabase.from("residential_charge_payments").select("charge_id,amount,paid_at").eq("company_id", RESIDENTIAL_COMPANY_ID)
    ]);
    if (bills.error || payments.error) {
      setBillsError(bills.error?.message || payments.error?.message || "تعذر تحميل البيانات المالية");
      setBillRows([]); setBillPayments([]);
    } else {
      const ownBills = (bills.data ?? []) as BillRow[];
      const ids = new Set(ownBills.map(b => b.id));
      setBillRows(ownBills);
      setBillPayments(((payments.data ?? []) as BillPayment[]).filter(p => ids.has(p.charge_id)));
    }
    setBillsLoading(false);
  };
  useEffect(() => { void loadBills(); }, []);
  const billTypeForCategory = (category: string) => category === "إجمالي فواتير المياه" ? "water" : category === "إجمالي فواتير الكهرباء" ? "electricity" : "other";
  const filteredBills = (category: string) => billRows.filter(b => category === "إجمالي المستحقات" ? !["water", "electricity"].includes(b.charge_type) : b.charge_type === billTypeForCategory(category));
  const billPaid = (id: string) => billPayments.filter(p => p.charge_id === id).reduce((sum,p) => sum + Number(p.amount || 0), 0);
  const billTotals = (category: string) => {
    const selected = filteredBills(category);
    const total = selected.reduce((sum,b) => sum + Number(b.amount || 0), 0);
    const collected = selected.reduce((sum,b) => sum + billPaid(b.id), 0);
    return { total, collected, remaining: Math.max(0, total - collected) };
  };


  const loadResidentialApartments = async () => {
    setLoadingApartments(true);
    setLoadError("");
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) {
      setApartments([]); setCanWrite(false);
      setLoadError("يجب تسجيل الدخول بحساب مصرح له لعرض الشقق السكنية.");
      setLoadingApartments(false); return false;
    }
    const { data: membership, error: membershipError } = await supabase
      .from("residential_company_users").select("role")
      .eq("company_id", RESIDENTIAL_COMPANY_ID).eq("user_id", auth.user.id).maybeSingle();
    if (membershipError || !membership) {
      setApartments([]); setCanWrite(false);
      setLoadError(membershipError?.message ?? "حسابك غير مرتبط بشركة طموح ستار في نظام الشقق السكنية.");
      setLoadingApartments(false); return false;
    }
    setCanWrite(membership.role === "owner");
    const { data, error } = await supabase.from("residential_apartments")
      .select("id,apartment_number,building_name,rooms_count,rent_amount,rent_period,area_sqm,apartment_type,apartment_status,region,city,district_street,nearest_landmark,notes,owner_id,archived_at")
      .eq("company_id", RESIDENTIAL_COMPANY_ID).order("created_at", { ascending: false });
    if (error) { setLoadError(`تعذر تحميل الشقق: ${error.message}`); }
    else {
      const rawApartments = ((data ?? []) as ResidentialRow[]).map(fromResidentialRow);
      // An active lease takes precedence over a stale manually stored apartment status.
      const today = new Date().toLocaleDateString("en-CA");
      const {data: leases,error: leasesError} = await supabase.from("residential_contracts")
        .select("id,apartment_id,start_date,end_date,status,contract_type")
        .eq("company_id",RESIDENTIAL_COMPANY_ID);
      if (leasesError) {
        setLeaseStatusError(`تعذر مراجعة العقود: ${leasesError.message}`);
        setApartments(rawApartments);
      } else {
        setLeaseStatusError("");
        const occupied = new Set((leases ?? []).filter(c => c.status === "نشط" && c.contract_type === "إيجار" && c.start_date <= today && c.end_date > today).map(c => c.apartment_id));
        setApartments(rawApartments.map(a => ({...a,status:occupied.has(a.id) ? "مؤجرة" : a.status === "مؤجرة" ? "متاحة" : a.status})));
      }
      // Installment ledger: show due charges, not fictitious collections.
      setLeaseFinance(prev=>({...prev,loading:true}));
       const [installmentResult, allocationResult] = await Promise.all([
         supabase.from("residential_rent_installments").select("*").eq("company_id",RESIDENTIAL_COMPANY_ID),
         supabase.from("residential_rent_allocations").select("*").eq("company_id",RESIDENTIAL_COMPANY_ID)
       ]);
       const financeError = installmentResult.error || allocationResult.error || leasesError;
       if (financeError) { setRentByContract({}); setLeaseFinance({due:0,total:0,collected:0,remaining:0,loading:false,error:financeError.message}); }
       else {
         const activeIds = new Set((leases??[]).filter(c=>c.status === "نشط" && c.contract_type === "إيجار").map(c=>c.id));
         const rows = (installmentResult.data??[]).filter(i=>activeIds.has(String(i.contract_id)));
         const dueRows = rows.filter(i=>String(i.due_date)<=today);
         const dueIds = new Set(dueRows.map(i=>String(i.id)));
         const allocations = allocationResult.data??[];
         const hasAllocations = allocations.length>0;
         const allocationKey = hasAllocations ? ["installment_id","rent_installment_id"].find(k=>k in allocations[0]) : "installment_id";
         const amountKey = hasAllocations ? ["amount","allocated_amount","applied_amount"].find(k=>k in allocations[0]) : "amount";
         if (!allocationKey || !amountKey) {
           setLeaseFinance({due:0,total:0,collected:0,remaining:0,loading:false,error:"تعذر تحديد أعمدة ربط التحصيلات بالأقساط؛ يلزم مراجعة بنية جدول التحصيلات."});
         } else {
            const paymentsByInstallment = new Map<string, number>();
            for (const allocation of allocations) {
              const id = String(allocation[allocationKey] ?? "");
              paymentsByInstallment.set(id, (paymentsByInstallment.get(id) ?? 0) + Number(allocation[amountKey] || 0));
            }
            const byContract: Record<string, { due: number; collected: number; remaining: number }> = {};
            for (const installment of dueRows) {
              const contractId = String(installment.contract_id);
              const entry = byContract[contractId] ?? { due: 0, collected: 0, remaining: 0 };
              entry.due += Number(installment.amount || 0);
              entry.collected += paymentsByInstallment.get(String(installment.id)) ?? 0;
              byContract[contractId] = entry;
            }
            for (const entry of Object.values(byContract)) {
              entry.due = roundRent(entry.due);
              entry.collected = roundRent(entry.collected);
              entry.remaining = roundRent(entry.due - entry.collected);
            }
            setRentByContract(byContract);
           const due = roundRent(dueRows.reduce((sum,i)=>sum+Number(i.amount||0),0));
           const collected = roundRent(allocations.filter(a=>dueIds.has(String(a[allocationKey]))).reduce((sum,a)=>sum+Number(a[amountKey]||0),0));
           setLeaseFinance({due,total:roundRent(rows.reduce((sum,i)=>sum+Number(i.amount||0),0)),collected,remaining:roundRent(due-collected),loading:false,error:""});
         }
       }
    }
    setLoadingApartments(false);
    return !error;
  };

  useEffect(() => { void loadResidentialApartments(); }, []);
  const [customChoices, setCustomChoices] = useState<CustomChoices>(readCustomChoices);
  const [choiceEditor, setChoiceEditor] = useState<"city" | "type" | "status" | null>(null);
  const [newChoice, setNewChoice] = useState("");
  const [choiceError, setChoiceError] = useState("");
  const [typeCatalog, setTypeCatalog] = useState<TypeCatalog>(EMPTY_TYPE_CATALOG);
  const [typeRows, setTypeRows] = useState<ApartmentTypeRow[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [typeBusy, setTypeBusy] = useState(false);
  const [typeEditOriginal, setTypeEditOriginal] = useState<string | null>(null);
  const [typeNameInput, setTypeNameInput] = useState("");
  const [typePriceInput, setTypePriceInput] = useState("");
  const [typeAnnualInput, setTypeAnnualInput] = useState("");
  const [typeDailyInput, setTypeDailyInput] = useState("");
  const updateTypeMonthly = (value: string) => { setTypePriceInput(value); const n = Number(value); setTypeAnnualInput(value === "" ? "" : String(roundRent(n * 12))); setTypeDailyInput(value === "" ? "" : String(roundRent(n * 12 / 365))); };
  const updateTypeAnnual = (value: string) => { setTypeAnnualInput(value); const n = Number(value); setTypePriceInput(value === "" ? "" : String(roundRent(n / 12))); setTypeDailyInput(value === "" ? "" : String(roundRent(n / 365))); };
  const updateTypeDaily = (value: string) => { setTypeDailyInput(value); const n = Number(value); setTypeAnnualInput(value === "" ? "" : String(roundRent(n * 365))); setTypePriceInput(value === "" ? "" : String(roundRent(n * 365 / 12))); };
  const [typeManagerError, setTypeManagerError] = useState("");
  const [typeManagerNotice, setTypeManagerNotice] = useState("");
  const [typeDeleteTarget, setTypeDeleteTarget] = useState<string | null>(null);
  const apartmentTypes = useMemo(() => typeRows.map(row => row.name), [typeRows]);
  const loadApartmentTypes = async () => {
    setTypesLoading(true);
    const { data, error } = await supabase.from("residential_apartment_types")
      .select("id,name,monthly_price").eq("company_id", RESIDENTIAL_COMPANY_ID).order("name");
    setTypesLoading(false);
    if (error) { setTypeManagerError(`تعذر تحميل أنواع الشقق: ${error.message}`); return; }
    const rows = (data ?? []) as ApartmentTypeRow[];
    setTypeRows(rows);
    setTypeCatalog({names:{},hidden:[],prices:Object.fromEntries(rows.map(row=>[row.name,Number(row.monthly_price)]))});
    setTypeManagerError("");
  };
  useEffect(() => { void loadApartmentTypes(); }, []);
  const editType = (name: string) => { setTypeEditOriginal(name); setTypeNameInput(name); updateTypeMonthly(rentString(typeCatalog.prices[name])); setTypeManagerError(""); setTypeManagerNotice(""); setTypeDeleteTarget(null); };
  const resetTypeEditor = () => { setTypeEditOriginal(null); setTypeNameInput(""); setTypePriceInput(""); setTypeAnnualInput(""); setTypeDailyInput(""); setTypeManagerError(""); setTypeDeleteTarget(null); };
  const saveTypeCatalog = async () => {
    if (typeBusy) return;
    if (!canWrite) { setTypeManagerError("ليس لديك صلاحية إدارة أنواع الشقق."); return; }
    const name = typeNameInput.trim().replace(/\s+/g," ");
    const oldName = typeEditOriginal;
    const price = typePriceInput.trim() === "" ? 0 : Number(typePriceInput);
    if (!name || name.length > 80) { setTypeManagerError("أدخل اسمًا صحيحًا لا يتجاوز 80 حرفًا."); return; }
    if (!Number.isFinite(price) || price < 0 || Math.abs(price*100-Math.round(price*100)) > 0.000001) { setTypeManagerError("أدخل قيمة إيجار صحيحة بالريال والهللة."); return; }
    if (apartmentTypes.some(t => t.toLocaleLowerCase("ar") === name.toLocaleLowerCase("ar") && t !== oldName)) { setTypeManagerError("اسم النوع موجود بالفعل."); return; }
    if (oldName && oldName !== name && apartments.some(a => a.type === oldName)) { setTypeManagerError("هذا النوع مرتبط بشقق مسجلة. لا يمكن تغيير اسمه قبل نقل الشقق إلى نوع آخر."); return; }
    setTypeBusy(true); setTypeManagerError(""); setTypeManagerNotice("");
    const originalRow = typeRows.find(row=>row.name===oldName);
    const { error } = originalRow
      ? await supabase.from("residential_apartment_types").update({name,monthly_price:price,updated_at:new Date().toISOString()}).eq("company_id",RESIDENTIAL_COMPANY_ID).eq("id",originalRow.id)
      : await supabase.from("residential_apartment_types").insert({company_id:RESIDENTIAL_COMPANY_ID,name,monthly_price:price});
    if (error) { setTypeBusy(false); setTypeManagerError(error.code==="23505" ? "اسم النوع موجود بالفعل." : `تعذر حفظ النوع: ${error.message}`); return; }
    await loadApartmentTypes(); setTypeBusy(false);
    resetTypeEditor(); setTypeManagerNotice(originalRow ? "تم تعديل النوع وحفظه في قاعدة البيانات." : "تم إضافة النوع وحفظه في قاعدة البيانات.");
  };
  const deleteTypeCatalog = async (name: string) => {
    if (typeBusy) return;
    if (!canWrite) { setTypeManagerError("ليس لديك صلاحية حذف الأنواع."); return; }
    if (apartments.some(a => a.type === name)) { setTypeManagerError("لا يمكن حذف النوع لأنه مرتبط بشقق مسجلة، بما فيها المؤرشفة."); setTypeDeleteTarget(null); return; }
    const row = typeRows.find(t=>t.name===name);
    if (!row) { setTypeManagerError("النوع غير موجود في قاعدة البيانات."); return; }
    setTypeBusy(true); setTypeManagerError("");
    const {error} = await supabase.from("residential_apartment_types").delete().eq("company_id",RESIDENTIAL_COMPANY_ID).eq("id",row.id);
    if (error) { setTypeBusy(false); setTypeManagerError(`تعذر حذف النوع: ${error.message}`); return; }
    await loadApartmentTypes(); setTypeBusy(false); resetTypeEditor(); setTypeManagerNotice("تم حذف النوع من قاعدة البيانات بنجاح.");
  };
  const apartmentStatuses = useMemo(() => Array.from(new Set([...DEFAULT_APARTMENT_STATUSES, ...customChoices.statuses])), [customChoices.statuses]);
  useEffect(() => {
    try { window.localStorage.setItem(CHOICE_STORAGE_KEY, JSON.stringify(customChoices)); }
    catch { /* Storage may be unavailable in private browsing. */ }
  }, [customChoices]);
  const openChoiceEditor = (kind: "city" | "type" | "status") => {
    setChoiceEditor(kind); setNewChoice(""); setChoiceError("");
  };
  const saveChoice = async () => {
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
      if (!canWrite) { setChoiceError("ليس لديك صلاحية إضافة نوع شقة."); return; }
      const {error} = await supabase.from("residential_apartment_types").insert({company_id:RESIDENTIAL_COMPANY_ID,name,monthly_price:0});
      if (error) { setChoiceError(`تعذر حفظ نوع الشقة: ${error.message}`); return; }
      await loadApartmentTypes();
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
  const [bookingModal, setBookingModal] = useState(false);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingTenantAfterCreate, setBookingTenantAfterCreate] = useState(false);
  const [contractTenantAfterCreate, setContractTenantAfterCreate] = useState(false);
  const [bookingForm, setBookingForm] = useState({ apartment_id: "", tenant_id: "", start_date: "", end_date: "", total_amount: "", paid_amount: "0", payment_method: "نقدي", booking_status: "confirmed", notes: "" });
  const openBooking = () => { setBookingError(""); setBookingForm({apartment_id:"",tenant_id:"",start_date:"",end_date:"",total_amount:"",paid_amount:"0",payment_method:"نقدي",booking_status:"confirmed",notes:""});setBookingModal(true);void loadResidentialTenants(); };
  const saveBooking = async () => {
    if (bookingBusy) return;
    if (!canWrite) { setBookingError("ليس لديك صلاحية إنشاء الحجوزات."); return; }
    if (!bookingForm.apartment_id || !bookingForm.tenant_id || !bookingForm.start_date || !bookingForm.end_date) { setBookingError("اختر الشقة والمستأجر وتاريخ البداية والنهاية."); return; }
    if (bookingForm.end_date <= bookingForm.start_date) { setBookingError("تاريخ النهاية يجب أن يكون بعد تاريخ البداية."); return; }
    const total = Number(bookingForm.total_amount), paid = Number(bookingForm.paid_amount);
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(paid) || paid < 0 || paid > total) { setBookingError("تحقق من قيمة الإيجار والمدفوع؛ يجب ألا يتجاوز المدفوع الإجمالي."); return; }
    setBookingBusy(true);setBookingError("");
    const {data,error} = await supabase.rpc("create_residential_booking", {
      p_company_id: RESIDENTIAL_COMPANY_ID, p_apartment_id: bookingForm.apartment_id,
      p_tenant_id: bookingForm.tenant_id, p_start_date: bookingForm.start_date,
      p_end_date: bookingForm.end_date, p_total_amount: total, p_paid_amount: paid,
      p_payment_method: bookingForm.payment_method, p_booking_status: bookingForm.booking_status,
      p_notes: bookingForm.notes.trim() || null,
    });
    setBookingBusy(false);
    if (error) { setBookingError(`تعذر حفظ الحجز: ${error.message}`); return; }
    setBookingModal(false);
    await loadResidentialApartments();
    setActionNotice(`تم حفظ الحجز بنجاح. رقم الحجز: ${String(data ?? "")} — المدفوع ${paid.toLocaleString("ar-SA")} ر.س، والمتبقي ${(total-paid).toLocaleString("ar-SA")} ر.س`);
  };
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
    const { data: createdTenant, error } = await supabase.from("residential_tenants").insert({
      company_id: RESIDENTIAL_COMPANY_ID, full_name,
      phone: tenantForm.phone.trim() || null,
      identity_number: tenantForm.identity_number.trim() || null,
      nationality: tenantForm.nationality.trim() || null,
      email: tenantForm.email.trim() || null,
      notes: tenantForm.notes.trim() || null,
    }).select("id").single();
    setSavingTenant(false);
    if (error) { setTenantError(`تعذر حفظ العميل: ${error.message}`); return; }
    setTenantModal(false);
    if (bookingTenantAfterCreate && createdTenant?.id) { setBookingForm(prev=>({...prev,tenant_id:createdTenant.id}));setBookingTenantAfterCreate(false); }
    if (contractTenantAfterCreate && createdTenant?.id) { setContractForm(prev=>({...prev,tenant_id:createdTenant.id}));setContractTenantAfterCreate(false); }
    setTenantForm({ full_name: "", phone: "", identity_number: "", nationality: "", email: "", notes: "" });
    await loadResidentialTenants();
    setActionNotice("تم تسجيل العميل الجديد بنجاح.");
  };

  type PropertyOwner = { id: string; full_name: string; mobile: string | null; phone: string | null; email: string | null; nationality: string | null; identity_number: string | null };
  const emptyOwnerForm = { full_name: "", mobile: "", phone: "", email: "", nationality: "", identity_number: "" };
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [standaloneOwnerModal, setStandaloneOwnerModal] = useState(false);
  const [standaloneOwnerForm, setStandaloneOwnerForm] = useState({ full_name: "", mobile: "", phone: "", email: "", nationality: "", identity_number: "" });
  const [standaloneOwnerError, setStandaloneOwnerError] = useState("");
  const [savingStandaloneOwner, setSavingStandaloneOwner] = useState(false);
  const [ownerCreatedForContract, setOwnerCreatedForContract] = useState(false);
  const openStandaloneOwner = () => {
    setStandaloneOwnerForm({ full_name: "", mobile: "", phone: "", email: "", nationality: "", identity_number: "" });
    setStandaloneOwnerError("");
    void loadOwners();
    setStandaloneOwnerModal(true);
  };
  const normalizeOwnerText = (value: string) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ar");
  const normalizeOwnerNumber = (value: string) => value.replace(/[\s()+-]/g, "").replace(/^00966/, "0").replace(/^966/, "0").replace(/^\+966/, "0");
  const ownerSuggestions = useMemo(() => {
    const values = standaloneOwnerForm;
    return owners.filter(owner => {
      const name = normalizeOwnerText(values.full_name);
      const mobile = normalizeOwnerNumber(values.mobile);
      const identity = values.identity_number.trim();
      const email = values.email.trim().toLowerCase();
      return (name.length >= 2 && normalizeOwnerText(owner.full_name).includes(name)) ||
        (mobile.length >= 3 && [owner.mobile, owner.phone].some(v => v && normalizeOwnerNumber(v).includes(mobile))) ||
        (identity.length >= 3 && owner.identity_number?.includes(identity)) ||
        (email.length >= 3 && owner.email?.toLowerCase().includes(email));
    }).slice(0, 6);
  }, [owners, standaloneOwnerForm]);
  const findDuplicateOwner = (records: PropertyOwner[]) => records.find(owner => {
    const mobile = normalizeOwnerNumber(standaloneOwnerForm.mobile);
    const identity = standaloneOwnerForm.identity_number.trim();
    const email = standaloneOwnerForm.email.trim().toLowerCase();
    return (identity.length > 0 && owner.identity_number?.trim() === identity) ||
      (mobile.length > 0 && [owner.mobile, owner.phone].some(v => v && normalizeOwnerNumber(v) === mobile)) ||
      (email.length > 0 && owner.email?.trim().toLowerCase() === email);
  });
  const saveStandaloneOwner = async () => {
    if (savingStandaloneOwner) return;
    if (!canWrite) { setStandaloneOwnerError("ليس لديك صلاحية إضافة مالك."); return; }
    const full_name = standaloneOwnerForm.full_name.trim();
    if (!full_name) { setStandaloneOwnerError("اسم المالك مطلوب."); return; }
    const email = standaloneOwnerForm.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStandaloneOwnerError("البريد الإلكتروني غير صحيح."); return; }
    setSavingStandaloneOwner(true); setStandaloneOwnerError("");
    const { data: existingOwners, error: checkError } = await supabase.from("property_owners")
      .select("id,full_name,mobile,phone,email,nationality,identity_number")
      .eq("company_id", RESIDENTIAL_COMPANY_ID);
    if (checkError) { setSavingStandaloneOwner(false); setStandaloneOwnerError(`تعذر التحقق من الملاك المسجلين: ${checkError.message}`); return; }
    const duplicate = findDuplicateOwner((existingOwners ?? []) as PropertyOwner[]);
    if (duplicate) { setSavingStandaloneOwner(false); setStandaloneOwnerError(`هذا المالك مسجل بالفعل باسم ${duplicate.full_name}. لا يمكن تسجيله مرة أخرى بنفس الجوال أو الهوية أو البريد الإلكتروني.`); return; }
    const { error } = await supabase.from("property_owners").insert({
      company_id: RESIDENTIAL_COMPANY_ID, full_name,
      mobile: standaloneOwnerForm.mobile.trim() || null,
      phone: standaloneOwnerForm.phone.trim() || null,
      email: email || null,
      nationality: standaloneOwnerForm.nationality.trim() || null,
      identity_number: standaloneOwnerForm.identity_number.trim() || null,
    });
    setSavingStandaloneOwner(false);
    if (error) { setStandaloneOwnerError(error.code === "23505" ? "هذا المالك مسجل بالفعل (رقم الجوال أو الهوية مكرر)." : `تعذر حفظ المالك: ${error.message}`); return; }
    setStandaloneOwnerModal(false);
    if (ownerCreatedForContract) {
      const { data: latestOwner } = await supabase.from("property_owners").select("id").eq("company_id", RESIDENTIAL_COMPANY_ID).eq("full_name", full_name).order("created_at", {ascending:false}).limit(1).maybeSingle();
      if (latestOwner?.id) setContractForm(prev => ({...prev, owner_id: latestOwner.id}));
      setOwnerCreatedForContract(false);
    }
    await loadOwners();
    setActionNotice("تم تسجيل المالك الجديد بنجاح، ويمكن ربطه بالشقق من بيانات المالك.");
  };
  const [contractModal, setContractModal] = useState(false);
  const [contractSaving, setContractSaving] = useState(false);
  const [contractError, setContractError] = useState("");
  const emptyContractForm = {apartment_id:"", owner_id:"", tenant_id:"", contract_number:"", contract_type:"إيجار", rent_period:"", start_date:"", end_date:"", contract_amount:"", payment_frequency:"شهري", first_due_date:"", notes:""};
  const [contractForm, setContractForm] = useState(emptyContractForm);
  const [contractPeriods, setContractPeriods] = useState<string[]>(["يومي", "شهري", "سنوي"]);
  const [addingContractPeriod, setAddingContractPeriod] = useState(false);
  const [newContractPeriod, setNewContractPeriod] = useState("");
  const [savingContractPeriod, setSavingContractPeriod] = useState(false);
  const [contractPeriodError, setContractPeriodError] = useState("");
  const loadContractPeriods = async () => {
    const { data, error } = await supabase.from("residential_rent_period_options")
      .select("name").eq("company_id", RESIDENTIAL_COMPANY_ID).order("name");
    if (!error) setContractPeriods(Array.from(new Set(["يومي", "شهري", "سنوي", ...(data ?? []).map(row => row.name as string)])));
  };
  useEffect(() => { void loadContractPeriods(); }, []);
  const addContractPeriod = async () => {
    const name = newContractPeriod.trim().replace(/\s+/g, " ");
    if (!canWrite) { setContractPeriodError("ليس لديك صلاحية الإضافة."); return; }
    if (!name || name.length > 50) { setContractPeriodError("أدخل مدة صحيحة لا تتجاوز 50 حرفًا."); return; }
    if (contractPeriods.some(v => v.toLocaleLowerCase("ar") === name.toLocaleLowerCase("ar"))) {
      setContractForm(prev => ({ ...prev, rent_period: name }));
      setAddingContractPeriod(false); setNewContractPeriod(""); return;
    }
    setSavingContractPeriod(true); setContractPeriodError("");
    const { error } = await supabase.from("residential_rent_period_options")
      .insert({ company_id: RESIDENTIAL_COMPANY_ID, name });
    setSavingContractPeriod(false);
    if (error) { setContractPeriodError(`تعذر حفظ المدة: ${error.message}`); return; }
    setContractPeriods(prev => [...prev, name]);
    setContractForm(prev => ({ ...prev, rent_period: name }));
    setNewContractPeriod(""); setAddingContractPeriod(false);
  };

  // Contract duration describes the whole lease, while payment frequency divides its total into installments.
  // Dates use an exclusive end boundary: a lease ending on Oct 20 has its last payable period before Oct 20.
  const endDateForContractDuration = (start: string, duration: string) => {
    if (!start) return "";
    const date = new Date(`${start}T12:00:00Z`);
    if (Number.isNaN(date.getTime())) return "";
    const monthCount = duration === "شهري" ? 1 : duration === "سنوي" ? 12 : duration === "سنتين" ? 24 : duration === "ثلاث سنوات" ? 36 : 0;
    if (duration === "يومي") date.setUTCDate(date.getUTCDate()+1);
    else if (duration === "أسبوعي") date.setUTCDate(date.getUTCDate()+7);
    else if (monthCount) {
      const day=date.getUTCDate();
      date.setUTCDate(1);
      date.setUTCMonth(date.getUTCMonth()+monthCount);
      const last=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();
      date.setUTCDate(Math.min(day,last));
    } else return ""; // Custom labels require an explicitly selected end date.
    return date.toISOString().slice(0,10);
  };
  const contractInstallmentPreview = useMemo(() => {
    const f = contractForm;
    const total = Number(f.contract_amount);
    if (f.contract_type !== "إيجار" || !f.start_date || !f.end_date || !f.first_due_date ||
        f.end_date <= f.start_date || f.first_due_date < f.start_date || f.first_due_date >= f.end_date ||
        !Number.isFinite(total) || total <= 0) return [] as {dueDate:string;amount:number}[];
    const monthStep = ({"شهري":1,"ربع سنوي":3,"نصف سنوي":6,"سنوي":12} as Record<string,number>)[f.payment_frequency] ?? 0;
    const anchor = new Date(`${f.first_due_date}T12:00:00Z`);
    const nextDate = (index:number) => {
      if (!monthStep) { const d=new Date(anchor); d.setUTCDate(d.getUTCDate()+index); return d.toISOString().slice(0,10); }
      const year=anchor.getUTCFullYear(), month=anchor.getUTCMonth()+index*monthStep;
      const lastDay=new Date(Date.UTC(year,month+1,0)).getUTCDate();
      return new Date(Date.UTC(year,month,Math.min(anchor.getUTCDate(),lastDay),12)).toISOString().slice(0,10);
    };
    const dates:string[]=[];
    for(let i=0;i<2000;i++) { const date=nextDate(i); if(date>=f.end_date) break; dates.push(date); }
    if (!dates.length || dates.length>=2000 || Math.round(total*100)<dates.length) return [];
    const cents=Math.round(total*100), base=Math.floor(cents/dates.length);
    return dates.map((dueDate,i)=>({dueDate,amount:(i===dates.length-1?cents-base*(dates.length-1):base)/100}));
  }, [contractForm]);
  const contractPreviewIssue = (() => {
    const f=contractForm;
    if(f.contract_type!=="إيجار") return "";
    if(!f.start_date || !f.end_date) return "حدد تاريخ بداية العقد ونهايته لعرض الأقساط.";
    if(f.end_date<=f.start_date) return "تاريخ النهاية لازم يكون بعد تاريخ البداية.";
    if(!f.first_due_date) return "حدد تاريخ أول استحقاق.";
    if(f.first_due_date<f.start_date || f.first_due_date>=f.end_date) return "تاريخ أول استحقاق لازم يكون داخل فترة العقد، قبل تاريخ نهايته.";
    if(!(Number(f.contract_amount)>0)) return "أدخل قيمة إجمالي العقد أكبر من صفر.";
    if(!contractInstallmentPreview.length) return "تعذر حساب الأقساط. راجع قيمة العقد ودورية السداد والتواريخ.";
    return "";
  })();
  const openContractModal = () => {setContractForm(emptyContractForm);setContractError("");setContractModal(true);void loadOwners();void loadResidentialTenants();void loadContractPeriods();};
  const saveContract = async () => {
    if (contractSaving) return;
    if (!canWrite) {setContractError("ليس لديك صلاحية إضافة عقد.");return;}
    const f = contractForm;
    if (!f.apartment_id || !f.owner_id || !f.tenant_id || !f.contract_number.trim() || !f.start_date || !f.end_date) {setContractError("اختر الشقة والمالك والمستأجر، وأدخل رقم العقد وتواريخه.");return;}
    const selectedApartment = apartments.find(a => a.id === f.apartment_id);
    if (selectedApartment?.ownerId && f.owner_id !== selectedApartment.ownerId) {
      setContractError("المالك المختار مختلف عن المالك المسجل للشقة. اختر مالك الشقة الصحيح أو عدّل بيانات ملكية الشقة أولًا."); return;
    }
    if (!f.rent_period) {setContractError("اختر مدة العقد.");return;}
    if (f.end_date <= f.start_date) {setContractError("تاريخ النهاية يجب أن يكون بعد البداية.");return;}
    if (f.contract_type === "إيجار" && (!f.contract_amount || Number(f.contract_amount) <= 0)) {setContractError("أدخل إجمالي قيمة عقد الإيجار.");return;}
    if (f.contract_amount && (!Number.isFinite(Number(f.contract_amount)) || Number(f.contract_amount)<0)) {setContractError("قيمة العقد غير صحيحة.");return;}
    setContractSaving(true);setContractError("");
    const normalizedContractNumber = f.contract_number.trim();
    const { data: existingContractNumbers, error: duplicateCheckError } = await supabase
      .from("residential_contracts")
      .select("id,contract_number")
      .eq("company_id", RESIDENTIAL_COMPANY_ID)
      .not("contract_number", "is", null);
    if (duplicateCheckError) {
      setContractSaving(false);
      setContractError(`تعذر التحقق من أرقام العقود المسجلة: ${duplicateCheckError.message}`);
      return;
    }
    const duplicateContract = (existingContractNumbers ?? []).find(
      row => String(row.contract_number ?? "").trim().toLocaleLowerCase() === normalizedContractNumber.toLocaleLowerCase()
    );
    if (duplicateContract) {
      setContractSaving(false);
      setContractError(`رقم العقد «${normalizedContractNumber}» مسجل بالفعل. برجاء استخدام رقم عقد مختلف.`);
      return;
    }
    if (f.contract_type === "إيجار" && (!f.first_due_date || !contractInstallmentPreview.length)) {
      setContractSaving(false); setContractError("حدد تاريخ أول استحقاق ودورية السداد وتأكد من ظهور جدول الأقساط."); return;
    }
    const rentPeriod = f.rent_period || apartments.find(a => a.id === f.apartment_id)?.rentCategory || "شهري";
    const {error} = f.contract_type === "إيجار"
      ? await supabase.rpc("create_residential_contract_with_schedule", {
          p_company_id: RESIDENTIAL_COMPANY_ID, p_apartment_id:f.apartment_id,
          p_owner_id:f.owner_id, p_tenant_id:f.tenant_id,
          p_contract_number:normalizedContractNumber, p_contract_type:f.contract_type,
          p_start_date:f.start_date, p_end_date:f.end_date,
          p_contract_amount:Number(f.contract_amount), p_rent_period:rentPeriod,
          p_notes:f.notes.trim() || null, p_payment_frequency:f.payment_frequency,
          p_first_due_date:f.first_due_date,
        })
      : await supabase.from("residential_contracts").insert({
          company_id:RESIDENTIAL_COMPANY_ID, apartment_id:f.apartment_id,owner_id:f.owner_id,
          tenant_id:f.tenant_id, contract_number:normalizedContractNumber,contract_type:f.contract_type,
          start_date:f.start_date,end_date:f.end_date,
          rent_amount:f.contract_amount ? Number(f.contract_amount) : 0,
          rent_period:rentPeriod,status:"نشط", notes:f.notes.trim() || null
        });
    setContractSaving(false);
    if (error) {setContractError(error.code === "23505" ? "رقم العقد مسجل بالفعل. برجاء استخدام رقم مختلف." : `تعذر حفظ العقد: ${error.message}. راجع أعمدة الجدول وصلاحياته في Supabase.`);return;}
    setContractModal(false);void loadContractSummary();void loadResidentialApartments();setActionNotice("تم تسجيل العقد وربطه بالشقة والمالك بنجاح.");
  };
  const [ownerId, setOwnerId] = useState("");
  const [ownerMode, setOwnerMode] = useState<"existing" | "new">("new");
  const [ownerForm, setOwnerForm] = useState(emptyOwnerForm);
  const [apartmentTab, setApartmentTab] = useState<"apartment" | "owner">("apartment");
  const [ownersError, setOwnersError] = useState("");
  const loadOwners = async () => {
    const { data, error } = await supabase.from("property_owners")
      .select("id,full_name,mobile,phone,email,nationality,identity_number")
      .eq("company_id", RESIDENTIAL_COMPANY_ID).order("full_name");
    if (error) { setOwnersError(`تعذر تحميل الملاك: ${error.message}. نفّذ ملف SQL المرفق أولًا.`); return; }
    setOwners((data ?? []) as PropertyOwner[]); setOwnersError("");
  };
  useEffect(() => { void loadOwners(); }, []);

  const refreshPageData = async () => {
    if (refreshingData) return;
    setRefreshingData(true);
    setRefreshNotice("");
    try {
      // Fetch fresh records from Supabase; preserve current search and filters.
      const succeeded = await loadResidentialApartments();
      if (!succeeded) return;
      await Promise.all([loadResidentialTenants(), loadOwners(), loadNationalities(), loadContractSummary(), loadApartmentTypes()]);
      setRefreshNotice("تم تحديث بيانات الشقق بنجاح");
    } catch (error) {
      setLoadError(`تعذر تحديث البيانات: ${error instanceof Error ? error.message : "خطأ غير متوقع"}`);
    } finally {
      setRefreshingData(false);
    }
  };
  useEffect(() => {
    if (!refreshNotice) return;
    const timeout = window.setTimeout(() => setRefreshNotice(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [refreshNotice]);

  const [search, setSearch] = useState("");
  const [detailCategory, setDetailCategory] = useState<string | null>(null);
  type ContractReportRow = { id: string; apartment_id: string; owner_id: string | null; tenant_id: string | null; contract_number: string; contract_type: string; start_date: string; end_date: string; rent_amount: number | null; rent_period?: string; status?: string; notes?: string | null };
  const [reportContracts, setReportContracts] = useState<ContractReportRow[]>([]);
  type ReportEntityKind = "apartment" | "tenant" | "owner";
  type ReportEntityMode = "view" | "edit" | "delete";
  const [reportEntity, setReportEntity] = useState<{kind:ReportEntityKind;mode:ReportEntityMode;id:string} | null>(null);
  const [reportEntityForm, setReportEntityForm] = useState<Record<string,string>>({});
  const [reportCityEditor, setReportCityEditor] = useState(false);
  const [reportNewCity, setReportNewCity] = useState("");
  const reportCities = useMemo(() => Array.from(new Set([
    ...(SAUDI_REGIONS[reportEntityForm.region] ?? []),
    ...(customChoices.cities[reportEntityForm.region] ?? []),
    ...apartments.filter(a => a.region === reportEntityForm.region).map(a => a.city || "").filter(Boolean),
    reportEntityForm.city || "",
  ].filter(Boolean))).sort((a,b) => a.localeCompare(b,"ar")), [reportEntityForm.region, reportEntityForm.city, customChoices.cities, apartments]);
  const reportLocationSuggestions = (key: "district_street" | "nearest_landmark") => Array.from(new Set(apartments
    .filter(a => (!reportEntityForm.region || a.region === reportEntityForm.region) && (!reportEntityForm.city || a.city === reportEntityForm.city))
    .map(a => key === "district_street" ? a.district : a.landmark).filter((v): v is string => !!v?.trim())
  )).sort((a,b) => a.localeCompare(b,"ar"));
  const saveReportCity = () => {
    const city = reportNewCity.trim().replace(/\s+/g," ");
    const region = reportEntityForm.region;
    if (!region || !city || city.length > 80) { setReportEntityError("اختر المنطقة أولًا واكتب اسم مدينة صحيحًا لا يتجاوز 80 حرفًا."); return; }
    const existing = reportCities.find(c => c.toLocaleLowerCase("ar") === city.toLocaleLowerCase("ar"));
    if (!existing) setCustomChoices(prev => ({...prev,cities:{...prev.cities,[region]:[...(prev.cities[region] ?? []),city]}}));
    setReportEntityForm(prev => ({...prev,city:existing ?? city}));
    setReportCityEditor(false); setReportNewCity(""); setReportEntityError("");
  };
  const [reportEntityBusy, setReportEntityBusy] = useState(false);
  const [reportEntityError, setReportEntityError] = useState("");
  const reportEntityFields: Record<ReportEntityKind,{key:string;label:string;type?:string}[]> = {
    apartment:[{key:"apartment_number",label:"رقم / اسم الشقة"},{key:"building_name",label:"اسم العمارة"},{key:"apartment_type",label:"نوع الشقة"},{key:"rooms_count",label:"عدد الغرف",type:"number"},{key:"area_sqm",label:"المساحة بالمتر المربع",type:"number"},{key:"rent_amount",label:"قيمة الإيجار بالريال",type:"number"},{key:"rent_period",label:"فترة الإيجار"},{key:"region",label:"المنطقة"},{key:"city",label:"المدينة"},{key:"district_street",label:"الحي / الشارع"},{key:"nearest_landmark",label:"أقرب معلم"},{key:"notes",label:"ملاحظات",type:"textarea"}],
    tenant:[{key:"full_name",label:"اسم العميل"},{key:"phone",label:"رقم الجوال",type:"tel"},{key:"identity_number",label:"رقم الهوية"},{key:"nationality",label:"الجنسية"},{key:"email",label:"البريد الإلكتروني",type:"email"},{key:"notes",label:"ملاحظات",type:"textarea"}],
    owner:[{key:"full_name",label:"اسم المالك"},{key:"mobile",label:"رقم الجوال",type:"tel"},{key:"phone",label:"رقم هاتف إضافي",type:"tel"},{key:"identity_number",label:"رقم الهوية"},{key:"nationality",label:"الجنسية"},{key:"email",label:"البريد الإلكتروني",type:"email"}]
  };
  const openReportEntity = (kind:ReportEntityKind,id:string,mode:ReportEntityMode) => {
    const row = kind==="apartment" ? apartments.find(a=>a.id===id) : kind==="tenant" ? tenants.find(t=>t.id===id) : owners.find(o=>o.id===id);
    if(!row) return;
    let values:Record<string,string>={};
    if(kind==="apartment") {
      const a=row as Apartment;
      values={apartment_number:a.number,building_name:a.buildingName||"",apartment_type:a.type,rooms_count:String(a.rooms),area_sqm:String(a.area),rent_amount:String(a.price),rent_period:a.rentCategory||"سنوي",region:a.region||"",city:a.city||"",district_street:a.district||"",nearest_landmark:a.landmark||"",notes:a.notes||""};
    } else { for(const [key,value] of Object.entries(row)) values[key]=value==null?"":String(value); }
    setReportEntityForm(values);setReportCityEditor(false);setReportNewCity("");setReportEntityError("");setReportEntity({kind,id,mode});
  };
  const saveReportEntity = async () => {
    if(!reportEntity || reportEntityBusy || reportEntity.mode==="view") return;
    if(!canWrite){setReportEntityError("ليس لديك صلاحية التعديل أو الحذف.");return;}
    const {kind,id,mode}=reportEntity;
    if(kind==="apartment" && mode==="delete") {
      // Apartments are archived, never physically removed from financial/contract history.
      setReportEntityBusy(true);
      const {data,error}=await supabase.from("residential_apartments").update({archived_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("company_id",RESIDENTIAL_COMPANY_ID).eq("id",id).select("id");
      setReportEntityBusy(false);
      if(error || !data?.length){setReportEntityError(error?.message||"لم يتم تأكيد الأرشفة.");return;}
      setReportEntity(null);await loadResidentialApartments();setActionNotice("تمت أرشفة الشقة مع الاحتفاظ بالعقود والبيانات المالية.");return;
    }
    const table=kind==="apartment"?"residential_apartments":kind==="tenant"?"residential_tenants":"property_owners";
    if(mode==="edit") {
      const required=kind==="apartment"?"apartment_number":"full_name";
      if(!reportEntityForm[required]?.trim()){setReportEntityError("الاسم أو رقم الشقة مطلوب.");return;}
      if(kind==="apartment") {
        if(!Number.isFinite(Number(reportEntityForm.rent_amount)) || Number(reportEntityForm.rent_amount)<0 || !Number.isFinite(Number(reportEntityForm.area_sqm)) || Number(reportEntityForm.area_sqm)<=0 || !Number.isInteger(Number(reportEntityForm.rooms_count)) || Number(reportEntityForm.rooms_count)<0){setReportEntityError("تحقق من الإيجار والمساحة وعدد الغرف.");return;}
        if(!["يومي","شهري","سنوي"].includes(reportEntityForm.rent_period)){setReportEntityError("فترة الإيجار يجب أن تكون يومي أو شهري أو سنوي.");return;}
      }
      const email=reportEntityForm.email?.trim();
      if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setReportEntityError("البريد الإلكتروني غير صحيح.");return;}
    }
    setReportEntityBusy(true);setReportEntityError("");
    let result;
    if(mode==="delete") {
      // Reject linked tenants/owners rather than cascading into contracts and payments.
      const column=kind==="tenant"?"tenant_id":"owner_id";
      const {data:linked,error:checkError}=await supabase.from("residential_contracts").select("id").eq("company_id",RESIDENTIAL_COMPANY_ID).eq(column,id).limit(1);
      if(checkError){setReportEntityBusy(false);setReportEntityError("تعذر التحقق من العقود المرتبطة: "+checkError.message);return;}
      if(linked?.length){setReportEntityBusy(false);setReportEntityError("لا يمكن حذف هذا السجل لأنه مرتبط بعقود. يجب الاحتفاظ بسجله المالي والتعاقدي.");return;}
      if(kind==="owner") {
        const {data:linkedApartments,error:apartmentError}=await supabase.from("residential_apartments").select("id").eq("company_id",RESIDENTIAL_COMPANY_ID).eq("owner_id",id).limit(1);
        if(apartmentError || linkedApartments?.length){setReportEntityBusy(false);setReportEntityError(apartmentError?.message||"لا يمكن حذف المالك لأنه مرتبط بشقق.");return;}
      }
      result=await supabase.from(table).delete().eq("company_id",RESIDENTIAL_COMPANY_ID).eq("id",id).select("id");
    } else {
      const payload:Record<string,string|number|null>={};
      for(const field of reportEntityFields[kind]) {
        const value=(reportEntityForm[field.key]||"").trim();
        payload[field.key]=field.type==="number"?Number(value):(value||null);
      }
      if(kind==="apartment") payload.updated_at=new Date().toISOString();
      result=await supabase.from(table).update(payload).eq("company_id",RESIDENTIAL_COMPANY_ID).eq("id",id).select("id");
    }
    setReportEntityBusy(false);
    if(result.error || !result.data?.length){setReportEntityError(result.error?.message||"لم يتم تأكيد العملية. راجع الصلاحيات.");return;}
    setReportEntity(null);
    if(kind==="apartment") await loadResidentialApartments();
    else if(kind==="tenant") await loadResidentialTenants();
    else await loadOwners();
    setActionNotice(mode==="delete"?"تم حذف السجل بنجاح.":"تم حفظ التعديلات بنجاح.");
  };
  const [selectedReportContract, setSelectedReportContract] = useState<ContractReportRow | null>(null);
  const [contractActionMode, setContractActionMode] = useState<"view" | "edit" | "archive" | null>(null);
  const [contractActionBusy, setContractActionBusy] = useState(false);
  const [contractActionError, setContractActionError] = useState("");
  const [editSchedule, setEditSchedule] = useState<{due_date:string;amount:number;installment_no:number}[]>([]);
  const [editFrequency, setEditFrequency] = useState("");
  const [editFirstDue, setEditFirstDue] = useState("");
  const [editScheduleLoading, setEditScheduleLoading] = useState(false);
  const [confirmReschedule, setConfirmReschedule] = useState(false);
  const [contractEdit, setContractEdit] = useState({contract_number:"",contract_type:"",start_date:"",end_date:"",notes:""});
  const openContractAction = (contract: ContractReportRow, mode: "view" | "edit" | "archive") => {
    setSelectedReportContract(contract); setContractActionMode(mode); setContractActionError("");
    setConfirmReschedule(false);setEditSchedule([]);setEditFrequency("");setEditFirstDue("");
    if(mode==="edit") {
      setEditScheduleLoading(true);
      void Promise.all([
        supabase.from("residential_rent_terms").select("payment_frequency,first_due_date").eq("company_id",RESIDENTIAL_COMPANY_ID).eq("contract_id",contract.id).maybeSingle(),
        supabase.from("residential_rent_installments").select("installment_no,due_date,amount").eq("company_id",RESIDENTIAL_COMPANY_ID).eq("contract_id",contract.id).order("installment_no")
      ]).then(([terms, installments])=>{
        if(terms.error || installments.error) setContractActionError(terms.error?.message||installments.error?.message||"تعذر تحميل جدول السداد");
        else {setEditFrequency(terms.data?.payment_frequency||"");setEditFirstDue(terms.data?.first_due_date||"");setEditSchedule(installments.data||[]);}
      }).catch(()=>setContractActionError("تعذر تحميل جدول السداد")).finally(()=>setEditScheduleLoading(false));
    }
    setContractEdit({contract_number:contract.contract_number ?? "",contract_type:contract.contract_type ?? "إيجار",start_date:contract.start_date ?? "",end_date:contract.end_date ?? "",notes:contract.notes ?? ""});
  };
  const contractDateChanged = !!selectedReportContract && (contractEdit.start_date!==selectedReportContract.start_date || contractEdit.end_date!==selectedReportContract.end_date);
  const newSchedulePreview = (() => {
    if(!selectedReportContract || !contractEdit.start_date || !contractEdit.end_date || contractEdit.end_date<=contractEdit.start_date || !editFrequency || !editFirstDue) return [] as {due_date:string;amount:number;installment_no:number}[];
    const first = editFirstDue===selectedReportContract.start_date ? contractEdit.start_date : editFirstDue;
    if(first<contractEdit.start_date || first>=contractEdit.end_date) return [];
    const step=({"يومي":0,"شهري":1,"ربع سنوي":3,"نصف سنوي":6,"سنوي":12} as Record<string,number>)[editFrequency];
    if(step===undefined) return [];
    const anchor=new Date(`${first}T12:00:00Z`);
    const dates:string[]=[];
    for(let i=0;i<2000;i++) {
      let date:string;
      if(step===0) {const d=new Date(anchor);d.setUTCDate(d.getUTCDate()+i);date=d.toISOString().slice(0,10);}
      else {const year=anchor.getUTCFullYear(),month=anchor.getUTCMonth()+i*step;const last=new Date(Date.UTC(year,month+1,0)).getUTCDate();date=new Date(Date.UTC(year,month,Math.min(anchor.getUTCDate(),last),12)).toISOString().slice(0,10);}
      if(date>=contractEdit.end_date)break;
      dates.push(date);
    }
    const cents=Math.round(Number(selectedReportContract.rent_amount||0)*100);
    if(!dates.length || dates.length>=2000 || cents<dates.length) return [];
    const base=Math.floor(cents/dates.length);
    return dates.map((due_date,i)=>({due_date,installment_no:i+1,amount:(i===dates.length-1?cents-base*(dates.length-1):base)/100}));
  })();
  const saveContractAction = async () => {
    if (!selectedReportContract || !contractActionMode || contractActionBusy) return;
    if (!canWrite) {setContractActionError("ليس لديك صلاحية تعديل العقود.");return;}
    setContractActionBusy(true); setContractActionError("");
    const contract = selectedReportContract;
    if (contractActionMode === "edit") {
      const number = contractEdit.contract_number.trim();
      if (!number) {setContractActionError("رقم العقد مطلوب.");setContractActionBusy(false);return;}
      if (!contractEdit.start_date || !contractEdit.end_date || contractEdit.end_date <= contractEdit.start_date) {
        setContractActionError("تأكد من إدخال تاريخ بداية ونهاية صحيحين، وأن النهاية بعد البداية."); setContractActionBusy(false); return;
      }
      const datesChanged = contractDateChanged;
      if(datesChanged && (editScheduleLoading || !editFrequency || !newSchedulePreview.length)) {
        setContractActionError("لا يمكن حساب جدول الأقساط الجديد. تأكد من تحميل إعدادات السداد وصحة التواريخ.");setContractActionBusy(false);return;
      }
      if(datesChanged && !confirmReschedule) {
        setContractActionError("راجع مواعيد الأقساط الجديدة ثم فعّل مربع تأكيد تغيير مواعيد الاستحقاق.");setContractActionBusy(false);return;
      }
      const {data: duplicate,error: checkError} = await supabase.from("residential_contracts").select("id")
        .eq("company_id",RESIDENTIAL_COMPANY_ID).eq("contract_number",number).neq("id",contract.id).limit(1);
      if (checkError) {setContractActionError(checkError.message);setContractActionBusy(false);return;}
      if (duplicate?.length) {setContractActionError("رقم العقد مستخدم بالفعل.");setContractActionBusy(false);return;}
      const {error} = await supabase.rpc("update_residential_contract_schedule",{
        p_company_id:RESIDENTIAL_COMPANY_ID,p_contract_id:contract.id,p_contract_number:number,
        p_start_date:contractEdit.start_date,p_end_date:contractEdit.end_date,p_notes:contractEdit.notes.trim(),
        p_expected_start_date:contract.start_date,p_expected_end_date:contract.end_date
      });
      if (error) {setContractActionError(error.message);setContractActionBusy(false);return;}
    } else if (contractActionMode === "archive") {
      const newStatus = contract.status === "مؤرشف" ? "نشط" : "مؤرشف";
      const {error} = await supabase.from("residential_contracts").update({status:newStatus})
        .eq("company_id",RESIDENTIAL_COMPANY_ID).eq("id",contract.id);
      if (error) {setContractActionError(error.message);setContractActionBusy(false);return;}
    }
    setContractActionBusy(false);setContractActionMode(null);setSelectedReportContract(null);
    await openReport("تقارير العقود");
    await loadResidentialApartments();
  };

  const [expiryModalOpen, setExpiryModalOpen] = useState(false);
  const [expirySearch, setExpirySearch] = useState("");
  const [expiryLoading, setExpiryLoading] = useState(false);
  const [expiryError, setExpiryError] = useState("");
  const [expiryContracts, setExpiryContracts] = useState<ContractReportRow[]>([]);
  const openExpiryModal = async () => {
    setExpiryModalOpen(true); setExpirySearch(""); setExpiryError(""); setExpiryLoading(true);
    const results = await Promise.allSettled([
      supabase.from("residential_contracts").select("id,apartment_id,owner_id,tenant_id,contract_number,contract_type,start_date,end_date,rent_amount,rent_period,status,notes").eq("company_id", RESIDENTIAL_COMPANY_ID).order("end_date", {ascending:true}),
      loadResidentialApartments(), loadResidentialTenants(), loadOwners()
    ]);
    const result = results[0];
    if (result.status === "fulfilled") {
      if (result.value.error) setExpiryError(result.value.error.message);
      else setExpiryContracts((result.value.data ?? []) as ContractReportRow[]);
    } else setExpiryError("تعذر تحميل بيانات العقود. حاول مرة أخرى.");
    setExpiryLoading(false);
  };
  const expiryReportRows = () => {
    const query = expirySearch.trim().toLocaleLowerCase();
    const today = new Date().toLocaleDateString("en-CA");
    return expiryContracts.filter(c => [c.contract_number, apartments.find(a=>a.id===c.apartment_id)?.number, tenants.find(t=>t.id===c.tenant_id)?.full_name, owners.find(o=>o.id===c.owner_id)?.full_name].join(" ").toLocaleLowerCase().includes(query))
      .slice().sort((a,b) => a.end_date.localeCompare(b.end_date))
      .map((c,i) => {
        const expired = c.end_date < today;
        const upcoming = !expired && (new Date(c.end_date+"T00:00:00").getTime()-new Date(today+"T00:00:00").getTime()) <= 30*86400000;
        return [String(i+1), c.contract_number||"—", apartments.find(a=>a.id===c.apartment_id)?.number||"—", tenants.find(t=>t.id===c.tenant_id)?.full_name||"—", owners.find(o=>o.id===c.owner_id)?.full_name||"—", c.start_date||"—", c.end_date||"—", expired?"منتهي":upcoming?"قريب الانتهاء":"ساري"];
      });
  };
  const expiryReportHtml = () => {
    const headers = ["م","رقم العقد","الشقة","المستأجر","المالك","تاريخ البداية","تاريخ الانتهاء","حالة العقد"];
    const rows = expiryReportRows();
    const logoUrl = new URL("/aqary-smart-logo.png", window.location.origin).href;
    const safe = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char] ?? char));
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"/><title>تقرير العقود حسب تاريخ الانتهاء</title><style>
      *{box-sizing:border-box}body{font-family:Tahoma,Arial,sans-serif;color:#15382f;margin:25px;direction:rtl}
      .report-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;border-bottom:3px solid #13503e;padding:8px 4px 15px;direction:rtl}
      .report-heading__title{flex:1;text-align:right;padding-top:12px}h1{color:#12503e;font-size:23px;margin:0 0 12px}
      .report-heading__meta{font-size:13px;font-weight:bold;margin:0}.report-heading__brand{width:170px;flex-shrink:0;text-align:center;direction:rtl;color:#12503e;font-weight:bold}
      .report-heading__brand img{display:block;max-width:120px;max-height:100px;object-fit:contain;margin:0 auto 6px}.report-heading__brand div{font-size:13px;line-height:1.65}
      table{width:100%;border-collapse:collapse;margin-top:18px;font-size:12px}th{background:#13503e;color:white}th,td{border:1px solid #9caea6;padding:9px;text-align:right}
      tr:nth-child(even){background:#edf5ef}thead{display:table-header-group}tr{break-inside:avoid;page-break-inside:avoid}
      @page{size:A4 landscape;margin:12mm}@media print{body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.report-heading{break-inside:avoid}}
      </style></head><body><header class="report-heading"><div class="report-heading__title"><h1>عقاري سمارت | تقرير العقود حسب تاريخ الانتهاء</h1><p class="report-heading__meta">تاريخ التقرير: ${new Date().toLocaleDateString("ar-SA")} | عدد النتائج: ${rows.length} | إجمالي العقود المسجلة: ${expiryContracts.length}</p></div><div class="report-heading__brand"><img src="${safe(logoUrl)}" alt="شعار عقاري سمارت"/><div>م/ علي نصر</div><div dir="ltr">0570026229</div></div></header>
      <table><thead><tr>${headers.map(h=>`<th>${safe(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${safe(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  };
  const printExpiryReport = () => {
    if (expiryLoading || expiryError) return;
    const popup = window.open("", "_blank", "width=1100,height=750");
    if (!popup) { setExpiryError("المتصفح منع نافذة الطباعة. اسمح بالنوافذ المنبثقة وحاول مجددًا."); return; }
    popup.document.open(); popup.document.write(expiryReportHtml()); popup.document.close();
    popup.focus(); popup.setTimeout(()=>popup.print(),350);
  };
  const exportExpiryExcel = () => {
    if (expiryLoading || expiryError) return;
    const html = expiryReportHtml().replace("<html lang=", '<html xmlns:x="urn:schemas-microsoft-com:office:excel" lang=');
    const blob = new Blob(["\ufeff",html],{type:"application/vnd.ms-excel;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href=url; link.download=`contracts-by-expiry-${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const [contractSummary, setContractSummary] = useState<{ count: number; nearest: string | null; loading: boolean; error: boolean }>({ count: 0, nearest: null, loading: true, error: false });
  const loadContractSummary = async () => {
    const { data, error } = await supabase.from("residential_contracts")
      .select("end_date").eq("company_id", RESIDENTIAL_COMPANY_ID);
    if (error) { setContractSummary(prev => ({ ...prev, loading: false, error: true })); return; }
    const dates = (data ?? []).map(row => row.end_date as string | null).filter((v): v is string => !!v);
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = dates.filter(date => date >= today).sort();
    setContractSummary({ count: (data ?? []).length, nearest: upcoming[0] ?? dates.sort().at(-1) ?? null, loading: false, error: false });
  };
  useEffect(() => { void loadContractSummary(); }, []);

  // Monthly report is a dated snapshot: due items up to month end, payments up to month end.
  const [monthlyOpen, setMonthlyOpen] = useState(false);
  const [monthlyMonth, setMonthlyMonth] = useState(() => new Date().toLocaleDateString("en-CA").slice(0,7));
  const [monthlyShowOwner, setMonthlyShowOwner] = useState(false);
  const [monthlyShowOther, setMonthlyShowOther] = useState(false);
  const [monthlyShowWater, setMonthlyShowWater] = useState(false);
  const [monthlyShowElectricity, setMonthlyShowElectricity] = useState(false);
  const [monthlyOnlyDue, setMonthlyOnlyDue] = useState(false);
  const [monthlySearch, setMonthlySearch] = useState("");
  const [monthlyBusy, setMonthlyBusy] = useState(false);
  const [monthlyError, setMonthlyError] = useState("");
  type MonthlyLine = { apartment: Apartment; contract: ContractReportRow | null; tenant: ResidentialTenant | null; owner: PropertyOwner | null; rentDue: number; rentPaid: number; otherDue: number; otherPaid: number; waterDue: number; waterPaid: number; electricityDue: number; electricityPaid: number; lastPayment: string | null };
  const [monthlyLines, setMonthlyLines] = useState<MonthlyLine[]>([]);
  const [monthlyLoadedMonth, setMonthlyLoadedMonth] = useState("");
  const monthlyEnd = (month: string) => { const [y,m] = month.split("-").map(Number); return new Date(Date.UTC(y,m,0)).toISOString().slice(0,10); };
  const monthlyDate = (v: unknown) => typeof v === "string" ? v.slice(0,10) : "";
  const monthlyNum = (v: unknown) => Number(v ?? 0) || 0;
  const loadMonthlyReport = async (month: string) => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) { setMonthlyError("اختر شهرًا صحيحًا أولًا."); return; }
    setMonthlyBusy(true); setMonthlyError(""); setMonthlyLoadedMonth("");
    const end = monthlyEnd(month);
    const [ap, ct, tn, ow, ins, alloc, charges, chargePayments] = await Promise.all([
      supabase.from("residential_apartments").select("id,apartment_number,building_name,rooms_count,rent_amount,rent_period,area_sqm,apartment_type,apartment_status,region,city,district_street,nearest_landmark,notes,owner_id,archived_at").eq("company_id",RESIDENTIAL_COMPANY_ID),
      supabase.from("residential_contracts").select("id,apartment_id,owner_id,tenant_id,contract_number,contract_type,start_date,end_date,rent_amount,rent_period,status,notes").eq("company_id",RESIDENTIAL_COMPANY_ID),
      supabase.from("residential_tenants").select("id,full_name,phone,identity_number,nationality,email,notes").eq("company_id",RESIDENTIAL_COMPANY_ID),
      supabase.from("property_owners").select("id,full_name,mobile,phone,email,nationality,identity_number").eq("company_id",RESIDENTIAL_COMPANY_ID),
      supabase.from("residential_rent_installments").select("*").eq("company_id",RESIDENTIAL_COMPANY_ID),
      supabase.from("residential_rent_allocations").select("*").eq("company_id",RESIDENTIAL_COMPANY_ID),
      supabase.from("residential_charges").select("id,apartment_id,charge_type,title,amount,issued_at,due_date").eq("company_id",RESIDENTIAL_COMPANY_ID),
      supabase.from("residential_charge_payments").select("charge_id,amount,paid_at").eq("company_id",RESIDENTIAL_COMPANY_ID),
    ]);
    const errors = [ap,ct,tn,ow,ins,alloc,charges,chargePayments].map(r=>r.error?.message).filter(Boolean);
    if (errors.length) { setMonthlyError("تعذر تحميل التقرير: "+errors.join(" | ")); setMonthlyBusy(false); return; }
    const contracts = (ct.data ?? []) as ContractReportRow[];
    const tenantsList = (tn.data ?? []) as ResidentialTenant[];
    const ownersList = (ow.data ?? []) as PropertyOwner[];
    const installments = (ins.data ?? []) as Record<string,unknown>[];
    const allocations = (alloc.data ?? []) as Record<string,unknown>[];
    const allocKey = ["installment_id","rent_installment_id"].find(k => allocations.length===0 || k in allocations[0]);
    const amountKey = ["amount","allocated_amount","applied_amount"].find(k => allocations.length===0 || k in allocations[0]);
    const allocDateKey = ["paid_at","payment_date","allocated_at","created_at"].find(k => allocations.length===0 || k in allocations[0]);
    if (allocations.length && (!allocKey || !amountKey || !allocDateKey)) { setMonthlyError("سجل توزيع الإيجارات لا يحتوي أعمدة ربط أو تاريخ تحصيل كافية لإعداد تقرير تاريخي دقيق."); setMonthlyBusy(false); return; }
    const chargeRows = (charges.data ?? []) as BillRow[];
    const paymentRows = (chargePayments.data ?? []) as BillPayment[];
    const lines: MonthlyLine[] = ((ap.data ?? []) as ResidentialRow[]).map(raw => {
      const apartment = fromResidentialRow(raw);
      const relatedContracts = contracts.filter(c => c.apartment_id === apartment.id && c.contract_type === "إيجار" && c.start_date <= end);
      const contract = relatedContracts.filter(c => c.end_date > month+"-01").sort((a,b)=>b.start_date.localeCompare(a.start_date))[0] ?? relatedContracts.sort((a,b)=>b.start_date.localeCompare(a.start_date))[0] ?? null;
      const matchingInstallments = installments.filter(i => relatedContracts.some(c=>c.id===String(i.contract_id)) && monthlyDate(i.due_date) <= end);
      const matchingIds = new Set(matchingInstallments.map(i=>String(i.id)));
      const rentAlloc = allocations.filter(a=>matchingIds.has(String(a[allocKey ?? "installment_id"])) && monthlyDate(a[allocDateKey ?? "created_at"]) <= end);
      const rentDue = matchingInstallments.reduce((v,i)=>v+monthlyNum(i.amount),0);
      const rentPaid = rentAlloc.reduce((v,a)=>v+monthlyNum(a[amountKey ?? "amount"]),0);
      const amounts = (type: string) => {
        const rows = chargeRows.filter(b=>b.apartment_id===apartment.id && (type==="other" ? !["water","electricity"].includes(b.charge_type) : b.charge_type===type) && monthlyDate(b.due_date || b.issued_at)<=end);
        const ids = new Set(rows.map(b=>b.id));
        const paid = paymentRows.filter(p=>ids.has(p.charge_id) && monthlyDate(p.paid_at)<=end);
        return {due:rows.reduce((v,b)=>v+monthlyNum(b.amount),0),paid:paid.reduce((v,p)=>v+monthlyNum(p.amount),0),dates:paid.map(p=>monthlyDate(p.paid_at))};
      };
      const other=amounts("other"), water=amounts("water"), electricity=amounts("electricity");
      const dates=[...rentAlloc.map(a=>monthlyDate(a[allocDateKey ?? "created_at"])),...other.dates,...water.dates,...electricity.dates].filter(Boolean).sort();
      return {apartment,contract,tenant:tenantsList.find(t=>t.id===contract?.tenant_id)??null,owner:ownersList.find(o=>o.id===(contract?.owner_id??apartment.ownerId))??null,rentDue,rentPaid,otherDue:other.due,otherPaid:other.paid,waterDue:water.due,waterPaid:water.paid,electricityDue:electricity.due,electricityPaid:electricity.paid,lastPayment:dates.at(-1)??null};
    });
    setMonthlyLines(lines); setMonthlyLoadedMonth(month); setMonthlyBusy(false);
  };
  const monthlyTotals = (l:MonthlyLine) => ({
    due:l.rentDue+(monthlyShowOther?l.otherDue:0)+(monthlyShowWater?l.waterDue:0)+(monthlyShowElectricity?l.electricityDue:0),
    paid:l.rentPaid+(monthlyShowOther?l.otherPaid:0)+(monthlyShowWater?l.waterPaid:0)+(monthlyShowElectricity?l.electricityPaid:0)
  });
  const monthlyVisible = monthlyLines.filter(l=> (!monthlyOnlyDue || monthlyTotals(l).due-monthlyTotals(l).paid>0.005) && [l.apartment.number,l.apartment.buildingName,l.tenant?.full_name,l.contract?.contract_number].join(" ").toLocaleLowerCase().includes(monthlySearch.toLocaleLowerCase()));
  const monthlySum = (field:"due"|"paid") => monthlyVisible.reduce((sum,l)=>sum+monthlyTotals(l)[field],0);
  const monthlyHeaders = () => ["الشقة","العمارة","النوع","المساحة","المستأجر","جوال المستأجر","رقم العقد","بداية العقد","نهاية العقد",...(monthlyShowOwner?["المالك","جوال المالك"]:[]),"الإيجار المستحق","الإيجار المحصل",...(monthlyShowOther?["المستحقات الأخرى","محصل الأخرى"]:[]),...(monthlyShowWater?["المياه المستحقة","المياه المحصلة"]:[]),...(monthlyShowElectricity?["الكهرباء المستحقة","الكهرباء المحصلة"]:[]),"إجمالي المستحق","إجمالي المحصل","المتبقي","آخر تحصيل"];
  const monthlyCells = (l:MonthlyLine) => [l.apartment.number,l.apartment.buildingName||"—",l.apartment.type,`${l.apartment.area} م²`,l.tenant?.full_name||"—",l.tenant?.phone||"—",l.contract?.contract_number||"—",l.contract?.start_date||"—",l.contract?.end_date||"—",...(monthlyShowOwner?[l.owner?.full_name||"—",l.owner?.mobile||l.owner?.phone||"—"]:[]),l.rentDue,l.rentPaid,...(monthlyShowOther?[l.otherDue,l.otherPaid]:[]),...(monthlyShowWater?[l.waterDue,l.waterPaid]:[]),...(monthlyShowElectricity?[l.electricityDue,l.electricityPaid]:[]),monthlyTotals(l).due,monthlyTotals(l).paid,monthlyTotals(l).due-monthlyTotals(l).paid,l.lastPayment||"—"];
  const monthlyReportHtml = () => {
    const safe = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
    const logoUrl = new URL("/aqary-smart-logo.png", window.location.origin).href;
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>التقرير الشهري ${safe(monthlyLoadedMonth)}</title><style>
      *{box-sizing:border-box}body{font-family:Tahoma,Arial,sans-serif;color:#15382f;direction:rtl;margin:20px}
      .report-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;border-bottom:3px solid #13503e;padding:8px 4px 15px;direction:rtl;margin-bottom:16px}
      .report-heading__title{flex:1;text-align:right;padding-top:12px}h1{color:#12503e;font-size:23px;margin:0 0 12px}
      .report-heading__meta{font-size:13px;font-weight:bold;line-height:1.9;margin:0}
      .report-heading__brand{width:170px;flex-shrink:0;text-align:center;direction:rtl;color:#12503e;font-weight:bold;break-inside:avoid;page-break-inside:avoid}
      .report-heading__brand img{display:block;max-width:120px;max-height:100px;object-fit:contain;margin:0 auto 6px}
      .report-heading__brand div{font-size:13px;line-height:1.65}
      table{border-collapse:collapse;width:100%;font-size:11px}th,td{border:1px solid #9caea6;padding:7px;text-align:right;white-space:nowrap}
      th{background:#12503e;color:white}tr:nth-child(even){background:#edf5ef}thead{display:table-header-group}tr{break-inside:avoid;page-break-inside:avoid}
      @page{size:A3 landscape;margin:10mm}@media print{body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.report-heading{break-inside:avoid}}
      </style></head><body>
      <header class="report-heading"><div class="report-heading__title"><h1>عقاري سمارت | التقرير الشهري للشقق</h1>
      <p class="report-heading__meta">شهر التقرير: ${safe(monthlyLoadedMonth)} | عدد الشقق: ${monthlyVisible.length} | المستحق: ${formatFinancialPrice(monthlySum("due"))} ر.س | المحصل: ${formatFinancialPrice(monthlySum("paid"))} ر.س | المتبقي: ${formatFinancialPrice(monthlySum("due")-monthlySum("paid"))} ر.س</p></div>
      <div class="report-heading__brand"><img src="${safe(logoUrl)}" alt="شعار عقاري سمارت"/><div>م/ علي نصر</div><div dir="ltr">0570026229</div></div></header>
      <table><thead><tr>${monthlyHeaders().map(h=>`<th>${safe(h)}</th>`).join("")}</tr></thead><tbody>${monthlyVisible.map(l=>`<tr>${monthlyCells(l).map(c=>`<td>${safe(typeof c==="number"?formatFinancialPrice(c):c)}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  };
  const printMonthly = () => { if(!monthlyLoadedMonth)return;const w=window.open("","_blank","width=1200,height=800");if(!w){setMonthlyError("اسمح بالنوافذ المنبثقة للطباعة.");return;}w.document.open();w.document.write(monthlyReportHtml());w.document.close();w.focus();w.setTimeout(()=>w.print(),350); };
  const exportMonthly = () => { if(!monthlyLoadedMonth)return;const csv=[monthlyHeaders(),...monthlyVisible.map(monthlyCells)].map(row=>row.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");const blob=new Blob(["\ufeff",csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`aqary-monthly-${monthlyLoadedMonth}.csv`;document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000); };
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSearch, setReportSearch] = useState("");
  const financialCategories = ["إجمالي الإيجارات", "إجمالي المستحقات", "إجمالي فواتير المياه", "إجمالي فواتير الكهرباء"];
  const financialRows = () => detailCategory === "إجمالي الإيجارات" ? reportContracts.map(c => [c.contract_number || "—", apartments.find(a=>a.id===c.apartment_id)?.number || "—", tenants.find(t=>t.id===c.tenant_id)?.full_name || "—", c.start_date, c.end_date, `${formatPrice(Number(c.rent_amount ?? 0))} ر.س`, leaseFinance.loading || leaseFinance.error ? "—" : `${formatFinancialPrice(rentByContract[c.id]?.due ?? 0)} ر.س`, leaseFinance.loading || leaseFinance.error ? "—" : `${formatFinancialPrice(rentByContract[c.id]?.collected ?? 0)} ر.س`, leaseFinance.loading || leaseFinance.error ? "—" : `${formatFinancialPrice(rentByContract[c.id]?.remaining ?? 0)} ر.س`]) : filteredBills(detailCategory || "").map(b => [apartments.find(a => a.id === b.apartment_id)?.number || "—", b.title || (b.charge_type === "water" ? "مياه" : b.charge_type === "electricity" ? "كهرباء" : "مستحقات"), b.issued_at?.slice(0,10) || "—", `${formatFinancialPrice(Number(b.amount))} ر.س`, `${formatFinancialPrice(billPaid(b.id))} ر.س`, `${formatFinancialPrice(Math.max(0, Number(b.amount) - billPaid(b.id)))} ر.س`]);
  // Individual bill management. Mutations remain subject to Supabase RLS.
  const [selectedBill, setSelectedBill] = useState<BillRow | null>(null);
  const [billAction, setBillAction] = useState<"view" | "edit" | "delete" | null>(null);
  const [billEdit, setBillEdit] = useState({ title: "", amount: "", issued_at: "", due_date: "" });
  const [billActionError, setBillActionError] = useState("");
  const [billActionBusy, setBillActionBusy] = useState(false);
  const openBillAction = (bill: BillRow, action: "view" | "edit" | "delete") => {
    setSelectedBill(bill); setBillAction(action); setBillActionError("");
    setBillEdit({ title: bill.title || "", amount: String(bill.amount), issued_at: bill.issued_at?.slice(0, 10) || "", due_date: bill.due_date?.slice(0, 10) || "" });
  };
  const saveBillAction = async () => {
    if (!selectedBill || !billAction || billActionBusy) return;
    if (!canWrite) { setBillActionError("الإجراء متاح حاليًا لمسؤول النظام المخوّل فقط."); return; }
    const paid = billPaid(selectedBill.id);
    if (billAction === "delete" && paid > 0) { setBillActionError("لا يمكن حذف فاتورة مرتبطة بتحصيلات. يجب معالجة التحصيلات أولًا من السجل المالي."); return; }
    const amount = Number(billEdit.amount);
    if (billAction === "edit") {
      if (!billEdit.title.trim() || !billEdit.issued_at || !billEdit.due_date || !billEdit.amount.trim() || !Number.isFinite(amount) || amount < paid || amount < 0) {
        setBillActionError(`راجع البيانات: المبلغ يجب ألا يقل عن المحصل (${formatFinancialPrice(paid)} ر.س)، والتواريخ والعنوان مطلوبة.`); return;
      }
    }
    setBillActionBusy(true); setBillActionError("");
    const query = supabase.from("residential_charges");
    const { error } = billAction === "delete"
      ? await query.delete().eq("id", selectedBill.id).eq("company_id", RESIDENTIAL_COMPANY_ID)
      : await query.update({ title: billEdit.title.trim(), amount, issued_at: billEdit.issued_at, due_date: billEdit.due_date }).eq("id", selectedBill.id).eq("company_id", RESIDENTIAL_COMPANY_ID);
    setBillActionBusy(false);
    if (error) { setBillActionError(`تعذر تنفيذ العملية: ${error.message}`); return; }
    setSelectedBill(null); setBillAction(null);
    await loadBills();
  };
  const financialHeaders = ["رقم العقد", "الشقة", "المستأجر", "تاريخ البداية", "تاريخ الانتهاء", "قيمة العقد", "المستحق حتى اليوم", "المحصل", "المتبقي"];
  const occupancyCategories = ["إجمالي الشقق", "إجمالي المؤجرة", "إجمالي الفارغة", "إجمالي المحجوزة"];
  const occupancyApartments = () => activeApartments.filter(a =>
    detailCategory === "إجمالي الشقق" ||
    (detailCategory === "إجمالي المؤجرة" ? a.status === "مؤجرة" :
     detailCategory === "إجمالي المحجوزة" ? a.status === "محجوزة" : a.status === "متاحة")
  );
  const occupancyRows = () => occupancyApartments().map(a => [
    a.number, a.buildingName || "—", a.type, String(a.rooms), a.status,
    `${formatPrice(a.price)} ر.س`, a.rentCategory || "—",
    owners.find(o => o.id === a.ownerId)?.full_name || "—",
    a.location || "—"
  ]).filter(row => row.some(cell => String(cell).toLocaleLowerCase().includes(reportSearch.trim().toLocaleLowerCase())));
  const reportTableData = () => {
    const category = detailCategory;
    const headers = financialCategories.includes(category ?? "") ? (category === "إجمالي الإيجارات" ? financialHeaders : ["الشقة", "نوع المستحق", "تاريخ الفاتورة", "القيمة", "المحصل", "المتبقي"]) : occupancyCategories.includes(category ?? "") ? ["رقم الشقة", "العمارة", "نوع الشقة", "الغرف", "الحالة", "الإيجار", "فترة الإيجار", "المالك", "الموقع"]
      : category === "تقارير الشقق" ? ["رقم الشقة","العمارة","النوع","الحالة","الإيجار","المالك"]
      : category === "تقارير العقود" ? ["رقم العقد","نوع العقد","الشقة","المستأجر","المالك","البداية","النهاية","قيمة الإيجار"]
      : category === "تقارير العملاء" ? ["العميل","الجوال","الهوية","الجنسية","البريد","عدد العقود"]
      : ["المالك","الجوال","الهوية","الجنسية","الشقق","العقود"];
    const rows = financialCategories.includes(category ?? "") ? financialRows().filter(row=>row.some(cell=>String(cell).toLocaleLowerCase().includes(reportSearch.trim().toLocaleLowerCase()))) : occupancyCategories.includes(category ?? "") ? occupancyRows() : (category === "تقارير الشقق" ? activeApartments.map(a=>[a.number,a.buildingName||"—",a.type,a.status,`${formatPrice(a.price)} ر.س`,owners.find(o=>o.id===a.ownerId)?.full_name||"—"])
      : category === "تقارير العقود" ? reportContracts.map(c=>[c.contract_number,c.contract_type,apartments.find(a=>a.id===c.apartment_id)?.number||"—",tenants.find(t=>t.id===c.tenant_id)?.full_name||"—",owners.find(o=>o.id===c.owner_id)?.full_name||"—",c.start_date,c.end_date,c.rent_amount==null?"—":`${formatPrice(Number(c.rent_amount))} ر.س`])
      : category === "تقارير العملاء" ? tenants.map(t=>[t.full_name,t.phone||"—",t.identity_number||"—",t.nationality||"—",t.email||"—",String(reportContracts.filter(c=>c.tenant_id===t.id).length)])
      : owners.map(o=>[o.full_name,o.mobile||o.phone||"—",o.identity_number||"—",o.nationality||"—",String(apartments.filter(a=>a.ownerId===o.id&&!a.archivedAt).length),String(reportContracts.filter(c=>c.owner_id===o.id).length)]))
      .filter(row=>row.some(cell=>String(cell).toLocaleLowerCase().includes(reportSearch.trim().toLocaleLowerCase())));
    return { headers, rows };
  };
  const escapeReportHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char] ?? char));
  const reportHtml = () => {
    const {headers,rows} = reportTableData();
    const logoUrl = new URL("/aqary-smart-logo.png", window.location.origin).href;
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"/><title>${escapeReportHtml(detailCategory)}</title><style>
      *{box-sizing:border-box}body{font-family:Tahoma,Arial,sans-serif;color:#15382f;margin:25px;direction:rtl}
      .report-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;border-bottom:3px solid #13503e;padding:8px 4px 15px;direction:rtl}
      .report-heading__title{flex:1;text-align:right;padding-top:12px}
      h1{color:#12503e;font-size:23px;margin:0 0 12px} .report-heading__meta{font-size:13px;font-weight:bold;margin:0}
      .report-heading__brand{width:170px;flex-shrink:0;text-align:center;direction:rtl;color:#12503e;font-weight:bold}
      .report-heading__brand img{display:block;max-width:120px;max-height:100px;object-fit:contain;margin:0 auto 6px}
      .report-heading__brand div{font-size:13px;line-height:1.65}
      table{width:100%;border-collapse:collapse;margin-top:18px;font-size:12px}
      th{background:#13503e;color:white}th,td{border:1px solid #9caea6;padding:9px;text-align:right}
      tr:nth-child(even){background:#edf5ef}thead{display:table-header-group}tr{break-inside:avoid;page-break-inside:avoid}
      @page{size:A4 landscape;margin:12mm}
      @media print{body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.report-heading{break-inside:avoid}}
      </style></head><body>
      <header class="report-heading">
        <div class="report-heading__title"><h1>عقاري سمارت | ${escapeReportHtml(detailCategory)}</h1><p class="report-heading__meta">تاريخ التقرير: ${new Date().toLocaleDateString("ar-SA")} | عدد النتائج: ${rows.length}</p></div>
        <div class="report-heading__brand"><img src="${escapeReportHtml(logoUrl)}" alt="شعار عقاري سمارت"/><div>م/ علي نصر</div><div dir="ltr">0570026229</div></div>
      </header>
      <table><thead><tr>${headers.map(h=>`<th>${escapeReportHtml(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${escapeReportHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  };
  const printReport = () => {
    if (reportLoading || reportError) return;
    const popup = window.open("", "_blank", "width=1100,height=750");
    if (!popup) { setReportError("المتصفح منع نافذة الطباعة. اسمح بالنوافذ المنبثقة وحاول مجددًا."); return; }
    popup.document.open(); popup.document.write(reportHtml()); popup.document.close();
    popup.focus(); popup.setTimeout(()=>popup.print(), 350);
  };
  const exportReportExcel = () => {
    if (reportLoading || reportError) return;
    // Excel-compatible HTML spreadsheet; Arabic and RTL supported without dependencies.
    const html = reportHtml().replace("<html lang=", '<html xmlns:x="urn:schemas-microsoft-com:office:excel" lang=');
    const blob = new Blob(["\\ufeff", html], {type:"application/vnd.ms-excel;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href=url; link.download=`${detailCategory ?? "report"}-${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const openReport = async (category: string) => {
    setDetailCategory(category); setReportSearch(""); setReportError("");
    if (!["تقارير الشقق", "تقارير العقود", "تقارير العملاء", "تقارير الملاك", ...financialCategories].includes(category)) return;
    setReportLoading(true);
    const jobs: PromiseLike<unknown>[] = [];
    // Refresh each report from its company-scoped source.
    if (financialCategories.includes(category) && category !== "إجمالي الإيجارات") jobs.push(loadBills(),loadResidentialApartments());
    if (category === "تقارير الشقق") jobs.push(loadResidentialApartments());
    if (category === "تقارير العملاء") jobs.push(loadResidentialTenants());
    if (category === "تقارير الملاك") jobs.push(loadOwners());
    if (category === "تقارير العقود" || category === "تقارير العملاء" || category === "تقارير الملاك" || category === "إجمالي الإيجارات") {
      jobs.push((async () => {
        const {data,error} = await supabase.from("residential_contracts")
          .select("id,apartment_id,owner_id,tenant_id,contract_number,contract_type,start_date,end_date,rent_amount,rent_period,status,notes")
          .eq("company_id", RESIDENTIAL_COMPANY_ID).order("start_date", {ascending:false});
        if (error) setReportError(error.message);
        else setReportContracts((data ?? []) as ContractReportRow[]);
      })());
    }
    if (category === "تقارير العقود" || category === "إجمالي الإيجارات") jobs.push(loadResidentialApartments(),loadResidentialTenants(),loadOwners());
    await Promise.allSettled(jobs);
    setReportLoading(false);
  };

  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const isSaveSuccess = actionNotice?.startsWith("تم حفظ بيانات الشقة في Supabase بنجاح") || actionNotice === "تم تسجيل العميل الجديد بنجاح." || actionNotice?.startsWith("تمت أرشفة") || actionNotice?.startsWith("تم استرجاع");
  useEffect(() => {
    if (!isSaveSuccess) return;
    const timeout = window.setTimeout(() => setActionNotice(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [actionNotice, isSaveSuccess]);
  const [operationModal, setOperationModal] = useState<"charge" | "collectCharge" | "collectRent" | "types" | null>(null);
  const [operationType, setOperationType] = useState("كهرباء");
  const [operationAmount, setOperationAmount] = useState("");
  const [operationDate, setOperationDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [operationMonth, setOperationMonth] = useState(() => new Date().toLocaleDateString("en-CA").slice(0, 7));
  const [operationNotes, setOperationNotes] = useState("");
  const [operationApartments, setOperationApartments] = useState<string[]>([]);
  const [operationSearch, setOperationSearch] = useState("");
  const [operationSaving, setOperationSaving] = useState(false);
  const [operationError, setOperationError] = useState("");
  const [operationRequestId, setOperationRequestId] = useState(() => crypto.randomUUID());
  const saveFinancialOperation = async () => {
    if (operationSaving || !operationModal || operationModal === "types") return;
    if (!canWrite) { setOperationError("ليس لديك صلاحية تسجيل العمليات المالية."); return; }
    const amount = Number(operationAmount);
    if (!operationApartments.length || !Number.isFinite(amount) || amount <= 0 || Math.abs(Math.round(amount * 100) - amount * 100) > 0.000001 || !operationMonth || !operationDate) {
      setOperationError("حدد الشقق وأدخل مبلغًا صحيحًا أكبر من صفر، والشهر والتاريخ."); return;
    }
    setOperationSaving(true); setOperationError("");
    const { data, error } = await supabase.rpc("apply_residential_financial_operation", {
      p_request_id: operationRequestId,
      p_company_id: RESIDENTIAL_COMPANY_ID,
      p_kind: operationModal,
      p_apartment_ids: operationApartments,
      p_charge_type: operationType,
      p_amount: amount,
      p_month: `${operationMonth}-01`,
      p_operation_date: operationDate,
      p_notes: operationNotes.trim() || null,
    });
    setOperationSaving(false);
    if (error) { setOperationError(`تعذر حفظ العملية: ${error.message}`); return; }
    setOperationModal(null);
    await Promise.all([loadBills(), loadResidentialApartments()]);
    setActionNotice(`تم حفظ العملية بنجاح لعدد ${String(data ?? operationApartments.length)} شقة وتحديث الأرصدة.`);
  };

  const openOperationModal = (kind: "charge" | "collectCharge" | "collectRent" | "types") => {
    setOperationType("كهرباء"); setOperationAmount(""); setOperationNotes("");
    setOperationApartments([]); setOperationSearch(""); setOperationError(""); setOperationRequestId(crypto.randomUUID()); setOperationModal(kind);
    if (kind === "types") { resetTypeEditor(); setTypeManagerNotice(""); }
  };
  useEffect(() => {
    const request = (location.state as { residentialFinancialAction?: { kind?: string; apartmentId?: string; apartmentNumber?: string } } | null)?.residentialFinancialAction;
    if (!request || loadingApartments) return;
    const selected = apartments.find(a => a.id === request.apartmentId && !a.archivedAt);
    if (selected && (request.kind === "charge" || request.kind === "collectCharge")) {
      setOperationType("كهرباء"); setOperationAmount(""); setOperationNotes("");
      setOperationApartments([selected.id]); setOperationSearch(selected.number);
      setOperationModal(request.kind);
    } else {
      setActionNotice("تعذر تحديد الشقة المطلوبة للعملية؛ تأكد من وجود الشقة وصلاحية الوصول إليها.");
    }
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, loadingApartments, apartments, navigate]);
  const [archivePicker, setArchivePicker] = useState(false);
  const [archiveSelection, setArchiveSelection] = useState<string[]>([]);
  const [archiveSearch, setArchiveSearch] = useState("");
  const [archiveView, setArchiveView] = useState<"active" | "archived">("active");
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const archiveCandidates = apartments.filter(a => Boolean(a.archivedAt) === (archiveView === "archived") &&
    [a.number, a.buildingName ?? "", a.type, a.location].some(value => value.toLocaleLowerCase("ar").includes(archiveSearch.trim().toLocaleLowerCase("ar"))));
  const openArchivePicker = (id?: string) => {
    setArchiveView("active"); setArchiveSearch(""); setArchiveSelection(id ? [id] : []);
    setArchiveConfirm(false); setArchivePicker(true);
  };
  const switchArchiveView = (view: "active" | "archived") => {
    setArchiveView(view); setArchiveSelection([]); setArchiveSearch(""); setArchiveConfirm(false);
  };
  const applyArchive = async () => {
    if (archiveBusy || !archiveSelection.length || !canWrite) return;
    if (archiveView === "active" && !archiveConfirm) { setArchiveConfirm(true); return; }
    setArchiveBusy(true);
    const ids = [...archiveSelection];
    const { data, error } = await supabase.from("residential_apartments")
      .update({ archived_at: archiveView === "active" ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
      .eq("company_id", RESIDENTIAL_COMPANY_ID).in("id", ids)
      .select("id");
    setArchiveBusy(false);
    if (error || (data?.length ?? 0) !== ids.length) {
      setActionNotice(`تعذر ${archiveView === "active" ? "أرشفة" : "استرجاع"} الشقق: ${error?.message ?? "لم يتم تحديث جميع الشقق؛ تحقق من الصلاحيات وحالة البيانات"}`);
      return;
    }
    setArchivePicker(false); setArchiveConfirm(false); setArchiveSelection([]);
    if (selectedApartment && ids.includes(selectedApartment.id)) setSelectedApartment(null);
    await loadResidentialApartments();
    setActionNotice(archiveView === "active" ? `تمت أرشفة ${ids.length} شقة بنجاح.` : `تم استرجاع ${ids.length} شقة بنجاح.`);
  };
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
      if (apartment.archivedAt) return false;
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
  }, [apartments, search, statusFilter, typeFilter]);

  const activeApartments = apartments.filter((item) => !item.archivedAt);
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
    setApartmentTab("apartment"); setOwnerMode("new"); setOwnerId(""); setOwnerForm(emptyOwnerForm);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true); void loadOwners();
  };

  const openEditModal = (apartment: Apartment) => {
    setEditingApartment(apartment);
    setApartmentTab("apartment"); setOwnerId(apartment.ownerId ?? "");
    setOwnerMode(apartment.ownerId ? "existing" : "new"); setOwnerForm(emptyOwnerForm);
    void loadOwners();
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
    if (ownerMode === "new" && ownerForm.full_name.trim() === "" && Object.values(ownerForm).some(v => v.trim())) {
      setApartmentTab("owner"); setActionNotice("أدخل اسم المالك لإكمال بياناته."); return;
    }
    if (ownerMode === "existing" && ownerId && !owners.some(o => o.id === ownerId)) {
      setApartmentTab("owner"); setActionNotice("اختر مالكًا مسجلًا صحيحًا."); return;
    }
    if (ownerMode === "new" && ownerForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerForm.email.trim())) {
      setApartmentTab("owner"); setActionNotice("البريد الإلكتروني للمالك غير صحيح."); return;
    }
    setSavingApartment(true);
    let linkedOwnerId: string | null = ownerMode === "existing" ? (ownerId || null) : null;
    if (ownerMode === "new" && ownerForm.full_name.trim()) {
      const { data: savedOwner, error: ownerSaveError } = await supabase.from("property_owners")
        .insert({ company_id: RESIDENTIAL_COMPANY_ID,
          full_name: ownerForm.full_name.trim(), mobile: ownerForm.mobile.trim() || null,
          phone: ownerForm.phone.trim() || null, email: ownerForm.email.trim() || null,
          nationality: ownerForm.nationality.trim() || null,
          identity_number: ownerForm.identity_number.trim() || null })
        .select("id").single();
      if (ownerSaveError || !savedOwner) {
        setSavingApartment(false); setApartmentTab("owner");
        setActionNotice(`تعذر حفظ المالك: ${ownerSaveError?.message ?? "خطأ غير معروف"}`); return;
      }
      linkedOwnerId = savedOwner.id;
      setOwnerId(savedOwner.id); setOwnerMode("existing");
      await loadOwners();
    }
    const payload = {
      company_id: RESIDENTIAL_COMPANY_ID,
      owner_id: linkedOwnerId,
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

  const handleDelete = (id: string) => {
    if (!canWrite) { setActionNotice("ليس لديك صلاحية أرشفة الشقق."); return; }
    openArchivePicker(id);
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
            <div className="mt-6 grid w-full max-w-[1400px] grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_repeat(4,minmax(0,145px))] lg:items-stretch">
              <div className="group relative min-w-0 lg:self-stretch"><Search size={21} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-emerald-300"/><input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder="ابحث بالاسم أو رقم الهاتف أو رقم العقد أو رقم الشقة..." aria-label="البحث في الشقق" className="h-full min-h-[66px] w-full rounded-2xl border border-emerald-300/45 bg-[#064138]/60 pr-12 pl-5 text-center text-sm font-semibold text-white shadow-[inset_0_1px_8px_rgba(0,0,0,.25),0_0_20px_rgba(14,192,148,.12)] outline-none backdrop-blur-xl placeholder:text-emerald-100/45 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/15"/></div>
              <div className="grid grid-rows-2 gap-2">
                <button type="button" onClick={()=>{void openReport("تقارير الشقق");}} className="flex min-h-[56px] items-center justify-center gap-2 rounded-xl border border-emerald-300/55 bg-gradient-to-br from-emerald-400/20 to-[#072e28] px-2 text-xs font-black text-white transition hover:border-emerald-200"><FileBarChart2 className="shrink-0 text-emerald-300" size={21}/>تقارير الشقق</button>
                <button type="button" onClick={()=>{void openReport("تقارير العقود");}} className="flex min-h-[56px] items-center justify-center gap-2 rounded-xl border border-emerald-300/55 bg-gradient-to-br from-emerald-400/20 to-[#072e28] px-2 text-xs font-black text-white transition hover:border-emerald-200"><ReceiptText className="shrink-0 text-emerald-300" size={21}/>تقارير العقود</button>
              </div>
              <div className="grid grid-rows-2 gap-2">
                <button type="button" onClick={()=>{void openReport("تقارير العملاء");}} className="flex min-h-[56px] items-center justify-center gap-2 rounded-xl border border-amber-300/60 bg-gradient-to-br from-amber-300/20 to-[#342a16]/60 px-2 text-xs font-black text-white transition hover:border-amber-200"><ContactRound className="shrink-0 text-amber-300" size={21}/>تقارير العملاء</button>
                <button type="button" onClick={()=>{void openReport("تقارير الملاك");}} className="flex min-h-[56px] items-center justify-center gap-2 rounded-xl border border-amber-300/60 bg-gradient-to-br from-amber-300/20 to-[#342a16]/60 px-2 text-xs font-black text-white transition hover:border-amber-200"><UserRoundCheck className="shrink-0 text-amber-300" size={21}/>تقارير الملاك</button>
              </div>
              <button type="button" onClick={()=>{setMonthlyOpen(true);setMonthlyError("");setMonthlyLoadedMonth("");void loadMonthlyReport(monthlyMonth);}} className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-2xl border border-sky-300/55 bg-gradient-to-br from-sky-400/20 to-[#092b31] px-2 text-sm font-black text-white transition hover:border-sky-200"><CalendarDays className="text-sky-300" size={29}/>تقارير الشهر</button>
              <button type="button" onClick={()=>navigate("/apartments/map")} className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-2xl border border-amber-300/60 bg-gradient-to-br from-amber-300/20 via-[#113e32] to-[#072e28] px-2 text-sm font-black text-white transition hover:border-amber-200"><MapIcon className="text-amber-300" size={30}/>خريطة الشقق</button>
            </div>
          </div>
        </div>

        {/* Eleven coordinated action cards — visual styling only; original handlers preserved. */}
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {([
            {label:"إضافة شقة",icon:<Plus size={35}/>,click:openAddModal,color:"#10B981",base:"#0C4439"},
             {label:"إضافة عقد جديد",icon:<FilePlus2 size={34}/>,click:openContractModal,color:"#F5C96B",base:"#4A3A1D"},
            {label:"حذف / أرشفة شقة",icon:<Trash2 size={34}/>,click:()=>openArchivePicker(),color:"#FB7185",base:"#452A37"},
            {label:refreshingData ? "جارٍ تحديث البيانات..." : "تحديث البيانات",icon:<RefreshCw size={34} className={refreshingData ? "animate-spin" : ""}/>,click:()=>{void refreshPageData();},disabled:refreshingData,color:"#38BDF8",base:"#123E50"},
            {label:"حجز جديد",icon:<CalendarPlus size={34}/>,click:openBooking,color:"#FBBF24",base:"#4A3E1D"},
            {label:"عميل جديد",icon:<UserRoundPlus size={34}/>,click:()=>{setBookingTenantAfterCreate(false);setTenantError("");setTenantModal(true);},color:"#C4B5FD",base:"#373052"},
            {label:"إضافة مالك",icon:<UserRoundCheck size={34}/>,click:openStandaloneOwner,color:"#22D3EE",base:"#10434B"},
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
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {([
            {kind:"charge" as const,label:"إضافة فاتورة أو مستحقات",icon:<ReceiptText size={32}/>,color:"#FCD34D",base:"#463B20"},
            {kind:"collectCharge" as const,label:"تحصيل فاتورة أو مستحقات",icon:<Banknote size={32}/>,color:"#34D399",base:"#104B3C"},
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

        <div onClick={() => { void openExpiryModal(); }} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); void openExpiryModal(); } }} aria-label="عرض جميع العقود مرتبة حسب تاريخ الانتهاء" className="group relative mb-5 w-full cursor-pointer overflow-hidden rounded-[25px] border border-amber-300/75 bg-gradient-to-l from-[#052e27] via-[#05221e] to-[#24351e] text-white shadow-[0_0_23px_rgba(244,191,53,.23),inset_0_1px_0_rgba(255,255,255,.18)] transition hover:border-amber-200 hover:shadow-[0_0_36px_rgba(244,191,53,.33)]">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent via-amber-100/[.035] to-transparent"/>
          <div className="relative grid min-h-[192px] grid-cols-1 items-center gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_1.6fr_minmax(0,1fr)]">
            <div className="hidden h-[154px] items-center justify-center lg:flex" aria-hidden="true"><svg width="230" height="152" viewBox="0 0 230 152" fill="none"><ellipse cx="115" cy="137" rx="106" ry="12" fill="#CDA84B" opacity=".16"/><rect x="44" y="24" width="115" height="108" rx="14" fill="#A47B27" stroke="#F4D06B" strokeWidth="2"/><rect x="52" y="38" width="99" height="86" rx="8" fill="#132C26"/><rect x="52" y="38" width="99" height="22" rx="7" fill="#D2AA48"/><path d="M74 18v23M130 18v23" stroke="#F7DE92" strokeWidth="9" strokeLinecap="round"/>{[0,1,2].map((i)=>[0,1,2].map((j)=><rect key={`${i}-${j}`} x={65+j*27} y={71+i*17} width="15" height="10" rx="2" fill="#E9C568" opacity={i===2&&j===2?.4:1}/>))}<circle cx="162" cy="110" r="30" fill="#0C332B" stroke="#F4D06B" strokeWidth="5"/><path d="M162 90v20l14 9" stroke="#F4D06B" strokeWidth="5" strokeLinecap="round"/><circle cx="162" cy="110" r="3" fill="#F4D06B"/></svg></div>
            <div className="flex flex-col items-center gap-2 text-center"><span className="rounded-full border border-amber-300/45 bg-amber-300/15 px-4 py-1 text-xs font-black text-amber-200">تنبيه العقود</span><h2 className="text-xl font-black text-amber-100 sm:text-2xl">العقود القريبة من الانتهاء</h2><p className="max-w-lg text-xs leading-6 text-emerald-100/65">متابعة العقود التي اقترب موعد انتهائها وتجديدها في الوقت المناسب</p><div className="mt-2 grid w-full max-w-lg grid-cols-2 gap-3"><div className="rounded-2xl border border-emerald-300/20 bg-black/20 p-3"><p className="text-xs text-emerald-100/60">إجمالي العقود</p><strong className="mt-1 block text-2xl text-white">{contractSummary.loading ? "…" : contractSummary.error ? "—" : contractSummary.count}</strong></div><div className="rounded-2xl border border-amber-300/25 bg-black/20 p-3"><p className="text-xs text-emerald-100/60">أقرب تاريخ انتهاء</p><strong className="mt-1 block text-xl text-white">{contractSummary.loading ? "…" : contractSummary.error ? "—" : contractSummary.nearest ?? "لا توجد عقود"}</strong></div></div></div>
            <div className="hidden lg:block" aria-hidden="true"/>
          </div>
        </div>

        {/* Premium illustrated occupancy cards — local data only */}
        <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {([
            {label:"إجمالي الشقق",value:activeApartments.length,art:"building" as ArtKind,accent:"border-sky-300/55",note:"عرض التفاصيل"},
            {label:"إجمالي المؤجرة",value:rentedCount,art:"rented" as ArtKind,accent:"border-amber-300/55",note:"عرض التفاصيل"},
            {label:"إجمالي الفارغة",value:availableCount,art:"vacant" as ArtKind,accent:"border-emerald-300/55",note:"عرض التفاصيل"},
            {label:"إجمالي المحجوزة",value:reservedCount,art:"reserved" as ArtKind,accent:"border-violet-300/55",note:"عرض التفاصيل"},
          ]).map(item=><button key={item.label} type="button" onClick={()=>{setReportSearch("");setReportError("");setDetailCategory(item.label);void loadOwners();}} className={`group relative flex min-h-[225px] flex-col items-center justify-center overflow-hidden rounded-[24px] border bg-gradient-to-br from-white/[.13] via-[#104036]/85 to-[#031c1a] px-3 py-4 text-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,.2),0_14px_30px_rgba(0,0,0,.3)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:brightness-110 ${item.accent}`}>
            <div className="pointer-events-none absolute -top-14 -right-14 h-40 w-40 rounded-full bg-white/[.06] blur-2xl"/>
            <div className="relative mb-1 transition duration-300 group-hover:scale-110"><CardIllustration kind={item.art}/></div>
            <h3 className="relative text-sm font-black sm:text-base">{item.label}</h3>
            <strong className="relative mt-1 text-3xl font-black tabular-nums">{item.value??"—"}</strong>
            <span className="relative mt-1 text-[11px] text-emerald-100/65">{item.note}</span>
          </button>)}
        </div>

        {/* Premium illustrated financial cards — no fabricated financial figures */}
        <div className="mb-6">
          <div className="mb-4 flex flex-col items-center text-center"><h2 className="text-2xl font-black text-amber-300">✦ الملخص المالي ✦</h2><p className="mt-1 text-xs text-emerald-100/60">الإيجارات: الأقساط المستحقة حتى اليوم، والتحصيلات المسجلة المرتبطة بها</p>{leaseStatusError && <p className="text-xs text-rose-300">{leaseStatusError}</p>}</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {([
              {label:"إجمالي الإيجارات",art:"rent" as ArtKind,accent:"border-amber-300/55"},
              {label:"إجمالي المستحقات",art:"dues" as ArtKind,accent:"border-yellow-300/50"},
              {label:"إجمالي فواتير المياه",art:"water" as ArtKind,accent:"border-cyan-300/55"},
              {label:"إجمالي فواتير الكهرباء",art:"electric" as ArtKind,accent:"border-orange-300/55"},
            ]).map(item=><button type="button" onClick={()=>void openReport(item.label)} key={item.label} className={`relative flex min-h-[288px] flex-col items-center overflow-hidden rounded-[24px] border bg-gradient-to-br from-white/[.13] via-[#0d3a32] to-[#041e1b] p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_14px_30px_rgba(0,0,0,.25)] backdrop-blur-2xl ${item.accent}`}>
              <div className="pointer-events-none absolute -top-10 left-0 h-28 w-28 rounded-full bg-white/[.05] blur-xl"/>
              <CardIllustration kind={item.art}/>
              <h3 className="mt-1 text-sm font-black text-white sm:text-base">{item.label}</h3>
              <div className="mt-2 text-2xl font-black text-white">{item.art!=="rent" ? (billsLoading || billsError ? "—" : formatFinancialPrice(billTotals(item.label).total)) : !leaseFinance.error && !leaseFinance.loading ? formatFinancialPrice(leaseFinance.due) : "—"} <span className="text-xs text-emerald-100/55">ريال</span></div>
              {item.art==="rent" && leaseFinance.error && <p className="text-xs text-rose-300">تعذر تحميل الأقساط</p>}
              {item.art!=="rent" && billsError && <p className="mt-1 text-[10px] text-rose-300">تعذر تحميل الفواتير: {billsError}</p>}
              <div className="mt-auto grid w-full grid-cols-2 gap-2 pt-4">
                <div className="rounded-2xl border border-emerald-300/40 bg-emerald-400/10 px-2 py-3"><p className="text-xs font-black text-emerald-200">التحصيل</p><strong className="mt-1 block text-xl text-white">{item.art!=="rent" ? (billsLoading || billsError ? "—" : formatFinancialPrice(billTotals(item.label).collected)) : !leaseFinance.loading && !leaseFinance.error ? formatFinancialPrice(leaseFinance.collected) : "—"}</strong></div>
                <div className="rounded-2xl border border-amber-300/40 bg-amber-400/10 px-2 py-3"><p className="text-xs font-black text-amber-200">المتبقي</p><strong className="mt-1 block text-xl text-white">{item.art!=="rent" ? (billsLoading || billsError ? "—" : formatFinancialPrice(billTotals(item.label).remaining)) : !leaseFinance.loading && !leaseFinance.error ? formatFinancialPrice(leaseFinance.remaining) : "—"}</strong></div>
              </div>
            </button>)}
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

      {bookingModal && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/85 p-3 backdrop-blur-lg sm:p-5" dir="rtl" onMouseDown={e=>{if(e.target===e.currentTarget&&!bookingBusy)setBookingModal(false);}}>
          <div role="dialog" aria-modal="true" aria-label="حجز جديد" className="relative flex flex-col overflow-hidden rounded-[22px] border border-amber-300/65 bg-[#052d26] text-white shadow-[0_28px_90px_rgba(0,0,0,.65)]" style={{width:"min(880px, calc(100vw - 32px))",maxWidth:"calc(100vw - 32px)",flex:"0 1 880px",height:"auto",maxHeight:"calc(100dvh - 36px)"}}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{backgroundImage:'url("/booking%20apartment.png")',backgroundSize:"100% 100%",backgroundPosition:"center",backgroundRepeat:"no-repeat"}} />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#032820]/52" />
            <section className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <header className="relative shrink-0 border-b border-amber-300/30 bg-[#073b30]/45 px-5 py-3 text-center"><CalendarPlus className="mx-auto mb-1 text-amber-300" size={25}/><h2 className="text-xl font-black text-amber-200">إضافة حجز جديد</h2><p className="text-[11px] text-emerald-100/70">ربط الشقة بالمستأجر وتسجيل المبلغ المدفوع</p><button type="button" onClick={()=>setBookingModal(false)} disabled={bookingBusy} className="absolute left-3 top-3 rounded-lg border border-white/25 p-1.5"><X size={18}/></button></header>
            <form onSubmit={e=>{e.preventDefault();void saveBooking();}} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-transparent p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2">
                <label className="text-sm font-bold">الشقة *<select required value={bookingForm.apartment_id} onChange={e=>{const id=e.target.value;const a=apartments.find(x=>x.id===id);setBookingForm(p=>({...p,apartment_id:id,total_amount:a?String(a.price):""}));}} className="mt-1 h-10 w-full rounded-xl border border-emerald-300/40 bg-[#073b30] px-3 text-white"><option value="">اختر شقة متاحة</option>{activeApartments.filter(a=>a.status==="متاحة").map(a=><option key={a.id} value={a.id}>{a.number} — {a.buildingName||a.location} — {formatPrice(a.price)} ر.س</option>)}</select></label>
                <div className="text-sm font-bold">المستأجر *<div className="mt-2 flex gap-2"><select required value={bookingForm.tenant_id} onChange={e=>setBookingForm(p=>({...p,tenant_id:e.target.value}))} className="h-10 min-w-0 flex-1 rounded-xl border border-emerald-300/40 bg-[#073b30] px-3 text-white"><option value="">اختر عميلًا مسجلًا</option>{tenants.map(t=><option key={t.id} value={t.id}>{t.full_name}{t.phone?` — ${t.phone}`:""}</option>)}</select><button type="button" title="إضافة عميل جديد" onClick={()=>{setBookingTenantAfterCreate(true);setTenantError("");setTenantModal(true);}} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-300 bg-amber-300/20 text-amber-200"><Plus size={23}/></button></div></div>
                <label className="text-sm font-bold">بداية الإيجار *<input required type="date" value={bookingForm.start_date} onChange={e=>setBookingForm(p=>({...p,start_date:e.target.value}))} className="mt-1 h-10 w-full rounded-xl border border-emerald-300/40 bg-[#073b30] px-3 text-white"/></label>
                <label className="text-sm font-bold">نهاية الإيجار *<input required type="date" value={bookingForm.end_date} min={bookingForm.start_date||undefined} onChange={e=>setBookingForm(p=>({...p,end_date:e.target.value}))} className="mt-1 h-10 w-full rounded-xl border border-emerald-300/40 bg-[#073b30] px-3 text-white"/></label>
                <label className="text-sm font-bold">الإيجار المتفق عليه (ر.س) *<input required min="0.01" step="0.01" type="number" value={bookingForm.total_amount} onChange={e=>setBookingForm(p=>({...p,total_amount:e.target.value}))} className="mt-1 h-10 w-full rounded-xl border border-emerald-300/40 bg-[#073b30] px-3 text-white"/></label>
                <label className="text-sm font-bold">المدفوع الآن (ر.س)<input min="0" step="0.01" type="number" value={bookingForm.paid_amount} onChange={e=>setBookingForm(p=>({...p,paid_amount:e.target.value}))} className="mt-1 h-10 w-full rounded-xl border border-emerald-300/40 bg-[#073b30] px-3 text-white"/></label>
                <label className="text-sm font-bold">طريقة الدفع<select value={bookingForm.payment_method} onChange={e=>setBookingForm(p=>({...p,payment_method:e.target.value}))} className="mt-1 h-10 w-full rounded-xl border border-emerald-300/40 bg-[#073b30] px-3 text-white"><option>نقدي</option><option>تحويل بنكي</option><option>شبكة</option></select></label>
                <label className="text-sm font-bold">حالة الحجز<select value={bookingForm.booking_status} onChange={e=>setBookingForm(p=>({...p,booking_status:e.target.value}))} className="mt-1 h-10 w-full rounded-xl border border-emerald-300/40 bg-[#073b30] px-3 text-white"><option value="confirmed">حجز مؤكد</option><option value="pending">حجز مبدئي</option></select></label>
              </div>
              <div className="flex justify-between rounded-xl border border-amber-300/35 bg-black/20 px-3 py-2 text-sm font-bold"><span>المتبقي</span><strong className="text-lg text-amber-200">{formatPrice(Math.max(0,Number(bookingForm.total_amount||0)-Number(bookingForm.paid_amount||0)))} ر.س</strong></div>
              <label className="block text-sm font-bold">ملاحظات<textarea rows={2} maxLength={500} value={bookingForm.notes} onChange={e=>setBookingForm(p=>({...p,notes:e.target.value}))} className="mt-2 w-full rounded-xl border border-emerald-300/40 bg-[#073b30] p-3 text-white"/></label>
              {bookingError&&<p role="alert" className="rounded-xl border border-rose-300/50 bg-rose-950/50 p-3 text-sm text-rose-100">{bookingError}</p>}
              <div className="flex gap-3"><button type="submit" disabled={bookingBusy||!canWrite} className="min-h-10 flex-1 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 font-black text-emerald-950 disabled:opacity-50">{bookingBusy?"جارٍ حفظ الحجز...":"حفظ الحجز"}</button><button type="button" disabled={bookingBusy} onClick={()=>setBookingModal(false)} className="min-h-10 flex-1 rounded-xl border border-emerald-200/35 font-bold">إلغاء</button></div>
            </form>
            </section>
          </div>
        </div>
      )}
      {tenantModal && (
        <div className="fixed inset-0 z-[185] flex items-center justify-center bg-black/85 p-2 backdrop-blur-lg sm:p-5" dir="rtl"
          onMouseDown={event => { if (event.target === event.currentTarget && !savingTenant) setTenantModal(false); }}>
          <div role="dialog" aria-modal="true" aria-label="إضافة عميل جديد"
            className="relative flex flex-col overflow-hidden rounded-[22px] border border-amber-300/65 bg-[#052d27] text-white shadow-[0_28px_90px_rgba(0,0,0,.65)]"
            style={{width:"min(880px, calc(100vw - 32px))",maxWidth:"calc(100vw - 32px)",flex:"0 1 880px",maxHeight:"calc(100dvh - 36px)"}}>
            <div className="pointer-events-none absolute inset-0 bg-contain bg-center bg-no-repeat" style={{backgroundImage:"url('/add-client-bg.png')",backgroundSize:"100% 100%"}} />
            <div className="pointer-events-none absolute inset-0 bg-[#04261f]/35" />
            <button type="button" disabled={savingTenant} onClick={()=>setTenantModal(false)} aria-label="إغلاق النافذة"
              className="absolute left-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-amber-200/60 bg-[#032b25]/80 text-white hover:bg-emerald-700"><X size={21}/></button>
            <div className="relative max-h-[calc(100dvh-36px)] overflow-y-auto">
              <div className="mx-auto w-full max-w-[760px] p-5 sm:p-7">
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
                  <div className="mt-4 flex gap-2">
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
        const isRent = operationModal === "collectRent";
        const title = isTypes ? "أنواع الشقق" : isRent ? "تحصيل إيجار" : (isCollection ? "تحصيل فاتورة أو مستحقات" : "إضافة فاتورة أو مستحقات");
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
                <div className="mb-4 rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-2.5 text-center text-xs font-semibold leading-5 text-amber-200">{isTypes ? "أسماء الأنواع وأسعارها المرجعية محفوظة في قاعدة بيانات Supabase ومتاحة لجميع أجهزة الشركة المصرح لها. لا تتغير إيجارات الشقق أو العقود المسجلة تلقائيًا." : "سيتم حفظ العملية في حسابات الشقق السكنية فقط، وتوزيع التحصيل على أقدم المستحقات غير المسددة حتى نهاية الشهر المختار. لا تتأثر حسابات العمائر."}</div>
                {isTypes ? (
                  <div className="grid min-h-0 grid-cols-1 gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                    <section className="rounded-3xl border border-blue-400/25 bg-[#081c31]/85 p-4 sm:p-5">
                      <div className="mb-4 text-center"><h3 className="text-lg font-black text-blue-200">أنواع الشقق المتاحة</h3><p className="text-xs text-slate-400">الأنواع المسجلة داخل هذه الصفحة</p></div>
                      <div className="max-h-[390px] space-y-2 overflow-y-auto pr-1">{typesLoading ? <p className="py-12 text-center text-sm text-slate-400">جارٍ تحميل أنواع الشقق...</p> : apartmentTypes.length ? apartmentTypes.map(t=><div key={t} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-300/15 bg-[#0b2137] p-3 text-sm"><div><strong className="block">{t}</strong><span className="text-xs text-blue-300">{apartments.filter(a=>a.type===t).length} شقة · شهري: {typeCatalog.prices[t] === undefined ? "غير محدد" : formatPrice(typeCatalog.prices[t])} · سنوي: {typeCatalog.prices[t] === undefined ? "—" : formatPrice(priceForPeriod(typeCatalog.prices[t], "سنوي") ?? 0)} · يومي: {typeCatalog.prices[t] === undefined ? "—" : formatPrice(priceForPeriod(typeCatalog.prices[t], "يومي") ?? 0)} ريال</span></div><div className="flex gap-2"><button type="button" onClick={()=>editType(t)} className="rounded-lg border border-sky-400/40 p-2 text-sky-300" aria-label={`تعديل ${t}`} title="تعديل الاسم والإيجار"><Pencil size={17}/></button><button type="button" onClick={()=>{setTypeDeleteTarget(t);setTypeManagerError("");}} className="rounded-lg border border-rose-400/40 p-2 text-rose-300" aria-label={`حذف ${t}`} title="حذف النوع"><Trash2 size={17}/></button></div></div>) : <p className="py-12 text-center text-sm text-slate-400">لا توجد أنواع مسجلة حاليًا.</p>}</div>
                    </section>
                    <section className="rounded-3xl border border-blue-400/25 bg-[#081c31]/85 p-4 sm:p-5">
                      <div className="mb-5 text-center"><h3 className="text-lg font-black text-blue-200">{typeEditOriginal ? "تعديل نوع الشقة" : "إضافة نوع شقة"}</h3><p className="text-xs text-slate-400">تعديل بيانات قائمة الأنواع دون تغيير بيانات الشقق المسجلة</p></div>
                      <label className="mb-4 block text-center text-sm font-bold">اسم نوع الشقة<input value={typeNameInput} onChange={e=>setTypeNameInput(e.target.value)} placeholder="اكتب اسم النوع" className={inputClass}/></label>
                      <label className="mb-4 block text-center text-sm font-bold">قيمة الإيجار الشهري المرجعية (ريال)<input type="number" min="0" step="0.01" value={typePriceInput} onChange={e=>updateTypeMonthly(e.target.value)} placeholder="0.00" className={inputClass}/></label>
                      <label className="mb-4 block text-center text-sm font-bold">قيمة الإيجار السنوي المرجعية (ريال)<input type="number" min="0" step="0.01" value={typeAnnualInput} onChange={e=>updateTypeAnnual(e.target.value)} placeholder="0.00" className={inputClass}/></label>
                      <label className="mb-4 block text-center text-sm font-bold">قيمة الإيجار اليومي المرجعية (ريال)<input type="number" min="0" step="0.01" value={typeDailyInput} onChange={e=>updateTypeDaily(e.target.value)} placeholder="0.00" className={inputClass}/></label>
                      <p className="mb-3 text-center text-xs text-blue-300">اليومي = السنوي ÷ 365 يومًا، ويمكن تعديل أي قيمة لتحديث الباقي.</p>
                      {typeManagerError && <p role="alert" className="mb-3 rounded-lg bg-rose-900/40 p-3 text-center text-sm text-rose-200">{typeManagerError}</p>}
                      {typeManagerNotice && <p role="status" className="mb-3 rounded-lg bg-emerald-900/40 p-3 text-center text-sm text-emerald-200">{typeManagerNotice}</p>}
                      {typeDeleteTarget && <div className="mb-3 rounded-xl border border-rose-400/40 bg-rose-950/40 p-3 text-center"><p className="mb-3 text-sm">هل تريد حذف النوع «{typeDeleteTarget}» من القائمة؟</p><div className="flex gap-2"><button type="button" disabled={typeBusy} onClick={()=>{void deleteTypeCatalog(typeDeleteTarget);}} className="flex-1 rounded-lg bg-rose-700 p-2 font-bold">تأكيد الحذف</button><button type="button" onClick={()=>setTypeDeleteTarget(null)} className="flex-1 rounded-lg border border-white/20 p-2">إلغاء</button></div></div>}
                      <div className="flex justify-end"><button type="button" onClick={resetTypeEditor} className="rounded-xl border border-white/20 px-5 py-2 font-bold">مسح الحقول</button></div>
                    </section>
                  </div>
                ) : (
                  <div className="grid min-h-0 grid-cols-1 gap-5 lg:grid-cols-[1fr_1.1fr]">
                    <section className="flex min-h-[440px] min-w-0 flex-col rounded-3xl border border-cyan-400/25 bg-[#081c31]/85 p-4 sm:p-5">
                      <div className="mb-4 text-center"><h3 className="text-xl font-black text-white">اختيار الشقق <span className="text-sm text-cyan-300">({operationApartments.length} محددة)</span></h3><p className="mt-1 text-xs text-slate-400">حدد الشقق المطلوب تسجيل العملية لها</p></div>
                      <div className="mb-3 flex flex-wrap gap-2"><button type="button" onClick={()=>setOperationApartments(activeApartments.map(a=>a.id))} className="flex-1 rounded-xl border border-cyan-400/35 bg-cyan-400/10 px-3 py-2 text-sm font-bold text-cyan-200">✓ تحديد الكل</button><button type="button" onClick={()=>setOperationApartments([])} className="rounded-xl border border-white/15 px-3 py-2 text-sm text-slate-300">إلغاء التحديد</button></div>
                      <div className="mb-3 grid grid-cols-2 gap-2"><div className="rounded-lg border border-white/10 bg-[#0b2137] p-2 text-center text-xs">كل أنواع الشقق</div><div className="rounded-lg border border-white/10 bg-[#0b2137] p-2 text-center text-xs">كل الحالات</div></div>
                      <input value={operationSearch} onChange={e=>setOperationSearch(e.target.value)} placeholder="ابحث برقم الشقة أو اسم المستأجر..." aria-label="بحث الشقق" className={`${inputClass} mb-3 mt-0`}/>
                      <div className="min-h-[180px] max-h-[340px] flex-1 space-y-1.5 overflow-y-auto rounded-xl border border-white/10 bg-[#08172a] p-2">{visible.length ? visible.map(a=><label key={a.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0c2138] px-3 py-2.5 transition hover:border-cyan-300/40"><span className="min-w-0"><strong className="block text-sm">شقة {a.number}</strong><small className="block truncate text-xs text-slate-400">{a.type} · {a.status}</small></span><input type="checkbox" checked={operationApartments.includes(a.id)} onChange={e=>setOperationApartments(prev=>e.target.checked?[...prev,a.id]:prev.filter(n=>n!==a.id))} className="h-5 w-5 shrink-0 accent-cyan-400"/></label>) : <p className="py-14 text-center text-sm text-slate-400">لا توجد شقق مرتبطة بهذه الصفحة أو مطابقة للبحث حاليًا.</p>}</div>
                      <div className="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-300/5 px-3 py-2 text-center text-xs font-bold text-cyan-200">تم اختيار {operationApartments.length} شقة</div>
                    </section>
                    <section className="min-w-0 rounded-3xl border border-cyan-400/25 bg-[#081c31]/85 p-4 sm:p-5">
                      <div className="mb-4 text-center"><h3 className="text-xl font-black text-white">بيانات {isRent ? "الإيجار" : "المستحق"}</h3><p className="mt-1 text-xs text-slate-400">نفس البيانات تُطبق على جميع الشقق المحددة</p></div>
                      <div className="space-y-3">
                        {!isRent && <label className="block text-center text-sm font-bold">نوع المستحق<select value={operationType} onChange={e=>setOperationType(e.target.value)} className={inputClass}><option>كهرباء</option><option>مياه</option><option>صيانة</option><option>مستحقات أخرى</option></select></label>}
                        <label className="block text-center text-sm font-bold">"المبلغ لكل شقة (ريال)"<input type="number" min="0" value={operationAmount} onChange={e=>setOperationAmount(e.target.value)} placeholder="اكتب المبلغ" className={inputClass}/></label>
                        <label className="block text-center text-sm font-bold">المستحق عن شهر / أشهر<input type="month" value={operationMonth} onChange={e=>setOperationMonth(e.target.value)} className={inputClass}/></label>
                        <label className="block text-center text-sm font-bold">تاريخ {isCollection ? "التحصيل" : "الإدخال"}<input type="date" value={operationDate} onChange={e=>setOperationDate(e.target.value)} className={inputClass}/></label>
                        <label className="block text-center text-sm font-bold">ملاحظات<textarea rows={3} value={operationNotes} onChange={e=>setOperationNotes(e.target.value)} placeholder="اكتب أي ملاحظات إضافية..." className="mt-1.5 block w-full resize-y rounded-xl border border-sky-400/25 bg-[#0a2036] p-3 text-center text-sm text-white outline-none focus:border-cyan-300"/></label>
                        <div className="overflow-hidden rounded-xl border border-cyan-300/20 bg-[#071b2b]"><div className="flex items-center justify-between px-3 py-2 text-xs"><span>عدد الشقق المحددة</span><strong className="text-cyan-300">{operationApartments.length}</strong></div><div className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-xs"><span>إجمالي العملية</span><strong className="text-cyan-300">{operationAmount && Number.isFinite(Number(operationAmount)) ? formatPrice(Math.max(0,Number(operationAmount))*operationApartments.length) : "—"} ريال</strong></div></div>
                        {operationError && <p role="alert" className="rounded-lg bg-rose-950/70 p-3 text-center text-sm font-bold text-rose-200">{operationError}</p>}
                      </div>
                    </section>
                  </div>
                )}
              </main>
              <footer className="grid shrink-0 grid-cols-2 gap-3 border-t border-white/10 bg-[#07172a] p-3 sm:px-5"><button type="button" onClick={()=>setOperationModal(null)} className="min-h-12 rounded-xl border border-white/15 bg-white/5 text-base font-black text-slate-200 transition hover:bg-white/10">✕ إغلاق</button>{isTypes ? <button type="button" disabled={typeBusy || typesLoading || !canWrite} onClick={()=>{void saveTypeCatalog();}} className="min-h-12 rounded-xl bg-gradient-to-l from-emerald-700 to-teal-700 text-base font-black text-white disabled:opacity-50">{typeBusy ? "جارٍ الحفظ..." : `✓ ${typeEditOriginal ? "حفظ التعديل" : "إضافة النوع"}`}</button> : <button type="button" disabled={operationSaving || !canWrite} onClick={()=>{void saveFinancialOperation();}} className="min-h-12 rounded-xl bg-gradient-to-l from-cyan-600 to-blue-600 text-base font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{operationSaving ? "جارٍ الحفظ..." : "✓ حفظ العملية"}</button>}</footer>
            </div>
          </div>
        );
      })()}
      {refreshNotice && (
        <div dir="rtl" role="status" aria-live="polite" className="fixed bottom-5 left-1/2 z-[125] w-[min(420px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-2xl border border-emerald-300/60 bg-[#092e28] text-center text-white shadow-[0_16px_45px_rgba(0,0,0,.55)]">
          <div className="flex items-center justify-center gap-3 px-5 py-4 text-sm font-black text-emerald-100"><span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-400/20 text-emerald-300">✓</span>{refreshNotice}</div>
          <div className="h-1.5 w-full bg-emerald-950" dir="ltr"><div className="h-full bg-gradient-to-r from-emerald-400 to-amber-300" style={{animation:"residential-refresh-progress 5s linear forwards"}} /></div>
          <style>{`@keyframes residential-refresh-progress { from { width: 100%; } to { width: 0%; } }`}</style>
        </div>
      )}
      {actionNotice && (isSaveSuccess ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" dir="rtl" role="status" aria-live="polite">
          <style>{`@keyframes residential-save-progress { from { width: 100%; } to { width: 0%; } }`}</style>
          <div className="relative w-full max-w-[580px] overflow-hidden rounded-[28px] border border-emerald-300/50 bg-gradient-to-br from-[#104d3d] via-[#092d27] to-[#061c1a] px-7 pb-9 pt-10 text-center text-white shadow-[0_24px_90px_rgba(0,0,0,.6),0_0_35px_rgba(52,211,153,.15)] sm:px-10">
            <button type="button" onClick={() => setActionNotice(null)} aria-label="إغلاق رسالة النجاح" className="absolute left-4 top-4 rounded-xl border border-white/15 bg-white/5 p-2 text-emerald-100 transition hover:bg-white/15"><X size={20}/></button>
            <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full border-2 border-emerald-300/60 bg-emerald-400/15 text-4xl font-black text-emerald-200 shadow-[0_0_35px_rgba(52,211,153,.25)]">✓</div>
            <h2 className="mb-4 text-2xl font-black text-emerald-200 sm:text-3xl">{actionNotice?.startsWith("تمت أرشفة") ? "تمت الأرشفة بنجاح" : actionNotice?.startsWith("تم استرجاع") ? "تم الاسترجاع بنجاح" : actionNotice === "تم تسجيل العميل الجديد بنجاح." ? "تم حفظ العميل بنجاح" : "تم حفظ الشقة بنجاح"}</h2>
            <p className="mx-auto max-w-md text-base font-semibold leading-8 text-emerald-50/90 sm:text-lg">{actionNotice?.startsWith("تمت أرشفة") || actionNotice?.startsWith("تم استرجاع") ? actionNotice : actionNotice === "تم تسجيل العميل الجديد بنجاح." ? "تم تسجيل بيانات العميل في Supabase بنجاح." : "تم حفظ بيانات الشقة في Supabase بنجاح."}</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-emerald-100/65">{actionNotice?.startsWith("تمت أرشفة") || actionNotice?.startsWith("تم استرجاع") ? "البيانات المرتبطة بالشقة لم تُحذف، ويمكن استرجاع الشقق المؤرشفة من نفس النافذة." : actionNotice === "تم تسجيل العميل الجديد بنجاح." ? "يمكن الآن استخدام بيانات العميل عند إنشاء عقد إيجار." : "بيانات المستأجر والعقد تُسجّل من وحدتها المستقلة لاحقًا."}</p>
            <div className="mt-7 text-sm font-bold text-emerald-200/85">تُغلق الرسالة تلقائيًا بعد 5 ثوانٍ</div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-black/35" dir="ltr">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 shadow-[0_0_14px_rgba(110,231,183,.7)]" style={{ width: "100%", animation: "residential-save-progress 5s linear forwards" }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4" onMouseDown={(e)=>{if(e.target===e.currentTarget)setActionNotice(null)}}><div dir="rtl" className="w-full max-w-md rounded-2xl border border-amber-400/35 bg-[#09271f] p-6 text-white"><h2 className="mb-3 text-lg font-black text-amber-300">تنبيه</h2><p className="text-sm leading-7">{actionNotice}</p><button type="button" onClick={()=>setActionNotice(null)} className="mt-5 rounded-xl bg-amber-400/20 px-5 py-2 font-bold">إغلاق</button></div></div>
      ))}
      {expiryModalOpen && <div dir="rtl" className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-3 sm:p-6" onMouseDown={e => {if(e.target === e.currentTarget) setExpiryModalOpen(false)}}>
        <div className="flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-[22px] border border-amber-300/60 bg-[#07332b] text-white shadow-2xl">
          <header className="flex shrink-0 items-center justify-between border-b border-amber-300/30 bg-[#0b4136] p-4 sm:px-6">
            <div><h2 className="text-xl font-black text-amber-300 sm:text-2xl">جميع العقود حسب تاريخ الانتهاء</h2><p className="mt-1 text-xs text-emerald-100/70">من أقرب تاريخ انتهاء إلى أبعد تاريخ • إجمالي العقود: {expiryLoading ? "…" : expiryContracts.length}</p></div>
            <button type="button" onClick={() => setExpiryModalOpen(false)} aria-label="إغلاق" className="rounded-lg border border-white/20 p-2 hover:bg-white/10"><X size={20}/></button>
          </header>
          <div className="shrink-0 p-4 sm:px-6"><input value={expirySearch} onChange={e => setExpirySearch(e.target.value)} placeholder="بحث برقم العقد أو الشقة أو المستأجر أو المالك..." className="w-full rounded-xl border border-amber-300/30 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-emerald-100/50 focus:border-amber-300"/></div>
          <div className="min-h-0 flex-1 overflow-auto px-4 pb-5 sm:px-6">
            {expiryLoading ? <p className="py-12 text-center">جارٍ تحميل العقود...</p> : expiryError ? <p role="alert" className="py-10 text-center text-rose-300">{expiryError}</p> : <table className="w-full min-w-[850px] text-right text-sm">
              <thead className="sticky top-0 bg-[#225443] text-amber-200"><tr>{["م","رقم العقد","الشقة","المستأجر","المالك","تاريخ البداية","تاريخ الانتهاء","حالة العقد"].map(h=><th key={h} className="whitespace-nowrap p-3">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-white/10">
                {expiryContracts.filter(c => { const row = [c.contract_number,apartments.find(a=>a.id===c.apartment_id)?.number,tenants.find(t=>t.id===c.tenant_id)?.full_name,owners.find(o=>o.id===c.owner_id)?.full_name].join(" ").toLocaleLowerCase();return row.includes(expirySearch.trim().toLocaleLowerCase()); }).map((c,i)=>{
                  const today = new Date().toLocaleDateString("en-CA");
                  const expired = c.end_date < today;
                  const upcoming = !expired && (new Date(c.end_date+"T00:00:00").getTime()-new Date(today+"T00:00:00").getTime()) <= 30*86400000;
                  return <tr key={c.id} className="hover:bg-white/5"><td className="p-3">{i+1}</td><td className="p-3">{c.contract_number||"—"}</td><td className="p-3">{apartments.find(a=>a.id===c.apartment_id)?.number||"—"}</td><td className="p-3">{tenants.find(t=>t.id===c.tenant_id)?.full_name||"—"}</td><td className="p-3">{owners.find(o=>o.id===c.owner_id)?.full_name||"—"}</td><td className="whitespace-nowrap p-3">{c.start_date||"—"}</td><td className="whitespace-nowrap p-3 font-bold text-amber-200">{c.end_date||"—"}</td><td className="p-3"><span className={`rounded-lg px-3 py-1 font-bold ${expired?"bg-rose-500/20 text-rose-300":upcoming?"bg-amber-400/20 text-amber-200":"bg-emerald-400/20 text-emerald-300"}`}>{expired?"منتهي":upcoming?"قريب الانتهاء":"ساري"}</span></td></tr>;
                })}
              </tbody>
            </table>}
            {!expiryLoading && !expiryError && expiryContracts.length===0 && <p className="py-8 text-center text-emerald-100/70">لا توجد عقود مسجلة حاليًا</p>}
          </div>
          <div className="shrink-0 grid grid-cols-3 gap-2 border-t border-amber-300/25 bg-[#082a26] p-3 sm:gap-3 sm:p-4">
            <button type="button" disabled={expiryLoading || !!expiryError} onClick={exportExpiryExcel} className="flex min-h-12 items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-2 text-xs font-black text-emerald-200 transition hover:bg-emerald-500/30 disabled:opacity-40 sm:text-sm">تصدير Excel</button>
            <button type="button" disabled={expiryLoading || !!expiryError} onClick={printExpiryReport} title="اختر حفظ كـ PDF من نافذة الطباعة" className="flex min-h-12 items-center justify-center rounded-xl border border-rose-400/40 bg-rose-500/15 px-2 text-xs font-black text-rose-200 transition hover:bg-rose-500/25 disabled:opacity-40 sm:text-sm">حفظ PDF</button>
            <button type="button" disabled={expiryLoading || !!expiryError} onClick={printExpiryReport} className="flex min-h-12 items-center justify-center rounded-xl border border-sky-400/40 bg-sky-500/15 px-2 text-xs font-black text-sky-200 transition hover:bg-sky-500/25 disabled:opacity-40 sm:text-sm">طباعة</button>
          </div>
        </div>
      </div>}
      {selectedBill && billAction && <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4" dir="rtl">
        <div role="dialog" aria-modal="true" aria-label="إدارة الفاتورة" className="w-full max-w-lg rounded-2xl border border-amber-400/50 bg-[#092d29] p-5 text-white shadow-2xl">
          <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-black text-amber-300">{billAction === "view" ? "تفاصيل الفاتورة" : billAction === "edit" ? "تعديل الفاتورة" : "تأكيد حذف الفاتورة"}</h3><button type="button" onClick={()=>{setSelectedBill(null);setBillAction(null)}}><X size={20}/></button></div>
          <p className="mb-3 text-sm text-emerald-100/80">الشقة: {apartments.find(a=>a.id===selectedBill.apartment_id)?.number || "—"} | المحصل: {formatFinancialPrice(billPaid(selectedBill.id))} ر.س</p>
          {billAction === "delete" ? <p className="mb-4 rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-rose-100">هل تريد حذف الفاتورة نهائيًا؟ لا يمكن التراجع عن الحذف. الفواتير المرتبطة بتحصيلات لا يمكن حذفها.</p> : <div className="grid gap-3">{([['title','وصف الفاتورة','text'],['amount','المبلغ (ريال)','number'],['issued_at','تاريخ الفاتورة','date'],['due_date','تاريخ الاستحقاق','date']] as const).map(([field,label,type])=><label key={field} className="grid gap-1 text-sm text-emerald-100"><span>{label}</span><input type={type} step={type==='number'?'0.01':undefined} min={type==='number'?'0':undefined} disabled={billAction==='view'} value={billEdit[field]} onChange={e=>setBillEdit(prev=>({...prev,[field]:e.target.value}))} className="rounded-lg border border-emerald-300/30 bg-[#061f24] px-3 py-2 text-white disabled:opacity-70"/></label>)}</div>}
          {billActionError && <p className="mt-3 rounded-lg border border-rose-400/40 p-2 text-sm text-rose-200">{billActionError}</p>}
          <div className="mt-5 flex gap-2"><button type="button" onClick={()=>{setSelectedBill(null);setBillAction(null)}} className="flex-1 rounded-xl border border-white/25 p-2">إغلاق</button>{billAction !== 'view' && <button type="button" disabled={billActionBusy || !canWrite} onClick={()=>void saveBillAction()} className={`flex-1 rounded-xl p-2 font-bold disabled:opacity-40 ${billAction==='delete'?'bg-rose-600':'bg-emerald-600'}`}>{billActionBusy?'جارٍ الحفظ...':billAction==='delete'?'تأكيد الحذف':'حفظ التعديل'}</button>}</div>
        </div>
      </div>}
      {monthlyOpen && <div className="fixed inset-0 z-[135] flex items-center justify-center bg-black/80 p-2 sm:p-5" dir="rtl" onMouseDown={e=>{if(e.target===e.currentTarget)setMonthlyOpen(false)}}>
        <div role="dialog" aria-modal="true" aria-label="التقرير الشهري للشقق" className="flex max-h-[94vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-3xl border border-amber-400/50 bg-gradient-to-br from-[#104337] via-[#082d28] to-[#041c1b] text-white shadow-2xl">
          <div className="flex shrink-0 items-center justify-between border-b border-amber-300/30 p-4 sm:p-5"><div><h2 className="flex items-center gap-2 text-xl font-black text-amber-300"><CalendarDays size={25}/> التقرير الشهري للشقق</h2><p className="mt-1 text-xs text-emerald-100/65">عقاري سمارت • تقرير المستحقات والتحصيلات حتى نهاية الشهر المختار</p></div><button type="button" onClick={()=>setMonthlyOpen(false)} aria-label="إغلاق" className="rounded-xl border border-white/20 p-2 hover:bg-white/10"><X size={20}/></button></div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mb-4 grid gap-3 rounded-2xl border border-amber-300/30 bg-black/20 p-4 lg:grid-cols-[minmax(200px,1fr)_minmax(260px,1.6fr)_auto] lg:items-end">
              <label className="grid gap-2 text-sm font-bold text-emerald-100">شهر التقرير<input type="month" value={monthlyMonth} onChange={e=>{setMonthlyMonth(e.target.value);setMonthlyLoadedMonth("");}} className="min-h-11 rounded-xl border border-emerald-300/40 bg-[#062b26] px-3 text-white [color-scheme:dark]"/></label>
              <div className="grid gap-3"><label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={monthlyShowOwner} onChange={e=>setMonthlyShowOwner(e.target.checked)} className="accent-amber-400"/> إظهار بيانات المالك</label><label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={monthlyShowOther} onChange={e=>setMonthlyShowOther(e.target.checked)} className="accent-amber-400"/> إظهار المستحقات الأخرى وتحصيلاتها</label><label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={monthlyShowWater} onChange={e=>setMonthlyShowWater(e.target.checked)} className="accent-amber-400"/> إظهار مستحقات المياه وتحصيلاتها</label><label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={monthlyShowElectricity} onChange={e=>setMonthlyShowElectricity(e.target.checked)} className="accent-amber-400"/> إظهار مستحقات الكهرباء وتحصيلاتها</label><label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={monthlyOnlyDue} onChange={e=>setMonthlyOnlyDue(e.target.checked)} className="accent-amber-400"/> الشقق ذات المتبقي فقط</label></div>
              <button type="button" disabled={monthlyBusy} onClick={()=>void loadMonthlyReport(monthlyMonth)} className="min-h-11 rounded-xl bg-amber-400 px-6 font-black text-[#082a26] hover:bg-amber-300 disabled:opacity-50">{monthlyBusy?"جارٍ التحميل...":"عرض التقرير"}</button>
            </div>
            {monthlyError && <p className="mb-4 rounded-xl border border-rose-400/50 bg-rose-500/10 p-3 text-rose-200">{monthlyError}</p>}
            {monthlyLoadedMonth && !monthlyBusy && <>
              <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{([["عدد الشقق",monthlyVisible.length],["إجمالي المستحق",`${formatFinancialPrice(monthlySum("due"))} ر.س`],["إجمالي المحصل",`${formatFinancialPrice(monthlySum("paid"))} ر.س`],["إجمالي المتبقي",`${formatFinancialPrice(monthlySum("due")-monthlySum("paid"))} ر.س`]] as [string,string|number][]).map(([label,value])=><div key={label} className="rounded-xl border border-amber-300/30 bg-black/20 p-3 text-center"><p className="text-xs text-emerald-100/70">{label}</p><strong className="mt-2 block text-xl text-amber-200">{value}</strong></div>)}</div>
              <div className="relative mb-3"><Search size={17} className="absolute right-3 top-3 text-emerald-300"/><input value={monthlySearch} onChange={e=>setMonthlySearch(e.target.value)} placeholder="بحث برقم الشقة أو العمارة أو المستأجر أو العقد..." className="w-full rounded-xl border border-emerald-300/35 bg-[#052b26] py-2.5 pr-10 pl-3 text-white outline-none focus:border-amber-300"/></div>
              <p className="mb-3 text-xs text-emerald-100/70">المبالغ المستحقة حتى نهاية الشهر المحدد، والتحصيلات المسجلة حتى ذلك التاريخ. يشمل المتبقي المتراكم من الأشهر السابقة. التصدير والطباعة يحترمان خيارات إظهار الأعمدة، والإجماليات المعروضة تشمل الأقسام المختارة فقط.</p>
              <div className="overflow-x-auto rounded-xl border border-white/15"><table className="w-full min-w-[1450px] text-right text-xs"><thead className="bg-amber-300/15 text-amber-200"><tr>{monthlyHeaders().map(h=><th key={h} className="whitespace-nowrap p-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-white/10">{monthlyVisible.map(l=><tr key={l.apartment.id} className="hover:bg-white/5">{monthlyCells(l).map((v,i)=><td key={i} className="whitespace-nowrap p-3">{typeof v==="number"?formatFinancialPrice(v):v}</td>)}</tr>)}</tbody></table>{monthlyVisible.length===0&&<p className="p-8 text-center text-emerald-100/70">لا توجد شقق مطابقة للفترة والفلاتر المختارة.</p>}</div>
            </>}
            {monthlyBusy && <p className="py-12 text-center text-amber-200">جارٍ تجهيز التقرير من قاعدة البيانات...</p>}
          </div>
          <div className="grid shrink-0 grid-cols-3 gap-2 border-t border-amber-300/25 bg-[#082a26] p-3 sm:gap-3"><button type="button" disabled={!monthlyLoadedMonth||monthlyBusy} onClick={exportMonthly} className="min-h-11 rounded-xl border border-emerald-400/40 bg-emerald-500/20 text-xs font-black text-emerald-200 disabled:opacity-40 sm:text-sm">تصدير Excel / CSV</button><button type="button" disabled={!monthlyLoadedMonth||monthlyBusy} onClick={printMonthly} className="min-h-11 rounded-xl border border-rose-400/40 bg-rose-500/15 text-xs font-black text-rose-200 disabled:opacity-40 sm:text-sm">حفظ PDF</button><button type="button" disabled={!monthlyLoadedMonth||monthlyBusy} onClick={printMonthly} className="min-h-11 rounded-xl border border-sky-400/40 bg-sky-500/15 text-xs font-black text-sky-200 disabled:opacity-40 sm:text-sm">طباعة</button></div>
        </div>
      </div>}
      {detailCategory && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-3 sm:p-6" onMouseDown={e=>{if(e.target===e.currentTarget)setDetailCategory(null)}}>
        <div dir="rtl" role="dialog" aria-modal="true" aria-label={detailCategory} className={`flex max-h-[88vh] w-full ${financialCategories.includes(detailCategory) ? "max-w-[1450px]" : "max-w-6xl"} flex-col overflow-hidden rounded-[24px] border border-amber-400/50 bg-gradient-to-br from-[#104337] via-[#082d28] to-[#041c1b] text-white shadow-2xl`}>
          <div className="flex items-center justify-between border-b border-amber-300/25 p-5"><div><h2 className="text-xl font-black text-amber-300">{detailCategory}</h2><p className="mt-1 text-xs text-emerald-100/65">تقارير عقاري سمارت • البيانات المسجلة للشركة</p></div><button type="button" onClick={()=>setDetailCategory(null)} className="rounded-lg border border-white/20 p-2 hover:bg-white/10" aria-label="إغلاق"><X size={20}/></button></div>
          <div className="overflow-y-auto p-4 sm:p-6">
            {["تقارير الشقق","تقارير العقود","تقارير العملاء","تقارير الملاك"].includes(detailCategory) ? <>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{(detailCategory==="تقارير الشقق" ? [["إجمالي الشقق",activeApartments.length],["المؤجرة",rentedCount],["المتاحة",availableCount],["المحجوزة",reservedCount]] : detailCategory==="تقارير العقود" ? [["إجمالي العقود",reportContracts.length],["السارية",reportContracts.filter(c=>c.start_date<=new Date().toISOString().slice(0,10)&&c.end_date>=new Date().toISOString().slice(0,10)).length],["المنتهية",reportContracts.filter(c=>c.end_date<new Date().toISOString().slice(0,10)).length],["القادمة",reportContracts.filter(c=>c.start_date>new Date().toISOString().slice(0,10)).length]] : detailCategory==="تقارير العملاء" ? [["إجمالي العملاء",tenants.length],["مرتبطون بعقود",new Set(reportContracts.map(c=>c.tenant_id).filter(Boolean)).size],["بدون عقود",tenants.filter(t=>!reportContracts.some(c=>c.tenant_id===t.id)).length],["إجمالي العقود",reportContracts.length]] : [["إجمالي الملاك",owners.length],["ملاك لديهم شقق",new Set(apartments.map(a=>a.ownerId).filter(Boolean)).size],["ملاك لديهم عقود",new Set(reportContracts.map(c=>c.owner_id).filter(Boolean)).size],["إجمالي الشقق",activeApartments.length]]).map(([label,value])=><div key={String(label)} className="rounded-xl border border-amber-300/30 bg-black/20 p-3 text-center"><p className="text-xs text-emerald-100/70">{label}</p><strong className="mt-2 block text-2xl text-amber-200">{reportLoading?"…":value}</strong></div>)}</div>
              <div className="relative mb-4"><Search size={18} className="absolute right-3 top-3 text-emerald-300"/><input value={reportSearch} onChange={e=>setReportSearch(e.target.value)} placeholder="بحث داخل التقرير..." className="w-full rounded-xl border border-emerald-300/35 bg-[#052b26] py-2.5 pr-10 pl-3 text-white outline-none focus:border-amber-300"/></div>
              {reportError && <p className="mb-3 rounded-lg border border-red-400/40 p-3 text-red-200">تعذر تحميل بعض بيانات التقرير: {reportError}</p>}
              {reportLoading ? <p className="py-12 text-center">جارٍ تحميل التقرير...</p> : detailCategory === "تقارير العقود" ? <div className="overflow-x-auto rounded-xl border border-white/15">
                <table className="w-full min-w-[980px] text-right text-sm"><thead className="bg-amber-300/15 text-amber-200"><tr>{["رقم العقد","نوع العقد","الشقة","المستأجر","المالك","البداية","النهاية","قيمة الإيجار","الحالة","الإجراءات"].map(h=><th key={h} className="whitespace-nowrap p-3">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-white/10">{reportContracts.filter(c=>[c.contract_number,c.contract_type,apartments.find(a=>a.id===c.apartment_id)?.number,tenants.find(t=>t.id===c.tenant_id)?.full_name,owners.find(o=>o.id===c.owner_id)?.full_name].join(" ").toLocaleLowerCase().includes(reportSearch.trim().toLocaleLowerCase())).map(c=><tr key={c.id} className="hover:bg-white/5">
                  <td className="whitespace-nowrap p-3">{c.contract_number}</td><td className="p-3">{c.contract_type}</td><td className="p-3">{apartments.find(a=>a.id===c.apartment_id)?.number||"—"}</td><td className="whitespace-nowrap p-3">{tenants.find(t=>t.id===c.tenant_id)?.full_name||"—"}</td><td className="whitespace-nowrap p-3">{owners.find(o=>o.id===c.owner_id)?.full_name||"—"}</td><td className="p-3">{c.start_date}</td><td className="p-3">{c.end_date}</td><td className="whitespace-nowrap p-3">{formatPrice(Number(c.rent_amount??0))} ر.س</td><td className="p-3">{c.status||"—"}</td>
                  <td className="p-3"><div className="flex items-center gap-1.5"><button type="button" title="عرض العقد" aria-label="عرض العقد" onClick={()=>openContractAction(c,"view")} className="rounded-lg border border-sky-300/50 bg-sky-400/15 p-2 text-sky-200 hover:bg-sky-400/30"><Eye size={17}/></button><button type="button" title="تعديل العقد" aria-label="تعديل العقد" onClick={()=>openContractAction(c,"edit")} className="rounded-lg border border-amber-300/50 bg-amber-400/15 p-2 text-amber-200 hover:bg-amber-400/30"><Pencil size={17}/></button><button type="button" title={c.status==="مؤرشف"?"استرجاع العقد":"أرشفة العقد"} aria-label={c.status==="مؤرشف"?"استرجاع العقد":"أرشفة العقد"} onClick={()=>openContractAction(c,"archive")} className="rounded-lg border border-rose-300/50 bg-rose-400/15 p-2 text-rose-200 hover:bg-rose-400/30"><Archive size={17}/></button></div></td>
                </tr>)}</tbody></table></div> : <div className="overflow-x-auto rounded-xl border border-white/15"><table className="w-full min-w-[900px] text-right text-sm"><thead className="bg-amber-300/15 text-amber-200"><tr>{(detailCategory==="تقارير الشقق"?["رقم الشقة","العمارة","النوع","الحالة","الإيجار","المالك"]:detailCategory==="تقارير العملاء"?["العميل","الجوال","الهوية","الجنسية","البريد","عدد العقود"]:["المالك","الجوال","الهوية","الجنسية","الشقق","العقود"]).map(h=><th key={h} className="whitespace-nowrap p-3">{h}</th>)}<th className="min-w-[230px] p-3 text-center">الإجراءات</th></tr></thead><tbody className="divide-y divide-white/10">{(detailCategory==="تقارير الشقق" ? activeApartments.map(a=>({kind:"apartment" as const,id:a.id,row:[a.number,a.buildingName||"—",a.type,a.status,`${formatPrice(a.price)} ر.س`,owners.find(o=>o.id===a.ownerId)?.full_name||"—"]})) : detailCategory==="تقارير العملاء" ? tenants.map(t=>({kind:"tenant" as const,id:t.id,row:[t.full_name,t.phone||"—",t.identity_number||"—",t.nationality||"—",t.email||"—",String(reportContracts.filter(c=>c.tenant_id===t.id).length)]})) : owners.map(o=>({kind:"owner" as const,id:o.id,row:[o.full_name,o.mobile||o.phone||"—",o.identity_number||"—",o.nationality||"—",String(apartments.filter(a=>a.ownerId===o.id&&!a.archivedAt).length),String(reportContracts.filter(c=>c.owner_id===o.id).length)]}))).filter(item=>item.row.some(cell=>String(cell).toLocaleLowerCase().includes(reportSearch.trim().toLocaleLowerCase()))).map(item=><tr key={item.id} className="hover:bg-white/5">{item.row.map((cell,j)=><td key={j} className="whitespace-nowrap p-3">{cell}</td>)}<td className="p-3"><div className="flex items-center justify-center gap-2">{(["view","edit","delete"] as const).map(mode=><button key={mode} type="button" disabled={mode!=="view"&&!canWrite} title={mode==="view"?"عرض":mode==="edit"?"تعديل":item.kind==="apartment"?"أرشفة الشقة":"حذف"} aria-label={mode==="view"?"عرض":mode==="edit"?"تعديل":item.kind==="apartment"?"أرشفة الشقة":"حذف"} onClick={()=>openReportEntity(item.kind,item.id,mode)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 font-bold transition hover:brightness-125 disabled:opacity-30 ${mode==="view"?"border-sky-300/45 bg-sky-400/10 text-sky-200":mode==="edit"?"border-amber-300/45 bg-amber-400/10 text-amber-200":"border-rose-300/45 bg-rose-400/10 text-rose-200"}`}>{mode==="view"?<Eye size={16}/>:mode==="edit"?<Pencil size={16}/>:<Trash2 size={16}/>}<span>{mode==="view"?"عرض":mode==="edit"?"تعديل":item.kind==="apartment"?"أرشفة":"حذف"}</span></button>)}</div></td></tr>)}</tbody></table></div>}
            </> : financialCategories.includes(detailCategory) ? <>
              {detailCategory === "إجمالي الإيجارات" ? <><div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{[["العقود المسجلة",reportContracts.length],["إجمالي قيمة العقود",`${formatPrice(reportContracts.reduce((sum,c)=>sum+Number(c.rent_amount??0),0))} ر.س`],["المستحق حتى اليوم",leaseFinance.loading || leaseFinance.error ? "—" : `${formatFinancialPrice(leaseFinance.due)} ر.س`],["المحصل من المستحق",leaseFinance.loading || leaseFinance.error ? "—" : `${formatFinancialPrice(leaseFinance.collected)} ر.س`],["المتبقي من المستحق",leaseFinance.loading || leaseFinance.error ? "—" : `${formatFinancialPrice(leaseFinance.remaining)} ر.س`]].map(([label,value])=><div key={String(label)} className="rounded-xl border border-amber-300/30 bg-black/20 p-3 text-center"><p className="text-xs text-emerald-100/70">{label}</p><strong className="mt-2 block text-lg text-amber-200">{reportLoading?"…":value}</strong></div>)}</div><p className="mb-3 text-xs text-amber-200">قيمة العقد مستقلة عن المستحق حتى اليوم؛ التحصيل والمتبقي محسوبان من الأقساط المستحقة وتوزيعات السداد المسجلة.</p></> : <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{[["إجمالي الفواتير", billTotals(detailCategory).total], ["التحصيلات", billTotals(detailCategory).collected], ["المتبقي", billTotals(detailCategory).remaining]].map(([label,value])=><div key={String(label)} className="rounded-xl border border-amber-300/30 bg-black/20 p-3 text-center"><p className="text-xs text-emerald-100/70">{label}</p><strong className="mt-2 block text-lg text-amber-200">{reportLoading || billsLoading || billsError ? "—" : `${formatFinancialPrice(Number(value))} ر.س`}</strong></div>)}</div>}
              <div className="relative mb-4"><Search size={18} className="absolute right-3 top-3 text-emerald-300"/><input value={reportSearch} onChange={e=>setReportSearch(e.target.value)} placeholder="بحث داخل التقرير..." className="w-full rounded-xl border border-emerald-300/35 bg-[#052b26] py-2.5 pr-10 pl-3 text-white outline-none"/></div>
              {reportError && <p className="mb-3 text-rose-300">{reportError}</p>}
              {detailCategory === "إجمالي الإيجارات" && leaseFinance.error && <p className="mb-3 text-rose-300">تعذر تحميل مستحقات الإيجار: {leaseFinance.error}</p>}
              {reportLoading ? <p className="py-8 text-center">جارٍ تحميل البيانات...</p> : <div className="overflow-x-auto rounded-xl border border-white/15"><table className="w-full min-w-[1100px] text-right text-base"><thead className="bg-amber-300/15 text-amber-200"><tr>{(detailCategory === "إجمالي الإيجارات" ? financialHeaders : ["الشقة","نوع المستحق","تاريخ الفاتورة","القيمة","المحصل","المتبقي","الإجراءات"]).map(h=><th key={h} className={`whitespace-nowrap px-5 py-4 ${h === "الإجراءات" ? "min-w-[310px] text-center" : ""}`}>{h}</th>)}</tr></thead><tbody>{financialRows().filter(row=>row.some(cell=>String(cell).toLocaleLowerCase().includes(reportSearch.trim().toLocaleLowerCase()))).map((row,i)=><tr key={i} className="border-t border-white/10">{row.map((cell,j)=><td key={j} className="whitespace-nowrap px-5 py-4">{cell}</td>)}{detailCategory !== "إجمالي الإيجارات" && <td className="min-w-[310px] whitespace-nowrap px-5 py-4"><div className="flex items-center justify-center gap-3">{(["view","edit","delete"] as const).map((action) => { const match = filteredBills(detailCategory).filter(b => [apartments.find(a=>a.id===b.apartment_id)?.number || "—", b.title || (b.charge_type === "water" ? "مياه" : b.charge_type === "electricity" ? "كهرباء" : "مستحقات"), b.issued_at?.slice(0,10) || "—", `${formatFinancialPrice(Number(b.amount))} ر.س`, `${formatFinancialPrice(billPaid(b.id))} ر.س`, `${formatFinancialPrice(Math.max(0, Number(b.amount) - billPaid(b.id)))} ر.س`].some(cell=>String(cell).toLocaleLowerCase().includes(reportSearch.trim().toLocaleLowerCase())))[i]; return <button key={action} type="button" disabled={!match || (action !== "view" && !canWrite)} title={action === "view" ? "عرض" : action === "edit" ? "تعديل" : "حذف"} onClick={()=>{if(match)openBillAction(match,action)}} className={`inline-flex min-h-11 min-w-[86px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition hover:brightness-125 disabled:opacity-35 ${action === "view" ? "border-sky-400/40 bg-sky-500/15 text-sky-200" : action === "edit" ? "border-amber-400/40 bg-amber-500/15 text-amber-200" : "border-rose-400/40 bg-rose-500/15 text-rose-200"}`}>{action === "view" ? <Eye size={19}/> : action === "edit" ? <Pencil size={19}/> : <Trash2 size={19}/>}<span>{action === "view" ? "عرض" : action === "edit" ? "تعديل" : "حذف"}</span></button>})}</div></td>}</tr>)}</tbody></table>{financialRows().length===0 && <p className="p-5 text-center text-emerald-100/70">لا توجد بيانات مرتبطة بالتقرير حاليًا</p>}</div>}
            </> : occupancyCategories.includes(detailCategory) ? <>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["عدد الشقق",activeApartments.length],["المؤجرة",rentedCount],["الفارغة",availableCount],["المحجوزة",reservedCount]].map(([label,value])=><div key={String(label)} className="rounded-xl border border-amber-300/30 bg-black/20 p-3 text-center"><p className="text-xs text-emerald-100/70">{label}</p><strong className="mt-2 block text-2xl text-amber-200">{value}</strong></div>)}</div>
              <div className="relative mb-4"><Search size={18} className="absolute right-3 top-3 text-emerald-300"/><input value={reportSearch} onChange={e=>setReportSearch(e.target.value)} placeholder="بحث برقم الشقة أو العمارة أو المالك أو الحالة..." className="w-full rounded-xl border border-emerald-300/35 bg-[#052b26] py-2.5 pr-10 pl-3 text-white outline-none focus:border-amber-300"/></div>
              <div className="overflow-x-auto rounded-xl border border-white/15"><table className="w-full min-w-[900px] text-right text-sm"><thead className="bg-amber-300/15 text-amber-200"><tr>{["رقم الشقة","العمارة","نوع الشقة","الغرف","الحالة","الإيجار","فترة الإيجار","المالك","الموقع"].map(h=><th key={h} className="whitespace-nowrap p-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-white/10">{occupancyRows().map((row,i)=><tr key={i} className="hover:bg-white/5">{row.map((cell,j)=><td key={j} className="whitespace-nowrap p-3">{cell}</td>)}</tr>)}</tbody></table></div>
              {occupancyRows().length===0 && <p className="py-6 text-center text-emerald-100/70">لا توجد شقق مطابقة للعرض الحالي</p>}
            </> : <p className="py-8 text-center text-emerald-100/75">لم تُربط بيانات {detailCategory} بعد.</p>}
          </div>
          {(["تقارير الشقق","تقارير العقود","تقارير العملاء","تقارير الملاك",...occupancyCategories,...financialCategories].includes(detailCategory)) && (
            <div className="shrink-0 grid grid-cols-3 gap-2 border-t border-amber-300/25 bg-[#082a26] p-3 sm:gap-3 sm:p-4">
              <button type="button" disabled={reportLoading || !!reportError} onClick={exportReportExcel} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-2 text-xs font-black text-emerald-200 transition hover:bg-emerald-500/30 disabled:opacity-40 sm:text-sm">تصدير Excel</button>
              <button type="button" disabled={reportLoading || !!reportError} onClick={printReport} title="اختر حفظ كـ PDF من نافذة الطباعة" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/15 px-2 text-xs font-black text-rose-200 transition hover:bg-rose-500/25 disabled:opacity-40 sm:text-sm">حفظ PDF</button>
              <button type="button" disabled={reportLoading || !!reportError} onClick={printReport} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/15 px-2 text-xs font-black text-sky-200 transition hover:bg-sky-500/25 disabled:opacity-40 sm:text-sm">طباعة</button>
            </div>
          )}
        </div>
      </div>}
      {archivePicker && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-5" dir="rtl" onMouseDown={e => { if (e.target === e.currentTarget && !archiveBusy) setArchivePicker(false); }}>
          <div role="dialog" aria-modal="true" aria-label="إدارة أرشيف الشقق" style={{ width: "min(820px, calc(100vw - 32px))", maxWidth: "820px", height: "min(610px, 88dvh)", maxHeight: "88dvh", margin: "auto", boxSizing: "border-box" }} className="relative flex flex-col overflow-hidden rounded-[25px] border border-sky-300/45 bg-[#07162e] text-white shadow-[0_30px_100px_rgba(0,0,0,.7)]">
            <div className="pointer-events-none absolute inset-0" style={{backgroundImage:"url('/delete.png')",backgroundSize:"contain",backgroundPosition:"center",backgroundRepeat:"no-repeat",backgroundColor:"#06152c"}} />
            <div className="pointer-events-none absolute inset-0 bg-[#06152c]/45" />
            <header className="relative z-10 shrink-0 border-b border-sky-300/25 bg-[#081a34]/65 backdrop-blur-sm px-4 py-3 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div><div className="flex items-center gap-3 text-lg font-black text-white sm:text-xl"><Archive size={23} className="text-rose-300"/> إدارة أرشيف الشقق</div><p className="mt-1 text-[11px] leading-5 text-slate-400">أرشفة الشقق بدون حذف بياناتها، واسترجاعها في أي وقت</p></div>
                <button type="button" disabled={archiveBusy} onClick={() => setArchivePicker(false)} aria-label="إغلاق" className="rounded-xl border border-white/20 bg-white/5 p-2 hover:bg-white/15"><X size={22}/></button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => switchArchiveView("active")} className={`min-h-9 rounded-lg border px-3 text-xs font-black ${archiveView === "active" ? "border-sky-300/70 bg-[#213b58] text-sky-100" : "border-[#30415a] bg-[#101f32] text-slate-300"}`}>الشقق الحالية ({activeApartments.length})</button>
                <button type="button" onClick={() => switchArchiveView("archived")} className={`min-h-9 rounded-lg border px-3 text-xs font-black ${archiveView === "archived" ? "border-sky-300/70 bg-[#213b58] text-sky-100" : "border-[#30415a] bg-[#101f32] text-slate-300"}`}>الأرشيف ({apartments.length - activeApartments.length})</button>
              </div>
              <div className="relative mt-2"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17}/><input value={archiveSearch} onChange={e => {setArchiveSearch(e.target.value);setArchiveConfirm(false);}} placeholder="ابحث برقم الشقة أو اسم العمارة أو النوع أو الموقع..." className="h-9 w-full rounded-lg border border-[#34445c] bg-[#0a1727] pr-10 pl-3 text-xs text-white outline-none placeholder:text-slate-500 focus:border-sky-400"/></div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs">
                <span className="font-bold text-slate-300">المحدد: <strong className="text-rose-300">{archiveSelection.length}</strong> من {archiveCandidates.length} المعروضة</span>
                <div className="flex gap-2"><button type="button" onClick={() => {setArchiveSelection(prev => Array.from(new Set([...prev, ...archiveCandidates.map(a => a.id)])));setArchiveConfirm(false);}} className="rounded-md border border-[#40516b] px-2 py-1 font-bold text-slate-200">تحديد الكل</button><button type="button" onClick={() => {setArchiveSelection([]);setArchiveConfirm(false);}} className="rounded-md border border-[#40516b] px-2 py-1 font-bold text-slate-200">إلغاء التحديد</button></div>
              </div>
            </header>
            <div className="relative z-10 min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
              {archiveCandidates.length === 0 ? <div className="py-10 text-center text-slate-400">{archiveView === "archived" ? "لا توجد شقق مؤرشفة مطابقة." : "لا توجد شقق مطابقة."}</div> :
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {archiveCandidates.map(a => <button key={a.id} type="button" disabled={archiveBusy} onClick={() => {setArchiveSelection(prev => prev.includes(a.id) ? prev.filter(id => id !== a.id) : [...prev, a.id]);setArchiveConfirm(false);}} className={`flex min-h-[84px] items-center gap-3 rounded-xl border px-4 py-3 text-right shadow-lg transition ${archiveSelection.includes(a.id) ? "border-rose-300/70 bg-rose-300/10" : "border-[#2c3a51] bg-[#111f32] hover:border-sky-300/50"}`}>
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border ${archiveSelection.includes(a.id) ? "border-rose-300 bg-rose-300 text-[#162034]" : "border-white/30"}`}>{archiveSelection.includes(a.id) ? "✓" : ""}</span>
                    <span className="min-w-0 flex-1"><strong className="block truncate text-base font-black text-white">شقة {a.number}</strong><span className="mt-1 block truncate text-xs text-slate-300">{a.buildingName || a.type} · {a.status}</span></span>
                  </button>)}
                </div>}
            </div>
            <footer className="relative z-10 shrink-0 border-t border-sky-300/25 bg-[#081a34]/70 backdrop-blur-sm p-2.5 sm:p-3">
              {archiveConfirm && archiveView === "active" && <p className="mb-3 rounded-xl border border-rose-300/40 bg-rose-900/25 p-3 text-center text-sm font-bold text-rose-100">تأكيد أرشفة {archiveSelection.length} شقة؟ ستختفي من القوائم النشطة وتبقى بياناتها محفوظة في Supabase.</p>}
              <div className="flex flex-wrap gap-3"><button type="button" disabled={archiveBusy} onClick={() => setArchivePicker(false)} className="min-h-10 flex-1 rounded-lg border border-[#34445d] bg-[#14243b] px-4 text-sm font-bold">إلغاء</button><button type="button" disabled={!canWrite || !archiveSelection.length || archiveBusy} onClick={() => void applyArchive()} className={`min-h-10 flex-[2] rounded-lg px-4 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40 ${archiveView === "archived" ? "bg-sky-400 text-[#0b1a2d]" : "bg-gradient-to-l from-rose-300 to-rose-500 text-[#301824]"}`}>{archiveBusy ? "جارٍ تنفيذ العملية..." : archiveView === "archived" ? `استرجاع ${archiveSelection.length} شقة` : archiveConfirm ? `تأكيد أرشفة ${archiveSelection.length} شقة` : `أرشفة ${archiveSelection.length} شقة`}</button></div>
            </footer>
          </div>
        </div>
      )}

      {reportEntity && <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm" dir="rtl" onMouseDown={e=>{if(e.target===e.currentTarget&&!reportEntityBusy)setReportEntity(null)}}>
        <div role="dialog" aria-modal="true" aria-label="إدارة سجل التقرير" className="flex max-h-[92vh] w-full max-w-[850px] flex-col overflow-hidden rounded-[24px] border border-amber-300/45 bg-gradient-to-b from-[#0d4439] to-[#041e1b] text-white shadow-2xl">
          <header className="flex shrink-0 items-center justify-between border-b border-amber-300/25 px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><span className="rounded-xl border border-amber-300/35 bg-amber-300/10 p-3 text-amber-200">{reportEntity.mode==="view"?<Eye size={22}/>:reportEntity.mode==="edit"?<Pencil size={22}/>:<Trash2 size={22}/>}</span><div><h3 className="text-lg font-black text-amber-200 sm:text-xl">{reportEntity.mode==="view"?"عرض بيانات":reportEntity.mode==="edit"?"تعديل بيانات":reportEntity.kind==="apartment"?"أرشفة":"حذف"} {reportEntity.kind==="apartment"?"الشقة":reportEntity.kind==="tenant"?"العميل":"المالك"}</h3><p className="text-xs text-emerald-100/65">عقاري سمارت • إدارة بيانات التقرير</p></div></div><button type="button" onClick={()=>setReportEntity(null)} disabled={reportEntityBusy} aria-label="إغلاق" className="rounded-lg border border-white/20 p-2 hover:bg-white/10"><X size={20}/></button></header>
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">{reportEntity.mode==="delete"?<div className="rounded-2xl border border-rose-400/35 bg-rose-500/10 p-5 text-sm leading-8 text-rose-100"><p className="font-black">{reportEntity.kind==="apartment"?"هل تريد أرشفة هذه الشقة؟":"هل تريد حذف هذا السجل نهائيًا؟"}</p><p>{reportEntity.kind==="apartment"?"ستختفي الشقة من التقارير النشطة مع الاحتفاظ بعقودها وبياناتها المالية. ويمكن استرجاعها من إدارة الأرشيف.":"لن يُسمح بحذف سجل مرتبط بعقود، أو مالك مرتبط بشقق. لا يمكن التراجع عن الحذف النهائي."}</p></div>:<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{reportEntityFields[reportEntity.kind].map(field=><label key={field.key} className={`block min-w-0 ${field.type==="textarea"?"sm:col-span-2":""}`}><span className="mb-2 block text-sm font-bold text-emerald-100">{field.label}</span>{reportEntity.kind==="apartment" && field.key==="region" ? <select disabled={reportEntity.mode==="view"} value={reportEntityForm.region||""} onChange={e=>setReportEntityForm(prev=>({...prev,region:e.target.value,city:"",district_street:"",nearest_landmark:""}))} className="min-h-12 w-full rounded-xl border border-emerald-300/30 bg-[#052a25] px-4 py-3 text-sm text-white outline-none focus:border-amber-300 disabled:opacity-75"><option value="">اختر المنطقة الإدارية</option>{Array.from(new Set([...Object.keys(SAUDI_REGIONS),reportEntityForm.region].filter(Boolean))).map(r=><option key={r} value={r}>{r}</option>)}</select> : reportEntity.kind==="apartment" && field.key==="city" ? <div className="space-y-2"><div className="flex gap-2"><select disabled={reportEntity.mode==="view" || !reportEntityForm.region} value={reportEntityForm.city||""} onChange={e=>setReportEntityForm(prev=>({...prev,city:e.target.value,district_street:"",nearest_landmark:""}))} className="min-h-12 min-w-0 flex-1 rounded-xl border border-emerald-300/30 bg-[#052a25] px-4 py-3 text-sm text-white outline-none focus:border-amber-300 disabled:opacity-75"><option value="">اختر المدينة / المحافظة</option>{reportCities.map(c=><option key={c} value={c}>{c}</option>)}</select>{reportEntity.mode==="edit" && <button type="button" disabled={!reportEntityForm.region} onClick={()=>{setReportCityEditor(v=>!v);setReportNewCity("");}} title="إضافة مدينة جديدة" className="min-h-12 shrink-0 rounded-xl border border-amber-300/50 bg-amber-300/10 px-3 text-amber-200 disabled:opacity-40"><Plus size={19}/></button>}</div>{reportCityEditor && reportEntity.mode==="edit" && <div className="flex gap-2"><input value={reportNewCity} onChange={e=>setReportNewCity(e.target.value)} placeholder="اسم المدينة الجديدة" maxLength={80} className="min-w-0 flex-1 rounded-xl border border-emerald-300/30 bg-[#052a25] px-3 py-2 text-sm text-white outline-none focus:border-amber-300"/><button type="button" onClick={saveReportCity} className="rounded-xl bg-amber-300 px-4 text-sm font-bold text-[#06372c]">إضافة</button></div>}</div> : reportEntity.kind==="apartment" && (field.key==="district_street" || field.key==="nearest_landmark") ? <><input list={`report-location-${field.key}`} disabled={reportEntity.mode==="view"} value={reportEntityForm[field.key]||""} onChange={e=>setReportEntityForm(prev=>({...prev,[field.key]:e.target.value}))} placeholder={field.key==="district_street"?"اكتب الحي أو اختر من المسجل سابقًا":"اكتب أقرب معلم أو اختر من المسجل سابقًا"} className="min-h-12 w-full rounded-xl border border-emerald-300/30 bg-[#052a25] px-4 py-3 text-sm text-white outline-none focus:border-amber-300 disabled:opacity-75"/><datalist id={`report-location-${field.key}`}>{reportLocationSuggestions(field.key).map(v=><option key={v} value={v}/>)}</datalist></> : field.type==="textarea"?<textarea rows={3} disabled={reportEntity.mode==="view"} value={reportEntityForm[field.key]||""} onChange={e=>setReportEntityForm(prev=>({...prev,[field.key]:e.target.value}))} className="w-full resize-y rounded-xl border border-emerald-300/30 bg-[#052a25] px-4 py-3 text-sm text-white outline-none focus:border-amber-300 disabled:opacity-75"/>:<input type={field.type||"text"} min={field.type==="number"?"0":undefined} step={field.type==="number"?"any":undefined} disabled={reportEntity.mode==="view"} value={reportEntityForm[field.key]||""} onChange={e=>setReportEntityForm(prev=>({...prev,[field.key]:e.target.value}))} className="min-h-12 w-full rounded-xl border border-emerald-300/30 bg-[#052a25] px-4 py-3 text-sm text-white outline-none focus:border-amber-300 disabled:opacity-75"/>}</label>)}</div>}{reportEntityError&&<p className="mt-4 rounded-xl border border-rose-400/45 bg-rose-500/10 p-3 text-sm text-rose-200">{reportEntityError}</p>}</div>
          <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-amber-300/25 bg-[#042820] p-4 sm:flex-row sm:px-7">{reportEntity.mode!=="view"&&<button type="button" disabled={reportEntityBusy||!canWrite} onClick={()=>void saveReportEntity()} className={`min-h-12 flex-1 rounded-xl px-4 font-black disabled:opacity-40 ${reportEntity.mode==="delete"?"bg-rose-600 text-white":"bg-gradient-to-l from-amber-300 to-yellow-400 text-[#06372c]"}`}>{reportEntityBusy?"جارٍ التنفيذ...":reportEntity.mode==="edit"?"حفظ التعديلات":reportEntity.kind==="apartment"?"تأكيد الأرشفة":"تأكيد الحذف"}</button>}<button type="button" disabled={reportEntityBusy} onClick={()=>setReportEntity(null)} className="min-h-12 flex-1 rounded-xl border border-emerald-300/40 bg-emerald-900/25 px-4 font-bold hover:bg-emerald-900/50">{reportEntity.mode==="view"?"إغلاق":"إلغاء"}</button></footer>
        </div>
      </div>}
      {contractActionMode && selectedReportContract && <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm" dir="rtl" onMouseDown={e=>{if(e.target===e.currentTarget&&!contractActionBusy)setContractActionMode(null)}}>
        <div role="dialog" aria-modal="true" aria-label="إدارة العقد" className={`flex w-full flex-col overflow-hidden rounded-[24px] border border-amber-300/50 bg-[#06352d] text-white shadow-[0_25px_90px_rgba(0,0,0,.65)] ${contractActionMode === "edit" ? "max-w-[880px] max-h-[92dvh]" : contractActionMode === "view" ? "max-w-[520px] max-h-[85dvh]" : "max-w-[420px] max-h-[85dvh]"}`}>
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-300/25 bg-gradient-to-l from-[#125346] to-[#052c26] px-5 py-4 sm:px-7">
            <div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-300/40 bg-amber-300/10 text-amber-200">{contractActionMode === "edit" ? <Pencil size={21}/> : <ReceiptText size={21}/>}</span><div className="min-w-0"><h3 className="text-lg font-black text-amber-200 sm:text-xl">{contractActionMode==="view"?"تفاصيل العقد":contractActionMode==="edit"?"تعديل بيانات العقد":selectedReportContract.status==="مؤرشف"?"استرجاع العقد":"أرشفة العقد"}</h3><p className="mt-0.5 text-xs text-emerald-100/75">العقد رقم {selectedReportContract.contract_number} {contractActionMode === "edit" ? "• مراجعة وتحديث بيانات العقد وجدول السداد" : ""}</p></div></div>
            <button type="button" onClick={()=>setContractActionMode(null)} aria-label="إغلاق" className="rounded-xl border border-white/20 bg-white/5 p-2.5 text-white transition hover:bg-white/15"><X size={20}/></button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-6">
            {contractActionMode === "view" ? <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">{[["رقم العقد",selectedReportContract.contract_number],["نوع العقد",selectedReportContract.contract_type],["الشقة",apartments.find(a=>a.id===selectedReportContract.apartment_id)?.number||"—"],["المستأجر",tenants.find(t=>t.id===selectedReportContract.tenant_id)?.full_name||"—"],["المالك",owners.find(o=>o.id===selectedReportContract.owner_id)?.full_name||"—"],["البداية",selectedReportContract.start_date],["النهاية",selectedReportContract.end_date],["المدة",selectedReportContract.rent_period||"—"],["إجمالي قيمة العقد",`${formatPrice(Number(selectedReportContract.rent_amount??0))} ر.س`],["الحالة",selectedReportContract.status||"—"],["ملاحظات",selectedReportContract.notes||"—"]].map(([label,value])=><div key={label} className="rounded-xl border border-emerald-300/20 bg-black/20 p-3"><div className="text-xs text-emerald-200">{label}</div><div className="mt-1 font-bold break-words">{value}</div></div>)}</div> : contractActionMode === "edit" ? <div className="space-y-5">
              <section className="rounded-2xl border border-emerald-300/20 bg-[#092f29]/85 p-4 sm:p-5"><div className="mb-4 flex items-center gap-2 border-b border-emerald-300/15 pb-3"><ReceiptText size={19} className="text-amber-300"/><h4 className="text-base font-black text-amber-200">البيانات الأساسية للعقد</h4></div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="block text-sm font-bold text-emerald-100">رقم العقد<input value={contractEdit.contract_number} onChange={e=>setContractEdit(p=>({...p,contract_number:e.target.value}))} className="mt-2 block min-h-11 w-full rounded-xl border border-emerald-300/35 bg-[#031e1b] px-4 py-2.5 text-base text-white outline-none focus:border-amber-300"/></label><div className="rounded-xl border border-emerald-300/15 bg-[#031e1b]/55 px-4 py-3"><p className="text-xs text-emerald-200">الشقة / المستأجر</p><p className="mt-1 text-sm font-bold">{apartments.find(a=>a.id===selectedReportContract.apartment_id)?.number||"—"} — {tenants.find(t=>t.id===selectedReportContract.tenant_id)?.full_name||"—"}</p></div>
                  <label className="block text-sm font-bold text-emerald-100">تاريخ بداية العقد<input type="date" value={contractEdit.start_date} onChange={e=>{setContractEdit(p=>({...p,start_date:e.target.value}));setConfirmReschedule(false);}} className="mt-2 block min-h-11 w-full min-w-0 rounded-xl border border-emerald-300/35 bg-[#031e1b] px-3 py-2.5 text-base text-white outline-none focus:border-amber-300"/></label><label className="block text-sm font-bold text-emerald-100">تاريخ نهاية العقد<input type="date" value={contractEdit.end_date} onChange={e=>{setContractEdit(p=>({...p,end_date:e.target.value}));setConfirmReschedule(false);}} className="mt-2 block min-h-11 w-full min-w-0 rounded-xl border border-emerald-300/35 bg-[#031e1b] px-3 py-2.5 text-base text-white outline-none focus:border-amber-300"/></label>
                </div><label className="mt-4 block text-sm font-bold text-emerald-100">الملاحظات<textarea rows={3} value={contractEdit.notes} onChange={e=>setContractEdit(p=>({...p,notes:e.target.value}))} placeholder="أضف ملاحظات العقد هنا..." className="mt-2 block w-full resize-y rounded-xl border border-emerald-300/35 bg-[#031e1b] px-4 py-3 text-sm text-white outline-none placeholder:text-emerald-100/35 focus:border-amber-300"/></label>
              </section>
              <section className="rounded-2xl border border-amber-300/25 bg-[#092f29]/85 p-4 sm:p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-amber-300/15 pb-3"><div className="flex items-center gap-2"><CalendarDays size={19} className="text-amber-300"/><h4 className="text-base font-black text-amber-200">جدول استحقاق الأقساط</h4></div><span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-100">{editFrequency||"دورية غير محددة"}</span></div>
                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="rounded-xl border border-emerald-300/15 bg-black/20 p-3"><p className="text-xs text-emerald-200">إجمالي قيمة العقد</p><p className="mt-1 text-lg font-black text-amber-200">{formatPrice(Number(selectedReportContract.rent_amount??0))} <span className="text-xs">ر.س</span></p></div><div className="rounded-xl border border-emerald-300/15 bg-black/20 p-3"><p className="text-xs text-emerald-200">تاريخ أول استحقاق</p><p className="mt-1 text-base font-bold">{editFirstDue||"—"}</p></div><div className="rounded-xl border border-emerald-300/15 bg-black/20 p-3"><p className="text-xs text-emerald-200">عدد الأقساط</p><p className="mt-1 text-lg font-black text-amber-200">{(contractDateChanged?newSchedulePreview:editSchedule).length}</p></div></div>
                {contractDateChanged && <p className="mb-3 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">تم تغيير تاريخ العقد. راجع المواعيد الجديدة بعناية قبل تأكيد إعادة الجدولة.</p>}
                {editScheduleLoading ? <p className="py-8 text-center text-sm text-emerald-100">جارٍ تحميل جدول الأقساط...</p> : <div className="max-h-[270px] overflow-auto rounded-xl border border-emerald-300/20"><table className="w-full min-w-[570px] border-collapse text-center text-sm"><thead className="sticky top-0 z-10 bg-[#155044] text-amber-100"><tr><th className="p-3">رقم القسط</th><th className="p-3">الاستحقاق الحالي</th><th className="p-3">الاستحقاق الجديد</th><th className="p-3">قيمة القسط</th></tr></thead><tbody>{(contractDateChanged?newSchedulePreview:editSchedule).map((item,i)=><tr key={item.installment_no} className="border-t border-emerald-300/15 even:bg-white/[0.035]"><td className="p-3 font-bold">{item.installment_no}</td><td className="p-3" dir="ltr">{editSchedule[i]?.due_date||"—"}</td><td className={`p-3 ${contractDateChanged?"font-black text-amber-200":""}`} dir="ltr">{item.due_date}</td><td className="p-3 font-bold">{Number(item.amount).toLocaleString("ar-SA")} ر.س</td></tr>)}</tbody></table></div>}
                {contractDateChanged && !newSchedulePreview.length && <p className="mt-3 rounded-xl border border-rose-300/40 bg-rose-900/20 p-3 text-sm text-rose-100">تعذر حساب الجدول الجديد. تحقق من تاريخ أول استحقاق ومدة العقد.</p>}
                {contractDateChanged && newSchedulePreview.length>0 && <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-300/35 bg-amber-300/10 p-4 text-sm leading-6"><input type="checkbox" checked={confirmReschedule} onChange={e=>setConfirmReschedule(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-amber-300"/><span>أؤكد مراجعة مواعيد استحقاق الأقساط الجديدة والموافقة على إعادة الجدولة. لن يُسمح بإعادة الجدولة إذا سُجلت تحصيلات على العقد.</span></label>}
              </section>
            </div> : <p className="rounded-xl border border-amber-300/30 p-4 text-sm">{selectedReportContract.status==="مؤرشف"?"هل تريد استرجاع هذا العقد إلى الحالة النشطة؟":"هل تريد أرشفة هذا العقد؟ ستظل بياناته وسجلاته المالية محفوظة، ولن يتم حذفه نهائيًا."}</p>}
            {contractActionError && <p role="alert" className="mt-4 rounded-xl border border-red-300/50 bg-red-900/20 p-3 text-sm text-red-100">{contractActionError}</p>}
          </div>
          <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-amber-300/20 bg-[#042820] px-4 py-4 sm:flex-row sm:px-7">{contractActionMode!=="view" && <button type="button" disabled={contractActionBusy||!canWrite} onClick={()=>void saveContractAction()} className="min-h-12 flex-1 rounded-xl bg-gradient-to-l from-amber-300 to-yellow-400 px-4 text-sm font-black text-[#07352d] transition hover:brightness-110 disabled:opacity-40">{contractActionBusy?"جارٍ الحفظ...":contractActionMode==="edit"?"حفظ التعديلات":selectedReportContract.status==="مؤرشف"?"تأكيد الاسترجاع":"تأكيد الأرشفة"}</button>}<button type="button" onClick={()=>setContractActionMode(null)} className="min-h-12 flex-1 rounded-xl border border-emerald-300/40 bg-emerald-900/25 px-4 text-sm font-bold hover:bg-emerald-900/50">{contractActionMode==="edit"?"إلغاء والعودة":"إغلاق"}</button></footer>
        </div></div>}

      {contractModal && (
        <div className="fixed inset-0 z-[165] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md" dir="rtl" onMouseDown={e=>{if(e.target===e.currentTarget&&!contractSaving)setContractModal(false);}}>
          <div role="dialog" aria-modal="true" aria-label="إضافة عقد جديد" className="relative flex flex-col overflow-hidden rounded-[24px] border border-amber-300/65 bg-[#052b24] text-white shadow-[0_30px_100px_rgba(0,0,0,.75)]" style={{width:"min(820px, calc(100vw - 32px))",maxWidth:"820px",maxHeight:"min(720px, 92dvh)",margin:"auto",flex:"0 1 820px"}}>
            <div className="pointer-events-none absolute inset-0" style={{backgroundImage:"url('/add-contract.png')",backgroundPosition:"center",backgroundSize:"contain",backgroundRepeat:"no-repeat",backgroundColor:"#052b24",opacity:0.88}}/>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-[#052b24]/80 via-[#052b24]/62 to-[#052b24]/30"/>
            <div className="relative min-h-0 overflow-y-auto p-4 sm:p-6">
              <button type="button" onClick={()=>setContractModal(false)} className="absolute left-4 top-4 rounded-full border border-amber-300/50 bg-[#073b31] p-2"><X size={17}/></button>
              <header className="mb-5 text-center"><FilePlus2 size={32} className="mx-auto text-amber-300"/><h2 className="text-2xl font-black text-amber-200">إضافة عقد جديد</h2><p className="text-xs text-emerald-100/75">ربط عقد بشقة ومالك مسجلين</p></header>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold">الشقة *<select value={contractForm.apartment_id} onChange={e=>{const a=apartments.find(x=>x.id===e.target.value);setContractForm(p=>({...p,apartment_id:e.target.value,owner_id:a?.ownerId || "",rent_period:p.rent_period,contract_amount:a ? String(a.price) : ""}));setContractError("");}} className="mt-1 block h-11 w-full rounded-xl border border-emerald-300/40 bg-[#06372f] px-3"><option value="">اختر الشقة</option>{apartments.filter(a=>!a.archivedAt).map(a=><option key={a.id} value={a.id}>{a.number} — {a.buildingName || a.location}</option>)}</select></label>
                <div><label className="text-sm font-bold">المالك *</label><div className="mt-1 flex gap-2"><select value={contractForm.owner_id} onChange={e=>setContractForm(p=>({...p,owner_id:e.target.value}))} className="h-11 min-w-0 flex-1 rounded-xl border border-emerald-300/40 bg-[#06372f] px-3"><option value="">اختر مالكًا مسجلًا</option>{owners.map(o=><option key={o.id} value={o.id}>{o.full_name} — {o.mobile || o.identity_number || ""}</option>)}</select><button type="button" title="إضافة مالك جديد" onClick={()=>{setOwnerCreatedForContract(true);openStandaloneOwner();}} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-amber-300/60 bg-amber-300/20 text-amber-200"><Plus size={23}/></button></div></div>
                <div><label className="text-sm font-bold">المستأجر *</label><div className="mt-1 flex gap-2"><select value={contractForm.tenant_id} onChange={e=>setContractForm(p=>({...p,tenant_id:e.target.value}))} className="h-11 min-w-0 flex-1 rounded-xl border border-emerald-300/40 bg-[#06372f] px-3"><option value="">اختر مستأجرًا مسجلًا</option>{tenants.map(t=><option key={t.id} value={t.id}>{t.full_name} — {t.phone || t.identity_number || ""}</option>)}</select><button type="button" title="إضافة مستأجر جديد" aria-label="إضافة مستأجر جديد" onClick={()=>{setContractTenantAfterCreate(true);setBookingTenantAfterCreate(false);setTenantError("");setTenantForm({full_name:"",phone:"",identity_number:"",nationality:"",email:"",notes:""});setTenantModal(true);}} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-amber-300/60 bg-amber-300/20 text-amber-200"><Plus size={23}/></button></div></div>
                <label className="text-sm font-bold">رقم العقد *<input value={contractForm.contract_number} onChange={e=>setContractForm(p=>({...p,contract_number:e.target.value}))} className="mt-1 h-11 w-full rounded-xl border border-emerald-300/40 bg-[#06372f] px-3"/></label>
                <label className="text-sm font-bold">نوع العقد<select value={contractForm.contract_type} onChange={e=>setContractForm(p=>({...p,contract_type:e.target.value}))} className="mt-1 h-11 w-full rounded-xl border border-emerald-300/40 bg-[#06372f] px-3"><option>إيجار</option><option>إدارة أملاك</option><option>أخرى</option></select></label>
                <div className="text-sm font-bold"><label htmlFor="contract-rent-period">مدة العقد *</label><div className="mt-1 flex gap-2"><select id="contract-rent-period" value={contractForm.rent_period} onChange={e=>setContractForm(p=>({...p,rent_period:e.target.value,end_date:endDateForContractDuration(p.start_date,e.target.value)||p.end_date}))} className="h-11 min-w-0 flex-1 rounded-xl border border-emerald-300/40 bg-[#06372f] px-3"><option value="">اختر مدة العقد</option>{contractPeriods.map(period=><option key={period} value={period}>{period}</option>)}</select><button type="button" title="إضافة مدة عقد جديدة" onClick={()=>{setAddingContractPeriod(v=>!v);setContractPeriodError("");}} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-amber-300/60 bg-amber-300/20 text-amber-200"><Plus size={23}/></button></div>{addingContractPeriod && <div className="mt-2 rounded-xl border border-amber-300/40 bg-[#052b24] p-3"><label className="block text-xs">اسم مدة العقد الجديدة<input value={newContractPeriod} onChange={e=>setNewContractPeriod(e.target.value)} placeholder="مثال: سنتين" maxLength={50} className="mt-1 h-10 w-full rounded-lg border border-emerald-300/40 bg-[#06372f] px-3"/></label><button type="button" disabled={savingContractPeriod} onClick={()=>void addContractPeriod()} className="mt-2 rounded-lg bg-amber-300 px-4 py-2 font-bold text-[#052b24] disabled:opacity-50">{savingContractPeriod?"جارٍ الحفظ...":"حفظ المدة"}</button>{contractPeriodError && <p className="mt-2 text-xs text-rose-200">{contractPeriodError}</p>}</div>}</div>
                <label className="text-sm font-bold">تاريخ البداية *<input type="date" value={contractForm.start_date} onChange={e=>setContractForm(p=>({...p,start_date:e.target.value,end_date:endDateForContractDuration(e.target.value,p.rent_period)||p.end_date,first_due_date:e.target.value}))} className="mt-1 h-11 w-full rounded-xl border border-emerald-300/40 bg-[#06372f] px-3"/></label>
                <label className="text-sm font-bold">تاريخ النهاية *<input type="date" value={contractForm.end_date} onChange={e=>setContractForm(p=>({...p,end_date:e.target.value}))} className="mt-1 h-11 w-full rounded-xl border border-emerald-300/40 bg-[#06372f] px-3"/></label>
                <label className="text-sm font-bold sm:col-span-2">إجمالي قيمة العقد (ر.س) — تُملأ مبدئيًا بإيجار الشقة وقابلة للتعديل<input type="number" min="0" value={contractForm.contract_amount} onChange={e=>setContractForm(p=>({...p,contract_amount:e.target.value}))} className="mt-1 h-11 w-full rounded-xl border border-emerald-300/40 bg-[#06372f] px-3"/></label>
                {contractForm.apartment_id && <p className="sm:col-span-2 -mt-2 text-xs text-emerald-100/85">الإيجار الافتراضي للشقة: {formatPrice(apartments.find(a=>a.id===contractForm.apartment_id)?.price ?? 0)} ر.س / {apartments.find(a=>a.id===contractForm.apartment_id)?.rentCategory ?? "غير محدد"}. القيمة المسجلة للشقة تخص فترة الإيجار المذكورة. عدّل إجمالي العقد وفق مدته قبل الحفظ؛ هذا الإجمالي هو الذي سيُوزّع على الأقساط.</p>}
                {contractForm.contract_type === "إيجار" && <div className="sm:col-span-2 rounded-2xl border border-amber-300/35 bg-[#052c25]/85 p-4">
                  <h3 className="mb-3 text-base font-black text-amber-200">جدول سداد الإيجار</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="text-sm font-bold">دورية السداد *<select value={contractForm.payment_frequency} onChange={e=>setContractForm(p=>({...p,payment_frequency:e.target.value}))} className="mt-1 h-11 w-full rounded-xl border border-emerald-300/40 bg-[#06372f] px-3"><option>يومي</option><option>شهري</option><option>ربع سنوي</option><option>نصف سنوي</option><option>سنوي</option></select></label>
                    <label className="text-sm font-bold">تاريخ أول استحقاق *<input type="date" value={contractForm.first_due_date} onChange={e=>setContractForm(p=>({...p,first_due_date:e.target.value}))} className="mt-1 h-11 w-full rounded-xl border border-emerald-300/40 bg-[#06372f] px-3"/></label>
                  </div>
                  <p className="mt-3 text-xs text-emerald-100/80">مدة العقد تُحدد من تاريخ البداية والنهاية، ودورية السداد تُحدد عدد الأقساط. يتم توزيع إجمالي قيمة العقد على الأقساط تلقائيًا.</p>
                  {contractPreviewIssue && <p role="status" className="mt-3 rounded-lg border border-amber-300/40 bg-amber-900/20 p-2 text-xs font-bold text-amber-100">{contractPreviewIssue}</p>}
                  {contractInstallmentPreview.length > 0 && <div className="mt-3 max-h-48 overflow-auto rounded-xl border border-emerald-300/25">
                    <table className="w-full text-right text-xs"><thead className="sticky top-0 bg-[#0a4739] text-amber-200"><tr><th className="p-2">القسط</th><th className="p-2">تاريخ الاستحقاق</th><th className="p-2">القيمة (ر.س)</th></tr></thead><tbody>{contractInstallmentPreview.map((item,i)=><tr key={i} className="border-t border-emerald-300/15"><td className="p-2">{i+1}</td><td className="p-2">{item.dueDate}</td><td className="p-2">{item.amount.toLocaleString("ar-SA",{minimumFractionDigits:2})}</td></tr>)}</tbody></table>
                  </div>}
                  <p className="mt-2 text-xs font-bold text-amber-100">عدد الأقساط: {contractInstallmentPreview.length} — الإجمالي: {contractInstallmentPreview.reduce((sum,item)=>sum+item.amount,0).toLocaleString("ar-SA",{maximumFractionDigits:2})} ر.س</p>
                </div>}
                <label className="text-sm font-bold sm:col-span-2">ملاحظات<textarea rows={2} value={contractForm.notes} onChange={e=>setContractForm(p=>({...p,notes:e.target.value}))} className="mt-1 w-full rounded-xl border border-emerald-300/40 bg-[#06372f] p-3"/></label>
              </div>
              {contractError && <p role="alert" className="mt-3 rounded-xl border border-rose-300/40 bg-rose-900/40 p-3 text-sm">{contractError}</p>}
              <div className="mt-4 flex gap-2"><button type="button" disabled={contractSaving || !canWrite} onClick={()=>void saveContract()} className="min-h-11 flex-[2] rounded-xl bg-gradient-to-l from-[#f3d477] to-[#b88828] font-black text-[#09251f] disabled:opacity-50">{contractSaving?"جارٍ الحفظ...":"حفظ العقد"}</button><button type="button" onClick={()=>setContractModal(false)} className="min-h-11 flex-1 rounded-xl border border-amber-300/40 bg-[#073b31] font-bold">إلغاء</button></div>
            </div>
          </div>
        </div>
      )}

       {standaloneOwnerModal && (
        <div className="fixed inset-0 z-[175] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md" dir="rtl" onMouseDown={e => { if (e.target === e.currentTarget && !savingStandaloneOwner) setStandaloneOwnerModal(false); }}>
          <div role="dialog" aria-modal="true" aria-label="إضافة مالك جديد" className="relative flex w-full max-w-[720px] flex-col overflow-hidden rounded-[24px] border border-amber-300/65 bg-[#052b24] text-white shadow-[0_30px_100px_rgba(0,0,0,.75)]" style={{width:"min(720px, calc(100vw - 32px))",maxWidth:"720px",maxHeight:"min(760px, 92dvh)",margin:"auto",flex:"0 1 720px"}}>
            <div className="pointer-events-none absolute inset-0 bg-cover bg-left" style={{backgroundImage:"url('/add-client-bg.png')"}} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-[#052b24]/90 via-[#052b24]/78 to-[#052b24]/10" />
            <button type="button" disabled={savingStandaloneOwner} onClick={() => setStandaloneOwnerModal(false)} aria-label="إغلاق" className="absolute left-3 top-3 z-20 grid h-8 w-8 place-items-center rounded-full border border-amber-200/55 bg-[#073b31]/80 text-white hover:bg-amber-300/20"><X size={17}/></button>
            <div className="relative min-h-0">
              <div className="relative z-10 min-h-0 max-h-[75dvh] overflow-y-auto px-4 pb-3 pt-4 sm:pl-5 sm:pr-[30%]">
                <header className="mb-3 text-center">
                  <UserRoundCheck size={31} className="mx-auto mb-1 text-amber-300"/>
                  <h2 className="text-xl font-black text-amber-200 sm:text-2xl">إضافة مالك جديد</h2>
                  <p className="mt-1 text-xs text-emerald-100/75">سجل بيانات المالك الآن واربطه بشقة أو أكثر لاحقًا</p>
                </header>
                <div className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2">
                  {([ ["full_name", "اسم المالك *", "text", "الاسم بالكامل"], ["mobile", "رقم الجوال", "tel", "05xxxxxxxx"], ["phone", "رقم هاتف إضافي", "tel", "رقم إضافي"], ["email", "البريد الإلكتروني", "email", "example@email.com"], ["nationality", "الجنسية", "text", "الجنسية"], ["identity_number", "رقم الهوية / الإقامة", "text", "رقم الهوية أو الإقامة"] ] as const).map(([key, label, type, placeholder]) => (
                    <label key={key} className="block min-w-0 text-right text-xs font-bold text-emerald-50">{label}
                      <input type={type} value={standaloneOwnerForm[key]} onChange={e => setStandaloneOwnerForm(prev => ({...prev, [key]: e.target.value}))} placeholder={placeholder} className="mt-1 h-10 w-full rounded-xl border border-emerald-300/40 bg-[#062b25]/90 px-3 text-sm text-white outline-none placeholder:text-emerald-100/35 focus:border-amber-300"/>
                    </label>
                  ))}
                </div>
                {ownerSuggestions.length > 0 && <div className="mt-3 rounded-xl border border-amber-300/40 bg-[#092f28] p-2 text-right">
                  <p className="mb-2 text-xs font-bold text-amber-200">ملاك مسجلون قد يطابقون البيانات المدخلة — اختر اسمًا لعرض بياناته</p>
                  {ownerSuggestions.map(owner => <button key={owner.id} type="button" onClick={() => setStandaloneOwnerError(`المالك ${owner.full_name} مسجل بالفعل. الجوال: ${owner.mobile || "غير مسجل"} — الهوية: ${owner.identity_number || "غير مسجلة"}. يمكن ربطه بالشقة من بيانات الشقة.`)} className="mb-1 block w-full rounded-lg border border-emerald-300/20 px-3 py-2 text-right text-xs text-emerald-50 hover:bg-emerald-400/10">
                    <strong>{owner.full_name}</strong> <span className="text-emerald-100/60">— {owner.mobile || owner.identity_number || owner.email || "بدون بيانات اتصال"}</span>
                  </button>)}
                </div>}
                {standaloneOwnerError && <p role="alert" className="mt-3 rounded-xl border border-rose-300/40 bg-rose-900/25 p-3 text-xs text-rose-100">{standaloneOwnerError}</p>}
              </div>
            </div>
            <footer className="relative z-10 flex shrink-0 gap-3 border-t border-amber-300/30 bg-[#052b24]/75 px-4 py-2 sm:px-6">
              <button type="button" disabled={savingStandaloneOwner || !canWrite} onClick={() => void saveStandaloneOwner()} className="min-h-11 flex-[2] rounded-xl bg-gradient-to-l from-[#f3d477] to-[#b88828] font-black text-[#09251f] disabled:opacity-50">{savingStandaloneOwner ? "جارٍ الحفظ..." : "حفظ المالك"}</button>
              <button type="button" disabled={savingStandaloneOwner} onClick={() => setStandaloneOwnerModal(false)} className="min-h-11 flex-1 rounded-xl border border-amber-300/40 bg-white/5 font-bold">إلغاء</button>
            </footer>
          </div>
        </div>
      )}

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
            <div className="mx-auto flex w-full max-w-[660px] shrink-0 gap-3 bg-[#052f27] px-4 py-3 sm:gap-5 sm:px-6">
              <button type="button" onClick={() => setApartmentTab("apartment")}
                aria-pressed={apartmentTab === "apartment"}
                className={`flex min-h-[58px] flex-1 items-center justify-center gap-3 rounded-2xl border-2 px-3 py-4 text-base font-black shadow-md transition sm:min-h-[70px] sm:text-xl ${apartmentTab === "apartment" ? "border-amber-300 bg-amber-300 text-[#082d24]" : "border-emerald-300/35 bg-[#073d32] text-emerald-100 hover:border-amber-300"}`}><Building2 size={25}/> بيانات الشقة</button>
              <button type="button" onClick={() => setApartmentTab("owner")}
                aria-pressed={apartmentTab === "owner"}
                className={`flex min-h-[58px] flex-1 items-center justify-center gap-3 rounded-2xl border-2 px-3 py-4 text-base font-black shadow-md transition sm:min-h-[70px] sm:text-xl ${apartmentTab === "owner" ? "border-amber-300 bg-amber-300 text-[#082d24]" : "border-emerald-300/35 bg-[#073d32] text-emerald-100 hover:border-amber-300"}`}><UserRoundCheck size={25}/> بيانات المالك</button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
              <div className="grid min-h-full grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
                <div className="min-w-0 overflow-y-auto p-5 sm:p-7 lg:max-h-[720px]">
                  {apartmentTab === "apartment" ? <>
                  <div className="mb-3 flex items-center gap-2 border-b border-amber-300/20 pb-2 text-base font-black text-amber-200"><Building2 size={18}/> بيانات الشقة الأساسية</div>
                  <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                    <FormInput label="رقم / اسم الشقة *" value={form.number} onChange={(value) => setForm({ ...form, number: value })} placeholder="مثال: 1/6A أو شقة 101" />
                    <FormInput label="اسم العمارة" value={form.buildingName} onChange={(value) => setForm({ ...form, buildingName: value })} placeholder="مثال: عمارة سنتر" />
                    <FormInput label="عدد الغرف" type="number" value={form.rooms} onChange={(value) => setForm({ ...form, rooms: value })} placeholder="2" />
                    <FormInput label={`قيمة الإيجار (${form.rentCategory}) بالريال *`} type="number" value={form.price} onChange={(value) => setForm({ ...form, price: value })} placeholder="مثال: 2500" />
                    <FormSelect label="الفئة / مدة الإيجار" value={form.rentCategory} onChange={(value) => setForm(prev => ({ ...prev, rentCategory: value as RentCategory, price: rentString(priceForPeriod(typeCatalog.prices[prev.type], value)) || prev.price }))} options={["يومي", "شهري", "سنوي"]} />
                    <FormInput label="المساحة (م²) *" type="number" value={form.area} onChange={(value) => setForm({ ...form, area: value })} placeholder="100" />
                    <div className="relative min-w-0">
                      <button type="button" title="إضافة نوع الشقة" aria-label="إضافة نوع الشقة" onClick={() => openChoiceEditor("type")} className="absolute left-0 top-0 z-10 grid h-6 w-6 place-items-center rounded-md border border-amber-300/55 bg-amber-300/15 text-amber-200 transition hover:bg-amber-300/30"><Plus size={15} strokeWidth={2.6}/></button>
                      <FormSelect label="نوع الشقة" value={form.type} onChange={(value) => setForm(prev => ({ ...prev, type: value, price: rentString(priceForPeriod(typeCatalog.prices[value], prev.rentCategory)) || prev.price }))} options={apartmentTypes} />
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
                  </> : <section className="space-y-5">
                    <div className="flex items-center gap-3 border-b border-amber-300/25 pb-3 text-lg font-black text-amber-200"><UserRoundCheck size={23}/> بيانات مالك الشقة</div>
                    <p className="text-sm leading-7 text-emerald-100/75">اربط الشقة بمالك مسجل، أو أضف مالكًا جديدًا. يمكن ربط أكثر من شقة بنفس المالك.</p>
                    {ownersError && <p role="alert" className="rounded-xl border border-rose-300/35 bg-rose-950/30 p-3 text-sm text-rose-200">{ownersError}</p>}
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setOwnerMode("existing")} className={`rounded-xl border px-3 py-3 text-sm font-black ${ownerMode === "existing" ? "border-amber-300 bg-amber-300/20 text-amber-200" : "border-white/20 text-emerald-100"}`}>اختيار مالك مسجل</button>
                      <button type="button" onClick={() => { setOwnerMode("new"); setOwnerId(""); }} className={`rounded-xl border px-3 py-3 text-sm font-black ${ownerMode === "new" ? "border-amber-300 bg-amber-300/20 text-amber-200" : "border-white/20 text-emerald-100"}`}>+ مالك جديد</button>
                    </div>
                    {ownerMode === "existing" ? <label className="block text-sm font-bold text-emerald-50">المالك
                      <select value={ownerId} onChange={e => setOwnerId(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-emerald-300/40 bg-[#062b25] px-3 text-white">
                        <option value="">بدون مالك محدد</option>
                        {owners.map(o => <option key={o.id} value={o.id}>{o.full_name}{o.mobile ? ` — ${o.mobile}` : ""}</option>)}
                      </select>
                    </label> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {([ ["full_name", "اسم المالك *", "text", "اسم المالك بالكامل"], ["mobile", "رقم الجوال", "tel", "05xxxxxxxx"], ["phone", "رقم الهاتف", "tel", "رقم إضافي"], ["email", "البريد الإلكتروني", "email", "example@email.com"], ["nationality", "الجنسية", "text", "مثال: سعودي"], ["identity_number", "رقم الهوية / الإقامة", "text", "رقم الهوية أو الإقامة"] ] as const).map(([key, label, type, placeholder]) =>
                        <label key={key} className="block text-sm font-bold text-emerald-50">{label}
                          <input type={type} value={ownerForm[key]} onChange={e => setOwnerForm(prev => ({ ...prev, [key]: e.target.value }))} placeholder={placeholder} className="mt-2 h-12 w-full rounded-xl border border-emerald-300/40 bg-[#062b25] px-3 text-white placeholder:text-emerald-100/40 focus:border-amber-300" />
                        </label>)}
                    </div>}
                    <div className="rounded-xl border border-amber-300/25 bg-amber-300/5 p-3 text-xs leading-6 text-amber-100/80">سيتم حفظ بيانات المالك وربطها بالشقة عند الضغط على زر حفظ الشقة أسفل النافذة.</div>
                  </section>}
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
