
import {
  ArrowLeft,
  Building,
  Building2,
  LayoutDashboard,
  WalletCards,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import "./Home.css";

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
      title: "العمائر",
      description:
        "إدارة العمائر السكنية والتجارية ومتابعة الوحدات والإيجارات",
      icon: Building,
      path: "/buildings",
      color: "building",
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
        w-full
        min-w-0
        max-w-full
        pb-10
        aqar-home-page
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
          top-[42%]
          z-0
          h-[420px]
          w-[420px]
          sm:h-[650px]
          sm:w-[650px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-yellow-400/[0.025]
          blur-[100px]
        "
      />

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
          min-w-0
          max-w-full
          flex-col
          items-center
          px-3
          pt-2
          sm:px-5
          lg:px-8
        "
      >
        {/* =====================================
            العنوان
        ===================================== */}

        <div
          className="
            mb-5
            flex
            flex-col
            items-center
            text-center
          "
        >
          <div
            className="
              aqar-home-badge
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
            AQAR SMART ERP

            <span className="mr-1">✦</span>
          </div>

          <h1
            className="
              aqar-home-title
              text-3xl
              font-extrabold
              leading-tight
              text-white
              sm:text-4xl
              md:text-5xl
            "
          >
            الشاشة الرئيسية
          </h1>

          <p
            className="
              aqar-home-description
              mt-2
              text-sm
              text-gray-400
              md:text-base
            "
          >
            مرحبًا بك في عقار سمارت لإدارة العقارات
          </p>
        </div>

        {/* =====================================
            الكروت الأربعة
        ===================================== */}

        <div
          className="
            grid
            w-full
            min-w-0
            max-w-full
            grid-cols-1
            gap-4
            sm:gap-5
            md:grid-cols-2
            xl:grid-cols-4
            lg:gap-6
          "
        >
          {cards.map((card) => {
            const Icon = card.icon;

            const isYellow = card.color === "yellow";
            const isGreen = card.color === "green";
            const isBuilding = card.color === "building";

            return (
              <div
                key={card.title}
                className={`
                  aqar-feature-card
                  group
                  relative
                  flex
                  min-h-[340px]
                  w-full
                  min-w-0
                  max-w-full
                  flex-col
                  items-center
                  overflow-hidden
                  rounded-2xl
                  border
                  p-4
                  sm:rounded-[30px]
                  sm:p-7
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
                      : isBuilding
                      ? `
                        border-[#D4AD4D]/40
                        bg-gradient-to-br
                        from-[#D4AD4D]/[0.16]
                        via-[#104638]/90
                        to-[#06251e]/95
                        shadow-[#D4AD4D]/[0.06]
                        hover:border-[#F6D878]/70
                        hover:shadow-[#D4AD4D]/15
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
                {/* =================================
                    Glow
                ================================= */}

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
                        : isBuilding
                        ? "bg-[#D4AD4D]"
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
                    mb-4
                    flex
                    h-24
                    w-24
                    sm:mb-6
                    sm:h-[120px]
                    sm:w-[120px]
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
                        : isBuilding
                        ? `
                          border-[#D4AD4D]/50
                          bg-gradient-to-br
                          from-[#D4AD4D]/25
                          to-[#0B4537]/40
                          shadow-[#D4AD4D]/15
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
                    size={56}
                    strokeWidth={1.8}
                    className={`
                      h-12
                      w-12
                      sm:h-[62px]
                      sm:w-[62px]
                      aqar-card-icon
                      transition-transform
                      duration-500
                      group-hover:scale-110
                      ${
                        isYellow
                          ? "text-yellow-100"
                          : isGreen
                          ? "text-emerald-100"
                          : isBuilding
                          ? "text-[#F6D878]"
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
                    aqar-card-title
                    relative
                    z-10
                    text-2xl
                    sm:text-[29px]
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
                    aqar-card-description
                    relative
                    z-10
                    mt-3
                    min-h-0
                    w-full
                    max-w-[340px]
                    break-words
                    text-sm
                    sm:mt-4
                    sm:min-h-[58px]
                    sm:text-[15px]
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
                    aqar-card-button
                    relative
                    z-10
                    mt-auto
                    flex
                    w-full
                    min-w-0
                    max-w-full
                    items-center
                    sm:min-w-[210px]
                    justify-center
                    gap-3
                    rounded-full
                    border
                    px-4
                    py-3
                    sm:px-6
                    text-[15px]
                    font-bold
                    sm:text-[17px]
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
                        : isBuilding
                        ? `
                          border-[#D4AD4D]/60
                          bg-[#D4AD4D]/[0.06]
                          text-white
                          hover:border-[#F6D878]
                          hover:bg-[#D4AD4D]/15
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
                  <span>الدخول إلى القسم</span>

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