import { PatientHeader } from "@/components/patients/patientProfile/PatientHeader";
import { PatientProfileBreadcrumb } from "@/components/patients/patientProfile/PatientProfileBreadcrumb";
import { TabNavigation, type TabConfig } from "@/components/patients/patientProfile/TabNavigation";
import { DnaResultsTab } from "@/components/patients/patientProfile/tabs/DnaResultsTab";
import { MedicationsTab } from "@/components/patients/patientProfile/tabs/MedicationsTab";
import { NotesTab } from "@/components/patients/patientProfile/tabs/NotesTab";
import { SummaryTab } from "@/components/patients/patientProfile/tabs/SummaryTab";
import { TreatmentPlanTab } from "@/components/patients/patientProfile/tabs/TreatmentPlanTab";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

interface TabProps {
  patientId?: string;
}

export default function PatientProfilePage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabs: TabConfig<TabProps>[] = [
    { id: "summary", label: "Summary", Content: SummaryTab },
    { id: "dna-results", label: "DNA Results", Content: DnaResultsTab },
    { id: "medications", label: "Medications", Content: MedicationsTab },
    { id: "treatment-plan", label: "Treatment Plan", Content: TreatmentPlanTab },
    { id: "notes", label: "Notes", Content: NotesTab },
  ];
  const defaultTabId = tabs[0]?.id ?? "summary";
  const tabFromUrl = searchParams.get("tab");
  const activeTab = tabs.some((tab) => tab.id === tabFromUrl) ? (tabFromUrl as string) : defaultTabId;

  // Handle tab change by updating the search params
  const handleTabChange = (tabId: string) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      if (tabId === defaultTabId) {
        updated.delete("tab");
      } else {
        updated.set("tab", tabId);
      }
      return updated;
    }, { replace: true });
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <PatientProfileBreadcrumb onBack={() => navigate("/dashboard/patients")} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-[63px]">
        <PatientHeader patientId={patientId} className="lg:sticky lg:top-6" />
        <TabNavigation<TabProps>
          tabs={tabs}
          className="flex-1"
          value={activeTab}
          defaultValue={defaultTabId}
          onTabChange={handleTabChange}
          tabProps={{ patientId }}
        />
      </div>
    </div>
  );
}
