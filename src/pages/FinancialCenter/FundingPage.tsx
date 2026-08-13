import { useCallback, useEffect, useMemo, useState } from "react";
import { Paperclip, RefreshCw } from "lucide-react";
import { supabase } from "../../utils/supabase";

type FundingPageProps = {
  onAddFunding: () => void;
};

type FundingRow = {
  id: number;
  account_id: number | null;
  amount: number | string | null;
  funding_date?: string | null;
  created_at?: string | null;

  source?: string | null;
  payment_method?: string | null;
  method?: string | null;

  description?: string | null;
  notes?: string | null;

  reference_number?: string | null;
  reference?: string | null;
  ref_number?: string | null;
  voucher_number?: string | null;

  attachments?: unknown;
  attachment?: unknown;
  files?: unknown;
  file_url?: string | null;
  receipt_url?: string | null;
};

type AccountRow = {
  id: number;
  name: string;
};

const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDateOnly = (value?: string | null) => {
  if (!value) return null;

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) return null;

  const [, year, month, day] = match;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";

  const parsed = parseDateOnly(value);

  if (parsed) {
    return parsed.toLocaleDateString("ar-SA");
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("ar-SA");
};

const getPaymentMethod = (item: FundingRow) => {
  const value =
    item.payment_method ??
    item.method ??
    item.source ??
    "";

  switch (String(value).toLowerCase()) {
    case "cash":
      return "نقدًا";

    case "bank":
      return "تحويل بنكي";

    case "card":
      return "بطاقة";

    default:
      return value || "-";
  }
};

const getReferenceNumber = (item: FundingRow) => {
  const directReference =
    item.reference_number ??
    item.reference ??
    item.ref_number ??
    item.voucher_number;

  if (directReference !== undefined && directReference !== null) {
    return String(directReference);
  }

  const description = String(item.description ?? "");

  const match = description.match(
    /رقم المرجع\s*:\s*([^-\n]+)/i
  );

  if (match?.[1]) {
    return match[1].trim();
  }

  return "-";
};

const getCleanDescription = (item: FundingRow) => {
  const raw = String(
    item.description ??
    item.notes ??
    ""
  ).trim();

  if (!raw) {
    return "-";
  }

  return raw
    .replace(/رقم المرجع\s*:\s*[^-\n]+(?:\s*-\s*)?/i, "")
    .trim() || "-";
};

const getAttachments = (item: FundingRow) => {
  const raw =
    item.attachments ??
    item.attachment ??
    item.files ??
    item.file_url ??
    item.receipt_url;

  if (!raw) {
    return [];
  }

  if (Array.isArray(raw)) {
    return raw.filter(Boolean);
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }

      if (parsed) {
        return [parsed];
      }
    } catch {
      return raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [raw];
};

const getAttachmentUrl = (attachment: unknown) => {
  if (!attachment) return "";

  if (typeof attachment === "string") {
    return attachment;
  }

  if (typeof attachment === "object") {
    const value = attachment as Record<string, unknown>;

    return String(
      value.url ??
      value.path ??
      value.file_url ??
      value.publicUrl ??
      ""
    );
  }

  return "";
};

