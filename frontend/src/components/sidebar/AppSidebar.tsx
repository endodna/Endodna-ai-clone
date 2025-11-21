import { FileStack, Plus } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import endodnaLogo from "@/assets/endodna.svg";
import endodnaSmallLogo from "@/assets/endodna_small.svg";
import { AllChatsHistory } from "./AllChatsHistory";

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      collapsible="icon"
      className={cn("flex border-none", isCollapsed ? "" : "px-2 pb-2")}
    >
      <SidebarHeader className="p-4 flex gap-6">
        <div
          className={cn(
            "relative",
            isCollapsed
              ? "flex flex-col items-center"
              : "flex items-center gap-2 relative",
          )}
        >
          <img
            src={endodnaLogo}
            alt="EndoDNA"
            className={cn(
              "h-8 w-auto transition-opacity",
              isCollapsed && "hidden",
            )}
          />
          <img
            src={endodnaSmallLogo}
            alt="EndoDNA"
            className={cn(
              "h-10 w-auto transition-opacity",
              !isCollapsed && "hidden",
            )}
          />
        </div>
        <div className={cn("flex flex-col", isCollapsed ? "gap-4" : "gap-10")}>
          <Button
            className={cn(
              "transition-all text-violet-600 hover:text-violet-600 hover:bg-transparent",
              isCollapsed ? "w-auto px-2 justify-center" : "w-20 px-6",
            )}
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
          >
            <Plus
              className={cn("h-4 w-4", isCollapsed ? "mr-0 text-primary" : "")}
            />
            {!isCollapsed && <p className="text-sm">New Chat</p>}
          </Button>
          <div className="flex items-center gap-2">
            <FileStack
              className={cn(
                "h-4 w-4",
                isCollapsed ? "mr-0 text-primary" : "text-neutral-500",
              )}
            />
            {!isCollapsed && (
              <span className="text-sm font-medium text-neutral-500">
                Chats history
              </span>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="flex flex-col gap-3 flex-1 min-h-0">
          <SidebarGroupContent className="flex-1 min-h-0">
            {!isCollapsed && <AllChatsHistory />}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
