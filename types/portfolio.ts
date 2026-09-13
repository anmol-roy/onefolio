// base shape for each holding — matches the workbook columns
export type Stock = {
  id: number;
  particulars: string;           // company name
  sector: string;
  buyPrice: number;
  qty: number;
  exchangeSymbol: string;        // NSE / BSE ticker
  exchange: "NSE" | "BSE";
  currentPrice: number;          // fallback cmp from workbook
  pe: number | null;             // p/e ttm fallback
  latestEarnings: number | null; // eps fallback
};

// alias kept so summaryCalculation doesnt break
export type PortfolioHolding = Stock;

// what we get back from yahoo + google for a single symbol
export type LiveQuote = {
  symbol: string;
  cmp: number | null;
  pe: number | null;
  latestEarnings: number | null;
  fetchedAt: number; // unix ms timestamp
  source: {
    cmp: "yahoo" | "workbook";
    fundamentals: "google" | "workbook";
  };
};

// what the /api/portfolio endpoint returns per stock
export type ApiStock = Stock & {
  investment: number;
  presentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  portfolioPercent: number;
  // live fields — override the workbook defaults when available
  livePrice: number;       // yahoo cmp if available, else buyPrice fallback
  livePe: number | null;
  liveEarnings: number | null;
  priceSource: "yahoo" | "workbook";
  fundamentalsSource: "google" | "workbook";
  lastUpdated: number;     // unix ms
};

// full response shape from /api/portfolio
export type ApiPortfolioResponse = {
  stocks: ApiStock[];
  fetchedAt: number;
  errors: string[];   // any symbols that failed so frontend can show a warning
};

// what the table uses after local derivation
export type StockRow = Stock & {
  investment: number;
  presentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  portfolioPercent: number;
};
