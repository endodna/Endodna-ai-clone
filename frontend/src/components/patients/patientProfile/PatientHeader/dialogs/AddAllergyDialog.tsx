import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePatientAllergy } from "@/hooks/useDoctor";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface AddAllergyDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly patientId: string;
  readonly onSave: () => void;
}

export function AddAllergyDialog({
  open,
  onOpenChange,
  patientId,
  onSave,
}: Readonly<AddAllergyDialogProps>) {
  const [allergen, setAllergen] = useState<string>("");
  const [reactionType, setReactionType] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const createAllergyMutation = useCreatePatientAllergy({
    onSuccess: () => {
      toast.success("Allergy added successfully");
      onSave();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add allergy");
    },
  });

  const resetForm = () => {
    setAllergen("");
    setReactionType("");
    setNotes("");
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleSave = () => {
    if (!allergen.trim()) {
      toast.error("Allergen is required");
      return;
    }
    if (!reactionType.trim()) {
      toast.error("Reaction type is required");
      return;
    }

    createAllergyMutation.mutate({
      patientId,
      data: {
        allergen: allergen.trim(),
        reactionType: reactionType.trim(),
        notes: notes.trim() || undefined,
      },
    });
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Allergy</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="allergy-allergen" className="typo-body-2 text-foreground">
              Allergen *
            </label>
            <Input
              id="allergy-allergen"
              type="text"
              value={allergen}
              onChange={(e) => setAllergen(e.target.value)}
              placeholder="e.g., Peanut"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="allergy-reaction" className="typo-body-2 text-foreground">
              Reaction Type *
            </label>
            <Input
              id="allergy-reaction"
              type="text"
              value={reactionType}
              onChange={(e) => setReactionType(e.target.value)}
              placeholder="e.g., Anaphylaxis"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="allergy-notes" className="typo-body-2 text-foreground">
              Notes
            </label>
            <Textarea
              id="allergy-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes (optional)"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={createAllergyMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!allergen.trim() || !reactionType.trim() || createAllergyMutation.isPending}
          >
            {createAllergyMutation.isPending ? "Adding..." : "Add Allergy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

