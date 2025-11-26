import { useEffect, useState, type ReactNode } from "react";
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
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import {
    dosingCalculatorSchema,
    dosingCalculatorDefaultValues,
    type DosingCalculatorFormValues,
} from "@/schemas/dosingCalculator";

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
    { id: "conservative", label: "Conservative" },
    { id: "standard", label: "Standard" },
    { id: "aggressive", label: "Aggressive" },
    { id: "performance", label: "High-Performance" },
];

export function DosingCalculatorTab() {
    const [openSections, setOpenSections] = useState({
        lab: true,
        medical: false,
        lifestyle: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    const form = useForm<DosingCalculatorFormValues>({
        resolver: zodResolver(dosingCalculatorSchema),
        defaultValues: dosingCalculatorDefaultValues,
    });

    const handleClear = () => {
        form.reset(dosingCalculatorDefaultValues);
        setShowResults(false);
        setIsSubmitting(false);
        setSelectedPlan(null);
    };

    const onSubmit = () => {
        setShowResults(false);
        setIsSubmitting(true);
    };


    useEffect(() => {
        if (!isSubmitting) {
            return;
        }
        const timeout = setTimeout(() => {
            setIsSubmitting(false);
            setShowResults(true);
        }, 900);
        return () => clearTimeout(timeout);
    }, [isSubmitting]);
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
                    <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left sm:px-5"
                    >
                        <div className="flex items-center gap-2 text-neutral-900">
                            <span className="text-neutral-600">{icon}</span>
                            <span className="font-medium">{title}</span>
                        </div>
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 text-neutral-400 transition-transform",
                                openSections[section] && "rotate-180",
                            )}
                        />
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="space-y-6 px-4 py-5 sm:px-5">{content}</div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );

    return (
        <div className="rounded-3xl border border-neutral-100 bg-white p-6 space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="typo-h3 text-neutral-900-old">Calculator</h3>
                <p className="typo-body-2 text-neutral-500-old">Updated in: {LAST_UPDATED}</p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-5">
                <p className="flex items-center gap-2 text-sm font-medium text-neutral-900">
                    <AlertTriangle className="h-4 w-4 text-neutral-600" />
                    Clinical Judgement Disclaimer
                </p>
                <p className="mt-2 text-sm font-light text-neutral-600 leading-relaxed">
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
                            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-4 text-sm text-neutral-500">
                                Laboratory inputs are pending.
                            </div>,
                        )}

                        {renderSectionShell(
                            "medical",
                            <Stethoscope className="h-5 w-5" />,
                            "Medical History",
                            <>
                                <FormField
                                    control={form.control}
                                    name="menstrualCycle"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                                            <FormLabel className="typo-body-3 text-neutral-900 sm:min-w-[180px]">
                                                Menstrual Cycle*
                                            </FormLabel>
                                            <div className="flex-1">
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="w-full rounded-lg border-neutral-300">
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
                                                <FormMessage className="mt-2 text-red-500" />
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <div className="grid gap-6 md:grid-cols-2">
                                    {MEDICAL_HISTORY_FIELDS.map((fieldConfig) => (
                                        <FormField
                                            key={fieldConfig.name}
                                            control={form.control}
                                            name={fieldConfig.name}
                                            render={({ field }) => (
                                                <FormItem className="space-y-2">
                                                    <FormLabel className="typo-body-3 text-neutral-900">
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
                                                                    className="flex items-center gap-2 text-sm text-neutral-900"
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
                                                    <FormMessage className="text-red-500" />
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
                            "Lyfestyle",
                            <FormField
                                control={form.control}
                                name="activityLevel"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="typo-body-3 text-neutral-900">
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
                                                        className="flex items-center gap-2 text-sm text-neutral-900"
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
                                        <FormMessage className="text-red-500" />
                                    </FormItem>
                                )}
                            />,
                        )}

                        <div className="flex flex-wrap justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="destructive"
                                className="rounded-lg bg-red-100 px-6 text-white hover:bg-red-200"
                                onClick={handleClear}
                            >
                                Clear information
                            </Button>
                            <Button
                                type="submit"
                                className="rounded-lg text-white min-w-[150px]"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <Spinner className="text-white" />
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

            {showResults && (
                <ResultsCard
                    selectedPlan={selectedPlan}
                    onSelectPlan={setSelectedPlan}
                    onReset={handleClear}
                />
            )}
        </div>
    );
}

function ResultsCard({
    selectedPlan,
    onSelectPlan,
    onReset,
}: {
    selectedPlan: string | null;
    onSelectPlan: (value: string) => void;
    onReset: () => void;
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="typo-h4 text-neutral-900">Dosing Suggestions</p>
                </div>
                <button
                    type="button"
                    onClick={onReset}
                    className="text-sm font-medium text-violet-600 hover:underline"
                >
                    Reset Calculator
                </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {RESULT_VARIANTS.map((variant) => {
                    const isSelected = selectedPlan === variant.id;
                    return (
                        <button
                            key={variant.id}
                            type="button"
                            onClick={() => onSelectPlan(variant.id)}
                            className={cn(
                                "rounded-2xl px-4 py-4 text-left transition",
                                "bg-neutral-50 hover:shadow-md",
                                isSelected && "bg-[#7C3AED] text-white shadow-lg",
                            )}
                        >
                            <p className="font-semibold">{variant.label}</p>
                            <div className="mt-2 flex items-baseline gap-1 text-2xl font-semibold">
                                <span>999</span>
                                <span className="text-xs uppercase">mg</span>
                            </div>
                            <div className="flex items-baseline gap-1 text-sm font-medium">
                                <span>99</span>
                                <span className="text-xs uppercase">Pellets</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex justify-end">
                <Button
                    className="rounded-lg bg-violet-600 text-white"
                    disabled={!selectedPlan}
                >
                    Apply Medications
                </Button>
            </div>
        </div>
    );
}
