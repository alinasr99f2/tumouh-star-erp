import {
  Building2,
  Wallet,
  TrendingUp,
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const stats = [
  {
    title: "إجمالي المشاريع",
    value: "12",
    change: "+18%",
    positive: true,
    icon: Building2,
    color: "bg-blue-500",
  },
  {
    title: "إجمالي الأصول",
    value: "18.4M",
    change: "+9%",
    positive: true,
    icon: Wallet,
    color: "bg-violet-500",
  },
  {
    title: "الإيرادات",
    value: "4.86M",
    change: "+13%",
    positive: true,
    icon: TrendingUp,
    color: "bg-green-500",
  },
  {
    title: "المصروفات",
    value: "1.42M",
    change: "-4%",
    positive: false,
    icon: CircleDollarSign,
    color: "bg-red-500",
  },
];

export default function StatsCards() {
  return (
    <section className="grid gap-6 lg:grid-cols-4 md:grid-cols-2">

      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="group rounded-3xl border border-white/10 bg-[#081B33] p-6 transition-all duration-300 hover:-translate-y-2 hover:border-yellow-400/40"
          >
            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm text-gray-400">
                  {item.title}
                </p>

                <h2 className="mt-4 text-4xl font-bold text-white">
                  {item.value}
                </h2>

              </div>

              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl ${item.color} shadow-lg transition-transform duration-300 group-hover:scale-110`}
              >
                <Icon size={30} className="text-white" />
              </div>

            </div>

            <div className="mt-6 flex items-center justify-between">

              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
                  item.positive
                    ? "bg-green-500/15 text-green-400"
                    : "bg-red-500/15 text-red-400"
                }`}
              >
                {item.positive ? (
                  <ArrowUpRight size={16} />
                ) : (
                  <ArrowDownRight size={16} />
                )}

                {item.change}
              </div>

              <span className="text-xs text-gray-500">
                مقارنة بالشهر الماضي
              </span>

            </div>

          </div>
        );
      })}

    </section>
  );
}