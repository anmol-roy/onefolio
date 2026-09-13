import { NextResponse } from "next/server";
import { Portfolio } from "@/lib/portfolio";
import { fetchAllLiveData } from "@/lib/fetchLiveData";
import { Cache } from "@/lib/cache";
import type { ApiStock, ApiPortfolioResponse } from "@/types/portfolio";

// ─── module-level cache ───────────────────────────────────────────────────────
// shared across all requests in the same Node process
// fresh for 15s, stale-while-revalidate up to 60s

export const portfolioCache = new Cache<ApiPortfolioResponse>({
  ttlMs:   15_000,
  staleMs: 60_000,
});

// ─── builder — merges live quotes onto static workbook data ───────────────────

async function buildResponse(): Promise<ApiPortfolioResponse> {
  const t0 = Date.now();

  const symbolList = Portfolio.map((s) => ({
    symbol:   s.exchangeSymbol,
    exchange: s.exchange,
  }));

  // fetch yahoo + google in parallel, with timeouts + retry built in
  const liveResult = await fetchAllLiveData(symbolList);

  const totalInvestment = Portfolio.reduce(
    (sum, s) => sum + s.buyPrice * s.qty,
    0
  );

  const stocks: ApiStock[] = Portfolio.map((s) => {
    const live = liveResult.quotes.get(s.exchangeSymbol);

    const livePrice       = live?.cmp            ?? s.currentPrice;
    const investment      = s.buyPrice * s.qty;
    const presentValue    = livePrice * s.qty;
    const gainLoss        = presentValue - investment;
    const gainLossPercent = investment > 0 ? (gainLoss / investment) * 100 : 0;
    const portfolioPercent = totalInvestment > 0
      ? (investment / totalInvestment) * 100
      : 0;

    return {
      ...s,
      investment,
      presentValue,
      gainLoss,
      gainLossPercent,
      portfolioPercent,
      livePrice,
      livePe:             live?.pe             ?? s.pe,
      liveEarnings:       live?.latestEarnings ?? s.latestEarnings,
      priceSource:        (live?.source.cmp         ?? "workbook") as "yahoo" | "workbook",
      fundamentalsSource: (live?.source.fundamentals ?? "workbook") as "google" | "workbook",
      lastUpdated:        live?.fetchedAt ?? Date.now(),
    };
  });

  // convert structured FetchErrors to human-readable strings for the client
  const errors = liveResult.errors.map(
    (e) => `${e.symbol} [${e.source}]: ${e.reason}`
  );

  return {
    stocks,
    fetchedAt:    Date.now(),
    fetchDuration: Date.now() - t0,
    errors,
  };
}

// ─── GET /api/portfolio ────────────────────────────────────────────────────────

export async function GET() {
  // 1. fresh cache hit — serve immediately
  const fresh = portfolioCache.getFresh();
  if (fresh) {
    return NextResponse.json(fresh.data, {
      headers: {
        "X-Cache":    "HIT",
        "X-Cache-Age": String(portfolioCache.ageMs),
        "Cache-Control": "no-store",
      },
    });
  }

  // 2. stale-while-revalidate — serve stale data instantly,
  //    kick off background refresh so next request gets fresh data
  const stale = portfolioCache.getStale();
  if (stale && !portfolioCache.isRevalidating) {
    portfolioCache.setRevalidating(true);

    // fire and forget — dont await
    buildResponse()
      .then((data) => {
        portfolioCache.set(data, data.fetchDuration ?? 0);
      })
      .catch((err) => {
        console.error("[portfolio] background revalidation failed:", err);
      })
      .finally(() => {
        portfolioCache.setRevalidating(false);
      });

    return NextResponse.json(stale.data, {
      headers: {
        "X-Cache":     "STALE",
        "X-Cache-Age": String(portfolioCache.ageMs),
        "Cache-Control": "no-store",
      },
    });
  }

  // 3. cache miss or expired — fetch synchronously
  try {
    const data = await buildResponse();
    portfolioCache.set(data, data.fetchDuration ?? 0);

    return NextResponse.json(data, {
      headers: {
        "X-Cache":    "MISS",
        "X-Cache-Age": "0",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    // complete failure — return structured error with fallback workbook data
    console.error("[portfolio] GET failed:", err);

    const fallback = buildFallbackResponse();
    return NextResponse.json(fallback, {
      status: 503,
      headers: {
        "X-Cache":       "ERROR",
        "Cache-Control": "no-store",
        "Retry-After":   "15",
      },
    });
  }
}

// ─── fallback — pure workbook data when all live fetches fail ─────────────────

function buildFallbackResponse(): ApiPortfolioResponse {
  const totalInvestment = Portfolio.reduce(
    (sum, s) => sum + s.buyPrice * s.qty, 0
  );

  const stocks: ApiStock[] = Portfolio.map((s) => {
    const investment      = s.buyPrice * s.qty;
    const presentValue    = s.currentPrice * s.qty;
    const gainLoss        = presentValue - investment;
    const gainLossPercent = investment > 0 ? (gainLoss / investment) * 100 : 0;
    const portfolioPercent = totalInvestment > 0
      ? (investment / totalInvestment) * 100
      : 0;

    return {
      ...s,
      investment,
      presentValue,
      gainLoss,
      gainLossPercent,
      portfolioPercent,
      livePrice:          s.currentPrice,
      livePe:             s.pe,
      liveEarnings:       s.latestEarnings,
      priceSource:        "workbook" as const,
      fundamentalsSource: "workbook" as const,
      lastUpdated:        Date.now(),
    };
  });

  return {
    stocks,
    fetchedAt:     Date.now(),
    fetchDuration: 0,
    errors:        ["All live data sources unavailable — showing workbook values"],
  };
}
