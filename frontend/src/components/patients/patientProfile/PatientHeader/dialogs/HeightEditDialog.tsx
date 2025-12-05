import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
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
    const [heightCm, setHeightCm] = useState<string>("");

    useEffect(() => {
        if (open && initialHeightCm) {
            setHeightCm(initialHeightCm.toString());
        } else if (open) {
            setHeightCm("");
        }
    }, [open, initialHeightCm]);

    const handleSave = async () => {
        const cm = Number.parseFloat(heightCm);
        
        if (Number.isNaN(cm) || cm <= 0) {
            toast.error("Please enter a valid height");
            return;
        }
        
        await onSave(cm);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Height</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label htmlFor="height-cm" className="typo-body-2 text-foreground">
                            Height (cm)
                        </label>
                        <Input
                            id="height-cm"
                            type="number"
                            min="0"
                            step="0.1"
                            value={heightCm}
                            onChange={(e) => setHeightCm(e.target.value)}
                            placeholder="170"
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

