import { PatientHeader } from "@/components/patients/patientProfile/PatientHeader";
import { PatientProfileBreadcrumb } from "@/components/patients/patientProfile/PatientProfileBreadcrumb";
import { TabNavigation, type TabConfig } from "@/components/patients/patientProfile/TabNavigation";
import { DnaResultsTab } from "@/components/patients/patientProfile/tabs/DnaResultsTab";
import { MedicationsTab } from "@/components/patients/patientProfile/tabs/MedicationsTab";
import { NotesTab } from "@/components/patients/patientProfile/tabs/NotesTab";
import { SummaryTab } from "@/components/patients/patientProfile/tabs/SummaryTab";
import { TreatmentPlanTab } from "@/components/patients/patientProfile/tabs/TreatmentPlanTab";
import { useNavigate, useParams } from "react-router-dom";

interface TabProps {
  patientId?: string;
}

export default function PatientProfilePage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const tabs: TabConfig<TabProps>[] = [
    { id: "summary", label: "Summary", Content: SummaryTab },
    { id: "dna-results", label: "DNA Results", Content: DnaResultsTab },
    { id: "medications", label: "Medications", Content: MedicationsTab },
    { id: "treatment-plan", label: "Treatment Plan", Content: TreatmentPlanTab },
    { id: "notes", label: "Notes", Content: NotesTab },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <PatientProfileBreadcrumb onBack={() => navigate("/dashboard/patients")} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-[63px]">
        <PatientHeader patientId={patientId} className="lg:sticky lg:top-6" />
        <TabNavigation<TabProps> tabs={tabs} className="flex-1" tabProps={{ patientId }} />
      </div>
    </div>
  );
}
