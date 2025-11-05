import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { TopNavigation } from "@/components/navigation/TopNavigation";

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-neutral-100 flex">
        <AppSidebar />
        <div className="flex-1 flex flex-col bg-white rounded-l-3xl shadow-xl">
          <TopNavigation />
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
