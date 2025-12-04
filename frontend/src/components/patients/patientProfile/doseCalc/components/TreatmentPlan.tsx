import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";

interface TreatmentPlanProps {
    historyData?: PatientDosageHistoryEntry[] | null;
}

interface CalculationBreakdownItem {
    step: string;
    condition: string;
    alerts?: string[];
    warnings?: string[];
    criticalAlerts?: string[];
    cautions?: string[];
}

export function TreatmentPlan({ historyData }: Readonly<TreatmentPlanProps>) {
    const { selectedDose } = useAppSelector((state) => state.dosingCalculator);

    const alerts = useMemo(() => {
        if (!selectedDose || !historyData || !Array.isArray(historyData) || historyData.length === 0) {
            return [];
        }

        // Get the most recent entry
        const mostRecentEntry = historyData[0];
        const { data: entryData } = mostRecentEntry;

        // Determine which hormone data to access
        let hormoneData: { dosingSuggestions?: Record<string, unknown> } | undefined;

        if (selectedDose.hormoneType === "testosterone") {
            // Check T100 first, then T200
            hormoneData = entryData.T100 || entryData.T200;
        } else if (selectedDose.hormoneType === "estradiol") {
            hormoneData = entryData.ESTRADIOL;
        }

        if (!hormoneData?.dosingSuggestions) {
            return [];
        }

        // Access the tier data
        const tierData = hormoneData.dosingSuggestions[selectedDose.tier] as
            | {
                dosingCalculation: {
                    calculationBreakdown?: CalculationBreakdownItem[];
                };
            }
            | undefined;

        if (!tierData?.dosingCalculation?.calculationBreakdown) {
            return [];
        }

        // Filter for items that have alerts
        const breakdownItems = tierData.dosingCalculation.calculationBreakdown;
        const itemsWithAlerts = breakdownItems.filter(
            (item) => item.alerts && Array.isArray(item.alerts) && item.alerts.length > 0
        );

        // Map to the format we need: { condition, alerts }
        return itemsWithAlerts.map((item) => ({
            condition: item.condition,
            alerts: item.alerts || [],
        }));
    }, [selectedDose, historyData]);

    if (alerts.length === 0) {
        return null;
    }

    return (
        <div className="w-1/2 space-y-4 md:space-y-6">
            <h4 className="typo-h3 text-foreground">Treatment Plan</h4>
            <div className="w-full">
                <Card className="bg-primary/10 border-primary">
                    <CardHeader className="pb-3">
                        <CardTitle className="typo-body-1 text-primary-brand-teal-1 flex items-center gap-2">
                            Alerts & Contraindications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="divide-y divide-primary/30">
                            {alerts.map((alertItem, index) => (
                                <div key={`${alertItem.condition}-${index}`} className="space-y-2 py-2 first:pt-0 last:pb-0">
                                    <p className="typo-body-2 font-medium text-primary-brand-teal-1">
                                        {alertItem.condition}
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                        {alertItem.alerts.map((alert, alertIndex) => (
                                            <li
                                                key={`${alertItem.condition}-alert-${alertIndex}-${alert.slice(0, 20)}`}
                                                className="typo-body-2 text-foreground/90"
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
        </div>
    );
}
