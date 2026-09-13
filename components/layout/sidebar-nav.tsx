type NavItemProps = {
  label: string;
  active?: boolean;
  icon: "overview" | "holdings";
};

function NavIcon({ icon, active = false }: Pick<NavItemProps, "icon" | "active">) {
  const cls = `h-3.5 w-3.5 shrink-0 ${active ? "text-[#f0c45a]" : "text-white/60"}`;

  if (icon === "overview") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
        className={cls} aria-hidden="true">
        <path d="M4 17V7.5A2.5 2.5 0 0 1 6.5 5H17.5A2.5 2.5 0 0 1 20 7.5V17" />
        <path d="M8 9h8M8 13h8M4 17h16" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
      className={cls} aria-hidden="true">
      <path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7" />
      <path d="M4 9.5A2.5 2.5 0 0 1 6.5 7h11A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-7z" />
      <path d="M4 12h16" />
    </svg>
  );
}

export default function SidebarNav({ label, active = false, icon }: NavItemProps) {
  return (
    <button
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.8rem] font-medium transition ${
        active
          ? "bg-white/10 text-white"
          : "text-white/60 hover:bg-white/5 hover:text-white/80"
      }`}
    >
      <NavIcon icon={icon} active={active} />
      <span>{label}</span>
    </button>
  );
}
