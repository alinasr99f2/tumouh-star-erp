import DashboardHero from "../../components/dashboard/DashboardHero";
import StatsCards from "../../components/dashboard/StatsCards";
import ProjectsSection from "../../components/dashboard/ProjectsSection";

export default function CompanyDashboard() {
  return (
    <div className="space-y-6">

      {/* الترحيب */}
      <DashboardHero />

      {/* الإحصائيات الرئيسية */}
      <StatsCards />

      {/* المشاريع النشطة */}
      <ProjectsSection />

    </div>
  );
}