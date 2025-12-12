import { AiChatInput } from "@/components/chat/AiChatInput";
import { AiChatActionButtons } from "@/components/chat/AiChatActionButtons";
import {
  useGetGeneralConversationMessages,
} from "@/hooks/useDoctor";
import { cn } from "@/lib/utils";
import {
  UserRound,
  Bot,
  LoaderCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setActiveGeneralConversation,
  setOptimisticMessage,
  setIsExternalThinking,
} from "@/store/features/chat";

interface FullPageChatInterfaceProps {
  readonly conversationId?: string | null;
}

export function FullPageChatInterface({
  conversationId: propConversationId,
}: Readonly<FullPageChatInterfaceProps>) {
  const dispatch = useAppDispatch();
  const {
    activeGeneralConversationId,
    optimisticMessage,
    isExternalThinking,
  } = useAppSelector((state) => state.chat);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastAssistantMessageIdRef = useRef<string | null>(null);
  const hasAcknowledgedOptimisticRef = useRef(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(
    propConversationId || activeGeneralConversationId || null
  );

  const { data: generalMessages, isLoading: isLoadingMessages } =
    useGetGeneralConversationMessages(currentConversationId ?? "", {
      enabled: Boolean(currentConversationId),
    });

  const currentMessages = generalMessages?.data;
  const showThinkingIndicator = isExternalThinking;

  useEffect(() => {
    hasAcknowledgedOptimisticRef.current = false;
  }, [optimisticMessage]);

  useEffect(() => {
    if (
      !optimisticMessage ||
      !currentMessages?.length ||
      hasAcknowledgedOptimisticRef.current
    ) {
      return;
    }
    const normalizedOptimistic = optimisticMessage.trim();
    const hasPersistedUserMessage = currentMessages.some(
      (msg) =>
        msg.role?.toLowerCase() === "user" &&
        msg.content?.trim() === normalizedOptimistic
    );
    if (hasPersistedUserMessage) {
      hasAcknowledgedOptimisticRef.current = true;
      dispatch(setOptimisticMessage(null));
    }
  }, [optimisticMessage, currentMessages, dispatch]);

  useEffect(() => {
    const messages = currentMessages ?? [];
    if (!messages.length) {
      return;
    }

    if (!isExternalThinking) {
      const lastAssistant = [...messages]
        .reverse()
        .find((msg) => msg.role?.toLowerCase() !== "user");
      lastAssistantMessageIdRef.current = lastAssistant?.id ?? null;
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const role = lastMessage?.role?.toLowerCase();
    if (
      role &&
      role !== "user" &&
      lastMessage?.id &&
      lastMessage.id !== lastAssistantMessageIdRef.current
    ) {
      lastAssistantMessageIdRef.current = lastMessage.id;
      dispatch(setIsExternalThinking(false));
    }
  }, [isExternalThinking, currentMessages, dispatch]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentMessages, showThinkingIndicator, optimisticMessage]);

  const handleConversationCreated = (
    conversationId: string,
    type: "patient" | "general"
  ) => {
    if (type === "general") {
      setCurrentConversationId(conversationId);
      dispatch(setActiveGeneralConversation(conversationId));
    }
  };

  const hasPersistedMessages = Boolean(currentMessages?.length);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
        {isLoadingMessages ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Loading messages...
            </p>
          </div>
        ) : hasPersistedMessages || Boolean(optimisticMessage) ? (
          <>
            {(currentMessages ?? []).map((message) => {
              const isUser = message.role?.toLowerCase() === "user";
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full items-start gap-4",
                    isUser ? "justify-end" : "justify-start"
                  )}
                >
                  {!isUser && (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-muted-foreground bg-primary-foreground text-primary">
                      <Bot className="h-5 w-5" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "flex max-w-[85%] flex-col gap-2",
                      isUser ? "items-end" : "items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "w-full rounded-2xl px-5 py-4 transition-colors",
                        isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary-foreground text-foreground border border-muted-foreground shadow-sm"
                      )}
                    >
                      <div
                        className={cn(
                          "chat-content leading-relaxed prose prose-sm max-w-none",
                          isUser
                            ? "prose-invert text-primary-foreground [&_*]:text-primary-foreground"
                            : "text-foreground"
                        )}
                      >
                        <ReactMarkdown
                          rehypePlugins={[rehypeRaw]}
                          remarkPlugins={[remarkGfm]}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      {/* Action Icons for bot responses */}
                      {!isUser && (
                        <AiChatActionButtons
                          messageId={message.id}
                          messageContent={message.content}
                          patientId={null}
                        />
                      )}
                    </div>
                    {message.createdAt && (
                      <p
                        className={cn(
                          "text-xs text-muted-foreground",
                          isUser ? "text-right" : "text-left"
                        )}
                      >
                        {new Date(message.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    )}
                  </div>
                  {isUser && (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground">
                      <UserRound className="h-5 w-5" />
                    </div>
                  )}
                </div>
              );
            })}

            {optimisticMessage && (
              <div className="flex w-full items-start gap-4 justify-end">
                <div className="flex max-w-[85%] flex-col items-end gap-2">
                  <div className="w-full rounded-2xl bg-primary px-5 py-4 text-primary-foreground">
                    <div className="prose prose-sm max-w-none prose-invert text-primary-foreground [&_*]:text-primary-foreground">
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        remarkPlugins={[remarkGfm]}
                      >
                        {optimisticMessage}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    Sending…
                  </p>
                </div>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground">
                  <UserRound className="h-5 w-5" />
                </div>
              </div>
            )}

            {/* Loading indicator when sending message */}
            {showThinkingIndicator && (
              <div className="flex w-full items-start gap-4 justify-start">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-muted-foreground bg-primary-foreground text-primary">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex max-w-[85%] flex-col items-start gap-2">
                  <div className="w-full rounded-2xl border border-muted-foreground bg-primary-foreground px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <p className="text-base font-medium text-foreground mb-1">
              Start a conversation
            </p>
            <p className="text-sm text-muted-foreground">
              Ask BIOS anything to get started.
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input at Bottom */}
      <div className="border-t border-muted-foreground bg-secondary-background px-4 md:px-8 py-4">
        <AiChatInput
          disableChatModal={true}
          onConversationCreated={handleConversationCreated}
          existingConversationId={currentConversationId}
        />
      </div>
    </div>
  );
}
