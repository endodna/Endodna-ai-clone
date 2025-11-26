import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ChatState {
  activePatientConversationId: string | null;
  activeGeneralConversationId: string | null;
  isGlobalChatModalOpen: boolean;
  selectedConversationId: string | null;
  conversationType: "patient" | "general" | null;
  selectedPersona: "patient" | "research" | null;
  selectedPatientId: string | null;
  optimisticMessage: string | null;
  isExternalThinking: boolean;
}

const initialState: ChatState = {
  activePatientConversationId: null,
  activeGeneralConversationId: null,
  isGlobalChatModalOpen: false,
  selectedConversationId: null,
  conversationType: null,
  selectedPersona: null,
  selectedPatientId: null,
  optimisticMessage: null,
  isExternalThinking: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActivePatientConversation: (
      state,
      action: PayloadAction<string | null>
    ) => {
      state.activePatientConversationId = action.payload;
      state.conversationType = action.payload ? "patient" : null;
      state.selectedConversationId = action.payload;
    },
    setActiveGeneralConversation: (state, action: PayloadAction<string | null>) => {
      state.activeGeneralConversationId = action.payload;
      state.conversationType = action.payload ? "general" : null;
      state.selectedConversationId = action.payload;
    },
    closeGlobalChatModal: (state) => {
      state.isGlobalChatModalOpen = false;
    },
    selectGlobalConversation: (
      state,
      action: PayloadAction<{
        conversationId: string;
        type: "patient" | "general";
        patientId?: string;
      }>
    ) => {
      state.selectedConversationId = action.payload.conversationId;
      state.conversationType = action.payload.type;
      if (action.payload.type === "patient") {
        state.activePatientConversationId = action.payload.conversationId;
        state.selectedPatientId = action.payload.patientId || null;
      } else {
        state.activeGeneralConversationId = action.payload.conversationId;
        state.selectedPatientId = null;
      }
      state.isGlobalChatModalOpen = true;
    },
    setOptimisticMessage: (state, action: PayloadAction<string | null>) => {
      state.optimisticMessage = action.payload;
    },
    setIsExternalThinking: (state, action: PayloadAction<boolean>) => {
      state.isExternalThinking = action.payload;
    },
    setSelectedPersona: (
      state,
      action: PayloadAction<"patient" | "research">
    ) => {
      state.selectedPersona = action.payload;
    },
    resetChatState: (state) => {
      state.activePatientConversationId = null;
      state.activeGeneralConversationId = null;
      state.isGlobalChatModalOpen = false;
      state.selectedConversationId = null;
      state.conversationType = null;
      state.selectedPersona = null;
      state.selectedPatientId = null;
      state.optimisticMessage = null;
      state.isExternalThinking = false;
    },
  },
});

export const {
  setActivePatientConversation,
  setActiveGeneralConversation,
  closeGlobalChatModal,
  selectGlobalConversation,
  setSelectedPersona,
  setOptimisticMessage,
  setIsExternalThinking,
  resetChatState,
} = chatSlice.actions;

export default chatSlice.reducer;
