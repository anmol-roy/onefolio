import { PortfolioSummary } from "@/lib/summaryCalculation";
import { formatCompactIndianCurrency } from "@/lib/utils";

interface SummaryCardsProps {
  summary: PortfolioSummary;
}

interface SummaryCardProps {
  title: string;
  value: string;
  accent?: "neutral" | "positive" | "negative";
}

function SummaryCard({ title, value, accent = "neutral" }: SummaryCardProps) {
  const colorMap = {
    neutral: "#1f2937",
    positive: "#16a34a",
    negative: "#dc2626",
  };

  return (
    <div
      style={{
        background: "#f3f4f6",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "18px 20px",
        minHeight: "120px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          color: "#6b7280",
          fontSize: "12px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: colorMap[accent],
          fontSize: "28px",
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const cards: SummaryCardProps[] = [
    {
      title: "Total Invested",
      value: formatCompactIndianCurrency(summary.totalInvestment),
    },
    {
      title: "Present Value",
      value: formatCompactIndianCurrency(summary.totalPresentValue),
    },
    {
      title: "Total Gain/Loss",
      value: formatCompactIndianCurrency(summary.totalGainLoss),
      accent: summary.totalGainLoss >= 0 ? "positive" : "negative",
    },
    {
      title: "Holdings",
      value: String(summary.totalHoldings),
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
        <SummaryCard
          key={card.title}
          title={card.title}
          value={card.value}
          accent={card.accent}
        />
      ))}
    </div>
  );
}