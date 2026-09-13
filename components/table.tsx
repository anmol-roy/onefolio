import { Portfolio } from "@/lib/portfolio";

export default function Table() {
  return (
    <main style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <thead style={{ background: "#f3f4f6" }}>
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
          {Portfolio.map((stock) => {
            const investment = stock.buyPrice * stock.qty;
            const presentValue = stock.currentPrice * stock.qty;
            const profit = presentValue - investment;
            const profitPercentage = investment > 0 ? ((profit / investment) * 100).toFixed(2) : "0.00";
            const isLoss = profit < 0;

            return (
              <tr key={stock.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "12px 16px" }}>{stock.particulars}</td>
                <td style={{ padding: "12px 16px" }}>₹{stock.buyPrice}</td>
                <td style={{ padding: "12px 16px" }}>{stock.qty}</td>
                <td style={{ padding: "12px 16px" }}>₹{stock.currentPrice}</td>
                <td style={{ padding: "12px 16px" }}>₹{investment}</td>
                <td style={{ padding: "12px 16px" }}>₹{presentValue}</td>
                <td
                  style={{
                    padding: "12px 16px",
                    color: isLoss ? "#dc2626" : "#16a34a",
                    fontWeight: "600",
                  }}
                >
                  ₹{profit}
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    color: isLoss ? "#dc2626" : "#16a34a",
                    fontWeight: "600",
                  }}
                >
                  {profitPercentage}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}