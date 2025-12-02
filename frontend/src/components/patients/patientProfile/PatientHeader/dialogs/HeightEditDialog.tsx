import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { feetInchesToCm } from "@/utils/patient.utils";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface HeightEditDialogProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly initialHeightCm: number | null | undefined;
    readonly onSave: (heightCm: number) => Promise<void>;
    readonly isSaving?: boolean;
}

export function HeightEditDialog({
    open,
    onOpenChange,
    initialHeightCm,
    onSave,
    isSaving = false,
}: Readonly<HeightEditDialogProps>) {
    const [heightFeet, setHeightFeet] = useState<string>("");
    const [heightInches, setHeightInches] = useState<string>("");

    useEffect(() => {
        if (open && initialHeightCm) {
            // Convert cm to ft/in for display
            const totalInches = initialHeightCm / 2.54;
            const feet = Math.floor(totalInches / 12);
            const inches = Math.round((totalInches % 12));
            setHeightFeet(feet.toString());
            setHeightInches(inches.toString());
        } else if (open) {
            setHeightFeet("");
            setHeightInches("");
        }
    }, [open, initialHeightCm]);

    const handleSave = async () => {
        const feet = Number.parseInt(heightFeet, 10);
        const inches = Number.parseFloat(heightInches);
        
        if (Number.isNaN(feet) || Number.isNaN(inches) || feet < 0 || inches < 0 || inches >= 12) {
            toast.error("Please enter valid height values");
            return;
        }
        
        const heightCmValue = feetInchesToCm(feet, inches);
        await onSave(heightCmValue);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Height</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="height-feet" className="typo-body-2 text-foreground">
                                Feet
                            </label>
                            <Input
                                id="height-feet"
                                type="number"
                                min="0"
                                value={heightFeet}
                                onChange={(e) => setHeightFeet(e.target.value)}
                                placeholder="5"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="height-inches" className="typo-body-2 text-foreground">
                                Inches
                            </label>
                            <Input
                                id="height-inches"
                                type="number"
                                min="0"
                                max="11.9"
                                step="0.1"
                                value={heightInches}
                                onChange={(e) => setHeightInches(e.target.value)}
                                placeholder="3.5"
                            />
                        </div>
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

