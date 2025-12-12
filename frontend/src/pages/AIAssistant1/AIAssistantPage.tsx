import { FullPageChatInterface } from "@/components/chat/FullPageChatInterface";

export default function AIAssistantPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full -mx-4 md:-mx-[63px] -mt-6 md:-mt-11 mb-4 md:mb-6">
      <div className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-muted-foreground bg-secondary-background">
        <h1 className="text-foreground typo-h2">AI Assistant</h1>
      </div>

      <div className="flex-1 overflow-hidden bg-secondary-background min-h-0">
        <FullPageChatInterface />
      </div>
    </div>
  );
}
