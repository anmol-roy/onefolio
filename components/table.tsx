"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ApiPortfolioResponse, ApiStock } from "@/types/portfolio";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function fmtDecimal(n: number) {
  return "₹" + n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// how long ago was the last fetch — shown in the status bar
function timeAgo(ms: number): string {
  const secs = Math.floor((Date.now() - ms) / 1000);
  if (secs < 5)  return "just now";
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ago`;
}

// ─── column definitions ───────────────────────────────────────────────────────

const COLS = [
  { key: "particulars",      label: "Particulars",     align: "left"  },
  { key: "buyPrice",         label: "Buy Price",       align: "right" },
  { key: "qty",              label: "Qty",             align: "right" },
  { key: "investment",       label: "Investment",      align: "right" },
  { key: "portfolioPercent", label: "Portfolio %",     align: "right" },
  { key: "exchangeSymbol",   label: "NSE / BSE",       align: "right" },
  { key: "livePrice",        label: "Current Price",   align: "right" },
  { key: "presentValue",     label: "Present Value",   align: "right" },
  { key: "gainLoss",         label: "Gain / Loss",     align: "right" },
  { key: "livePe",           label: "P / E",           align: "right" },
  { key: "liveEarnings",     label: "Latest Earnings", align: "right" },
] as const;

type SortKey = (typeof COLS)[number]["key"];

// ─── status bar ───────────────────────────────────────────────────────────────

type StatusBarProps = {
  fetchedAt: number | null;
  loading: boolean;
  errors: string[];
  countdown: number;       // seconds until next auto-refresh
  onRefresh: () => void;
};

function StatusBar({ fetchedAt, loading, errors, countdown, onRefresh }: StatusBarProps) {
  const hasErrors = errors.length > 0;

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
      <div className="flex flex-wrap items-center gap-3 text-[0.72rem] text-[#6a7a78]">

        {/* live indicator dot */}
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              loading
                ? "bg-[#d4a017] animate-pulse"
                : "bg-[#1a7a4a]"
            }`}
          />
          {loading ? "Fetching live data…" : fetchedAt ? `Updated ${timeAgo(fetchedAt)}` : "Loading…"}
        </span>

        {/* countdown to next refresh */}
        {!loading && (
          <span className="text-[#9aaba8]">
            Next refresh in {countdown}s
          </span>
        )}

        {/* error pill — click to expand */}
        {hasErrors && (
          <span
            title={errors.join("\n")}
            className="cursor-help rounded-full bg-[#fef3c7] px-2 py-0.5 text-[0.65rem] font-medium text-[#92400e]"
          >
            {errors.length} fallback{errors.length > 1 ? "s" : ""} to workbook
          </span>
        )}
      </div>

      {/* manual refresh button */}
      <button
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-[#d4cdc5] bg-[#f5f2ed] px-3 py-1.5 text-[0.72rem] font-medium text-[#3a4a48] transition hover:bg-[#ede8e0] disabled:opacity-50"
      >
        <span className={loading ? "animate-spin" : ""}>↻</span>
        Refresh now
      </button>
    </div>
  );
}

// ─── filter bar ───────────────────────────────────────────────────────────────

type FilterBarProps = {
  search: string;
  onSearch: (v: string) => void;
  sector: string;
  onSector: (v: string) => void;
  sectors: string[];
  filter: string;
  onFilter: (v: string) => void;
  total: number;
  shown: number;
};

