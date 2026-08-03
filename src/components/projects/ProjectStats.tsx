import {
  Building2,
  Hammer,
  CheckCircle2,
  PauseCircle,
} from "lucide-react";

type Props = {
  total: number;
  active: number;
  completed: number;
  stopped: number;
};

export default function ProjectStats({
  total,
  active,
  completed,
  stopped,
}: Props) {
  const stats = [
    {
      title: "إجمالي المشاريع",
      value: total,
      icon: Building2,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "قيد التنفيذ",
      value: active,
      icon: Hammer,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
    {
      title: "مكتمل",
      value: completed,
      icon: CheckCircle2,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      title: "متوقف",
      value: stopped,
      icon: PauseCircle,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="rounded-2xl border border-white/10 bg-[#081B33] p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">
                  {item.title}
                </p>

                <h2 className="mt-2 text-3xl font-bold text-white">
                  {item.value}
                </h2>
              </div>

              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.bg}`}
              >
                <Icon
                  size={28}
                  className={item.color}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}