import yahooFinance from "yahoo-finance2";
import type { LiveQuote } from "@/types/portfolio";

// ─── yahoo finance — cmp ────────────────────────────────────────────────────

// maps our internal symbols to the yahoo ticker format
// NSE stocks need ".NS" suffix, BSE get ".BO"
function toYahooSymbol(symbol: string, exchange: "NSE" | "BSE"): string {
  return exchange === "NSE" ? `${symbol}.NS` : `${symbol}.BO`;
}

// fetch a batch of quotes in one request — yahoo supports multi-symbol
export async function fetchYahooBatch(
  symbols: { symbol: string; exchange: "NSE" | "BSE" }[]
): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>();

  // build the yahoo ticker list
  const tickers = symbols.map((s) => toYahooSymbol(s.symbol, s.exchange));

  try {
    // yahoo-finance2 supports array input — fetches all in one go
    const results = await yahooFinance.quote(tickers, {
      fields: ["regularMarketPrice", "symbol"],
    });

    // results can be array or single object depending on input
    // cast to any[] here — yahoo-finance2 union types are complex and
    // the actual shape at runtime always has regularMarketPrice + symbol
    const arr = (Array.isArray(results) ? results : [results]) as {
      symbol?: string;
      regularMarketPrice?: number;
    }[];

    for (const r of arr) {
      if (!r || !r.regularMarketPrice) continue;

      // strip the .NS/.BO suffix to get back our internal symbol
      const clean = r.symbol?.replace(/\.(NS|BO)$/, "") ?? "";
      if (clean) priceMap.set(clean, r.regularMarketPrice);
    }
  } catch (err) {
    // log but dont crash — we fall back to workbook prices
    console.error("[yahoo] batch fetch failed:", err);
  }

  return priceMap;
}

// ─── google finance — pe + earnings ─────────────────────────────────────────
// google doesnt have a public api so we scrape the finance page
// the data is embedded as json in a <script> tag on the page

type GoogleFundamentals = {
  pe: number | null;
  eps: number | null;
};

async function scrapeGoogleFinance(
  symbol: string,
  exchange: "NSE" | "BSE"
): Promise<GoogleFundamentals> {
  // google finance url format: /quote/SYMBOL:NSE or :BSE
  const url = `https://www.google.com/finance/quote/${symbol}:${exchange}`;

  try {
    const res = await fetch(url, {
      headers: {
        // pretend to be a browser or google wont return the full page
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 0 }, // no caching at fetch level, we handle it above
    });

    if (!res.ok) return { pe: null, eps: null };

    const html = await res.text();

    // google embeds key stats in the page as visible text in data cells
    // pattern: find "P/E ratio" and "EPS" sections
    const pe  = extractGoogleStat(html, "P/E ratio");
    const eps = extractGoogleStat(html, "EPS");

    return { pe, eps };
  } catch (err) {
    console.error(`[google] scrape failed for ${symbol}:`, err);
    return { pe: null, eps: null };
  }
}

// pull a numeric stat value from google finance html
// google puts stats in a consistent pattern: label then value in adjacent divs
function extractGoogleStat(html: string, label: string): number | null {
  try {
    // find the label text then grab the next numeric-looking value nearby
    const labelIdx = html.indexOf(label);
    if (labelIdx === -1) return null;

    // look in the next ~200 chars for a number pattern
    const slice = html.slice(labelIdx, labelIdx + 300);

    // match patterns like 18.69 or -5.82 or 257.80
    const match = slice.match(/>([-]?\d+\.?\d*)</);
    if (!match) return null;

    const val = parseFloat(match[1]);
    return isNaN(val) ? null : val;
  } catch {
    return null;
  }
}

// batch fetch google fundamentals — done concurrently but rate-limited
// we dont want to hammer google with 26 parallel requests
export async function fetchGoogleBatch(
  symbols: { symbol: string; exchange: "NSE" | "BSE" }[]
): Promise<Map<string, GoogleFundamentals>> {
  const result = new Map<string, GoogleFundamentals>();

  // process in groups of 5 to be nice to google
  const chunkSize = 5;
  for (let i = 0; i < symbols.length; i += chunkSize) {
    const chunk = symbols.slice(i, i + chunkSize);

    const settled = await Promise.allSettled(
      chunk.map((s) => scrapeGoogleFinance(s.symbol, s.exchange))
    );

    settled.forEach((res, idx) => {
      const sym = chunk[idx].symbol;
      if (res.status === "fulfilled") {
        result.set(sym, res.value);
      } else {
        result.set(sym, { pe: null, eps: null });
      }
    });

    // small pause between chunks so we dont get rate-limited
    if (i + chunkSize < symbols.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return result;
}

// ─── combined fetch ───────────────────────────────────────────────────────────

// fetches both yahoo cmp and google fundamentals and returns a merged map
export async function fetchAllLiveData(
  holdings: { symbol: string; exchange: "NSE" | "BSE" }[]
): Promise<Map<string, LiveQuote>> {
  // run yahoo and google in parallel — they dont depend on each other
  const [cmps, fundamentals] = await Promise.all([
    fetchYahooBatch(holdings),
    fetchGoogleBatch(holdings),
  ]);

  const merged = new Map<string, LiveQuote>();

  for (const h of holdings) {
    const cmp  = cmps.get(h.symbol) ?? null;
    const fund = fundamentals.get(h.symbol) ?? { pe: null, eps: null };

    merged.set(h.symbol, {
      symbol: h.symbol,
      cmp,
      pe:             fund.pe,
      latestEarnings: fund.eps,
      fetchedAt:      Date.now(),
      source: {
        cmp:          cmp !== null ? "yahoo" : "workbook",
        fundamentals: fund.pe !== null ? "google" : "workbook",
      },
    });
  }

  return merged;
}
