import DashboardHeader from "@/components/DashboardHeader";
import SummaryCards from "@/components/dashboard/SummaryCards";
import { Portfolio } from "@/lib/portfolio";
import { calculatePortfolioSummary } from "@/lib/summaryCalculation";

export default function MainLayout() {
  const summary = calculatePortfolioSummary(Portfolio);

  return (
    <main className="flex-1 bg-[#e9e3da] p-6 md:p-8 lg:p-10">
      <DashboardHeader />
      <SummaryCards summary={summary} />
    </main>
  );
}