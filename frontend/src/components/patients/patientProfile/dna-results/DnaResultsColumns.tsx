import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import type { ComponentProps } from "react";
import { DnaResultTimeline } from "./DnaResultTimeline";
import { getDnaResultStatus, HoldCancelDiscardResult, normalizeDnaStatus, StepStatusResult } from "@/utils/dnaResult.utils";

type ButtonVariant = ComponentProps<typeof Button>["variant"];
interface RowAction {
    label: string;
    variant?: ButtonVariant;
    intent: "cancel" | "hold" | "resume" | "open";
}

const HOLD_STATUSES = new Set(["HOLD", "ON_HOLD"]);
const CANCELLED_STATUSES = new Set(["CANCEL", "CANCELLED", "DISCARD"]);
const COMPLETED_STATUSES = new Set(["DATA_DELIVERED"]);

const getRowActions = (result: PatientDNAResult): RowAction[] => {
    if (!result) {
        return [];
    }

    const normalizedStatus = normalizeDnaStatus(result.status);

    if (CANCELLED_STATUSES.has(normalizedStatus)) {
        return [
            { label: "Resume", variant: "secondary", intent: "resume" },
            { label: "Cancel", variant: "outline", intent: "cancel" },
        ];
    }
    if (HOLD_STATUSES.has(normalizedStatus)) {
        return [
            { label: "Resume", variant: "secondary", intent: "resume" },
            { label: "Cancel", variant: "outline", intent: "cancel" },
        ];
    }
    if (COMPLETED_STATUSES.has(normalizedStatus)) {
        return [{ label: "Open", variant: "secondary", intent: "open" }];
    }
    return [
        { label: "Cancel", variant: "outline", intent: "cancel" },
        { label: "Put on hold", variant: "secondary", intent: "hold" },
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

const handleAction = (action: RowAction, result: PatientDNAResult) => {
    console.log("[DNA Results] action clicked", { intent: action.intent, dnaResultId: result.id });
};

export const createDnaResultsColumns = (): ColumnDef<PatientDNAResult>[] => [
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
            return (
                <div className="ms-auto w-fit flex flex-wrap gap-2">
                    {actions.map((action) => (
                        <Button
                            key={`${row.id}-${action.label}`}
                            variant={action.variant}
                            size="sm"
                            onClick={(event) => {
                                event.stopPropagation();
                                handleAction(action, row.original);
                            }}
                        >
                            {action.label}
                        </Button>
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