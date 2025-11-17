import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PatientDialogState {
  isAddPatientDialogOpen: boolean;
  isSuccessDialogOpen: boolean;
  isUploadDialogOpen: boolean;
  isUploadSuccessDialogOpen: boolean;
  error: string | null;
  currentPatientId: string | null;
}

const initialState: PatientDialogState = {
  isAddPatientDialogOpen: false,
  isSuccessDialogOpen: false,
  isUploadDialogOpen: false,
  isUploadSuccessDialogOpen: false,
  error: null,
  currentPatientId: null,
};

const patientDialogSlice = createSlice({
  name: "patientDialog",
  initialState,
  reducers: {
    openAddPatientDialog: (state) => {
      state.isAddPatientDialogOpen = true;
      state.error = null;
    },
    closeAddPatientDialog: (state) => {
      state.isAddPatientDialogOpen = false;
      state.error = null;
    },
    openSuccessDialog: (state) => {
      state.isSuccessDialogOpen = true;
    },
    closeSuccessDialog: (state) => {
      state.isSuccessDialogOpen = false;
    },
    openUploadDialog: (state) => {
      state.isUploadDialogOpen = true;
    },
    closeUploadDialog: (state) => {
      state.isUploadDialogOpen = false;
    },
    openUploadSuccessDialog: (state) => {
      state.isUploadSuccessDialogOpen = true;
    },
    closeUploadSuccessDialog: (state) => {
      state.isUploadSuccessDialogOpen = false;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentPatientId: (state, action: PayloadAction<string | null>) => {
      state.currentPatientId = action.payload;
    },
    resetPatientDialogs: (state) => {
      state.isAddPatientDialogOpen = false;
      state.isSuccessDialogOpen = false;
      state.isUploadDialogOpen = false;
      state.isUploadSuccessDialogOpen = false;
      state.error = null;
      state.currentPatientId = null;
    },
  },
});

export const {
  openAddPatientDialog,
  closeAddPatientDialog,
  openSuccessDialog,
  closeSuccessDialog,
  openUploadDialog,
  closeUploadDialog,
  openUploadSuccessDialog,
  closeUploadSuccessDialog,
  setError,
  clearError,
  setCurrentPatientId,
  resetPatientDialogs,
} = patientDialogSlice.actions;

export default patientDialogSlice.reducer;

