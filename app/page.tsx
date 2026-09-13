import MainLayout from "@/components/layout/main-layout";
import Sidebar from "@/components/layout/sidebar";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#d9d9d9] p-0 flex ">
      <Sidebar />
      <MainLayout />
    </main>
  );
}