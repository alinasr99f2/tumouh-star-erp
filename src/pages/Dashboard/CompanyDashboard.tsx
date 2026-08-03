import DashboardHero from "../../components/dashboard/DashboardHero";
import StatsCards from "../../components/dashboard/StatsCards";
import RevenueChart from "../../components/dashboard/RevenueChart";
import ProjectsSection from "../../components/dashboard/ProjectsSection";
import ActivitiesSection from "../../components/dashboard/ActivitiesSection";
import QuickStats from "../../components/dashboard/QuickStats";
import UpcomingTasks from "../../components/dashboard/UpcomingTasks";

export default function CompanyDashboard() {
  return (
    <div className="flex flex-col gap-6 w-full">

      <DashboardHero />

      <StatsCards />

      <div className="flex flex-col xl:flex-row gap-6">

        <div className="flex-1 min-w-0">
          <RevenueChart />
        </div>

        <div className="w-full xl:w-[380px] shrink-0">
          <QuickStats />
        </div>

      </div>

      <div className="flex flex-col xl:flex-row gap-6">

        <div className="flex-1 min-w-0">
          <ProjectsSection />
        </div>

        <div className="w-full xl:w-[380px] shrink-0">
          <ActivitiesSection />
        </div>

      </div>

      <UpcomingTasks />

    </div>
  );
}