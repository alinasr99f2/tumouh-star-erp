import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../utils/supabase";
import {
  Activity,
  CalendarDays,
  ChevronDown,
  Clock3,
  Download,
  FileText,
  Layers3,
  Monitor,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  User,
  Users,
  Edit3,
  LogIn,
  LogOut,
  Eye,
  Upload,
  ShieldCheck,
} from "lucide-react";

import "./ActivityLog.css";

type ActivityType =
  | "login"
  | "session_expired"
  | "add"
  | "edit"
  | "delete"
  | "view"
  | "upload"
  | "permission"
  | "other";

interface ActivityItem {
  id: number;
  userId: string;
  avatarUrl: string;
  user: string;
  role: string;
  type: ActivityType;
  section: string;
  details: string;
  date: string;
  time: string;
  ip: string;
  createdAt: string;
}

const typeConfig: Record<
  ActivityType,
  {
    label: string;
    icon: typeof LogIn;
    className: string;
  }
> = {
  other: { label: "عملية", icon: Activity, className: "activity-view" },
  login: {
    label: "تسجيل دخول",
    icon: LogIn,
    className: "activity-login",
  },
  session_expired: {
    label: "انتهاء جلسة",
    icon: LogOut,
    className: "activity-delete",
  },
  add: {
    label: "إضافة",
    icon: Plus,
    className: "activity-add",
  },
  edit: {
    label: "تعديل",
    icon: Edit3,
    className: "activity-edit",
  },
  delete: {
    label: "حذف",
    icon: Trash2,
    className: "activity-delete",
  },
  view: {
    label: "عرض",
    icon: Eye,
    className: "activity-view",
  },
  upload: {
    label: "رفع ملف",
    icon: Upload,
    className: "activity-upload",
  },
  permission: {
    label: "صلاحيات",
    icon: ShieldCheck,
    className: "activity-permission",
  },
};

