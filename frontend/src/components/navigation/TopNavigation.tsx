import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import {
  PanelLeftClose,
  PanelRightClose,
  User,
  Syringe,
  LogOut,
  Dna,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { title: "Home", url: "/dashboard" },
  { title: "Quick Actions", url: "/dashboard/quick-actions" },
  { title: "AI Assistant", url: "/dashboard/ai-assistant" },
  { title: "Patients", url: "/dashboard/patients" },
  { title: "Care Strategy", url: "/dashboard/care-strategy" },
  { title: "Labs", url: "/dashboard/labs" },
  { title: "Automation", url: "/dashboard/automation" },
  { title: "Manage Clinic", url: "/dashboard/manage-clinic" },
];

export function TopNavigation() {
  const location = useLocation();
  const { userConfig, signOut } = useAuth();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex gap-2 items-center justify-between w-full px-6 pt-4">
      {
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 transition-all",
            isCollapsed ? "relative mt-2" : "top-0 right-0",
          )}
          onClick={toggleSidebar}
        >
          {isCollapsed ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      }
      <nav className="bg-muted-foreground w-full rounded-3xl rounded-l-2xl p-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center px-2 gap-4">
            {navItems.map((item) => (
              <Button
                key={item.title}
                variant="default"
                size="sm"
                className={cn(
                  " rounded-xl border-0 text-foreground min-w-20 w-auto hover:bg-primary-foreground px-4 shadow-sm typo-body-2",
                  location.pathname === item.url
                    ? "bg-primary-foreground"
                    : "bg-transparent shadow-none",
                )}
                onClick={() => navigate(item.url)}
              >
                {item.title}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="cursor-pointer">
                  <Avatar className="border-2 border-primary-foreground">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {userConfig?.firstName?.[0] || "U"}
                      {userConfig?.lastName?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-primary-foreground border border-muted-foreground shadow-lg rounded-md"
              >
                <DropdownMenuLabel className="px-2 py-1.5">
                  Settings
                </DropdownMenuLabel>
                <DropdownMenuItem className="cursor-pointer px-2 py-1.5 ">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer px-2 py-1.5">
                  <Syringe className="mr-2 h-4 w-4" />
                  <span>Integrations</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer px-2 py-1.5">
                  <Dna className="mr-2 h-4 w-4" />
                  <span>Support</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer px-2 py-1.5"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
    </div>
  );
}
