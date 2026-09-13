import { PortfolioHolding } from "@/types/portfolio";

export interface PortfolioRow extends PortfolioHolding {
  investment: number;
  presentValue: number;
  gainLoss: number;
  gainLossPercentage: number;
  isLoss: boolean;
}

export function calculateInvestment(buyPrice: number, quantity: number): number {
  return buyPrice * quantity;
}

export function calculatePresentValue(currentPrice: number, quantity: number): number {
  return currentPrice * quantity;
}

export function calculateGainLoss(presentValue: number, investment: number): number {
  return presentValue - investment;
}

export function calculateGainLossPercentage(gainLoss: number, investment: number): number {
  if (investment === 0) return 0;
  return (gainLoss / investment) * 100;
}

export function buildPortfolioRows(portfolio: PortfolioHolding[]): PortfolioRow[] {
  return portfolio.map((stock) => {
    const investment = calculateInvestment(stock.buyPrice, stock.qty);
    const presentValue = calculatePresentValue(stock.currentPrice, stock.qty);
    const gainLoss = calculateGainLoss(presentValue, investment);
    const gainLossPercentage = calculateGainLossPercentage(gainLoss, investment);

    return {
      ...stock,
      investment,
      presentValue,
      gainLoss,
      gainLossPercentage,
      isLoss: gainLoss < 0,
    };
  });
}
