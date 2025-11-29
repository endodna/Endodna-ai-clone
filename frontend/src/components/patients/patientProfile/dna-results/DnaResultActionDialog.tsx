import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

interface DnaResultActionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    action: "HOLD" | "PROCESS" | "CANCEL";
    result: PatientDNAResult;
    onConfirm: () => void;
    isLoading: boolean;
    error?: string | null;
}

export const DnaResultActionDialog = ({
    open,
    onOpenChange,
    action,
    result,
    onConfirm,
    isLoading,
    error,
}: DnaResultActionDialogProps) => {
    const actionLabels = {
        HOLD: "Put on Hold",
        PROCESS: "Resume Processing",
        CANCEL: "Cancel",
    };

    const actionDescriptions = {
        HOLD: "This will pause the DNA test processing. You can resume it later.",
        PROCESS: "This will resume processing of the DNA test.",
        CANCEL: "This will cancel the DNA test. This action cannot be undone.",
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{actionLabels[action]} DNA Test</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        <p>{actionDescriptions[action]}</p>
                        <div className="space-y-1">
                            <p>
                                <strong>Test:</strong> {result.name ?? result.reportName ?? "DNA Test"}
                            </p>
                            {result.barcode && (
                                <p>
                                    <strong>Barcode:</strong> {result.barcode}
                                </p>
                            )}
                        </div>
                        {error && (
                            <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3">
                                <p className="text-destructive font-semibold">Error</p>
                                <p className="text-destructive text-sm">{error}</p>
                            </div>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={action === "CANCEL" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                    >
                        {isLoading ? (
                            <>
                                <Spinner className="size-4" />
                                Processing...
                            </>
                        ) : (
                            actionLabels[action]
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

