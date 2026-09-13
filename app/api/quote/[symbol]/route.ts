import { NextResponse } from "next/server";
import { Portfolio } from "@/lib/portfolio";
import { fetchYahooBatch, fetchGoogleBatch } from "@/lib/fetchLiveData";

// GET /api/quote/[symbol]
// single-symbol refresh — used for per-row manual refresh
// example: GET /api/quote/HDFCBANK

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  // next 15 — params is a Promise, must await
  const { symbol: raw } = await params;
  const symbol = raw.toUpperCase();

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

  // run both in parallel — they're independent
  const [yahooResult, googleResult] = await Promise.all([
    fetchYahooBatch(input).catch(() => ({
      prices: new Map<string, number>(),
      errors: [],
    })),
    fetchGoogleBatch(input).catch(() => ({
      fundamentals: new Map<string, { pe: number | null; eps: number | null }>(),
      errors: [],
    })),
  ]);

  const cmp  = yahooResult.prices.get(symbol)          ?? null;
  const fund = googleResult.fundamentals.get(symbol)   ?? { pe: null, eps: null };

  const allErrors = [
    ...yahooResult.errors.map((e) => `${e.source}: ${e.reason}`),
    ...googleResult.errors.map((e) => `${e.source}: ${e.reason}`),
  ];

  return NextResponse.json({
    symbol,
    cmp,
    pe:             fund.pe,
    latestEarnings: fund.eps,
    fetchedAt:      Date.now(),
    errors:         allErrors,
    source: {
      cmp:          cmp !== null     ? "yahoo"  : "workbook",
      fundamentals: fund.pe !== null ? "google" : "workbook",
    },
  });
}
