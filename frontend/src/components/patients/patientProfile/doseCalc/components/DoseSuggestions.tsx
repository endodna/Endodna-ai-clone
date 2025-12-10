import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedDoseForHormone, type HormoneTypeKey } from "@/store/features/dosing";
import { Pencil, Eye, EyeClosed, Plus, Minus, Sparkles } from "lucide-react";

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
    hormoneTypeKey: HormoneTypeKey;
    tierType: "base" | "modified";
    isSelected?: boolean;
}

interface TierSectionProps {
    title: string;
    suggestions: Record<string, TierData> | null;
    hormoneType: "testosterone" | "estradiol";
    hormoneTypeKey: HormoneTypeKey;
    tierType: "base" | "modified";
}

interface HormoneSectionProps {
    title: string;
    suggestions: HormoneSuggestions;
    hormoneType: "testosterone" | "estradiol";
    hormoneTypeKey: HormoneTypeKey;
    isEditMode: boolean;
    onToggleEditMode: () => void;
    onSelectTier: () => void;
}

interface HormoneSummaryRowProps {
    title: string;
    selectedDose: {
        tier: string;
        tierType: "base" | "modified";
        dosageMg: number;
    };
    onEdit: () => void;
}

interface Supplement {
    id: string;
    productName: string;
    brand: string;
    dosage: string;
    benefits: string;
    allergenDietaryStatus: string;
    directions: string;
    rationale: string;
    contraindications: string;
    quantity: number;
    type: string;
    frequency: string;
    durationInDays: number;
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
    hormoneTypeKey,
    tierType,
    isSelected,
    onSelect,
}: Readonly<TierCardProps & { onSelect?: () => void }>) {
    const dispatch = useAppDispatch();

    const handleSelect = () => {
        dispatch(
            setSelectedDoseForHormone({
                key: hormoneTypeKey,
                dose: {
                    hormoneType,
                    tier,
                    tierType,
                    dosageMg,
                },
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
                    <p className="typo-body-2 text-foreground">
                        {Number(dosageMg).toFixed(2)}
                    </p>
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
    hormoneTypeKey,
    tierType,
    onSelect,
}: Readonly<TierSectionProps & { onSelect?: () => void }>) {
    const { selectedDoses } = useAppSelector((state) => state.dosingCalculator);

    if (!suggestions || Object.keys(suggestions).length === 0) {
        return null;
    }

    const selectedDose = selectedDoses[hormoneTypeKey] ?? null;

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
                            hormoneTypeKey={hormoneTypeKey}
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
    title,
    selectedDose,
    onEdit,
}: Readonly<HormoneSummaryRowProps>) {
    const tierLabel = TIER_LABELS[selectedDose.tier] || selectedDose.tier;
    const tierTypeLabel =
        selectedDose.tierType === "base" ? "Base Tier" : "Modified Tier";

    return (
        <div className="flex items-center justify-between py-3 border-b border-muted-foreground/30">
            <div className="flex items-center gap-3 flex-1">
                <Checkbox checked={true} className="rounded" />
                <span className="typo-body-2 text-foreground capitalize">
                    {title}
                </span>
                <span className="mx-auto mr-4 typo-body-2 text-muted-foreground">
                    {tierTypeLabel} - {tierLabel} | {Number(selectedDose.dosageMg).toFixed(2)} mg
                </span>
            </div>
            <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={onEdit}
            >
                Edit
            </Button>
        </div>
    );
}

function HormoneSection({
    title,
    suggestions,
    hormoneType,
    hormoneTypeKey,
    isEditMode,
    onToggleEditMode,
    onSelectTier,
}: Readonly<HormoneSectionProps>) {
    const { selectedDoses } = useAppSelector((state) => state.dosingCalculator);
    const hasBaseTiers = suggestions.base && Object.keys(suggestions.base).length > 0;
    const hasModifiedTiers = suggestions.modified && Object.keys(suggestions.modified).length > 0;

    if (!hasBaseTiers && !hasModifiedTiers) {
        return null;
    }

    const selectedDose = selectedDoses[hormoneTypeKey] ?? null;
    const isSelected = selectedDose !== null;
    const showSummary = isSelected && !isEditMode;

    return (
        <div className="space-y-6">
            {showSummary ? (
                <HormoneSummaryRow
                    title={title}
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
                                hormoneTypeKey={hormoneTypeKey}
                                tierType="base"
                                onSelect={onSelectTier}
                            />
                        )}
                        {hasModifiedTiers && (
                            <TierSection
                                title="Modified tiers"
                                suggestions={suggestions.modified}
                                hormoneType={hormoneType}
                                hormoneTypeKey={hormoneTypeKey}
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
    const { selectedDoses } = useAppSelector((state) => state.dosingCalculator);
    const [editModeHormones, setEditModeHormones] = useState<Set<string>>(new Set());

    const { t100Suggestions, t200Suggestions, estradiolSuggestions } = useMemo(() => {
        if (!historyData || !Array.isArray(historyData) || historyData.length === 0) {
            return { t100Suggestions: null, t200Suggestions: null, estradiolSuggestions: null };
        }

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
                modified:
                    Object.keys(modifiedResult).length > 0 ? modifiedResult : null,
            };
        };

        // Helper function to merge suggestions from multiple entries
        const mergeSuggestions = (
            existing: HormoneSuggestions | null,
            newSuggestions: HormoneSuggestions
        ): HormoneSuggestions => {
            if (!existing) {
                return newSuggestions;
            }

            const mergedBase: Record<string, TierData> = {
                ...(existing.base || {}),
                ...(newSuggestions.base || {}),
            };

            const mergedModified: Record<string, TierData> = {
                ...(existing.modified || {}),
                ...(newSuggestions.modified || {}),
            };

            return {
                base: Object.keys(mergedBase).length > 0 ? mergedBase : null,
                modified: Object.keys(mergedModified).length > 0 ? mergedModified : null,
            };
        };

        // Loop through all entries and aggregate suggestions separately for T100, T200, and ESTRADIOL
        let t100Suggestions: HormoneSuggestions | null = null;
        let t200Suggestions: HormoneSuggestions | null = null;
        let estradiolSuggestions: HormoneSuggestions | null = null;

        for (const entry of historyData) {
            const { data: entryData } = entry;

            // Extract T100 suggestions separately
            if (entryData.T100?.dosingSuggestions) {
                const t100EntrySuggestions = extractSuggestions(entryData.T100.dosingSuggestions);
                t100Suggestions = mergeSuggestions(t100Suggestions, t100EntrySuggestions);
            }

            // Extract T200 suggestions separately
            if (entryData.T200?.dosingSuggestions) {
                const t200EntrySuggestions = extractSuggestions(entryData.T200.dosingSuggestions);
                t200Suggestions = mergeSuggestions(t200Suggestions, t200EntrySuggestions);
            }

            // Extract estradiol suggestions
            if (entryData.ESTRADIOL?.dosingSuggestions) {
                const estradiolEntrySuggestions = extractSuggestions(entryData.ESTRADIOL.dosingSuggestions);
                estradiolSuggestions = mergeSuggestions(estradiolSuggestions, estradiolEntrySuggestions);
            }
        }

        return { t100Suggestions, t200Suggestions, estradiolSuggestions };
    }, [historyData]);

    // Set default selected dose or clear if no suggestions available
    useEffect(() => {
        // Helper function to set default for a hormone type
        const setDefaultForHormone = (
            suggestions: HormoneSuggestions | null,
            hormoneType: "testosterone" | "estradiol",
            hormoneTypeKey: HormoneTypeKey
        ) => {
            if (!suggestions || (!suggestions.base && !suggestions.modified)) {
                // Clear if no suggestions available
                if (selectedDoses[hormoneTypeKey]) {
                    dispatch(setSelectedDoseForHormone({ key: hormoneTypeKey, dose: null }));
                }
                return;
            }

            // Set default if no selection exists for this hormone type
            if (!selectedDoses[hormoneTypeKey]) {
                const suggestionsToUse = suggestions.base || suggestions.modified;
                if (!suggestionsToUse) return;

                const tierType: "base" | "modified" = suggestions.base ? "base" : "modified";

                // Default to conservative tier (first in TIER_ORDER)
                const conservativeTier = TIER_ORDER.find((tier) => suggestionsToUse[tier]);
                if (conservativeTier && suggestionsToUse[conservativeTier]) {
                    dispatch(
                        setSelectedDoseForHormone({
                            key: hormoneTypeKey,
                            dose: {
                                hormoneType,
                                tier: conservativeTier,
                                tierType,
                                dosageMg: suggestionsToUse[conservativeTier].dosageMg,
                            },
                        })
                    );
                }
            }
        };

        // Set defaults for each hormone type independently
        setDefaultForHormone(t100Suggestions, "testosterone", "testosterone_100");
        setDefaultForHormone(t200Suggestions, "testosterone", "testosterone_200");
        setDefaultForHormone(estradiolSuggestions, "estradiol", "estradiol");
    }, [t100Suggestions, t200Suggestions, estradiolSuggestions, selectedDoses, dispatch]);

    const hasSuggestions =
        (t100Suggestions &&
            (t100Suggestions.base || t100Suggestions.modified)) ||
        (t200Suggestions &&
            (t200Suggestions.base || t200Suggestions.modified)) ||
        (estradiolSuggestions && (estradiolSuggestions.base || estradiolSuggestions.modified));

    return (
        <div className="space-y-6">
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

            {/* Testosterone (100) Section */}
            {t100Suggestions &&
                (t100Suggestions.base || t100Suggestions.modified) && (
                    <HormoneSection
                        title="Testosterone (100)"
                        suggestions={t100Suggestions}
                        hormoneType="testosterone"
                        hormoneTypeKey="testosterone_100"
                        isEditMode={editModeHormones.has("testosterone_100")}
                        onToggleEditMode={() => {
                            const newSet = new Set(editModeHormones);
                            if (newSet.has("testosterone_100")) {
                                newSet.delete("testosterone_100");
                            } else {
                                newSet.add("testosterone_100");
                            }
                            setEditModeHormones(newSet);
                        }}
                        onSelectTier={() => {
                            // Exit edit mode when a tier is selected
                            const newSet = new Set(editModeHormones);
                            newSet.delete("testosterone_100");
                            setEditModeHormones(newSet);
                        }}
                    />
                )}

            {/* Testosterone (200) Section */}
            {t200Suggestions &&
                (t200Suggestions.base || t200Suggestions.modified) && (
                    <HormoneSection
                        title="Testosterone (200)"
                        suggestions={t200Suggestions}
                        hormoneType="testosterone"
                        hormoneTypeKey="testosterone_200"
                        isEditMode={editModeHormones.has("testosterone_200")}
                        onToggleEditMode={() => {
                            const newSet = new Set(editModeHormones);
                            if (newSet.has("testosterone_200")) {
                                newSet.delete("testosterone_200");
                            } else {
                                newSet.add("testosterone_200");
                            }
                            setEditModeHormones(newSet);
                        }}
                        onSelectTier={() => {
                            // Exit edit mode when a tier is selected
                            const newSet = new Set(editModeHormones);
                            newSet.delete("testosterone_200");
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
                        hormoneTypeKey="estradiol"
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