function FilterBar({
  search, onSearch, sector, onSector, sectors, filter, onFilter, total, shown,
}: FilterBarProps) {
  return (
    <div className="mb-0 px-1">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#4a5e5c]">
          Filter Workbook
        </span>
        <span className="text-[0.72rem] font-medium text-[#7a8886]">
          {shown} / {total} positions
        </span>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        {/* search */}
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a9a97]"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search company, ticker, or sector"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full rounded-xl border border-[#d4cdc5] bg-[#f5f2ed] py-2.5 pl-9 pr-4 text-sm text-[#2a3a38] placeholder:text-[#9aaba8] focus:border-[#4a7a6e] focus:outline-none focus:ring-2 focus:ring-[#4a7a6e]/20"
          />
        </div>

        {/* sector */}
        <div className="relative min-w-[160px]">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8a9a97]"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <select
            value={sector} onChange={(e) => onSector(e.target.value)}
            className="w-full appearance-none rounded-xl border border-[#d4cdc5] bg-[#f5f2ed] py-2.5 pl-8 pr-8 text-sm text-[#2a3a38] focus:border-[#4a7a6e] focus:outline-none focus:ring-2 focus:ring-[#4a7a6e]/20"
          >
            <option value="">All Sectors</option>
            {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8a9a97]"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        {/* gainers / losers */}
        <div className="relative min-w-[140px]">
          <select
            value={filter} onChange={(e) => onFilter(e.target.value)}
            className="w-full appearance-none rounded-xl border border-[#d4cdc5] bg-[#f5f2ed] py-2.5 pl-4 pr-8 text-sm text-[#2a3a38] focus:border-[#4a7a6e] focus:outline-none focus:ring-2 focus:ring-[#4a7a6e]/20"
          >
            <option value="">All</option>
            <option value="gainers">Gainers</option>
            <option value="losers">Losers</option>
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8a9a97]"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── table header ─────────────────────────────────────────────────────────────

type TableHeadProps = {
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (k: SortKey) => void;
};

