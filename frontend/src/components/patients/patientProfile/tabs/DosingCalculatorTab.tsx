import { useState, useEffect, useMemo } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useGetDosingHistory, usePostDosingHistory } from "@/hooks/useDoctor";
import { AlertCircle, Lock } from "lucide-react";
import { Calculator } from "../doseCalc/components/Calculator";
import { DoseSuggestions } from "../doseCalc/components/DoseSuggestions";
import { TreatmentPlan } from "../doseCalc/components/TreatmentPlan";
import { GENDER } from "@/components/constants/patient";

interface DosingCalculatorTabProps {
  readonly patientId?: string;
  readonly patient?: PatientDetail | null;
}

export function DosingCalculatorTab({
  patientId,
  patient,
}: Readonly<DosingCalculatorTabProps>) {
  const [showDoseSuggestions, setShowDoseSuggestions] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const {
    data: historyResponse,
    isLoading,
    isError,
    error,
  } = usePostDosingHistory(patientId ?? "", patient?.gender || "", {
    enabled: Boolean(patientId),
  });

  const {
    data: getHistoryResponse,
  } = useGetDosingHistory(patientId ?? "", {
    enabled: Boolean(patientId),
  });

  // Extract supplements from the latest record in getHistoryResponse
  const latestSupplements = useMemo(() => {
    if (
      !getHistoryResponse ||
      !Array.isArray(getHistoryResponse) ||
      getHistoryResponse.length === 0
    ) {
      return [];
    }

    // Sort by createdAt (descending) to get the latest record first
    const sorted = [...getHistoryResponse].sort((a, b) => {
      const dateA = a.data?.createdAt || a.createdAt;
      const dateB = b.data?.createdAt || b.createdAt;
      if (!dateA || !dateB) return 0;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    // Get supplements from the latest record
    const latestRecord = sorted[0];
    return latestRecord?.data?.supplements || [];
  }, [getHistoryResponse]);

  // Calculate available tabs based on history data
  const tabs = useMemo(() => {
    if (
      !historyResponse?.data ||
      !Array.isArray(historyResponse.data) ||
      historyResponse.data.length === 0
    ) {
      return [];
    }

    const historyData = historyResponse.data;
    const patientGender = patient?.gender?.toUpperCase();
    const tabsList: Array<{ id: string; label: string }> = [];

    // Helper to check if suggestions exist
    const hasSuggestions = (hormoneType: "T100" | "T200" | "ESTRADIOL") => {
      return historyData.some((entry) => {
        const entryData = entry.data;
        const hormoneData = entryData[hormoneType];
        return hormoneData?.dosingSuggestions !== undefined;
      });
    };

    if (patientGender === GENDER.MALE) {
      // For male patients: Testosterone (100) & Testosterone (200)
      if (hasSuggestions("T100")) {
        tabsList.push({ id: "testosterone-t100", label: "Testosterone (100)" });
      }
      if (hasSuggestions("T200")) {
        tabsList.push({ id: "testosterone-t200", label: "Testosterone (200)" });
      }
    } else {
      // For female patients: Testosterone (100) & Estradiol
      if (hasSuggestions("T100")) {
        tabsList.push({ id: "testosterone-t100", label: "Testosterone" });
      }
      if (hasSuggestions("ESTRADIOL")) {
        tabsList.push({ id: "estradiol", label: "Estradiol" });
      }
    }

    return tabsList;
  }, [historyResponse?.data, patient?.gender]);

  // Manage active tab state
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id || "");

  // Update active tab when tabs change
  useEffect(() => {
    if (tabs.length > 0 && tabs[0]?.id && !tabs.find((t) => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  useEffect(() => {
    setShowDisclaimer(true);
  }, [patientId]);

  const handleAgree = () => {
    setShowDisclaimer(false);
  };

  console.log("=== historyResponse", historyResponse);
  console.log("=== getHistoryResponse", getHistoryResponse);

  if (isLoading) {
    return (
      <div className="rounded-lg bg-primary-foreground p-4 md:p-6">
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-primary-foreground p-4 md:p-6">
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div>
            <p className="typo-body-2 font-medium text-destructive">
              Failed to load dosing history
            </p>
            <p className="mt-1 typo-body-3 text-destructive/80">
              {error?.message ||
                "An error occurred while fetching dosing data."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg bg-primary-foreground p-4 md:p-6 space-y-4 md:space-y-6 w-full">
        <Calculator
          patient={patient}
          historyData={historyResponse?.data ?? null}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <TreatmentPlan historyData={historyResponse?.data ?? null} />

        {/* Action Buttons */}
        <div className="flex flex-row gap-3 justify-end">
          <Button variant="outline" className="w-full sm:w-auto rounded-lg">
            Update patient's lab data
          </Button>
          <Button
            variant={showDoseSuggestions ? "secondary" : "outline"}
            className={`w-full sm:w-auto rounded-lg ${showDoseSuggestions
              ? "bg-muted text-muted-foreground opacity-60"
              : ""
              }`}
            onClick={() => setShowDoseSuggestions(!showDoseSuggestions)}
          >
            <Lock className="h-4 w-4 mr-2" />
            Override & Calculate Dose
          </Button>
        </div>

        {/* Conditionally render DoseSuggestions */}
        {showDoseSuggestions && (
          <DoseSuggestions
            historyData={historyResponse?.data ?? null}
            patientId={patientId}
            activeTab={activeTab}
            patient={patient}
            latestSupplements={latestSupplements}
          />
        )}
      </div>

      {/* Clinical Judgement Disclaimer Modal */}
      <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              Clinical Judgement Disclaimer
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-foreground/70 leading-relaxed">
              This dosage calculator platform suggests dosage based on a limited
              set of clinical values. The responsibility ultimately lies with
              the practitioner to diligently conduct their own comprehensive
              assessment, and ultimately determine the most appropriate course
              of action.
            </p>
          </div>
          <DialogFooter className="flex justify-end">
            <Button type="submit" onClick={handleAgree}>
              Agreed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
