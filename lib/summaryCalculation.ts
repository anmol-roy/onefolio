import { PortfolioHolding } from "@/types/portfolio";

export interface PortfolioSummary {
  totalInvestment: number;
  totalPresentValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  totalHoldings: number;
}

export function calculatePortfolioSummary(portfolio: PortfolioHolding[]): PortfolioSummary {
  const totalInvestment = portfolio.reduce(
    (sum, stock) => sum + stock.buyPrice * stock.qty,
    0,
  );

  const totalPresentValue = portfolio.reduce(
    (sum, stock) => sum + stock.currentPrice * stock.qty,
    0,
  );

  const totalGainLoss = totalPresentValue - totalInvestment;

  const totalGainLossPercentage =
    totalInvestment === 0 ? 0 : (totalGainLoss / totalInvestment) * 100;

  return {
    totalInvestment,
    totalPresentValue,
    totalGainLoss,
    totalGainLossPercentage,
    totalHoldings: portfolio.length,
  };
}