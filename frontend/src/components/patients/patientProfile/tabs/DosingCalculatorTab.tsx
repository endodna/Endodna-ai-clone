import { useEffect, useMemo, useState, type ReactNode } from "react";
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

const MOCK_HISTORY_DATA: HistoryEntry[] = [
    {
        id: "1",
        date: "11/25/2025",
        dateLabel: "Regular",
        testosterone: {
            value: "0 mg pellets",
            description: "No supplementation needed at this level",
        },
        estradiol: {
            value: "0 mg pellets",
            description: "Not indicated when menstrual cycles are regular.",
        },
        vitaminD: "Consider Supplement",
        diindolylmethane: "350 mg Per Day",
    },
    {
        id: "2",
        date: "08/25/2025",
        dateLabel: "Booster",
        testosterone: {
            value: "0 mg pellets",
            description: "No supplementation needed at this level",
        },
        estradiol: {
            value: "0 mg pellets",
            description: "Not indicated when menstrual cycles are regular.",
        },
        vitaminD: "Consider Supplement",
        diindolylmethane: "350 mg Per Day",
    },
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
                            "Lyfestyle",
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
                            >
                                Clear information
                            </Button>
                            <Button
                                type="submit"
                                className="rounded-lg min-w-[150px]"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
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

            {showResults && (
                <div className="space-y-5">
                    <ResultsCard
                        selectedPlan={selectedPlan}
                        onSelectPlan={setSelectedPlan}
                        onReset={handleClear}
                    />
                </div>
            )}
            <HistoryTable data={MOCK_HISTORY_DATA} />
        </div>
    );
}

function ResultsCard({
    selectedPlan,
    onSelectPlan,
    onReset,
}: Readonly<{
    selectedPlan: string | null;
    onSelectPlan: (value: string) => void;
    onReset: () => void;
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
                >
                    Reset Calculator
                </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {RESULT_VARIANTS.map((variant) => {
                    const isSelected = selectedPlan === variant.id;
                    return (
                        <Button
                            key={variant.id}
                            type="button"
                            variant="outline"
                            onClick={() => onSelectPlan(variant.id)}
                            className={cn(
                                "rounded-2xl px-4 py-4 text-left transition-all duration-300",
                                "bg-muted-foreground/20 hover:scale-105",
                                isSelected
                                    ? "border-primary-brand-teal-1/40 bg-primary/70"
                                    : "border-muted-foreground hover:scale-105 hover:border-primary-brand-teal-1/70",
                            )}
                        >
                            <p className="typo-body-2 text-foreground">{variant.label}</p>
                            <div className="mt-2 flex justify-between items-baseline gap-1 typo-body-2 typo-body-2-regular text-foreground">
                                <span>999</span>
                                <span>mg</span>
                            </div>
                            <div className="flex justify-between items-baseline gap-1 typo-body-2 typo-body-2-regular text-foreground">
                                <span>99</span>
                                <span>Pellets</span>
                            </div>
                        </Button>
                    );
                })}
            </div>

            <div className="flex justify-end">
                <Button
                    className="rounded-lg"
                    disabled={!selectedPlan}
                >
                    Apply Medications
                </Button>
            </div>
        </div>
    );
}

function HistoryTable({ data }: { data: HistoryEntry[] }) {
    const columns = useMemo(() => getHistoryColumns(), []);

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
