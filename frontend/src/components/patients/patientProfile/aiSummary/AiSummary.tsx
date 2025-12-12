import { AiChatInput } from "@/components/chat/AiChatInput";
import { queryKeys } from "@/components/constants/QueryKeys";
import { useCreateGeneralConversation, useCreatePatientConversation, useGetGeneralConversations, useGetPatientById, useGetPatientConversations, useSendGeneralConversationMessage, useSendPatientConversationMessage, useUpdateGeneralConversationTitle, useUpdatePatientConversationTitle } from "@/hooks/useDoctor";
import { selectGlobalConversation, setActiveGeneralConversation, setActivePatientConversation, setIsExternalThinking, setOptimisticMessage, setSelectedPersona } from "@/store/features/chat";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { formatDate } from "@/utils/date.utils";
import { useQueryClient } from "@tanstack/react-query";
import { Box, Plus, Stethoscope, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
  readonly customCreateConversation?: () => Promise<{
    error: boolean;
    data?: { id: string };
    message?: string;
  }>;
  readonly customSendMessage?: (
    conversationId: string,
    message: string
  ) => Promise<{
    error: boolean;
    message?: string;
  }>;
  readonly customIsProcessing?: boolean;
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
  customCreateConversation,
  customSendMessage,
  customIsProcessing = false,
}: Readonly<AiSummaryProps>) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const {
    activePatientConversationId,
    activeGeneralConversationId,
    conversationType,
  } = useAppSelector((state) => state.chat);
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [selectedModel] = useState(MODEL_OPTIONS[0]);
  const [persona] = useState<(typeof PERSONA_OPTIONS)[number]>(
    PERSONA_OPTIONS[0]
  );
  const autoSubmittedRef = useRef(false);

  const { data: patientData } = useGetPatientById(patientId ?? "", {
    enabled: Boolean(patientId),
  });

  const { data: patientConversations } = useGetPatientConversations(
    patientId ?? "",
    {
      enabled: Boolean(patientId),
    }
  );
  const { data: generalConversations } = useGetGeneralConversations();

  const createPatientConversation = useCreatePatientConversation();
  const sendPatientConversationMessage = useSendPatientConversationMessage();
  const createGeneralConversation = useCreateGeneralConversation();
  const sendGeneralConversationMessage = useSendGeneralConversationMessage();
  const updatePatientConversationTitle = useUpdatePatientConversationTitle();
  const updateGeneralConversationTitle = useUpdateGeneralConversationTitle();

  const isSubmitDisabled = prompt.trim().length === 0;
  const isPatientPersona = persona.id === "patient";
  const requiresPatientSelection =
    !customCreateConversation && isPatientPersona && !patientId;
  const isProcessing =
    customIsProcessing ||
    createPatientConversation.isPending ||
    sendPatientConversationMessage.isPending ||
    createGeneralConversation.isPending ||
    sendGeneralConversationMessage.isPending;
  const isSendDisabled =
    isSubmitDisabled || requiresPatientSelection || isProcessing;

  useEffect(() => {
    dispatch(setSelectedPersona(persona.id));
  }, [dispatch]); 

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      autoSubmittedRef.current = false; 
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (
      autoSubmit &&
      initialPrompt &&
      prompt.trim() === initialPrompt.trim() &&
      !isProcessing &&
      !autoSubmittedRef.current &&
      !isSendDisabled
    ) {
      autoSubmittedRef.current = true;
      const timer = setTimeout(() => {
        handleSubmit();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoSubmit, initialPrompt, prompt, isProcessing, isSendDisabled]);

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
  }, [
    patientId,
    patientConversations,
    activePatientConversationId,
    conversationType,
    dispatch,
  ]);

  useEffect(() => {
    if (
      generalConversations?.data &&
      generalConversations.data.length > 0 &&
      !activeGeneralConversationId &&
      conversationType !== "general"
    ) {
      dispatch(setActiveGeneralConversation(generalConversations.data[0].id));
    }
  }, [
    generalConversations,
    activeGeneralConversationId,
    conversationType,
    dispatch,
  ]);

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

    setPrompt("");
    dispatch(setOptimisticMessage(message));
    dispatch(setIsExternalThinking(true));

    try {
      if (isPatientPersona && !customCreateConversation) {
        if (!patientId) {
          toast.error("Patient ID is missing.");
          setPrompt(message);
          return;
        }

        let conversationId: string;
        if (existingConversationId && disableChatModal) {
          conversationId = existingConversationId;
        } else {
          const createResponse = await createPatientConversation.mutateAsync({
            patientId,
            chatType,
          });
          if (createResponse.error || !createResponse.data) {
            toast.error(
              createResponse.message || "Unable to create conversation."
            );
            setPrompt(message);
            dispatch(setOptimisticMessage(null));
            dispatch(setIsExternalThinking(false));
            return;
          }
          conversationId = createResponse.data.id;
          dispatch(setActivePatientConversation(conversationId));

          if (!disableChatModal) {
            dispatch(
              selectGlobalConversation({
                conversationId,
                type: "patient",
                patientId,
              })
            );
          } else {
            onConversationCreated?.(conversationId, "patient");
          }

          const title = generatePatientConversationTitle();
          await updatePatientConversationTitle.mutateAsync({
            patientId,
            conversationId,
            title,
          });
        }

        const sendResponse = await sendPatientConversationMessage.mutateAsync({
          patientId,
          conversationId,
          message,
        });

        if (sendResponse.error) {
          toast.error(sendResponse.message || "Unable to send message.");
          setPrompt(message);
          dispatch(setOptimisticMessage(null));
          dispatch(setIsExternalThinking(false));
          return;
        }

        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.chat.patient.conversationMessages(
            patientId,
            conversationId
          ),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.chat.patient.allPatients(),
        });
      } else {
        let conversationId: string;
        if (existingConversationId && disableChatModal) {
          conversationId = existingConversationId;
        } else {
          let createResponse;
          if (customCreateConversation) {
            createResponse = await customCreateConversation();
          } else {
            createResponse = await createGeneralConversation.mutateAsync({});
          }

          if (createResponse.error || !createResponse.data) {
            toast.error(
              createResponse.message || "Unable to start a conversation."
            );
            setPrompt(message);
            dispatch(setOptimisticMessage(null));
            dispatch(setIsExternalThinking(false));
            return;
          }
          conversationId = createResponse.data.id;
          dispatch(setActiveGeneralConversation(conversationId));

          if (!disableChatModal && !customCreateConversation) {
            dispatch(
              selectGlobalConversation({
                conversationId,
                type: "general",
              })
            );
          } else {
            onConversationCreated?.(conversationId, "general");
          }

          if (!customCreateConversation) {
            const title = generateGeneralConversationTitle();
            await updateGeneralConversationTitle.mutateAsync({
              conversationId,
              title,
            });
          }
        }

        let sendResponse;
        if (customSendMessage) {
          sendResponse = await customSendMessage(conversationId, message);
        } else {
          sendResponse = await sendGeneralConversationMessage.mutateAsync({
            conversationId,
            message,
          });
        }

        if (sendResponse.error) {
          toast.error(sendResponse.message || "Unable to send message.");
          setPrompt(message);
          dispatch(setOptimisticMessage(null));
          dispatch(setIsExternalThinking(false));
          return;
        }

        queryClient.invalidateQueries({
          queryKey:
            queryKeys.doctor.chat.general.conversationMessages(conversationId),
        });
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
      setPrompt(message);
      dispatch(setOptimisticMessage(null));
      dispatch(setIsExternalThinking(false));
    }
  };

  const generatePatientConversationTitle = (): string => {
    const patient = patientData?.data as any;
    if (!patient) return "New Conversation";

    const firstName = patient.firstName || "";
    const lastName = patient.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim() || "Patient";
    const dob = patient.dateOfBirth
      ? formatDate(patient.dateOfBirth, "MM/DD/YYYY")
      : "";

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
