import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { extractModifiers } from "./utils/treatmentPlan.utils";

interface AppliedModifiersProps {
    historyData?: PatientDosageHistoryEntry[] | null;
}

export function AppliedModifiers({ historyData }: Readonly<AppliedModifiersProps>) {
    const { selectedDose } = useAppSelector((state) => state.dosingCalculator);

    const modifiers = useMemo(() => {
        return extractModifiers(historyData ?? null, selectedDose);
    }, [historyData, selectedDose]);

    if (modifiers.length === 0) {
        return null;
    }

    return (
        <div className="w-full md:w-1/2">
            <Card className="bg-muted border-muted-foreground/30">
                <CardHeader className="pb-3">
                    <CardTitle className="typo-body-1 text-foreground flex items-center gap-2">
                        Applied Modifiers
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4 divide-y divide-muted-foreground/30">
                        {modifiers.map((modifierCategory, index) => (
                            <div key={`${modifierCategory.category}-${index}`} className="space-y-2 flex justify-between items-center">
                                <p className="typo-body-2 font-medium text-foreground/70">
                                    {modifierCategory.category}:
                                </p>
                                <ul className="list-inside space-y-1 ml-2 list-none">
                                    {modifierCategory.items.map((item, itemIndex) => (
                                        <li
                                            key={`${modifierCategory.category}-item-${itemIndex}-${item.slice(0, 20)}`}
                                            className="typo-body-2 text-foreground/70"
                                        >
                                            {item}
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

