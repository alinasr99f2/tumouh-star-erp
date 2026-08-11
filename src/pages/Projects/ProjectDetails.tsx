import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  MapPin,
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

          {/* =========================
              RIGHT - PROJECT ICON
          ========================= */}

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


          {/* =========================
              CENTER - PROJECT NAME
          ========================= */}

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


          {/* =========================
              LEFT - CITY + STATUS
          ========================= */}

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

            {/* City */}
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
                  border-cyan-400/20
                  bg-cyan-400/10
                  text-cyan-300
                "
              >
                <MapPin size={25} />
              </div>

              <div>

                <p className="text-sm text-gray-400">
                  المدينة
                </p>

                <p className="mt-1 text-xl font-extrabold text-white">
                  {project.city}
                </p>

              </div>

            </div>


            {/* Status */}
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
      ===================================================== */}

      <section>

        <div className="mb-5 text-right">

          <h2 className="text-2xl font-bold text-white">
            مؤشرات المشروع
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            ملخص أهم بيانات مشروع {project.name}
          </p>

        </div>


        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">


          {/* =================================================
              KPI 1 - TOTAL VILLAS
          ================================================= */}

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

              <VillaCount
                title="صغيرة"
                value="0"
              />

              <VillaCount
                title="متوسطة"
                value="0"
              />

              <VillaCount
                title="كبيرة"
                value="0"
              />

            </div>

          </ProjectKpi>


          {/* =================================================
              KPI 2 - STATUS
          ================================================= */}

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


          {/* =================================================
              KPI 3 - CITY
          ================================================= */}

          <ProjectKpi
            icon={<MapPin size={46} />}
            title="المدينة"
            value={project.city}
            cardClass="
              from-[#164B61]
              via-[#123A4C]
              to-[#0B2639]
              border-cyan-400/20
            "
          />


          {/* =================================================
              KPI 4 - TOTAL EXPENSES
          ================================================= */}

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


          {/* =================================================
              KPI 5 - TOTAL AREA
          ================================================= */}

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


          {/* =================================================
              KPI 6 - CURRENT PRICE
          ================================================= */}

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

        </div>

      </section>


      {/* =====================================================
          VILLAS
      ===================================================== */}

      <section>

        <div className="mb-5 flex items-end justify-between">

          <div>

            <h2 className="text-2xl font-bold text-white">
              فلل المشروع
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              جميع فلل مشروع {project.name}
            </p>

          </div>

          <span
            className="
              rounded-full
              border
              border-yellow-400/20
              bg-yellow-400/10
              px-4
              py-2
              text-sm
              font-bold
              text-yellow-400
            "
          >
            18 فيلا
          </span>

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

        {/* =========================
            RIGHT - ICON
        ========================= */}

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


        {/* =========================
            LEFT - TEXT
        ========================= */}

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

      {/* =================================================
          VILLA HEADER
      ================================================= */}

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


      {/* =================================================
          VILLA BODY
      ================================================= */}

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


      {/* =================================================
          ACTION BUTTONS - ALWAYS AT BOTTOM
      ================================================= */}

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