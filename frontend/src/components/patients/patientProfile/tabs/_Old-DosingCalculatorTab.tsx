import { useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    AlertTriangle,
    Bike,
    ChevronDown,
    FlaskConical,
    Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DataTable } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import {
    dosingCalculatorSchema,
    dosingCalculatorDefaultValues,
    type DosingCalculatorFormValues,
} from "@/schemas/dosingCalculator";
import { getHistoryColumns, HistoryEntry } from "../../getHistoryColumns";
import {
    useUpdatePatientInfo,
    useCalculateTestosteroneDosing,
    useCalculateEstradiolDosing,
    useSaveDosingCalculation,
    useGetDosingHistory,
} from "@/hooks/useDoctor";
import { toast } from "sonner";

const LAST_UPDATED = "12 / 22 / 2025";
const MENSTRUAL_OPTIONS = [
    "Regular 26-32 days",
    "Irregular / PCOS",
    "Perimenopausal",
    "Postmenopausal",
];

const MEDICAL_HISTORY_FIELDS = [
    { name: "addMeds", label: "Currently taking ADD meds (Adderall, Concerta, Vyvanse etc.)?*" },
    { name: "osteopeniaHistory", label: "Personal History of Osteopenia/Osteoporosis?*" },
    { name: "chronicPain", label: "Chronic Pain Patient?*" },
    { name: "breastCancerHistory", label: "Personal Breast Cancer History?*" },
    { name: "ovarianCancerHistory", label: "Personal Ovarian Cancer History?*" },
    { name: "uterineCancerHistory", label: "Personal Uterine Cancer History?*" },
] as const satisfies Array<{ name: keyof DosingCalculatorFormValues; label: string }>;

const RESULT_VARIANTS = [
    { id: "conservative", label: "Conservative", tier: "conservative" },
    { id: "standard", label: "Standard", tier: "standard" },
    { id: "aggressive", label: "Aggressive", tier: "aggressive" },
    { id: "performance", label: "High-Performance", tier: "high_performance" },
] as const;

interface DosingCalculatorTabProps {
    patientId?: string;
    patient?: PatientDetail | null;
}

