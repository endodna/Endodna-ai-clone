import { GENDER } from "@/components/constants/patient";
import { setInsertionDate } from "@/store/features/dosing";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { formatDate } from "@/utils/date.utils";
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { useUpdatePatientInfo } from "@/hooks/useDoctor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface KineticSlopeProps {
    patient?: PatientDetail | null;
}

interface KineticSlopeContentProps {
    patient?: PatientDetail | null;
}

function KineticSlopeContent({ patient }: Readonly<KineticSlopeContentProps>) {
    const { selectedDose, insertionDate: insertionDateFromRedux } = useAppSelector(
        (state) => state.dosingCalculator
    );
    const dispatch = useAppDispatch();
    const updatePatientInfo = useUpdatePatientInfo();
    const [isOpen, setIsOpen] = useState(false);

    // Get insertion date from patient clinicalData or Redux
    const insertionDateFromPatient = patient?.patientInfo?.clinicalData?.insertionDate;
    const insertionDate = insertionDateFromPatient || insertionDateFromRedux;
    const selectedDate = insertionDate ? new Date(insertionDate) : undefined;

    // Sync patient data to Redux when it changes
    useEffect(() => {
        if (insertionDateFromPatient) {
            dispatch(setInsertionDate(insertionDateFromPatient));
        }
    }, [insertionDateFromPatient, dispatch]);

    // Handle date selection
    const handleDateSelect = async (date: Date | undefined) => {
        if (!date || !patient?.id) return;

        setIsOpen(false);
        const dateISO = date.toISOString();
        dispatch(setInsertionDate(dateISO));

        // Save insertion date
        try {
            await updatePatientInfo.mutateAsync({
                patientId: patient.id,
                data: {
                    clinicalData: {
                        insertionDate: dateISO,
                    },
                },
            });
        } catch (error) {
            console.error("Failed to save insertion date:", error);
            // Revert on error
            dispatch(setInsertionDate(insertionDateFromPatient || null));
        }
    };

    // Calculate estimated dates
    const {
        estimatedRePelletDate,
        rePelletDurationText,
        sixWeekLabDrawDate,
        twelveWeekLabDrawDate,
    } = useMemo(() => {
        if (!insertionDate) {
            return {
                estimatedPeakDate: null,
                estimatedRePelletDate: null,
                rePelletDurationText: "85 days",
                sixWeekLabDrawDate: null,
                twelveWeekLabDrawDate: null,
            };
        }

        const insertion = new Date(insertionDate);
        const peakDate = new Date(insertion);
        peakDate.setDate(peakDate.getDate() + 45);

        // Calculate 6 week and 12 week lab draw dates (6 weeks = 42 days, 12 weeks = 84 days)
        const sixWeekDate = new Date(insertion);
        sixWeekDate.setDate(sixWeekDate.getDate() + 42);

        const twelveWeekDate = new Date(insertion);
        twelveWeekDate.setDate(twelveWeekDate.getDate() + 84);

        // Calculate re-pellet date based on patient gender
        const rePelletDate = new Date(insertion);
        const patientGender = patient?.gender?.toUpperCase();

        let durationText: string;
        if (patientGender === GENDER.MALE) {
            // 5.5 months = 5 months + 15 days
            rePelletDate.setMonth(rePelletDate.getMonth() + 5);
            rePelletDate.setDate(rePelletDate.getDate() + 15);
            durationText = "5.5 months";
        } else if (patientGender === GENDER.FEMALE) {
            // 3.5 months = 3 months + 15 days
            rePelletDate.setMonth(rePelletDate.getMonth() + 3);
            rePelletDate.setDate(rePelletDate.getDate() + 15);
            durationText = "3.5 months";
        } else {
            // Default to 85 days if gender is not available
            rePelletDate.setDate(rePelletDate.getDate() + 85);
            durationText = "85 days";
        }

        return {
            estimatedPeakDate: peakDate,
            estimatedRePelletDate: rePelletDate,
            rePelletDurationText: durationText,
            sixWeekLabDrawDate: sixWeekDate,
            twelveWeekLabDrawDate: twelveWeekDate,
        };
    }, [insertionDate, patient?.gender]);

    return (
        <div className="space-y-1">
            {/* Dose Information */}
            <div className="flex items-center justify-between border-b border-muted-foreground/30 pb-1">
                <p className="typo-body-2 typo-body-2-regular text-foreground">
                    Dose:
                </p>
                {selectedDose ? (
                    <p className="typo-body-2 typo-body-2-regular text-foreground">
                        {selectedDose.dosageMg} mg | {selectedDose.pelletsCount} Pellets
                    </p>
                ) : (
                    <p className="typo-body-2 typo-body-2-regular text-muted-foreground">
                        No dose selected
                    </p>
                )}
            </div>

            {/* Insertion Date */}
            <div className="flex items-center justify-between border-b border-muted-foreground/30 pb-1">
                <p className="typo-body-2 typo-body-2-regular text-foreground">
                    Insertion date:
                </p>
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-auto p-0 hover:bg-transparent",
                                !insertionDate && "text-muted-foreground"
                            )}
                        >
                            <div className="flex items-center gap-1.5">
                                {insertionDate ? (
                                    <p className="typo-body-2 typo-body-2-regular text-foreground">
                                        {formatDate(insertionDate, "DD / MM / YYYY")}
                                    </p>
                                ) : (
                                    <p className="typo-body-2 typo-body-2-regular text-muted-foreground">
                                        dd / mm / aaaa
                                    </p>
                                )}
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* 6 Week Lab Draw */}
            <div className="flex items-center justify-between border-b border-muted-foreground/30 pb-1">
                <p className="typo-body-2 typo-body-2-regular text-foreground">
                    6 Week Lab Draw:
                </p>
                {sixWeekLabDrawDate ? (
                    <p className="typo-body-2 typo-body-2-regular text-foreground">
                        {formatDate(sixWeekLabDrawDate, "DD / MM / YYYY")}
                    </p>
                ) : (
                    <p className="typo-body-2 typo-body-2-regular text-muted-foreground">
                        dd / mm / aaaa
                    </p>
                )}
            </div>

            {/* 12 Week Lab Draw */}
            <div className="flex items-center justify-between border-b border-muted-foreground/30 pb-1">
                <p className="typo-body-2 typo-body-2-regular text-foreground">
                    12 Week Lab Draw:
                </p>
                {twelveWeekLabDrawDate ? (
                    <p className="typo-body-2 typo-body-2-regular text-foreground">
                        {formatDate(twelveWeekLabDrawDate, "DD / MM / YYYY")}
                    </p>
                ) : (
                    <p className="typo-body-2 typo-body-2-regular text-muted-foreground">
                        dd / mm / aaaa
                    </p>
                )}
            </div>

            {/* Estimated Peak */}
            {/* <div className="flex items-center justify-between border-b border-muted-foreground/30 pb-1">
                <p className="typo-body-2 typo-body-2-regular text-foreground">
                    Estimated Peak:
                </p>
                {estimatedPeakDate ? (
                    <p className="typo-body-2 typo-body-2-regular text-foreground">
                        45 days – {formatDate(estimatedPeakDate, "DD / MM / YYYY")}
                    </p>
                ) : (
                    <p className="typo-body-2 typo-body-2-regular text-foreground">
                        45 days – dd / mm / aaaa
                    </p>
                )}
            </div> */}

            {/* Estimated Re-pellet */}
            <div className="flex items-center justify-between border-b border-muted-foreground/30 pb-1">
                <p className="typo-body-2 typo-body-2-regular text-foreground">
                    Estimated Re-pellet:
                </p>
                {estimatedRePelletDate && twelveWeekLabDrawDate ? (
                    <p className="typo-body-2 typo-body-2-regular text-foreground">
                        {rePelletDurationText} – {formatDate(estimatedRePelletDate, "DD / MM / YYYY")}
                    </p>
                ) : (
                    <p className="typo-body-2 typo-body-2-regular text-foreground">
                        Available after 12 week lab draw
                    </p>
                )}
            </div>
        </div>
    );
}

