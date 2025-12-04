import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SelectedDose {
    hormoneType: "testosterone" | "estradiol";
    tier: string;
    tierType: "base" | "modified";
    dosageMg: number;
    pelletsCount: number;
}

interface DosingCalculatorState {
    selectedDose: SelectedDose | null;
    insertionDate: string | null;
}

const initialState: DosingCalculatorState = {
    selectedDose: null,
    insertionDate: null,
};

const dosingCalculatorSlice = createSlice({
    name: "dosingCalculator",
    initialState,
    reducers: {
        setSelectedDose: (state, action: PayloadAction<SelectedDose>) => {
            state.selectedDose = action.payload;
        },
        setInsertionDate: (state, action: PayloadAction<string | null>) => {
            state.insertionDate = action.payload;
        },
        resetDosingCalculator: (state) => {
            state.selectedDose = null;
            state.insertionDate = null;
        },
    },
});

export const {
    setSelectedDose,
    setInsertionDate,
    resetDosingCalculator,
} = dosingCalculatorSlice.actions;

export default dosingCalculatorSlice.reducer;