export default function FundingPage({
  onAddFunding,
}: FundingPageProps) {
  const [funding, setFunding] = useState<FundingRow[]>([]);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [
        { data: fundingData, error: fundingError },
        { data: accountsData, error: accountsError },
      ] = await Promise.all([
        supabase
          .from("funding")
          .select("*")
          .not("account_id", "is", null)
          .order("funding_date", {
            ascending: false,
          })
          .order("id", {
            ascending: false,
          }),

        supabase
          .from("accounts")
          .select("id, name")
          .order("id", {
            ascending: true,
          }),
      ]);

      if (fundingError) {
        console.error(
          "خطأ في تحميل عمليات التغذية:",
          fundingError
        );
        return;
      }

      if (accountsError) {
        console.error(
          "خطأ في تحميل العهد:",
          accountsError
        );
        return;
      }

      setFunding(
        (fundingData ?? []) as FundingRow[]
      );

      setAccounts(
        (accountsData ?? []) as AccountRow[]
      );
    } catch (error) {
      console.error(
        "خطأ غير متوقع أثناء تحميل صفحة التغذية:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const interval = window.setInterval(() => {
      loadData();
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadData]);

  const accountNameMap = useMemo(() => {
    const map = new Map<number, string>();

    accounts.forEach((account) => {
      map.set(
        Number(account.id),
        account.name
      );
    });

    return map;
  }, [accounts]);

  const today = useMemo(() => {
    const now = new Date();

    now.setHours(0, 0, 0, 0);

    return now;
  }, []);

  const todayString = getLocalDateString(today);

  const weekStart = useMemo(() => {
    const date = new Date(today);

    date.setDate(
      date.getDate() - 6
    );

    date.setHours(0, 0, 0, 0);

    return date;
  }, [today]);

  const monthStart = useMemo(() => {
    return new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );
  }, [today]);

  const monthEnd = useMemo(() => {
    return new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    );
  }, [today]);

  const totalFunding = useMemo(() => {
    return funding.reduce(
      (sum, item) =>
        sum + Number(item.amount ?? 0),
      0
    );
  }, [funding]);

  const todayFunding = useMemo(() => {
    return funding.reduce(
      (sum, item) => {
        const date = parseDateOnly(
          item.funding_date
        );

        if (!date) {
          return sum;
        }

        if (
          getLocalDateString(date) ===
          todayString
        ) {
          return (
            sum +
            Number(item.amount ?? 0)
          );
        }

        return sum;
      },
      0
    );
  }, [funding, todayString]);

  const weekFunding = useMemo(() => {
    return funding.reduce(
      (sum, item) => {
        const date = parseDateOnly(
          item.funding_date
        );

        if (!date) {
          return sum;
        }

        date.setHours(0, 0, 0, 0);

        if (
          date >= weekStart &&
          date <= today
        ) {
          return (
            sum +
            Number(item.amount ?? 0)
          );
        }

        return sum;
      },
      0
    );
  }, [
    funding,
    weekStart,
    today,
  ]);

  const monthFunding = useMemo(() => {
    return funding.reduce(
      (sum, item) => {
        const date = parseDateOnly(
          item.funding_date
        );

        if (!date) {
          return sum;
        }

        date.setHours(0, 0, 0, 0);

        if (
          date >= monthStart &&
          date <= monthEnd
        ) {
          return (
            sum +
            Number(item.amount ?? 0)
          );
        }

        return sum;
      },
      0
    );
  }, [
    funding,
    monthStart,
    monthEnd,
  ]);

  return (
    <div
      dir="rtl"
      className="space-y-6"
    >

      {/* ================= Header ================= */}

      <div className="flex items-center justify-between gap-4">

        <div>

          <h2 className="text-3xl font-bold text-white">
            التغذية المالية
          </h2>

          <p className="mt-2 text-gray-400">
            جميع عمليات تغذية الحسابات والعهد.
          </p>

        </div>

        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              border
              border-white/10
              bg-[#102947]
              text-gray-300
              transition
              hover:border-cyan-400/40
              hover:text-cyan-400
              disabled:opacity-50
            "
            title="تحديث"
          >
            <RefreshCw
              size={20}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
          </button>

          <button
            type="button"
            onClick={onAddFunding}
            className="
              flex
              items-center
              gap-2
              rounded-2xl
              bg-gradient-to-r
              from-sky-400
              to-cyan-500
              px-7
              py-3
              font-bold
              text-[#081B33]
              shadow-lg
              shadow-cyan-500/20
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-xl
              hover:shadow-cyan-500/30
            "
          >
            <span className="text-xl">
              ＋
            </span>

            إضافة تغذية مالية
          </button>

        </div>

      </div>

      {/* ================= Statistics ================= */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">

        {/* اليوم */}

        <div
          className="
            rounded-2xl
            border
            border-sky-400/20
            bg-[#081B33]
            p-6
            shadow-lg
            shadow-sky-500/5
          "
        >

          <p className="text-gray-400">
            تغذية اليوم
          </p>

          <h2 className="mt-3 text-3xl font-bold text-sky-400">
            {formatMoney(todayFunding)} ريال
          </h2>

          <p className="mt-2 text-xs text-gray-500">
            {formatDate(todayString)}
          </p>

        </div>

        {/* الأسبوع */}

        <div
          className="
            rounded-2xl
            border
            border-violet-400/20
            bg-[#081B33]
            p-6
            shadow-lg
            shadow-violet-500/5
          "
        >

          <p className="text-gray-400">
            تغذية الأسبوع
          </p>

          <h2 className="mt-3 text-3xl font-bold text-violet-400">
            {formatMoney(weekFunding)} ريال
          </h2>

          <p className="mt-2 text-xs text-gray-500">
            من {formatDate(getLocalDateString(weekStart))}
            {" "}
            إلى{" "}
            {formatDate(todayString)}
          </p>

        </div>

        {/* الشهر */}

        <div
          className="
            rounded-2xl
            border
            border-amber-400/20
            bg-[#081B33]
            p-6
            shadow-lg
            shadow-amber-500/5
          "
        >

          <p className="text-gray-400">
            تغذية الشهر
          </p>

          <h2 className="mt-3 text-3xl font-bold text-amber-400">
            {formatMoney(monthFunding)} ريال
          </h2>

          <p className="mt-2 text-xs text-gray-500">
            من {formatDate(getLocalDateString(monthStart))}
            {" "}
            إلى{" "}
            {formatDate(getLocalDateString(monthEnd))}
          </p>

        </div>

        {/* الإجمالي */}

        <div
          className="
            rounded-2xl
            border
            border-green-400/20
            bg-[#081B33]
            p-6
            shadow-lg
            shadow-green-500/5
          "
        >

          <p className="text-gray-400">
            إجمالي التغذية
          </p>

          <h2 className="mt-3 text-3xl font-bold text-green-400">
            {formatMoney(totalFunding)} ريال
          </h2>

          <p className="mt-2 text-xs text-gray-500">
            إجمالي جميع عمليات التغذية
          </p>

        </div>

      </div>

      {/* ================= Table ================= */}

      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-white/10
          bg-[#081B33]
        "
      >

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-white/10
            bg-[#102947]
            px-5
            py-4
          "
        >

          <div>

            <h3 className="font-bold text-white">
              سجل عمليات التغذية
            </h3>

            <p className="mt-1 text-xs text-gray-400">
              جميع حركات التغذية المرتبطة بالعهد
            </p>

          </div>

          <div
            className="
              rounded-xl
              bg-cyan-500/10
              px-3
              py-2
              text-xs
              font-bold
              text-cyan-400
            "
          >
            {funding.length} عملية
          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="min-w-[1200px] w-full text-sm">

            <thead className="bg-[#102947]">

              <tr className="border-t border-white/10">

                <th className="whitespace-nowrap px-4 py-4 text-right text-gray-300">
                  تاريخ الإدخال
                </th>

                <th className="whitespace-nowrap px-4 py-4 text-right text-gray-300">
                  تاريخ التغذية
                </th>

                <th className="whitespace-nowrap px-4 py-4 text-right text-gray-300">
                  العهدة
                </th>

                <th className="whitespace-nowrap px-4 py-4 text-right text-gray-300">
                  رقم المرجع
                </th>

                <th className="whitespace-nowrap px-4 py-4 text-right text-gray-300">
                  مبلغ التغذية
                </th>

                <th className="whitespace-nowrap px-4 py-4 text-right text-gray-300">
                  طريقة الدفع
                </th>

                <th className="whitespace-nowrap px-4 py-4 text-right text-gray-300">
                  الوصف
                </th>

                <th className="whitespace-nowrap px-4 py-4 text-center text-gray-300">
                  المرفقات
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-white/10">

              {loading ? (

                <tr>

                  <td
                    colSpan={8}
                    className="
                      py-20
                      text-center
                      text-gray-400
                    "
                  >
                    جاري تحميل عمليات التغذية...
                  </td>

                </tr>

              ) : funding.length === 0 ? (

                <tr>

                  <td
                    colSpan={8}
                    className="
                      py-20
                      text-center
                      text-gray-500
                    "
                  >
                    لا توجد عمليات تغذية حتى الآن
                  </td>

                </tr>

              ) : (

                funding.map((item) => {

                  const attachments =
                    getAttachments(item);

                  const firstAttachment =
                    attachments[0];

                  const attachmentUrl =
                    getAttachmentUrl(
                      firstAttachment
                    );

                  return (

                    <tr
                      key={item.id}
                      className="
                        bg-[#081B33]
                        transition
                        hover:bg-[#102947]/60
                      "
                    >

                      <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                        {formatDate(
                          item.created_at
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-white">
                        {formatDate(
                          item.funding_date
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-bold text-cyan-300">
                        {accountNameMap.get(
                          Number(
                            item.account_id
                          )
                        ) ?? "-"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                        {getReferenceNumber(
                          item
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-extrabold text-green-400">
                        {formatMoney(
                          Number(
                            item.amount ?? 0
                          )
                        )}{" "}
                        ريال
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                        {getPaymentMethod(
                          item
                        )}
                      </td>

                      <td className="max-w-[320px] px-4 py-4 text-gray-300">
                        <div className="truncate">
                          {getCleanDescription(
                            item
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center">

                        {attachmentUrl ? (

                          <a
                            href={attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="
                              inline-flex
                              items-center
                              gap-2
                              rounded-lg
                              border
                              border-sky-400/20
                              bg-sky-500/10
                              px-3
                              py-2
                              text-xs
                              font-bold
                              text-sky-400
                              transition
                              hover:border-sky-400
                              hover:bg-sky-500
                              hover:text-white
                            "
                            title="عرض المرفق"
                          >
                            <Paperclip size={15} />
                            عرض
                          </a>

                        ) : (

                          <span
                            className="
                              text-xs
                              text-gray-600
                            "
                          >
                            -
                          </span>

                        )}

                      </td>

                    </tr>

                  );
                })

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}