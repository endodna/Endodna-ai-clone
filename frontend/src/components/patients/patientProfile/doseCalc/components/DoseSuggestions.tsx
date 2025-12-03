import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedDose } from "@/store/features/dosing";

interface DoseSuggestionsProps {
    historyData?: PatientDosageHistoryEntry[] | null;
}

interface TierData {
    dosageMg: number;
    pelletsCount: number;
}

// Runtime constants matching DosageTier enum values
const DOSAGE_TIER = {
    CONSERVATIVE: "conservative",
    STANDARD: "standard",
    AGGRESSIVE: "aggressive",
    HIGH_PERFORMANCE: "high_performance",
} as const;

const TIER_LABELS: Record<string, string> = {
    [DOSAGE_TIER.CONSERVATIVE]: "Conservative",
    [DOSAGE_TIER.STANDARD]: "Standard",
    [DOSAGE_TIER.AGGRESSIVE]: "Aggressive",
    [DOSAGE_TIER.HIGH_PERFORMANCE]: "High-Performance",
};

const TIER_ORDER: string[] = [
    DOSAGE_TIER.CONSERVATIVE,
    DOSAGE_TIER.STANDARD,
    DOSAGE_TIER.AGGRESSIVE,
    DOSAGE_TIER.HIGH_PERFORMANCE,
];

interface TierCardProps {
    tier: string;
    dosageMg: number;
    pelletsCount: number;
    hormoneType: "testosterone" | "estradiol";
    isSelected?: boolean;
}

interface HormoneSectionProps {
    title: string;
    suggestions: Record<string, TierData> | null;
    hormoneType: "testosterone" | "estradiol";
}

function TierCard({
    tier,
    dosageMg,
    pelletsCount,
    hormoneType,
    isSelected,
}: Readonly<TierCardProps>) {
    const dispatch = useAppDispatch();

    const handleSelect = () => {
        dispatch(
            setSelectedDose({
                hormoneType,
                tier,
                dosageMg,
                pelletsCount,
            })
        );
    };

    return (
        <Card
            onClick={handleSelect}
            className={`max-w-[180px] w-full cursor-pointer transition-all duration-300 hover:scale-105 ${
                isSelected
                    ? "border-primary-brand-teal-1 bg-primary-brand-teal-1/10"
                    : "border-primary-brand-teal-1/30 bg-primary/50 hover:border-primary-brand-teal-1/70"
            }`}
        >
            <CardHeader className="py-2 px-2 md:px-4">
                <CardTitle className="typo-body-2 text-foreground text-base">
                    {TIER_LABELS[tier]}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-2 md:px-4 py-2">
                <div className="flex items-center justify-between">
                    <p className="typo-body-2 text-foreground">{dosageMg}</p>
                    <p className="typo-body-2 text-foreground">mg</p>
                </div>
                <div className="flex items-center justify-between">
                    <p className="typo-body-2 text-foreground">{pelletsCount}</p>
                    <p className="typo-body-2 text-foreground">Pellets</p>
                </div>
            </CardContent>
        </Card>
    );
}


