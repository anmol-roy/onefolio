export default function DailyReviewCard() {
  return (
    <div className="relative mt-auto overflow-hidden rounded-xl border border-white/10 bg-white/5 px-3.5 py-3.5">
      {/* decorative ring */}
      <div className="pointer-events-none absolute -right-8 -bottom-8 h-20 w-20 rounded-full border border-[#d8cda7]/20" />

      <div className="relative z-10 flex items-center gap-2 mb-2">
        <div className="flex h-4 w-4 items-center justify-center rounded-full border border-[#e0b85d]/60 bg-[#1d312f]">
          <svg viewBox="0 0 24 24" fill="none" stroke="#f0c45a" strokeWidth="2"
            className="h-2.5 w-2.5" aria-hidden="true">
            <path d="M12 3.5 5 6v5.5c0 4.2 2.7 7.9 7 10 4.3-2.1 7-5.8 7-10V6l-7-2.5z" />
            <path d="M9.5 12.5 11 14l3.5-4" />
          </svg>
        </div>
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#f0c45a]">
          Daily Review
        </span>
      </div>

      <p className="relative z-10 text-[0.7rem] leading-[1.5] text-white/60">
        Prices refresh every 15 seconds while this cockpit is open.
      </p>
    </div>
  );
}
