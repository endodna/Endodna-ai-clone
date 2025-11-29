import type { ColumnDef } from "@tanstack/react-table";
import { DnaResultTimeline } from "./DnaResultTimeline";
import { getDnaResultStatus, HoldCancelDiscardResult, normalizeDnaStatus, StepStatusResult } from "@/utils/dnaResult.utils";
import { DNA_RESULT_STATUS } from "@/components/constants/DnaResults";
import { DnaResultActionButton, type RowAction } from "./DnaResultActionButton";

const HOLD_STATUSES = new Set<string>(["HOLD", "ON_HOLD"]);
const CANCELLED_STATUSES = new Set<string>(["CANCEL", "CANCELLED", "DISCARD"]);
const COMPLETED_STATUSES = new Set<string>([DNA_RESULT_STATUS.DATA_DELIVERED]);
const GENOTYPING_ACCEPTED_STATUSES = new Set<string>([
    DNA_RESULT_STATUS.GENOTYPING_ACCEPTED,
    DNA_RESULT_STATUS.GENOTYPING_2ND_ACCEPTED,
]);

const getRowActions = (result: PatientDNAResult): RowAction[] => {
    if (!result) {
        return [];
    }

    const normalizedStatus = normalizeDnaStatus(result.status);

    // If cancelled, cannot hold or process - no actions available
    if (CANCELLED_STATUSES.has(normalizedStatus)) {
        return [];
    }

    // If data delivered or genotype accepted, cannot perform any action
    if (COMPLETED_STATUSES.has(normalizedStatus) || GENOTYPING_ACCEPTED_STATUSES.has(normalizedStatus)) {
        return [];
    }

    // If on hold, can process or cancel
    if (HOLD_STATUSES.has(normalizedStatus)) {
        return [
            { label: "Resume", variant: "secondary", intent: "resume", action: "PROCESS" },
            { label: "Cancel", variant: "outline", intent: "cancel", action: "CANCEL" },
        ];
    }

    // Default: can cancel or put on hold
    return [
        { label: "Cancel", variant: "outline", intent: "cancel", action: "CANCEL" },
        { label: "Put on hold", variant: "secondary", intent: "hold", action: "HOLD" },
    ];
};

const renderSpecialStatus = (dnaResultStatus: HoldCancelDiscardResult): React.ReactNode => {
    if (dnaResultStatus.isHold) {
        return <div>
            <p className="typo-body-2 typo-typo-body-2-regular text-foreground">Analysis is paused</p>
            <p className="typo-body-3 typo-body-3-regular text-foreground">Resume to keep tracking</p>
        </div>;
    }
    if (dnaResultStatus.isCancel) {
        return <div>
            <p className="typo-body-2 typo-body-2-regular text-foreground">Analysis is Canceled</p>
            <p className="typo-body-3 typo-body-3-regular text-foreground">Canceled on ...</p>
        </div>;
    }
    if (dnaResultStatus.isDiscard) {
        return <div>
            <p className="typo-body-2 typo-body-2-regular text-foreground">Analysis is Discarded</p>
            <p className="typo-body-3 typo-body-3-regular text-foreground">Discarded on ...</p>
        </div>;
    }
    return null;
};

export const createDnaResultsColumns = (patientId: string): ColumnDef<PatientDNAResult>[] => [
    {
        id: "name",
        header: () => <span className="typo-body-2 font-semibold text-foreground">Name</span>,
        cell: ({ row, }) => {
            const name = row.original.name ?? row.original.reportName ?? "DNA Test";
            return (
                <div className="space-y-1 px-2">
                    <p className="typo-body-2 font-medium text-foreground">{name}</p>
                </div>
            );
        },
    },
    {
        id: "status",
        header: () => <span className="typo-body-2 font-semibold text-foreground">Lab Status</span>,
        cell: ({ row }) => {
            const dnaResultStatus = getDnaResultStatus(row.original.status);
            if (!dnaResultStatus) return null;

            // ---- SPECIAL CASES: HOLD / CANCEL / DISCARD ----
            const isSpecial =
                (dnaResultStatus as HoldCancelDiscardResult)?.isHold ||
                (dnaResultStatus as HoldCancelDiscardResult)?.isCancel ||
                (dnaResultStatus as HoldCancelDiscardResult)?.isDiscard;

            if (isSpecial) {
                return renderSpecialStatus(dnaResultStatus as HoldCancelDiscardResult);
            }

            // Type guard: if not special, it must be StepStatusResult
            const stepStatus = dnaResultStatus as StepStatusResult;
            return <DnaResultTimeline id={stepStatus.id} status={stepStatus.status} />;
        },
    },
    {
        id: "actions",
        header: () => <span className="typo-body-2 font-semibold text-foreground">Actions</span>,
        cell: ({ row }) => {
            const actions = getRowActions(row.original);
            if (actions.length === 0) {
                return (
                    <div className="ms-auto w-fit">
                        <span className="typo-body-3 text-muted-foreground">No actions available</span>
                    </div>
                );
            }
            return (
                <div className="ms-auto w-fit flex flex-wrap gap-2">
                    {actions.map((action) => (
                        <DnaResultActionButton
                            key={`${row.id}-${action.label}`}
                            action={action}
                            result={row.original}
                            patientId={patientId}
                        />
                    ))}
                </div>
            );
        },
        meta: {
            headerClassName: "text-right pr-4",
            cellClassName: "ms-auto ",
        },
    },
];