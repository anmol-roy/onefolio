export interface PortfolioHolding {
    id: string | number ;
    particular: string;

    buyPrice: number;
    qty: number ;
    currentPrice: number; 
    exchangeSymbol: string;   
    exchange: 'NSE' | 'BSE'; 
    symbol?: string;         

}