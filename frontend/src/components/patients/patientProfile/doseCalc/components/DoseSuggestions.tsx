import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedDose } from "@/store/features/dosing";

interface DoseSuggestionsProps {
    historyData?: PatientDosageHistoryEntry[] | null;
}

interface TierData {
    dosageMg: number;
    pelletsCount: number;
}

interface HormoneSuggestions {
    base: Record<string, TierData> | null;
    modified: Record<string, TierData> | null;
}


interface TierCardProps {
    tier: string;
    dosageMg: number;
    hormoneType: "testosterone" | "estradiol";
    tierType: "base" | "modified";
    isSelected?: boolean;
}

interface TierSectionProps {
    title: string;
    suggestions: Record<string, TierData> | null;
    hormoneType: "testosterone" | "estradiol";
    tierType: "base" | "modified";
}

interface HormoneSectionProps {
    title: string;
    suggestions: HormoneSuggestions;
    hormoneType: "testosterone" | "estradiol";
    isEditMode: boolean;
    onToggleEditMode: () => void;
    onSelectTier: () => void;
}

interface HormoneSummaryRowProps {
    hormoneType: "testosterone" | "estradiol";
    selectedDose: {
        tier: string;
        tierType: "base" | "modified";
        dosageMg: number;
    };
    onEdit: () => void;
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

function TierCard({
    tier,
    dosageMg,
    hormoneType,
    tierType,
    isSelected,
    onSelect,
}: Readonly<TierCardProps & { onSelect?: () => void }>) {
    const dispatch = useAppDispatch();

    const handleSelect = () => {
        dispatch(
            setSelectedDose({
                hormoneType,
                tier,
                tierType,
                dosageMg,
            })
        );
        onSelect?.();
    };

    return (
        <Card
            onClick={handleSelect}
            className={`max-w-[180px] w-full cursor-pointer transition-all duration-300 hover:scale-105 ${isSelected
                ? " border-primary-brand-teal-1/30 bg-primary/50 hover:border-primary-brand-teal-1/70 "
                : " border-primary-brand-teal-1 bg-primary-brand-teal-1/10"
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
            </CardContent>
        </Card>
    );
}

function TierSection({
    title,
    suggestions,
    hormoneType,
    tierType,
    onSelect,
}: Readonly<TierSectionProps & { onSelect?: () => void }>) {
    const { selectedDose } = useAppSelector((state) => state.dosingCalculator);

    if (!suggestions || Object.keys(suggestions).length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <h5 className="typo-body-2-regular text-muted-foreground">{title}</h5>
            <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
                {TIER_ORDER.map((tier) => {
                    const tierData = suggestions[tier];
                    if (!tierData) return null;
                    const isSelected =
                        selectedDose?.hormoneType === hormoneType &&
                        selectedDose?.tier === tier &&
                        selectedDose?.tierType === tierType;
                    return (
                        <TierCard
                            key={tier}
                            tier={tier}
                            dosageMg={tierData.dosageMg}
                            hormoneType={hormoneType}
                            tierType={tierType}
                            isSelected={isSelected}
                            onSelect={onSelect}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function HormoneSummaryRow({
    hormoneType,
    selectedDose,
    onEdit,
}: Readonly<HormoneSummaryRowProps>) {
    const tierLabel = TIER_LABELS[selectedDose.tier] || selectedDose.tier;
    const tierTypeLabel = selectedDose.tierType === "base" ? "Base Tier" : "Modified Tier";

    return (
        <div className="flex items-center justify-between py-3 border-b border-muted-foreground/30">
            <div className="flex items-center gap-3 flex-1">
                <Checkbox checked={true} className="rounded" />
                <span className="typo-body-2 text-foreground capitalize">
                    {hormoneType}
                </span>
                <span className="typo-body-2 text-muted-foreground">
                    {tierTypeLabel} – {tierLabel} | {selectedDose.dosageMg} mg 
                </span>
            </div>
            <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={onEdit}
            >
                EDIT
            </Button>
        </div>
    );
}

function HormoneSection({
    title,
    suggestions,
    hormoneType,
    isEditMode,
    onToggleEditMode,
    onSelectTier,
}: Readonly<HormoneSectionProps>) {
    const { selectedDose } = useAppSelector((state) => state.dosingCalculator);
    const hasBaseTiers = suggestions.base && Object.keys(suggestions.base).length > 0;
    const hasModifiedTiers = suggestions.modified && Object.keys(suggestions.modified).length > 0;

    if (!hasBaseTiers && !hasModifiedTiers) {
        return null;
    }

    const isSelected = selectedDose?.hormoneType === hormoneType;
    const showSummary = isSelected && !isEditMode;

    return (
        <div className="space-y-6">
            {showSummary ? (
                <HormoneSummaryRow
                    hormoneType={hormoneType}
                    selectedDose={{
                        tier: selectedDose.tier,
                        tierType: selectedDose.tierType,
                        dosageMg: selectedDose.dosageMg,
                    }}
                    onEdit={onToggleEditMode}
                />
            ) : (
                <>
                    <h4 className="typo-body-2-regular text-muted-foreground">{title}</h4>
                    <div className="space-y-6">
                        {hasBaseTiers && (
                            <TierSection
                                title="Base tiers"
                                suggestions={suggestions.base}
                                hormoneType={hormoneType}
                                tierType="base"
                                onSelect={onSelectTier}
                            />
                        )}
                        {hasModifiedTiers && (
                            <TierSection
                                title="Modified tiers"
                                suggestions={suggestions.modified}
                                hormoneType={hormoneType}
                                tierType="modified"
                                onSelect={onSelectTier}
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export function DoseSuggestions({ historyData }: Readonly<DoseSuggestionsProps>) {
    const dispatch = useAppDispatch();
    const { selectedDose } = useAppSelector((state) => state.dosingCalculator);
    const [editModeHormones, setEditModeHormones] = useState<Set<string>>(new Set());

    const { testosteroneSuggestions, estradiolSuggestions } = useMemo(() => {
        if (!historyData || !Array.isArray(historyData) || historyData.length === 0) {
            return { testosteroneSuggestions: null, estradiolSuggestions: null };
        }

        // Get the most recent entry
        const mostRecentEntry = historyData[0];
        const { data: entryData } = mostRecentEntry;

        // Helper function to extract base and modified suggestions from dosingSuggestions object
        const extractSuggestions = (
            dosingSuggestions: Record<string, unknown> | undefined
        ): HormoneSuggestions => {
            if (!dosingSuggestions) {
                return { base: null, modified: null };
            }

            const baseResult: Record<string, TierData> = {};
            const modifiedResult: Record<string, TierData> = {};

            for (const tier of TIER_ORDER) {
                const tierData = dosingSuggestions[tier] as
                    | {
                        dosingCalculation: {
                            baseDoseMg: number;
                            basePelletCount: number;
                            finalDoseMg: number;
                            pelletCount: number;
                        };
                    }
                    | undefined;

                if (tierData?.dosingCalculation) {
                    const { baseDoseMg, basePelletCount, finalDoseMg, pelletCount } =
                        tierData.dosingCalculation;

                    // Base tiers
                    if (baseDoseMg !== undefined && basePelletCount !== undefined) {
                        baseResult[tier] = {
                            dosageMg: baseDoseMg,
                            pelletsCount: basePelletCount,
                        };
                    }

                    // Modified tiers
                    if (finalDoseMg !== undefined && pelletCount !== undefined) {
                        modifiedResult[tier] = {
                            dosageMg: finalDoseMg,
                            pelletsCount: pelletCount,
                        };
                    }
                }
            }

            return {
                base: Object.keys(baseResult).length > 0 ? baseResult : null,
                modified: Object.keys(modifiedResult).length > 0 ? modifiedResult : null,
            };
        };

        // Extract testosterone suggestions (T100 or T200)
        let testosteroneSuggestions: HormoneSuggestions | null = null;
        if (entryData.T100?.dosingSuggestions) {
            testosteroneSuggestions = extractSuggestions(entryData.T100.dosingSuggestions);
        } else if (entryData.T200?.dosingSuggestions) {
            testosteroneSuggestions = extractSuggestions(entryData.T200.dosingSuggestions);
        }

        // Extract estradiol suggestions
        let estradiolSuggestions: HormoneSuggestions | null = null;
        if (entryData.ESTRADIOL?.dosingSuggestions) {
            estradiolSuggestions = extractSuggestions(entryData.ESTRADIOL.dosingSuggestions);
        }

        return { testosteroneSuggestions, estradiolSuggestions };
    }, [historyData]);

    // Set default selected dose or clear if no suggestions available
    useEffect(() => {
        const firstAvailableSuggestions = testosteroneSuggestions || estradiolSuggestions;

        // Clear selected dose if no suggestions available
        if (!firstAvailableSuggestions ||
            (!firstAvailableSuggestions.base && !firstAvailableSuggestions.modified)) {
            if (selectedDose) {
                dispatch(setSelectedDose(null));
            }
            return;
        }

        // Set default if no selection exists
        if (!selectedDose) {
            const hormoneType: "testosterone" | "estradiol" = testosteroneSuggestions
                ? "testosterone"
                : "estradiol";

            // Prefer base tiers (default to conservative tier from base tiers)
            const suggestionsToUse =
                firstAvailableSuggestions.base || firstAvailableSuggestions.modified;
            if (!suggestionsToUse) return;

            const tierType: "base" | "modified" = firstAvailableSuggestions.base
                ? "base"
                : "modified";

            // Default to conservative tier (first in TIER_ORDER)
            const conservativeTier = TIER_ORDER.find((tier) => suggestionsToUse[tier]);
            if (conservativeTier && suggestionsToUse[conservativeTier]) {
                dispatch(
                    setSelectedDose({
                        hormoneType,
                        tier: conservativeTier,
                        tierType,
                        dosageMg: suggestionsToUse[conservativeTier].dosageMg,
                    })
                );
            }
        }
    }, [testosteroneSuggestions, estradiolSuggestions, selectedDose, dispatch]);

    const hasSuggestions =
        (testosteroneSuggestions &&
            (testosteroneSuggestions.base || testosteroneSuggestions.modified)) ||
        (estradiolSuggestions && (estradiolSuggestions.base || estradiolSuggestions.modified));

    return (
        <div className="space-y-8">
            {/* Header */}
            <h4 className="typo-h3 text-foreground">Dosing Suggestions</h4>

            {/* Empty State */}
            {!hasSuggestions && (
                <div className="py-8 text-center">
                    <p className="typo-body-2 text-muted-foreground">
                        No dosing suggestions available.
                    </p>
                </div>
            )}

            {/* Testosterone Section */}
            {testosteroneSuggestions &&
                (testosteroneSuggestions.base || testosteroneSuggestions.modified) && (
                    <HormoneSection
                        title="Testosterone"
                        suggestions={testosteroneSuggestions}
                        hormoneType="testosterone"
                        isEditMode={editModeHormones.has("testosterone")}
                        onToggleEditMode={() => {
                            const newSet = new Set(editModeHormones);
                            if (newSet.has("testosterone")) {
                                newSet.delete("testosterone");
                            } else {
                                newSet.add("testosterone");
                            }
                            setEditModeHormones(newSet);
                        }}
                        onSelectTier={() => {
                            // Exit edit mode when a tier is selected
                            const newSet = new Set(editModeHormones);
                            newSet.delete("testosterone");
                            setEditModeHormones(newSet);
                        }}
                    />
                )}

            {/* Estradiol Section */}
            {estradiolSuggestions &&
                (estradiolSuggestions.base || estradiolSuggestions.modified) && (
                    <HormoneSection
                        title="Estradiol"
                        suggestions={estradiolSuggestions}
                        hormoneType="estradiol"
                        isEditMode={editModeHormones.has("estradiol")}
                        onToggleEditMode={() => {
                            const newSet = new Set(editModeHormones);
                            if (newSet.has("estradiol")) {
                                newSet.delete("estradiol");
                            } else {
                                newSet.add("estradiol");
                            }
                            setEditModeHormones(newSet);
                        }}
                        onSelectTier={() => {
                            // Exit edit mode when a tier is selected
                            const newSet = new Set(editModeHormones);
                            newSet.delete("estradiol");
                            setEditModeHormones(newSet);
                        }}
                    />
                )}
        </div>
    );
}
