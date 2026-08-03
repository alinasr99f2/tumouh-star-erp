import {
  Plus,
  Receipt,
  FileText,
  Building2,
  Users,
  Wallet,
} from "lucide-react";

export default function DashboardHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-l from-[#163B63] via-[#102947] to-[#081B33] p-8">

      {/* Background Glow */}

      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl" />

      <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10">

        <div className="flex items-start justify-between">

          {/* Right */}

          <div>

            <span className="rounded-full bg-yellow-400/20 px-4 py-1 text-sm text-yellow-400">
              Tumouh Star ERP
            </span>

            <h1 className="mt-5 text-4xl font-bold text-white">
              صباح الخير، علي 👋
            </h1>

            <p className="mt-3 max-w-2xl text-lg text-gray-300">
              مرحبًا بك في نظام إدارة شركة طموح ستار، يمكنك متابعة المشاريع،
              الإيرادات، المصروفات، والاستثمارات من مكان واحد.
            </p>

            <div className="mt-8 flex gap-3">

              <button className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 font-bold text-[#081B33] transition hover:bg-yellow-500">

                <Plus size={18} />

                مشروع جديد

              </button>

              <button className="flex items-center gap-2 rounded-xl border border-blue-400/20 bg-[#183C66] px-6 py-3 transition hover:bg-[#224C7E]">

                <Receipt size={18} />

                إضافة مصروف

              </button>

              <button className="flex items-center gap-2 rounded-xl border border-blue-400/20 bg-[#183C66] px-6 py-3 transition hover:bg-[#224C7E]">

                <FileText size={18} />

                إنشاء تقرير

              </button>

            </div>

          </div>

          {/* Left */}

          <div className="grid grid-cols-2 gap-5">

            <HeroCard
              icon={<Building2 size={28} />}
              title="المشاريع"
              value="12"
            />

            <HeroCard
              icon={<Wallet size={28} />}
              title="الأصول"
              value="18.4M"
            />

            <HeroCard
              icon={<Users size={28} />}
              title="الموظفين"
              value="47"
            />

            <HeroCard
              icon={<Building2 size={28} />}
              title="العقارات"
              value="62"
            />

          </div>

        </div>

      </div>

    </section>
  );
}

type HeroCardProps = {
  icon: React.ReactNode;
  title: string;
  value: string;
};

function HeroCard({
  icon,
  title,
  value,
}: HeroCardProps) {
  return (
    <div className="w-48 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">

      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 text-[#081B33]">

        {icon}

      </div>

      <p className="text-sm text-gray-400">
        {title}
      </p>

      <h2 className="mt-2 text-3xl font-bold text-white">
        {value}
      </h2>

    </div>
  );
}