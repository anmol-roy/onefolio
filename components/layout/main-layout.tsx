import DashboardHeader from "@/components/DashboardHeader";
import SummaryCards from "@/components/dashboard/SummaryCards";
import { Portfolio } from "@/lib/portfolio";
import { calculatePortfolioSummary } from "@/lib/summaryCalculation";
import Table from "@/components/table";

export default function MainLayout() {
  // calc once here, pass down — avoids doing it inside each child
  const summary = calculatePortfolioSummary(Portfolio);

  return (
    <main className="flex-1 overflow-y-auto bg-[#e9e3da] p-6 md:p-8 lg:p-10">
      <DashboardHeader />
      <SummaryCards summary={summary} />
      <Table />
    </main>
  );
}
