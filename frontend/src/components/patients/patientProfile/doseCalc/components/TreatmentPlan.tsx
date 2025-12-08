import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { AppliedModifiers } from "./AppliedModifiers";
import { AlertsAndContraindications } from "./AlertsAndContraindications";
import { extractModifiers, extractAlerts } from "./utils/treatmentPlan.utils";

interface TreatmentPlanProps {
    historyData?: PatientDosageHistoryEntry[] | null;
}

export function TreatmentPlan({ historyData }: Readonly<TreatmentPlanProps>) {
    const { selectedDose } = useAppSelector((state) => state.dosingCalculator);

    const hasData = useMemo(() => {
        const modifiers = extractModifiers(historyData ?? null, selectedDose);
        const alerts = extractAlerts(historyData ?? null, selectedDose);
        return modifiers.length > 0 || alerts.length > 0;
    }, [historyData, selectedDose]);

    if (!hasData) {
        return null;
    }

    return (
        <div className="w-full space-y-4 md:space-y-6">
            <h4 className="typo-h3 text-foreground">Treatment Plan</h4>
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
                <AppliedModifiers historyData={historyData} />
                <AlertsAndContraindications historyData={historyData} />
            </div>
        </div>
    );
}
