import {
  Building2,
  Wallet,
  TrendingUp,
  CircleDollarSign,
} from "lucide-react";

const stats = [
  {
    title: "إجمالي المشاريع",
    value: "0",
    icon: Building2,
    color: "bg-blue-500",
  },
  {
    title: "إجمالي الأصول",
    value: "0",
    icon: Wallet,
    color: "bg-violet-500",
  },
  {
    title: "الإيرادات",
    value: "0",
    icon: TrendingUp,
    color: "bg-green-500",
  },
  {
    title: "المصروفات",
    value: "0",
    icon: CircleDollarSign,
    color: "bg-red-500",
  },
];

export default function StatsCards() {
  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">

      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="
              group
              rounded-3xl
              border
              border-white/10
              bg-[#081B33]
              p-6
              transition-all
              duration-300
              hover:-translate-y-2
              hover:border-yellow-400/40
            "
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
                className={`
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                  rounded-2xl
                  ${item.color}
                  shadow-lg
                  transition-transform
                  duration-300
                  group-hover:scale-110
                `}
              >
                <Icon
                  size={30}
                  className="text-white"
                />
              </div>

            </div>

            <div className="mt-6">

              <span className="text-xs text-gray-500">
                لا توجد بيانات حتى الآن
              </span>

            </div>

          </div>
        );
      })}

    </section>
  );
}