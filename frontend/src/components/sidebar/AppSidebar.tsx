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
import bellaVitaLogo from "@/assets/bellaVita.svg";
import bellaVitaSmallLogo from "@/assets/bellaVita_small.svg";
import { AllChatsHistory } from "./AllChatsHistory";
import { useCreateGeneralConversation } from "@/hooks/useDoctor";
import { useAppDispatch } from "@/store/hooks";
import { selectGlobalConversation } from "@/store/features/chat";
import { toast } from "sonner";

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const dispatch = useAppDispatch();
  const createGeneralConversation = useCreateGeneralConversation();

  const handleNewChatClick = async () => {
    try {
      const response = await createGeneralConversation.mutateAsync({});
      
      if (response.error || !response.data) {
        toast.error(response.message || "Unable to create conversation.");
        return;
      }

      const conversationId = response.data.id;
      
      // Open GlobalChatModal with the new general conversation
      dispatch(
        selectGlobalConversation({
          conversationId,
          type: "general",
        })
      );
    } catch (error: any) {
      toast.error(error?.message || "Unable to create conversation.");
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className={cn("flex border-none", isCollapsed ? "" : "px-2 pb-2")}
    >
      <SidebarHeader className="p-4 flex gap-6">
        <div
          className={cn(
            "relative flex flex-col gap-1",
            isCollapsed ? "items-center" : "items-start",
          )}
        >
          <img
            src={bellaVitaLogo}
            alt="BellaVita"
            className={cn(
              "h-8 w-auto flex-shrink-0 transition-opacity",
              isCollapsed && "hidden",
            )}
          />
          <img
            src={bellaVitaSmallLogo}
            alt="BellaVita"
            className={cn(
              "h-10 w-10 flex-shrink-0 object-contain transition-opacity",
              !isCollapsed && "hidden",
            )}
          />
          {!isCollapsed && (
            <p className="typo-body-2">
              Powered by BIOS ai
            </p>
          )}
        </div>
        <div className={cn("flex flex-col", isCollapsed ? "gap-4" : "gap-10")}>
          <Button
            className={cn(
              "transition-all text-violet-600 hover:text-violet-600 hover:bg-transparent",
              isCollapsed ? "w-auto px-2 justify-center" : "w-20 px-6",
            )}
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            onClick={handleNewChatClick}
          >
            <Plus
              className={cn("h-4 w-4", isCollapsed ? "mr-0 text-primary" : "")}
            />
            {!isCollapsed && <p className="typo-body-2">New Chat</p>}
          </Button>
          <div className="flex items-center gap-2">
            <FileStack
              className={cn(
                "h-4 w-4",
                isCollapsed ? "mr-0 text-primary" : "text-neutral-500-old",
              )}
            />
            {!isCollapsed && (
              <span className="typo-body-2">
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
