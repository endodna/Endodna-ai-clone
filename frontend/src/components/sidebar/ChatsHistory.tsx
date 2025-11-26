import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  MessageSquare,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  useGetPatientConversations,
  useGetAllPatientConversations,
  useUpdatePatientConversationTitle,
} from "@/hooks/useDoctor";
import { useAppDispatch } from "@/store/hooks";
import { selectGlobalConversation } from "@/store/features/chat";
import { formatDate } from "@/utils/date.utils";

interface ChatsHistoryProps {
  patientId?: string;
}

export function ChatsHistory({ patientId }: Readonly<ChatsHistoryProps>) {
  const dispatch = useAppDispatch();
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

  const handleConversationClick = (conversationId: string, type: "patient" | "general", event?: React.MouseEvent, conversationPatientId?: string) => {
    // Don't select conversation if clicking on edit icon or input
    if (event && (event.target as HTMLElement).closest('.edit-controls')) {
      return;
    }
    dispatch(
      selectGlobalConversation({
        conversationId,
        type,
        patientId: type === "patient" ? (conversationPatientId || patientId) : undefined,
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
    const skeletonBg = "bg-neutral-200";
    const skeletonHighlight = "bg-neutral-100";

    return (
      <div className="flex w-full flex-col rounded-3xl border border-neutral-100 bg-white py-5">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Skeleton className={`h-9 w-9 rounded-2xl ${skeletonBg} ${skeletonHighlight}`} />
            <Skeleton className={`h-5 w-16 ${skeletonBg} ${skeletonHighlight}`} />
          </div>
          <Skeleton className={`h-8 w-8 rounded-full ${skeletonBg} ${skeletonHighlight}`} />
        </div>
        <div className="mt-4 space-y-2 px-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className={`h-16 w-full rounded-2xl ${skeletonBg} ${skeletonHighlight}`} />
          ))}
        </div>
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
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-50 text-primary">
            <MessageSquare className="h-4 w-4" />
          </span>
          <p className="typo-h5 text-neutral-900-old">Chats</p>
        </div>
        <button
          type="button"
          aria-label={isCollapsed ? "Expand chats" : "Collapse chats"}
          className="rounded-full  p-2 text-neutral-600-old transition hover:bg-neutral-100"
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
              className="gap-2 rounded-2xl border border-neutral-200 bg-white typo-body-2  text-neutral-700-old hover:bg-neutral-50"
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400-old" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                className="h-9 rounded-2xl border border-neutral-200 bg-neutral-50 pl-9 typo-body-2 text-neutral-800-old placeholder:text-neutral-400-old focus-visible:ring-0"
              />
            </div>
          </div> */}

          {!conversations.length ? (
            <div className="mt-4 px-4 py-8 text-center">
              <p className="typo-body-2 text-neutral-500-old">No chats found</p>
              <p className="typo-body-2 text-neutral-500-old">Create new chat using chatbox.</p>
            </div>
          ) : (
            <div className="mt-4 flex flex-col divide-y divide-neutral-100 px-2">
              {filteredChats.map((item) => {
                // Always use "patient" type since we only show patient conversations
                const chatType = "patient" as const;
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
                      "flex items-center justify-between gap-2 rounded-2xl px-2 py-3 transition hover:bg-primary hover:text-white",
                    )}
                  >
                    <button
                      type="button"
                      onClick={(e) => handleConversationClick(item.id, chatType, e, (item as any).patient?.id)}
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
                            className="h-7 typo-body-2 border-neutral-300 focus-visible:ring-1"
                            autoFocus
                          />
                        ) : (
                          <p className="typo-body-2 text-neutral-900-old truncate">
                            {item.title}
                          </p>
                        )}
                        <p className="typo-body-3 text-neutral-500-old">{date}</p>
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
                            className="p-1.5 rounded-full text-neutral-500-old hover:bg-neutral-200 transition"
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
                            className="p-1.5 rounded-full text-neutral-400-old hover:text-neutral-600-old hover:bg-neutral-100 transition"
                            aria-label="Edit title"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <ChevronRight className="h-4 w-4 text-neutral-400-old" />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
