import { PortfolioSummary } from "@/lib/summaryCalculation";
import { formatCompactIndianCurrency } from "@/lib/utils";

interface SummaryCardsProps {
  summary: PortfolioSummary;
}

interface SummaryCardProps {
  title: string;
  value: string;
  sub?: string;
  accent?: "neutral" | "positive" | "negative";
}

function SummaryCard({ title, value, sub, accent = "neutral" }: SummaryCardProps) {
  const valueColor =
    accent === "positive" ? "text-[#1a7a4a]" :
    accent === "negative" ? "text-[#c0392b]" :
    "text-[#1a2e2d]";

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#d8d2c8] bg-[#f5f2ed] px-5 py-4 shadow-sm">
      <div className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#7a8a88]">
        {title}
      </div>
      <div className={`mt-3 text-2xl font-black tracking-tight ${valueColor}`}>
        {value}
      </div>
      {sub && (
        <div className={`mt-1 text-xs font-medium ${valueColor} opacity-70`}>{sub}</div>
      )}
    </div>
  );
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const gainPositive = summary.totalGainLoss >= 0;

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <SummaryCard
        title="Total Invested"
        value={formatCompactIndianCurrency(summary.totalInvestment)}
      />
      <SummaryCard
        title="Present Value"
        value={formatCompactIndianCurrency(summary.totalPresentValue)}
      />
      <SummaryCard
        title="Total Gain / Loss"
        value={`${gainPositive ? "+" : ""}${formatCompactIndianCurrency(summary.totalGainLoss)}`}
        sub={`${gainPositive ? "+" : ""}${summary.totalGainLossPercentage.toFixed(2)}%`}
        accent={gainPositive ? "positive" : "negative"}
      />
      <SummaryCard
        title="Holdings"
        value={String(summary.totalHoldings)}
        sub="positions"
      />
    </div>
  );
}
