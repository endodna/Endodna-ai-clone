import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FilePlus } from "lucide-react";
import {
  TreatmentPlanTemplatesTable,
} from "@/components/treatment-plans/TreatmentPlanTemplatesTable";
import type { TreatmentPlanTemplateRow } from "@/components/treatment-plans/templatesColumns";
import { TreatmentPlanTemplateFormDialog } from "@/components/treatment-plans/TreatmentPlanTemplateFormDialog";
import type { TreatmentPlanTemplateFormValues } from "@/schemas/treatmentPlanTemplate.schema";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MOCK_TEMPLATES: TreatmentPlanTemplateRow[] = [
  {
    id: "tpl-1",
    name: "Male TRT – Starter",
    lastUpdated: "11/30/2025",
    createdBy: "Dr. Sam Ade",
    patientIdentificationDemographics: "Adult male patients with confirmed hypogonadism.",
    medicalHistory: "History of low testosterone, stable cardiovascular status.",
    currentConditionDiagnosis: "Primary hypogonadism confirmed by labs.",
    assessmentData: "Baseline testosterone, SHBG, estradiol, CBC, PSA.",
    treatmentGoalsExpectedOutcomes: "Improve energy, mood, and libido within 3 months.",
    interventionsStrategies: "Testosterone pellet therapy with lifestyle counseling.",
    rolesResponsibilities: "Physician manages dosing; patient reports symptoms.",
    timeline: "Follow-up at 6 weeks, then every 3–6 months.",
    progressNotesEvaluation: "Document symptom changes and lab trends.",
    dischargePreventionPlan: "Taper off therapy if contraindications emerge.",
  },
  {
    id: "tpl-2",
    name: "Female Estradiol – Maintenance",
    lastUpdated: "11/28/2025",
    createdBy: "Dr. Dana O'Kon",
    patientIdentificationDemographics: "Perimenopausal or postmenopausal female patients.",
    medicalHistory: "Vasomotor symptoms, sleep disturbance, mood changes.",
    currentConditionDiagnosis: "Menopausal symptoms affecting quality of life.",
    assessmentData: "Baseline estradiol, FSH, symptom severity scales.",
    treatmentGoalsExpectedOutcomes: "Reduce hot flashes and improve sleep within 8 weeks.",
    interventionsStrategies: "Estradiol pellet therapy with lifestyle modifications.",
    rolesResponsibilities: "Physician adjusts dosing; patient tracks symptoms.",
    timeline: "Reassess at 8–12 weeks and adjust dosing as needed.",
    progressNotesEvaluation: "Use standardized symptom scores each visit.",
    dischargePreventionPlan: "Plan for long-term monitoring and tapering strategy.",
  },
];

export default function TreatmentPlanTemplatesPage() {
  const [searchText, setSearchText] = useState("");
  const [templates, setTemplates] = useState<TreatmentPlanTemplateRow[]>(
    MOCK_TEMPLATES,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<TreatmentPlanTemplateRow | null>(null);
  const [templateToDelete, setTemplateToDelete] =
    useState<TreatmentPlanTemplateRow | null>(null);

  const filteredTemplates = useMemo(() => {
    if (!searchText.trim()) return templates;
    const needle = searchText.toLowerCase();
    return templates.filter(
      (tpl) =>
        tpl.name.toLowerCase().includes(needle) ||
        tpl.createdBy.toLowerCase().includes(needle),
    );
  }, [templates, searchText]);

  const handleCreateClick = () => {
    setEditingTemplate(null);
    setIsFormOpen(true);
  };

  const handleEditTemplate = (template: TreatmentPlanTemplateRow) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  const handleDeleteTemplate = (template: TreatmentPlanTemplateRow) => {
    setTemplateToDelete(template);
  };

  const confirmDeleteTemplate = () => {
    if (!templateToDelete) return;
    setTemplates((prev) => prev.filter((tpl) => tpl.id !== templateToDelete.id));
    setTemplateToDelete(null);
    toast.success("Treatment plan deleted successfully");
  };

  const handleFormSubmit = (values: TreatmentPlanTemplateFormValues) => {
    if (editingTemplate) {
      // Update existing template
      setTemplates((prev) =>
        prev.map((tpl) =>
          tpl.id === editingTemplate.id
            ? {
                ...tpl,
                ...values,
                lastUpdated: new Date().toLocaleDateString(),
              }
            : tpl,
        ),
      );
      toast.success("Treatment plan updated successfully");
    } else {
      // Create new template
      const newTemplate: TreatmentPlanTemplateRow = {
        id: `tpl-${Date.now()}`,
        createdBy: "You",
        lastUpdated: new Date().toLocaleDateString(),
        ...values,
      };
      setTemplates((prev) => [newTemplate, ...prev]);
      toast.success("Treatment plan created successfully");
    }

    setIsFormOpen(false);
    setEditingTemplate(null);
  };

  return (
    <div className="space-y-6 flex flex-col h-full w-full">
      {/* Title and add new template button */}
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Treatment Plan Templates</h1>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleCreateClick}
            className="typo-body-2 rounded-lg"
          >
            <FilePlus className="w-4 h-4" />
            Create New Treatment Plan
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap bg-primary-foreground p-2 rounded-2xl">
        <div className="flex-1 min-w-60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
            <Input
              placeholder="Search templates"
              className="pl-9 max-w-[240px] w-full"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Templates table */}
      <TreatmentPlanTemplatesTable
        data={filteredTemplates}
        isLoading={false}
        error={null}
        isRefetching={false}
        pagination={null}
        onEditTemplate={handleEditTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />

      <TreatmentPlanTemplateFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingTemplate(null);
          }
        }}
        initialTemplate={editingTemplate}
        onSubmit={handleFormSubmit}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!templateToDelete}
        onOpenChange={(open) => {
          if (!open) setTemplateToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete treatment plan template
            </AlertDialogTitle>
          </AlertDialogHeader>
          <p className="typo-body-2 text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              {templateToDelete?.name}
            </span>{" "}
            ? This action cannot be undone.
          </p>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-primary-foreground hover:bg-destructive/90"
              onClick={confirmDeleteTemplate}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


