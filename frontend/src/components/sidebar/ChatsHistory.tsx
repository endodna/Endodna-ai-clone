import { Link } from "react-router-dom";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const chatHistory = [
  {
    title: "Mary Ann - Blood test...",
    date: "12/24/2025 - 09:15 am",
    url: "#",
  },
  {
    title: "Victor B. - Genetics ov...",
    date: "12/24/2025 - 07:15 am",
    url: "#",
  },
  {
    title: "Victor B. - Genetics ov...",
    date: "12/24/2025 - 07:15 am",
    url: "#",
  },
  {
    title: "Victor B. - Genetics ov...",
    date: "12/24/2025 - 07:15 am",
    url: "#",
  },
  {
    title: "Victor B. - Genetics ov...",
    date: "12/24/2025 - 07:15 am",
    url: "#",
  },
  {
    title: "Victor B. - Genetics ov...",
    date: "12/24/2025 - 07:15 am",
    url: "#",
  },
  {
    title: "Victor B. - Genetics ov...",
    date: "12/24/2025 - 07:15 am",
    url: "#",
  },
  {
    title: "Victor B. - Genetics ov...",
    date: "12/24/2025 - 07:15 am",
    url: "#",
  },
  {
    title: "Victor B. - Genetics ov...",
    date: "12/24/2025 - 07:15 am",
    url: "#",
  },
  {
    title: "Victor B. - Genetics ov...",
    date: "12/24/2025 - 07:15 am",
    url: "#",
  },
  {
    title: "Victor B. - Genetics ov...",
    date: "12/24/2025 - 07:15 am",
    url: "#",
  },
  {
    title: "Victor B. - Genetics ov...",
    date: "12/24/2025 - 07:15 am",
    url: "#",
  },
  {
    title: "Victor B. - Genetics ov...",
    date: "12/24/2025 - 07:15 am",
    url: "#",
  },
  {
    title: "Victor B. - Genetics ov...",
    date: "12/24/2025 - 07:15 am",
    url: "#",
  },
  {
    title: "Victor B. - Genetics ov...",
    date: "12/24/2025 - 07:15 am",
    url: "#",
  },
  {
    title: "Victor B. - Genetics ov...",
    date: "12/24/2025 - 07:15 am",
    url: "#",
  },
  {
    title: "Victor B. - Genetics ov...",
    date: "12/24/2025 - 07:15 am",
    url: "#",
  },
];

export function ChatsHistory() {
  return chatHistory.length > 1000 ? (
    <SidebarMenu className="flex flex-col gap-4">
      {chatHistory.map((item, index) => (
        <SidebarMenuItem key={index}>
          <SidebarMenuButton asChild className="justify-between">
            <Link
              to={item.url}
              className="flex items-center justify-between w-full"
            >
              <div className="flex flex-col items-start">
                <span className="text-sm">{item.title}</span>
                <span className="text-xs text-gray-500">{item.date}</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  ) : (
    <div className="flex flex-col items-center justify-center gap-3 bg-neutral-200 p-8 rounded-lg border border-neutral-300 border-2 h-full min-h-0 flex-1">
      <p className="text-sm text-center text-neutral-600">
        Start a new conversation to explore insights, ask questions, or kick off
        a fresh interaction.
      </p>
      <Button
        className={"hover:bg-transparent"}
        variant="ghost"
        size={"default"}
      >
        <Plus className={"h-4 w-4 text-neutral-950"} />
        <p className="text-sm font-medium">Create new chat</p>
      </Button>
    </div>
  );
}
