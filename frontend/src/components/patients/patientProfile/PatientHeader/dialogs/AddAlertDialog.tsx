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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatePatientAlert } from "@/hooks/useDoctor";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface AddAlertDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly patientId: string;
  readonly onSave: () => void;
}

export function AddAlertDialog({
  open,
  onOpenChange,
  patientId,
  onSave,
}: Readonly<AddAlertDialogProps>) {
  const [description, setDescription] = useState<string>("");
  const [severity, setSeverity] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const createAlertMutation = useCreatePatientAlert({
    onSuccess: () => {
      toast.success("Alert added successfully");
      onSave();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add alert");
    },
  });

  const resetForm = () => {
    setDescription("");
    setSeverity("");
    setNotes("");
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleSave = () => {
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!severity) {
      toast.error("Severity is required");
      return;
    }

    createAlertMutation.mutate({
      patientId,
      data: {
        description: description.trim(),
        severity,
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
          <DialogTitle>Add Alert</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="alert-description" className="typo-body-2 text-foreground">
              Description *
            </label>
            <Input
              id="alert-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Patient has diabetes"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="alert-severity" className="typo-body-2 text-foreground">
              Severity *
            </label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger id="alert-severity">
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="alert-notes" className="typo-body-2 text-foreground">
              Notes
            </label>
            <Textarea
              id="alert-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes (optional)"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={createAlertMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!description.trim() || !severity || createAlertMutation.isPending}
          >
            {createAlertMutation.isPending ? "Adding..." : "Add Alert"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

