import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setInsertionDate } from "@/store/features/dosing";
import { formatDate } from "@/utils/date.utils";

interface KineticSlopeProps {
    historyData?: PatientDosageHistoryEntry[] | null;
}

export function KineticSlope({ historyData }: Readonly<KineticSlopeProps>) {
    const dispatch = useAppDispatch();
    const { selectedDose, insertionDate } = useAppSelector(
        (state) => state.dosingCalculator
    );

    // Set insertion date from most recent history entry (only once, doesn't change)
    useEffect(() => {
        if (historyData && historyData.length > 0 && !insertionDate) {
            const mostRecentEntry = historyData[0];
            dispatch(setInsertionDate(mostRecentEntry.createdAt));
        }
    }, [historyData, insertionDate, dispatch]);

    // Calculate estimated dates
    const { estimatedPeakDate, estimatedRePelletDate } = useMemo(() => {
        if (!insertionDate) {
            return { estimatedPeakDate: null, estimatedRePelletDate: null };
        }

        const insertion = new Date(insertionDate);
        const peakDate = new Date(insertion);
        peakDate.setDate(peakDate.getDate() + 45);

        const rePelletDate = new Date(insertion);
        rePelletDate.setDate(rePelletDate.getDate() + 85);

        return {
            estimatedPeakDate: peakDate,
            estimatedRePelletDate: rePelletDate,
        };
    }, [insertionDate]);

    return (
        <div className="max-w-[362px] w-full space-y-4 md:space-y-8 ">
            <p className="typo-body-1 text-foreground">Kinetic Slope</p>

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
                    {insertionDate ? (
                        <p className="typo-body-2 typo-body-2-regular text-foreground">
                            {formatDate(insertionDate, "DD / MM / YYYY")}
                        </p>
                    ) : (
                        <p className="typo-body-2 typo-body-2-regular text-muted-foreground">
                            dd / mm / aaaa
                        </p>
                    )}
                </div>

                {/* Estimated Peak */}
                <div className="flex items-center justify-between border-b border-muted-foreground/30 pb-1">
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
                </div>

                {/* Estimated Re-pellet */}
                <div className="flex items-center justify-between border-b border-muted-foreground/30 pb-1">
                    <p className="typo-body-2 typo-body-2-regular text-foreground">
                        Estimated Re-pellet:
                    </p>
                    {estimatedRePelletDate ? (
                        <p className="typo-body-2 typo-body-2-regular text-foreground">
                            85 days – {formatDate(estimatedRePelletDate, "DD / MM / YYYY")}
                        </p>
                    ) : (
                        <p className="typo-body-2 typo-body-2-regular text-foreground">
                            85 days – dd / mm / aaaa
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
