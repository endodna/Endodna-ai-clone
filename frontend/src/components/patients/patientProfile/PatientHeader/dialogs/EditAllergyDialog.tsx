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
import { useUpdatePatientAllergy } from "@/hooks/useDoctor";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface EditAllergyDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly patientId: string;
  readonly allergy?: { uuid: string; allergen: string; reactionType?: string | null; notes?: string | null } | null;
  readonly onSave: () => void;
}

export function EditAllergyDialog({
  open,
  onOpenChange,
  patientId,
  allergy,
  onSave,
}: Readonly<EditAllergyDialogProps>) {
  const [allergen, setAllergen] = useState<string>("");
  const [reactionType, setReactionType] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const updateAllergyMutation = useUpdatePatientAllergy({
    onSuccess: () => {
      toast.success("Allergy updated successfully");
      onSave();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update allergy");
    },
  });

  useEffect(() => {
    if (open && allergy) {
      setAllergen(allergy.allergen ?? "");
      setReactionType(allergy.reactionType ?? "");
      setNotes(allergy.notes ?? "");
    } else if (open) {
      setAllergen("");
      setReactionType("");
      setNotes("");
    }
  }, [open, allergy]);

  const handleSave = () => {
    if (!allergy) return;
    if (!allergen.trim()) {
      toast.error("Allergen is required");
      return;
    }
    if (!reactionType.trim()) {
      toast.error("Reaction type is required");
      return;
    }

    updateAllergyMutation.mutate({
      patientId,
      allergyId: allergy.uuid,
      data: {
        allergen: allergen.trim(),
        reactionType: reactionType.trim(),
        notes: notes.trim() || undefined,
      },
    });
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!allergy) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Allergy</DialogTitle>
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
          <Button variant="outline" onClick={handleCancel} disabled={updateAllergyMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!allergen.trim() || !reactionType.trim() || updateAllergyMutation.isPending}
          >
            {updateAllergyMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

