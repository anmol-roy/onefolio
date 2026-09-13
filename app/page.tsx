import Sidebar from "@/components/layout/sidebar";
import MainLayout from "@/components/layout/main-layout";

export default function Page() {
  return (
    <main className="flex min-h-screen bg-[#d9d9d9]">
      <Sidebar />
      <MainLayout />
    </main>
  );
}