export function KineticSlope({ patient }: Readonly<KineticSlopeProps>) {

    // Determine tabs based on patient gender
    const tabs = useMemo(() => {
        const patientGender = patient?.gender?.toUpperCase();

        if (patientGender === GENDER.MALE) {
            return [
                { id: "testosterone-t100", label: "Testosterone (T100)" },
                { id: "testosterone-t200", label: "Testosterone (T200)" },
            ];
        }

        // Default: show both testosterone and estradiol for female or unknown gender
        return [
            { id: "testosterone", label: "Testosterone" },
            { id: "estradiol", label: "Estradiol" },
        ];
    }, [patient?.gender]);

    // Set default active tab
    const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id || "");

    // Update active tab when tabs change
    useEffect(() => {
        if (tabs.length > 0 && tabs[0]?.id) {
            setActiveTab(tabs[0].id);
        }
    }, [tabs]);

    return (
        <div className="max-w-[440px] w-full space-y-4 md:space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <p className="typo-body-1 text-foreground">Kinetic Slope</p>
                    <TabsList className="bg-muted-foreground/10 h-auto p-1">
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className="typo-body-2 text-foreground rounded-[10px] px-3 py-1"
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>
                {tabs.map((tab) => (
                    <TabsContent key={tab.id} value={tab.id} className="mt-0">
                        <KineticSlopeContent patient={patient} />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
