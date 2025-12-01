import { z } from "zod";

// Clinical data schema (optional fields for lab values)
const clinicalDataSchema = z.object({
  shbgLevel: z.number().optional(),
  baselineTotalTestosterone: z.number().optional(),
  baselineFreeTestosterone: z.number().optional(),
  postInsertionTotalTestosterone: z.number().optional(),
  insertionDate: z.string().optional(),
  baselineEstradiol: z.number().optional(),
  postInsertionEstradiol: z.number().optional(),
  vitaminDLevel: z.number().optional(),
  hematocrit: z.number().optional(),
  currentPSA: z.number().optional(),
  previousPSA: z.number().optional(),
  monthsBetweenPSA: z.number().optional(),
  prostateSymptomsIpss: z.number().optional(),
  fshLevel: z.number().optional(),
  symptomSeverity: z.number().optional(),
}).optional();

// Lifestyle data schema
const lifestyleDataSchema = z.object({
  smokingStatus: z.enum(["never", "former", "current"]).optional(),
  exerciseLevel: z.enum(["sedentary", "light", "moderate", "vigorous"]).optional(),
}).optional();

// Medications data schema
const medicationsDataSchema = z.object({
  opiods: z.boolean().optional(),
  opiodsList: z.array(z.string()).optional(),
  adhdStimulants: z.boolean().optional(),
  adhdStimulantsList: z.array(z.string()).optional(),
  otherMedicationsList: z.array(z.string()).optional(),
}).optional();

export const dosingCalculatorSchema = z.object({
  // Medical History fields
  menstrualCycle: z.string().min(1, "Select menstrual cycle."),
  addMeds: z.string().min(1, "Select an option."),
  chronicPain: z.string().min(1, "Select an option."),
  osteopeniaHistory: z.string().min(1, "Select an option."),
  breastCancerHistory: z.string().min(1, "Select an option."),
  ovarianCancerHistory: z.string().min(1, "Select an option."),
  uterineCancerHistory: z.string().min(1, "Select an option."),
  activityLevel: z.string().min(1, "Select an activity level."),
  // Pellet type for testosterone (only needed for male patients)
  pelletType: z.enum(["T100", "T200"]).optional(),
  // Clinical data (optional - can be added later)
  clinicalData: clinicalDataSchema,
  // Lifestyle data (mapped from activityLevel)
  lifestyleData: lifestyleDataSchema,
  // Medications data (mapped from form fields)
  medicationsData: medicationsDataSchema,
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
  pelletType: undefined,
  clinicalData: undefined,
  lifestyleData: undefined,
  medicationsData: undefined,
};
