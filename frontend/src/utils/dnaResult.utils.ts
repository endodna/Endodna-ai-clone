import { DNA_RESULT_STATUS, DNA_STEP_STATUS, DNA_TIMELINE, DnaStepStatus, DnaTestStepId } from "@/components/constants/DnaResults";
// Result Types
export type HoldCancelDiscardResult = {
    isHold: boolean;
    isCancel: boolean;
    isDiscard: boolean;
};

export type StepStatusResult = {
    id: DnaTestStepId | null;
    status: DnaStepStatus;
};

const STATUS_TO_STEP: Record<string, StepStatusResult> = {
    [DNA_RESULT_STATUS.KIT_REGISTERED]: { id: DNA_TIMELINE.step1.id, status: DNA_STEP_STATUS.COMPLETE },

    [DNA_RESULT_STATUS.KIT_RECEIVED]: { id: DNA_TIMELINE.step2.id, status: DNA_STEP_STATUS.COMPLETE },

    [DNA_RESULT_STATUS.QC_PASSED]: { id: DNA_TIMELINE.step3.id, status: DNA_STEP_STATUS.COMPLETE },
    [DNA_RESULT_STATUS.QC_FAILED]: { id: DNA_TIMELINE.step3.id, status: DNA_STEP_STATUS.FAILED },

    [DNA_RESULT_STATUS.DNA_EXTRACTION_ACCEPTED]: { id: DNA_TIMELINE.step4.id, status: DNA_STEP_STATUS.COMPLETE },
    [DNA_RESULT_STATUS.DNA_EXTRACTION_FAILED]: { id: DNA_TIMELINE.step4.id, status: DNA_STEP_STATUS.FAILED },
    [DNA_RESULT_STATUS.DNA_EXTRACTION_2ND_ACCEPTED]: { id: DNA_TIMELINE.step4.id, status: DNA_STEP_STATUS.COMPLETE },
    [DNA_RESULT_STATUS.DNA_EXTRACTION_2ND_FAILED]: { id: DNA_TIMELINE.step4.id, status: DNA_STEP_STATUS.FAILED },

    [DNA_RESULT_STATUS.GENOTYPING_ACCEPTED]: { id: DNA_TIMELINE.step5.id, status: DNA_STEP_STATUS.COMPLETE },
    [DNA_RESULT_STATUS.GENOTYPING_FAILED]: { id: DNA_TIMELINE.step5.id, status: DNA_STEP_STATUS.FAILED },
    [DNA_RESULT_STATUS.GENOTYPING_2ND_ACCEPTED]: { id: DNA_TIMELINE.step5.id, status: DNA_STEP_STATUS.COMPLETE },
    [DNA_RESULT_STATUS.GENOTYPING_2ND_FAILED]: { id: DNA_TIMELINE.step5.id, status: DNA_STEP_STATUS.FAILED },

    [DNA_RESULT_STATUS.DATA_DELIVERED]: { id: DNA_TIMELINE.step6.id, status: DNA_STEP_STATUS.COMPLETE },
}

// utils to get the DNA test step at which and their status from DNA_RESULT_STATUS.
export const getDnaResultStatus = (status: string | null | undefined): HoldCancelDiscardResult | StepStatusResult | null => {
    // Handle null/undefined/empty status
    if (!status || typeof status !== "string") {
        return {
            id: null,
            status: DNA_STEP_STATUS.UPCOMING,
        };
    }

    const normalizedStatus = status.trim().toUpperCase();

    if (!normalizedStatus) {
        return {
            id: null,
            status: DNA_STEP_STATUS.UPCOMING,
        };
    }

    if (normalizedStatus === DNA_RESULT_STATUS.HOLD) return { isHold: true, isCancel: false, isDiscard: false }
    if (normalizedStatus === DNA_RESULT_STATUS.CANCEL) return { isHold: false, isCancel: true, isDiscard: false }
    if (normalizedStatus === DNA_RESULT_STATUS.DISCARD) return { isHold: false, isCancel: false, isDiscard: true };

    const stepStatus = STATUS_TO_STEP[normalizedStatus];
    if (stepStatus) return stepStatus;
    
    // Fallback for unknown statuses
    return {
        id: null,
        status: DNA_STEP_STATUS.UPCOMING,
    };
}

export const normalizeDnaStatus = (status?: string | null) => (status ?? "").trim().toUpperCase();
