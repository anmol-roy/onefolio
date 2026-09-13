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

function timeAgo(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 5)  return "just now";
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

// ─── columns ──────────────────────────────────────────────────────────────────

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
  countdown: number;
  onRefresh: () => void;
};

function StatusBar({ fetchedAt, loading, errors, countdown, onRefresh }: StatusBarProps) {
  const [spinning, setSpinning] = useState(false);

  function handleRefresh() {
    setSpinning(true);
    onRefresh();
    setTimeout(() => setSpinning(false), 1000);
  }

  return (
    <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2.5 text-[0.7rem] text-[#6a7a78]">

        {/* live dot + updated time */}
        <span className="inline-flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${loading ? "animate-pulse bg-amber-400" : "bg-[#1a7a4a]"}`} />
          {loading
            ? "Fetching…"
            : fetchedAt
              ? `Updated ${timeAgo(fetchedAt)}`
              : "Loading…"}
        </span>

        {!loading && (
          <span className="text-[#b0bab8]">Next in {countdown}s</span>
        )}

        {/* fallback pill */}
        {errors.length > 0 && (
          <span
            title={errors.join("\n")}
            className="cursor-help rounded-full bg-amber-50 px-2 py-0.5 text-[0.62rem] font-medium text-amber-700 ring-1 ring-amber-200"
          >
            {errors.length} workbook fallback{errors.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* refresh button */}
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-[#d0c9c0] bg-[#f0ede7] px-2.5 py-1.5 text-[0.7rem] font-medium text-[#3a4a48] transition hover:bg-[#e8e2d8] disabled:opacity-40"
      >
        <span
          aria-hidden="true"
          style={{ display: "inline-block" }}
          className={`text-xs leading-none ${spinning || loading ? "animate-spin" : ""}`}
        >
          ↻
        </span>
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

function FilterBar({ search, onSearch, sector, onSector, sectors, filter, onFilter, total, shown }: FilterBarProps) {
  return (
    <div className="mb-3">
      {/* label + count */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-[#5a6e6c]">
          Filter Workbook
        </span>
        <span className="text-[0.68rem] text-[#8a9a98]">{shown} / {total} positions</span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">

        {/* search */}
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9aaba8]"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search company, ticker, or sector"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full rounded-xl border border-[#d0c9c0] bg-[#f5f1eb] py-2 pl-8 pr-3 text-[0.78rem] text-[#2a3a38] placeholder:text-[#aab5b3] focus:border-[#4a7a6e] focus:outline-none focus:ring-1 focus:ring-[#4a7a6e]/30"
          />
        </div>

        {/* sector */}
        <div className="relative min-w-[148px]">
          <svg className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#9aaba8]"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <select
            value={sector} onChange={(e) => onSector(e.target.value)}
            className="w-full appearance-none rounded-xl border border-[#d0c9c0] bg-[#f5f1eb] py-2 pl-7 pr-7 text-[0.78rem] text-[#2a3a38] focus:border-[#4a7a6e] focus:outline-none focus:ring-1 focus:ring-[#4a7a6e]/30"
          >
            <option value="">All Sectors</option>
            {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#9aaba8]"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        {/* gainers/losers */}
        <div className="relative min-w-[120px]">
          <select
            value={filter} onChange={(e) => onFilter(e.target.value)}
            className="w-full appearance-none rounded-xl border border-[#d0c9c0] bg-[#f5f1eb] py-2 pl-3 pr-7 text-[0.78rem] text-[#2a3a38] focus:border-[#4a7a6e] focus:outline-none focus:ring-1 focus:ring-[#4a7a6e]/30"
          >
            <option value="">All</option>
            <option value="gainers">Gainers</option>
            <option value="losers">Losers</option>
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#9aaba8]"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── table head ───────────────────────────────────────────────────────────────

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
              className={`cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-[0.58rem] font-semibold uppercase tracking-[0.12em] transition-colors ${
                col.align === "right" ? "text-right" : "text-left"
              } ${active ? "text-[#1a3a38]" : "text-[#8a9a98] hover:text-[#4a5a58]"}`}
            >
              <span className="inline-flex items-center gap-0.5">
                {col.label}
                {active && (
                  <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5">
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

// ─── skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow({ index }: { index: number }) {
  // vary widths so the skeleton looks more natural
  const widths = ["w-28", "w-14", "w-8", "w-16", "w-10", "w-12", "w-16", "w-16", "w-14", "w-8", "w-14"];
  return (
    <tr className="border-b border-[#eae6df]">
      {COLS.map((col, i) => (
        <td key={col.key} className={`px-3 py-3 ${col.align === "right" ? "text-right" : ""}`}>
          <div
            className={`inline-block h-3 rounded-full bg-[#e4dfd7] animate-pulse ${widths[i] ?? "w-12"}`}
            style={{ animationDelay: `${index * 40 + i * 20}ms` }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── sector header row ────────────────────────────────────────────────────────

function SectorRow({ sector, count }: { sector: string; count: number }) {
  return (
    <tr className="bg-[#e8e3da]">
      <td colSpan={COLS.length} className="px-3 py-1.5">
        <span className="text-[0.58rem] font-semibold uppercase tracking-[0.15em] text-[#6a7a78]">
          {sector} · {count} {count === 1 ? "position" : "positions"}
        </span>
      </td>
    </tr>
  );
}

// ─── stock row ────────────────────────────────────────────────────────────────

function StockRow({ stock, fresh }: { stock: ApiStock; fresh: boolean }) {
  const isGain     = stock.gainLoss >= 0;
  const gainColor  = isGain ? "text-[#1a7a4a]" : "text-[#c0392b]";
  const isWorkbook = stock.priceSource === "workbook";

  return (
    <tr className={`group border-b border-[#eae6df] transition-colors hover:bg-[#ede9e1] ${fresh ? "bg-[#edfaf4]" : ""}`}>

      {/* company name + ticker */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ddd8d0] text-[0.55rem] font-bold text-[#4a5a58]">
            {stock.particulars.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
          <div>
            <div className="text-[0.8rem] font-semibold text-[#1a2e2d]">{stock.particulars}</div>
            <div className="text-[0.65rem] text-[#8a9a98]">
              {stock.exchangeSymbol} · {stock.sector}
            </div>
          </div>
        </div>
      </td>

      <td className="px-3 py-2.5 text-right text-[0.78rem] text-[#3a4a48]">{fmtDecimal(stock.buyPrice)}</td>
      <td className="px-3 py-2.5 text-right text-[0.78rem] text-[#3a4a48]">{stock.qty}</td>
      <td className="px-3 py-2.5 text-right text-[0.78rem] text-[#3a4a48]">{fmt(stock.investment)}</td>
      <td className="px-3 py-2.5 text-right text-[0.78rem] text-[#3a4a48]">{stock.portfolioPercent.toFixed(2)}%</td>

      {/* exchange badge */}
      <td className="px-3 py-2.5 text-right">
        <span className="rounded-md bg-[#e4dfd7] px-1.5 py-0.5 text-[0.62rem] font-medium text-[#4a5a58]">
          {stock.exchange}
        </span>
      </td>

      {/* live price — dimmed if workbook fallback */}
      <td className="px-3 py-2.5 text-right">
        <span
          title={isWorkbook
            ? "Yahoo unavailable — workbook price"
            : `Yahoo · ${new Date(stock.lastUpdated).toLocaleTimeString()}`}
          className={`text-[0.78rem] font-medium ${isWorkbook ? "text-[#aab5b3]" : "text-[#1a2e2d]"}`}
        >
          {fmtDecimal(stock.livePrice)}
        </span>
        {isWorkbook && <span className="ml-0.5 text-[0.55rem] text-[#b0bab8]">W</span>}
      </td>

      <td className="px-3 py-2.5 text-right text-[0.78rem] text-[#3a4a48]">{fmt(stock.presentValue)}</td>

      {/* gain/loss */}
      <td className={`px-3 py-2.5 text-right font-semibold ${gainColor}`}>
        <div className="text-[0.78rem]">{isGain ? "+" : ""}{fmt(stock.gainLoss)}</div>
        <div className="text-[0.65rem] opacity-75">{isGain ? "+" : ""}{stock.gainLossPercent.toFixed(2)}%</div>
      </td>

      {/* p/e */}
      <td className="px-3 py-2.5 text-right text-[0.78rem] text-[#3a4a48]">
        {stock.livePe != null ? stock.livePe.toFixed(1) : <span className="text-[#c0c8c5]">—</span>}
      </td>

      {/* earnings */}
      <td className="px-3 py-2.5 text-right text-[0.78rem] text-[#3a4a48]">
        {stock.liveEarnings != null ? fmtDecimal(stock.liveEarnings) : <span className="text-[#c0c8c5]">—</span>}
      </td>
    </tr>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

const REFRESH_INTERVAL = 15;

export default function Table() {
  const [data,      setData]      = useState<ApiPortfolioResponse | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [errors,    setErrors]    = useState<string[]>([]);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [freshSyms, setFreshSyms] = useState<Set<string>>(new Set());

  const prevPrices = useRef<Map<string, number>>(new Map());

  const [search,  setSearch]  = useState("");
  const [sector,  setSector]  = useState("");
  const [filter,  setFilter]  = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("particulars");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // ── fetch ───────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/portfolio", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiPortfolioResponse = await res.json();

      // detect price changes for flash effect
      const changed = new Set<string>();
      for (const s of json.stocks) {
        const prev = prevPrices.current.get(s.exchangeSymbol);
        if (prev !== undefined && prev !== s.livePrice) changed.add(s.exchangeSymbol);
        prevPrices.current.set(s.exchangeSymbol, s.livePrice);
      }

      setData(json);
      setErrors(json.errors ?? []);
      setFreshSyms(changed);
      if (changed.size > 0) setTimeout(() => setFreshSyms(new Set()), 2000);
    } catch (err) {
      setErrors([`Fetch failed: ${String(err)}`]);
    } finally {
      setLoading(false);
      setCountdown(REFRESH_INTERVAL);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const refresh   = setInterval(fetchData, REFRESH_INTERVAL * 1000);
    const tick      = setInterval(() => setCountdown((c) => (c <= 1 ? REFRESH_INTERVAL : c - 1)), 1000);
    return () => { clearInterval(refresh); clearInterval(tick); };
  }, [fetchData]);

  // ── filter + sort ───────────────────────────────────────────────────
  const stocks  = data?.stocks ?? [];
  const sectors = useMemo(() => [...new Set(stocks.map((s) => s.sector))].sort(), [stocks]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return stocks.filter((s) => {
      if (q && !s.particulars.toLowerCase().includes(q) &&
               !s.exchangeSymbol.toLowerCase().includes(q) &&
               !s.sector.toLowerCase().includes(q)) return false;
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
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      let cmp = typeof av === "string" && typeof bv === "string"
        ? av.localeCompare(bv)
        : (av as number) < (bv as number) ? -1 : (av as number) > (bv as number) ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const grouped = useMemo(() => {
    const map = new Map<string, ApiStock[]>();
    for (const s of sorted) { const a = map.get(s.sector) ?? []; a.push(s); map.set(s.sector, a); }
    return map;
  }, [sorted]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  // ── render ──────────────────────────────────────────────────────────
  return (
    <section className="mt-4 w-full">

      <StatusBar
        fetchedAt={data?.fetchedAt ?? null}
        loading={loading}
        errors={errors}
        countdown={countdown}
        onRefresh={fetchData}
      />

      <FilterBar
        search={search}   onSearch={setSearch}
        sector={sector}   onSector={setSector}
        sectors={sectors}
        filter={filter}   onFilter={setFilter}
        total={stocks.length}
        shown={sorted.length}
      />

      {/* workbook title */}
      <div className="mb-2 flex items-end justify-between px-0.5">
        <div>
          <p className="text-[0.58rem] font-semibold uppercase tracking-[0.15em] text-[#8a9a98]">
            Workbook Positions
          </p>
          <h2 className="mt-0.5 text-lg font-bold tracking-tight text-[#1a2e2d]">
            {sector || "All holdings"}
          </h2>
        </div>
        <span className="rounded-full bg-[#e0dbd2] px-2.5 py-0.5 text-[0.65rem] font-semibold text-[#4a5a58]">
          {sorted.length} shown
        </span>
      </div>

      {/* table */}
      <div className="w-full overflow-x-auto rounded-2xl border border-[#d8d2c8] bg-[#f8f5f0] shadow-sm">
        <table className="w-full min-w-[1050px] border-collapse">
          <TableHead sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          <tbody>
            {/* skeletons on first load */}
            {loading && stocks.length === 0 &&
              Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} index={i} />)
            }

            {/* empty state */}
            {!loading && sorted.length === 0 && (
              <tr>
                <td colSpan={COLS.length} className="py-12 text-center text-[0.78rem] text-[#9aaba8]">
                  No positions match your filters.
                </td>
              </tr>
            )}

            {/* grouped rows */}
            {[...grouped.entries()].map(([sec, rows]) => (
              <>
                <SectorRow key={`s-${sec}`} sector={sec} count={rows.length} />
                {rows.map((s) => (
                  <StockRow key={s.id} stock={s} fresh={freshSyms.has(s.exchangeSymbol)} />
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-1.5 px-0.5 text-[0.6rem] text-[#aab5b3]">
        W = workbook price used (Yahoo Finance unavailable for this symbol)
      </p>

    </section>
  );
}