function HormoneSection({
    title,
    suggestions,
    hormoneType,
}: Readonly<HormoneSectionProps>) {
    const { selectedDose } = useAppSelector((state) => state.dosingCalculator);

    if (!suggestions || Object.keys(suggestions).length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <h4 className="typo-body-2-regular text-muted-foreground">{title}</h4>
        <div>
                <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
                    {TIER_ORDER.map((tier) => {
                        const tierData = suggestions[tier];
                        if (!tierData) return null;
                        const isSelected =
                            selectedDose?.hormoneType === hormoneType &&
                            selectedDose?.tier === tier;
                        return (
                            <TierCard
                                key={tier}
                                tier={tier}
                                dosageMg={tierData.dosageMg}
                                pelletsCount={tierData.pelletsCount}
                                hormoneType={hormoneType}
                                isSelected={isSelected}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export function DoseSuggestions({ historyData }: Readonly<DoseSuggestionsProps>) {
    const dispatch = useAppDispatch();
    const { selectedDose } = useAppSelector((state) => state.dosingCalculator);

    const { testosteroneSuggestions, estradiolSuggestions } = useMemo(() => {
        if (!historyData || !Array.isArray(historyData) || historyData.length === 0) {
            return { testosteroneSuggestions: null, estradiolSuggestions: null };
        }

        // Get the most recent entry
        const mostRecentEntry = historyData[0];
        const { data: entryData } = mostRecentEntry;

        // Helper function to extract suggestions from dosingSuggestions object
        const extractSuggestions = (
            dosingSuggestions: Record<string, unknown> | undefined
        ): Record<string, TierData> | null => {
            if (!dosingSuggestions) return null;

            const result: Record<string, TierData> = {};

            for (const tier of TIER_ORDER) {
                const tierData = dosingSuggestions[tier] as
                    | { dosingCalculation: { finalDoseMg: number; pelletCount: number } }
                    | undefined;

                if (tierData?.dosingCalculation) {
                    result[tier] = {
                        dosageMg: tierData.dosingCalculation.finalDoseMg,
                        pelletsCount: tierData.dosingCalculation.pelletCount,
                    };
                }
            }

            // Return null if no valid tiers found
            if (Object.keys(result).length === 0) return null;

            return result;
        };

        // Extract testosterone suggestions (T100 or T200)
        let testosteroneSuggestions: Record<string, TierData> | null = null;
        if (entryData.T100?.dosingSuggestions) {
            testosteroneSuggestions = extractSuggestions(entryData.T100.dosingSuggestions);
        } else if (entryData.T200?.dosingSuggestions) {
            testosteroneSuggestions = extractSuggestions(entryData.T200.dosingSuggestions);
        }

        // Extract estradiol suggestions
        let estradiolSuggestions: Record<string, TierData> | null = null;
        if (entryData.ESTRADIOL?.dosingSuggestions) {
            estradiolSuggestions = extractSuggestions(entryData.ESTRADIOL.dosingSuggestions);
        }

        return { testosteroneSuggestions, estradiolSuggestions };
    }, [historyData]);

    // Set default selected dose (first tier from first available hormone)
    useEffect(() => {
        if (!selectedDose) {
            const firstAvailableSuggestions = testosteroneSuggestions || estradiolSuggestions;
            const hormoneType: "testosterone" | "estradiol" = testosteroneSuggestions
                ? "testosterone"
                : "estradiol";

            if (firstAvailableSuggestions) {
                const firstTier = TIER_ORDER.find(
                    (tier) => firstAvailableSuggestions[tier]
                );
                if (firstTier && firstAvailableSuggestions[firstTier]) {
                    dispatch(
                        setSelectedDose({
                            hormoneType,
                            tier: firstTier,
                            dosageMg: firstAvailableSuggestions[firstTier].dosageMg,
                            pelletsCount: firstAvailableSuggestions[firstTier].pelletsCount,
                        })
                    );
                }
            }
        }
    }, [testosteroneSuggestions, estradiolSuggestions, selectedDose, dispatch]);

    const hasSuggestions = testosteroneSuggestions || estradiolSuggestions;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h4 className="typo-h3 text-foreground">Dosing Suggestions</h4>
                <div className="flex items-start rounded-lg border border-muted-foreground/20 p-2 md:p-4 gap-3 md:gap-4">
                    <AlertTriangle className="h-4 w-4 text-foreground flex-shrink-0" />
                    <div>
                        <p className="typo-body-2 text-foreground">
                            Suggestion Criteria
                        </p>
                        <p className="typo-body-2 text-muted-foreground">
                            The remaining treatment plan components will be enabled after the hormones have been selected.
                        </p>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {!hasSuggestions && (
                <div className="py-8 text-center">
                    <p className="typo-body-2 text-muted-foreground">
                        No dosing suggestions available.
                    </p>
                </div>
            )}

            {/* Testosterone Section */}
            {testosteroneSuggestions && (
                <HormoneSection
                    title="Testosterone"
                    suggestions={testosteroneSuggestions}
                    hormoneType="testosterone"
                />
            )}

            {/* Estradiol Section */}
            {estradiolSuggestions && (
                <HormoneSection
                    title="Estradiol"
                    suggestions={estradiolSuggestions}
                    hormoneType="estradiol"
                />
            )}
        </div>
    );
}
