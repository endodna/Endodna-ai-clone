import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  MessageSquare,
  Pencil,
  Plus,
  Check,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  useGetPatientConversations,
  useGetAllPatientConversations,
  useUpdatePatientConversationTitle,
} from "@/hooks/useDoctor";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectConversation } from "@/store/features/chat";
import { formatDate } from "@/utils/date.utils";

interface ChatsHistoryProps {
  patientId?: string;
}

export function ChatsHistory({ patientId }: ChatsHistoryProps) {
  const dispatch = useAppDispatch();
  const { selectedConversationId } = useAppSelector(
    (state) => state.chat
  );
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");

  // Always fetch patient conversations only
  // If patientId is provided, fetch conversations for that patient
  // Otherwise, fetch all patient conversations
  const {
    data: patientConversations,
    isLoading: isLoadingPatientChats,
  } = useGetPatientConversations(patientId ?? "", {
    enabled: Boolean(patientId),
  });

  // Fetch all patient conversations when no patientId is provided
  const {
    data: allPatientConversations,
    isLoading: isLoadingAllPatientChats,
  } = useGetAllPatientConversations({
    enabled: !patientId,
  });

  const conversations = useMemo(() => {
    // Always return patient conversations only
    if (patientId) {
      return patientConversations?.data || [];
    }
    return allPatientConversations?.data || [];
  }, [
    patientId,
    patientConversations,
    allPatientConversations,
  ]);

  const isLoading = patientId ? isLoadingPatientChats : isLoadingAllPatientChats;
  const updatePatientConversationTitle = useUpdatePatientConversationTitle();

  const filteredChats = conversations;

  const handleConversationClick = (conversationId: string, type: "patient" | "general", event?: React.MouseEvent) => {
    // Don't select conversation if clicking on edit icon or input
    if (event && (event.target as HTMLElement).closest('.edit-controls')) {
      return;
    }
    dispatch(
      selectConversation({
        conversationId,
        type,
      })
    );
  };

  const handleEditClick = (e: React.MouseEvent, conversationId: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingConversationId(conversationId);
    setEditedTitle(currentTitle);
  };

  const handleSaveEdit = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (!patientId || !editedTitle.trim()) {
      setEditingConversationId(null);
      return;
    }

    try {
      await updatePatientConversationTitle.mutateAsync({
        patientId,
        conversationId,
        title: editedTitle.trim(),
      });
      setEditingConversationId(null);
      setEditedTitle("");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConversationId(null);
    setEditedTitle("");
  };

  if (isLoading) {
    return (
      <div className="flex w-full flex-col rounded-3xl border border-neutral-100 bg-white py-5">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-2xl" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="mt-4 space-y-2 px-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!conversations.length) {
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
          {/* <div className="flex items-center gap-2 px-4 pt-4">
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
          </div> */}


          <div className="mt-4 flex flex-col divide-y divide-neutral-100 px-2">
            {filteredChats.map((item) => {
              // Always use "patient" type since we only show patient conversations
              const chatType = "patient" as const;
              const isSelected = selectedConversationId === item.id;
              const dateObj = item.createdAt
                ? new Date(item.createdAt)
                : item.updatedAt
                  ? new Date(item.updatedAt)
                  : null;
              const date = dateObj
                ? `${formatDate(dateObj, "MM/DD/YYYY")} - ${formatDate(dateObj, "").toLowerCase()}`
                : "";

              const isEditing = editingConversationId === item.id;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-2xl px-2 py-3 transition",
                    isSelected
                      ? "bg-violet-50 hover:bg-violet-100"
                      : "hover:bg-neutral-50"
                  )}
                >
                  <button
                    type="button"
                    onClick={(e) => handleConversationClick(item.id, chatType, e)}
                    className="flex items-center flex-1 min-w-0 gap-2 text-left"
                  >
                    <div className="flex flex-col flex-1 min-w-0">
                      {isEditing ? (
                        <Input
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSaveEdit(e as any, item.id);
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              handleCancelEdit(e as any);
                            }
                          }}
                          className="h-7 text-sm font-medium border-neutral-300 focus-visible:ring-1 focus-visible:ring-violet-500"
                          autoFocus
                        />
                      ) : (
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {item.title}
                        </p>
                      )}
                      <p className="text-xs text-neutral-500">{date}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 edit-controls flex-shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleSaveEdit(e, item.id)}
                          disabled={updatePatientConversationTitle.isPending}
                          className="p-1.5 rounded-full text-violet-600 hover:bg-violet-100 transition"
                          aria-label="Save title"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="p-1.5 rounded-full text-neutral-500 hover:bg-neutral-200 transition"
                          aria-label="Cancel edit"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleEditClick(e, item.id, item.title)}
                          className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition"
                          aria-label="Edit title"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <ChevronRight className="h-4 w-4 text-neutral-400" />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
