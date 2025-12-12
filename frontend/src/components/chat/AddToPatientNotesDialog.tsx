import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCreatePatientChartNote } from "@/hooks/useDoctor";

interface AddToPatientNotesDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly patientId: string;
  readonly content: string;
}

export function AddToPatientNotesDialog({
  open,
  onOpenChange,
  patientId,
  content,
}: Readonly<AddToPatientNotesDialogProps>) {
  const [title, setTitle] = useState("");
  const [notesContent, setNotesContent] = useState(content);

  const createChartNoteMutation = useCreatePatientChartNote({
    onSuccess: (response) => {
      if (response.error) {
        toast.error(response.message || "Failed to add to patient's notes");
        return;
      }
      toast.success("Added to patient's notes successfully");
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add to patient's notes");
    },
  });

  useEffect(() => {
    if (open) {
      setNotesContent(content);
    }
  }, [open, content]);

  const resetForm = () => {
    setTitle("");
    setNotesContent(content);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!createChartNoteMutation.isPending) {
      onOpenChange(nextOpen);
      if (!nextOpen) {
        resetForm();
      }
    }
  };

  const handleSubmit = () => {
    if (!notesContent.trim()) {
      toast.error("Content is required");
      return;
    }

    createChartNoteMutation.mutate({
      patientId,
      payload: {
        title: title.trim() || undefined,
        content: notesContent.trim(),
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add to Patient's Notes</DialogTitle>
          <DialogDescription>
            Add this AI response to the patient's chart notes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for this note"
              disabled={createChartNoteMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={notesContent}
              onChange={(e) => setNotesContent(e.target.value)}
              placeholder="Note content"
              className="min-h-[200px]"
              disabled={createChartNoteMutation.isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={createChartNoteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createChartNoteMutation.isPending || !notesContent.trim()}
          >
            {createChartNoteMutation.isPending ? "Adding..." : "Add to Notes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
