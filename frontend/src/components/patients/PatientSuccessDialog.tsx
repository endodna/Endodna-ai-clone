import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeSuccessDialog, openUploadDialog, setCurrentPatientId } from "@/store/features/patient";
import { toast } from "sonner";

export function PatientSuccessDialog() {
  const dispatch = useAppDispatch();
  const { isSuccessDialogOpen, currentPatientId } = useAppSelector((state) => state.patientDialog);

  const handleClose = () => {
    dispatch(closeSuccessDialog());
    dispatch(setCurrentPatientId(null));
  };

  const handleUploadRecords = () => {
    if (!currentPatientId) {
      toast.error("Unable to determine patient. Please try creating the patient again.");
      return;
    }
    dispatch(closeSuccessDialog());
    dispatch(openUploadDialog());
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  return (
    <Dialog open={isSuccessDialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="p-4 md:p-8 max-w-[375px] md:max-w-[640px] w-full">
        <DialogHeader className="space-y-1 md:space-y-4">
          <DialogTitle>
            <h4>
              Patient added successfully!
            </h4>
          </DialogTitle>
          <DialogDescription className="text-foreground">
            If you have them, you can also upload this patient's medical records
            in the next step.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-row gap-3 sm:gap-0 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="px-4 py-[7.5px] rounded-lg text-foreground"
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handleUploadRecords}
            disabled={!currentPatientId}
            className="px-4 py-[7.5px] bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg disabled:opacity-50 disabled:pointer-events-none"
          >
            <span className="text-primary-foreground">
              Upload Records
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


