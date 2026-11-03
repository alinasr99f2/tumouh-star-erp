
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Users,
  BadgeCheck,
  CalendarClock,
  MonitorSmartphone,
  Plus,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  LogOut,
} from "lucide-react";

import {
  verifyPlatformOwner,
  getPlatformTenants,
  type PlatformTenant,
} from "../../services/platformAdmin";

export default function PlatformDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);

  async function loadDashboard() {
    setError("");

    try {
      const allowed = await verifyPlatformOwner();
      setAuthorized(allowed);

      if (!allowed) {
        setTenants([]);
        return;
      }

      const result = await getPlatformTenants();
      setTenants(result);
    } catch (err) {
      setAuthorized(false);
      setTenants([]);
      setError(
        err instanceof Error
          ? err.message
          : "تعذر تحميل بيانات لوحة الإدارة"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e5e9e5",
    borderRadius: 18,
    padding: 22,
    boxShadow: "0 5px 20px rgba(0,0,0,0.035)",
  };

  if (loading) {
    return (
      <div dir="rtl" style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f3f6f2",
        color: "#174a36",
      }}>
        <div style={{ textAlign: "center" }}>
          <RefreshCw className="animate-spin mx-auto mb-3" size={30} />
          <p>جاري التحقق من صلاحيات مسؤول المنصة...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div dir="rtl" style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f3f6f2",
        padding: 24,
      }}>
        <div style={{
          ...cardStyle,
          maxWidth: 450,
          width: "100%",
          textAlign: "center",
        }}>
          <ShieldCheck
            size={46}
            color="#a67c32"
            style={{ margin: "0 auto 16px" }}
          />
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>
            لوحة إدارة المنصة
          </h2>
          <p style={{ color: "#64746b", marginTop: 12 }}>
            {error || "ليس لديك تصريح للدخول إلى لوحة الإدارة المركزية."}
          </p>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "#174a36",
              color: "white",
              padding: "12px 24px",
              borderRadius: 10,
              marginTop: 22,
              cursor: "pointer",
            }}
          >
            العودة للنظام الرئيسي
          </button>
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: "إجمالي العملاء",
      value: String(tenants.length),
      icon: Building2,
      color: "#174a36",
    },
    {
      label: "الاشتراكات النشطة",
      value: "—",
      icon: BadgeCheck,
      color: "#278459",
    },
    {
      label: "اشتراكات تنتهي قريبًا",
      value: "—",
      icon: CalendarClock,
      color: "#bc8a35",
    },
    {
      label: "الأجهزة المعتمدة",
      value: "—",
      icon: MonitorSmartphone,
      color: "#547b93",
    },
  ];

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#f3f6f2",
        color: "#193b2e",
        fontFamily: "inherit",
      }}
    >
      <header style={{
        background: "#103d2d",
        color: "white",
        padding: "18px 5%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 14,
      }}>
        <div>
          <h1 style={{
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: 1,
          }}>
            AQARY SMART
          </h1>
          <p style={{ color: "#d5bb7b", fontSize: 13 }}>
            الإدارة المركزية للمنصة
          </p>
        </div>

        <button
          onClick={() => navigate("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#f2e6c9",
            cursor: "pointer",
          }}
        >
          <LogOut size={18} />
          العودة للنظام الرئيسي
        </button>
      </header>

      <main style={{
        maxWidth: 1450,
        margin: "0 auto",
        padding: "32px 5%",
      }}>
        <section style={{
          background:
            "linear-gradient(115deg, #103d2d, #24694b)",
          color: "white",
          borderRadius: 22,
          padding: "36px 32px",
          marginBottom: 28,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 24,
        }}>
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              color: "#e2c98d",
              marginBottom: 12,
            }}>
              <ShieldCheck size={20} />
              <span>لوحة مسؤول المنصة</span>
            </div>

            <h2 style={{
              fontSize: "clamp(22px, 3vw, 32px)",
              fontWeight: 800,
            }}>
              مرحبًا بك في لوحة إدارة عقاري سمارت
            </h2>

            <p style={{
              color: "#d6e4db",
              marginTop: 12,
              maxWidth: 650,
            }}>
              إدارة العملاء والاشتراكات والأجهزة ومتابعة
              أداء المنصة من مكان واحد.
            </p>
          </div>

          <button
            onClick={() => navigate("/platform-admin/clients/new")}
            style={{
              background: "#d7b66e",
              color: "#183a2b",
              borderRadius: 12,
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: 9,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            <Plus size={19} />
            إضافة عميل جديد
          </button>
        </section>

        <div style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 18,
          marginBottom: 28,
        }}>
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div key={card.label} style={cardStyle}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div style={{
                    background: "#f1f5f0",
                    borderRadius: 12,
                    padding: 12,
                    color: card.color,
                  }}>
                    <Icon size={23} />
                  </div>
                </div>

                <div style={{
                  fontSize: 34,
                  fontWeight: 900,
                  marginTop: 18,
                }}>
                  {card.value}
                </div>

                <p style={{
                  color: "#728078",
                  fontSize: 14,
                  marginTop: 5,
                }}>
                  {card.label}
                </p>
              </div>
            );
          })}
        </div>

        <section style={cardStyle}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 15,
            marginBottom: 24,
          }}>
            <div>
              <h3 style={{
                fontSize: 20,
                fontWeight: 800,
              }}>
                العملاء المسجلون
              </h3>
              <p style={{
                color: "#79877f",
                fontSize: 13,
                marginTop: 5,
              }}>
                البيانات المعروضة من قاعدة المنصة
              </p>
            </div>

            <button
              disabled={refreshing}
              onClick={() => {
                setRefreshing(true);
                void loadDashboard();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#174a36",
                cursor: "pointer",
              }}
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              تحديث البيانات
            </button>
          </div>

          {tenants.length === 0 ? (
            <p style={{
              padding: 30,
              textAlign: "center",
              color: "#7b8980",
            }}>
              لا يوجد عملاء متاحون للعرض حاليًا.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "right",
              }}>
                <thead>
                  <tr style={{
                    background: "#edf3ed",
                    color: "#426450",
                  }}>
                    <th style={{ padding: 15 }}>اسم العميل</th>
                    <th style={{ padding: 15 }}>معرف العميل</th>
                    <th style={{ padding: 15 }}>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr
                      key={tenant.tenant_id}
                      style={{ borderBottom: "1px solid #edf0ed" }}
                    >
                      <td style={{
                        padding: 15,
                        fontWeight: 700,
                      }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 9,
                        }}>
                          <Users size={17} color="#278459" />
                          {tenant.tenant_name}
                        </span>
                      </td>

                      <td style={{
                        padding: 15,
                        fontSize: 12,
                        color: "#7b8980",
                        direction: "ltr",
                        textAlign: "right",
                      }}>
                        {tenant.tenant_id}
                      </td>

                      <td style={{ padding: 15 }}>
                        <button
                          onClick={() =>
                            navigate("/platform-admin/clients")
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            color: "#a17a32",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          عرض العملاء
                          <ArrowLeft size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
