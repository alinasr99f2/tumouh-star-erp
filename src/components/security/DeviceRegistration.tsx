
import { useCallback, useEffect, useState } from "react";
import { Fingerprint, Laptop, RefreshCw, ShieldCheck } from "lucide-react";

import { getActiveTenant } from "../../utils/tenantSession";
import {
  getMyTenantDevices,
  requestTenantDevice,
  type TenantDevice,
} from "../../services/webauthn";

const DEVICE_KEY = "aqary_staging_device_key";

const statusLabels: Record<TenantDevice["device_status"], string> = {
  pending: "بانتظار الموافقة",
  approved: "معتمد",
  blocked: "محظور",
  revoked: "ملغى",
};

async function getCurrentDeviceHash(): Promise<string | null> {
  const key = localStorage.getItem(DEVICE_KEY);
  if (!key) return null;

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(key),
  );

  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export default function DeviceRegistration() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [devices, setDevices] = useState<TenantDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadDevices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const tenant = await getActiveTenant();

      if (!tenant) {
        setTenantId(null);
        setDevices([]);
        return;
      }

      setTenantId(tenant.tenantId);

      const result = await getMyTenantDevices(tenant.tenantId);
      setDevices(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "تعذر تحميل الأجهزة.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDevices();

    window.addEventListener("aqary:tenant-changed", loadDevices);

    return () => {
      window.removeEventListener(
        "aqary:tenant-changed",
        loadDevices,
      );
    };
  }, [loadDevices]);

  const handleRequestDevice = async () => {
    if (!tenantId || submitting) return;

    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const deviceId = await requestTenantDevice(
        tenantId,
        "Staging Browser Test - Current PC",
      );

      setMessage(
        `تم إرسال طلب تسجيل الجهاز بنجاح. رقم الطلب: ${deviceId}`,
      );

      await loadDevices();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "فشل إرسال طلب تسجيل الجهاز.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      dir="rtl"
      className="mx-auto w-full max-w-3xl rounded-2xl border border-amber-500/30 bg-emerald-950 p-6 text-white shadow-xl"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-amber-400/10 p-3 text-amber-400">
          <ShieldCheck size={28} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-amber-300">
            إدارة الأجهزة الآمنة
          </h2>
          <p className="text-sm text-emerald-100/70">
            AQARY SMART — Device Security
          </p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleRequestDevice()}
          disabled={loading || submitting || !tenantId}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 font-bold text-emerald-950 disabled:opacity-50"
        >
          <Laptop size={18} />
          {submitting ? "جاري إرسال الطلب..." : "طلب تسجيل هذا الجهاز"}
        </button>

        <button
          type="button"
          onClick={() => void loadDevices()}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-emerald-500 px-4 py-2 text-emerald-100 disabled:opacity-50"
        >
          <RefreshCw size={18} />
          تحديث الحالات
        </button>
      </div>

      {message && (
        <p className="mb-4 rounded-lg bg-emerald-800 p-3 text-sm">
          {message}
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-950/60 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {loading ? (
          <p className="text-emerald-100/70">جاري تحميل الأجهزة...</p>
        ) : devices.length === 0 ? (
          <p className="rounded-lg border border-emerald-700 p-4 text-sm text-emerald-100/70">
            لا توجد أجهزة مسجلة لهذا المستخدم في الشركة الحالية.
          </p>
        ) : (
          devices.map((device) => (
            <div
              key={device.device_id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-700 bg-emerald-900/60 p-4"
            >
              <div>
                <p className="font-semibold">
                  {device.device_name || "جهاز بدون اسم"}
                </p>
                <p className="mt-1 text-xs text-emerald-100/60">
                  {device.device_type || "غير محدد"}
                </p>
                <p className="mt-1 text-xs text-emerald-100/60">
                  {statusLabels[device.device_status]}
                </p>
              </div>

              {device.device_status === "approved" && (
                <div className="flex items-center gap-2 text-sm text-amber-300">
                  <Fingerprint size={19} />
                  جاهز لمرحلة Passkey
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <p className="mt-5 text-xs text-emerald-100/50">
        لا يتم تفعيل الجهاز إلا بعد موافقة مسؤول المنصة.
        تسجيل Passkey سيتم تفعيله بعد اختبار ربط الجهاز بالمتصفح.
      </p>
    </section>
  );
}
