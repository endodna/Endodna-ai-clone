import { configureStore } from "@reduxjs/toolkit";
import { patientDialogReducer } from "./features/patient";
import { chatReducer } from "./features/chat";

/**
 * Redux store configuration
 */
export const store = configureStore({
    reducer: {
        patientDialog: patientDialogReducer,
        chat: chatReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: [],
                // Ignore these field paths in all actions
                ignoredActionPaths: [],
                // Ignore these paths in the state
                ignoredPaths: [],
            },
        })
});

/**
 * RootState type - represents the entire Redux state tree
 * Use this type when you need to access the state in components
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * AppDispatch type - represents the dispatch function type
 * Use this type when you need to dispatch actions
 */
export type AppDispatch = typeof store.dispatch;