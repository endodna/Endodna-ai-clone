import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  MessageSquare,
  Plus,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

const chatHistory = [
  {
    title: "Mary Ann - Blood test...",
    date: "12/24/2025 - 09:15 am",
    url: "#",
  },
  {
    title: "Mary Ann - Blood test...",
    date: "12/24/2025 - 09:15 am",
    url: "#",
  },
  {
    title: "Mary Ann - Blood test...",
    date: "12/24/2025 - 09:15 am",
    url: "#",
  },
];

export function ChatsHistory() {
  const [query, setQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredChats = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) {
      return chatHistory;
    }
    return chatHistory.filter((chat) =>
      chat.title.toLowerCase().includes(normalized),
    );
  }, [query]);

  if (!chatHistory.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center">
        <p className="text-sm text-neutral-600">
          Start a new conversation to explore insights, ask questions, or kick
          off a fresh interaction.
        </p>
        <Button variant="ghost" size="sm" className="gap-2 text-violet-600">
          <Plus className="h-4 w-4" />
          Create new chat
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col rounded-3xl border border-neutral-100 bg-white",
        "py-5",
      )}
    >
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            <MessageSquare className="h-4 w-4" />
          </span>
          <p className="text-lg font-semibold text-neutral-900">Chats</p>
        </div>
        <button
          type="button"
          aria-label={isCollapsed ? "Expand chats" : "Collapse chats"}
          className="rounded-full  p-2 text-neutral-600 transition hover:bg-neutral-100"
          onClick={() => setIsCollapsed((prev) => !prev)}
        >
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <>
          <div className="flex items-center gap-2 px-4 pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 rounded-2xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                className="h-9 rounded-2xl border border-neutral-200 bg-neutral-50 pl-9 text-sm text-neutral-800 placeholder:text-neutral-400 focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col divide-y divide-neutral-100 px-2">
            {filteredChats.map((item, index) => (
              <Link
                key={`${item.title}-${index}`}
                to={item.url}
                className="flex items-center justify-between gap-2 rounded-2xl px-2 py-3 text-left transition hover:bg-neutral-50"
              >
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-neutral-900">
                    {item.title}
                  </p>
                  <p className="text-xs text-neutral-500">{item.date}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
