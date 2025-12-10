import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SelectedDose {
    hormoneType: "testosterone" | "estradiol";
    tier: string;
    tierType: "base" | "modified";
    dosageMg: number;
}

// Unique identifier for each hormone type section
export type HormoneTypeKey = "testosterone_100" | "testosterone_200" | "estradiol";

interface DosingCalculatorState {
    // Store multiple selected doses, one per hormone type
    selectedDoses: Record<HormoneTypeKey, SelectedDose | null>;
    // Keep selectedDose for backward compatibility (points to first available selection)
    selectedDose: SelectedDose | null;
    insertionDate: string | null;
}

const initialState: DosingCalculatorState = {
    selectedDoses: {
        testosterone_100: null,
        testosterone_200: null,
        estradiol: null,
    },
    selectedDose: null,
    insertionDate: null,
};

const dosingCalculatorSlice = createSlice({
    name: "dosingCalculator",
    initialState,
    reducers: {
        setSelectedDose: (state, action: PayloadAction<SelectedDose | null>) => {
            // For backward compatibility, update selectedDose
            state.selectedDose = action.payload;
            // Also update selectedDoses based on hormoneType
            if (action.payload) {
                // Determine which key to use based on hormoneType
                // This is a fallback for old code - new code should use setSelectedDoseForHormone
                const key: HormoneTypeKey = action.payload.hormoneType === "testosterone" 
                    ? "testosterone_100" // Default to T100 for backward compatibility
                    : "estradiol";
                state.selectedDoses[key] = action.payload;
            } else {
                // Clear all if null
                state.selectedDoses = {
                    testosterone_100: null,
                    testosterone_200: null,
                    estradiol: null,
                };
            }
            // Update selectedDose to first available
            state.selectedDose = Object.values(state.selectedDoses).find(dose => dose !== null) || null;
        },
        setSelectedDoseForHormone: (state, action: PayloadAction<{ key: HormoneTypeKey; dose: SelectedDose | null }>) => {
            state.selectedDoses[action.payload.key] = action.payload.dose;
            // Update selectedDose to first available for backward compatibility
            state.selectedDose = Object.values(state.selectedDoses).find(dose => dose !== null) || null;
        },
        setInsertionDate: (state, action: PayloadAction<string | null>) => {
            state.insertionDate = action.payload;
        },
        resetDosingCalculator: (state) => {
            state.selectedDoses = {
                testosterone_100: null,
                testosterone_200: null,
                estradiol: null,
            };
            state.selectedDose = null;
            state.insertionDate = null;
        },
    },
});

export const {
    setSelectedDose,
    setSelectedDoseForHormone,
    setInsertionDate,
    resetDosingCalculator,
} = dosingCalculatorSlice.actions;

export default dosingCalculatorSlice.reducer;

