import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
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
    const [weightKg, setWeightKg] = useState<string>("");

    useEffect(() => {
        if (open && initialWeightKg) {
            setWeightKg(initialWeightKg.toString());
        } else if (open) {
            setWeightKg("");
        }
    }, [open, initialWeightKg]);

    const handleSave = async () => {
        const kg = Number.parseFloat(weightKg);
        
        if (Number.isNaN(kg) || kg <= 0) {
            toast.error("Please enter a valid weight");
            return;
        }
        
        await onSave(kg);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Weight</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label htmlFor="weight-kg" className="typo-body-2 text-foreground">
                            Weight (kg)
                        </label>
                        <Input
                            id="weight-kg"
                            type="number"
                            min="0"
                            step="0.1"
                            value={weightKg}
                            onChange={(e) => setWeightKg(e.target.value)}
                            placeholder="77.5"
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

