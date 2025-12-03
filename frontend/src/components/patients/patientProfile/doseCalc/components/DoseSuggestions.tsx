import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";

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
}

interface HormoneSectionProps {
    title: string;
    suggestions: Record<string, TierData> | null;
}

function TierCard({ tier, dosageMg, pelletsCount }: Readonly<TierCardProps>) {
    return (

        <div className="max-w-[180px] w-full rounded-xl text-card-foreground shadow px-2 md:px-4 py-1 md:py-2 cursor-pointer border-2 transition-all duration-300 border-primary-brand-teal-1/30 bg-primary/50 hover:scale-105 hover:border-primary-brand-teal-1/70">
            <p className="typo-body-2 text-foreground">
                {TIER_LABELS[tier]}
            </p>
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <p className="typo-body-2 text-foreground">{dosageMg}</p>
                    <p className="typo-body-2 text-foreground">mg</p>
                </div>
                <div className="flex items-center justify-between">
                    <p className="typo-body-2 text-foreground">{pelletsCount}</p>
                    <p className="typo-body-2 text-foreground">Pellets</p>
                </div>
            </div>
        </div>
    );
}

function HormoneSection({ title, suggestions }: Readonly<HormoneSectionProps>) {
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
                        return (
                            <TierCard
                                key={tier}
                                tier={tier}
                                dosageMg={tierData.dosageMg}
                                pelletsCount={tierData.pelletsCount}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export function DoseSuggestions({ historyData }: Readonly<DoseSuggestionsProps>) {
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

    const hasSuggestions = testosteroneSuggestions || estradiolSuggestions;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h2 className="typo-h3 text-foreground">Dosing Suggestions</h2>
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
                />
            )}

            {/* Estradiol Section */}
            {estradiolSuggestions && (
                <HormoneSection
                    title="Estradiol"
                    suggestions={estradiolSuggestions}
                />
            )}
        </div>
    );
}
