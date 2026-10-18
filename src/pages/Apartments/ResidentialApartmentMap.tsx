import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import { Building2, Home, CheckCircle2, CalendarDays, AlertTriangle, Search, RefreshCw, ArrowRight } from "lucide-react";
import ResidentialApartmentDetailsModal from "./ResidentialApartmentDetailsModal";

const COMPANY_ID = "61bed49c-bc21-476a-865b-1d28db791ad2";

type Unit = {
  id: string;
  apartment_number: string;
  building_name: string | null;
  apartment_type: string | null;
  apartment_status: string;
  rooms_count: number | null;
  rent_amount: number | null;
  rent_period: string | null;
  area_sqm: number | null;
  region: string | null;
  city: string | null;
  district_street: string | null;
  nearest_landmark: string | null;
  notes: string | null;
  archived_at: string | null;
  owner_id: string | null;
};

function statusKind(value: string) {
  const status = value.trim();
  if (["مؤجرة", "مؤجر", "مشغولة", "مؤجرة للشركة"].includes(status)) return "rented";
  if (["محجوزة", "محجوز", "حجز مؤكد"].includes(status)) return "reserved";
  if (status.includes("صيانة")) return "maintenance";
  if (["متاحة", "شاغرة", "فارغة", "متوفر", "متوفرة"].includes(status)) return "vacant";
  return "other";
}

const statusStyles: Record<string, string> = {
  rented: "border-red-400/80 bg-gradient-to-br from-[#f00519] to-[#ba0012] hover:from-red-500 hover:to-red-700",
  vacant: "border-emerald-300/65 bg-gradient-to-br from-[#00bc60] to-[#008b49] hover:from-emerald-400 hover:to-emerald-700",
  reserved: "border-blue-400/80 bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700",
  maintenance: "border-amber-300/80 bg-gradient-to-br from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600",
  other: "border-slate-400/65 bg-gradient-to-br from-slate-600 to-slate-800 hover:from-slate-500 hover:to-slate-700",
};

