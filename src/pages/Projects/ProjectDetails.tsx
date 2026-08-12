import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  WalletCards,
  Ruler,
  Calculator,
  Eye,
  Pencil,
  Home,
} from "lucide-react";

import { projects } from "../../data/projects";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const project = projects.find(
    (p) => p.id === Number(id)
  );

  if (!project) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold text-white">
          المشروع غير موجود
        </h1>

        <button
          onClick={() => navigate("/projects")}
          className="
            mt-6
            rounded-xl
            bg-yellow-400
            px-6
            py-3
            font-bold
            text-[#081B33]
            transition
            hover:bg-yellow-500
          "
        >
          رجوع للمشاريع
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-8 pb-10">

      {/* =====================================================
          PROJECT HEADER
      ===================================================== */}

      <div
        className="
          relative
          min-h-[190px]
          overflow-hidden
          rounded-3xl
          border
          border-white/10
          bg-gradient-to-br
          from-[#173C63]
          via-[#0D2948]
          to-[#101C2D]
          px-8
          py-8
          shadow-xl
        "
      >

        {/* Background Glow */}
        <div
          className="
            pointer-events-none
            absolute
            -right-20
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
            pointer-events-none
            absolute
            -left-20
            -bottom-20
            h-64
            w-64
            rounded-full
            bg-blue-500/10
            blur-3xl
          "
        />

        {/* Back Button */}
        <button
          onClick={() => navigate("/projects")}
          className="
            absolute
            right-5
            top-5
            z-20
            flex
            items-center
            gap-2
            rounded-xl
            border
            border-white/10
            bg-black/10
            px-4
            py-2
            text-sm
            font-semibold
            text-gray-300
            backdrop-blur-sm
            transition
            hover:bg-white/10
            hover:text-white
          "
        >
          رجوع للمشاريع
          <ArrowLeft size={17} />
        </button>

        <div
          className="
            relative
            z-10
            flex
            min-h-[150px]
            items-center
            justify-between
            gap-8
          "
        >

          {/* RIGHT - PROJECT ICON */}
          <div className="flex w-[220px] shrink-0 items-center">
            <div
              className="
                flex
                h-28
                w-28
                items-center
                justify-center
                rounded-3xl
                border
                border-yellow-400/30
                bg-yellow-400/10
                text-yellow-400
                shadow-xl
                shadow-yellow-400/10
              "
            >
              <Building2 size={58} />
            </div>
          </div>

          {/* CENTER - PROJECT NAME */}
          <div className="flex-1 text-center">
            <h1
              className="
                text-4xl
                font-extrabold
                leading-tight
                tracking-wide
                text-white
              "
            >
              {project.name}
            </h1>

            <p className="mt-3 text-base text-gray-400">
              إدارة ومتابعة بيانات المشروع
            </p>
          </div>

          {/* LEFT - STATUS ONLY
              المدينة أزيلت من الهيدر حسب التعديل المطلوب */}
          <div
            className="
              flex
              w-[270px]
              shrink-0
              flex-col
              items-start
              justify-center
              gap-5
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-emerald-400/20
                  bg-emerald-400/10
                  text-emerald-300
                "
              >
                <Building2 size={25} />
              </div>

              <div>
                <p className="text-sm text-gray-400">
                  الحالة
                </p>

                <p className="mt-1 text-xl font-extrabold text-white">
                  {project.status}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>


      {/* =====================================================
          PROJECT KPIs
          5 CARDS - ONE ROW
          المدينة تم حذفها
      ===================================================== */}

      <section>

        <div className="mb-6 flex justify-center">
          <div
            className="
              w-fit
              min-w-[420px]
              rounded-2xl
              border
              border-cyan-300/20
              bg-[#102A43]
              px-10
              py-4
              text-center
              shadow-xl
              shadow-black/20
            "
          >
            <h2 className="text-2xl font-extrabold text-white">
              مؤشرات المشروع
            </h2>

            <p className="mt-1 text-sm text-gray-300">
              ملخص سريع لأهم بيانات مشروع فلل تبوك
            </p>
          </div>
        </div>


        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">

          {/* 1 - CURRENT PRICE */}
          <ProjectKpi
            icon={<Calculator size={46} />}
            title="سعر المتر الحالي"
            value="0"
            suffix="ريال / م²"
            cardClass="
              from-[#4D3D21]
              via-[#393020]
              to-[#222132]
              border-amber-400/20
            "
          />

          {/* 2 - TOTAL AREA */}
          <ProjectKpi
            icon={<Ruler size={46} />}
            title="إجمالي المساحة"
            value="0"
            suffix="م²"
            cardClass="
              from-[#413462]
              via-[#30284F]
              to-[#1D203A]
              border-violet-400/20
            "
          />

          {/* 3 - PROJECT STATUS */}
          <ProjectKpi
            icon={<Building2 size={46} />}
            title="حالة المشروع"
            value={project.status}
            cardClass="
              from-[#164C46]
              via-[#123A3B]
              to-[#0B2730]
              border-emerald-400/20
            "
          />

          {/* 4 - TOTAL VILLAS */}
          <ProjectKpi
            icon={<Building2 size={46} />}
            title="إجمالي الفلل"
            value="18"
            suffix="فيلا"
            cardClass="
              from-[#173F68]
              via-[#123455]
              to-[#0B2139]
              border-blue-400/20
            "
          >
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
              <VillaCount title="صغيرة" value="0" />
              <VillaCount title="متوسطة" value="0" />
              <VillaCount title="كبيرة" value="0" />
            </div>
          </ProjectKpi>

          {/* 5 - TOTAL EXPENSES */}
          <ProjectKpi
            icon={<WalletCards size={46} />}
            title="إجمالي المصاريف"
            value="0"
            suffix="ريال"
            cardClass="
              from-[#4C2B3B]
              via-[#362336]
              to-[#211A2C]
              border-rose-400/20
            "
          />

        </div>

      </section>


      {/* =====================================================
          TOP COST ITEMS
          نفس فكرة التصميم: لوحتان، 3 بنود في كل لوحة
      ===================================================== */}

      <section className="grid gap-5 xl:grid-cols-2">

        {/* RIGHT - TOP 3 COST ITEMS */}
        <TopCostPanel
          title="أكثر 3 بنود تكلفة حتى الآن"
          items={[
            {
              name: "البند الأول",
              amount: 0,
              percentage: 0,
            },
            {
              name: "البند الثاني",
              amount: 0,
              percentage: 0,
            },
            {
              name: "البند الثالث",
              amount: 0,
              percentage: 0,
            },
          ]}
          accent="green"
        />

        {/* LEFT - TOP 3 COST ITEMS */}
        <TopCostPanel
          title="أكثر 3 بنود تكلفة حتى الآن"
          items={[
            {
              name: "البند الرابع",
              amount: 0,
              percentage: 0,
            },
            {
              name: "البند الخامس",
              amount: 0,
              percentage: 0,
            },
            {
              name: "البند السادس",
              amount: 0,
              percentage: 0,
            },
          ]}
          accent="blue"
        />

      </section>


      {/* =====================================================
          VILLAS
      ===================================================== */}

      <section>

        <div className="mb-6 mt-8 flex justify-center">
          <div
            className="
              w-fit
              min-w-[560px]
              rounded-2xl
              border
              border-yellow-400/25
              bg-[#171F2E]
              px-8
              py-4
              shadow-xl
              shadow-black/20
            "
          >
            <div className="flex items-center justify-center gap-8">

              {/* عنوان الفلل */}
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-white">
                  فلل المشروع
                </h2>

                <p className="mt-1 text-sm text-gray-300">
                  جميع فلل مشروع {project.name}
                </p>
              </div>

              {/* إجمالي الفلل */}
              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-yellow-400/20
                  bg-yellow-400/10
                  px-5
                  py-3
                "
              >
                <span className="text-base font-bold text-yellow-300">
                  إجمالي الفلل
                </span>

                <span className="text-3xl font-extrabold text-yellow-400">
                  18
                </span>

                <span className="text-base font-semibold text-gray-300">
                  فيلا
                </span>
              </div>

            </div>
          </div>
        </div>


        {/* 3 VILLAS PER ROW */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {Array.from(
            { length: 18 },
            (_, index) => {

              const villaNumber = index + 1;

              return (
                <VillaCard
                  key={villaNumber}
                  villaNumber={villaNumber}
                  onView={() =>
                    console.log(
                      `عرض فيلا ${villaNumber}`
                    )
                  }
                  onEdit={() =>
                    console.log(
                      `تعديل فيلا ${villaNumber}`
                    )
                  }
                />
              );
            }
          )}

        </div>

      </section>

    </div>
  );
}


/* =========================================================
   TOP COST PANEL
========================================================= */

type TopCostItem = {
  name: string;
  amount: number;
  percentage: number;
};

type TopCostPanelProps = {
  title: string;
  items: TopCostItem[];
  accent: "green" | "blue";
};

function TopCostPanel({
  title,
  items,
  accent,
}: TopCostPanelProps) {

  const accentClasses =
    accent === "green"
      ? {
          border: "border-emerald-400/20",
          icon: "text-emerald-400",
          number: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
          bar: "bg-emerald-400",
          button:
            "border-emerald-400/20 bg-emerald-400/5 hover:bg-emerald-400/10",
        }
      : {
          border: "border-blue-400/20",
          icon: "text-blue-400",
          number: "bg-blue-400/10 text-blue-300 border-blue-400/20",
          bar: "bg-blue-400",
          button:
            "border-blue-400/20 bg-blue-400/5 hover:bg-blue-400/10",
        };

  return (
    <div
      className={`
        overflow-hidden
        rounded-3xl
        border
        ${accentClasses.border}
        bg-gradient-to-br
        from-[#102A43]
        via-[#102337]
        to-[#0B1928]
        shadow-xl
      `}
    >

      {/* Header */}
      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-white/10
          px-6
          py-5
        "
      >
        <div className="flex-1 text-center">
  <h3 className="text-xl font-extrabold text-white">
    {title}
  </h3>

  <p className="mt-1 text-sm text-gray-400">
    ترتيب البنود حسب إجمالي التكلفة حتى الآن
  </p>
</div>

        <div
          className={`
            mr-4
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            border
            border-white/10
            bg-white/5
            ${accentClasses.icon}
          `}
        >
          <WalletCards size={25} />
        </div>
      </div>


      {/* Table Header */}
      <div
        className="
          grid
          grid-cols-[48px_1fr_145px_120px]
          items-center
          gap-3
          border-b
          border-white/10
          bg-black/10
          px-5
          py-4
          text-xs
          font-bold
          text-gray-400
        "
      >
        <div className="text-center">
          #
        </div>

        <div>
          اسم البند
        </div>

        <div className="text-center">
          إجمالي التكلفة
        </div>

        <div className="text-center">
          النسبة
        </div>
      </div>


      {/* Items */}
      <div>
        {items.slice(0, 3).map((item, index) => {

          const percentage =
            Math.max(
              0,
              Math.min(
                100,
                Number(item.percentage) || 0
              )
            );

          return (
            <div
  key={`${item.name}-${index}`}
  className="
    border-b
    border-white/10
    px-5
    py-8
  "
>

              <div
                className="
                  grid
                  grid-cols-[48px_1fr_145px_120px]
                  items-center
                  gap-3
                "
              >

                {/* Number */}
                <div className="flex justify-center">
                  <span
                    className={`
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-xl
                      border
                      text-sm
                      font-extrabold
                      ${accentClasses.number}
                    `}
                  >
                    {index + 1}
                  </span>
                </div>


                {/* Name */}
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-white">
                    {item.name}
                  </p>

                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${accentClasses.bar}`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>


                {/* Amount */}
                <div className="text-center">
                  <p className="text-base font-extrabold text-white">
                    {Number(item.amount).toLocaleString("ar-SA")}
                  </p>

                  <p className="mt-1 text-[11px] text-gray-500">
                    ريال
                  </p>
                </div>


                {/* Percentage */}
                <div className="text-center">
                  <span
                    className={`
                      inline-flex
                      rounded-full
                      border
                      px-3
                      py-1
                      text-sm
                      font-extrabold
                      ${accentClasses.number}
                    `}
                  >
                    {percentage.toFixed(1)}%
                  </span>
                </div>

              </div>

            </div>
          );
        })}
      </div>


      {/* Footer */}
      <div className="px-5 py-4">
        <button
          type="button"
          className={`
            w-full
            rounded-2xl
            border
            px-5
            py-3
            text-sm
            font-bold
            text-gray-200
            transition
            ${accentClasses.button}
          `}
        >
          عرض جميع بنود التكاليف
          <span className="mr-2">
            ←
          </span>
        </button>
      </div>

    </div>
  );
}


/* =========================================================
   PROJECT KPI CARD
========================================================= */

type ProjectKpiProps = {
  icon: React.ReactNode;
  title: string;
  value: string;
  suffix?: string;
  cardClass: string;
  children?: React.ReactNode;
};

function ProjectKpi({
  icon,
  title,
  value,
  suffix,
  cardClass,
  children,
}: ProjectKpiProps) {
  return (
    <div
      className={`
        group
        relative
        min-h-[205px]
        overflow-hidden
        rounded-3xl
        border
        bg-gradient-to-br
        ${cardClass}
        p-6
        shadow-lg
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-2xl
      `}
    >

      {/* Glow */}
      <div
        className="
          pointer-events-none
          absolute
          -left-10
          -top-10
          h-32
          w-32
          rounded-full
          bg-white/5
          blur-3xl
          transition-all
          duration-500
          group-hover:scale-150
        "
      />


      <div
        className="
          relative
          z-10
          flex
          items-center
          justify-between
          gap-6
        "
      >

        {/* RIGHT - ICON */}
        <div
          className="
            flex
            h-24
            w-24
            shrink-0
            items-center
            justify-center
            rounded-3xl
            border
            border-white/10
            bg-black/10
            text-white
            shadow-xl
            backdrop-blur-sm
            transition-all
            duration-300
            group-hover:scale-110
            group-hover:rotate-2
          "
        >
          {icon}
        </div>


        {/* LEFT - TEXT */}
        <div className="flex-1 text-left">

          <p
            className="
              text-lg
              font-bold
              leading-tight
              text-white
            "
          >
            {title}
          </p>


          <div
            className="
              mt-4
              flex
              items-baseline
              gap-2
            "
          >

            <h3
              className="
                text-3xl
                font-extrabold
                leading-none
                text-white
              "
            >
              {value}
            </h3>

            {suffix && (
              <span
                className="
                  text-sm
                  font-semibold
                  text-gray-300
                "
              >
                {suffix}
              </span>
            )}

          </div>

        </div>

      </div>


      {/* Optional Content */}
      {children}

    </div>
  );
}


/* =========================================================
   VILLA COUNT
========================================================= */

type VillaCountProps = {
  title: string;
  value: string;
};

function VillaCount({
  title,
  value,
}: VillaCountProps) {
  return (
    <div className="text-center">

      <p className="text-sm font-semibold text-gray-400">
        {title}
      </p>

      <p className="mt-1 text-xl font-extrabold text-white">
        {value}
      </p>

    </div>
  );
}


/* =========================================================
   VILLA CARD
========================================================= */

type VillaCardProps = {
  villaNumber: number;
  onView: () => void;
  onEdit: () => void;
};

function VillaCard({
  villaNumber,
  onView,
  onEdit,
}: VillaCardProps) {
  return (
    <div
      className="
        group
        flex
        min-h-[330px]
        flex-col
        overflow-hidden
        rounded-3xl
        border
        border-blue-400/15
        bg-gradient-to-br
        from-[#12365D]
        via-[#0D2948]
        to-[#091C31]
        shadow-lg
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-yellow-400/30
        hover:shadow-2xl
      "
    >

      {/* VILLA HEADER */}
      <div
        className="
          flex
          items-start
          justify-between
          border-b
          border-white/10
          p-6
        "
      >

        {/* Icon */}
        <div
          className="
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-2xl
            border
            border-yellow-400/20
            bg-yellow-400/10
            text-yellow-400
            shadow-lg
            transition
            duration-300
            group-hover:scale-110
          "
        >
          <Home size={32} />
        </div>


        {/* Name + Classification */}
        <div className="text-right">

          <div className="flex items-center justify-end gap-3">

            <h3
              className="
                text-2xl
                font-extrabold
                leading-none
                text-white
              "
            >
              فيلا {villaNumber}
            </h3>

            <span
              className="
                rounded-full
                border
                border-yellow-400/20
                bg-yellow-400/10
                px-3
                py-1
                text-sm
                font-bold
                text-yellow-400
              "
            >
              غير محدد
            </span>

          </div>

          <p className="mt-3 text-sm text-gray-400">
            مشروع فلل تبوك
          </p>

        </div>

      </div>


      {/* VILLA BODY */}
      <div
        className="
          flex
          flex-1
          items-center
          justify-center
          px-6
          py-8
        "
      >

        <div className="text-center">

          <p className="text-sm font-semibold text-gray-400">
            تصنيف الفيلا
          </p>

          <p
            className="
              mt-3
              text-xl
              font-extrabold
              text-white
            "
          >
            لم يتم تحديد التصنيف بعد
          </p>

          <p className="mt-2 text-sm text-gray-500">
            سيتم تحديدها لاحقًا عند إضافة بيانات الفيلا
          </p>

        </div>

      </div>


      {/* ACTION BUTTONS - ALWAYS AT BOTTOM */}
      <div
        className="
          mt-auto
          grid
          grid-cols-2
          gap-3
          border-t
          border-white/10
          p-5
        "
      >

        {/* View */}
        <button
          onClick={onView}
          className="
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-blue-400/20
            bg-blue-500/10
            py-3
            font-bold
            text-blue-300
            transition-all
            duration-300
            hover:bg-blue-500
            hover:text-white
          "
        >
          عرض
          <Eye size={18} />
        </button>


        {/* Edit */}
        <button
          onClick={onEdit}
          className="
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-yellow-400/20
            bg-yellow-400/10
            py-3
            font-bold
            text-yellow-400
            transition-all
            duration-300
            hover:bg-yellow-400
            hover:text-[#081B33]
          "
        >
          تعديل
          <Pencil size={18} />
        </button>

      </div>

    </div>
  );
}
