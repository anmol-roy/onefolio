import DailyReviewCard from "./daily-review-card";
import SidebarNav from "./sidebar-nav";

export default function Sidebar() {
  return (
    // sticky so it stays in place while main content scrolls
    <aside className="sticky top-0 flex h-screen w-[220px] shrink-0 flex-col bg-[#0c3535] px-3 pb-3 pt-4 text-white">

      {/* logo */}
      <div className="flex items-center gap-2.5 px-1.5 pb-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e0b85d] text-[0.7rem] font-bold text-[#0d2b2a]">
          OC
        </div>
        <div className="leading-none">
          <div className="text-[0.95rem] font-semibold tracking-tight text-[#f5efe8]">Openfolio</div>
          <div className="mt-1 text-[0.45rem] font-medium uppercase tracking-[0.22em] text-white/50">
            Personal Cockpit
          </div>
        </div>
      </div>

      {/* nav */}
      <nav className="space-y-0.5 px-0.5">
        <SidebarNav label="Overview" active icon="overview" />
        <SidebarNav label="Holdings" icon="holdings" />
      </nav>

      {/* daily review card pushed to bottom */}
      <DailyReviewCard />

      {/* locale footer */}
      <div className="mt-3 flex items-center gap-1.5 px-1.5 text-[0.58rem] font-medium uppercase tracking-[0.16em] text-white/40">
        <span>India</span>
        <span>·</span>
        <span>INR</span>
        <span>·</span>
        <span>IST</span>
      </div>
    </aside>
  );
}