export default function ResidentialApartmentMap() {
  const navigate = useNavigate();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("الكل");
  const [buildingFilter, setBuildingFilter] = useState("الكل");
  const [selected, setSelected] = useState<Unit | null>(null);
  const openDetails = (unit: Unit) => setSelected(unit);

  const loadUnits = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error("يجب تسجيل الدخول بحساب مصرح له لعرض الشقق.");
      const { data: member, error: memberError } = await supabase.from("residential_company_users")
        .select("role").eq("company_id", COMPANY_ID).eq("user_id", auth.user.id).maybeSingle();
      if (memberError || !member) throw new Error(memberError?.message || "حسابك غير مرتبط بالشركة الخاصة بالشقق السكنية.");
      const { data, error: queryError } = await supabase.from("residential_apartments")
        .select("id,apartment_number,building_name,apartment_type,apartment_status,rooms_count,rent_amount,rent_period,area_sqm,region,city,district_street,nearest_landmark,notes,archived_at,owner_id")
        .eq("company_id", COMPANY_ID).is("archived_at", null).order("apartment_number", { ascending: true });
      if (queryError) throw queryError;
      setUnits((data ?? []) as Unit[]);
    } catch (err) { setError(err instanceof Error ? err.message : "تعذر تحميل بيانات الشقق."); setUnits([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadUnits(); }, [loadUnits]);

  const buildings = useMemo(() => Array.from(new Set(units.map(u => u.building_name?.trim() || "غير محدد"))).sort((a,b) => a.localeCompare(b,"ar",{numeric:true})), [units]);
  const visible = useMemo(() => units.filter(u => {
    const q = search.trim().toLocaleLowerCase();
    const matches = !q || [u.apartment_number, u.building_name, u.apartment_type, u.city, u.district_street].some(v => (v ?? "").toLocaleLowerCase().includes(q));
    return matches && (filter === "الكل" || statusKind(u.apartment_status) === filter) && (buildingFilter === "الكل" || (u.building_name?.trim() || "غير محدد") === buildingFilter);
  }), [units, search, filter, buildingFilter]);
  const grouped = useMemo(() => {
    const groups = new Map<string, Unit[]>();
    visible.forEach(u => { const name = u.building_name?.trim() || "غير محدد"; groups.set(name, [...(groups.get(name) ?? []), u]); });
    return Array.from(groups.entries()).sort(([a],[b]) => a.localeCompare(b,"ar",{numeric:true})).map(([name, list]) => ({name, list: list.sort((a,b) => a.apartment_number.localeCompare(b.apartment_number,"ar",{numeric:true}))}));
  }, [visible]);
  const count = (kind: string) => units.filter(u => statusKind(u.apartment_status) === kind).length;
  const stats = [
    { label: "إجمالي الشقق", value: units.length, icon: Building2, color: "text-white", kind: "الكل" },
    { label: "الشقق المؤجرة", value: count("rented"), icon: CheckCircle2, color: "text-emerald-300", kind: "rented" },
    { label: "الشقق الشاغرة", value: count("vacant"), icon: Home, color: "text-red-300", kind: "vacant" },
    { label: "تحت الصيانة", value: count("maintenance"), icon: AlertTriangle, color: "text-amber-300", kind: "maintenance" },
    { label: "محجوزة", value: count("reserved"), icon: CalendarDays, color: "text-blue-300", kind: "reserved" },
  ];

  return <div dir="rtl" className="relative min-h-screen w-full min-w-0 overflow-x-hidden bg-[#062B24] p-2 text-white sm:p-3 lg:p-4" style={{backgroundImage:"radial-gradient(circle at 12% 8%,rgba(20,85,69,.42),transparent 30%),radial-gradient(circle at 88% 14%,rgba(198,158,48,.10),transparent 24%),linear-gradient(145deg,#062B24 0%,#0a3b30 48%,#041f1a 100%)"}}>
    <div className="pointer-events-none absolute inset-0 bg-[url('/aqar-smart-logo.png')] bg-center bg-no-repeat bg-[length:460px_auto] opacity-[0.085]" />
    <div className="relative mx-auto max-w-[1700px] overflow-hidden rounded-[28px] border border-[#7ab89d]/20 bg-[#0a3028]/95 shadow-[0_25px_90px_rgba(0,0,0,.28)] backdrop-blur-2xl">
      <header className="relative border-b border-white/10 bg-gradient-to-b from-[#2f6f5a]/30 to-transparent px-4 pb-7 pt-4 text-center sm:px-6">
        <div className="mb-4 flex w-full justify-start"><button type="button" onClick={() => navigate("/apartments")} className="group inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-amber-300/35 bg-[#123e32]/90 px-4 py-2 text-sm font-bold text-amber-100 shadow-[0_4px_16px_rgba(0,0,0,.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:bg-[#19513e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-300/15 text-amber-300 transition-colors group-hover:bg-amber-300/25"><ArrowRight size={16}/></span><span>العودة لإدارة الشقق</span></button></div>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-amber-300/40 bg-amber-300/10 text-amber-300"><Building2 size={34}/></div>
        <h1 className="mt-3 text-3xl font-black text-amber-300 sm:text-4xl">خريطة الشقق</h1>
        <p className="mt-2 text-sm font-semibold text-emerald-100/65">إدارة الشقق السكنية وعرض حالتها وتوزيعها حسب العمائر</p>
      </header>
      <section className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5 lg:p-6">
        {stats.map(s => <button key={s.label} type="button" onClick={() => setFilter(s.kind)} className={`relative rounded-[20px] border p-4 text-right shadow-lg transition hover:-translate-y-0.5 ${filter===s.kind ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-white/[.045]"}`}><div className="flex items-start justify-between gap-2"><div><p className="text-xs font-bold text-gray-300 sm:text-sm">{s.label}</p><p className={`mt-2 text-3xl font-black ${s.color}`}>{s.value}</p><p className="mt-1 text-[11px] text-emerald-100/45">{s.kind === "rented" ? `نسبة الإشغال ${units.length ? Math.round(s.value / units.length * 100) : 0}%` : "وحدة سكنية"}</p></div><span className={`rounded-xl border border-white/10 bg-white/5 p-2 ${s.color}`}><s.icon size={24}/></span></div></button>)}
      </section>
      <section className="grid grid-cols-1 gap-3 px-4 pb-5 md:grid-cols-[minmax(0,1fr)_200px_170px_auto] lg:px-6">
        <div className="relative"><Search size={19} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-200/60"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث برقم الشقة أو اسم العمارة أو الموقع..." className="h-14 w-full rounded-xl border border-white/15 bg-[#05271f] pr-11 pl-3 text-sm text-white outline-none focus:border-amber-300"/></div>
        <select aria-label="العمارة" value={buildingFilter} onChange={e=>setBuildingFilter(e.target.value)} className="h-14 min-w-0 rounded-xl border border-white/15 bg-[#05271f] px-3 text-sm text-white"><option value="الكل">جميع العمائر</option>{buildings.map(b=><option key={b} value={b}>{b}</option>)}</select>
        <select aria-label="حالة الشقة" value={filter} onChange={e=>setFilter(e.target.value)} className="h-14 rounded-xl border border-white/15 bg-[#05271f] px-3 text-sm text-white"><option value="الكل">جميع الحالات</option><option value="vacant">شاغرة</option><option value="rented">مؤجرة</option><option value="reserved">محجوزة</option><option value="maintenance">تحت الصيانة</option><option value="other">حالات أخرى</option></select>
        <button type="button" onClick={()=>void loadUnits()} disabled={loading} className="flex h-14 items-center justify-center gap-2 rounded-xl border border-sky-400/40 bg-sky-400/10 px-5 font-bold text-sky-200 hover:bg-sky-400/20 disabled:opacity-50"><RefreshCw size={20} className={loading ? "animate-spin" : ""}/>تحديث</button>
      </section>
      {error && <div role="alert" className="mx-4 mb-4 rounded-xl border border-red-400/50 bg-red-950/40 p-4 text-red-200">{error}</div>}
      <section className="space-y-4 px-4 pb-6 lg:px-6"><h2 className="text-center text-xl font-black text-white">توزيع الشقق حسب العمائر</h2><p className="text-center text-xs text-emerald-100/50">كل مربع يمثل شقة واحدة — اضغط عليه لعرض التفاصيل</p>
        {loading ? <p className="py-12 text-center text-emerald-100">جارٍ تحميل الشقق...</p> : grouped.length===0 ? <p className="rounded-2xl border border-white/10 bg-white/5 py-14 text-center text-emerald-100/70">لا توجد شقق مطابقة للبحث أو التصفية.</p> : grouped.map(g=><div key={g.name} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#06271f]/80 p-2 sm:flex-row"><div className="flex min-h-[66px] shrink-0 items-center justify-center gap-3 rounded-xl border border-sky-400/20 bg-[#123e40] px-5 text-center sm:w-44 sm:flex-col sm:gap-1"><Building2 className="text-sky-200" size={24}/><strong className="text-sm">{g.name}</strong><span className="text-xs text-emerald-100/50">{g.list.length} شقة</span></div><div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 xl:grid-cols-11">{g.list.map(u=><button key={u.id} type="button" onClick={()=>void openDetails(u)} className={`flex min-h-[67px] min-w-0 flex-col items-center justify-center rounded-xl border px-1 py-2 text-center text-white shadow-md transition hover:-translate-y-0.5 ${statusStyles[statusKind(u.apartment_status)]}`}><strong className="max-w-full break-all text-sm font-black">{u.apartment_number}</strong><span className="mt-1 max-w-full truncate text-[10px]">{u.apartment_type || u.apartment_status}</span></button>)}</div></div>)}
        <div className="flex flex-wrap items-center justify-center gap-3 border-t border-white/10 pt-4 text-[11px]">{[["vacant","شاغرة"],["rented","مؤجرة"],["reserved","محجوزة"],["maintenance","تحت الصيانة"],["other","غير محدد"]].map(([k,label])=><span key={k} className="flex items-center gap-2"><i className={`h-3 w-3 rounded-full ${k==="vacant"?"bg-emerald-500":k==="rented"?"bg-red-500":k==="reserved"?"bg-blue-500":k==="maintenance"?"bg-amber-500":"bg-slate-500"}`}/>{label}</span>)}</div>
      </section>
    </div>
    {selected && <ResidentialApartmentDetailsModal unit={selected} companyId={COMPANY_ID} onUnitUpdated={patch => { setSelected(previous => previous ? { ...previous, ...patch } : previous); setUnits(previous => previous.map(row => row.id === selected.id ? { ...row, ...patch } : row)); }} onClose={() => setSelected(null)} />}
  </div>;
}
