import { queryKeys } from "@/components/constants/QueryKeys";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
    useCreateGeneralConversation,
    useCreatePatientConversation,
    useGetGeneralConversations,
    useGetPatientById,
    useGetPatientConversations,
    useSendGeneralConversationMessage,
    useSendPatientConversationMessage,
    useUpdateGeneralConversationTitle,
    useUpdatePatientConversationTitle,
} from "@/hooks/useDoctor";
import { cn } from "@/lib/utils";
import {
    selectGlobalConversation,
    setActiveGeneralConversation,
    setActivePatientConversation,
    setSelectedPersona,
    setOptimisticMessage,
    setIsExternalThinking,
} from "@/store/features/chat";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { formatDate } from "@/utils/date.utils";
import { useQueryClient } from "@tanstack/react-query";
import {
    ChevronDown,
    Mic,
    SendHorizontal,
    Stethoscope,
    Upload,
    UserRound,
    Box,
    Plus,
    Boxes
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface AiSummaryProps {
    readonly className?: string;
    readonly patientId?: string;
    readonly onSubmit?: (payload: { prompt: string; model: string; persona: string }) => void;
}

const MODEL_OPTIONS = [
    {
        id: "biod",
        label: "BIOS",
        description: "Best for nuanced clinical reasoning.",
        icon: Box,
    },
    {
        id: "model",
        label: "Add Custom Model",
        description: "Personalized care for you.",
        icon: Plus,
    },
];

const PERSONA_OPTIONS = [
    {
        id: "patient",
        label: "Patient Specific",
        description: "Simplify language for patient-facing notes.",
        icon: UserRound,
    },
    {
        id: "research",
        label: "Research Based",
        description: "Clinical tone grounded in evidence.",
        icon: Stethoscope,
    },
] as const;

export function AiSummary({ className, onSubmit, patientId }: Readonly<AiSummaryProps>) {
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();
    const { activePatientConversationId, activeGeneralConversationId, conversationType } = useAppSelector(
        (state) => state.chat
    );
    const [prompt, setPrompt] = useState("");
    const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0]);
    const [persona, setPersona] =
        useState<(typeof PERSONA_OPTIONS)[number]>(PERSONA_OPTIONS[0]);
    const uploadInputRef = useRef<HTMLInputElement | null>(null);

    // Get patient data for title generation
    const { data: patientData } = useGetPatientById(patientId ?? "", {
        enabled: Boolean(patientId),
    });

    const { data: patientConversations } = useGetPatientConversations(patientId ?? "", {
        enabled: Boolean(patientId),
    });
    const { data: generalConversations } = useGetGeneralConversations();


    const createPatientConversation = useCreatePatientConversation();
    const sendPatientConversationMessage = useSendPatientConversationMessage();
    const createGeneralConversation = useCreateGeneralConversation();
    const sendGeneralConversationMessage = useSendGeneralConversationMessage();
    const updatePatientConversationTitle = useUpdatePatientConversationTitle();
    const updateGeneralConversationTitle = useUpdateGeneralConversationTitle();

    const isSubmitDisabled = prompt.trim().length === 0;
    const isPatientPersona = persona.id === "patient";
    const requiresPatientSelection = isPatientPersona && !patientId;
    const isProcessing =
        createPatientConversation.isPending ||
        sendPatientConversationMessage.isPending ||
        createGeneralConversation.isPending ||
        sendGeneralConversationMessage.isPending;
    const isSendDisabled = isSubmitDisabled || requiresPatientSelection || isProcessing;

    // Initialize persona in Redux on mount
    useEffect(() => {
        dispatch(setSelectedPersona(persona.id));
    }, [dispatch]); // Only run once on mount

    // Only set default conversation if no conversation is selected from ChatsHistory
    useEffect(() => {
        if (
            patientId &&
            patientConversations?.data &&
            patientConversations.data.length > 0 &&
            !activePatientConversationId &&
            conversationType !== "patient"
        ) {
            dispatch(setActivePatientConversation(patientConversations.data[0].id));
        }
    }, [patientId, patientConversations, activePatientConversationId, conversationType, dispatch]);

    useEffect(() => {
        if (
            generalConversations?.data &&
            generalConversations.data.length > 0 &&
            !activeGeneralConversationId &&
            conversationType !== "general"
        ) {
            dispatch(setActiveGeneralConversation(generalConversations.data[0].id));
        }
    }, [generalConversations, activeGeneralConversationId, conversationType, dispatch]);

    const handleSubmit = async () => {
        if (isSendDisabled) {
            if (requiresPatientSelection) {
                toast.error("Select a patient to start a patient-specific chat.");
            }
            return;
        }

        const message = prompt.trim();
        if (!message) {
            return;
        }

        // Clear input immediately for better UX
        setPrompt("");
        dispatch(setOptimisticMessage(message));
        dispatch(setIsExternalThinking(true));

        try {
            if (isPatientPersona) {
                if (!patientId) {
                    toast.error("Patient ID is missing.");
                    // Restore message if error
                    setPrompt(message);
                    return;
                }

                // Always create a new conversation when sending from input
                // This ensures a fresh conversation starts
                const createResponse = await createPatientConversation.mutateAsync({ patientId });
                if (createResponse.error || !createResponse.data) {
                    toast.error(createResponse.message || "Unable to create conversation.");
                    // Restore message if error
                    setPrompt(message);
                    dispatch(setOptimisticMessage(null));
                    dispatch(setIsExternalThinking(false));
                    return;
                }
                const conversationId = createResponse.data.id;
                dispatch(setActivePatientConversation(conversationId));
                dispatch(selectGlobalConversation({
                    conversationId,
                    type: "patient",
                    patientId,
                }));

                // Set conversation title
                const title = generatePatientConversationTitle();
                await updatePatientConversationTitle.mutateAsync({
                    patientId,
                    conversationId,
                    title,
                });

                const sendResponse = await sendPatientConversationMessage.mutateAsync({
                    patientId,
                    conversationId,
                    message,
                });

                if (sendResponse.error) {
                    toast.error(sendResponse.message || "Unable to send message.");
                    // Restore message if error
                    setPrompt(message);
                    dispatch(setOptimisticMessage(null));
                    dispatch(setIsExternalThinking(false));
                    return;
                }

                // Invalidate messages query to refresh chat
                queryClient.invalidateQueries({
                    queryKey: queryKeys.doctor.chat.patient.conversationMessages(patientId, conversationId),
                });
                // Invalidate all patient conversations (for sidebar)
                queryClient.invalidateQueries({
                    queryKey: queryKeys.doctor.chat.patient.allPatients(),
                });

            } else {
                // Always create a new conversation when sending from input
                // This ensures a fresh conversation starts
                const createResponse = await createGeneralConversation.mutateAsync({});
                if (createResponse.error || !createResponse.data) {
                    toast.error(createResponse.message || "Unable to start a conversation.");
                    // Restore message if error
                    setPrompt(message);
                    dispatch(setOptimisticMessage(null));
                    dispatch(setIsExternalThinking(false));
                    return;
                }
                const conversationId = createResponse.data.id;
                dispatch(setActiveGeneralConversation(conversationId));
                dispatch(selectGlobalConversation({
                    conversationId,
                    type: "general",
                }));

                // Set conversation title
                const title = generateGeneralConversationTitle();
                await updateGeneralConversationTitle.mutateAsync({
                    conversationId,
                    title,
                });

                const sendResponse = await sendGeneralConversationMessage.mutateAsync({
                    conversationId,
                    message,
                });
                if (sendResponse.error) {
                    toast.error(sendResponse.message || "Unable to send message.");
                    // Restore message if error
                    setPrompt(message);
                    dispatch(setOptimisticMessage(null));
                    dispatch(setIsExternalThinking(false));
                    return;
                }

                // Invalidate messages query to refresh chat
                queryClient.invalidateQueries({
                    queryKey: queryKeys.doctor.chat.general.conversationMessages(conversationId),
                });
                // Invalidate general conversations (for sidebar)
                queryClient.invalidateQueries({
                    queryKey: queryKeys.doctor.chat.general.conversations(),
                });

            }

            onSubmit?.({
                prompt: message,
                model: selectedModel.id,
                persona: persona.id,
            });
        } catch (error: any) {
            toast.error(error?.message || "Unable to send message.");
            // Restore message if error
            setPrompt(message);
            dispatch(setOptimisticMessage(null));
            dispatch(setIsExternalThinking(false));
        }
    };

    const handlePersonaSelect = (option: (typeof PERSONA_OPTIONS)[number]) => {
        setPersona(option);
        dispatch(setSelectedPersona(option.id));
    };

    // Generate conversation title based on type
    const generatePatientConversationTitle = (): string => {
        const patient = patientData?.data as any;
        if (!patient) return "New Conversation";

        const firstName = patient.firstName || "";
        const lastName = patient.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim() || "Patient";
        const dob = patient.dateOfBirth ? formatDate(patient.dateOfBirth, "MM/DD/YYYY") : "";

        if (dob) {
            return `${fullName} ${dob}`;
        }
        return fullName;
    };

    const generateGeneralConversationTitle = (): string => {
        const now = new Date();
        const dateTime = formatDate(now, "MM/DD/YYYY").toLowerCase();
        return `General Chat ${dateTime}`;
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div
            className={cn(
                "rounded-3xl space-y-4",
                className,
            )}
        >
            <div className="space-y-4 rounded-2xl border border-muted-foreground bg-primary-foreground p-4 md:p-5">
                <Textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask BIOS"
                    className="min-h-[80px] resize-none border-none bg-transparent p-0 typo-body-1 text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                />

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div>
                            <input
                                ref={uploadInputRef}
                                type="file"
                                className="hidden"
                                onChange={(event) => {
                                    // Handle file selection if needed later
                                    if (event.target.files?.length) {
                                        // For now we just clear the input to allow re-uploading same file
                                        event.target.value = "";
                                    }
                                }}
                            />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-full text-foreground"
                                        aria-label="Upload reference files"
                                        onClick={() => uploadInputRef.current?.click()}
                                    >
                                        <Upload className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="top"
                                    align="center"
                                    className="w-48 rounded-xl border border-muted-foreground bg-primary-foreground px-4 py-4 typo-body-3 text-foreground shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
                                >
                                    <p className="typo-body-2 text-foreground">Upload</p>
                                    <p className="mt-1 typo-body-3 text-muted-foreground">
                                        Upload reference files to the conversation
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-full text-foreground"
                                        aria-label="Connecter"
                                    >
                                        <Boxes className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="top"
                                    align="center"
                                    className="w-48 rounded-xl border border-muted-foreground bg-primary-foreground px-4 py-4 typo-body-3 text-foreground shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
                                >
                                    <p className="typo-body-2 text-foreground">Connecter</p>
                                    <p className="mt-1 typo-body-3 text-muted-foreground">
                                        connect to MCP and other connectors and extensions
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="flex items-center gap-1 rounded-full border border-muted-foreground bg-primary-foreground px-1 py-1 shadow-sm">
                            {PERSONA_OPTIONS.map((option) => {
                                const Icon = option.icon;
                                const isActive = option.id === persona.id;
                                return (
                                    <Tooltip key={option.id}>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                onClick={() => handlePersonaSelect(option)}
                                                className={cn(
                                                    "flex h-7 w-7 items-center justify-center rounded-full border typo-body-3 transition",
                                                    isActive
                                                        ? "bg-primary-foreground shadow-[0_4px_12px_rgba(109,62,245,0.25)]"
                                                        : "border-transparent bg-transparent typo-body-3 text-muted-foreground hover:border-muted-foreground",
                                                )}
                                                aria-label={option.label}
                                            >
                                                <Icon className="h-4 w-4" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="top"
                                            align="center"
                                            className="w-48 rounded-xl border border-muted-foreground bg-primary-foreground px-4 py-4 typo-body-3 text-foreground shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
                                        >
                                            <p className="typo-body-2  text-foreground">{option.label}</p>
                                            <p className="mt-1 typo-body-3 text-muted-foreground">
                                                {option.description}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="gap-2 rounded-full border border-muted-foreground bg-primary-foreground px-4 py-[6px] typo-body-2  text-foreground hover:bg-primary"
                                >
                                    <ChevronDown className="h-4 w-4 text-foreground" />
                                    {selectedModel.label}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64">
                                {MODEL_OPTIONS.map((option) => (
                                    <DropdownMenuItem
                                        key={option.id}
                                        className="flex gap-3 py-2 items-center"
                                        onClick={() => setSelectedModel(option)}
                                    >
                                        <option.icon className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex flex-col text-left">
                                            <span className="typo-body-2 text-foreground">
                                                {option.label}
                                            </span>
                                            <span className="typo-body-3 text-muted-foreground">
                                                {option.description}
                                            </span>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="ms-auto flex flex-1 flex-wrap items-center justify-end gap-2">

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full"
                            aria-label="Record voice note"
                        >
                            <Mic className="h-5 w-5" />
                        </Button>

                        <Button
                            type="button"
                            className="h-10 w-10 gap-2 px-5 typo-body-2  text-foreground  disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isSendDisabled}
                            onClick={handleSubmit}
                        >
                            {isProcessing ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-foreground border-t-transparent"></div>
                            ) : (
                                <SendHorizontal className="h-4 w-4 rotate-[-45deg]" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}


