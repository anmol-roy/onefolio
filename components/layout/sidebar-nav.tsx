type NavItemProps = {
  label: string;
  active?: boolean;
  icon: "overview" | "holdings";
};

function NavIcon({ icon, active = false }: Pick<NavItemProps, "icon" | "active">) {
  const common = "h-4 w-4 shrink-0";

  if (icon === "overview") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        className={`${common} ${active ? "text-[#f0c45a]" : "text-white/80"}`}
        aria-hidden="true"
      >
        <path d="M4 17V7.5A2.5 2.5 0 0 1 6.5 5H17.5A2.5 2.5 0 0 1 20 7.5V17" />
        <path d="M8 9h8M8 13h8M4 17h16" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className={`${common} ${active ? "text-[#f0c45a]" : "text-white/80"}`}
      aria-hidden="true"
    >
      <path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7" />
      <path d="M4 9.5A2.5 2.5 0 0 1 6.5 7h11A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-7z" />
      <path d="M4 12h16" />
    </svg>
  );
}

export default function SidebarNav({ label, active = false, icon }: NavItemProps) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
        active
          ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
          : "text-white/80 hover:bg-white/5"
      }`}
    >
      <NavIcon icon={icon} active={active} />
      <span>{label}</span>
    </button>
  );
}
