"use client";

import { useState } from "react";

// small reusable button — two variants, ghost for icon buttons and primary for the main cta
type ActionButtonProps = {
  variant?: "ghost" | "primary";
  children: React.ReactNode;
  onClick?: () => void;
};

function ActionButton({ variant = "ghost", children, onClick }: ActionButtonProps) {
  // just switching class strings based on variant, nothing fancy
  const styles =
    variant === "primary"
      ? "flex items-center gap-2 rounded-xl bg-[#1d3a39] px-4 py-2.5 text-sm font-medium text-white shadow-sm"
      : "flex h-11 w-11 items-center justify-center rounded-xl border border-[#d7d0c5] bg-[#f3f1eb] text-[#243a3b] shadow-sm";

  return (
    <button className={styles} onClick={onClick} type="button">
      {children}
    </button>
  );
}

// pulled this out so the header doesnt get too cluttered
function RefreshButton() {
  return (
    <ActionButton variant="primary">
      <span aria-hidden="true" className="text-base leading-none">↻</span>
      <span>Refresh data</span>
    </ActionButton>
  );
}

// hardcoded for now, will probably pull from an api later
const dataSources = [
  {
    name: "Yahoo Finance quotes",
    subtitle: "Live market quotes for your holdings",
    count: "24 / 26",
    badge: "purple",
    short: "Y!",
  },
  {
    name: "Google Finance fundamentals",
    subtitle: "Fundamental data for your holdings",
    count: "0 / 26",
    badge: "green",
    short: "G",
  },
  {
    // shows up when neither yahoo nor google has data
    name: "Workbook values are used when an unofficial provider is unavailable.",
    subtitle: "",
    count: "",
    badge: "neutral",
    short: "◫",
  },
];

export default function DashboardHeader() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  return (
    <header className="relative w-full px-2 pb-3 pt-3 md:px-4">

      {/* top bar — breadcrumb on left, actions on right */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[#48615e]">
          Portfolio / Overview
        </div>
        <div className="flex items-center gap-3">
          <ActionButton variant="ghost" onClick={() => setIsInfoOpen((p) => !p)}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#394d4d] text-[0.95rem] font-semibold leading-none text-[#2b3d3d]">
              i
            </span>
          </ActionButton>
          <RefreshButton />
        </div>
      </div>

      {/* main headline */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <h1 className="text-[2.5rem] font-black tracking-[-0.06em] text-[#1a2e2d] sm:text-[3.2rem] lg:text-[4.3rem]">
            Good morning, investor.
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[#5d6661] sm:text-lg">
            A calm read on what you own, what it is worth, and where the weight is building.
          </p>
        </div>
      </div>

      {/* status bar */}
      <div className="mt-5 flex flex-wrap items-center gap-3 text-[0.9rem] text-[#49565c] sm:text-base">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#1a6f53]" />
          Updated 3:41 PM
        </span>
        <span className="text-[#a0a7a4]">·</span>
        <span>26 positions</span>
        <span className="text-[#a0a7a4]">·</span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="text-base leading-none text-[#7a6a50]">↻</span>
          Auto-refresh 30s
        </span>
      </div>

      {/* info dropdown — only shown when user clicks the i button */}
      {isInfoOpen && (
        <div className="absolute right-2 top-23 z-20 w-[min(92vw,440px)] rounded-[18px] border border-[#d8d0c5] bg-[#f2efe9] p-5 shadow-[0_18px_40px_rgba(13,35,34,0.12)] md:right-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[1.05rem] font-semibold text-[#1f2f2e] md:text-[1.25rem]">
              Data refresh details
            </h2>
            <button
              type="button"
              aria-label="Close refresh details"
              className="text-2xl leading-none text-[#364a4b]"
              onClick={() => setIsInfoOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {dataSources.map((item) => (
              <div
                key={item.name}
                className="flex items-start justify-between gap-3 border-b border-[#d8d1c8] pb-4 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  {/* colored badge per source */}
                  <div
                    className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white ${
                      item.badge === "purple"
                        ? "bg-[#7a5ad8]"
                        : item.badge === "green"
                          ? "bg-[#39a35d]"
                          : "bg-[#e2e6df] text-[#5f6d6a]"
                    }`}
                  >
                    {item.short}
                  </div>
                  <div className="flex-1">
                    <div className="text-[1.05rem] font-semibold text-[#1d2d2d]">{item.name}</div>
                    {item.subtitle ? (
                      <div className="mt-1 text-sm text-[#53615f]">{item.subtitle}</div>
                    ) : null}
                  </div>
                </div>
                {/* count only shows when theres an actual value */}
                {item.count ? (
                  <div className="shrink-0 pt-1 text-lg font-semibold text-[#233b3a]">{item.count}</div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
