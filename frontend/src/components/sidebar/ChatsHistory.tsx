import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Check,
  X,
  Ellipsis,
  Pencil,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  useGetPatientConversations,
  useGetAllPatientConversations,
  useUpdatePatientConversationTitle,
  useDeletePatientConversation,
} from "@/hooks/useDoctor";
import { useAppDispatch } from "@/store/hooks";
import { selectGlobalConversation } from "@/store/features/chat";
import { formatDate } from "@/utils/date.utils";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConversationConfirmDialog } from "./DeleteConversationConfirmDialog";

interface ChatsHistoryProps {
  patientId?: string;
}

export function ChatsHistory({ patientId }: Readonly<ChatsHistoryProps>) {
  const dispatch = useAppDispatch();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingConversationId, setEditingConversationId] = useState<
    string | null
  >(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<{
    id: string;
    title: string;
    patientId: string;
  } | null>(null);

  // Always fetch patient conversations only
  // If patientId is provided, fetch conversations for that patient
  // Otherwise, fetch all patient conversations
  const { data: patientConversations, isLoading: isLoadingPatientChats } =
    useGetPatientConversations(patientId ?? "", {
      enabled: Boolean(patientId),
    });

  // Fetch all patient conversations when no patientId is provided
  const { data: allPatientConversations, isLoading: isLoadingAllPatientChats } =
    useGetAllPatientConversations({
      enabled: !patientId,
    });

  const conversations = useMemo(() => {
    // Always return patient conversations only
    if (patientId) {
      return patientConversations?.data || [];
    }
    return allPatientConversations?.data || [];
  }, [patientId, patientConversations, allPatientConversations]);

  const isLoading = patientId
    ? isLoadingPatientChats
    : isLoadingAllPatientChats;
  const updatePatientConversationTitle = useUpdatePatientConversationTitle();
  const deletePatientConversation = useDeletePatientConversation();

  const filteredChats = conversations;

  const handleConversationClick = (
    conversationId: string,
    type: "patient" | "general",
    event?: React.MouseEvent,
    conversationPatientId?: string
  ) => {
    // Don't select conversation if clicking on edit icon or input
    if (event && (event.target as HTMLElement).closest(".edit-controls")) {
      return;
    }
    dispatch(
      selectGlobalConversation({
        conversationId,
        type,
        patientId:
          type === "patient" ? conversationPatientId || patientId : undefined,
      })
    );
  };

  const handleEditClick = (
    e: React.MouseEvent,
    conversationId: string,
    currentTitle: string
  ) => {
    e.stopPropagation();
    setEditingConversationId(conversationId);
    setEditedTitle(currentTitle);
  };

  const handleSaveEdit = async (
    e: React.MouseEvent,
    conversationId: string
  ) => {
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

  const handleDeleteClick = (
    e: React.MouseEvent,
    conversationId: string,
    conversationTitle: string,
    conversationPatientId?: string
  ) => {
    e.stopPropagation();
    const patientIdToUse = conversationPatientId || patientId;
    if (!patientIdToUse) {
      return;
    }
    setConversationToDelete({
      id: conversationId,
      title: conversationTitle,
      patientId: patientIdToUse,
    });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) {
      return;
    }

    try {
      await deletePatientConversation.mutateAsync({
        patientId: conversationToDelete.patientId,
        conversationId: conversationToDelete.id,
      });
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (isLoading) {
    const skeletonBg = "bg-muted-foreground/10";
    const skeletonHighlight = "bg-neutral-100";

    return (
      <div className="flex w-full flex-col rounded-3xl border border-muted-foreground bg-primary-foreground py-5">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Skeleton
              className={`h-9 w-9 rounded-2xl ${skeletonBg} ${skeletonHighlight}`}
            />
            <Skeleton
              className={`h-5 w-16 ${skeletonBg} ${skeletonHighlight}`}
            />
          </div>
          <Skeleton
            className={`h-8 w-8 rounded-full ${skeletonBg} ${skeletonHighlight}`}
          />
        </div>
        <div className="mt-4 space-y-2 px-4">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className={`h-16 w-full rounded-2xl ${skeletonBg} ${skeletonHighlight}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col rounded-3xl border border-muted-foreground bg-primary-foreground",
        "py-5"
      )}
    >
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-muted-foreground/10 text-primary">
            <MessageSquare className="h-4 w-4" />
          </span>
          <h3 className="text-foreground">Chats</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={isCollapsed ? "Expand chats" : "Collapse chats"}
          className="rounded-full p-2"
          onClick={() => setIsCollapsed((prev) => !prev)}
        >
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4 transition-colors group-hover:text-primary" />
          ) : (
            <ChevronUp className="h-4 w-4 transition-colors group-hover:text-primary" />
          )}
        </Button>
      </div>

      {!isCollapsed && (
        <>
          {!conversations.length ? (
            <div className="mt-4 px-4 py-8 text-center">
              <p className="typo-body-2 text-foreground">No chats found</p>
              <p className="typo-body-2 text-foreground">
                Create new chat using chatbox.
              </p>
            </div>
          ) : (
            <div className="mt-4 flex flex-col px-2">
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
                      "group flex items-center justify-between gap-2 rounded-2xl px-2 py-3 transition-colors hover:bg-primary-brand-teal-2/10"
                    )}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) =>
                        handleConversationClick(
                          item.id,
                          chatType,
                          e,
                          (item as any).patient?.id
                        )
                      }
                      className="flex items-center flex-1 min-w-0 gap-2 text-left text-foreground transition-colors hover:text-primary-brand-teal-1 focus-visible:ring-primary-brand-teal-1"
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
                            className="h-7 typo-body-2 border-muted-foreground/40 text-foreground focus-visible:ring-1 focus-visible:ring-primary-brand-teal-1"
                            autoFocus
                          />
                        ) : (
                          <p className="typo-body-2 text-foreground truncate transition-colors group-hover:text-primary-brand-teal-1">
                            {item.title}
                          </p>
                        )}
                        <p className="typo-body-3 typo-body-3-regular text-foreground transition-colors group-hover:text-primary-brand-teal-2/70">
                          {date}
                        </p>
                      </div>
                    </Button>
                    <div className="flex items-center gap-1 edit-controls flex-shrink-0">
                      {isEditing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleSaveEdit(e, item.id)}
                            disabled={updatePatientConversationTitle.isPending}
                            className="rounded-full p-1.5 text-primary-brand-teal-1 transition-colors hover:bg-primary-brand-teal-2/20"
                            aria-label="Save title"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCancelEdit}
                            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted-foreground/10 hover:text-primary-brand-teal-2"
                            aria-label="Cancel edit"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:text-primary-brand-teal-1"
                              aria-label="Conversation options"
                            >
                              <Ellipsis className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(e, item.id, item.title);
                              }}
                              className="cursor-pointer"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Rename</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) =>
                                handleDeleteClick(
                                  e,
                                  item.id,
                                  item.title,
                                  (item as any).patient?.id
                                )
                              }
                              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <DeleteConversationConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        conversationTitle={conversationToDelete?.title}
        onConfirm={handleConfirmDelete}
        isDeleting={deletePatientConversation.isPending}
      />
    </div>
  );
}
