import { z } from "zod";

export const dosingCalculatorSchema = z.object({
  menstrualCycle: z.string().min(1, "Select menstrual cycle."),
  addMeds: z.string().min(1, "Select an option."),
  chronicPain: z.string().min(1, "Select an option."),
  osteopeniaHistory: z.string().min(1, "Select an option."),
  breastCancerHistory: z.string().min(1, "Select an option."),
  ovarianCancerHistory: z.string().min(1, "Select an option."),
  uterineCancerHistory: z.string().min(1, "Select an option."),
  activityLevel: z.string().min(1, "Select an activity level."),
});

export type DosingCalculatorFormValues = z.infer<typeof dosingCalculatorSchema>;

export const dosingCalculatorDefaultValues: DosingCalculatorFormValues = {
  menstrualCycle: "",
  addMeds: "",
  chronicPain: "",
  osteopeniaHistory: "",
  breastCancerHistory: "",
  ovarianCancerHistory: "",
  uterineCancerHistory: "",
  activityLevel: "",
};
