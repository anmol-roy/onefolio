import SummaryCards from "@/components/SummaryCards";
import Table from "@/components/table";
import { Portfolio } from "@/lib/portfolio";
import { calculatePortfolioSummary } from "@/lib/summaryCalculation";

export default function Page() {
  const summary = calculatePortfolioSummary(Portfolio);

  return (
    <main style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "24px" }}>Portfolio dashboard</h1>
      <SummaryCards summary={summary} />
      <Table />
    </main>
  );
}