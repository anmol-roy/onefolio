import { NextResponse } from "next/server";
import { portfolioCache } from "@/app/api/portfolio/route";
import { Portfolio } from "@/lib/portfolio";

// GET /api/health
// shows the live states  of the caseche + data sources
// useful during evaluation to verify the API strategy is working

export async function GET() {
  const entry = portfolioCache.getStale(); // get whatever we have, fresh or stale
  const cached = entry?.data;

  // count per-source coverage from the last cached response
  const yahooCount  = cached?.stocks.filter((s) => s.priceSource        === "yahoo").length  ?? 0;
  const googleCount = cached?.stocks.filter((s) => s.fundamentalsSource === "google").length ?? 0;
  const total       = Portfolio.length;

  const cacheAge    = portfolioCache.ageMs;
  const isFresh     = cacheAge >= 0 && cacheAge < 15_000;

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),

    cache: {
      state:        cacheAge < 0 ? "empty" : isFresh ? "fresh" : "stale",
      ageMs:        cacheAge < 0 ? null : cacheAge,
      lastFetchedAt: cached?.fetchedAt
        ? new Date(cached.fetchedAt).toISOString()
        : null,
      fetchDurationMs: cached?.fetchDuration ?? null,
    },

    dataSources: {
      yahooFinance: {
        strategy:    "unofficial — yahoo-finance2 npm package, batched single request, 2 retries with exponential backoff, 8s timeout",
        symbolsLive: yahooCount,
        symbolsTotal: total,
        coverage:    `${yahooCount}/${total}`,
      },
      googleFinance: {
        strategy:    "HTML scraping — regex extraction of P/E + EPS from finance page, chunked 5 at a time, 400ms pause between chunks, 5s per-request timeout",
        symbolsLive: googleCount,
        symbolsTotal: total,
        coverage:    `${googleCount}/${total}`,
      },
      workbookFallback: {
        strategy:    "static data from portfolio.xlsx — used whenever a live provider fails or returns no data",
        symbolsFalling: total - Math.max(yahooCount, googleCount),
      },
    },

    rateLimitHandling: {
      yahoo:  "batched into 1 req uest (26 symbols at once), exponential backoff on failure",
      google: "chunked into groups of 5, 400ms delay between chunks, per-request timeout",
      cache:  "15s TTL with 60s stale-while-revalidate window — upstream only hit once per 15s regardless of traffic",
    },

    errors: cached?.errors ?? [],
  });
}
