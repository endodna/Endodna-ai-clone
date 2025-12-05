import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { extractAlerts } from "./utils/treatmentPlan.utils";

interface AlertsAndContraindicationsProps {
    historyData?: PatientDosageHistoryEntry[] | null;
}

export function AlertsAndContraindications({ historyData }: Readonly<AlertsAndContraindicationsProps>) {
    const { selectedDose } = useAppSelector((state) => state.dosingCalculator);

    const alerts = useMemo(() => {
        return extractAlerts(historyData ?? null, selectedDose);
    }, [historyData, selectedDose]);

    if (alerts.length === 0) {
        return null;
    }

    return (
        <div className="w-full md:w-1/2">
            <Card className="bg-amber/10 ">
                <CardHeader className="pb-3">
                    <CardTitle className="typo-body-1 text-amber flex items-center gap-2">
                        Alerts & Contraindications
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="divide-y divide-primary/30">
                        {alerts.map((alertItem, index) => (
                            <div key={`${alertItem.condition}-${index}`} className="space-y-2 py-2 first:pt-0 last:pb-0">
                                <p className="typo-body-2 font-medium text-amber">
                                    {alertItem.condition}
                                </p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    {alertItem.alerts.map((alert, alertIndex) => (
                                        <li
                                            key={`${alertItem.condition}-alert-${alertIndex}-${alert.slice(0, 20)}`}
                                            className="typo-body-2 text-foreground"
                                        >
                                            {alert}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

