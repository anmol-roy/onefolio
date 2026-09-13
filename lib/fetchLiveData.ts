import yahooFinance from "yahoo-finance2";
import type { LiveQuote } from "@/types/portfolio";

// ─── types ────────────────────────────────────────────────────────────────────

export type FetchError = {
  symbol: string;
  source: "yahoo" | "google";
  reason: string;
};

export type FetchResult = {
  quotes:   Map<string, LiveQuote>;
  errors:   FetchError[];
  durationMs: number;
};

type GoogleFundamentals = { pe: number | null; eps: number | null };

// ─── helpers ──────────────────────────────────────────────────────────────────

// wrap any promise with a hard timeout so one slow symbol can't block everything
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms)
    ),
  ]);
}

// simple exponential backoff — waits 2^attempt * 200ms, max 2s
async function sleep(attempt: number) {
  const ms = Math.min(200 * Math.pow(2, attempt), 2000);
  await new Promise((r) => setTimeout(r, ms));
}

// ─── yahoo finance ────────────────────────────────────────────────────────────

// NSE tickers get .NS suffix, BSE get .BO — standard Yahoo format
function toYahooTicker(symbol: string, exchange: "NSE" | "BSE"): string {
  return `${symbol}.${exchange === "NSE" ? "NS" : "BO"}`;
}

// fetch all CMPs in a single batched yahoo-finance2 request
// retries up to 2 times on failure with exponential backoff
export async function fetchYahooBatch(
  symbols: { symbol: string; exchange: "NSE" | "BSE" }[]
): Promise<{ prices: Map<string, number>; errors: FetchError[] }> {
  const prices = new Map<string, number>();
  const errors: FetchError[] = [];

  const tickers = symbols.map((s) => toYahooTicker(s.symbol, s.exchange));
  const MAX_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // 8 second hard timeout on the whole batch — yahoo can be slow
      const results = await withTimeout(
        yahooFinance.quote(tickers, { fields: ["regularMarketPrice", "symbol"] }),
        8_000,
        "yahoo batch"
      );

      // yahoo-finance2 returns array for multi-symbol, object for single
      const arr = (Array.isArray(results) ? results : [results]) as {
        symbol?: string;
        regularMarketPrice?: number;
      }[];

      for (const r of arr) {
        if (!r?.regularMarketPrice || !r.symbol) continue;
        // strip .NS / .BO to get our internal symbol back
        const sym = r.symbol.replace(/\.(NS|BO)$/, "");
        prices.set(sym, r.regularMarketPrice);
      }

      // success — no need to retry
      break;

    } catch (err) {
      const isLast = attempt === MAX_RETRIES;
      if (isLast) {
        // all retries exhausted — record per-symbol errors so caller knows
        for (const s of symbols) {
          if (!prices.has(s.symbol)) {
            errors.push({
              symbol: s.symbol,
              source: "yahoo",
              reason: err instanceof Error ? err.message : String(err),
            });
          }
        }
        console.error(`[yahoo] batch failed after ${MAX_RETRIES + 1} attempts:`, err);
      } else {
        console.warn(`[yahoo] attempt ${attempt + 1} failed, retrying…`);
        await sleep(attempt);
      }
    }
  }

  return { prices, errors };
}

// ─── google finance scraper ───────────────────────────────────────────────────
//
// Google Finance has no public API. We fetch the HTML page and extract
// P/E ratio and EPS from the structured data cells Google renders server-side.
//
// Rate limiting strategy:
//   - chunks of 5 concurrent requests
//   - 400ms pause between chunks
//   - 5s timeout per request
//   - graceful null fallback on any failure
//
// Known limitation: Google may change their HTML structure. If extraction
// returns null for all symbols, the workbook values are used as fallback.

