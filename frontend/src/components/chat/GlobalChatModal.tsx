import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    useGetGeneralConversationMessages,
    useGetPatientConversationMessages,
    useSendGeneralConversationMessage,
    useSendPatientConversationMessage,
} from "@/hooks/useDoctor";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/components/constants/QueryKeys";
import { cn } from "@/lib/utils";
import {
    MessageSquare,
    SendHorizontal,
    UserRound,
    Bot,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    closeGlobalChatModal,
    setOptimisticMessage,
    setIsExternalThinking,
} from "@/store/features/chat";

export function GlobalChatModal() {
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();
    const {
        activePatientConversationId,
        activeGeneralConversationId,
        isGlobalChatModalOpen,
        selectedConversationId,
        conversationType,
        selectedPatientId,
        optimisticMessage,
        isExternalThinking,
    } = useAppSelector((state) => state.chat);
    const [chatModalPrompt, setChatModalPrompt] = useState("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const lastAssistantMessageIdRef = useRef<string | null>(null);
    const hasAcknowledgedOptimisticRef = useRef(false);

    // Use selectedConversationId from Redux if available, otherwise use active conversation
    const currentPatientConversationId = conversationType === "patient" && selectedConversationId
        ? selectedConversationId
        : activePatientConversationId;
    const currentGeneralConversationId = conversationType === "general" && selectedConversationId
        ? selectedConversationId
        : activeGeneralConversationId;

    const { data: patientMessages, isLoading: isLoadingPatientMessages } = useGetPatientConversationMessages(
        selectedPatientId ?? "",
        currentPatientConversationId ?? "",
        {
            enabled: Boolean(selectedPatientId) && Boolean(currentPatientConversationId) && isGlobalChatModalOpen && conversationType === "patient",
        }
    );
    const { data: generalMessages, isLoading: isLoadingGeneralMessages } = useGetGeneralConversationMessages(
        currentGeneralConversationId ?? "",
        {
            enabled: Boolean(currentGeneralConversationId) && isGlobalChatModalOpen && conversationType === "general",
        }
    );

    const sendPatientConversationMessage = useSendPatientConversationMessage();
    const sendGeneralConversationMessage = useSendGeneralConversationMessage();

    const currentMessages = conversationType === "patient"
        ? patientMessages?.data
        : generalMessages?.data;
    const currentConversationId = conversationType === "patient"
        ? currentPatientConversationId
        : currentGeneralConversationId;
    const isLoadingMessages = conversationType === "patient"
        ? isLoadingPatientMessages
        : isLoadingGeneralMessages;
    const isSendingMessage = sendPatientConversationMessage.isPending || sendGeneralConversationMessage.isPending;
    const showThinkingIndicator = isSendingMessage || isExternalThinking;

    useEffect(() => {
        hasAcknowledgedOptimisticRef.current = false;
    }, [optimisticMessage]);

    useEffect(() => {
        if (!optimisticMessage || !currentMessages?.length || hasAcknowledgedOptimisticRef.current) {
            return;
        }
        const normalizedOptimistic = optimisticMessage.trim();
        const hasPersistedUserMessage = currentMessages.some(
            (msg) =>
                msg.role?.toLowerCase() === "user" &&
                msg.content?.trim() === normalizedOptimistic,
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

    // Auto-scroll to bottom when messages change or when sending
    useEffect(() => {
        if (isGlobalChatModalOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [currentMessages, isGlobalChatModalOpen, isSendingMessage]);

    const handleChatModalKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleChatModalSubmit();
        }
    };

    const hasPersistedMessages = Boolean(currentMessages?.length);

    const handleChatModalSubmit = async () => {
        const message = chatModalPrompt.trim();
        if (!message || !currentConversationId) {
            return;
        }

        if (isSendingMessage) {
            return;
        }

        // Clear input immediately for better UX
        const messageToSend = message;
        setChatModalPrompt("");

        try {
            if (conversationType === "patient" && currentPatientConversationId && selectedPatientId) {
                const response = await sendPatientConversationMessage.mutateAsync({
                    patientId: selectedPatientId,
                    conversationId: currentPatientConversationId,
                    message: messageToSend,
                });

                if (response.error) {
                    toast.error(response.message || "Unable to send message.");
                    // Restore message if error occurred
                    setChatModalPrompt(messageToSend);
                    return;
                }

                // Invalidate messages query to refresh chat
                queryClient.invalidateQueries({
                    queryKey: queryKeys.doctor.chat.patient.conversationMessages(selectedPatientId, currentPatientConversationId),
                });
                // Invalidate all patient conversations (for sidebar)
                queryClient.invalidateQueries({
                    queryKey: queryKeys.doctor.chat.patient.allPatients(),
                });
            } else if (conversationType === "general" && currentGeneralConversationId) {
                const response = await sendGeneralConversationMessage.mutateAsync({
                    conversationId: currentGeneralConversationId,
                    message: messageToSend,
                });

                if (response.error) {
                    toast.error(response.message || "Unable to send message.");
                    // Restore message if error occurred
                    setChatModalPrompt(messageToSend);
                    return;
                }

                // Invalidate messages query to refresh chat
                queryClient.invalidateQueries({
                    queryKey: queryKeys.doctor.chat.general.conversationMessages(currentGeneralConversationId),
                });
                // Invalidate general conversations (for sidebar)
                queryClient.invalidateQueries({
                    queryKey: queryKeys.doctor.chat.general.conversations(),
                });
            }
        } catch (error: any) {
            toast.error(error?.message || "Unable to send message.");
            // Restore message if error occurred
            setChatModalPrompt(messageToSend);
        }
    };

    return (
        <Dialog open={isGlobalChatModalOpen} onOpenChange={(open) => {
            if (!open) {
                dispatch(closeGlobalChatModal());
                dispatch(setOptimisticMessage(null));
                dispatch(setIsExternalThinking(false));
            }
        }}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-200">
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Chat Conversation
                    </DialogTitle>
                    <DialogDescription className="text-sm text-neutral-500 mt-1">
                        {conversationType === "patient" ? "Patient-specific conversation" : "General research conversation"}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 bg-neutral-50/30">
                    {isLoadingMessages ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                            <p className="mt-4 text-sm text-neutral-500">Loading messages...</p>
                        </div>
                    ) : hasPersistedMessages || Boolean(optimisticMessage) ? (
                        <>
                            {(currentMessages ?? []).map((message) => {
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
                                                    ? "order-2 border-violet-200 bg-primary text-white"
                                                    : "order-1 border-violet-100 text-primary"
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
                                                        : "bg-white text-neutral-900 border border-neutral-200 shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "prose prose-sm max-w-none",
                                                        isUser
                                                            ? "prose-invert text-white [&_*]:text-white"
                                                            : "text-neutral-900"
                                                    )}
                                                >
                                                    <ReactMarkdown
                                                        rehypePlugins={[rehypeRaw]}
                                                        remarkPlugins={[remarkGfm]}
                                                    >
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                            {message.createdAt && (
                                                <p
                                                    className={cn(
                                                        "text-xs text-neutral-400",
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

                            {optimisticMessage && (
                                <div className="flex w-full items-start gap-3 justify-end">
                                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-violet-200 bg-primary text-white shadow-[0_8px_30px_rgba(134,96,255,0.35)]">
                                        <UserRound className="h-4 w-4" />
                                    </div>
                                    <div className="flex max-w-[75%] flex-col items-end gap-1.5 text-sm leading-relaxed">
                                            <div className="w-full rounded-3xl bg-primary px-5 py-4 text-white">
                                            <div className="prose prose-sm max-w-none prose-invert text-white [&_*]:text-white">
                                                <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
                                                    {optimisticMessage}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                        <p className="text-xs text-neutral-400 text-right">Sending…</p>
                                    </div>
                                </div>
                            )}

                            {/* Loading indicator when sending message */}
                            {showThinkingIndicator && (
                                <div className="flex w-full items-start gap-3 justify-start">
                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-violet-100 bg-violet-50 text-primary">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                    <div className="flex max-w-[75%] flex-col items-start gap-1.5 text-sm leading-relaxed">
                                        <div className="w-full rounded-3xl border border-neutral-200 bg-white px-5 py-4 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
                                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                                                <div className="flex gap-1">
                                                    <div className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: "0ms" }}></div>
                                                    <div className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: "150ms" }}></div>
                                                    <div className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: "300ms" }}></div>
                                                </div>
                                                <span>Thinking...</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mb-4">
                                <MessageSquare className="h-8 w-8 text-primary" />
                            </div>
                            <p className="text-base font-medium text-neutral-900 mb-1">No messages yet</p>
                            <p className="text-sm text-neutral-500">Start a conversation by sending a message.</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Chat Input at Bottom */}
                <div className="border-t border-neutral-200 bg-white px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 rounded-2xl border border-neutral-200 bg-white">
                            <Textarea
                                value={chatModalPrompt}
                                onChange={(event) => setChatModalPrompt(event.target.value)}
                                onKeyDown={handleChatModalKeyDown}
                                placeholder="Type your message..."
                                className="min-h-[40px] max-h-[150px] resize-none border-none bg-transparent p-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-0"
                            />
                        </div>
                        <Button
                            type="button"
                            className="h-[40px] w-[40px] gap-2 bg-primary px-0 text-white disabled:cursor-not-allowed disabled:opacity-60 shrink-0"
                            disabled={!chatModalPrompt.trim() || !currentConversationId || isSendingMessage || (conversationType === "patient" && !selectedPatientId)}
                            onClick={handleChatModalSubmit}
                        >
                            {isSendingMessage ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                                <SendHorizontal className="h-5 w-5 rotate-[-45deg]" />
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}