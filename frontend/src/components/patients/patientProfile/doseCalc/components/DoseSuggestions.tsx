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
import {
  setSelectedDoseForHormone,
  type HormoneTypeKey,
} from "@/store/features/dosing";
import { Pencil, Eye, EyeClosed, Plus, Minus, Sparkles } from "lucide-react";
import { useSaveDosingCalculation } from "@/hooks/useDoctor";
import { GENDER } from "@/components/constants/patient";

interface DoseSuggestionsProps {
  historyData?: PatientDosageHistoryEntry[] | null;
  patientId?: string;
  activeTab?: string;
  patient?: PatientDetail | null;
  latestSupplements?: Array<{
    drugName?: string;
    dosage?: string;
    unit?: string;
    frequency?: string;
    purpose?: string;
    isSuggested?: boolean;
  }>;
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
  isChecked: boolean;
  onToggleCheck: () => void;
}

interface HormoneSummaryRowProps {
  title: string;
  selectedDose: {
    tier: string;
    tierType: "base" | "modified";
    dosageMg: number;
  };
  onEdit: () => void;
  isChecked: boolean;
  onToggleCheck: () => void;
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
  isSuggested?: boolean;
  unit?: string;
  purpose?: string;
}

// API Supplement structure from backend
interface ApiSupplement {
  name: string;
  dose: string;
  unit?: string;
  frequency?: string;
  timing?: string;
  purpose?: string;
  isCore?: boolean;
  brand?: string;
  benefits?: string;
  allergenDietaryStatus?: string;
  directions?: string;
  rationale?: string;
  contraindications?: string;
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
  isChecked,
  onToggleCheck,
}: Readonly<HormoneSummaryRowProps>) {
  const tierLabel = TIER_LABELS[selectedDose.tier] || selectedDose.tier;
  const tierTypeLabel =
    selectedDose.tierType === "base" ? "Base Tier" : "Modified Tier";

  return (
    <div className="flex items-center justify-between py-3 border-b border-muted-foreground/30">
      <div className="flex items-center gap-3 flex-1">
        <Checkbox
          checked={isChecked}
          onCheckedChange={onToggleCheck}
          className="rounded"
        />
        <span className="typo-body-2 text-foreground capitalize">{title}</span>
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
  hormoneTypeKey,
  isEditMode,
  onToggleEditMode,
  onSelectTier,
  isChecked,
  onToggleCheck,
}: Readonly<HormoneSectionProps>) {
  const { selectedDoses } = useAppSelector((state) => state.dosingCalculator);
  const hasBaseTiers =
    suggestions.base && Object.keys(suggestions.base).length > 0;
  const hasModifiedTiers =
    suggestions.modified && Object.keys(suggestions.modified).length > 0;

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
          isChecked={isChecked}
          onToggleCheck={onToggleCheck}
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

export function DoseSuggestions({
  historyData,
  patientId,
  activeTab,
  patient,
  latestSupplements,
}: Readonly<DoseSuggestionsProps>) {
  const dispatch = useAppDispatch();
  const { selectedDoses } = useAppSelector((state) => state.dosingCalculator);
  const saveDosingMutation = useSaveDosingCalculation();
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
  const [checkedHormones, setCheckedHormones] = useState<Set<string>>(
    new Set()
  );
  const [checkedSupplements, setCheckedSupplements] = useState<Set<string>>(
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

  const { t100Suggestions, t200Suggestions, estradiolSuggestions } =
    useMemo(() => {
      if (
        !historyData ||
        !Array.isArray(historyData) ||
        historyData.length === 0
      ) {
        return {
          t100Suggestions: null,
          t200Suggestions: null,
          estradiolSuggestions: null,
        };
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
          modified:
            Object.keys(mergedModified).length > 0 ? mergedModified : null,
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
          const t100EntrySuggestions = extractSuggestions(
            entryData.T100.dosingSuggestions
          );
          t100Suggestions = mergeSuggestions(
            t100Suggestions,
            t100EntrySuggestions
          );
        }

        // Extract T200 suggestions separately
        if (entryData.T200?.dosingSuggestions) {
          const t200EntrySuggestions = extractSuggestions(
            entryData.T200.dosingSuggestions
          );
          t200Suggestions = mergeSuggestions(
            t200Suggestions,
            t200EntrySuggestions
          );
        }

        // Extract estradiol suggestions
        if (entryData.ESTRADIOL?.dosingSuggestions) {
          const estradiolEntrySuggestions = extractSuggestions(
            entryData.ESTRADIOL.dosingSuggestions
          );
          estradiolSuggestions = mergeSuggestions(
            estradiolSuggestions,
            estradiolEntrySuggestions
          );
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
          dispatch(
            setSelectedDoseForHormone({ key: hormoneTypeKey, dose: null })
          );
        }
        return;
      }

      // Set default if no selection exists for this hormone type
      if (!selectedDoses[hormoneTypeKey]) {
        const suggestionsToUse = suggestions.base || suggestions.modified;
        if (!suggestionsToUse) return;

        const tierType: "base" | "modified" = suggestions.base
          ? "base"
          : "modified";

        // Default to conservative tier (first in TIER_ORDER)
        const conservativeTier = TIER_ORDER.find(
          (tier) => suggestionsToUse[tier]
        );
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
  }, [
    t100Suggestions,
    t200Suggestions,
    estradiolSuggestions,
    selectedDoses,
    dispatch,
  ]);

  // Collect suggestions from historyData and set them in supplements state
  useEffect(() => {
    if (
      !historyData ||
      !Array.isArray(historyData) ||
      historyData.length === 0
    ) {
      return;
    }

    const collectedSuggestions: Supplement[] = [];

    // Helper function to extract suggestions from a hormone type
    const extractSupplementsFromHormone = (
      entry: PatientDosageHistoryEntry,
      hormoneType: "T100" | "T200" | "ESTRADIOL",
      hormoneTypeKey: HormoneTypeKey
    ) => {
      const entryData = entry.data;
      const hormoneData = entryData[hormoneType];

      if (!hormoneData?.dosingSuggestions) return;

      const dosingSuggestions = hormoneData.dosingSuggestions as Record<
        string,
        {
          clinicalRecommendations?: {
            supplements?: ApiSupplement[];
          };
        }
      >;

      // Get the selected tier for this hormone type
      const selectedDose = selectedDoses[hormoneTypeKey];
      if (selectedDose?.tier) {
        const tierData = dosingSuggestions[selectedDose.tier];
        if (
          tierData?.clinicalRecommendations?.supplements &&
          Array.isArray(tierData.clinicalRecommendations.supplements)
        ) {
          // Map API supplements to frontend Supplement objects
          tierData.clinicalRecommendations.supplements.forEach((supplement) => {
            if (
              typeof supplement === "object" &&
              supplement !== null &&
              "name" in supplement
            ) {
              const apiSupplement = supplement as ApiSupplement;

              console.log("apiSupplement---------", apiSupplement);

              collectedSuggestions.push({
                id: `${entry.id}-${hormoneType}-${selectedDose.tier}-${Date.now()}-${Math.random()}`,
                // @ts-ignore
                productName: apiSupplement.name || apiSupplement.drugName || "",
                brand: apiSupplement.brand || "",
                dosage: apiSupplement.dose || "",
                benefits: apiSupplement.benefits || "",
                allergenDietaryStatus:
                  apiSupplement.allergenDietaryStatus ||
                  "Contains soy, gluten & dairy",
                directions: apiSupplement.directions || "",
                rationale: apiSupplement.rationale || "",
                contraindications: apiSupplement.contraindications || "",
                quantity: 1,
                unit: apiSupplement.unit || "mg",
                type: "Tablets",
                frequency: apiSupplement.frequency || "Once Daily",
                durationInDays: 30,
                isSuggested: true,
                purpose: apiSupplement.purpose || "",
              });
            }
          });
        }
      }
    };

    console.log("historyData---------", historyData);
    // Loop through all historyData entries
    for (const entry of historyData) {
      // Extract suggestions from T100
      extractSupplementsFromHormone(entry, "T100", "testosterone_100");

      // Extract suggestions from T200
      extractSupplementsFromHormone(entry, "T200", "testosterone_200");

      // Extract suggestions from ESTRADIOL
      extractSupplementsFromHormone(entry, "ESTRADIOL", "estradiol");
    }

    // Set collected suggestions in supplements state
    if (collectedSuggestions.length > 0) {
      setSupplements(collectedSuggestions);
    }
  }, [historyData, selectedDoses]);

  // Initialize checked states when hormones/supplements become available
  useEffect(() => {
    const newCheckedHormones = new Set<string>();
    const newCheckedSupplements = new Set<string>();

    // Initialize checked hormones
    if (selectedDoses.testosterone_100) {
      newCheckedHormones.add("testosterone_100");
    }
    if (selectedDoses.testosterone_200) {
      newCheckedHormones.add("testosterone_200");
    }
    if (selectedDoses.estradiol) {
      newCheckedHormones.add("estradiol");
    }

    // Initialize checked supplements (all supplements checked by default)
    supplements.forEach((supplement) => {
      newCheckedSupplements.add(supplement.id);
    });

    setCheckedHormones(newCheckedHormones);
    setCheckedSupplements(newCheckedSupplements);
  }, [selectedDoses, supplements]);

  // Sync activeTab with checkedHormones for male patients
  useEffect(() => {
    const patientGender = patient?.gender?.toUpperCase();

    // Only apply this logic for male patients
    if (patientGender !== GENDER.MALE || !activeTab) {
      return;
    }

    // Update checkedHormones based on activeTab
    setCheckedHormones((prevCheckedHormones) => {
      const newCheckedHormones = new Set(prevCheckedHormones);

      if (activeTab === "testosterone-t100") {
        // Check Testosterone (100) and uncheck Testosterone (200)
        newCheckedHormones.add("testosterone_100");
        newCheckedHormones.delete("testosterone_200");
      } else if (activeTab === "testosterone-t200") {
        // Check Testosterone (200) and uncheck Testosterone (100)
        newCheckedHormones.add("testosterone_200");
        newCheckedHormones.delete("testosterone_100");
      }

      return newCheckedHormones;
    });
  }, [activeTab, patient?.gender]);

  const hasSuggestions =
    (t100Suggestions && (t100Suggestions.base || t100Suggestions.modified)) ||
    (t200Suggestions && (t200Suggestions.base || t200Suggestions.modified)) ||
    (estradiolSuggestions &&
      (estradiolSuggestions.base || estradiolSuggestions.modified));

  // Helper function to reset supplement form to default values
  const resetSupplementForm = () => {
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
  };

  const handleOpenAddSupplement = () => {
    resetSupplementForm();
    setIsAddSupplementOpen(true);
  };

  const handleSaveSupplement = () => {
    if (!supplementForm.productName.trim()) {
      return; // Don't save if product name is empty
    }

    const updatedSupplement: Omit<Supplement, "id"> = {
      ...supplementForm,
      // isSuggested: true,
    };

    if (editingSupplementId) {
      // Update existing supplement
      setSupplements(
        supplements.map((s) =>
          s.id === editingSupplementId ? { ...updatedSupplement, id: s.id } : s
        )
      );
    } else {
      // Add new supplement
      const newSupplementId = Date.now().toString();
      setSupplements([
        ...supplements,
        { ...updatedSupplement, id: newSupplementId, isSuggested: false },
      ]);
      // Automatically check newly added supplements
      const newSet = new Set(checkedSupplements);
      newSet.add(newSupplementId);
      setCheckedSupplements(newSet);
    }

    // Reset form and close dialog
    resetSupplementForm();
    setIsAddSupplementOpen(false);
  };

  const handleCancelSupplement = () => {
    // Reset form and close dialog without saving
    resetSupplementForm();
    setIsAddSupplementOpen(false);
  };

  const getDosageDisplay = (supplement: Supplement) => {
    if (supplement.dosage && supplement.dosage !== "Dosage Value") {
      return `${supplement.dosage} ${supplement.unit || "mg"} ${supplement.frequency || "Once Daily"}`;
    }
    return "";
  };

  const handleSaveDosages = async () => {
    if (!patientId) {
      console.error("Patient ID is required to save dosages");
      return;
    }

    // Build the request payload
    const payload: SaveDosingCalculationRequest = {
      isOverridden: true,
    };

    // API requires selecting only one of T100 or T200
    // Prioritize T200 if both are checked, otherwise use the one that is checked
    const hasT100 =
      selectedDoses.testosterone_100 && checkedHormones.has("testosterone_100");
    const hasT200 =
      selectedDoses.testosterone_200 && checkedHormones.has("testosterone_200");

    if (hasT200 && selectedDoses.testosterone_200) {
      // Prioritize T200 if it's checked
      payload.T200 = {
        tier: selectedDoses.testosterone_200.tier as DosageTier,
      };
    } else if (hasT100 && selectedDoses.testosterone_100) {
      // Use T100 only if T200 is not checked
      payload.T100 = {
        tier: selectedDoses.testosterone_100.tier as DosageTier,
      };
    }

    // Add ESTRADIOL tier if selected and checked
    if (selectedDoses.estradiol && checkedHormones.has("estradiol")) {
      payload.ESTRADIOL = {
        tier: selectedDoses.estradiol.tier as DosageTier,
      };
    }

    // Add checked supplements
    const checkedSupplementList = supplements
      .filter((supplement) => checkedSupplements.has(supplement.id))
      .map((supplement) => {
        // Ensure purpose is always provided - prioritize purpose, then benefits, then rationale, then productName
        const purpose =
          supplement.purpose ||
          supplement.benefits ||
          supplement.rationale ||
          supplement.productName ||
          "Supplement";

        return {
          drugName: supplement.productName,
          dosage: supplement.dosage || "",
          unit: supplement.unit || "mg",
          frequency: supplement.frequency || "Once Daily",
          purpose: purpose,
          isSuggested: supplement.isSuggested ?? false,
        };
      });

    if (checkedSupplementList.length > 0) {
      payload.supplements = checkedSupplementList;
    }

    try {
      const response = await saveDosingMutation.mutateAsync({
        patientId,
        data: payload,
      });

      if (!response.error) {
        setIsSuccessModalOpen(true);
      } else {
        console.error("Failed to save dosages:", response.message);
        // You might want to show an error toast here
      }
    } catch (error) {
      console.error("Error saving dosages:", error);
      // You might want to show an error toast here
    }
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
            isChecked={checkedHormones.has("testosterone_100")}
            onToggleCheck={() => {
              const newSet = new Set(checkedHormones);
              if (newSet.has("testosterone_100")) {
                newSet.delete("testosterone_100");
              } else {
                newSet.add("testosterone_100");
              }
              setCheckedHormones(newSet);
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
            isChecked={checkedHormones.has("testosterone_200")}
            onToggleCheck={() => {
              const newSet = new Set(checkedHormones);
              if (newSet.has("testosterone_200")) {
                newSet.delete("testosterone_200");
              } else {
                newSet.add("testosterone_200");
              }
              setCheckedHormones(newSet);
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
            isChecked={checkedHormones.has("estradiol")}
            onToggleCheck={() => {
              const newSet = new Set(checkedHormones);
              if (newSet.has("estradiol")) {
                newSet.delete("estradiol");
              } else {
                newSet.add("estradiol");
              }
              setCheckedHormones(newSet);
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
                    <Checkbox
                      checked={checkedSupplements.has(supplement.id)}
                      onCheckedChange={() => {
                        const newSet = new Set(checkedSupplements);
                        if (newSet.has(supplement.id)) {
                          newSet.delete(supplement.id);
                        } else {
                          newSet.add(supplement.id);
                        }
                        setCheckedSupplements(newSet);
                      }}
                      className="rounded"
                    />
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
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          Contraindications
                        </label>
                        <p className="text-sm text-foreground/60 mt-1">
                          {supplement.contraindications ||
                            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin enim enim, fringilla vel nisi et, tempor venenatis turpis. Aenean tincidunt faucibus velit, vitae fringilla ipsum congue vitae. Sed ut turpis viverra, auctor arcu et, pellentesque lorem. Duis luctus quam dui, luctus laoreet libero mattis eu."}
                        </p>
                      </div>
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
          onClick={handleOpenAddSupplement}
        >
          Add Supplement
        </Button>
        <Button
          type="submit"
          className="px-4 py-[7.5px] space-x-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSaveDosages}
          disabled={saveDosingMutation.isPending || !patientId}
        >
          {saveDosingMutation.isPending ? "Saving..." : "Save dosages"}
        </Button>
      </div>

      {/* Add Supplement Modal */}
      <Dialog
        open={isAddSupplementOpen}
        onOpenChange={(open) => {
          setIsAddSupplementOpen(open);
          if (!open) {
            // Reset form when dialog is closed
            resetSupplementForm();
          }
        }}
      >
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
