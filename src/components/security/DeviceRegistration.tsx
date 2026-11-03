import { useCallback, useEffect, useState } from "react";
import { Fingerprint, Laptop, RefreshCw, ShieldCheck } from "lucide-react";

import { getActiveTenant } from "../../utils/tenantSession";
import {
  getMyCurrentTenantDevice,
  getMyTenantDevices,
  requestTenantDevice,
  registerPasskey,
  type CurrentTenantDevice,
  type TenantDevice,
} from "../../services/webauthn";

const statusLabels: Record<TenantDevice["device_status"], string> = {
  pending: "بانتظار الموافقة",
  approved: "معتمد",
  blocked: "محظور",
  revoked: "ملغى",
};

export default function DeviceRegistration() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [devices, setDevices] = useState<TenantDevice[]>([]);
  const [currentDevice, setCurrentDevice] = useState<CurrentTenantDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadDevices = useCallback(async () => {
    setLoading(true);
    setError("");
    setCurrentDevice(null);
    setDevices([]);
    setTenantId(null);

    try {
      const tenant = await getActiveTenant();
      if (!tenant) return;

      const [result, matchingDevice] = await Promise.all([
        getMyTenantDevices(tenant.tenantId),
        getMyCurrentTenantDevice(tenant.tenantId),
      ]);

      setTenantId(tenant.tenantId);
      setDevices(result);
      setCurrentDevice(matchingDevice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل الأجهزة.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDevices();
    const onTenantChanged = () => {
      setMessage("");
      void loadDevices();
    };
    window.addEventListener("aqary:tenant-changed", onTenantChanged);
    return () => window.removeEventListener("aqary:tenant-changed", onTenantChanged);
  }, [loadDevices]);

  const handleRequestDevice = async () => {
    if (!tenantId || submitting || registering || loading || currentDevice) return;
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const deviceId = await requestTenantDevice(
        tenantId,
        "Staging Browser Test - Current PC",
      );
      setMessage(`تم إرسال طلب تسجيل الجهاز. رقم الطلب: ${deviceId}`);
      await loadDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل إرسال طلب تسجيل الجهاز.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterPasskey = async () => {
    if (
      !tenantId || loading || submitting || registering ||
      !currentDevice || currentDevice.device_status !== "approved"
    ) return;

    setRegistering(true);
    setMessage("");
    setError("");
    try {
      const result = await registerPasskey({
        tenantId,
        deviceId: currentDevice.device_id,
      });
      if (result.verified) {
        setMessage("تم التحقق من تسجيل Passkey بنجاح على بيئة Staging.");
      }
      await loadDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تسجيل Passkey.");
    } finally {
      setRegistering(false);
    }
  };

  const isApprovedCurrentDevice = currentDevice?.device_status === "approved";

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
          <h2 className="text-xl font-bold text-amber-300">إدارة الأجهزة الآمنة</h2>
          <p className="text-sm text-emerald-100/70">AQARY SMART — Device Security</p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleRequestDevice()}
          disabled={loading || submitting || registering || !tenantId || !!currentDevice}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 font-bold text-emerald-950 disabled:opacity-50"
        >
          <Laptop size={18} />
          {submitting ? "جاري إرسال الطلب..." : "طلب تسجيل هذا الجهاز"}
        </button>
        <button
          type="button"
          onClick={() => void loadDevices()}
          disabled={loading || submitting || registering}
          className="flex items-center gap-2 rounded-lg border border-emerald-500 px-4 py-2 text-emerald-100 disabled:opacity-50"
        >
          <RefreshCw size={18} />
          تحديث الحالات
        </button>
        {isApprovedCurrentDevice && (
          <button
            type="button"
            onClick={() => void handleRegisterPasskey()}
            disabled={loading || submitting || registering}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-50"
          >
            <Fingerprint size={18} />
            {registering ? "جاري تسجيل Passkey..." : "تسجيل Passkey لهذا الجهاز"}
          </button>
        )}
      </div>

      {!loading && tenantId && (
        <p className="mb-4 rounded-lg border border-emerald-700 bg-emerald-900/50 p-3 text-sm">
          {currentDevice
            ? `المتصفح الحالي مرتبط بالجهاز: ${currentDevice.device_name || "بدون اسم"} — ${statusLabels[currentDevice.device_status]}`
            : "لا يوجد جهاز مطابق لهذا المتصفح ضمن الشركة الحالية. إذا كنت قد مسحت بيانات المتصفح، فقد تحتاج إلى طلب تسجيل جديد."}
        </p>
      )}
      {!loading && !tenantId && !error && (
        <p className="mb-4 text-sm text-amber-200">لا توجد شركة نشطة محددة لهذا الحساب.</p>
      )}
      {message && (
        <p className="mb-4 rounded-lg bg-emerald-800 p-3 text-sm">{message}</p>
      )}
      {error && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-950/60 p-3 text-sm text-red-200">{error}</p>
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
                <p className="font-semibold">{device.device_name || "جهاز بدون اسم"}</p>
                <p className="mt-1 text-xs text-emerald-100/60">{device.device_type || "غير محدد"}</p>
                <p className="mt-1 text-xs text-emerald-100/60">{statusLabels[device.device_status]}</p>
                {currentDevice?.device_id === device.device_id && (
                  <p className="mt-1 text-xs font-semibold text-amber-300">هذا هو المتصفح الحالي</p>
                )}
              </div>
              {device.device_status === "approved" && (
                <div className="flex items-center gap-2 text-sm text-amber-300">
                  <Fingerprint size={19} />
                  {currentDevice?.device_id === device.device_id
                    ? "معتمد — يمكن اختبار تسجيل Passkey"
                    : "جهاز معتمد آخر"}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <p className="mt-5 text-xs text-emerald-100/50">
        لا يتم اعتماد الجهاز إلا بعد موافقة مسؤول المنصة. مطابقة المتصفح هنا تعتمد على مفتاح محلي قابل للنسخ؛
        ولا تعتبر إثباتًا أمنيًا لهوية الجهاز. يجب نجاح تحقق WebAuthn على الخادم لتأكيد تسجيل Passkey.
      </p>
    </section>
  );
}
