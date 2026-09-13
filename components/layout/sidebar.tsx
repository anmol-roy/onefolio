import DailyReviewCard from "./daily-review-card";
import SidebarNav from "./sidebar-nav";

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-full max-w-55 flex-col rounded-r-[12px] bg-[#0e3a3a] px-4 pb-3 pt-5 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)] sm:max-w-75 xl:max-w-63">

      {/* logo + app name */}
      <div className="flex items-center gap-3 px-2 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e0b85d] text-base font-bold text-[#0d2b2a] shadow-inner shadow-white/10">
          OC
        </div>
        <div className="leading-none">
          <h1 className="text-[1.4rem] font-semibold tracking-tight text-[#f5efe8]">Openfolio</h1>
          <p className="mt-2 text-[0.48rem] font-medium uppercase tracking-[0.22em] text-white/60">
            Personal Cockpit
          </p>
        </div>
      </div>

      <nav className="mt-2 space-y-1.5 px-1">
        <SidebarNav label="Overview" active icon="overview" />
        <SidebarNav label="Holdings" icon="holdings" />
      </nav>

      {/* pushes the review card to the bottom */}
      <DailyReviewCard />

      <div className="mt-4 flex items-center gap-2 px-2 pb-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-white/50">
        <span>India</span>
        <span>•</span>
        <span>INR</span>
        <span>•</span>
        <span>IST</span>
      </div>
    </aside>
  );
}
