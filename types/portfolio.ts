// base shape for each holding — matches the workbook columns
export type Stock = {
  id: number;
  particulars: string;        // company name
  sector: string;
  buyPrice: number;
  qty: number;
  exchangeSymbol: string;     // NSE / BSE ticker
  exchange: "NSE" | "BSE";
  currentPrice: number;       // cmp — will be live from yahoo later
  pe: number | null;          // p/e ttm, null if not available
  latestEarnings: number | null; // eps, null if not available
};

// alias kept so summaryCalculation doesnt break
export type PortfolioHolding = Stock;

// everything we calc on the fly from the base data
export type StockRow = Stock & {
  investment: number;          // buyPrice * qty
  presentValue: number;        // currentPrice * qty
  gainLoss: number;            // presentValue - investment
  gainLossPercent: number;     // (gainLoss / investment) * 100
  portfolioPercent: number;    // investment / totalInvestment * 100
};