async function scrapeGoogleFinance(
  symbol: string,
  exchange: "NSE" | "BSE"
): Promise<GoogleFundamentals> {
  const url = `https://www.google.com/finance/quote/${symbol}:${exchange}`;

  try {
    const res = await withTimeout(
      fetch(url, {
        headers: {
          // needs a browser UA or Google serves a stripped page
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept": "text/html,application/xhtml+xml",
        },
      }),
      5_000,
      `google ${symbol}`
    );

    if (!res.ok) {
      // 429 = rate limited — caller handles backoff
      if (res.status === 429) throw new Error("rate-limited");
      return { pe: null, eps: null };
    }

    const html = await res.text();
    return {
      pe:  extractGoogleStat(html, "P/E ratio"),
      eps: extractGoogleStat(html, "EPS"),
    };

  } catch (err) {
    // re-throw rate-limit so the batch loop can handle it
    if (err instanceof Error && err.message === "rate-limited") throw err;
    console.error(`[google] scrape failed for ${symbol}:`, err);
    return { pe: null, eps: null };
  }
}

// extract a single numeric stat from Google Finance HTML
// Google renders stats as label/value pairs in adjacent div elements
function extractGoogleStat(html: string, label: string): number | null {
  try {
    const idx = html.indexOf(label);
    if (idx === -1) return null;

    // look at the 300 chars after the label for a value
    const slice = html.slice(idx, idx + 300);

    // matches: 18.69  or  -5.82  or  257.80  (inside HTML tags)
    const match = slice.match(/>([-]?\d+\.?\d*)</);
    if (!match) return null;

    const val = parseFloat(match[1]);
    return isNaN(val) ? null : val;

  } catch {
    return null;
  }
}

// fetch google fundamentals in rate-limited chunks
export async function fetchGoogleBatch(
  symbols: { symbol: string; exchange: "NSE" | "BSE" }[]
): Promise<{ fundamentals: Map<string, GoogleFundamentals>; errors: FetchError[] }> {
  const fundamentals = new Map<string, GoogleFundamentals>();
  const errors: FetchError[] = [];

  const CHUNK = 5;
  const PAUSE_MS = 400;

  for (let i = 0; i < symbols.length; i += CHUNK) {
    const chunk = symbols.slice(i, i + CHUNK);

    const settled = await Promise.allSettled(
      chunk.map((s) => scrapeGoogleFinance(s.symbol, s.exchange))
    );

    for (let j = 0; j < settled.length; j++) {
      const s   = chunk[j];
      const res = settled[j];

      if (res.status === "fulfilled") {
        fundamentals.set(s.symbol, res.value);
        // if both are null the scrape found nothing — note as a soft error
        if (res.value.pe === null && res.value.eps === null) {
          errors.push({ symbol: s.symbol, source: "google", reason: "no data extracted" });
        }
      } else {
        fundamentals.set(s.symbol, { pe: null, eps: null });
        errors.push({
          symbol: s.symbol,
          source: "google",
          reason: res.reason instanceof Error ? res.reason.message : String(res.reason),
        });
      }
    }

    // rate-limit pause between chunks — skip after the last one
    if (i + CHUNK < symbols.length) {
      await new Promise((r) => setTimeout(r, PAUSE_MS));
    }
  }

  return { fundamentals, errors };
}

// ─── combined entry point ─────────────────────────────────────────────────────

export async function fetchAllLiveData(
  holdings: { symbol: string; exchange: "NSE" | "BSE" }[]
): Promise<FetchResult> {
  const t0 = Date.now();

  // yahoo and google run in parallel — they're independent
  const [yahooResult, googleResult] = await Promise.all([
    fetchYahooBatch(holdings),
    fetchGoogleBatch(holdings),
  ]);

  const allErrors: FetchError[] = [
    ...yahooResult.errors,
    ...googleResult.errors,
  ];

  const quotes = new Map<string, LiveQuote>();

  for (const h of holdings) {
    const cmp  = yahooResult.prices.get(h.symbol)        ?? null;
    const fund = googleResult.fundamentals.get(h.symbol) ?? { pe: null, eps: null };

    quotes.set(h.symbol, {
      symbol:         h.symbol,
      cmp,
      pe:             fund.pe,
      latestEarnings: fund.eps,
      fetchedAt:      Date.now(),
      source: {
        cmp:          cmp !== null   ? "yahoo"   : "workbook",
        fundamentals: fund.pe !== null ? "google" : "workbook",
      },
    });
  }

  return {
    quotes,
    errors:     allErrors,
    durationMs: Date.now() - t0,
  };
}
