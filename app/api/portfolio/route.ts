import { NextResponse } from "next/server";
import { Portfolio } from "@/lib/portfolio";
import { fetchAllLiveData } from "@/lib/fetchLiveData";
import type { ApiStock, ApiPortfolioResponse } from "@/types/portfolio";

// ─── simple in-memory cache ───────────────────────────────────────────────────
// next.js edge doesnt have a shared cache by default so we keep it module-level
// this means the cache lives as long as the server process does

type CacheEntry = {
  data: ApiPortfolioResponse;
  cachedAt: number;
};

let cache: CacheEntry | null = null;

// 15 seconds — matches the auto-refresh interval on the frontend
const CACHE_TTL_MS = 15_000;

function isCacheValid(): boolean {
  if (!cache) return false;
  return Date.now() - cache.cachedAt < CACHE_TTL_MS;
}

// ─── route handler ────────────────────────────────────────────────────────────

export async function GET() {
  // serve from cache if still fresh
  if (isCacheValid() && cache) {
    return NextResponse.json(cache.data, {
      headers: {
        "X-Cache": "HIT",
        "Cache-Control": "no-store", // dont let the browser cache it
      },
    });
  }

  const errors: string[] = [];

  // build the symbol list from our holdings
  const symbolList = Portfolio.map((s) => ({
    symbol: s.exchangeSymbol,
    exchange: s.exchange,
  }));

  // fetch live data — this might take a few seconds
  let liveMap = new Map<string, ReturnType<typeof Object.assign>>();
  try {
    liveMap = await fetchAllLiveData(symbolList);
  } catch (err) {
    // if the whole fetch explodes, fall back to workbook data for everything
    errors.push(`Live data fetch failed: ${String(err)}`);
  }

  // calc total investment for portfolio % derivation
  const totalInvestment = Portfolio.reduce(
    (sum, s) => sum + s.buyPrice * s.qty,
    0
  );

  // merge live data with static workbook data
  const stocks: ApiStock[] = Portfolio.map((s) => {
    const live = liveMap.get(s.exchangeSymbol);

    // use live cmp if available, otherwise fall back to workbook price
    const livePrice = live?.cmp ?? s.currentPrice;

    const investment      = s.buyPrice * s.qty;
    const presentValue    = livePrice * s.qty;
    const gainLoss        = presentValue - investment;
    const gainLossPercent = investment > 0 ? (gainLoss / investment) * 100 : 0;
    const portfolioPercent = totalInvestment > 0
      ? (investment / totalInvestment) * 100
      : 0;

    // track if yahoo failed for this symbol
    if (!live?.cmp) {
      errors.push(`${s.exchangeSymbol}: using workbook price (yahoo unavailable)`);
    }

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
      priceSource:        live?.source.cmp         ?? "workbook",
      fundamentalsSource: live?.source.fundamentals ?? "workbook",
      lastUpdated:        live?.fetchedAt ?? Date.now(),
    };
  });

  const response: ApiPortfolioResponse = {
    stocks,
    fetchedAt: Date.now(),
    errors,
  };

  // update the cache
  cache = { data: response, cachedAt: Date.now() };

  return NextResponse.json(response, {
    headers: {
      "X-Cache": "MISS",
      "Cache-Control": "no-store",
    },
  });
}
