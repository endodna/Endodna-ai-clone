import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreatePatientGoal, useUpdatePatientGoal } from "@/hooks/useDoctor";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface GoalEditDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly goal?: { uuid: string; description: string } | null;
  readonly onSave: (description: string) => void;
  readonly patientId: string;
}
export function GoalEditDialog({
  open,
  onOpenChange,
  goal,
  onSave,
  patientId,
}: Readonly<GoalEditDialogProps>) {
  const [goalDescription, setGoalDescription] = useState<string>("");

  const createHealthGoalMutation = useCreatePatientGoal({
    onError: (error) => {
      const errorMessage = error.message || "Failed to add health goal";

      toast.error(errorMessage);
    },
  });

  const updateHealthGoalMutation = useUpdatePatientGoal({
    onError: (error) => {
        const errorMessage = error.message || "Failed to edit health goal";

        toast.error(errorMessage);
    }
  })

  useEffect(() => {
    if (open) {
      setGoalDescription(goal?.description ?? "");
    } else {
      setGoalDescription("");
    }
  }, [open, goal]);

  const handleSave = () => {
    const description = goalDescription;
    if (!description.trim()) return;

    if(goal) {
        updateHealthGoalMutation.mutate({
            patientId,
            goalId: goal.uuid,
            data: {
                description: description,
                notes: "",
            }
        });
        toast.success("Health Goal updated successfully");
    } else {
        createHealthGoalMutation.mutate({
          patientId,
          data: {
            description: description,
            notes: "",
          },
        });
        toast.success("Health Goal added successfully");
    }

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

