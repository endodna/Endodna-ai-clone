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
import { setSelectedDose } from "@/store/features/dosing";
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
      className={`max-w-[180px] w-full cursor-pointer transition-all duration-300 hover:scale-105 ${
        isSelected
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
  const tierTypeLabel =
    selectedDose.tierType === "base" ? "Base Tier" : "Modified Tier";

  return (
    <div className="flex items-center justify-between py-3 border-b border-muted-foreground/30">
      <div className="flex items-center gap-3 flex-1">
        <Checkbox checked={true} className="rounded" />
        <span className="typo-body-2 text-foreground capitalize">
          {hormoneType}
        </span>
        <span className="mx-auto mr-4 typo-body-2 text-muted-foreground">
          {tierTypeLabel} - {tierLabel} |{" "}
          {Number(selectedDose.dosageMg).toFixed(2)} mg
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
  isEditMode,
  onToggleEditMode,
  onSelectTier,
}: Readonly<HormoneSectionProps>) {
  const { selectedDose } = useAppSelector((state) => state.dosingCalculator);
  const hasBaseTiers =
    suggestions.base && Object.keys(suggestions.base).length > 0;
  const hasModifiedTiers =
    suggestions.modified && Object.keys(suggestions.modified).length > 0;

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

export function DoseSuggestions({
  historyData,
}: Readonly<DoseSuggestionsProps>) {
  const dispatch = useAppDispatch();
  const { selectedDose } = useAppSelector((state) => state.dosingCalculator);
  const [editModeHormones, setEditModeHormones] = useState<Set<string>>(
    new Set()
  );
  const [isAddSupplementOpen, setIsAddSupplementOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [editingSupplementId, setEditingSupplementId] = useState<string | null>(
    null
  );
  const [expandedSupplements, setExpandedSupplements] = useState<Set<string>>(
    new Set()
  );
  const [supplementForm, setSupplementForm] = useState({
    rationale: "",
    productName: "",
    brand: "",
    dosage: "",
    benefits: "",
    allergenDietaryStatus: "Contains soy, gluten & dairy",
    directions: "",
    contraindications: "",
    quantity: 1,
    type: "Tablets",
    frequency: "Once Daily",
    durationInDays: 30,
  });

  const { testosteroneSuggestions, estradiolSuggestions } = useMemo(() => {
    if (
      !historyData ||
      !Array.isArray(historyData) ||
      historyData.length === 0
    ) {
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
        modified:
          Object.keys(modifiedResult).length > 0 ? modifiedResult : null,
      };
    };

    // Extract testosterone suggestions (T100 or T200)
    let testosteroneSuggestions: HormoneSuggestions | null = null;
    if (entryData.T100?.dosingSuggestions) {
      testosteroneSuggestions = extractSuggestions(
        entryData.T100.dosingSuggestions
      );
    } else if (entryData.T200?.dosingSuggestions) {
      testosteroneSuggestions = extractSuggestions(
        entryData.T200.dosingSuggestions
      );
    }

    // Extract estradiol suggestions
    let estradiolSuggestions: HormoneSuggestions | null = null;
    if (entryData.ESTRADIOL?.dosingSuggestions) {
      estradiolSuggestions = extractSuggestions(
        entryData.ESTRADIOL.dosingSuggestions
      );
    }

    return { testosteroneSuggestions, estradiolSuggestions };
  }, [historyData]);

  // Set default selected dose or clear if no suggestions available
  useEffect(() => {
    const firstAvailableSuggestions =
      testosteroneSuggestions || estradiolSuggestions;

    // Clear selected dose if no suggestions available
    if (
      !firstAvailableSuggestions ||
      (!firstAvailableSuggestions.base && !firstAvailableSuggestions.modified)
    ) {
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
      const conservativeTier = TIER_ORDER.find(
        (tier) => suggestionsToUse[tier]
      );
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
    (estradiolSuggestions &&
      (estradiolSuggestions.base || estradiolSuggestions.modified));

  const handleSaveSupplement = () => {
    if (!supplementForm.productName.trim()) {
      return; // Don't save if product name is empty
    }

    const updatedSupplement: Supplement = {
      id: editingSupplementId || Date.now().toString(),
      productName: supplementForm.productName,
      brand: supplementForm.brand,
      dosage: supplementForm.dosage || "Dosage Value",
      benefits: supplementForm.benefits,
      allergenDietaryStatus: supplementForm.allergenDietaryStatus,
      directions: supplementForm.directions,
      rationale: supplementForm.rationale,
      contraindications: supplementForm.contraindications,
      quantity: supplementForm.quantity,
      type: supplementForm.type,
      frequency: supplementForm.frequency,
      durationInDays: supplementForm.durationInDays,
    };

    if (editingSupplementId) {
      // Update existing supplement
      setSupplements(
        supplements.map((s) =>
          s.id === editingSupplementId ? updatedSupplement : s
        )
      );
    } else {
      // Add new supplement
      setSupplements([...supplements, updatedSupplement]);
    }

    // Reset form and editing state
    setSupplementForm({
      rationale: "",
      productName: "",
      brand: "",
      dosage: "",
      benefits: "",
      allergenDietaryStatus: "Contains soy, gluten & dairy",
      directions: "",
      contraindications: "",
      quantity: 1,
      type: "Tablets",
      frequency: "Once Daily",
      durationInDays: 30,
    });
    setEditingSupplementId(null);
    setIsAddSupplementOpen(false);
  };

  const handleCancelSupplement = () => {
    // Reset form and editing state without saving
    setSupplementForm({
      rationale: "",
      productName: "",
      brand: "",
      dosage: "",
      benefits: "",
      allergenDietaryStatus: "Contains soy, gluten & dairy",
      directions: "",
      contraindications: "",
      quantity: 1,
      type: "Tablets",
      frequency: "Once Daily",
      durationInDays: 30,
    });
    setEditingSupplementId(null);
    setIsAddSupplementOpen(false);
  };

  const getDosageDisplay = (supplement: Supplement) => {
    if (supplement.dosage && supplement.dosage !== "Dosage Value") {
      return supplement.dosage;
    }
    return "Dosage Value";
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

      {/* Supplements List */}
      {supplements.length > 0 && (
        <div>
          {supplements.map((supplement) => {
            const isExpanded = expandedSupplements.has(supplement.id);
            return (
              <div key={supplement.id}>
                <div className="flex items-center justify-between py-3 border-b border-muted-foreground/30">
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox checked={true} className="rounded" />
                    <span className="typo-body-2 text-foreground capitalize">
                      {supplement.productName}
                    </span>
                    <span className="mx-auto mr-4 typo-body-2 text-muted-foreground">
                      {getDosageDisplay(supplement)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        setSupplementForm({
                          rationale: supplement.rationale,
                          productName: supplement.productName,
                          brand: supplement.brand,
                          dosage: supplement.dosage,
                          benefits: supplement.benefits,
                          allergenDietaryStatus:
                            supplement.allergenDietaryStatus,
                          directions: supplement.directions,
                          contraindications: supplement.contraindications,
                          quantity: supplement.quantity,
                          type: supplement.type,
                          frequency: supplement.frequency,
                          durationInDays: supplement.durationInDays,
                        });
                        setEditingSupplementId(supplement.id);
                        setIsAddSupplementOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        const newSet = new Set(expandedSupplements);
                        if (isExpanded) {
                          newSet.delete(supplement.id);
                        } else {
                          newSet.add(supplement.id);
                        }
                        setExpandedSupplements(newSet);
                      }}
                    >
                      {isExpanded ? (
                        <EyeClosed className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="py-4 px-4 border-b border-muted-foreground/30">
                    <div className="space-y-3">
                      {/* {supplement.rationale && ( */}
                      <div className="bg-muted-foreground/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-foreground" />
                          <label className="text-sm font-semibold text-foreground">
                            Suggestion Rationale
                          </label>
                        </div>
                        <p className="text-sm text-foreground/60 leading-relaxed">
                          {supplement.rationale ||
                            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin enim enim, fringilla vel nisi et, tempor venenatis turpis. Aenean tincidunt faucibus velit, vitae fringilla ipsum congue vitae. Sed ut turpis viverra, auctor arcu et, pellentesque lorem. Duis luctus quam dui, luctus laoreet libero mattis eu."}
                        </p>
                      </div>
                      {/* )} */}
                      {supplement.productName && (
                        <div>
                          <label className="text-sm font-medium text-foreground">
                            Product Name
                          </label>
                          <p className="text-sm text-foreground/60 mt-1">
                            {supplement.productName}
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        {supplement.brand && (
                          <div>
                            <label className="text-sm font-medium text-foreground">
                              Brand
                            </label>
                            <p className="text-sm text-foreground/60 mt-1">
                              {supplement.brand}
                            </p>
                          </div>
                        )}
                        {supplement.dosage && (
                          <div>
                            <label className="text-sm font-medium text-foreground">
                              Dosage
                            </label>
                            <p className="text-sm text-foreground/60 mt-1">
                              {supplement.dosage}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {supplement.benefits && (
                          <div>
                            <label className="text-sm font-medium text-foreground">
                              Benefits
                            </label>
                            <p className="text-sm text-foreground/60 mt-1">
                              {supplement.benefits}
                            </p>
                          </div>
                        )}
                        {supplement.allergenDietaryStatus && (
                          <div>
                            <label className="text-sm font-medium text-foreground">
                              Allergen and Dietary Status
                            </label>
                            <p className="text-sm text-foreground/60 mt-1">
                              {supplement.allergenDietaryStatus}
                            </p>
                          </div>
                        )}
                      </div>
                      {supplement.directions && (
                        <div>
                          <label className="text-sm font-medium text-foreground">
                            Directions
                          </label>
                          <p className="text-sm text-foreground/60 mt-1">
                            {supplement.directions}
                          </p>
                        </div>
                      )}
                      {/* {supplement.contraindications && ( */}
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          Contraindications
                        </label>
                        <p className="text-sm text-foreground/60 mt-1">
                          {supplement.contraindications ||
                            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin enim enim, fringilla vel nisi et, tempor venenatis turpis. Aenean tincidunt faucibus velit, vitae fringilla ipsum congue vitae. Sed ut turpis viverra, auctor arcu et, pellentesque lorem. Duis luctus quam dui, luctus laoreet libero mattis eu."}
                        </p>
                      </div>
                      {/* )} */}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsAddSupplementOpen(true)}
        >
          Add Supplement
        </Button>
        <Button
          type="submit"
          className="px-4 py-[7.5px] space-x-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setIsSuccessModalOpen(true)}
        >
          Save dosages
        </Button>
      </div>

      {/* Add Supplement Modal */}
      <Dialog open={isAddSupplementOpen} onOpenChange={setIsAddSupplementOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-sm">
          <DialogHeader>
            <label className="text-neutral-950 font-semibold text-xl">
              Add Supplement
            </label>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Rationale */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Rationale
              </label>
              <Textarea
                placeholder="System generated"
                value={supplementForm.rationale}
                onChange={(e) =>
                  setSupplementForm({
                    ...supplementForm,
                    rationale: e.target.value,
                  })
                }
                className="min-h-[80px]"
                disabled
              />
            </div>

            {/* Product name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Product name <span className="text-foreground">*</span>
              </label>
              <Input
                placeholder="Product name"
                value={supplementForm.productName}
                onChange={(e) =>
                  setSupplementForm({
                    ...supplementForm,
                    productName: e.target.value,
                  })
                }
              />
            </div>

            {/* Brand and Dosage */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Brand
                </label>
                <Input
                  placeholder="Brand name"
                  value={supplementForm.brand}
                  onChange={(e) =>
                    setSupplementForm({
                      ...supplementForm,
                      brand: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Dosage <span className="text-foreground">*</span>
                </label>
                <Input
                  placeholder="Dosage value"
                  value={supplementForm.dosage}
                  onChange={(e) =>
                    setSupplementForm({
                      ...supplementForm,
                      dosage: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Benefits and Allergen and Dietary Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Benefits
                </label>
                <Input
                  placeholder="Benefits tagline"
                  value={supplementForm.benefits}
                  onChange={(e) =>
                    setSupplementForm({
                      ...supplementForm,
                      benefits: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Allergen and Dietary Status
                </label>
                <Input
                  value={supplementForm.allergenDietaryStatus}
                  onChange={(e) =>
                    setSupplementForm({
                      ...supplementForm,
                      allergenDietaryStatus: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Quantity, Type, Frequency, Duration in days */}
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Quantity <span className="text-foreground">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => {
                      if (supplementForm.quantity > 1) {
                        setSupplementForm({
                          ...supplementForm,
                          quantity: supplementForm.quantity - 1,
                        });
                      }
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={supplementForm.quantity}
                    onChange={(e) =>
                      setSupplementForm({
                        ...supplementForm,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    className="text-center"
                    min="1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => {
                      setSupplementForm({
                        ...supplementForm,
                        quantity: supplementForm.quantity + 1,
                      });
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Type <span className="text-foreground">*</span>
                </label>
                <Select
                  value={supplementForm.type}
                  onValueChange={(value) =>
                    setSupplementForm({
                      ...supplementForm,
                      type: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tablets">Tablets</SelectItem>
                    <SelectItem value="Capsules">Capsules</SelectItem>
                    <SelectItem value="Liquid">Liquid</SelectItem>
                    <SelectItem value="Powder">Powder</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Frequency <span className="text-foreground">*</span>
                </label>
                <Select
                  value={supplementForm.frequency}
                  onValueChange={(value) =>
                    setSupplementForm({
                      ...supplementForm,
                      frequency: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Once Daily">Once Daily</SelectItem>
                    <SelectItem value="Twice Daily">Twice Daily</SelectItem>
                    <SelectItem value="Three Times Daily">
                      Three Times Daily
                    </SelectItem>
                    <SelectItem value="Four Times Daily">
                      Four Times Daily
                    </SelectItem>
                    <SelectItem value="As Needed">As Needed</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Duration in days <span className="text-foreground">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="30 days"
                  value={supplementForm.durationInDays}
                  onChange={(e) =>
                    setSupplementForm({
                      ...supplementForm,
                      durationInDays: parseInt(e.target.value) || 30,
                    })
                  }
                  min="1"
                />
              </div>
            </div>

            {/* Directions */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Directions
              </label>
              <Textarea
                placeholder="Type your message here."
                value={supplementForm.directions}
                onChange={(e) =>
                  setSupplementForm({
                    ...supplementForm,
                    directions: e.target.value,
                  })
                }
                className="min-h-[80px]"
              />
            </div>

            {/* Contraindications */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Contraindications
              </label>
              <Textarea
                placeholder="System generated"
                value={supplementForm.contraindications}
                onChange={(e) =>
                  setSupplementForm({
                    ...supplementForm,
                    contraindications: e.target.value,
                  })
                }
                className="min-h-[80px]"
                disabled
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelSupplement}
            >
              Cancel
            </Button>
            <Button type="submit" onClick={handleSaveSupplement}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              Dosages saved successfully
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              These dosages as well as the current modifiers were saved under
              the "Ongoing treatment plan" section at the "Charts" tab.
            </p>
          </div>
          <DialogFooter className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsSuccessModalOpen(false);
                scrollToTop();
              }}
            >
              Dismiss
            </Button>
            <Button
              type="submit"
              onClick={() => {
                setIsSuccessModalOpen(false);
                scrollToTop();
              }}
            >
              Take me there
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