function UserAvatar({ name, url }: { name: string; url: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => { setImageFailed(false); }, [url]);
  return (
    <div className="user-avatar" style={{ overflow: "hidden", position: "relative" }}>
      {url && !imageFailed ? (
        <img
          src={url}
          alt={`صورة ${name}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: "inherit" }}
        />
      ) : name.charAt(0)}
    </div>
  );
}

function ActivityLog() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const loadActivities = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    const { data, error } = await supabase.from("activity_logs")
      .select("id, user_id, user_name, user_role, action_type, section, details, ip_address, created_at")
      .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(1000);
    if (error) {
      setErrorMessage(`تعذر تحميل سجل النشاط: ${error.message}`);
      setActivities([]);
    } else {
      const formatter = new Intl.DateTimeFormat("ar-SA", { dateStyle: "short", timeZone: "Asia/Riyadh" });
      const timeFormatter = new Intl.DateTimeFormat("ar-SA", { timeStyle: "short", timeZone: "Asia/Riyadh" });
      // Fetch current profile pictures by auth_user_id; keep the activity log usable
      // even if the separate profile query is unavailable.
      const avatarByUserId = new Map<string, string>();
      const actorIds = Array.from(new Set((data ?? []).map((row) => String(row.user_id ?? "")).filter(Boolean)));
      if (actorIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from("users")
          .select("auth_user_id, avatar_url")
          .in("auth_user_id", actorIds);
        if (!profileError) {
          for (const profile of profiles ?? []) {
            if (profile.auth_user_id && profile.avatar_url) {
              avatarByUserId.set(String(profile.auth_user_id), String(profile.avatar_url));
            }
          }
        }
      }
      setActivities((data ?? []).map((row, index) => {
        const timestamp = String(row.created_at ?? "");
        const date = new Date(timestamp);
        const validDate = !Number.isNaN(date.getTime());
        const rawType = String(row.action_type ?? "other");
        const knownTypes = ["login", "session_expired", "add", "edit", "delete", "view", "upload", "permission"];
        const normalizedType = ["session_end", "session_timeout", "session_expiry", "auto_logout"].includes(rawType) ? "session_expired" : rawType;
        return {
          id: Number(row.id) || index + 1,
          userId: String(row.user_id ?? ""),
          avatarUrl: avatarByUserId.get(String(row.user_id ?? "")) ?? "",
          user: String(row.user_name ?? "غير معروف"),
          role: String(row.user_role ?? ""),
          type: (knownTypes.includes(normalizedType) ? normalizedType : "other") as ActivityType,
          section: String(row.section ?? "النظام"),
          details: String(row.details ?? ""),
          date: validDate ? formatter.format(date) : "—",
          time: validDate ? timeFormatter.format(date) : "—",
          ip: String(row.ip_address ?? "—"),
          createdAt: timestamp,
        };
      }));
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    void loadActivities();
    // Refresh recent activity automatically while the page is open.
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadActivities();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [loadActivities]);
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");

  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      const searchMatch =
        !search ||
        item.user.includes(search) ||
        item.details.includes(search) ||
        item.section.includes(search) ||
        item.ip.includes(search);

      const sectionMatch =
        sectionFilter === "all" || item.section === sectionFilter;

      const typeMatch =
        typeFilter === "all" || item.type === typeFilter;

      const userMatch =
        userFilter === "all" || item.user === userFilter;

      const day = item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" }) : "";
      const dateMatch = (!fromDate || day >= fromDate) && (!toDate || day <= toDate);
      return searchMatch && sectionMatch && typeMatch && userMatch && dateMatch;
    });
  }, [activities, search, sectionFilter, typeFilter, userFilter, fromDate, toDate]);

  const exportCSV = () => {
    const headers = [
      "#",
      "المستخدم",
      "نوع العملية",
      "القسم",
      "التفاصيل",
      "التاريخ",
      "الوقت",
      "الجهاز / IP",
    ];

    const rows = filteredActivities.map((item, index) => [
      index + 1,
      item.user,
      typeConfig[item.type].label,
      item.section,
      item.details,
      item.date,
      item.time,
      item.ip,
    ]);

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "activity-log.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearch("");
    setSectionFilter("all");
    setTypeFilter("all");
    setUserFilter("all");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="activity-page" dir="rtl">

      {/* =========================================
          HEADER
      ========================================= */}
      <section className="activity-hero">

        <div className="activity-hero-overlay" />

        <div className="activity-hero-content">

          <div className="activity-hero-text">

            <div className="erp-badge">
              AQARY SMART ERP
            </div>

            <h1>
              سجل النظام
            </h1>

            <p>
              متابعة جميع العمليات والحركات التي تتم داخل النظام
            </p>

          </div>

          <div className="activity-hero-icon">
            <FileText size={42} strokeWidth={1.7} />
          </div>

        </div>

      </section>


      {/* =========================================
          STATISTICS
      ========================================= */}
      <section className="activity-stats">

        <div className="stat-card stat-total">
          <div className="stat-icon">
            <FileText />
          </div>

          <div className="stat-info">
            <span>إجمالي العمليات</span>
            <strong>{activities.length.toLocaleString("ar-SA")}</strong>
          </div>
        </div>


        <div className="stat-card stat-today">
          <div className="stat-icon">
            <CalendarDays />
          </div>

          <div className="stat-info">
            <span>عمليات اليوم</span>
            <strong>{activities.filter((a) => a.createdAt && new Date(a.createdAt).toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" }) === new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" })).length}</strong>
          </div>
        </div>


        <div className="stat-card stat-users">
          <div className="stat-icon">
            <Users />
          </div>

          <div className="stat-info">
            <span>المستخدمون النشطون</span>
            <strong>{new Set(activities.map((a) => a.user)).size}</strong>
          </div>
        </div>


        <div className="stat-card stat-last">
          <div className="stat-icon">
            <Clock3 />
          </div>

          <div className="stat-info">
            <span>آخر عملية</span>
            <strong>{activities[0]?.time ?? "لا توجد عمليات"}</strong>
          </div>
        </div>

      </section>


      {/* =========================================
          FILTERS
      ========================================= */}
      <section className="activity-filters">

        <div className="filter-search">

          <label>
            البحث في السجل
          </label>

          <div className="search-box">

            <Search size={18} />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المستخدم أو التفاصيل..."
            />

          </div>

        </div>


        <div className="filter-item">

          <label>
            الفترة الزمنية
          </label>

          <div className="date-range">

            <input aria-label="من تاريخ" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />

            <span>إلى</span>

            <input aria-label="من تاريخ" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />

          </div>

        </div>


        <div className="filter-item">

          <label>
            القسم
          </label>

          <div className="select-box">

            <Layers3 size={16} />

            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
            >
              <option value="all">كل الأقسام</option>
              {Array.from(new Set(activities.map((a) => a.section))).sort().map((section) => <option key={section} value={section}>{section}</option>)}
              {/* dynamically populated */}
            </select>

            <ChevronDown size={15} />

          </div>

        </div>


        <div className="filter-item">

          <label>
            نوع العملية
          </label>

          <div className="select-box">

            <Activity size={16} />

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">كل العمليات</option>
              <option value="login">تسجيل دخول</option>
              <option value="session_expired">انتهاء جلسة</option>
              <option value="add">إضافة</option>
              <option value="edit">تعديل</option>
              <option value="delete">حذف</option>
              <option value="view">عرض</option>
              <option value="upload">رفع ملف</option>
              <option value="permission">صلاحيات</option>
            </select>

            <ChevronDown size={15} />

          </div>

        </div>


        <div className="filter-item">

          <label>
            المستخدم
          </label>

          <div className="select-box">

            <User size={16} />

            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            >
              <option value="all">كل المستخدمين</option>
              {Array.from(new Set(activities.map((a) => a.user))).sort().map((name) => <option key={name} value={name}>{name}</option>)}
            </select>

            <ChevronDown size={15} />

          </div>

        </div>


        <button
          className="reset-button"
          onClick={resetFilters}
        >
          <RefreshCw size={17} />
          إعادة تعيين
        </button>

      </section>


      {/* =========================================
          ACTIVITY TABLE
      ========================================= */}
      <section className="activity-table-card">

        <div className="table-header">

          <div>

            <div className="table-title">

              <Clock3 size={22} />

              <div>
                <h2>
                  آخر الحركات المسجلة
                </h2>

                <p>
                  جميع الأنشطة والعمليات التي تمت داخل النظام
                </p>
              </div>

            </div>

          </div>


          <div className="table-actions">

            <button
              className="refresh-button"
              onClick={() => void loadActivities()}
            >
              <RefreshCw size={16} />
              تحديث
            </button>

            <button
              className="export-button"
              onClick={exportCSV}
            >
              <Download size={16} />
              تصدير CSV
            </button>

          </div>

        </div>


        <div className="activity-table-wrapper">

          {errorMessage && <p role="alert" style={{ color: "#fca5a5", padding: 16 }}>{errorMessage}</p>}
          {loading && <p style={{ padding: 16 }}>جاري تحميل السجل...</p>}
          <table className="activity-table">

            <thead>
              <tr>

                <th>#</th>

                <th>
                  التاريخ والوقت
                </th>

                <th>
                  المستخدم
                </th>

                <th>
                  نوع العملية
                </th>

                <th>
                  القسم
                </th>

                <th>
                  التفاصيل
                </th>

                <th>
                  الجهاز / IP
                </th>

                <th>
                  تفاصيل
                </th>

              </tr>
            </thead>


            <tbody>

              {filteredActivities.map((item, index) => {

                const config = typeConfig[item.type];
                const Icon = config.icon;

                return (
                  <tr key={item.id}>

                    <td className="row-number">
                      {index + 1}
                    </td>


                    <td className="date-cell">

                      <strong>
                        {item.date}
                      </strong>

                      <span>
                        {item.time}
                      </span>

                    </td>


                    <td>

                      <div className="user-cell">

                        <UserAvatar name={item.user} url={item.avatarUrl} />

                        <div>
                          <strong>
                            {item.user}
                          </strong>

                          <span>
                            {item.role}
                          </span>
                        </div>

                      </div>

                    </td>


                    <td>

                      <span
                        className={`activity-badge ${config.className}`}
                      >
                        <Icon size={14} />
                        {config.label}
                      </span>

                    </td>


                    <td>

                      <span className="section-name">
                        {item.section}
                      </span>

                    </td>


                    <td className="details-cell">
                      {item.details}
                    </td>


                    <td>

                      <div className="ip-cell">

                        <Monitor size={15} />

                        <span>
                          {item.ip}
                        </span>

                      </div>

                    </td>


                    <td>

                      <button
                        className="more-button"
                        title="عرض التفاصيل"
                        onClick={() => window.alert(`${item.user} — ${item.section}\n${item.details}\n${item.date} ${item.time}`)}
                      >
                        ...
                      </button>

                    </td>

                  </tr>
                );

              })}

            </tbody>

          </table>


          {filteredActivities.length === 0 && (
            <div className="empty-activity">
              <Activity size={42} />
              <h3>لا توجد عمليات</h3>
              <p>
                لم يتم العثور على حركات مطابقة للبحث الحالي.
              </p>
            </div>
          )}

        </div>

      </section>

    </div>
  );
}

export default ActivityLog;