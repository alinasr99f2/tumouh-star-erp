import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, WalletCards, Landmark, Coins, Calculator, CalendarDays, FileText, ClipboardList, ShieldCheck, CheckCircle2, ChevronDown, Hash, Banknote, ReceiptText } from "lucide-react";
import { supabase } from "../../utils/supabase";

type Account = { id: number; name: string; balance?: number | null; currentBalance?: number | null };
type Props = { projectId: number; accounts: Account[]; onClose: () => void; onSaved: () => Promise<unknown> | void };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const money = (n: number) => n.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AccountSettlementModal({ projectId, accounts, onClose, onSaved }: Props) {
  const [accountId, setAccountId] = useState("");
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const account = useMemo(() => accounts.find(a => String(a.id) === accountId), [accounts, accountId]);
  const available = accountId ? balances[accountId] : undefined;
  const amountValue = Number(amount);
  const remaining = available === undefined ? undefined : available - (Number.isFinite(amountValue) && amountValue > 0 ? amountValue : 0);
  const amountValid = /^\d+(\.\d{1,2})?$/.test(amount.trim()) && Number.isFinite(amountValue) && amountValue > 0;
  const displayMoney = (n: number | undefined) => n === undefined ? "—" : money(n);
  const inputClass = "block h-12 w-full rounded-xl border border-[#277966] bg-[#064638] px-4 text-[15px] font-semibold text-white outline-none transition placeholder:text-[#9FC5B9] focus:border-[#EBC55A] focus:ring-2 focus:ring-[#EBC55A]/20 disabled:opacity-60";
  useEffect(() => {
    if (!accountId) return;
    let alive = true;
    setReading(true);
    setError("");
    supabase.from("accounts").select("id,balance").eq("id", Number(accountId)).single().then(({data,error}) => {
      if (!alive) return;
      setReading(false);
      if (error || !data) { setError(`تعذر قراءة رصيد العهدة: ${error?.message ?? "العهدة غير موجودة"}`); return; }
      setBalances(prev => ({ ...prev, [accountId]: Number(data.balance ?? 0) }));
    });
    return () => { alive = false; };
  }, [accountId]);
  const fillBalance = () => { if (available !== undefined) setAmount(String(Math.max(0, available))); };
  const save = async () => {
    if (loading) return;
    const value = Number(amount);
    if (!accountId) { setError("اختر العهدة أولًا."); return; }
    if (!Number.isFinite(value) || value <= 0 || !/^\d+(\.\d{1,2})?$/.test(amount.trim())) { setError("أدخل مبلغًا صحيحًا أكبر من صفر وبحد أقصى منزلتين عشريتين."); return; }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { setError("اختر تاريخ الصرف."); return; }
    if (!description.trim()) { setError("اكتب بيان التسوية لتوثيق سبب الصرف."); return; }
    if (available === undefined || reading) { setError("انتظر تحميل رصيد العهدة."); return; }
    if (value > available + 0.001) { setError(`الرصيد المتاح ${money(available)} ريال، وهو أقل من مبلغ التسوية.`); return; }
    if (!window.confirm(`تأكيد تسوية عهدة «${account?.name ?? ""}» بمبلغ ${money(value)} ريال؟\nستُضاف كمصروف فعلي للمشروع.`)) return;
    setLoading(true); setError("");
    // Unique idempotency key: retries of the same request cannot create duplicate expenses.
    const requestId = crypto.randomUUID();
    const { error: rpcError } = await supabase.rpc("settle_project_account_expense", {
      p_project_id: projectId, p_account_id: Number(accountId), p_amount: value,
      p_expense_date: date, p_description: description.trim(), p_reference: reference.trim() || null,
      p_request_id: requestId,
    });
    setLoading(false);
    if (rpcError) { setError(`تعذر اعتماد التسوية: ${rpcError.message}`); return; }
    await onSaved();
    onClose();
  };
  return createPortal(
    <div dir="rtl" className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#001A16]/85 p-3 backdrop-blur-md sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="settlement-title" className="flex max-h-[94dvh] w-full max-w-[1120px] flex-col overflow-hidden rounded-[24px] border border-[#16755F] bg-[#002E26] text-white shadow-[0_30px_100px_rgba(0,0,0,.75)]">
        {/* Header */}
        <div className="relative flex shrink-0 items-center justify-between gap-4 overflow-hidden border-b border-[#1D755F] bg-gradient-to-l from-[#00382D] via-[#064E3D] to-[#0B4639] px-5 py-5 sm:px-8">
          <div className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #D9B94C33 0, transparent 55%)" }} />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#E5C153]/40 bg-[#0B604C] text-[#F5CE62]"><WalletCards size={31}/></div>
            <div><h2 id="settlement-title" className="text-[24px] font-black leading-tight tracking-tight text-white sm:text-[29px]">تسوية عهدة مالية</h2><p className="mt-1 text-[13px] font-medium text-[#D0E5DD] sm:text-[15px]">إثبات مبلغ تم صرفه فعليًا على المشروع وإضافته إلى تكلفة المشروع</p></div>
          </div>
          <button type="button" aria-label="إغلاق" onClick={onClose} disabled={loading} className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#3C9880] bg-[#00372E] text-white transition hover:border-red-300 hover:bg-red-600/20 disabled:opacity-50"><X size={22}/></button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6">
          {/* Account */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-[#1E705D] pb-3"><span className="flex h-9 w-10 items-center justify-center rounded-lg border border-[#D5B44D]/60 bg-[#D5B44D]/10 text-[15px] font-black text-[#F6D36B]">01</span><div><h3 className="text-[19px] font-extrabold text-[#F6D36B]">اختيار العهدة</h3><p className="text-[13px] text-[#C6DCD3]">الحساب المالي المراد التسوية منه</p></div><Landmark size={22} className="mr-auto text-[#F6D36B]"/></div>
            <div className="relative">
              <select id="settlement-account" aria-label="الحساب المالي المراد التسوية منه" value={accountId} disabled={loading} onChange={(e) => { setAccountId(e.target.value); setAmount(""); }} className="h-14 w-full appearance-none rounded-xl border border-[#E5C153] bg-[#034536] px-5 pl-14 text-[17px] font-bold text-white outline-none transition focus:ring-2 focus:ring-[#E5C153]/30 disabled:opacity-60">
                <option value="">اختر العهدة المالية</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <ChevronDown size={23} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#F6D36B]"/>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="relative overflow-hidden rounded-2xl border border-[#19856D] bg-gradient-to-l from-[#064F3F] to-[#003A30] p-5"><Coins className="absolute left-5 top-5 text-[#64E3BC]/55" size={32}/><p className="text-[14px] font-semibold text-[#CDE6DB]">الرصيد المتاح للتسوية</p><p dir="ltr" className="mt-2 text-right text-[27px] font-black tabular-nums text-[#5EF0BC]">{reading ? "جاري التحقق..." : displayMoney(available)}</p><p className="text-[13px] text-[#CDE6DB]">ريال سعودي</p></div>
              <div className="relative overflow-hidden rounded-2xl border border-[#8D7A37]/65 bg-gradient-to-l from-[#283D2F] to-[#143A30] p-5"><Calculator className="absolute left-5 top-5 text-[#EBC55A]/65" size={32}/><p className="text-[14px] font-semibold text-[#E3DDBD]">الرصيد بعد التسوية</p><p dir="ltr" className={`mt-2 text-right text-[27px] font-black tabular-nums ${remaining !== undefined && remaining < 0 ? "text-red-300" : "text-[#F5D06A]"}`}>{reading ? "—" : displayMoney(remaining)}</p><p className="text-[13px] text-[#E3DDBD]">ريال سعودي</p></div>
            </div>
          </section>

          {/* Amount */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E705D] pb-3"><div className="flex items-center gap-3"><span className="flex h-9 w-10 items-center justify-center rounded-lg border border-[#D5B44D]/60 bg-[#D5B44D]/10 text-[15px] font-black text-[#F6D36B]">02</span><h3 className="text-[19px] font-extrabold text-[#F6D36B]">تفاصيل التسوية</h3></div><button type="button" onClick={fillBalance} disabled={loading || reading || available === undefined || available <= 0} className="inline-flex items-center gap-2 rounded-full border border-[#EBC55A] bg-[#EBC55A]/10 px-4 py-2 text-[13px] font-extrabold text-[#F5D06A] transition hover:bg-[#EBC55A]/20 disabled:cursor-not-allowed disabled:opacity-40"><Coins size={17}/> تسوية كامل الرصيد</button></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="block space-y-2"><span className="flex items-center gap-2 text-[15px] font-bold text-white"><Banknote size={17} className="text-[#EBC55A]"/> مبلغ التسوية</span><div className="relative"><input type="number" min="0.01" step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={loading} placeholder="0.00" className={`${inputClass} pl-16 text-lg tabular-nums`} /><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 rounded-lg bg-[#0E6351] px-2 py-1 text-xs font-bold text-[#E5F5EC]">ريال</span></div></label>
              <label className="block space-y-2"><span className="flex items-center gap-2 text-[15px] font-bold text-white"><CalendarDays size={17} className="text-[#EBC55A]"/> تاريخ الصرف</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={loading} className={inputClass} style={{ colorScheme: "dark" }}/></label>
              <label className="block space-y-2"><span className="flex items-center gap-2 text-[15px] font-bold text-white"><Hash size={17} className="text-[#EBC55A]"/> رقم المرجع / السند <span className="text-xs font-normal text-[#A9C8BC]">(اختياري)</span></span><input value={reference} onChange={(e) => setReference(e.target.value)} disabled={loading} placeholder="مثال: SET-2026-001" className={inputClass}/></label>
            </div>
          </section>

          {/* Documentation */}
          <section className="space-y-3"><div className="flex items-center gap-3 border-b border-[#1E705D] pb-3"><span className="flex h-9 w-10 items-center justify-center rounded-lg border border-[#D5B44D]/60 bg-[#D5B44D]/10 text-[15px] font-black text-[#F6D36B]">03</span><h3 className="text-[19px] font-extrabold text-[#F6D36B]">توثيق العملية</h3><FileText size={22} className="mr-auto text-[#F6D36B]"/></div><label className="block space-y-2"><span className="text-[15px] font-bold text-white">بيان الصرف</span><textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} disabled={loading} placeholder="مثال: تسوية دفعة المقاول مقابل الأعمال المنفذة في المشروع..." className="block min-h-[100px] w-full resize-y rounded-xl border border-[#27846D] bg-[#034536] p-4 text-[15px] leading-7 font-medium text-white outline-none placeholder:text-[#A9C8BC] focus:border-[#EBC55A] focus:ring-2 focus:ring-[#EBC55A]/20"/></label></section>

          {/* Summary */}
          <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-[#4A8D73] bg-[#064638] lg:grid-cols-[1fr_2fr]">
            <div className="flex items-center gap-4 border-b border-[#4A8D73] p-5 lg:border-b-0 lg:border-l"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#D5B44D]/50 bg-[#D5B44D]/10 text-[#F5D06A]"><ClipboardList size={28}/></div><div><h4 className="text-lg font-extrabold text-[#F5D06A]">ملخص العملية</h4><p className="mt-1 text-[13px] leading-6 text-[#C6DCD3]">سيُسجل المبلغ كمصروف فعلي للمشروع، ويُخصم من رصيد العهدة المختارة.</p></div></div>
            <div className="divide-y divide-[#2D6C58] px-5 py-3"><div className="flex items-center justify-between gap-3 py-2"><span className="flex items-center gap-2 text-[14px] font-semibold text-white"><ReceiptText size={17} className="text-[#6EE7B7]"/> المبلغ المضاف لتكلفة المشروع</span><strong dir="ltr" className="text-[16px] tabular-nums text-[#F5D06A]">{amountValid ? money(amountValue) : "0.00"} ريال</strong></div><div className="flex items-center justify-between gap-3 py-2"><span className="flex items-center gap-2 text-[14px] font-semibold text-white"><Coins size={17} className="text-[#F5D06A]"/> المبلغ المخصوم من العهدة</span><strong dir="ltr" className="text-[16px] tabular-nums text-white">{amountValid ? money(amountValue) : "0.00"} ريال</strong></div><div className="flex items-center justify-between gap-3 py-2"><span className="flex items-center gap-2 text-[14px] font-semibold text-white"><Calculator size={17} className="text-[#F5D06A]"/> الرصيد بعد التسوية</span><strong dir="ltr" className={`text-[16px] tabular-nums ${remaining !== undefined && remaining < 0 ? "text-red-300" : "text-[#62E6B9]"}`}>{displayMoney(remaining)} ريال</strong></div></div>
          </div>
          {error && <div role="alert" className="rounded-xl border border-red-400/50 bg-red-950/50 p-4 text-[14px] font-semibold text-red-100">{error}</div>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#1E705D] bg-[#00372C] px-5 py-4 sm:px-8"><button type="button" disabled={loading} onClick={onClose} className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl border border-[#27846D] bg-[#064638] px-6 py-3 text-[15px] font-bold text-white transition hover:bg-[#0C5C4B] disabled:opacity-50"><X size={18}/> إلغاء</button><button type="button" disabled={loading || reading || !accountId || !amountValid || available === undefined || amountValue > available || !description.trim()} onClick={save} className="inline-flex min-w-[200px] items-center justify-center gap-2 rounded-xl border border-[#F6D36B] bg-gradient-to-b from-[#F6D36B] to-[#DDB348] px-7 py-3 text-[16px] font-black text-[#002E26] shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"><CheckCircle2 size={20}/>{loading ? "جاري الاعتماد..." : "اعتماد التسوية"}</button></div>
      </div>
    </div>, document.body
  );
}
