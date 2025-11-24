import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { TopNavigation } from "@/components/navigation/TopNavigation";
import { GlobalChatModal } from "@/components/chat/GlobalChatModal";

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-neutral-100 flex">
        <AppSidebar />
        <div className="flex-1 flex flex-col bg-neutral-100 rounded-l-3xl shadow-xl">
          <TopNavigation />
          <main className="flex-1 pt-6 md:pt-11 px-4 md:px-[63px] pb-4 md:pb-6">
            <Outlet />
          </main>
        </div>
      </div>
      <GlobalChatModal />
    </SidebarProvider>
  );
}