function TableHead({ sortKey, sortDir, onSort }: TableHeadProps) {
  return (
    <thead>
      <tr className="border-b border-[#d8d2c8]">
        {COLS.map((col) => {
          const active = sortKey === col.key;
          return (
            <th
              key={col.key}
              onClick={() => onSort(col.key)}
              className={`cursor-pointer select-none whitespace-nowrap px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.14em] transition-colors ${
                col.align === "right" ? "text-right" : "text-left"
              } ${active ? "text-[#1a3a38]" : "text-[#7a8a88] hover:text-[#3a5a58]"}`}
            >
              <span className="inline-flex items-center gap-1">
                {col.label}
                {active && (
                  <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5">
                    {sortDir === "asc"
                      ? <path d="m18 15-6-6-6 6" />
                      : <path d="m6 9 6 6 6-6" />}
                  </svg>
                )}
              </span>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

// ─── skeleton row — shown while first load ────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-[#e8e2da]">
      {COLS.map((c) => (
        <td key={c.key} className="px-4 py-3.5">
          <div className="h-4 animate-pulse rounded bg-[#e8e2da]" />
        </td>
      ))}
    </tr>
  );
}

// ─── single stock row ─────────────────────────────────────────────────────────

type RowProps = {
  stock: ApiStock;
  // whether this row's price was just updated (flashes briefly)
  fresh: boolean;
};

function StockRow({ stock, fresh }: RowProps) {
  const isGain     = stock.gainLoss >= 0;
  const gainColor  = isGain ? "text-[#1a7a4a]" : "text-[#c0392b]";
  const isWorkbook = stock.priceSource === "workbook";

  return (
    <tr
      className={`group border-b border-[#e8e2da] transition-colors hover:bg-[#f0ebe3] ${
        fresh ? "bg-[#f0faf5]" : ""  // brief green tint when price updates
      }`}
    >
      {/* particulars */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ddd8d0] text-[0.6rem] font-bold text-[#4a5a58]">
            {stock.particulars.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
          <div>
            <div className="text-sm font-semibold text-[#1a2e2d]">{stock.particulars}</div>
            <div className="mt-0.5 text-[0.7rem] text-[#8a9a98]">
              {stock.exchangeSymbol} · {stock.sector}
            </div>
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5 text-right text-sm text-[#3a4a48]">{fmtDecimal(stock.buyPrice)}</td>
      <td className="px-4 py-3.5 text-right text-sm text-[#3a4a48]">{stock.qty}</td>
      <td className="px-4 py-3.5 text-right text-sm text-[#3a4a48]">{fmt(stock.investment)}</td>
      <td className="px-4 py-3.5 text-right text-sm text-[#3a4a48]">{stock.portfolioPercent.toFixed(2)}%</td>

      {/* exchange badge */}
      <td className="px-4 py-3.5 text-right">
        <span className="rounded-md bg-[#e8e2d8] px-2 py-0.5 text-[0.7rem] font-medium text-[#4a5a58]">
          {stock.exchange}
        </span>
      </td>

      {/* live price — dim + tooltip if falling back to workbook */}
      <td className="px-4 py-3.5 text-right">
        <span
          className={`text-sm font-medium ${
            isWorkbook ? "text-[#9aaba8]" : "text-[#1a2e2d]"
          }`}
          title={isWorkbook ? "Yahoo unavailable — using workbook price" : `Live from Yahoo · ${new Date(stock.lastUpdated).toLocaleTimeString()}`}
        >
          {fmtDecimal(stock.livePrice)}
        </span>
        {/* small "W" badge when falling back */}
        {isWorkbook && (
          <span className="ml-1 text-[0.6rem] text-[#b0bab8]">W</span>
        )}
      </td>

      <td className="px-4 py-3.5 text-right text-sm text-[#3a4a48]">{fmt(stock.presentValue)}</td>

      {/* gain / loss */}
      <td className={`px-4 py-3.5 text-right text-sm font-semibold ${gainColor}`}>
        <div>{isGain ? "+" : ""}{fmt(stock.gainLoss)}</div>
        <div className="text-[0.68rem] font-medium opacity-80">
          {isGain ? "+" : ""}{stock.gainLossPercent.toFixed(2)}%
        </div>
      </td>

      {/* p/e */}
      <td className="px-4 py-3.5 text-right text-sm text-[#3a4a48]">
        {stock.livePe != null
          ? stock.livePe.toFixed(1)
          : <span className="text-[#b0bab8]">—</span>}
      </td>

      {/* latest earnings */}
      <td className="px-4 py-3.5 text-right text-sm text-[#3a4a48]">
        {stock.liveEarnings != null
          ? fmtDecimal(stock.liveEarnings)
          : <span className="text-[#b0bab8]">—</span>}
      </td>
    </tr>
  );
}

// ─── sector group header ──────────────────────────────────────────────────────

function SectorRow({ sector, count }: { sector: string; count: number }) {
  return (
    <tr className="bg-[#ede8e0]">
      <td colSpan={COLS.length} className="px-4 py-2">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#5a6e6c]">
          {sector} · {count} {count === 1 ? "position" : "positions"}
        </span>
      </td>
    </tr>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

const REFRESH_INTERVAL = 15; // seconds

export default function Table() {
  const [data,     setData]     = useState<ApiPortfolioResponse | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [errors,   setErrors]   = useState<string[]>([]);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);

  // track which symbols got a new price this tick for the flash effect
  const [freshSymbols, setFreshSymbols] = useState<Set<string>>(new Set());
  const prevPrices = useRef<Map<string, number>>(new Map());

  // filter + sort state
  const [search,  setSearch]  = useState("");
  const [sector,  setSector]  = useState("");
  const [filter,  setFilter]  = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("particulars");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // ── fetch function ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/portfolio", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json: ApiPortfolioResponse = await res.json();

      // figure out which symbols changed price since last fetch
      const changed = new Set<string>();
      for (const s of json.stocks) {
        const prev = prevPrices.current.get(s.exchangeSymbol);
        if (prev !== undefined && prev !== s.livePrice) {
          changed.add(s.exchangeSymbol);
        }
        prevPrices.current.set(s.exchangeSymbol, s.livePrice);
      }

      setData(json);
      setErrors(json.errors ?? []);
      setFreshSymbols(changed);

      // clear the flash after 2 seconds
      if (changed.size > 0) {
        setTimeout(() => setFreshSymbols(new Set()), 2000);
      }
    } catch (err) {
      setErrors([`Failed to fetch: ${String(err)}`]);
    } finally {
      setLoading(false);
      setCountdown(REFRESH_INTERVAL);
    }
  }, []);

  // ── initial load + 15s auto-refresh ───────────────────────────────
  useEffect(() => {
    fetchData();

    const refreshTimer = setInterval(fetchData, REFRESH_INTERVAL * 1000);

    // countdown ticker — updates every second
    const countdownTimer = setInterval(() => {
      setCountdown((c) => (c <= 1 ? REFRESH_INTERVAL : c - 1));
    }, 1000);

    return () => {
      clearInterval(refreshTimer);
      clearInterval(countdownTimer);
    };
  }, [fetchData]);

  // ── filter + sort pipeline ─────────────────────────────────────────
  const stocks = data?.stocks ?? [];

  const sectors = useMemo(
    () => [...new Set(stocks.map((s) => s.sector))].sort(),
    [stocks]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return stocks.filter((s) => {
      if (q &&
        !s.particulars.toLowerCase().includes(q) &&
        !s.exchangeSymbol.toLowerCase().includes(q) &&
        !s.sector.toLowerCase().includes(q)
      ) return false;
      if (sector && s.sector !== sector) return false;
      if (filter === "gainers" && s.gainLoss < 0)  return false;
      if (filter === "losers"  && s.gainLoss >= 0) return false;
      return true;
    });
  }, [stocks, search, sector, filter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey as keyof ApiStock];
      const bv = b[sortKey as keyof ApiStock];

      // nulls always sink to bottom
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      let cmp = 0;
      if (typeof av === "string" && typeof bv === "string") {
        cmp = av.localeCompare(bv);
      } else {
        cmp = (av as number) < (bv as number) ? -1 : (av as number) > (bv as number) ? 1 : 0;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // group by sector for display
  const grouped = useMemo(() => {
    const map = new Map<string, ApiStock[]>();
    for (const s of sorted) {
      const arr = map.get(s.sector) ?? [];
      arr.push(s);
      map.set(s.sector, arr);
    }
    return map;
  }, [sorted]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // ── render ─────────────────────────────────────────────────────────
  return (
    <section className="mt-6 w-full">

      {/* live status + manual refresh */}
      <StatusBar
        fetchedAt={data?.fetchedAt ?? null}
        loading={loading}
        errors={errors}
        countdown={countdown}
        onRefresh={fetchData}
      />

      {/* filter controls */}
      <FilterBar
        search={search}   onSearch={setSearch}
        sector={sector}   onSector={setSector}
        sectors={sectors}
        filter={filter}   onFilter={setFilter}
        total={stocks.length}
        shown={sorted.length}
      />

      {/* workbook title + count */}
      <div className="mt-4 flex items-end justify-between px-1 pb-3">
        <div>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#7a8a88]">
            Workbook Positions
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-[#1a2e2d]">
            {sector || "All holdings"}
          </h2>
        </div>
        <span className="rounded-full bg-[#e0dbd2] px-3 py-1 text-[0.72rem] font-semibold text-[#4a5a58]">
          {sorted.length} shown
        </span>
      </div>

      {/* table */}
      <div className="w-full overflow-x-auto rounded-2xl border border-[#d8d2c8] bg-[#f8f5f0] shadow-sm">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <TableHead sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          <tbody>
            {/* first load skeletons */}
            {loading && stocks.length === 0 && (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            )}

            {/* empty state */}
            {!loading && sorted.length === 0 && (
              <tr>
                <td colSpan={COLS.length} className="py-16 text-center text-sm text-[#9aaba8]">
                  No positions match your filters.
                </td>
              </tr>
            )}

            {/* sector groups */}
            {[...grouped.entries()].map(([sec, rows]) => (
              <>
                <SectorRow key={`sec-${sec}`} sector={sec} count={rows.length} />
                {rows.map((s) => (
                  <StockRow
                    key={s.id}
                    stock={s}
                    fresh={freshSymbols.has(s.exchangeSymbol)}
                  />
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* legend for the W badge */}
      <p className="mt-2 px-1 text-[0.65rem] text-[#9aaba8]">
        W = price from workbook (Yahoo Finance unavailable for this symbol)
      </p>
    </section>
  );
}
