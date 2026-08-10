import {
  LayoutDashboard,
  Building2,
  WalletCards,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

import { Link } from "react-router-dom";

type HomeCard = {
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  gradient: string;
  glow: string;
};

const homeCards: HomeCard[] = [
  {
    title: "لوحة التحكم",
    description: "متابعة الأداء والإحصائيات والمؤشرات الرئيسية للنظام",
    path: "/dashboard",
    icon: LayoutDashboard,
    gradient: "from-cyan-500/20 via-blue-500/10 to-transparent",
    glow: "group-hover:shadow-cyan-500/20",
  },
  {
    title: "المشاريع",
    description: "إدارة المشاريع ومتابعة التفاصيل والمراحل والتقدم",
    path: "/projects",
    icon: Building2,
    gradient: "from-emerald-500/20 via-green-500/10 to-transparent",
    glow: "group-hover:shadow-emerald-500/20",
  },
  {
    title: "المركز المالي",
    description: "إدارة المصروفات والعهد والحسابات والبنود المالية",
    path: "/financial",
    icon: WalletCards,
    gradient: "from-yellow-400/25 via-orange-500/10 to-transparent",
    glow: "group-hover:shadow-yellow-500/20",
  },
];

export default function Home() {
  return (
    <div
      className="
        min-h-full
        relative
        overflow-hidden
        rounded-3xl
      "
    >

      {/* Background Decorations */}
      <div
        className="
          pointer-events-none
          absolute
          -top-32
          -right-32
          w-96
          h-96
          rounded-full
          bg-yellow-400/10
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-40
          -left-40
          w-[28rem]
          h-[28rem]
          rounded-full
          bg-blue-500/10
          blur-3xl
        "
      />

      {/* Header */}
      <div className="relative z-10 text-center pt-10 pb-10">

        <div
          className="
            inline-flex
            items-center
            gap-2
            rounded-full
            border
            border-yellow-400/20
            bg-yellow-400/10
            px-5
            py-2
            text-yellow-300
            text-sm
            mb-5
          "
        >
          <Sparkles size={16} />

          Tumouh Star ERP

        </div>

        <h1
          className="
            text-4xl
            md:text-5xl
            font-black
            text-white
            tracking-tight
          "
        >
          الشاشة الرئيسية
        </h1>

        <p
          className="
            mt-4
            text-gray-400
            text-lg
          "
        >
          مرحبًا بك في نظام طموح ستار لإدارة الأعمال
        </p>

        <p
          className="
            mt-2
            text-gray-500
            text-sm
          "
        >
          اختر القسم الذي تريد الدخول إليه
        </p>

      </div>

      {/* Cards */}
      <div
        className="
          relative
          z-10
          grid
          grid-cols-1
          md:grid-cols-3
          gap-7
          px-4
          pb-12
          max-w-[1500px]
          mx-auto
        "
      >

        {homeCards.map((card) => {

          const Icon = card.icon;

          return (
            <Link
              key={card.path}
              to={card.path}
              className="group"
            >

              <div
                className={`
                  relative
                  h-[360px]
                  overflow-hidden
                  rounded-[2rem]
                  border
                  border-white/10
                  bg-gradient-to-br
                  ${card.gradient}
                  backdrop-blur-2xl
                  shadow-2xl
                  ${card.glow}
                  transition-all
                  duration-500
                  hover:-translate-y-3
                  hover:scale-[1.015]
                `}
              >

                {/* Glass Shine */}
                <div
                  className="
                    absolute
                    -top-24
                    -right-24
                    w-64
                    h-64
                    rounded-full
                    bg-white/5
                    blur-2xl
                    transition-all
                    duration-500
                    group-hover:bg-white/10
                  "
                />

                {/* Top Line */}
                <div
                  className="
                    absolute
                    top-0
                    left-8
                    right-8
                    h-px
                    bg-gradient-to-r
                    from-transparent
                    via-white/30
                    to-transparent
                  "
                />

                {/* Icon */}
                <div className="relative z-10 flex justify-center pt-12">

                  <div
                    className="
                      relative
                      w-28
                      h-28
                      rounded-[2rem]
                      border
                      border-white/15
                      bg-white/10
                      backdrop-blur-xl
                      flex
                      items-center
                      justify-center
                      shadow-2xl
                      transition-all
                      duration-500
                      group-hover:scale-110
                      group-hover:rotate-2
                    "
                  >

                    <div
                      className="
                        absolute
                        inset-3
                        rounded-[1.4rem]
                        border
                        border-white/10
                      "
                    />

                    <Icon
                      size={52}
                      strokeWidth={1.7}
                      className="
                        relative
                        z-10
                        text-white
                        transition-all
                        duration-500
                        group-hover:scale-110
                      "
                    />

                  </div>

                </div>

                {/* Content */}
                <div
                  className="
                    relative
                    z-10
                    text-center
                    px-8
                    mt-8
                  "
                >

                  <h2
                    className="
                      text-2xl
                      font-black
                      text-white
                    "
                  >
                    {card.title}
                  </h2>

                  <p
                    className="
                      mt-4
                      text-gray-400
                      text-sm
                      leading-7
                    "
                  >
                    {card.description}
                  </p>

                </div>

                {/* Bottom Action */}
                <div
                  className="
                    absolute
                    bottom-7
                    left-0
                    right-0
                    flex
                    justify-center
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-full
                      border
                      border-white/10
                      bg-white/5
                      px-5
                      py-2.5
                      text-sm
                      text-gray-300
                      backdrop-blur-md
                      transition-all
                      duration-300
                      group-hover:bg-white/10
                      group-hover:text-white
                    "
                  >

                    الدخول إلى القسم

                    <ArrowLeft
                      size={17}
                      className="
                        transition-transform
                        duration-300
                        group-hover:-translate-x-1
                      "
                    />

                  </div>

                </div>

              </div>

            </Link>
          );
        })}

      </div>

    </div>
  );
}