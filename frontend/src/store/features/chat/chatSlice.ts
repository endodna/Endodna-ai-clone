import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ChatState {
    activePatientConversationId: string | null;
    activeGeneralConversationId: string | null;
    isChatModalOpen: boolean;
    selectedConversationId: string | null;
    conversationType: "patient" | "general" | null;
    selectedPersona: "patient" | "research" | null;
}

const initialState: ChatState = {
    activePatientConversationId: null,
    activeGeneralConversationId: null,
    isChatModalOpen: false,
    selectedConversationId: null,
    conversationType: null,
    selectedPersona: null,
};

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        setActivePatientConversation: (state, action: PayloadAction<string | null>) => {
            state.activePatientConversationId = action.payload;
            state.conversationType = action.payload ? "patient" : null;
            state.selectedConversationId = action.payload;
        },
        setActiveGeneralConversation: (state, action: PayloadAction<string | null>) => {
            state.activeGeneralConversationId = action.payload;
            state.conversationType = action.payload ? "general" : null;
            state.selectedConversationId = action.payload;
        },
        openChatModal: (state) => {
            state.isChatModalOpen = true;
        },
        closeChatModal: (state) => {
            state.isChatModalOpen = false;
        },
        selectConversation: (
            state,
            action: PayloadAction<{ conversationId: string; type: "patient" | "general" }>
        ) => {
            state.selectedConversationId = action.payload.conversationId;
            state.conversationType = action.payload.type;
            if (action.payload.type === "patient") {
                state.activePatientConversationId = action.payload.conversationId;
            } else {
                state.activeGeneralConversationId = action.payload.conversationId;
            }
            state.isChatModalOpen = true;
        },
        setSelectedPersona: (state, action: PayloadAction<"patient" | "research">) => {
            state.selectedPersona = action.payload;
        },
        resetChatState: (state) => {
            state.activePatientConversationId = null;
            state.activeGeneralConversationId = null;
            state.isChatModalOpen = false;
            state.selectedConversationId = null;
            state.conversationType = null;
            state.selectedPersona = null;
        },
    },
});

export const {
    setActivePatientConversation,
    setActiveGeneralConversation,
    openChatModal,
    closeChatModal,
    selectConversation,
    setSelectedPersona,
    resetChatState,
} = chatSlice.actions;

export default chatSlice.reducer;

