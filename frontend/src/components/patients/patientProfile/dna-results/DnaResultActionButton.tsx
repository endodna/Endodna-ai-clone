import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateDnaKitStatus } from "@/hooks/useDoctor";
import type { ComponentProps } from "react";
import { useState } from "react";
import { DnaResultActionDialog } from "./DnaResultActionDialog";

type ButtonVariant = ComponentProps<typeof Button>["variant"];

export interface RowAction {
    label: string;
    variant?: ButtonVariant;
    intent: "cancel" | "hold" | "resume" | "open";
    action?: "HOLD" | "PROCESS" | "CANCEL";
}

interface DnaResultActionButtonProps {
    action: RowAction;
    result: PatientDNAResult;
    patientId: string;
}

export const DnaResultActionButton = ({ action, result, patientId }: DnaResultActionButtonProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<"HOLD" | "PROCESS" | "CANCEL" | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { mutate: updateStatus, isPending } = useUpdateDnaKitStatus({
        onSuccess: (response) => {
            if (response.error) {
                // Keep dialog open to show error message
                setError(response.message || "Failed to update DNA kit status");
            } else {
                setDialogOpen(false);
                setPendingAction(null);
                setError(null);
            }
        },
        onError: (error: any) => {
            // Extract error message from API response or error object
            const errorMessage = 
                error?.response?.data?.message || 
                error?.message || 
                "An unexpected error occurred. Please try again.";
            setError(errorMessage);
            console.error("Error updating DNA kit status:", error);
        },
    });

    const handleClick = () => {
        if (action.intent === "open") {
            return;
        }

        if (!action.action) {
            return;
        }

        setError(null);
        setPendingAction(action.action);
        setDialogOpen(true);
    };

    const handleConfirm = () => {
        if (!pendingAction || !patientId) {
            return;
        }

        updateStatus({
            patientId,
            dnaResultId: result.id,
            action: pendingAction,
        });
    };

    const isLoading = isPending && pendingAction === action.action;

    return (
        <>
            <Button
                variant={action.variant}
                size="sm"
                onClick={(event) => {
                    event.stopPropagation();
                    handleClick();
                }}
                disabled={isLoading || dialogOpen}
            >
                {isLoading ? (
                    <>
                        <Spinner className="size-4" />
                        Processing...
                    </>
                ) : (
                    action.label
                )}
            </Button>
            {action.action && (
                <DnaResultActionDialog
                    open={dialogOpen && pendingAction === action.action}
                    onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) {
                            setError(null);
                            setPendingAction(null);
                        }
                    }}
                    action={action.action}
                    result={result}
                    onConfirm={handleConfirm}
                    isLoading={isLoading}
                    error={error}
                />
            )}
        </>
    );
};

