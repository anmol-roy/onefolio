function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-3 w-3 text-[#f0c45a]"
      aria-hidden="true"
    >
      <path d="M12 3.5 5 6v5.5c0 4.2 2.7 7.9 7 10 4.3-2.1 7-5.8 7-10V6l-7-2.5z" />
      <path d="M9.5 12.5 11 14l3.5-4" />
    </svg>
  );
}

export default function DailyReviewCard() {
  return (
    <div className="relative mt-auto overflow-hidden rounded-[18px] border border-[#d5c7a7]/50 bg-[#e6e4de]/10 px-4 py-4 text-white/90 backdrop-blur-[1px]">
      <div className="pointer-events-none absolute -right-14 -bottom-10 h-28 w-28 rounded-full border-[2px] border-[#d8cda7]/35" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-32 w-32 rounded-full border-[2px] border-[#d8cda7]/35" />

      <div className="relative z-10 flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-[#e0b85d] bg-[#1d312f] text-[#f0c45a]">
          <ShieldIcon />
        </div>
        <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#f0c45a]">
          Daily Review
        </div>
      </div>

      <p className="relative z-10 mt-3 max-w-[220px] text-[12px] leading-5 text-[#f9f5f0]/90">
        Prices refresh automatically every 15 seconds while this cockpit is open.
      </p>
    </div>
  );
}