export function OldDosingCalculatorTab({ patientId, patient }: Readonly<DosingCalculatorTabProps>) {
    const [openSections, setOpenSections] = useState({
        lab: true,
        medical: false,
        lifestyle: false,
    });
    const [showResults, setShowResults] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [dosingResults, setDosingResults] = useState<Record<string, any> | null>(null);
    const [dosingType, setDosingType] = useState<"testosterone" | "estradiol" | null>(null);
    const [pelletType, setPelletType] = useState<"T100" | "T200" | null>(null);

    const form = useForm<DosingCalculatorFormValues>({
        resolver: zodResolver(dosingCalculatorSchema),
        defaultValues: dosingCalculatorDefaultValues,
    });

    // Load dosing history
    const { data: historyResponse, isLoading: isLoadingHistory } = useGetDosingHistory(
        patientId ?? "",
        patient?.gender || "",
        { enabled: Boolean(patientId) }
    );
    const historyData = historyResponse?.data ?? [];

    // Mutations
    const updatePatientInfoMutation = useUpdatePatientInfo({
        onError: (error: any) => {
            toast.error(error?.message || "Failed to update patient info");
        },
    });

    const calculateTestosteroneMutation = useCalculateTestosteroneDosing({
        onSuccess: (response) => {
            if (response.error) {
                toast.error(response.message || "Failed to calculate testosterone dosing");
                return;
            }
            setDosingResults(response.data);
            setDosingType("testosterone");
            setShowResults(true);
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to calculate testosterone dosing");
        },
    });

    const calculateEstradiolMutation = useCalculateEstradiolDosing({
        onSuccess: (response) => {
            if (response.error) {
                toast.error(response.message || "Failed to calculate estradiol dosing");
                return;
            }
            setDosingResults(response.data);
            setDosingType("estradiol");
            setShowResults(true);
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to calculate estradiol dosing");
        },
    });

    const saveDosingMutation = useSaveDosingCalculation({
        onSuccess: (response) => {
            if (response.error) {
                toast.error(response.message || "Failed to save dosing calculation");
                return;
            }
            toast.success("Dosing calculation saved successfully");
            setShowResults(false);
            setSelectedPlan(null);
            setDosingResults(null);
            form.reset(dosingCalculatorDefaultValues);
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to save dosing calculation");
        },
    });

    // Determine patient gender and calculate dosing
    const calculateDosing = async () => {
        if (!patientId) {
            toast.error("Patient ID is missing");
            return;
        }

        const patientGender = patient?.gender?.toUpperCase();
        const selectedPelletType = form.watch("pelletType");

        if (patientGender === "MALE") {
            if (!selectedPelletType) {
                toast.error("Please select a pellet type (T100 or T200) for male patients");
                return;
            }
            setPelletType(selectedPelletType);
            calculateTestosteroneMutation.mutate({
                patientId,
                pelletType: selectedPelletType,
            });
        } else if (patientGender === "FEMALE") {
            setPelletType(null);
            calculateEstradiolMutation.mutate(patientId);
        } else {
            toast.error("Patient gender is required to calculate dosing");
        }
    };

    const handleClear = () => {
        form.reset(dosingCalculatorDefaultValues);
        setShowResults(false);
        setSelectedPlan(null);
        setDosingResults(null);
        setDosingType(null);
        setPelletType(null);
    };

    const onSubmit = async (data: DosingCalculatorFormValues) => {
        if (!patientId) {
            toast.error("Patient ID is missing");
            return;
        }

        // Map form data to API payload
        const lifestyleData: Record<string, any> = {};
        if (data.activityLevel) {
            // Map activity level to exercise level
            const exerciseLevelMap: Record<string, string> = {
                sedentary: "sedentary",
                average: "moderate",
                high: "vigorous",
            };
            lifestyleData.exerciseLevel = exerciseLevelMap[data.activityLevel] || data.activityLevel;
        }

        const medicationsData: Record<string, any> = {};
        if (data.addMeds === "yes") {
            medicationsData.adhdStimulants = true;
        } else if (data.addMeds === "no") {
            medicationsData.adhdStimulants = false;
        }
        if (data.chronicPain === "yes") {
            medicationsData.opiods = true;
        } else if (data.chronicPain === "no") {
            medicationsData.opiods = false;
        }

        // Update patient info first
        try {
            const response = await updatePatientInfoMutation.mutateAsync({
                patientId,
                data: {
                    lifestyleData: Object.keys(lifestyleData).length > 0 ? lifestyleData : undefined,
                    medicationsData: Object.keys(medicationsData).length > 0 ? medicationsData : undefined,
                    clinicalData: data.clinicalData,
                },
            });
            
            if (response.error) {
                toast.error(response.message || "Failed to update patient info");
                return;
            }
            // After updating patient info, calculate dosing
            await calculateDosing();
        } catch {
            // Error is already handled by onError callback
        }
    };

    const handleSaveDosing = () => {
        if (!patientId || !selectedPlan || !dosingResults) {
            toast.error("Please select a dosing plan");
            return;
        }

        if (!dosingType) {
            toast.error("Dosing type is not set. Please recalculate dosing.");
            return;
        }

        const selectedVariant = RESULT_VARIANTS.find((v) => v.id === selectedPlan);
        if (!selectedVariant) {
            toast.error("Invalid plan selected");
            return;
        }

        const payload: {
            isOverridden?: boolean;
            T100?: { tier: string };
            T200?: { tier: string };
            ESTRADIOL?: { tier: string };
        } = {};

        if (dosingType === "testosterone") {
            if (!pelletType) {
                toast.error("Pellet type is required for testosterone dosing");
                return;
            }
            if (pelletType === "T100") {
                payload.T100 = { tier: selectedVariant.tier };
            } else if (pelletType === "T200") {
                payload.T200 = { tier: selectedVariant.tier };
            } else {
                toast.error("Invalid pellet type");
                return;
            }
        } else if (dosingType === "estradiol") {
            payload.ESTRADIOL = { tier: selectedVariant.tier };
        } else {
            // Fallback: determine from patient gender if dosingType is lost
            const patientGender = patient?.gender?.toUpperCase();
            if (patientGender === "FEMALE") {
                payload.ESTRADIOL = { tier: selectedVariant.tier };
            } else if (patientGender === "MALE") {
                // For male, we need pellet type - check form
                const formPelletType = form.watch("pelletType") as "T100" | "T200" | undefined;
                if (!formPelletType) {
                    toast.error("Pellet type is required for male patients. Please select T100 or T200.");
                    return;
                }
                if (formPelletType === "T100") {
                    payload.T100 = { tier: selectedVariant.tier };
                } else {
                    payload.T200 = { tier: selectedVariant.tier };
                }
            } else {
                toast.error("Unable to determine patient gender. Please recalculate dosing.");
                return;
            }
        }

        // Validate payload is not empty
        if (!payload.T100 && !payload.T200 && !payload.ESTRADIOL) {
            console.error("Save dosing error - empty payload:", { 
                dosingType, 
                pelletType, 
                patientGender: patient?.gender,
                selectedPlan,
                selectedVariant 
            });
            toast.error("Unable to determine dosing type. Please recalculate.");
            return;
        }

        console.log("Saving dosing with payload:", payload, "for patient:", patient?.gender);
        // saveDosingMutation.mutate({
        //     patientId,
        //     data: payload,
        // });
    };

    // Transform history data to match HistoryEntry format
    const transformedHistory: HistoryEntry[] = useMemo(() => {
        if (!historyData || !Array.isArray(historyData)) {
            return [];
        }

        // Simple log of raw history data from the API
        console.log("Dosing history from API:", historyData);

        return historyData.map((entry: any) => {
            const data = entry.data || {};
            const t100Data = data.T100;
            const t200Data = data.T200;
            const estradiolData = data.ESTRADIOL;

            const date = new Date(entry.createdAt).toLocaleDateString();
            const dateLabel = entry.type || "Regular";

            // Extract testosterone data
            let testosterone = { value: "N/A", description: "" };
            if (t100Data) {
                testosterone = {
                    value: `${t100Data.dosageMg || 0} mg pellets`,
                    description: `T100 - ${t100Data.tier || ""}`,
                };
            } else if (t200Data) {
                testosterone = {
                    value: `${t200Data.dosageMg || 0} mg pellets`,
                    description: `T200 - ${t200Data.tier || ""}`,
                };
            }

            // Extract estradiol data
            let estradiol = { value: "N/A", description: "" };
            if (estradiolData) {
                estradiol = {
                    value: `${estradiolData.dosageMg || 0} mg pellets`,
                    description: `Estradiol - ${estradiolData.tier || ""}`,
                };
            }

            return {
                id: entry.id,
                date,
                dateLabel,
                testosterone,
                estradiol,
                vitaminD: "See recommendations",
                diindolylmethane: "See recommendations",
            };
        });
    }, [historyData]);

    const toggleSection =
        (section: keyof typeof openSections) => (value: boolean) => {
            setOpenSections((prev) => ({
                ...prev,
                [section]: value,
            }));
        };

    const renderSectionShell = (
        section: keyof typeof openSections,
        icon: ReactNode,
        title: string,
        content: ReactNode,
    ) => (
        <Collapsible open={openSections[section]} onOpenChange={toggleSection(section)}>
            <div className="border border-b-1 border-l-0 border-r-0 border-t-0">
                <CollapsibleTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        className="flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left sm:px-5 h-auto hover:bg-neutral-50"
                    >
                        <div className="flex items-center gap-2 text-foreground">
                            <span className="text-muted-foreground">{icon}</span>
                            <span className="font-medium">{title}</span>
                        </div>
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform",
                                openSections[section] && "rotate-180",
                            )}
                        />
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="space-y-6 px-4 py-5 sm:px-5">{content}</div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );

    if (!patientId) {
        return (
            <div className="rounded-3xl bg-primary-foreground p-6">
                <p className="typo-body-2 text-muted-foreground">Select a patient to view dosing calculator.</p>
            </div>
        );
    }

    const isCalculating =
        updatePatientInfoMutation.isPending ||
        calculateTestosteroneMutation.isPending ||
        calculateEstradiolMutation.isPending;
    const isSaving = saveDosingMutation.isPending;

    return (
        <div className="rounded-3xl bg-primary-foreground p-6 space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="typo-h3 text-foreground">Calculator</h3>
                <p className="typo-body-2 text-muted-foreground">Updated in: {LAST_UPDATED}</p>
            </div>

            <div className="rounded-2xl border border-muted-foreground bg-primary-foreground px-4 py-5">
                <p className="flex items-center gap-2 typo-body-2 text-foreground">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    Clinical Judgement Disclaimer
                </p>
                <p className="mt-2 typo-body-2 typo-body-2-regular text-muted-foreground leading-relaxed">
                    This dosage calculator platform suggests dosage based on a limited set of clinical values. The
                    responsibility ultimately lies with the practitioner to diligently conduct their own comprehensive
                    assessment, and ultimately determine the most appropriate course of action.
                </p>
            </div>

            {!showResults && (
                <Form {...form}>
                    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                        {renderSectionShell(
                            "lab",
                            <FlaskConical className="h-5 w-5" />,
                            "Laboratory Data",
                            <div className="rounded-2xl border border-dashed border-muted-foreground bg-primary-foreground px-4 py-4 typo-body-2 text-muted-foreground">
                                Laboratory inputs are pending.
                            </div>,
                        )}

                        {patient?.gender?.toUpperCase() === "MALE" && (
                            <FormField
                                control={form.control}
                                name="pelletType"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="typo-body-3 text-foreground">
                                            Pellet Type*
                                        </FormLabel>
                                        <FormControl>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger className="w-full rounded-lg border-muted-foreground">
                                                    <SelectValue placeholder="Select pellet type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="T100">T100</SelectItem>
                                                    <SelectItem value="T200">T200</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage className="text-destructive" />
                                    </FormItem>
                                )}
                            />
                        )}

                        {renderSectionShell(
                            "medical",
                            <Stethoscope className="h-5 w-5" />,
                            "Medical History",
                            <>
                                {patient?.gender?.toUpperCase() === "FEMALE" && (
                                    <FormField
                                        control={form.control}
                                        name="menstrualCycle"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                                                <FormLabel className="typo-body-3 text-foreground sm:min-w-[180px]">
                                                    Menstrual Cycle*
                                                </FormLabel>
                                                <div className="flex-1">
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="w-full rounded-lg border-muted-foreground">
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {MENSTRUAL_OPTIONS.map((option) => (
                                                                <SelectItem key={option} value={option}>
                                                                    {option}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage className="mt-2 text-destructive" />
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <div className="grid gap-6 md:grid-cols-2">
                                    {MEDICAL_HISTORY_FIELDS.map((fieldConfig) => (
                                        <FormField
                                            key={fieldConfig.name}
                                            control={form.control}
                                            name={fieldConfig.name}
                                            render={({ field }) => (
                                                <FormItem className="space-y-2">
                                                    <FormLabel className="typo-body-3 text-foreground">
                                                        {fieldConfig.label}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <RadioGroup
                                                            className="flex gap-6"
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                        >
                                                            {[
                                                                { value: "yes", label: "Yes" },
                                                                { value: "no", label: "No" },
                                                            ].map((option) => (
                                                                <label
                                                                    key={option.value}
                                                                    htmlFor={`${fieldConfig.name}-${option.value}`}
                                                                    className="flex items-center gap-2 text-sm text-foreground"
                                                                >
                                                                    <RadioGroupItem
                                                                        id={`${fieldConfig.name}-${option.value}`}
                                                                        value={option.value}
                                                                    />
                                                                    <span>{option.label}</span>
                                                                </label>
                                                            ))}
                                                        </RadioGroup>
                                                    </FormControl>
                                                    <FormMessage className="text-destructive" />
                                                </FormItem>
                                            )}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {renderSectionShell(
                            "lifestyle",
                            <Bike className="h-5 w-5" />,
                            "Lifestyle",
                            <FormField
                                control={form.control}
                                name="activityLevel"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="typo-body-3 text-foreground">
                                            Activity level
                                        </FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                className="flex flex-wrap gap-6"
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                {[
                                                    { value: "sedentary", label: "Sedentary" },
                                                    { value: "average", label: "Average" },
                                                    { value: "high", label: "High" },
                                                ].map((option) => (
                                                    <label
                                                        key={option.value}
                                                        htmlFor={`activity-${option.value}`}
                                                        className="flex items-center gap-2 text-sm text-foreground"
                                                    >
                                                        <RadioGroupItem
                                                            id={`activity-${option.value}`}
                                                            value={option.value}
                                                        />
                                                        <span>{option.label}</span>
                                                    </label>
                                                ))}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage className="text-destructive" />
                                    </FormItem>
                                )}
                            />,
                        )}

                        <div className="flex flex-wrap justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="destructive"
                                className="rounded-lg bg-destructive px-6 text-primary-foreground hover:bg-destructive/90"
                                onClick={handleClear}
                                disabled={isCalculating || isSaving}
                            >
                                Clear information
                            </Button>
                            <Button
                                type="submit"
                                className="rounded-lg min-w-[150px]"
                                disabled={isCalculating || isSaving}
                            >
                                {isCalculating ? (
                                    <span className="flex items-center gap-2">
                                        <Spinner className="text-primary-foreground" />
                                        Calculating
                                    </span>
                                ) : (
                                    "Calculate dosage"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            )}

            {showResults && dosingResults && (
                <div className="space-y-5">
                    <ResultsCard
                        dosingResults={dosingResults}
                        selectedPlan={selectedPlan}
                        onSelectPlan={setSelectedPlan}
                        onReset={handleClear}
                        onSave={handleSaveDosing}
                        isSaving={isSaving}
                    />
                </div>
            )}
            <HistoryTable data={transformedHistory} isLoading={isLoadingHistory} />
        </div>
    );
}

function ResultsCard({
    dosingResults,
    selectedPlan,
    onSelectPlan,
    onReset,
    onSave,
    isSaving,
}: Readonly<{
    dosingResults: Record<string, any>;
    selectedPlan: string | null;
    onSelectPlan: (value: string) => void;
    onReset: () => void;
    onSave: () => void;
    isSaving: boolean;
}>) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-foreground">Dosing Suggestions</h4>
                </div>
                <Button
                    variant="ghost"
                    onClick={onReset}
                    disabled={isSaving}
                >
                    Reset Calculator
                </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {RESULT_VARIANTS.map((variant) => {
                    const isSelected = selectedPlan === variant.id;
                    const tierData = dosingResults[variant.tier];
                    const dosageMg = tierData?.dosingCalculation?.finalDoseMg ?? 0;
                    const pelletCount = tierData?.dosingCalculation?.pelletCount ?? 0;

                    return (
                        <Button
                            key={variant.id}
                            type="button"
                            variant="outline"
                            onClick={() => onSelectPlan(variant.id)}
                            disabled={isSaving}
                            className={cn(
                                "rounded-2xl px-4 py-4 text-left transition-all duration-300 bg-primary-teal-1/70",
                                "border-2 cursor-pointer w-full",
                                "flex flex-col gap-3 h-auto",
                                isSelected
                                    ? "border-primary-brand-teal-1/40 shadow-md bg-primary/70"
                                    : "border-muted-foreground hover:scale-105 hover:border-primary-brand-teal-1/70",
                                isSaving && "opacity-50 cursor-not-allowed",
                            )}
                        >
                            <p className="typo-body-2 font-bold text-foreground text-left">{variant.label}</p>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-baseline justify-around gap-1 typo-body-2 typo-body-2-regular text-foreground">
                                    <span className="font-bold">{dosageMg}</span>
                                    <span className="font-normal">mg</span>
                                </div>
                                <div className="flex items-baseline justify-around gap-1 typo-body-2 typo-body-2-regular text-foreground">
                                    <span className="font-bold">{pelletCount}</span>
                                    <span className="font-normal">Pellets</span>
                                </div>
                            </div>
                        </Button>
                    );
                })}
            </div>

            <div className="flex justify-end">
                <Button
                    className="rounded-lg"
                    disabled={!selectedPlan || isSaving}
                    onClick={onSave}
                >
                    {isSaving ? (
                        <span className="flex items-center gap-2">
                            <Spinner className="text-primary-foreground" />
                            Saving...
                        </span>
                    ) : (
                        "Apply Medications"
                    )}
                </Button>
            </div>
        </div>
    );
}

function HistoryTable({ data, isLoading }: Readonly<{ data: HistoryEntry[]; isLoading?: boolean }>) {
    const columns = useMemo(() => getHistoryColumns(), []);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <h3 className="typo-h4 text-neutral-900">History</h3>
                <div className="flex items-center justify-center py-8">
                    <Spinner />
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="space-y-4">
                <h3 className="typo-h4 text-neutral-900">History</h3>
                <p className="text-sm text-neutral-500">No history data available.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="typo-h4 text-neutral-900">History</h3>
            <div className="w-full">
                <DataTable
                    columns={columns}
                    data={data}
                    enableSorting={false}
                    enableFiltering={false}
                    className="bg-white w-full"
                />
            </div>
        </div>
    );
}
