import {
  ArrowLeft,
  Building2,
  LayoutDashboard,
  WalletCards,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const cards = [
  {
    title: "لوحة التحكم",
    description:
      "متابعة الأداء والإحصائيات والتقارير الرئيسية للنظام",
    icon: LayoutDashboard,
    path: "/dashboard",
    color: "blue",
  },
  {
    title: "المشاريع",
    description:
      "إدارة المشاريع ومتابعة التفاصيل والتواصل والمهام والتقدم",
    icon: Building2,
    path: "/projects",
    color: "green",
  },
  {
    title: "المركز المالي",
    description:
      "إدارة المصروفات، الأرباح، الحسابات والقيود المالية",
    icon: WalletCards,
    path: "/financial",
    color: "yellow",
  },
];

  return (
    <div
      dir="rtl"
      className="
        relative
        min-h-full
        overflow-hidden
        pb-10
      "
    >

      {/* =========================================
          الخلفية
      ========================================= */}

      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-[48%]
          z-0
          h-[650px]
          w-[650px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-yellow-400/[0.025]
          blur-[100px]
        "
      />

      {/* =========================================
          العلامة المائية
      ========================================= */}

      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-[58%]
          z-0
          -translate-x-1/2
          -translate-y-1/2
          opacity-[0.055]
        "
      >
        <div
          className="
            flex
            h-[650px]
            w-[650px]
            items-center
            justify-center
          "
        >
          <span
            className="
              text-[520px]
              font-black
              leading-none
              text-yellow-400
            "
          >
            ★
          </span>
        </div>
      </div>


      {/* =========================================
          المحتوى
      ========================================= */}

      <div
        className="
          relative
          z-10
          mx-auto
          flex
          w-full
          max-w-[1550px]
          flex-col
          items-center
          px-5
          pt-2
          lg:px-8
        "
      >

        {/* =====================================
            العنوان
        ===================================== */}

        <div
          className="
            mb-7
            flex
            flex-col
            items-center
            text-center
          "
        >

          <div
            className="
              mb-2
              rounded-full
              border
              border-yellow-400/30
              bg-yellow-400/10
              px-3
              py-1
              text-[11px]
              font-bold
              text-yellow-400
            "
          >
            Tumouh Star ERP
            <span className="mr-1">✦</span>
          </div>

          <h1
            className="
              text-4xl
              font-extrabold
              leading-tight
              text-white
              md:text-5xl
            "
          >
            الشاشة الرئيسية
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-gray-400
              md:text-base
            "
          >
            مرحبًا بك في نظام طموح ستار لإدارة الأعمال
          </p>

        </div>


        {/* =====================================
            الكروت الثلاثة
        ===================================== */}

        <div
          className="
            grid
            w-full
            grid-cols-1
            gap-5
            md:grid-cols-3
            lg:gap-7
          "
        >

          {cards.map((card) => {

            const Icon = card.icon;

            const isYellow = card.color === "yellow";
            const isGreen = card.color === "green";

            return (
              <div
                key={card.title}
                className={`
                  group
                  relative
                  flex
                  min-h-[390px]
                  flex-col
                  items-center
                  overflow-hidden
                  rounded-[30px]
                  border
                  p-7
                  text-center
                  shadow-2xl
                  backdrop-blur-xl
                  transition-all
                  duration-500
                  hover:-translate-y-2
                  ${
                    isYellow
                      ? `
                        border-yellow-400/30
                        bg-gradient-to-br
                        from-yellow-400/[0.20]
                        via-[#171914]/80
                        to-[#0b1420]/95
                        shadow-yellow-400/[0.06]
                        hover:border-yellow-400/60
                        hover:shadow-yellow-400/10
                      `
                      : isGreen
                      ? `
                        border-emerald-400/30
                        bg-gradient-to-br
                        from-emerald-400/[0.16]
                        via-[#082b27]/80
                        to-[#0b1420]/95
                        shadow-emerald-400/[0.05]
                        hover:border-emerald-400/60
                        hover:shadow-emerald-400/10
                      `
                      : `
                        border-blue-400/30
                        bg-gradient-to-br
                        from-blue-400/[0.16]
                        via-[#09243d]/80
                        to-[#0b1420]/95
                        shadow-blue-400/[0.05]
                        hover:border-blue-400/60
                        hover:shadow-blue-400/10
                      `
                  }
                `}
              >

                {/* Glow */}

                <div
                  className={`
                    pointer-events-none
                    absolute
                    -top-24
                    left-1/2
                    h-48
                    w-48
                    -translate-x-1/2
                    rounded-full
                    blur-[70px]
                    opacity-20
                    ${
                      isYellow
                        ? "bg-yellow-400"
                        : isGreen
                        ? "bg-emerald-400"
                        : "bg-blue-400"
                    }
                  `}
                />


                {/* =================================
                    الأيقونة
                ================================= */}

                <div
                  className={`
                    relative
                    z-10
                    mb-6
                    flex
                    h-[120px]
                    w-[120px]
                    shrink-0
                    items-center
                    justify-center
                    rounded-[30px]
                    border
                    shadow-xl
                    transition-all
                    duration-500
                    group-hover:scale-105
                    ${
                      isYellow
                        ? `
                          border-yellow-300/30
                          bg-gradient-to-br
                          from-yellow-300/20
                          to-yellow-500/10
                          shadow-yellow-400/10
                        `
                        : isGreen
                        ? `
                          border-emerald-300/30
                          bg-gradient-to-br
                          from-emerald-300/20
                          to-emerald-500/10
                          shadow-emerald-400/10
                        `
                        : `
                          border-blue-300/30
                          bg-gradient-to-br
                          from-blue-300/20
                          to-blue-500/10
                          shadow-blue-400/10
                        `
                    }
                  `}
                >

                  <Icon
                    size={62}
                    strokeWidth={1.8}
                    className={`
                      transition-transform
                      duration-500
                      group-hover:scale-110
                      ${
                        isYellow
                          ? "text-yellow-100"
                          : isGreen
                          ? "text-emerald-100"
                          : "text-blue-100"
                      }
                    `}
                  />

                </div>


                {/* =================================
                    العنوان
                ================================= */}

                <h2
                  className="
                    relative
                    z-10
                    text-[29px]
                    font-extrabold
                    leading-tight
                    text-white
                  "
                >
                  {card.title}
                </h2>


                {/* =================================
                    الوصف
                ================================= */}

                <p
                  className="
                    relative
                    z-10
                    mt-4
                    min-h-[58px]
                    max-w-[340px]
                    text-[15px]
                    font-medium
                    leading-7
                    text-gray-300
                  "
                >
                  {card.description}
                </p>


                {/* =================================
                    زر الدخول
                ================================= */}

                <button
                  type="button"
                  onClick={() => navigate(card.path)}
                  className={`
                    relative
                    z-10
                    mt-auto
                    flex
                    min-w-[210px]
                    items-center
                    justify-center
                    gap-3
                    rounded-full
                    border
                    px-6
                    py-3
                    text-[17px]
                    font-bold
                    transition-all
                    duration-300
                    hover:scale-105
                    ${
                      isYellow
                        ? `
                          border-yellow-400/50
                          bg-yellow-400/5
                          text-white
                          hover:bg-yellow-400/10
                        `
                        : isGreen
                        ? `
                          border-emerald-400/50
                          bg-emerald-400/5
                          text-white
                          hover:bg-emerald-400/10
                        `
                        : `
                          border-blue-400/50
                          bg-blue-400/5
                          text-white
                          hover:bg-blue-400/10
                        `
                    }
                  `}
                >

                  <span>
                    الدخول إلى القسم
                  </span>

                  <ArrowLeft
                    size={24}
                    strokeWidth={2.2}
                    className="
                      transition-transform
                      duration-300
                      group-hover:-translate-x-1
                    "
                  />

                </button>

              </div>
            );
          })}

        </div>

      </div>

    </div>
  );
}