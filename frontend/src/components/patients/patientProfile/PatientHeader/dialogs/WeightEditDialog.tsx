import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { kgToLbs, lbsToKg } from "@/utils/patient.utils";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface WeightEditDialogProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly initialWeightKg: number | null | undefined;
    readonly onSave: (weightKg: number) => Promise<void>;
    readonly isSaving?: boolean;
}

export function WeightEditDialog({
    open,
    onOpenChange,
    initialWeightKg,
    onSave,
    isSaving = false,
}: Readonly<WeightEditDialogProps>) {
    const [weightLbs, setWeightLbs] = useState<string>("");

    useEffect(() => {
        if (open && initialWeightKg) {
            const lbs = kgToLbs(initialWeightKg);
            if (lbs !== null) {
                setWeightLbs(lbs.toString());
            }
        } else if (open) {
            setWeightLbs("");
        }
    }, [open, initialWeightKg]);

    const handleSave = async () => {
        const lbs = Number.parseFloat(weightLbs);
        
        if (Number.isNaN(lbs) || lbs <= 0) {
            toast.error("Please enter a valid weight");
            return;
        }
        
        const weightKgValue = lbsToKg(lbs);
        await onSave(weightKgValue);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Weight</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label htmlFor="weight-lbs" className="typo-body-2 text-foreground">
                            Weight (lbs)
                        </label>
                        <Input
                            id="weight-lbs"
                            type="number"
                            min="0"
                            step="0.1"
                            value={weightLbs}
                            onChange={(e) => setWeightLbs(e.target.value)}
                            placeholder="170.8"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <span className="flex items-center gap-2">
                                <Spinner className="animate-spin h-4 w-4" />
                                Saving...
                            </span>
                        ) : (
                            "Save"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

