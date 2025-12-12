import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Sparkles,
  X,
  UserRound,
  Bot,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AiSummary } from "@/components/patients/patientProfile/aiSummary/AiSummary";
import { AiChatActionButtons } from "@/components/chat/AiChatActionButtons";
import {
  useGetPatientById,
  useGetPatientGeneticsReports,
  useGetPatientConversationMessages,
} from "@/hooks/useDoctor";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  setOptimisticMessage,
  setIsExternalThinking,
} from "@/store/features/chat";

interface ReportsListProps {
  initialFilter?: string;
  patientId?: string;
  onFilterChange?: (filter: string | null) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Likely Impactful":
      return "bg-violet-400";
    case "Benign":
      return "bg-teal-400";
    case "VUS":
      return "bg-yellow-400";
    case "Likely Benign":
      return "bg-lime-400";
    case "Impactful":
      return "bg-violet-600";
    default:
      return "bg-gray-500";
  }
};

export function ReportsList({
  initialFilter,
  patientId,
  onFilterChange,
}: ReportsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValue, setFilterValue] = useState(initialFilter || "all");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isReportSheetOpen, setIsReportSheetOpen] = useState(false);
  const [selectedReport, setSelectedReport] =
    useState<PatientGeneticsReport | null>(null);
  const [selectedCategoryData, setSelectedCategoryData] = useState<any>(null);
  const [expandedReferences, setExpandedReferences] = useState<Set<number>>(
    new Set()
  );
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(
    null
  );
  const [autoSubmitPrompt, setAutoSubmitPrompt] = useState<string | null>(null);
  const [showWelcomeSection, setShowWelcomeSection] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const hasAutoSubmittedRef = useRef(false);
  const [conversationType, setConversationType] = useState<
    "patient" | "general" | null
  >(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const hasAcknowledgedOptimisticRef = useRef(false);
  const lastAssistantMessageIdRef = useRef<string | null>(null);
  const dispatch = useAppDispatch();

  const { optimisticMessage, isExternalThinking } = useAppSelector(
    (state) => state.chat
  );

  const { data: messagesResponse } = useGetPatientConversationMessages(
    patientId ?? "",
    conversationId ?? "",
    {
      enabled:
        Boolean(patientId) &&
        Boolean(conversationId) &&
        conversationType === "patient",
    }
  );

  const currentMessages = messagesResponse?.data || [];

  const handleConversationCreated = (
    id: string,
    type: "patient" | "general"
  ) => {
    setConversationId(id);
    setConversationType(type);
    setShowWelcomeSection(false);
  };

  useEffect(() => {
    if (isSheetOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentMessages, isSheetOpen, optimisticMessage, isExternalThinking]);

  useEffect(() => {
    if (!isSheetOpen) {
      setConversationId(null);
      setConversationType(null);
    }
  }, [isSheetOpen]);

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

  const { userConfig } = useAuth();
  const doctorName = userConfig?.firstName
    ? `Dr. ${userConfig.firstName}${userConfig.lastName ? ` ${userConfig.lastName}` : ""}`
    : "Doctor";

  const { data: patientData } = useGetPatientById(patientId ?? "", {
    enabled: Boolean(patientId),
  });

  const {
    data: reportsResponse,
    isLoading: isLoadingReports,
    error: reportsError,
  } = useGetPatientGeneticsReports(patientId ?? "", {
    enabled: Boolean(patientId),
  });

  const normalizeVariantStatus = (
    status: string
  ): PatientGeneticsReport["variantStatus"] => {
    const normalized = status.toLowerCase().trim();
    if (normalized === "benign") return "Benign";
    if (normalized === "likely benign") return "Likely Benign";
    if (normalized === "vus") return "VUS";
    if (normalized === "likely impactful" || normalized === "likely pathogenic")
      return "Likely Impactful";
    if (normalized === "impactful" || normalized === "pathogenic")
      return "Impactful";
    return "VUS";
  };

  const reportsData = useMemo(() => {
    if (!reportsResponse) return null;

    if (reportsResponse.error) {
      console.warn("API returned error:", reportsResponse.message);
      return null;
    }

    const data = reportsResponse.data as any;
    if (!data || !data.reports || !Array.isArray(data.reports)) {
      return null;
    }

    return data;
  }, [reportsResponse]);

  const reports = useMemo(() => {
    if (!reportsData) return [];

    const flatReports: PatientGeneticsReport[] = [];
    reportsData.reports.forEach((report: any, reportIndex: number) => {
      if (report.categories && Array.isArray(report.categories)) {
        report.categories.forEach((category: any, categoryIndex: number) => {
          flatReports.push({
            id: `${reportIndex}-${categoryIndex}`,
            name: category.categoryName || "",
            variantStatus: normalizeVariantStatus(category.variantStatus || ""),
          });
        });
      }
    });

    return flatReports;
  }, [reportsData]);

  const getCategoryData = (reportId: string) => {
    if (!reportsData) return null;

    const [reportIndex, categoryIndex] = reportId.split("-").map(Number);
    const report = reportsData.reports[reportIndex];
    if (report && report.categories) {
      return report.categories[categoryIndex] || null;
    }
    return null;
  };

  const patient = patientData?.data as any;
  const patientName = patient
    ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "Patient"
    : "Patient";

  const isInternalUpdate = useRef(false);

  useEffect(() => {
    isInternalUpdate.current = true;

    if (initialFilter) {
      setFilterValue(initialFilter);
    } else {
      setFilterValue("all");
      setSearchQuery("");
    }

    setTimeout(() => {
      isInternalUpdate.current = false;
    }, 0);
  }, [initialFilter]);

  useEffect(() => {
    if (onFilterChange && !isInternalUpdate.current) {
      const classification = filterValue === "all" ? null : filterValue;
      onFilterChange(classification);
    }
  }, [filterValue, onFilterChange]);

  const filteredReports = reports.filter((report: PatientGeneticsReport) => {
    const reportName = report?.name || "";
    const reportVariantStatus = report?.variantStatus || "";

    const matchesSearch = reportName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterValue === "all" || reportVariantStatus === filterValue;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full rounded-2xl bg-white p-6 shadow-md">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-foreground/80 text-2xl font-semibold">Reports</h3>
          <Button
            variant="secondary"
            onClick={() => {
              setShowWelcomeSection(true);
              setIsSheetOpen(true);
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Explore with BIOS
          </Button>
        </div>

        <div className="flex justify-between gap-3">
          <div className="relative w-[240px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/80" />
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterValue} onValueChange={setFilterValue}>
            <SelectTrigger className="w-[128px] text-sm font-normal text-foreground border-foreground/80">
              <SelectValue placeholder="All Variants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Variants</SelectItem>
              <SelectItem value="Benign">Benign</SelectItem>
              <SelectItem value="Likely Benign">Likely Benign</SelectItem>
              <SelectItem value="VUS">VUS</SelectItem>
              <SelectItem value="Likely Impactful">Likely Impactful</SelectItem>
              <SelectItem value="Impactful">Impactful</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-b border-foreground/80/30 mb-3 -mx-6" />
      <div className="space-y-0">
        <div className="grid grid-cols-12 gap-4 pb-2">
          <div className="col-span-7">
            <span className="text-sm font-medium text-foreground ml-5">
              Name
            </span>
          </div>
          <div className="col-span-3">
            <span className="text-sm font-medium text-foreground">
              Variant Status
            </span>
          </div>
          <div className="col-span-2"></div>
        </div>

        {isLoadingReports ? (
          <div className="py-8 text-center text-gray-500">
            Loading reports...
          </div>
        ) : reportsError ? (
          <div className="py-8 text-center text-red-500">
            <div>Error loading reports</div>
            {reportsError instanceof Error && (
              <div className="mt-2 text-sm">{reportsError.message}</div>
            )}
            {reportsResponse?.error && (
              <div className="mt-2 text-sm">
                API Error: {reportsResponse.message}
              </div>
            )}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            {reports.length === 0
              ? "No reports found"
              : "No reports match your filters"}
          </div>
        ) : (
          filteredReports.map((report: PatientGeneticsReport) => (
            <div
              key={report.id}
              className="grid grid-cols-12 gap-4 py-1 border-b border-neutral-300 last:border-b-0 items-center"
            >
              <div className="col-span-7 flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${getStatusColor(report.variantStatus)}`}
                />
                <span className="text-sm text-foreground font-normal">
                  {report.name}
                </span>
              </div>
              <div className="col-span-3">
                <span className="text-sm text-foreground font-normal">
                  {report.variantStatus}
                </span>
              </div>
              <div className="col-span-2 flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white border-neutral-300 text-foreground hover:bg-neutral-100 hover:text-foreground font-medium text-xs"
                  onClick={() => {
                    setSelectedReport(report);
                    const categoryData = getCategoryData(report.id);
                    setSelectedCategoryData(categoryData);
                    setIsReportSheetOpen(true);
                  }}
                >
                  Open
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white border-neutral-300 text-foreground hover:bg-neutral-100 hover:text-foreground font-medium text-xs"
                  onClick={() => {
                    setShowWelcomeSection(false);
                    setAutoSubmitPrompt(report.name);
                    setSelectedSuggestion(report.name);
                    hasAutoSubmittedRef.current = false;
                    setIsSheetOpen(true);
                  }}
                >
                  Ask BIOS
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) {
            setSelectedSuggestion(null);
            setAutoSubmitPrompt(null);
            setShowWelcomeSection(true);
            setConversationId(null);
            setConversationType(null);
            hasAutoSubmittedRef.current = false;
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-2xl flex flex-col p-0 h-full">
          <div className="flex flex-col h-full">
            {/* Content Area - Welcome Section or Messages */}
            <div className="flex-1 overflow-y-auto">
              {showWelcomeSection && !conversationId ? (
                <div className="px-6 pb-6 pt-3 space-y-6">
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-neutral-900">
                      Welcome {doctorName}!
                    </h2>
                    <p className="text-foreground/80 text-base font-normal">
                      Here are a few suggestions to assist you in exploring the
                      DNA Results of{" "}
                      <strong className="text-neutral-900">
                        {patientName}
                      </strong>
                      :
                    </p>

                    {/* Suggestions */}
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSelectedSuggestion(
                              "Create a summary of urgent topics"
                            );
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary bg-white hover:bg-neutral-50 text-neutral-900 text-xs font-medium transition-colors"
                        >
                          <Sparkles className="h-4 w-4 text-neutral-900" />
                          Create a summary of urgent topics
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSuggestion(
                              "Organize a list of action items"
                            );
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary bg-white hover:bg-neutral-50 text-neutral-900 text-xs font-medium transition-colors"
                        >
                          <Sparkles className="h-4 w-4 text-neutral-900" />
                          Organize a list of action items
                        </button>
                      </div>
                      <div className="flex justify-start">
                        <button
                          onClick={() => {
                            setSelectedSuggestion(
                              "Summarize all stress-related reports into bullet points"
                            );
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary bg-white hover:bg-neutral-50 text-neutral-900 text-xs font-medium transition-colors"
                        >
                          <Sparkles className="h-4 w-4 text-neutral-900" />
                          Summarize all stress-related reports into bullet
                          points
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Empty middle section */}
                  <div className="flex-1 min-h-[200px]"></div>
                </div>
              ) : (
                <div className="px-6 pb-6 pt-10 space-y-6 bg-neutral-50/30 min-h-full">
                  {currentMessages.length > 0 || optimisticMessage ? (
                    <>
                      {currentMessages.map((message) => {
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
                                  ? "order-2 border-teal-600 bg-primary text-white"
                                  : "order-1 border-teal-600 text-primary"
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
                                isUser
                                  ? "order-1 items-end"
                                  : "order-2 items-start"
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
                                    "chat-content leading-relaxed prose prose-sm max-w-none",
                                    isUser
                                      ? "prose-invert text-white [&_*]:text-white"
                                      : "text-neutral-900-old"
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
                                    patientId={patientId ?? null}
                                    className="border-neutral-200"
                                  />
                                )}
                              </div>
                              {message.createdAt && (
                                <p
                                  className={cn(
                                    "text-xs text-neutral-400",
                                    isUser ? "text-right" : "text-left"
                                  )}
                                >
                                  {new Date(message.createdAt).toLocaleString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      hour: "numeric",
                                      minute: "2-digit",
                                      hour12: true,
                                    }
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {optimisticMessage && (
                        <div className="flex w-full items-start gap-3 justify-end">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-violet-200 bg-primary text-white">
                            <UserRound className="h-4 w-4" />
                          </div>
                          <div className="flex max-w-[75%] flex-col items-end gap-1.5 text-sm leading-relaxed">
                            <div className="w-full rounded-3xl bg-primary px-5 py-4 text-white">
                              <div className="prose prose-sm max-w-none prose-invert text-white [&_*]:text-white">
                                <ReactMarkdown
                                  rehypePlugins={[rehypeRaw]}
                                  remarkPlugins={[remarkGfm]}
                                >
                                  {optimisticMessage}
                                </ReactMarkdown>
                              </div>
                            </div>
                            <p className="text-xs text-neutral-400 text-right">
                              Sending…
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Loading indicator when sending message */}
                      {isExternalThinking && (
                        <div className="flex w-full items-start gap-3 justify-start">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-violet-100 bg-violet-50 text-primary">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div className="flex max-w-[75%] flex-col items-start gap-1.5 text-sm leading-relaxed">
                            <div className="w-full rounded-3xl border border-neutral-200 bg-white px-5 py-4 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
                              <div className="flex items-center gap-2 text-xs text-neutral-500">
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
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mb-4">
                        <Sparkles className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-base font-medium text-neutral-900 mb-1">
                        No messages yet
                      </p>
                      <p className="text-sm text-neutral-500">
                        Start a conversation by sending a message.
                      </p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* AiSummary at the bottom */}
            <div className="bg-white p-6 flex-shrink-0">
              <AiSummary
                patientId={patientId}
                initialPrompt={selectedSuggestion || undefined}
                autoSubmit={
                  !!autoSubmitPrompt &&
                  selectedSuggestion === autoSubmitPrompt &&
                  !hasAutoSubmittedRef.current
                }
                disableChatModal={true}
                onConversationCreated={(id, type) => {
                  handleConversationCreated(id, type);
                  // Mark as auto-submitted after conversation is created
                  if (
                    autoSubmitPrompt &&
                    selectedSuggestion === autoSubmitPrompt
                  ) {
                    hasAutoSubmittedRef.current = true;
                  }
                }}
                existingConversationId={conversationId}
                chatType="DNA_ANALYSIS"
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Report Detail Sheet */}
      <Sheet
        open={isReportSheetOpen}
        onOpenChange={(open) => {
          setIsReportSheetOpen(open);
          if (!open) {
            setSelectedReport(null);
            setSelectedCategoryData(null);
            setExpandedReferences(new Set());
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-3xl flex flex-col p-0 h-full overflow-y-auto">
          {selectedReport && selectedCategoryData && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-0 sticky top-0 bg-white z-10">
                <h2 className="text-xl font-semibold text-foreground">
                  {selectedReport.name}
                </h2>
                <button
                  onClick={() => setIsReportSheetOpen(false)}
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Overall Impact Score Section */}
                <div className="space-y-4 bg-muted-foreground/10 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-foreground">
                      Overall Impact Score
                    </h3>
                    {(() => {
                      const score = selectedCategoryData.overallScore || 0;
                      const segments = [
                        {
                          label: "Benign",
                          color: "bg-teal-400",
                          range: [0, 0.2],
                        },
                        {
                          label: "Likely Benign",
                          color: "bg-lime-400",
                          range: [0.2, 0.4],
                        },
                        {
                          label: "VUS",
                          color: "bg-yellow-400",
                          range: [0.4, 0.6],
                        },
                        {
                          label: "Likely Impactful",
                          color: "bg-violet-400",
                          range: [0.6, 0.8],
                        },
                        {
                          label: "Impactful",
                          color: "bg-violet-600",
                          range: [0.8, 1.01],
                        },
                      ];
                      const selectedSegment = segments.find(
                        (segment) =>
                          score >= segment.range[0] && score < segment.range[1]
                      );
                      if (selectedSegment) {
                        return (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-transparent rounded-full border border-muted-foreground/30">
                            <div
                              className={`w-2 h-2 rounded-full ${selectedSegment.color}`}
                            ></div>
                            <span className="text-sm font-medium text-neutral-950">
                              {selectedSegment.label}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-semibold text-foreground">
                        {selectedCategoryData.overallScore?.toFixed(4) ||
                          "0.0000"}
                      </div>
                    </div>
                    <p className="text-sm text-foreground/80 font-normal">
                      A score above 0.75 indicates a high predicted impact on
                      hormone metabolism and should be considered by the
                      treating physician when making clinical decisions.
                    </p>
                    {/* Gradient Bar */}
                    <div className="relative w-full pt-6">
                      <div className="relative w-full h-2 flex gap-1.5 rounded-full overflow-hidden">
                        {[
                          {
                            label: "Benign",
                            light: "bg-teal-200",
                            dark: "bg-teal-400",
                            range: [0, 0.2],
                          },
                          {
                            label: "Likely Benign",
                            light: "bg-lime-200",
                            dark: "bg-lime-400",
                            range: [0.2, 0.4],
                          },
                          {
                            label: "VUS",
                            light: "bg-yellow-200",
                            dark: "bg-yellow-400",
                            range: [0.4, 0.6],
                          },
                          {
                            label: "Likely Impactful",
                            light: "bg-violet-200",
                            dark: "bg-violet-400",
                            range: [0.6, 0.8],
                          },
                          {
                            label: "Impactful",
                            light: "bg-violet-300",
                            dark: "bg-violet-600",
                            range: [0.8, 1.01],
                          },
                        ].map((segment, index) => {
                          const score = selectedCategoryData.overallScore || 0;
                          const isSelected =
                            score >= segment.range[0] &&
                            score < segment.range[1];
                          return (
                            <div
                              key={index}
                              className={`h-full flex-1 transition-colors rounded-full ${
                                isSelected ? segment.dark : segment.light
                              }`}
                            />
                          );
                        })}
                      </div>
                      {/* Score Indicator - Outside bar container to avoid overflow clipping */}
                      <div
                        className="absolute h-4 w-3 bg-black rounded-full pointer-events-none z-10"
                        style={{
                          left: `${Math.min((selectedCategoryData.overallScore || 0) * 100, 100)}%`,
                          transform: "translateX(-50%)",
                          top: "calc(1.5rem + 0.25rem - 0.5rem)",
                        }}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-black rounded-full border-2 border-white"></div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-neutral-500">
                        <span>0.00 (Low)</span>
                        <span>0.25</span>
                        <span>0.75</span>
                        <span>1.00 (High Impact)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Genetic Variants Detected Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">
                    Genetic Variants Detected
                  </h3>
                  <div className="space-y-4">
                    {selectedCategoryData.variants?.map(
                      (variant: any, index: number) => (
                        <div
                          key={index}
                          className="border border-neutral-200 rounded-lg p-4 space-y-4 bg-white"
                        >
                          {/* Variant Header */}
                          <div className="flex items-center gap-4 justify-between">
                            <div className="flex flex-col">
                              <span className="text-xl font-normal text-foreground">
                                {variant.rsID}
                              </span>
                              <span className="text-sm font-semibold text-foreground/60">
                                {variant.geneName}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded border border-muted-foreground/30 bg-white text-xs font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-foreground"></div>
                                <span className="text-foreground">
                                  {variant.genotype || "--"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded border border-muted-foreground/30 bg-white text-xs font-medium">
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${getStatusColor(normalizeVariantStatus(variant.variantStatus))}`}
                                ></div>
                                <span className="text-foreground">
                                  {normalizeVariantStatus(
                                    variant.variantStatus
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="border-b -mx-4" />

                          {/* Clinical Significance */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-foreground">
                              Clinical Significance:
                            </h4>
                            <p className="text-sm text-foreground/80 font-normal leading-relaxed">
                              {variant.clinicalSignificance}
                            </p>
                          </div>

                          <div className="border-b -mx-4" />

                          {/* References */}
                          {variant.references &&
                            variant.references.length > 0 && (
                              <div className="space-y-2">
                                <button
                                  onClick={() => {
                                    setExpandedReferences((prev) => {
                                      const newSet = new Set(prev);
                                      if (newSet.has(index)) {
                                        newSet.delete(index);
                                      } else {
                                        newSet.add(index);
                                      }
                                      return newSet;
                                    });
                                  }}
                                  className="flex items-center justify-between w-full hover:opacity-70 transition-opacity"
                                >
                                  <h4 className="text-sm font-semibold text-foreground">
                                    References
                                  </h4>
                                  <ChevronDown
                                    className={`w-4 h-4 text-foreground transition-transform ${
                                      expandedReferences.has(index)
                                        ? "rotate-180"
                                        : ""
                                    }`}
                                  />
                                </button>
                                <div className="flex items-center gap-2 flex-wrap overflow-hidden">
                                  {(expandedReferences.has(index)
                                    ? variant.references
                                    : variant.references.slice(0, 4)
                                  ).map((ref: string, refIndex: number) => (
                                    <a
                                      key={refIndex}
                                      href={`https://pubmed.ncbi.nlm.nih.gov/${ref.replace("PMID", "")}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-950 bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors"
                                    >
                                      {ref}
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ))}
                                  {!expandedReferences.has(index) &&
                                    variant.references.length > 4 && (
                                      <span className="text-xs text-neutral-500 font-medium">
                                        +{variant.references.length - 4} others
                                      </span>
                                    )}
                                </div>
                              </div>
                            )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
