import { AiSummary } from "@/components/patients/patientProfile/aiSummary/AiSummary";
import {
  useCreateAiAssistantConversation,
  useSendAiAssistantConversationMessage,
  useGetGeneralConversationMessages,
} from "@/hooks/useDoctor";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { UserRound, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AiChatActionButtons } from "@/components/chat/AiChatActionButtons";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { useAppSelector } from "@/store/hooks";
import { queryKeys } from "@/components/constants/QueryKeys";
import { useQueryClient } from "@tanstack/react-query";

export default function AiAssistantPage() {
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { optimisticMessage, isExternalThinking } = useAppSelector(
    (state) => state.chat
  );

  const createAiAssistantConversation = useCreateAiAssistantConversation();
  const sendAiAssistantConversationMessage =
    useSendAiAssistantConversationMessage();

  // Fetch messages when conversation ID exists
  const { data: messagesData } = useGetGeneralConversationMessages(
    conversationId ?? "",
    {
      enabled: !!conversationId,
    }
  );

  const messages = messagesData?.data ?? [];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, optimisticMessage]);

  const handleCreateConversation = async () => {
    const response = await createAiAssistantConversation.mutateAsync();
    if (!response.error && response.data) {
      setConversationId(response.data.id);
    }
    return {
      error: response.error,
      data: response.data ? { id: response.data.id } : undefined,
      message: response.message,
    };
  };

  const handleSendMessage = async (conversationId: string, message: string) => {
    const response = await sendAiAssistantConversationMessage.mutateAsync({
      conversationId,
      message,
    });

    // Invalidate messages to refresh
    queryClient.invalidateQueries({
      queryKey:
        queryKeys.doctor.chat.general.conversationMessages(conversationId),
    });

    return {
      error: response.error,
      message: response.message,
    };
  };

  const handleConversationCreated = (
    newConversationId: string,
    type: "patient" | "general"
  ) => {
    if (type === "general") {
      setConversationId(newConversationId);
    }
  };

  const isProcessing =
    createAiAssistantConversation.isPending ||
    sendAiAssistantConversationMessage.isPending;

  const hasMessages = messages.length > 0 || optimisticMessage;

  return (
    <div
      className={cn(
        "flex flex-col w-full bg-white rounded-2xl overflow-hidden",
        hasMessages ? "" : "items-center justify-center"
      )}
      style={{
        height: "calc(100vh - 140px)",
        maxHeight: "calc(100vh - 140px)",
      }}
    >
      {/* Messages Area */}
      {hasMessages && (
        <div className="flex-1 overflow-y-auto w-full px-4 py-6 bg-white rounded-2xl min-h-0">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => {
              const isUser = message.role?.toLowerCase() === "user";
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full items-start gap-3",
                    isUser ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border text-sm",
                      isUser
                        ? "order-2 border-muted-primary bg-primary text-white"
                        : "order-1 border-muted-primary text-primary"
                    )}
                  >
                    {isUser ? (
                      <UserRound className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex max-w-[75%] flex-col gap-1.5 text-sm leading-relaxed",
                      isUser ? "order-1 items-end" : "order-2 items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "w-full rounded-3xl px-5 py-4 transition-colors",
                        isUser
                          ? "bg-primary text-white"
                          : "bg-white text-foreground border border-muted-foreground shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
                      )}
                    >
                      <div
                        className={cn(
                          "chat-content leading-relaxed prose prose-sm max-w-none",
                          isUser
                            ? "prose-invert text-white [&_*]:text-white"
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
                        />
                      )}
                    </div>
                    {message.createdAt && (
                      <p
                        className={cn(
                          "text-xs text-neutral-400 mt-1",
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
                </div>
              );
            })}

            {/* Optimistic message */}
            {optimisticMessage && (
              <div className="flex w-full items-start gap-3 justify-end">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-muted-primary bg-primary text-white order-2">
                  <UserRound className="h-4 w-4" />
                </div>
                <div className="flex max-w-[75%] flex-col gap-1.5 text-sm leading-relaxed order-1 items-end">
                  <div className="w-full rounded-3xl px-5 py-4 bg-primary text-white">
                    <div className="chat-content leading-relaxed prose prose-sm max-w-none prose-invert text-white [&_*]:text-white">
                      {optimisticMessage}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isExternalThinking && (
              <div className="flex w-full items-start gap-3 justify-start">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-muted-primary bg-violet-50 text-primary order-1">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex max-w-[75%] flex-col gap-1.5 text-sm leading-relaxed order-2 items-start">
                  <div className="w-full rounded-3xl px-5 py-4 bg-white text-foreground border border-muted-foreground shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex gap-1">
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-neutral-400"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-neutral-400"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-neutral-400"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Input Area - Always at bottom */}
      <div
        className={cn(
          "w-full rounded-2xl flex-shrink-0",
          hasMessages ? "bg-white " : ""
        )}
      >
        <div className="max-w-3xl mx-auto p-4">
          <AiSummary
            customCreateConversation={handleCreateConversation}
            customSendMessage={handleSendMessage}
            customIsProcessing={isProcessing}
            disableChatModal={true}
            onConversationCreated={handleConversationCreated}
            existingConversationId={conversationId}
          />
        </div>
      </div>
    </div>
  );
}
