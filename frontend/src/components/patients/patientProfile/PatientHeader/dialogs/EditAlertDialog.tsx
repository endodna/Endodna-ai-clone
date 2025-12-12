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
import { useUpdatePatientAlert } from "@/hooks/useDoctor";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface EditAlertDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly patientId: string;
  readonly alert?: { uuid: string; description: string; severity?: string | null; notes?: string | null } | null;
  readonly onSave: () => void;
}

export function EditAlertDialog({
  open,
  onOpenChange,
  patientId,
  alert,
  onSave,
}: Readonly<EditAlertDialogProps>) {
  const [description, setDescription] = useState<string>("");
  const [severity, setSeverity] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const updateAlertMutation = useUpdatePatientAlert({
    onSuccess: () => {
      toast.success("Alert updated successfully");
      onSave();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update alert");
    },
  });

  useEffect(() => {
    if (open && alert) {
      setDescription(alert.description ?? "");
      setSeverity(alert.severity ?? "");
      setNotes(alert.notes ?? "");
    } else if (open) {
      setDescription("");
      setSeverity("");
      setNotes("");
    }
  }, [open, alert]);

  const handleSave = () => {
    if (!alert) return;
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!severity) {
      toast.error("Severity is required");
      return;
    }

    updateAlertMutation.mutate({
      patientId,
      alertId: alert.uuid,
      data: {
        description: description.trim(),
        severity,
        notes: notes.trim() || undefined,
      },
    });
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!alert) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Alert</DialogTitle>
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
          <Button variant="outline" onClick={handleCancel} disabled={updateAlertMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!description.trim() || !severity || updateAlertMutation.isPending}
          >
            {updateAlertMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

