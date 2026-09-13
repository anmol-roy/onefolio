import { PortfolioSummary } from "@/lib/summaryCalculation";
import { formatCompactIndianCurrency } from "@/lib/utils";

interface SummaryCardsProps {
  summary: PortfolioSummary;
}

interface CardProps {
  title: string;
  value: string;
  sub?: string;
  accent?: "neutral" | "positive" | "negative";
}

function Card({ title, value, sub, accent = "neutral" }: CardProps) {
  const valueColor =
    accent === "positive" ? "text-[#1a7a4a]" :
    accent === "negative" ? "text-[#c0392b]" :
    "text-[#1a2e2d]";

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[#d8d2c8] bg-[#f5f1eb] px-4 py-3.5 shadow-sm">
      <div className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-[#8a9a98]">
        {title}
      </div>
      <div className={`text-xl font-bold tracking-tight ${valueColor}`}>
        {value}
      </div>
      {sub && (
        <div className={`text-[0.7rem] font-medium ${valueColor} opacity-70`}>{sub}</div>
      )}
    </div>
  );
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const pos = summary.totalGainLoss >= 0;

  return (
    <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      <Card
        title="Total Invested"
        value={formatCompactIndianCurrency(summary.totalInvestment)}
      />
      <Card
        title="Present Value"
        value={formatCompactIndianCurrency(summary.totalPresentValue)}
      />
      <Card
        title="Gain / Loss"
        value={`${pos ? "+" : ""}${formatCompactIndianCurrency(summary.totalGainLoss)}`}
        sub={`${pos ? "+" : ""}${summary.totalGainLossPercentage.toFixed(2)}%`}
        accent={pos ? "positive" : "negative"}
      />
      <Card
        title="Holdings"
        value={String(summary.totalHoldings)}
        sub="positions"
      />
    </div>
  );
}
