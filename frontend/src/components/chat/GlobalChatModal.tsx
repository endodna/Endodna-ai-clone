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
        selectedPatientId
    } = useAppSelector((state) => state.chat);
    const [chatModalPrompt, setChatModalPrompt] = useState("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

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

    // Clear input when modal closes
    useEffect(() => {
        if (!isGlobalChatModalOpen) {
            setChatModalPrompt("");
        }
    }, [isGlobalChatModalOpen]);

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
            }
        }}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-200">
                    <DialogTitle className="flex items-center gap-2 typo-h5 ">
                        <MessageSquare className="h-5 w-5 text-violet-600" />
                        Chat Conversation
                    </DialogTitle>
                    <DialogDescription className="typo-body-2 text-neutral-500-old mt-1">
                        {conversationType === "patient" ? "Patient-specific conversation" : "General research conversation"}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 bg-neutral-50/30">
                    {isLoadingMessages ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-600 border-t-transparent"></div>
                            <p className="mt-4 typo-body-2 text-neutral-500-old">Loading messages...</p>
                        </div>
                    ) : currentMessages && currentMessages.length > 0 ? (
                        <>
                            {currentMessages.map((message) => {
                                const isUser = message.role === "user";
                                return (
                                    <div
                                        key={message.id}
                                        className={cn(
                                            "flex gap-3 w-full items-start",
                                            isUser ? "flex-row-reverse justify-end" : "flex-row justify-start"
                                        )}
                                    >
                                        {!isUser && (
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                                                <Bot className="h-4 w-4 text-violet-600" />
                                            </div>
                                        )}
                                        <div
                                            className={cn(
                                                "flex flex-col gap-1.5 max-w-[75%]",
                                                isUser ? "items-end" : "items-start"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "rounded-2xl px-4 py-3",
                                                    isUser
                                                        ? "bg-violet-600 text-white"
                                                        : "bg-white text-neutral-900-old border border-neutral-200 shadow-sm"
                                                )}
                                            >
                                                <div className={cn(
                                                    "chat-content leading-relaxed prose prose-sm max-w-none",
                                                    isUser
                                                        ? "prose-invert text-white [&_*]:text-white"
                                                        : "text-neutral-900-old"
                                                )}>
                                                    <ReactMarkdown
                                                        rehypePlugins={[rehypeRaw]}
                                                        remarkPlugins={[remarkGfm]}
                                                    >
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                            {message.createdAt && (
                                                <p className={cn(
                                                    "typo-body-3 text-neutral-400-old px-1",
                                                    isUser ? "text-right" : "text-left"
                                                )}>
                                                    {new Date(message.createdAt).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                        {isUser && (
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
                                                <UserRound className="h-4 w-4 text-white" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            
                            {/* Loading indicator when sending message */}
                            {isSendingMessage && (
                                <div className="flex gap-3 w-full items-start justify-start">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                                        <Bot className="h-4 w-4 text-violet-600" />
                                    </div>
                                    <div className="flex flex-col gap-1.5 max-w-[75%] items-start">
                                        <div className="rounded-2xl px-4 py-3 bg-white text-neutral-900-old border border-neutral-200 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-1">
                                                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                                <span className="typo-body-3 text-neutral-500-old">Searching...</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mb-4">
                                <MessageSquare className="h-8 w-8 text-violet-600" />
                            </div>
                            <p className="typo-body-1  text-neutral-900-old mb-1">No messages yet</p>
                            <p className="typo-body-2 text-neutral-500-old">Start a conversation by sending a message.</p>
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
                                className="min-h-[40px] max-h-[150px] resize-none border-none bg-transparent p-4 typo-body-2 text-neutral-900-old placeholder:text-neutral-400-old focus-visible:ring-0"
                            />
                        </div>
                        <Button
                            type="button"
                            className="h-[40px] w-[40px] gap-2 px-0 text-white disabled:cursor-not-allowed disabled:opacity-60 shrink-0"
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

