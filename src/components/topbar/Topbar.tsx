import {
  Bell,
  CalendarDays,
  Search,
  Moon,
  Sun,
  Palette,
  Check,
  Globe,
  ChevronDown,
  ArrowUpLeft,
  Building2,
  FileText,
  LayoutDashboard,
  Home,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { usePermissions, type PermissionKey } from "../../utils/permissions";

import { supabase } from "../../utils/supabase";
import { useAppPreferences, translateLabel } from "../../utils/appPreferences";

type CurrentUser = {
  name: string;
  role: string;
  avatar_url: string | null;
};

type SearchItem = { title: string; subtitle: string; path: string; keywords?: string; permission?: PermissionKey; group: string; state?: Record<string, unknown> };
const RESIDENTIAL_COMPANY_ID = "61bed49c-bc21-476a-865b-1d28db791ad2";
const searchNormalize = (value: unknown) => String(value ?? "").toLocaleLowerCase().normalize("NFKC").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").trim();
const searchable = (row: Record<string, unknown>) => Object.values(row).filter(value => typeof value === "string" || typeof value === "number").join(" ");

const PAGE_ITEMS: SearchItem[] = [
  { title: "الشاشة الرئيسية", subtitle: "الرئيسية", path: "/home", group: "الصفحات", keywords: "الرئيسية home" },
  { title: "لوحة التحكم", subtitle: "لوحة المؤشرات", path: "/dashboard", permission: "dashboard_view", group: "الصفحات" },
  { title: "المشاريع", subtitle: "إدارة المشاريع", path: "/projects", permission: "projects_view", group: "الصفحات" },
  { title: "مشروع فلل تبوك", subtitle: "تفاصيل المشروع", path: "/projects/1", permission: "projects_view", group: "المشاريع" },
  { title: "المركز المالي للمشاريع", subtitle: "مصروفات وتقارير", path: "/projects/financial", permission: "financial_view", group: "الصفحات" },
  { title: "العمائر", subtitle: "إدارة العمائر", path: "/buildings", permission: "buildings_view", group: "الصفحات" },
  { title: "إدارة الوحدات العقارية", subtitle: "الأقسام العقارية", path: "/apartments-hub", permission: "apartments_view", group: "الصفحات" },
  { title: "الشقق المتاحة والمؤجرة", subtitle: "إدارة الشقق والعقود", path: "/apartments", permission: "apartments_view", group: "الصفحات", keywords: "شقق مستأجر عقود إيجار فواتير تحصيل" },
  { title: "خريطة الشقق السكنية", subtitle: "الوحدات السكنية", path: "/apartments/map", permission: "apartments_view", group: "الصفحات" },
  { title: "سجل النشاط", subtitle: "متابعة العمليات", path: "/activity-log", permission: "activity_logs_view", group: "الصفحات" },
  { title: "تواصل معنا", subtitle: "الدعم والتواصل", path: "/contact-us", group: "الصفحات" },
];

function Topbar() {
  const navigate = useNavigate();
  const { language, theme, setLanguage, setTheme, isEnglish } = useAppPreferences();
  const [preferencesMenu, setPreferencesMenu] = useState<"language" | "theme" | null>(null);
  const preferencesRef = useRef<HTMLDivElement>(null);
  const [preferencesRect, setPreferencesRect] = useState({ top: 80, left: 0, width: 240 });
  const positionPreferences = () => { const rect = preferencesRef.current?.getBoundingClientRect(); if (rect) setPreferencesRect({ top: rect.bottom + 8, left: Math.max(8, rect.left), width: 240 }); };
  const location = useLocation();
  const { loading: permissionsLoading, hasPermission } = usePermissions();
  const searchRef = useRef<HTMLInputElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const [searchText, setSearchText] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchRect, setSearchRect] = useState({ top: 80, left: 0, width: 450 });
  const [buildingItems, setBuildingItems] = useState<SearchItem[]>([]);
  const [recordItems, setRecordItems] = useState<SearchItem[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchError, setSearchError] = useState("");
  const normalize = searchNormalize;
  const results = useMemo(() => {
    const q = normalize(searchText);
    if (!q || permissionsLoading) return [];
    return [...PAGE_ITEMS, ...buildingItems, ...recordItems]
      .filter((item) => !item.permission || hasPermission(item.permission))
      .filter((item) => normalize([item.title, item.subtitle, item.group, item.keywords ?? ""].join(" ")).includes(q))
      .slice(0, 12);
  }, [searchText, buildingItems, recordItems, permissionsLoading, hasPermission]);
  const positionResults = () => {
    const rect = searchBoxRef.current?.getBoundingClientRect();
    if (rect) setSearchRect({ top: rect.bottom + 8, left: rect.left, width: rect.width });
  };
  const closeSearch = () => { setSearchOpen(false); setActiveIndex(0); };
  const openItem = (item: SearchItem) => { closeSearch(); setSearchText(""); navigate(item.path, item.state ? { state: item.state } : undefined); };

  useEffect(() => {
    let cancelled = false;
    void supabase.from("buildings").select("id,name").eq("status", "active").limit(200).then(({ data, error }) => {
      if (cancelled || error) return;
      setBuildingItems((data ?? []).filter((row) => row.id != null && row.name).map((row) => ({
        title: String(row.name), subtitle: `تفاصيل العمارة رقم ${row.id}`, path: `/buildings/${row.id}`,
        permission: "building_details_view" as PermissionKey, group: "العمائر",
      })));
    });
    return () => { cancelled = true; };
  }, []);
  // Debounced, RLS-scoped record search. Never expose records beyond the user's permissions.
  useEffect(() => {
    const q = searchNormalize(searchText);
    if (q.length < 2 || permissionsLoading) { setRecordItems([]); setSearchBusy(false); setSearchError(""); return; }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearchBusy(true); setSearchError("");
      const items: SearchItem[] = [];
      let failed = false;
      const add = (item: SearchItem) => {
        if (searchNormalize([item.title, item.subtitle, item.keywords ?? ""].join(" ")).includes(q)) items.push(item);
      };
      try {
        if (hasPermission("apartments_view")) {
          const [apartmentsResult, contractsResult, tenantsResult, ownersResult] = await Promise.all([
            supabase.from("residential_apartments").select("id,apartment_number,building_name,apartment_type,city,district_street,owner_id").eq("company_id", RESIDENTIAL_COMPANY_ID).limit(400),
            supabase.from("residential_contracts").select("id,contract_number,apartment_id,tenant_id,status").eq("company_id", RESIDENTIAL_COMPANY_ID).limit(400),
            supabase.from("residential_tenants").select("*").eq("company_id", RESIDENTIAL_COMPANY_ID).limit(300),
            supabase.from("property_owners").select("*").eq("company_id", RESIDENTIAL_COMPANY_ID).limit(300),
          ]);
          failed = failed || !!apartmentsResult.error || !!contractsResult.error || !!tenantsResult.error || !!ownersResult.error;
          const aps = (apartmentsResult.data ?? []) as Array<Record<string, unknown>>;
          const tenants = (tenantsResult.data ?? []) as Array<Record<string, unknown>>;
          const owners = (ownersResult.data ?? []) as Array<Record<string, unknown>>;
          const contracts = (contractsResult.data ?? []) as Array<Record<string, unknown>>;
          const nameOf = (row: Record<string, unknown>) => String(row.full_name ?? row.name ?? row.tenant_name ?? row.owner_name ?? row.customer_name ?? row.phone ?? row.mobile ?? row.id ?? "");
          for (const a of aps) {
            const number = String(a.apartment_number ?? "");
            add({ title: `الشقة ${number}`, subtitle: [a.building_name, a.apartment_type, a.city, a.district_street].filter(Boolean).join(" · ") || "إدارة الشقق", path: "/apartments", group: "الشقق", permission: "apartments_view", keywords: searchable(a), state: { globalSearchApartmentId: String(a.id) } });
          }
          for (const c of contracts) {
            const a = aps.find(a => a.id === c.apartment_id);
            const t = tenants.find(t => t.id === c.tenant_id);
            add({ title: `عقد ${String(c.contract_number ?? c.id)}`, subtitle: `الشقة ${String(a?.apartment_number ?? "")} · ${t ? nameOf(t) : "عقد إيجار"}`, path: "/apartments", group: "العقود", permission: "apartments_view", keywords: [searchable(c), a?.apartment_number, t ? searchable(t) : ""].join(" "), state: { globalSearchApartmentId: String(c.apartment_id) } });
          }
          for (const t of tenants) {
            const related = contracts.find(c => c.tenant_id === t.id);
            add({ title: nameOf(t), subtitle: `عميل / مستأجر${related ? ` · عقد ${String(related.contract_number ?? "")}` : ""}`, path: "/apartments", group: "العملاء", permission: "apartments_view", keywords: searchable(t), state: related ? { globalSearchApartmentId: String(related.apartment_id) } : { globalSearchQuery: nameOf(t) } });
          }
          for (const o of owners) {
            const a = aps.find(a => a.owner_id === o.id);
            add({ title: nameOf(o), subtitle: `مالك${a ? ` · الشقة ${String(a.apartment_number ?? "")}` : ""}`, path: "/apartments", group: "الملاك", permission: "apartments_view", keywords: searchable(o), state: a ? { globalSearchApartmentId: String(a.id) } : { globalSearchQuery: nameOf(o) } });
          }
        }
        if (hasPermission("building_details_view") || hasPermission("buildings_view")) {
          const [buildingsResult, statesResult] = await Promise.all([
            supabase.from("buildings").select("id,name").limit(300),
            supabase.from("building_state").select("building_id,apartments,apartment_tenant_info,apartment_contract_info").limit(200),
          ]);
          failed = failed || !!buildingsResult.error || !!statesResult.error;
          const buildings = (buildingsResult.data ?? []) as Array<{ id: number; name: string }>;
          for (const b of buildings) add({ title: b.name, subtitle: `العمارة رقم ${b.id}`, path: `/buildings/${b.id}`, group: "العمائر", permission: "building_details_view", keywords: String(b.id) });
          for (const state of statesResult.data ?? []) {
            const building = buildings.find(b => String(b.id) === String(state.building_id));
            const name = building?.name ?? `عمارة ${state.building_id}`;
            const tenantInfo = (state.apartment_tenant_info ?? {}) as Record<string, Record<string, unknown>>;
            const contractInfo = (state.apartment_contract_info ?? {}) as Record<string, Record<string, unknown>>;
            for (const a of Array.isArray(state.apartments) ? state.apartments : []) {
              const number = String(a.number ?? "");
              const tenant = tenantInfo[number] ?? {};
              const contract = contractInfo[number] ?? {};
              add({ title: `الشقة ${number} · ${name}`, subtitle: [name, String(tenant.tenantName ?? a.tenant ?? ""), String(contract.contractNumber ?? "")].filter(Boolean).join(" · "), path: `/buildings/${state.building_id}/apartments`, group: "شقق العمائر", permission: "building_details_view", keywords: [searchable(a), searchable(tenant), searchable(contract), name, state.building_id].join(" "), state: { globalSearchBuildingApartmentNumber: number } });
            }
          }
        }
        if (!cancelled) { setRecordItems(items.slice(0, 80)); setSearchError(failed ? "بعض أقسام البحث لم تُحمّل. تحقق من صلاحيات الجداول." : ""); }
      } catch { if (!cancelled) { setRecordItems([]); setSearchError("تعذر البحث في بعض البيانات. حاول مرة أخرى."); } }
      finally { if (!cancelled) setSearchBusy(false); }
    }, 350);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [searchText, permissionsLoading, hasPermission]);
  useEffect(() => { closeSearch(); setPreferencesMenu(null); }, [location.pathname]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); searchRef.current?.focus(); positionResults(); setSearchOpen(true);
      } else if (event.key === "Escape") closeSearch();
    };
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!searchBoxRef.current?.contains(target) && !(document.getElementById("aqary-search-results")?.contains(target))) closeSearch();
      if (!preferencesRef.current?.contains(target) && !document.getElementById("aqary-preferences-menu")?.contains(target)) setPreferencesMenu(null);
    };
    const onResize = () => { positionResults(); positionPreferences(); };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, []);

  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    name: "المستخدم",
    role: "موظف",
    avatar_url: null,
  });

  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (authUser?.email) {
          const { data, error } = await supabase
            .from("users")
            .select("name, role, avatar_url")
            .eq("email", authUser.email)
            .maybeSingle();

          if (!error && data) {
            setCurrentUser({
              name: String(data.name ?? "المستخدم"),
              role: String(data.role ?? "موظف"),
              avatar_url: data.avatar_url ? String(data.avatar_url) : null,
            });
            return;
          }
        }

        // احتياطي في حالة عدم العثور على السجل في جدول users.
        const metadata = authUser?.user_metadata;

        setCurrentUser({
          name: String(metadata?.name ?? authUser?.email ?? "المستخدم"),
          role: String(metadata?.role ?? "موظف"),
          avatar_url: null,
        });
      } catch (error) {
        console.error("خطأ في تحميل بيانات المستخدم الحالي:", error);
      }
    };

    const updateDate = () => {
      const now = new Date();

      setCurrentDate(
        now.toLocaleDateString(language === "en" ? "en-GB" : "ar-SA", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      );
    };

    void loadCurrentUser();
    updateDate();

    // تحديث التاريخ تلقائيًا لو ظل البرنامج مفتوحًا حتى اليوم التالي.
    const dateTimer = window.setInterval(updateDate, 60 * 1000);

    return () => {
      mounted = false;
      window.clearInterval(dateTimer);
    };
  }, [language]);

  const userInitial = currentUser.name.trim().charAt(0) || "م";

  return (
    <header
      className="
        flex
        h-16
        min-w-0
        w-full
        items-center
        justify-between
        gap-2
        overflow-hidden
        border-b
        border-white/10
        bg-[#062B24]
        px-3
        sm:h-20
        sm:px-5
        lg:px-8
      "
    >
      {/* Left */}

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <button
          type="button"
          aria-label="الإشعارات"
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-[#0B4034]
            transition
            hover:bg-[#145545]
            sm:h-11
            sm:w-11
          "
        >
          <Bell size={19} />
        </button>

        <div ref={preferencesRef} className="flex items-center gap-2 sm:gap-4">
          <button type="button" aria-label={isEnglish ? "Appearance" : "المظهر"} aria-expanded={preferencesMenu === "theme"}
            onClick={() => { positionPreferences(); setPreferencesMenu(preferencesMenu === "theme" ? null : "theme"); }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B4034] transition hover:bg-[#145545] sm:h-11 sm:w-11">
            {theme === "light" ? <Sun size={18}/> : theme === "dark" ? <Moon size={18}/> : <Palette size={18}/>}
          </button>
          <button type="button" aria-label={isEnglish ? "Language" : "اللغة"} aria-expanded={preferencesMenu === "language"}
            onClick={() => { positionPreferences(); setPreferencesMenu(preferencesMenu === "language" ? null : "language"); }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B4034] transition hover:bg-[#145545] sm:h-11 sm:w-11">
            <Globe size={18}/>
          </button>
        </div>
      </div>

      {preferencesMenu && createPortal(
        <div id="aqary-preferences-menu" dir={isEnglish ? "ltr" : "rtl"}
          style={{ position: "fixed", top: preferencesRect.top, left: Math.min(preferencesRect.left, window.innerWidth - 248), width: preferencesRect.width, zIndex: 10060 }}
          className="rounded-2xl border border-[#C49A3A]/60 bg-[#07352B] p-2 text-white shadow-2xl">
          <div className="border-b border-white/10 px-3 py-2 text-sm font-bold text-[#F6D878]">{preferencesMenu === "language" ? translateLabel("اللغة", language) : translateLabel("المظهر", language)}</div>
          {(preferencesMenu === "language"
            ? [{ value: "ar", title: "العربية", detail: "RTL" }, { value: "en", title: "English", detail: "LTR" }]
            : [{ value: "default", title: translateLabel("الأساسي", language), detail: "AQARY SMART" }, { value: "light", title: translateLabel("الصباحي", language), detail: "☀" }, { value: "dark", title: translateLabel("الليلي", language), detail: "☾" }]
          ).map(option => (
            <button key={option.value} type="button"
              onClick={() => { if (preferencesMenu === "language") setLanguage(option.value as "ar" | "en"); else setTheme(option.value as "default" | "light" | "dark"); setPreferencesMenu(null); }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm transition hover:bg-[#145545]">
              <span>{option.title}</span><span className="flex items-center gap-2 text-xs text-[#F6D878]">{option.detail}{(preferencesMenu === "language" ? language : theme) === option.value && <Check size={16}/>}</span>
            </button>
          ))}
        </div>, document.body
      )}

      {/* Center */}

      <div
        className="
          flex
          min-w-0
          flex-1
          justify-center
          px-2
          sm:px-4
        "
      >
        <div ref={searchBoxRef} className="relative hidden w-full max-w-[450px] sm:block">
          <Search
            size={18}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-200/70"
          />

          <input
            ref={searchRef}
            type="text"
            value={searchText}
            onChange={(event) => { setSearchText(event.target.value); setActiveIndex(0); positionResults(); setSearchOpen(true); }}
            onFocus={() => { positionResults(); setSearchOpen(true); }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((i) => Math.min(i + 1, results.length - 1)); }
              if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((i) => Math.max(0, i - 1)); }
              if (event.key === "Enter" && results[activeIndex]) { event.preventDefault(); openItem(results[activeIndex]); }
            }}
            autoComplete="off"
            aria-label={isEnglish ? "Global search" : "البحث المركزي داخل النظام"}
            placeholder={isEnglish ? "Search apartments, buildings, contracts... Ctrl + K" : "ابحث عن شقة، عمارة، عقد، عميل، مالك... Ctrl + K"}
            className="
              h-11
              w-full
              rounded-2xl
              border
              border-white/10
              bg-[#0B4034]
              pl-4
              pr-12
              text-white
              outline-none
              placeholder:text-emerald-100/50
              transition
              focus:border-yellow-400
              sm:h-12
            "
          />
        </div>
      </div>

      {searchOpen && searchText.trim() && createPortal(
        <div id="aqary-search-results" dir="rtl" role="listbox"
          style={{ position: "fixed", top: searchRect.top, left: searchRect.left, width: searchRect.width, zIndex: 10050, maxHeight: "min(440px, 65vh)" }}
          className="overflow-y-auto rounded-2xl border border-[#C49A3A]/70 bg-[#07352B] p-2 text-white shadow-[0_18px_50px_rgba(0,0,0,.65)]">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-emerald-100/70">
            <span>{translateLabel("نتائج البحث المركزي", language)} ({results.length}){searchBusy ? (isEnglish ? " · Searching..." : " · جاري البحث...") : ""}</span>
            <button type="button" aria-label="إغلاق النتائج" onClick={closeSearch} className="rounded-lg p-1 hover:bg-white/10"><X size={16}/></button>
          </div>
          {searchError && <div className="px-3 py-2 text-xs text-amber-200">{searchError}</div>}
          {results.length ? results.map((item, index) => (
            <button type="button" role="option" aria-selected={index === activeIndex} key={`${item.path}-${index}`}
              onMouseEnter={() => setActiveIndex(index)} onClick={() => openItem(item)}
              className={`my-1 flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-right transition ${index === activeIndex ? "border-[#C49A3A]/70 bg-[#145545]" : "border-transparent hover:bg-[#145545]"}`}>
              {["العمائر", "شقق العمائر", "الشقق"].includes(item.group) ? <Building2 size={19} className="text-[#F6D878]"/> : item.group === "المشاريع" ? <FileText size={19} className="text-[#F6D878]"/> : <LayoutDashboard size={19} className="text-[#F6D878]"/>}
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{translateLabel(item.title, language)}</span><span className="block truncate text-xs text-emerald-100/60">{translateLabel(item.group, language)} · {translateLabel(item.subtitle, language)}</span></span>
              <ArrowUpLeft size={16} className="text-emerald-100/60"/>
            </button>
          )) : <div className="px-3 py-6 text-center text-sm text-emerald-100/80">{translateLabel("لا توجد نتائج مطابقة", language)}</div>}
          <div className="border-t border-white/10 px-3 py-2 text-[11px] text-emerald-100/50">{isEnglish ? "↑ ↓ Navigate · Enter Open · Esc Close" : "↑ ↓ للتنقل · Enter للفتح · Esc للإغلاق"}</div>
        </div>, document.body
      )}

      {/* Right */}

      <div
        className="
          flex
          shrink-0
          items-center
          gap-2
          sm:gap-5
        "
      >
        <div className="hidden text-left sm:block">
          <h3 className="font-semibold">
            {currentUser.name}
          </h3>

          <p className="text-xs text-emerald-200/70">
            {translateLabel(currentUser.role, language)}
          </p>
        </div>

        <div
          className="
            h-10
            w-10
            shrink-0
            overflow-hidden
            rounded-full
            border-2
            border-[#F6D878]/70
            bg-gradient-to-br
            from-yellow-400
            to-yellow-600
            shadow-lg
            sm:h-12
            sm:w-12
          "
        >
          {currentUser.avatar_url ? (
            <img
              src={currentUser.avatar_url}
              alt={currentUser.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#062B24] sm:text-base">
              {userInitial}
            </div>
          )}
        </div>

        <ChevronDown
          size={18}
          className="hidden text-emerald-200/70 sm:block"
        />

        <div
          className="
            hidden
            items-center
            gap-2
            text-emerald-100/80
            sm:flex
            sm:mr-2
            lg:mr-6
          "
        >
          <CalendarDays size={18} />

          <span className="whitespace-nowrap text-sm">
            {currentDate}
          </span>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
