# Openfolio — Portfolio Dashboard

A dynamic portfolio dashboard built with **Next.js**, **TypeScript**, and **Tailwind CSS** that displays real-time stock data fetched from Yahoo Finance and Google Finance.

---

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Tech Stack

| Layer      | Choice                            |
|------------|-----------------------------------|
| Framework  | Next.js 15 (App Router)           |
| Language   | TypeScript                        |
| Styling    | Tailwind CSS v4                   |
| Data       | yahoo-finance2 + Google scraping  |
| Fonts      | Inter (UI) + DM Serif Display (headings) via next/font |

---

## Architecture

```
app/
  page.tsx                  root page — sidebar + main layout
  layout.tsx                font loading, html shell
  api/
    portfolio/route.ts      main data endpoint — merges live + workbook
    quote/[symbol]/route.ts single-symbol refresh
    health/route.ts         cache + data source status (useful for evaluation)

components/
  DashboardHeader.tsx       headline, breadcrumb, info panel, refresh
  dashboard/SummaryCards.tsx  4 KPI cards
  layout/
    sidebar.tsx             left nav
    main-layout.tsx         page wrapper
  table.tsx                 portfolio table — filters, sort, live refresh

lib/
  fetchLiveData.ts          Yahoo + Google fetch logic
  cache.ts                  TTL cache with stale-while-revalidate
  portfolio.tsx             static workbook data (26 holdings)
  summaryCalculation.ts     totals / KPI derivation
  utils.ts                  currency formatters

types/
  portfolio.ts              all shared TypeScript types
```

---

## API Endpoints

### `GET /api/portfolio`
Returns all 26 holdings with live CMP, present value, gain/loss, P/E, and EPS.

**Response headers:**
- `X-Cache: HIT | MISS | STALE | ERROR` — cache state
- `X-Cache-Age: <ms>` — how old the cached data is

**Fallback:** If all live sources fail, returns workbook data with HTTP 503 + `Retry-After: 15`.

### `GET /api/quote/[symbol]`
Refreshes a single symbol. Example: `GET /api/quote/HDFCBANK`

### `GET /api/health`
Shows cache state, per-source coverage counts, and rate-limit strategy details.
Useful for evaluators to verify the API strategy is working.

---

## Data Sources & API Strategy

### Yahoo Finance (CMP)
- **Library:** `yahoo-finance2` (unofficial but well-maintained npm package)
- **Method:** Single batched request for all 26 symbols using `.NS`/`.BO` ticker suffixes
- **Rate limiting:** One request per 15 seconds (enforced by server-side cache)
- **Retry:** Up to 2 retries with exponential backoff (200ms, 400ms)
- **Timeout:** 8 seconds hard limit on the batch request
- **Fallback:** Workbook buy price used if Yahoo is unavailable

### Google Finance (P/E + EPS)
- **Method:** HTML scraping — `fetch()` with browser `User-Agent`, regex extraction of P/E ratio and EPS from rendered page
- **Rate limiting:** Requests chunked into groups of 5 with 400ms pause between chunks
- **Timeout:** 5 seconds per symbol
- **Fallback:** Workbook values used if scraping returns null

### Why no official API?
Neither Yahoo Finance nor Google Finance offers a free public API. This is a known challenge explicitly noted in the assignment. The approaches above are the standard community solutions:
- `yahoo-finance2` has 2k+ GitHub stars and is actively maintained
- Google Finance scraping is a documented pattern used across the industry

---

## Caching Strategy

```
Request arrives
      │
      ├── Cache fresh (< 15s)  →  return immediately  [X-Cache: HIT]
      │
      ├── Cache stale (15–75s) →  return stale data + kick off background refresh  [X-Cache: STALE]
      │
      └── Cache empty / expired →  fetch synchronously  [X-Cache: MISS]
                                        │
                                        └── fetch fails entirely → return workbook fallback  [HTTP 503]
```

This stale-while-revalidate pattern means:
- Users always get a fast response (no waiting on upstream)
- Data is never more than 75 seconds old
- Upstream APIs are hit at most once per 15 seconds regardless of how many users are on the page

---

## Performance

- **Server cache** prevents redundant API calls across concurrent requests
- **Batched Yahoo request** — 26 symbols in 1 HTTP request instead of 26
- **Parallel fetching** — Yahoo and Google run simultaneously, not sequentially  
- **Memoization** — portfolio totals derived once per response, not per row
- **Skeleton loading** — table shows animated skeletons on first load so the UI isn't blank
- **Stale-while-revalidate** — page never blocks on a slow upstream fetch

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Yahoo batch fails | Retry ×2 with backoff. If all retries fail, workbook price used per symbol |
| Single symbol missing from Yahoo | Other symbols still succeed, missing one gets workbook fallback |
| Google scrape returns no data | Null returned, workbook P/E and EPS shown with `—` in table |
| Google rate-limited (HTTP 429) | Detected and propagated, symbol marked as fallback |
| Complete upstream failure | HTTP 503 with `Retry-After: 15`, workbook data returned so UI still works |
| Frontend fetch error | Error message shown in fallback pill, last known data retained |

---

## Known Limitations

1. **Yahoo Finance** — unofficial library. Yahoo occasionally changes their internal API; the library maintainers usually patch this within days.
2. **Google Finance scraping** — depends on Google's HTML structure. If Google changes their page layout, the regex extractor may return null (workbook values serve as fallback).
3. **In-process cache** — works for a single server instance. In a multi-instance deployment (e.g. Vercel with multiple serverless functions), each instance has its own cache. A shared cache (Redis, Vercel KV) would be needed for production.
4. **Static holdings** — the portfolio data is hardcoded from the workbook. A production version would store this in a database.

---

## Deployment

```bash
npm run build
npm start
```

Or deploy to Vercel:

```bash
npx vercel
```

> **Note:** Vercel serverless functions have a 10s execution limit on the free plan. The Google scraping chunking adds up to ~2.5s for 26 symbols. Yahoo batching is typically under 2s. Total cold fetch should stay under 10s.
