import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  defaultTreatmentPlanTemplateValues,
  treatmentPlanTemplateSchema,
  type TreatmentPlanTemplateFormValues,
} from "@/schemas/treatmentPlanTemplate.schema";
import type { TreatmentPlanTemplateRow } from "./templatesColumns";

interface TreatmentPlanTemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTemplate?: TreatmentPlanTemplateRow | null;
  onSubmit: (values: TreatmentPlanTemplateFormValues) => void;
}

export function TreatmentPlanTemplateFormDialog({
  open,
  onOpenChange,
  initialTemplate,
  onSubmit,
}: Readonly<TreatmentPlanTemplateFormDialogProps>) {
  const form = useForm<TreatmentPlanTemplateFormValues>({
    resolver: zodResolver(treatmentPlanTemplateSchema),
    defaultValues: defaultTreatmentPlanTemplateValues,
  });

  useEffect(() => {
    if (initialTemplate) {
      form.reset({
        ...defaultTreatmentPlanTemplateValues,
        name: initialTemplate.name,
        patientIdentificationDemographics:
          initialTemplate.patientIdentificationDemographics,
        medicalHistory: initialTemplate.medicalHistory,
        currentConditionDiagnosis: initialTemplate.currentConditionDiagnosis,
        assessmentData: initialTemplate.assessmentData,
        treatmentGoalsExpectedOutcomes:
          initialTemplate.treatmentGoalsExpectedOutcomes,
        interventionsStrategies: initialTemplate.interventionsStrategies,
        rolesResponsibilities: initialTemplate.rolesResponsibilities ?? "",
        timeline: initialTemplate.timeline ?? "",
        progressNotesEvaluation: initialTemplate.progressNotesEvaluation ?? "",
        dischargePreventionPlan:
          initialTemplate.dischargePreventionPlan ?? "",
      });
    } else {
      form.reset(defaultTreatmentPlanTemplateValues);
    }
  }, [initialTemplate, form]);

  const handleSubmit = (values: TreatmentPlanTemplateFormValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {initialTemplate ? "Edit Treatment Plan Template" : "Create Treatment Plan Template"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-6 max-h-[70vh] overflow-y-auto pr-2"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            {/* Template Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="typo-body-2 text-foreground">
                    Template name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. Male TRT – Starter"
                    />
                  </FormControl>
                  <FormMessage className="text-destructive typo-body-3" />
                </FormItem>
              )}
            />

            {/* Patient Identification and Demographics */}
            <section className="space-y-2">
              <h3 className="typo-body-2 font-semibold text-foreground">
                Patient Identification and Demographics
              </h3>
              <FormField
                control={form.control}
                name="patientIdentificationDemographics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="typo-body-3 text-foreground">
                      Details
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Include age range, gender, and any relevant demographic details this template is intended for."
                      />
                    </FormControl>
                    <FormMessage className="text-destructive typo-body-3" />
                  </FormItem>
                )}
              />
            </section>

            {/* Medical History */}
            <section className="space-y-2">
              <h3 className="typo-body-2 font-semibold text-foreground">
                Medical History
              </h3>
              <FormField
                control={form.control}
                name="medicalHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="typo-body-3 text-foreground">
                      Summary
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Outline typical medical history patterns relevant to this treatment plan."
                      />
                    </FormControl>
                    <FormMessage className="text-destructive typo-body-3" />
                  </FormItem>
                )}
              />
            </section>

            {/* Current Condition and Diagnosis */}
            <section className="space-y-2">
              <h3 className="typo-body-2 font-semibold text-foreground">
                Current Condition and Diagnosis
              </h3>
              <FormField
                control={form.control}
                name="currentConditionDiagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="typo-body-3 text-foreground">
                      Summary
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Describe the primary conditions and diagnostic criteria this template addresses."
                      />
                    </FormControl>
                    <FormMessage className="text-destructive typo-body-3" />
                  </FormItem>
                )}
              />
            </section>

            {/* Assessment Data */}
            <section className="space-y-2">
              <h3 className="typo-body-2 font-semibold text-foreground">
                Assessment Data
              </h3>
              <FormField
                control={form.control}
                name="assessmentData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="typo-body-3 text-foreground">
                      Tools and metrics
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="List recommended assessment tools, scales, and baseline measures."
                      />
                    </FormControl>
                    <FormMessage className="text-destructive typo-body-3" />
                  </FormItem>
                )}
              />
            </section>

            {/* Treatment Goals and Expected Outcomes */}
            <section className="space-y-2">
              <h3 className="typo-body-2 font-semibold text-foreground">
                Treatment Goals and Expected Outcomes
              </h3>
              <FormField
                control={form.control}
                name="treatmentGoalsExpectedOutcomes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="typo-body-3 text-foreground">
                      Goals
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Define primary and secondary treatment goals, and expected timeframes."
                      />
                    </FormControl>
                    <FormMessage className="text-destructive typo-body-3" />
                  </FormItem>
                )}
              />
            </section>

            {/* Interventions and Strategies */}
            <section className="space-y-2">
              <h3 className="typo-body-2 font-semibold text-foreground">
                Interventions and Strategies
              </h3>
              <FormField
                control={form.control}
                name="interventionsStrategies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="typo-body-3 text-foreground">
                      Plan
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Describe medication, behavioral, and lifestyle interventions."
                      />
                    </FormControl>
                    <FormMessage className="text-destructive typo-body-3" />
                  </FormItem>
                )}
              />
            </section>

            {/* Roles and Responsibilities */}
            <section className="space-y-2">
              <h3 className="typo-body-2 font-semibold text-foreground">
                Roles and Responsibilities
              </h3>
              <FormField
                control={form.control}
                name="rolesResponsibilities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="typo-body-3 text-foreground">
                      Team roles
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Outline responsibilities for physician, care team, and patient."
                      />
                    </FormControl>
                    <FormMessage className="text-destructive typo-body-3" />
                  </FormItem>
                )}
              />
            </section>

            {/* Timeline */}
            <section className="space-y-2">
              <h3 className="typo-body-2 font-semibold text-foreground">
                Timeline
              </h3>
              <FormField
                control={form.control}
                name="timeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="typo-body-3 text-foreground">
                      Key milestones
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Describe expected follow-up cadence and milestone checks."
                      />
                    </FormControl>
                    <FormMessage className="text-destructive typo-body-3" />
                  </FormItem>
                )}
              />
            </section>

            {/* Progress Notes and Evaluation */}
            <section className="space-y-2">
              <h3 className="typo-body-2 font-semibold text-foreground">
                Progress Notes and Evaluation
              </h3>
              <FormField
                control={form.control}
                name="progressNotesEvaluation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="typo-body-3 text-foreground">
                      Guidance
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Specify how progress should be documented and evaluated over time."
                      />
                    </FormControl>
                    <FormMessage className="text-destructive typo-body-3" />
                  </FormItem>
                )}
              />
            </section>

            {/* Discharge / Prevention Plan */}
            <section className="space-y-2">
              <h3 className="typo-body-2 font-semibold text-foreground">
                Discharge / Prevention Plan
              </h3>
              <FormField
                control={form.control}
                name="dischargePreventionPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="typo-body-3 text-foreground">
                      Plan
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Describe discharge criteria, relapse prevention, and follow-up recommendations."
                      />
                    </FormControl>
                    <FormMessage className="text-destructive typo-body-3" />
                  </FormItem>
                )}
              />
            </section>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="typo-body-2 rounded-lg">
                Save template
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


