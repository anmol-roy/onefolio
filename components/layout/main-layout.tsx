import DashboardHeader from "@/components/DashboardHeader";
import SummaryCards from "@/components/dashboard/SummaryCards";
import { Portfolio } from "@/lib/portfolio";
import { calculatePortfolioSummary } from "@/lib/summaryCalculation";
import Table from "@/components/table";

export default function MainLayout() {
  const summary = calculatePortfolioSummary(Portfolio);

  return (
    // overflow-y-auto here so the sidebar stays sticky while this scrolls
    <main className="flex-1 overflow-y-auto bg-[#eae5dc] px-5 py-5 md:px-8 md:py-6">
      <DashboardHeader />
      <SummaryCards summary={summary} />
      <Table />
    </main>
  );
}
