import {
  Building2,
  Users,
  Wallet,
} from "lucide-react";

export default function DashboardHero() {
  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-3xl
        border
        border-white/10
        bg-[#081B33]
        p-8
      "
    >

      {/* Background Glow */}

      <div
        className="
          absolute
          -left-20
          -top-20
          h-72
          w-72
          rounded-full
          bg-yellow-400/10
          blur-3xl
        "
      />

      <div
        className="
          absolute
          -bottom-20
          -right-20
          h-72
          w-72
          rounded-full
          bg-blue-500/10
          blur-3xl
        "
      />

      <div className="relative z-10">

        <div className="flex flex-col gap-10 xl:flex-row xl:items-center xl:justify-between">

          {/* Right */}

          <div className="flex-1">

            <span
              className="
                inline-block
                rounded-full
                bg-yellow-400/20
                px-4
                py-1
                text-sm
                text-yellow-400
              "
            >
              Tumouh Star ERP
            </span>

            <h1 className="mt-5 text-4xl font-bold text-white">
              صباح الخير، علي 👋
            </h1>

            <p className="mt-3 max-w-2xl text-lg text-gray-300">
              مرحبًا بك في نظام إدارة شركة طموح ستار، يمكنك متابعة المشاريع،
              الإيرادات، المصروفات، والاستثمارات من مكان واحد.
            </p>

          </div>

          {/* Left Statistics */}

          <div className="grid grid-cols-2 gap-5">

            <HeroCard
              icon={<Building2 size={28} />}
              title="المشاريع"
              value="0"
            />

            <HeroCard
              icon={<Wallet size={28} />}
              title="الأصول"
              value="0"
            />

            <HeroCard
              icon={<Users size={28} />}
              title="الموظفين"
              value="0"
            />

            <HeroCard
              icon={<Building2 size={28} />}
              title="العقارات"
              value="0"
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
    <div
      className="
        min-w-[150px]
        rounded-2xl
        border
        border-white/10
        bg-white/5
        p-5
        backdrop-blur-md
        transition-all
        duration-300
        hover:bg-white/10
      "
    >

      <div
        className="
          mb-4
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-xl
          bg-yellow-400
          text-[#081B33]
        "
      >
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