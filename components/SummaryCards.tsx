import { PortfolioSummary } from "@/lib/summaryCalculation";
import { formatIndianCurrency, formatPercentage } from "@/lib/utils";

interface SummaryCardsProps {
  summary: PortfolioSummary;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      title: "Total Investment",
      value: formatIndianCurrency(summary.totalInvestment),
    },
    {
      title: "Current Portfolio Value",
      value: formatIndianCurrency(summary.totalPresentValue),
    },
    {
      title: "Total Gain/Loss",
      value: formatIndianCurrency(summary.totalGainLoss),
      isPositive: summary.totalGainLoss >= 0,
    },
    {
      title: "Total Gain/Loss %",
      value: formatPercentage(summary.totalGainLossPercentage),
      isPositive: summary.totalGainLossPercentage >= 0,
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      {cards.map((card) => (
        <div
          key={card.title}
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              color: "#6b7280",
              fontSize: "14px",
              marginBottom: "12px",
              fontWeight: "600",
            }}
          >
            {card.title}
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: card.isPositive === undefined ? "#111827" : card.isPositive ? "#16a34a" : "#dc2626",
            }}
          >
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}