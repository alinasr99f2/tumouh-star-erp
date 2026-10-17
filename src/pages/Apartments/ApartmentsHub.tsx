import { useState } from "react";
import {
  ArrowLeft, ArrowRight, Building2, LayoutGrid, BedDouble,
  House, Store, MapPinned, X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const sections = [
  { title: "الشقق المتاحة / المؤجرة", description: "إدارة الشقق والعقود وبيانات المستأجرين ومتابعة حالة كل شقة", icon: LayoutGrid, path: "/apartments" },
  { title: "الغرف", description: "إدارة الغرف ومتابعة الإشغال والإيجارات", icon: BedDouble },
  { title: "المنازل", description: "إدارة المنازل وبيانات العقود والمستأجرين", icon: House },
  { title: "المحلات التجارية", description: "إدارة المحلات التجارية ومتابعة عقود الإيجار", icon: Store },
  { title: "الأراضي العقارية", description: "إدارة الأراضي العقارية ومتابعة بياناتها", icon: MapPinned },
] as const;

export default function ApartmentsHub() {
  const navigate = useNavigate();
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  return (
    <main dir="rtl" className="relative min-h-full w-full overflow-hidden bg-[#05291F] px-4 py-8 text-white sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.10),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035]">
        <img src="/aqary-smart-logo.png" alt="" className="h-[380px] w-[380px] object-contain" />
      </div>
      <div className="relative z-10 flex w-full flex-col items-center">
        <div className="mb-5 flex w-full max-w-6xl justify-start">
          <button type="button" onClick={() => navigate("/home")} className="inline-flex items-center gap-2 rounded-xl border border-amber-300/40 bg-[#0B4939] px-4 py-2 text-sm font-bold text-amber-200 transition hover:bg-[#145342]">
            <ArrowRight size={18} /> العودة للشاشة الرئيسية
          </button>
        </div>
        <header className="mb-8 flex w-full flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-300/50 bg-[#0B4939] shadow-[0_0_35px_rgba(212,175,55,0.10)]">
            <Building2 size={44} className="text-amber-300" strokeWidth={1.6} />
          </div>
          <h1 className="max-w-4xl text-center text-2xl font-extrabold leading-relaxed text-amber-300 sm:text-3xl lg:text-4xl">
            إدارة الوحدات العقارية المؤجرة والفارغة
          </h1>
          <p className="mt-2 text-center text-sm text-emerald-100/75 sm:text-base">
            إدارة مختلف أنواع الوحدات العقارية ومتابعة الإشغال والعقود والمستأجرين
          </p>
        </header>

        <div className="mx-auto flex w-full max-w-[1060px] flex-wrap items-stretch justify-center gap-5" dir="rtl">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.title}
                type="button"
                onClick={() => { if ("path" in section) navigate(section.path); else setComingSoon(section.title); }}
                className="group flex min-h-[235px] w-full flex-col items-center justify-center sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] rounded-[28px] border border-amber-300/55 bg-gradient-to-br from-[#145342] via-[#0B4939] to-[#05291F] p-6 text-center shadow-[0_18px_55px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_25px_65px_rgba(212,175,55,0.13)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
              >
                <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-300/40 bg-amber-300/10">
                  <Icon size={45} strokeWidth={1.6} className="text-amber-300" />
                </span>
                <span className="text-xl font-extrabold text-white sm:text-2xl">{section.title}</span>
                <span className="mt-3 min-h-[44px] max-w-sm text-sm leading-6 text-emerald-100/80">{section.description}</span>
                <span className="mt-5 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-amber-300/60 bg-amber-300/10 px-5 py-2.5 font-bold text-amber-200 transition group-hover:bg-amber-300/20">
                  الدخول إلى القسم <ArrowLeft size={20} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {comingSoon && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={() => setComingSoon(null)}>
          <div role="dialog" aria-modal="true" aria-label="القسم قيد التجهيز" onClick={(event) => event.stopPropagation()} className="relative w-full max-w-md rounded-3xl border border-amber-300/60 bg-[#073B30] p-8 text-center shadow-2xl">
            <button type="button" onClick={() => setComingSoon(null)} aria-label="إغلاق" className="absolute left-4 top-4 text-amber-200"><X size={22} /></button>
            <Building2 size={45} className="mx-auto mb-4 text-amber-300" />
            <h2 className="text-2xl font-extrabold text-amber-300">{comingSoon}</h2>
            <p className="mt-3 text-emerald-100">القسم قيد التجهيز حاليًا، ولم يتم إنشاء صفحة الإدارة الخاصة به بعد.</p>
            <button type="button" onClick={() => setComingSoon(null)} className="mt-6 rounded-xl border border-amber-300/60 bg-amber-300/10 px-8 py-2 font-bold text-amber-200">حسنًا</button>
          </div>
        </div>
      )}
    </main>
  );
}
