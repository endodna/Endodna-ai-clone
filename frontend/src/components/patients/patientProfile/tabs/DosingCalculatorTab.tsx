import { useState, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useGetDosingHistory } from "@/hooks/useDoctor";
import { AlertCircle, Lock } from "lucide-react";
import { Calculator } from "../doseCalc/components/Calculator";
import { DoseSuggestions } from "../doseCalc/components/DoseSuggestions";
import { TreatmentPlan } from "../doseCalc/components/TreatmentPlan";

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
  } = useGetDosingHistory(patientId ?? "", patient?.gender || "", {
    enabled: Boolean(patientId),
  });

  useEffect(() => {
    setShowDisclaimer(true);
  }, [patientId]);

  const handleAgree = () => {
    setShowDisclaimer(false);
  };

  console.log("historyResponse", historyResponse);

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
        <Calculator patient={patient} historyData={historyResponse?.data ?? null} />
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
