import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface GoalEditDialogProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly goal?: { uuid: string; description: string } | null;
    readonly onSave: (description: string) => void;
}

export function GoalEditDialog({
    open,
    onOpenChange,
    goal,
    onSave,
}: Readonly<GoalEditDialogProps>) {
    const [goalDescription, setGoalDescription] = useState<string>("");

    useEffect(() => {
        if (open) {
            setGoalDescription(goal?.description ?? "");
        } else {
            setGoalDescription("");
        }
    }, [open, goal]);

    const handleSave = () => {
        if (!goalDescription.trim()) return;
        onSave(goalDescription.trim());
        onOpenChange(false);
    };

    const handleCancel = () => {
        setGoalDescription("");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{goal ? "Edit Goal" : "Add Goal"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label htmlFor="goal-description" className="typo-body-2 text-foreground">
                            Goal Description
                        </label>
                        <Input
                            id="goal-description"
                            type="text"
                            value={goalDescription}
                            onChange={(e) => setGoalDescription(e.target.value)}
                            placeholder="e.g., Lower cholesterol"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!goalDescription.trim()}>
                        {goal ? "Save Changes" : "Add Goal"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

