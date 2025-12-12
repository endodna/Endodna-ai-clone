import { GENDER } from "@/components/constants/patient";
import { setInsertionDate, type HormoneTypeKey } from "@/store/features/dosing";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { formatDate } from "@/utils/date.utils";
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { useUpdatePatientInfo } from "@/hooks/useDoctor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface KineticSlopeProps {
  patient?: PatientDetail | null;
  historyData?: PatientDosageHistoryEntry[] | null;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

interface KineticSlopeContentProps {
  patient?: PatientDetail | null;
  activeTab?: string;
}

function KineticSlopeContent({ patient, activeTab }: Readonly<KineticSlopeContentProps>) {
  const { selectedDoses, insertionDate: insertionDateFromRedux } =
    useAppSelector((state) => state.dosingCalculator);

  // Map tab ID to hormone type key
  const getHormoneTypeKey = (tabId: string): HormoneTypeKey | null => {
    switch (tabId) {
      case "testosterone-t100":
        return "testosterone_100";
      case "testosterone-t200":
        return "testosterone_200";
      case "estradiol":
        return "estradiol";
      default:
        return null;
    }
  };

  // Get the selected dose for the active tab
  const hormoneTypeKey = activeTab ? getHormoneTypeKey(activeTab) : null;
  const selectedDose = hormoneTypeKey ? selectedDoses[hormoneTypeKey] : null;
  const dispatch = useAppDispatch();
  const updatePatientInfo = useUpdatePatientInfo();
  const [isOpen, setIsOpen] = useState(false);

  // Get insertion date from patient clinicalData or Redux
  const insertionDateFromPatient =
    patient?.patientInfo?.clinicalData?.insertionDate;
  const insertionDate = insertionDateFromPatient || insertionDateFromRedux;
  const selectedDate = insertionDate ? new Date(insertionDate) : undefined;

  // Sync patient data to Redux when it changes
  useEffect(() => {
    if (insertionDateFromPatient) {
      dispatch(setInsertionDate(insertionDateFromPatient));
    }
  }, [insertionDateFromPatient, dispatch]);

  // Handle date selection
  const handleDateSelect = async (date: Date | undefined) => {
    if (!date || !patient?.id) return;

    setIsOpen(false);
    const dateISO = date.toISOString();
    dispatch(setInsertionDate(dateISO));

    // Save insertion date
    try {
      await updatePatientInfo.mutateAsync({
        patientId: patient.id,
        data: {
          clinicalData: {
            insertionDate: dateISO,
          },
        },
      });
    } catch (error) {
      console.error("Failed to save insertion date:", error);
      // Revert on error
      dispatch(setInsertionDate(insertionDateFromPatient || null));
    }
  };

  // Calculate estimated dates
  const {
    estimatedRePelletDate,
    rePelletDurationText,
    sixWeekLabDrawDate,
    twelveWeekLabDrawDate,
  } = useMemo(() => {
    if (!insertionDate) {
      return {
        estimatedPeakDate: null,
        estimatedRePelletDate: null,
        rePelletDurationText: "85 days",
        sixWeekLabDrawDate: null,
        twelveWeekLabDrawDate: null,
      };
    }

    const insertion = new Date(insertionDate);
    const peakDate = new Date(insertion);
    peakDate.setDate(peakDate.getDate() + 45);

    // Calculate 6 week and 12 week lab draw dates (6 weeks = 42 days, 12 weeks = 84 days)
    const sixWeekDate = new Date(insertion);
    sixWeekDate.setDate(sixWeekDate.getDate() + 42);

    const twelveWeekDate = new Date(insertion);
    twelveWeekDate.setDate(twelveWeekDate.getDate() + 84);

    // Calculate re-pellet date based on patient gender
    const rePelletDate = new Date(insertion);
    const patientGender = patient?.gender?.toUpperCase();

    let durationText: string;
    if (patientGender === GENDER.MALE) {
      // 5.5 months = 5 months + 15 days
      rePelletDate.setMonth(rePelletDate.getMonth() + 5);
      rePelletDate.setDate(rePelletDate.getDate() + 15);
      durationText = "5.5 months";
    } else if (patientGender === GENDER.FEMALE) {
      // 3.5 months = 3 months + 15 days
      rePelletDate.setMonth(rePelletDate.getMonth() + 3);
      rePelletDate.setDate(rePelletDate.getDate() + 15);
      durationText = "3.5 months";
    } else {
      // Default to 85 days if gender is not available
      rePelletDate.setDate(rePelletDate.getDate() + 85);
      durationText = "85 days";
    }

    return {
      estimatedPeakDate: peakDate,
      estimatedRePelletDate: rePelletDate,
      rePelletDurationText: durationText,
      sixWeekLabDrawDate: sixWeekDate,
      twelveWeekLabDrawDate: twelveWeekDate,
    };
  }, [insertionDate, patient?.gender]);

  return (
    <div className="space-y-1">
      {/* Dose Information */}
      <div className="flex items-center justify-between border-b border-muted-foreground/30 pb-1">
        <p className="typo-body-2 typo-body-2-regular text-foreground">Dose:</p>
        {selectedDose ? (
          <p className="typo-body-2 typo-body-2-regular text-foreground">
            {Number(selectedDose.dosageMg).toFixed(2)} mg
          </p>
        ) : (
          <p className="typo-body-2 typo-body-2-regular text-muted-foreground">
            No dose selected
          </p>
        )}
      </div>

      {/* Insertion Date */}
      <div className="flex items-center justify-between border-b border-muted-foreground/30 pb-1">
        <p className="typo-body-2 typo-body-2-regular text-foreground">
          Insertion Date:
        </p>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-auto p-0 hover:bg-transparent",
                !insertionDate && "text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-1.5">
                {insertionDate ? (
                  <p className="typo-body-2 typo-body-2-regular text-foreground">
                    {formatDate(insertionDate, "MM / DD / YYYY")}
                  </p>
                ) : (
                  <p className="typo-body-2 typo-body-2-regular text-muted-foreground">
                    dd / mm / aaaa
                  </p>
                )}
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* 6 Week Lab Draw */}
      <div className="flex items-center justify-between border-b border-muted-foreground/30 pb-1">
        <p className="typo-body-2 typo-body-2-regular text-foreground">
          6 Week Lab Draw:
        </p>
        {sixWeekLabDrawDate ? (
          <p className="typo-body-2 typo-body-2-regular text-foreground">
            {formatDate(sixWeekLabDrawDate, "MM / DD / YYYY")}
          </p>
        ) : (
          <p className="typo-body-2 typo-body-2-regular text-muted-foreground">
            dd / mm / aaaa
          </p>
        )}
      </div>

      {/* 12 Week Lab Draw */}
      <div className="flex items-center justify-between border-b border-muted-foreground/30 pb-1">
        <p className="typo-body-2 typo-body-2-regular text-foreground">
          12 Week Lab Draw:
        </p>
        {twelveWeekLabDrawDate ? (
          <p className="typo-body-2 typo-body-2-regular text-foreground">
            {formatDate(twelveWeekLabDrawDate, "MM / DD / YYYY")}
          </p>
        ) : (
          <p className="typo-body-2 typo-body-2-regular text-muted-foreground">
            dd / mm / aaaa
          </p>
        )}
      </div>

      {/* Estimated Peak */}
      {/* <div className="flex items-center justify-between border-b border-muted-foreground/30 pb-1">
                <p className="typo-body-2 typo-body-2-regular text-foreground">
                    Estimated Peak:
                </p>
                {estimatedPeakDate ? (
                    <p className="typo-body-2 typo-body-2-regular text-foreground">
                        45 days – {formatDate(estimatedPeakDate, "MM / DD / YYYY")}
                    </p>
                ) : (
                    <p className="typo-body-2 typo-body-2-regular text-foreground">
                        45 days – dd / mm / aaaa
                    </p>
                )}
            </div> */}

      {/* Estimated Re-pellet */}
      <div className="flex items-center justify-between border-b border-muted-foreground/30 pb-1">
        <p className="typo-body-2 typo-body-2-regular text-foreground">
          Estimated Re-pellet:
        </p>
        {estimatedRePelletDate && twelveWeekLabDrawDate ? (
          <p className="typo-body-2 typo-body-2-regular text-foreground">
            {rePelletDurationText} –{" "}
            {formatDate(estimatedRePelletDate, "MM / DD / YYYY")}
          </p>
        ) : (
          <p className="typo-body-2 typo-body-2-regular text-foreground">
            Available after 12 week lab draw
          </p>
        )}
      </div>
    </div>
  );
}

