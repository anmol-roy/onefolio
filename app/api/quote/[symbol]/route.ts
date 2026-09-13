import { NextResponse } from "next/server";
import { Portfolio } from "@/lib/portfolio";
import { fetchYahooBatch, fetchGoogleBatch } from "@/lib/fetchLiveData";

// single-symbol refresh endpoint
// used when the user manually clicks refresh on one row
// GET /api/quote/HDFCBANK

// next 15 made params a Promise — have to await it
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  // find the holding so we know the exchange
  const holding = Portfolio.find(
    (s) => s.exchangeSymbol.toUpperCase() === symbol
  );

  if (!holding) {
    return NextResponse.json(
      { error: `Symbol ${symbol} not found in portfolio` },
      { status: 404 }
    );
  }

  const input = [{ symbol, exchange: holding.exchange }];

  // fetch both sources in parallel
  const [cmpMap, fundMap] = await Promise.all([
    fetchYahooBatch(input).catch(() => new Map()),
    fetchGoogleBatch(input).catch(() => new Map()),
  ]);

  const cmp  = cmpMap.get(symbol)  ?? null;
  const fund = fundMap.get(symbol) ?? { pe: null, eps: null };

  return NextResponse.json({
    symbol,
    cmp,
    pe:             fund.pe,
    latestEarnings: fund.eps,
    fetchedAt:      Date.now(),
    source: {
      cmp:          cmp !== null ? "yahoo"  : "workbook",
      fundamentals: fund.pe !== null ? "google" : "workbook",
    },
  });
}
