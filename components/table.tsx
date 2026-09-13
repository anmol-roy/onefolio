import { Portfolio } from "@/lib/portfolio";
import { buildPortfolioRows } from "@/lib/calculations";
import { formatIndianCurrency, formatPercentage } from "@/lib/utils";

export default function Table() {
  const rows = buildPortfolioRows(Portfolio);

  return (
    <main style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          overflow: "hidden",
          background: "#dca2a2",
        }}
      >
        <thead style={{ background: "#132d60" }}>
          <tr>
            <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Stock</th>
            <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Buy Price</th>
            <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Qty</th>
            <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Current Price</th>
            <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Investment</th>
            <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Present Value</th>
            <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Gain / Loss</th>
            <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Gain / Loss %</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((stock) => (
            <tr key={stock.id} style={{ borderBottom: "1px solid #15377a" }}>
              <td style={{ padding: "12px 16px" }}>{stock.particular}</td>
              <td style={{ padding: "12px 16px" }}>{formatIndianCurrency(stock.buyPrice)}</td>
              <td style={{ padding: "12px 16px" }}>{stock.qty}</td>
              <td style={{ padding: "12px 16px" }}>{formatIndianCurrency(stock.currentPrice)}</td>
              <td style={{ padding: "12px 16px" }}>{formatIndianCurrency(stock.investment)}</td>
              <td style={{ padding: "12px 16px" }}>{formatIndianCurrency(stock.presentValue)}</td>
              <td
                style={{
                  padding: "12px 16px",
                  color: stock.isLoss ? "#dc2626" : "#16a34a",
                  fontWeight: "600",
                }}
              >
                {formatIndianCurrency(stock.gainLoss)}
              </td>
              <td
                style={{
                  padding: "12px 16px",
                  color: stock.isLoss ? "#dc2626" : "#16a34a",
                  fontWeight: "600",
                }}
              >
                {formatPercentage(stock.gainLossPercentage)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}