export function KineticSlope({ patient, historyData, activeTab: activeTabProp, onTabChange }: Readonly<KineticSlopeProps>) {
  // Calculate available suggestions from historyData
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
      ): { base: Record<string, { dosageMg: number; pelletsCount: number }> | null; modified: Record<string, { dosageMg: number; pelletsCount: number }> | null } => {
        if (!dosingSuggestions) {
          return { base: null, modified: null };
        }

        const baseResult: Record<string, { dosageMg: number; pelletsCount: number }> = {};
        const modifiedResult: Record<string, { dosageMg: number; pelletsCount: number }> = {};

        const TIER_ORDER = [
          "conservative",
          "standard",
          "aggressive",
          "high_performance",
        ];

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
        existing: { base: Record<string, { dosageMg: number; pelletsCount: number }> | null; modified: Record<string, { dosageMg: number; pelletsCount: number }> | null } | null,
        newSuggestions: { base: Record<string, { dosageMg: number; pelletsCount: number }> | null; modified: Record<string, { dosageMg: number; pelletsCount: number }> | null }
      ): { base: Record<string, { dosageMg: number; pelletsCount: number }> | null; modified: Record<string, { dosageMg: number; pelletsCount: number }> | null } => {
        if (!existing) {
          return newSuggestions;
        }

        const mergedBase: Record<string, { dosageMg: number; pelletsCount: number }> = {
          ...(existing.base || {}),
          ...(newSuggestions.base || {}),
        };

        const mergedModified: Record<string, { dosageMg: number; pelletsCount: number }> = {
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
      let t100Suggestions: { base: Record<string, { dosageMg: number; pelletsCount: number }> | null; modified: Record<string, { dosageMg: number; pelletsCount: number }> | null } | null = null;
      let t200Suggestions: { base: Record<string, { dosageMg: number; pelletsCount: number }> | null; modified: Record<string, { dosageMg: number; pelletsCount: number }> | null } | null = null;
      let estradiolSuggestions: { base: Record<string, { dosageMg: number; pelletsCount: number }> | null; modified: Record<string, { dosageMg: number; pelletsCount: number }> | null } | null = null;

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

  // Check which suggestions are available
  const hasT100Suggestions =
    t100Suggestions && (t100Suggestions.base || t100Suggestions.modified);
  const hasT200Suggestions =
    t200Suggestions && (t200Suggestions.base || t200Suggestions.modified);
  const hasEstradiolSuggestions =
    estradiolSuggestions &&
    (estradiolSuggestions.base || estradiolSuggestions.modified);

  // Determine tabs based on patient gender and available suggestions
  const tabs = useMemo(() => {
    const patientGender = patient?.gender?.toUpperCase();
    const tabsList: Array<{ id: string; label: string }> = [];

    if (patientGender === GENDER.MALE) {
      // For male patients: Testosterone (100) & Testosterone (200)
      if (hasT100Suggestions) {
        tabsList.push({ id: "testosterone-t100", label: "Testosterone (100)" });
      }
      if (hasT200Suggestions) {
        tabsList.push({ id: "testosterone-t200", label: "Testosterone (200)" });
      }
    } else {
      // For female patients: Testosterone (100) & Estradiol
      if (hasT100Suggestions) {
        tabsList.push({ id: "testosterone-t100", label: "Testosterone" });
      }
      if (hasEstradiolSuggestions) {
        tabsList.push({ id: "estradiol", label: "Estradiol" });
      }
    }

    return tabsList;
  }, [patient?.gender, hasT100Suggestions, hasT200Suggestions, hasEstradiolSuggestions]);

  // Use activeTab from props if provided, otherwise manage internally
  const [internalActiveTab, setInternalActiveTab] = useState<string>(tabs[0]?.id || "");
  const activeTab = activeTabProp !== undefined ? activeTabProp : internalActiveTab;

  // Update internal active tab when tabs change (only if not controlled by parent)
  useEffect(() => {
    if (activeTabProp === undefined && tabs.length > 0 && tabs[0]?.id) {
      setInternalActiveTab(tabs[0].id);
    }
  }, [tabs, activeTabProp]);

  const handleTabChange = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalActiveTab(tabId);
    }
  };

  return (
    <div className="max-w-[490px] w-full">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <p className="typo-body-1 text-foreground">Kinetic Slope</p>
          <TabsList className="bg-muted-foreground/10 h-auto p-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="typo-body-2 text-foreground rounded-[10px] px-3 py-1"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-0">
            <KineticSlopeContent patient={patient} activeTab={tab.id} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
