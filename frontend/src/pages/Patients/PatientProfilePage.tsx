import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { PatientHeader } from "@/components/patients/patientProfile/PatientHeader";
import { TabNavigation, type TabConfig } from "@/components/patients/patientProfile/TabNavigation";
import { SummaryTab } from "@/components/patients/patientProfile/tabs/SummaryTab";
import { DnaResultsTab } from "@/components/patients/patientProfile/tabs/DnaResultsTab";
import { MedicationsTab } from "@/components/patients/patientProfile/tabs/MedicationsTab";
import { TreatmentPlanTab } from "@/components/patients/patientProfile/tabs/TreatmentPlanTab";
import { NotesTab } from "@/components/patients/patientProfile/tabs/NotesTab";

export default function PatientProfilePage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const tabs: TabConfig[] = [
    { id: "summary", label: "Summary", Content: SummaryTab },
    { id: "dna-results", label: "DNA Results", Content: DnaResultsTab },
    { id: "medications", label: "Medications", Content: MedicationsTab },
    { id: "treatment-plan", label: "Treatment Plan", Content: TreatmentPlanTab },
    { id: "notes", label: "Notes", Content: NotesTab },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <Button
          onClick={() => navigate("/dashboard/patients")}
          className="px-2 md:px-4 py-2 md:py-[11.38px]"
          variant="ghost"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-neutral-700 text-sm font-medium leading-normal">
            Back
          </span>
        </Button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-[63px]">
        <PatientHeader patientId={patientId} className="sticky top-6" />
        <TabNavigation tabs={tabs} className="flex-1" />
      </div>
    </div>
  );
}
