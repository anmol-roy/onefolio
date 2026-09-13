"use client";

import { useMemo, useState } from "react";
import { Portfolio } from "@/lib/portfolio";
import type { StockRow } from "@/types/portfolio";

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  // indian number formatting with ₹ sign
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function fmtDecimal(n: number) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// derive the calculated fields from raw stock data
function buildRows(): StockRow[] {
  // calc total investment first so we can derive portfolio %
  const totalInvestment = Portfolio.reduce((sum, s) => sum + s.buyPrice * s.qty, 0);

  return Portfolio.map((s) => {
    const investment       = s.buyPrice * s.qty;
    const presentValue     = s.currentPrice * s.qty;
    const gainLoss         = presentValue - investment;
    const gainLossPercent  = investment > 0 ? (gainLoss / investment) * 100 : 0;
    const portfolioPercent = totalInvestment > 0 ? (investment / totalInvestment) * 100 : 0;
    return { ...s, investment, presentValue, gainLoss, gainLossPercent, portfolioPercent };
  });
}

// ─── filter bar ─────────────────────────────────────────────────────────────

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
    <div className="mb-0 px-1">

      {/* top row — label + position count */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#4a5e5c]">
          Filter Workbook
        </span>
        <span className="text-[0.72rem] font-medium text-[#7a8886]">
          {shown} / {total} positions
        </span>
      </div>

      {/* search + dropdowns row */}
      <div className="flex flex-col gap-2.5 sm:flex-row">

        {/* search box */}
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a9a97]"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search company, ticker, or sector"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full rounded-xl border border-[#d4cdc5] bg-[#f5f2ed] py-2.5 pl-9 pr-4 text-sm text-[#2a3a38] placeholder:text-[#9aaba8] focus:border-[#4a7a6e] focus:outline-none focus:ring-2 focus:ring-[#4a7a6e]/20"
          />
        </div>

        {/* sector dropdown */}
        <div className="relative min-w-[160px]">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8a9a97]"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <select
            value={sector}
            onChange={(e) => onSector(e.target.value)}
            className="w-full appearance-none rounded-xl border border-[#d4cdc5] bg-[#f5f2ed] py-2.5 pl-8 pr-8 text-sm text-[#2a3a38] focus:border-[#4a7a6e] focus:outline-none focus:ring-2 focus:ring-[#4a7a6e]/20"
          >
            <option value="">All Sectors</option>
            {sectors.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8a9a97]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
        </div>

        {/* gainers / losers dropdown */}
        <div className="relative min-w-[140px]">
          <select
            value={filter}
            onChange={(e) => onFilter(e.target.value)}
            className="w-full appearance-none rounded-xl border border-[#d4cdc5] bg-[#f5f2ed] py-2.5 pl-4 pr-8 text-sm text-[#2a3a38] focus:border-[#4a7a6e] focus:outline-none focus:ring-2 focus:ring-[#4a7a6e]/20"
          >
            <option value="">All</option>
            <option value="gainers">Gainers</option>
            <option value="losers">Losers</option>
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8a9a97]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
        </div>

      </div>
    </div>
  );
}

// ─── table header ────────────────────────────────────────────────────────────

const COLS = [
  { key: "particulars",      label: "Particulars",      align: "left"  },
  { key: "buyPrice",         label: "Buy Price",        align: "right" },
  { key: "qty",              label: "Qty",              align: "right" },
  { key: "investment",       label: "Investment",       align: "right" },
  { key: "portfolioPercent",    label: "Portfolio %",   align: "right" },
  { key: "exchangeSymbol",   label: "NSE / BSE",        align: "right" },
  { key: "currentPrice",     label: "Current Price",    align: "right" },
  { key: "presentValue",     label: "Present Value",    align: "right" },
  { key: "gainLoss",         label: "Gain / Loss",      align: "right" },
  { key: "pe",               label: "P / E",            align: "right" },
  { key: "latestEarnings",   label: "Latest Earnings",  align: "right" },
] as const;

