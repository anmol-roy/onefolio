"use client";

import { useEffect, useRef, useState } from "react";

// ─── types ────────────────────────────────────────────────────────────────────

type DataSource = {
  name: string;
  subtitle: string;
  count: string;
  badge: "purple" | "green" | "neutral";
  short: string;
};

// ─── data ─────────────────────────────────────────────────────────────────────

// hardcoded for now — will pull live counts from api response later
const DATA_SOURCES: DataSource[] = [
  {
    name: "Yahoo Finance",
    subtitle: "Live market price (CMP) for each holding",
    count: "24 / 26",
    badge: "purple",
    short: "Y!",
  },
  {
    name: "Google Finance",
    subtitle: "P/E ratio and latest earnings (EPS)",
    count: "0 / 26",
    badge: "green",
    short: "G",
  },
  {
    name: "Workbook fallback",
    subtitle: "Used when a live provider is unavailable",
    count: "",
    badge: "neutral",
    short: "W",
  },
];

// ─── info panel ───────────────────────────────────────────────────────────────

function InfoPanel({ onClose }: { onClose: () => void }) {
  return (
    // fixed so it never clips off screen — always top-right of viewport
    <div className="fixed right-4 top-4 z-50 w-[min(92vw,400px)] rounded-2xl border border-[#ddd8cf] bg-[#f7f4ef] shadow-[0_20px_60px_rgba(10,30,28,0.14)]">

      {/* header */}
      <div className="flex items-center justify-between border-b border-[#e4dfd7] px-4 py-3">
        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#4a6260]">
          Data refresh details
        </span>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-full text-[#6a7a78] transition hover:bg-[#e8e2d8] hover:text-[#1a2e2d]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-3.5 w-3.5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* source list */}
      <div className="divide-y divide-[#e4dfd7] px-4">
        {DATA_SOURCES.map((src) => (
          <div key={src.short} className="flex items-center gap-3 py-3">

            {/* badge */}
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[0.7rem] font-bold ${
              src.badge === "purple" ? "bg-[#7a5ad8] text-white"
              : src.badge === "green"  ? "bg-[#2a9d5c] text-white"
              : "bg-[#e2e6df] text-[#5f6d6a]"
            }`}>
              {src.short}
            </div>

            {/* text */}
            <div className="min-w-0 flex-1">
              <div className="text-[0.82rem] font-semibold text-[#1a2e2d]">{src.name}</div>
              {src.subtitle && (
                <div className="mt-0.5 text-[0.7rem] leading-4 text-[#6a7a78]">{src.subtitle}</div>
              )}
            </div>

            {/* count */}
            {src.count && (
              <span className="shrink-0 font-mono text-[0.8rem] font-semibold text-[#1a3a38]">
                {src.count}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── refresh button ───────────────────────────────────────────────────────────

function RefreshButton({ onClick }: { onClick: () => void }) {
  const [spinning, setSpinning] = useState(false);

  function handleClick() {
    setSpinning(true);
    onClick();
    // spin for 1s then stop — visual feedback even if api is fast
    setTimeout(() => setSpinning(false), 1000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-2 rounded-xl bg-[#1d3a39] px-3.5 py-2 text-[0.78rem] font-medium text-white shadow-sm transition hover:bg-[#163030] active:scale-95"
    >
      <span
        aria-hidden="true"
        className={`text-sm leading-none ${spinning ? "animate-spin" : ""}`}
        style={{ display: "inline-block" }}
      >
        ↻
      </span>
      Refresh
    </button>
  );
}

// ─── main header ──────────────────────────────────────────────────────────────

export default function DashboardHeader() {
  const [infoOpen, setInfoOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // close info panel on outside click
  useEffect(() => {
    if (!infoOpen) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setInfoOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [infoOpen]);

  return (
    <header className="w-full px-1 pb-4 pt-2">

      {/* breadcrumb + actions row */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#5a7270]">
          Portfolio / Overview
        </span>

        <div className="flex items-center gap-2">
          {/* info toggle */}
          <div ref={panelRef}>
            <button
              type="button"
              aria-label="Data sources"
              onClick={() => setInfoOpen((p) => !p)}
              className={`flex h-8 w-8 items-center justify-center rounded-xl border text-[0.78rem] font-semibold transition ${
                infoOpen
                  ? "border-[#1d3a39] bg-[#1d3a39] text-white"
                  : "border-[#d0c9c0] bg-[#f0ede7] text-[#3a4a48] hover:bg-[#e8e2d8]"
              }`}
            >
              i
            </button>
            {infoOpen && <InfoPanel onClose={() => setInfoOpen(false)} />}
          </div>

          <RefreshButton onClick={() => {}} />
        </div>
      </div>

      {/* headline */}
      <h1 className="font-serif text-[2rem] leading-tight text-[#1a2e2d] sm:text-[2.6rem] lg:text-[3.2rem]">
        Good morning, investor.
      </h1>
      <p className="mt-2 max-w-2xl text-[0.85rem] leading-6 text-[#5d6a65] sm:text-[0.9rem]">
        A calm read on what you own, what it is worth, and where the weight is building.
      </p>

      {/* status chips */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.72rem] text-[#6a7a78]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1a7a4a]" />
          Updated 3:41 PM
        </span>
        <span className="text-[#c0c8c5]">·</span>
        <span>26 positions</span>
        <span className="text-[#c0c8c5]">·</span>
        <span>Auto-refresh 15s</span>
      </div>

    </header>
  );
}
