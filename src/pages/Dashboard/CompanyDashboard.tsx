import DashboardHero from "../../components/dashboard/DashboardHero";
import StatsCards from "../../components/dashboard/StatsCards";
import ProjectsSection from "../../components/dashboard/ProjectsSection";

export default function CompanyDashboard() {
  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* ========================= */}
      {/* خلفية لوجو الشركة */}
      {/* ========================= */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          z-0
          overflow-hidden
          flex
          items-center
          justify-center
        "
      >
        <img
          src="/logo.png"
          alt=""
          draggable="false"
          className="
            absolute
            w-[120vw]
            h-[120vh]
            max-w-none
            object-cover
            select-none
            opacity-[0.08]
            animate-logo-float
            mix-blend-screen
          "
        />
      </div>

      {/* ========================= */}
      {/* محتوى لوحة التحكم */}
      {/* ========================= */}

      <div className="relative z-10">

        {/* الترحيب */}
        <DashboardHero />

        {/* الإحصائيات الرئيسية */}
        <StatsCards />

        {/* المشاريع النشطة */}
        <ProjectsSection />

      </div>

    </div>
  );
}