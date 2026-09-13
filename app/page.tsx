import Sidebar from "@/components/layout/sidebar";
import MainLayout from "@/components/layout/main-layout";

export default function Page() {
  return (
    // overflow-hidden on root so only main-layout scrolls, not the whole page
    <div className="flex h-screen overflow-hidden bg-[#eae5dc]">
      <Sidebar />
      <MainLayout />
    </div>
  );
}
