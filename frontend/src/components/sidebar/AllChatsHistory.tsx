import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import {
  useGetAllPatientConversations,
  useGetGeneralConversations,
} from "@/hooks/useDoctor";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectConversation } from "@/store/features/chat";
import { formatDate } from "@/utils/date.utils";

export function AllChatsHistory() {
  const dispatch = useAppDispatch();
  const { selectedConversationId } = useAppSelector(
    (state) => state.chat
  );
  const [globalResearchCollapsed, setGlobalResearchCollapsed] = useState(false);
  const [patientResearchCollapsed, setPatientResearchCollapsed] = useState(false);

  // Fetch general conversations (Global Research)
  const {
    data: generalConversations,
    isLoading: isLoadingGeneralChats,
  } = useGetGeneralConversations();

  // Fetch all patient conversations (Patient Research)
  const {
    data: allPatientConversations,
    isLoading: isLoadingAllPatientChats,
  } = useGetAllPatientConversations({
    enabled: true,
  });

  const isLoading = isLoadingGeneralChats || isLoadingAllPatientChats;

  const handleConversationClick = (conversationId: string, type: "patient" | "general") => {
    dispatch(
      selectConversation({
        conversationId,
        type,
      })
    );
  };

  const renderConversationItem = (
    item: { id: string; title: string; createdAt?: string | Date; updatedAt?: string | Date; patient?: { id: string } | null },
    chatType: "patient" | "general"
  ) => {
    const isSelected = selectedConversationId === item.id;
    const dateObj = item.createdAt
      ? new Date(item.createdAt)
      : item.updatedAt
        ? new Date(item.updatedAt)
        : null;
    const date = dateObj
      ? `${formatDate(dateObj, "MM/DD/YYYY")} - ${formatDate(dateObj, "").toLowerCase()}`
      : "";

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleConversationClick(item.id, chatType)}
        className={cn(
          "flex items-center justify-between w-full py-2 text-left transition",
          isSelected && "bg-violet-50"
        )}
      >
        <div className="flex flex-col flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900 truncate">
            {item.title}
          </p>
          <p className="text-xs text-neutral-500">{date}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-neutral-400 flex-shrink-0" />
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="flex w-full flex-col space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-32" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const globalChats = generalConversations?.data || [];
  const patientChats = allPatientConversations?.data || [];

  if (!globalChats.length && !patientChats.length) {
    return null;
  }

  return (
    <div className="flex w-full flex-col">
      <div className="flex flex-col gap-4">
        {/* Global Research Section */}
        {globalChats.length > 0 && (
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setGlobalResearchCollapsed((prev) => !prev)}
              className="flex items-center justify-between py-2 text-left"
            >
              <p className="text-sm font-semibold text-neutral-900">Global Research</p>
              {globalResearchCollapsed ? (
                <ChevronDown className="h-4 w-4 text-neutral-400" />
              ) : (
                <ChevronUp className="h-4 w-4 text-neutral-400" />
              )}
            </button>
            {!globalResearchCollapsed && (
              <div className="flex flex-col">
                {globalChats.map((item) =>
                  renderConversationItem(item, "general")
                )}
              </div>
            )}
          </div>
        )}

        {/* Patient Research Section */}
        {patientChats.length > 0 && (
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setPatientResearchCollapsed((prev) => !prev)}
              className="flex items-center justify-between py-2 text-left"
            >
              <p className="text-sm font-semibold text-neutral-900">Patient Research</p>
              {patientResearchCollapsed ? (
                <ChevronDown className="h-4 w-4 text-neutral-400" />
              ) : (
                <ChevronUp className="h-4 w-4 text-neutral-400" />
              )}
            </button>
            {!patientResearchCollapsed && (
              <div className="flex flex-col">
                {patientChats.map((item) =>
                  renderConversationItem(item, "patient")
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

