import { Spinner } from "@/components/ui/spinner";
import { useGetDosingHistory } from "@/hooks/useDoctor";
import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { resetDosingCalculator } from "@/store/features/dosing";
import { DoseSuggestions } from "../doseCalc/components/DoseSuggestions";
import { Calculator } from "../doseCalc/components/Calculator";
import { TreatmentPlan } from "../doseCalc/components/TreatmentPlan";

interface DosingCalculatorTabProps {
    readonly patientId?: string;
    readonly patient?: PatientDetail | null;
}

export function DosingCalculatorTab({ patientId, patient }: Readonly<DosingCalculatorTabProps>) {
    const dispatch = useAppDispatch();
    const {
        data: historyResponse,
        isLoading,
        isError,
        error,
    } = useGetDosingHistory(patientId ?? "", {
        enabled: Boolean(patientId),
    });

    // Reset state when patient changes
    useEffect(() => {
        dispatch(resetDosingCalculator());
    }, [patientId, dispatch]);

    if (isLoading) {
        return (
            <div className="rounded-lg bg-primary-foreground p-4 md:p-6">
                <div className="flex items-center justify-center py-12">
                    <Spinner className="h-8 w-8 text-primary" />
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="rounded-lg bg-primary-foreground p-4 md:p-6">
                <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    <div>
                        <p className="typo-body-2 font-medium text-destructive">
                            Failed to load dosing history
                        </p>
                        <p className="mt-1 typo-body-3 text-destructive/80">
                            {error?.message || "An error occurred while fetching dosing data."}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg bg-primary-foreground p-4 md:p-6 space-y-4 md:space-y-6 w-full">
            <Calculator historyData={historyResponse?.data ?? null} patient={patient} />
            <TreatmentPlan historyData={historyResponse?.data ?? null} />
            <DoseSuggestions historyData={historyResponse?.data ?? null} />
        </div>
    );
}