type SortKey = (typeof COLS)[number]["key"];

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
                {/* sort arrow — only show on active column */}
                {active && (
                  <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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

// ─── single row ──────────────────────────────────────────────────────────────

function StockTableRow({ row }: { row: StockRow }) {
  const isGain = row.gainLoss >= 0;
  const gainColor = isGain ? "text-[#1a7a4a]" : "text-[#c0392b]";

  return (
    <tr className="group border-b border-[#e8e2da] transition-colors hover:bg-[#f0ebe3]">

      {/* particulars — name + symbol + sector */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          {/* initials badge */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ddd8d0] text-[0.6rem] font-bold text-[#4a5a58]">
            {row.particulars.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
          <div>
            <div className="text-sm font-semibold text-[#1a2e2d]">{row.particulars}</div>
            <div className="mt-0.5 text-[0.7rem] text-[#8a9a98]">
              {row.exchangeSymbol} · {row.sector}
            </div>
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5 text-right text-sm text-[#3a4a48]">{fmtDecimal(row.buyPrice)}</td>
      <td className="px-4 py-3.5 text-right text-sm text-[#3a4a48]">{row.qty}</td>
      <td className="px-4 py-3.5 text-right text-sm text-[#3a4a48]">{fmt(row.investment)}</td>

      {/* portfolio % */}
      <td className="px-4 py-3.5 text-right">
        <span className="text-sm text-[#3a4a48]">{row.portfolioPercent.toFixed(2)}%</span>
      </td>

      {/* exchange badge */}
      <td className="px-4 py-3.5 text-right">
        <span className="rounded-md bg-[#e8e2d8] px-2 py-0.5 text-[0.7rem] font-medium text-[#4a5a58]">
          {row.exchange}
        </span>
      </td>

      <td className="px-4 py-3.5 text-right text-sm font-medium text-[#1a2e2d]">{fmtDecimal(row.currentPrice)}</td>
      <td className="px-4 py-3.5 text-right text-sm text-[#3a4a48]">{fmt(row.presentValue)}</td>

      {/* gain / loss with % */}
      <td className={`px-4 py-3.5 text-right text-sm font-semibold ${gainColor}`}>
        <div>{isGain ? "+" : ""}{fmt(row.gainLoss)}</div>
        <div className="text-[0.68rem] font-medium opacity-80">
          {isGain ? "+" : ""}{row.gainLossPercent.toFixed(2)}%
        </div>
      </td>

      {/* p/e — dash if null */}
      <td className="px-4 py-3.5 text-right text-sm text-[#3a4a48]">
        {row.pe != null ? row.pe.toFixed(1) : <span className="text-[#b0bab8]">—</span>}
      </td>

      {/* latest earnings (EPS) */}
      <td className="px-4 py-3.5 text-right text-sm text-[#3a4a48]">
        {row.latestEarnings != null ? fmtDecimal(row.latestEarnings) : <span className="text-[#b0bab8]">—</span>}
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

// ─── main table component ─────────────────────────────────────────────────────

export default function Table() {
  const allRows = useMemo(() => buildRows(), []);

  const [search,  setSearch]  = useState("");
  const [sector,  setSector]  = useState("");
  const [filter,  setFilter]  = useState("");   // "" | "gainers" | "losers"
  const [sortKey, setSortKey] = useState<SortKey>("particulars");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // unique sorted sector list for the dropdown
  const sectors = useMemo(
    () => [...new Set(allRows.map((r) => r.sector))].sort(),
    [allRows]
  );

  // apply all three filters
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allRows.filter((r) => {
      if (q && !r.particulars.toLowerCase().includes(q) &&
               !r.exchangeSymbol.toLowerCase().includes(q) &&
               !r.sector.toLowerCase().includes(q)) return false;
      if (sector && r.sector !== sector) return false;
      if (filter === "gainers" && r.gainLoss < 0)  return false;
      if (filter === "losers"  && r.gainLoss >= 0) return false;
      return true;
    });
  }, [allRows, search, sector, filter]);

  // sorting
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];

      // nulls go to the bottom regardless of sort dir
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
    const map = new Map<string, StockRow[]>();
    for (const row of sorted) {
      const arr = map.get(row.sector) ?? [];
      arr.push(row);
      map.set(row.sector, arr);
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

  return (
    <section className="mt-6 w-full">

      {/* filter bar */}
      <FilterBar
        search={search}   onSearch={setSearch}
        sector={sector}   onSector={setSector}
        sectors={sectors}
        filter={filter}   onFilter={setFilter}
        total={allRows.length}
        shown={sorted.length}
      />

      {/* workbook header */}
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

      {/* table wrapper — horizontal scroll on small screens */}
      <div className="w-full overflow-x-auto rounded-2xl border border-[#d8d2c8] bg-[#f8f5f0] shadow-sm">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <TableHead sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={COLS.length} className="py-16 text-center text-sm text-[#9aaba8]">
                  No positions match your filters.
                </td>
              </tr>
            ) : (
              // render each sector group with its header row
              [...grouped.entries()].map(([sec, rows]) => (
                <>
                  <SectorRow key={`sec-${sec}`} sector={sec} count={rows.length} />
                  {rows.map((row) => (
                    <StockTableRow key={row.id} row={row} />
                  ))}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

    </section>
  );
}
