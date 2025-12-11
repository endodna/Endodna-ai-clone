import { AiChatInput } from "@/components/chat/AiChatInput";

interface AiSummaryProps {
  readonly className?: string;
  readonly patientId?: string;
  readonly onSubmit?: (payload: {
    prompt: string;
    model: string;
    persona: string;
  }) => void;
  readonly initialPrompt?: string;
  readonly autoSubmit?: boolean;
  readonly disableChatModal?: boolean;
  readonly onConversationCreated?: (
    conversationId: string,
    type: "patient" | "general"
  ) => void;
  readonly existingConversationId?: string | null;
  readonly chatType?: string;
}

export function AiSummary({
  className,
  onSubmit,
  patientId,
  initialPrompt,
  autoSubmit = false,
  disableChatModal = false,
  onConversationCreated,
  existingConversationId,
  chatType,
}: Readonly<AiSummaryProps>) {
  return (
    <AiChatInput
      className={className}
      onSubmit={onSubmit}
      patientId={patientId}
      initialPrompt={initialPrompt}
      autoSubmit={autoSubmit}
      disableChatModal={disableChatModal}
      onConversationCreated={onConversationCreated}
      existingConversationId={existingConversationId}
      chatType={chatType}
    />
  );
}
