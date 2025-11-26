import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeUploadSuccessDialog, setCurrentPatientId } from "@/store/features/patient";

export function UploadRecordsSuccessDialog() {
  const dispatch = useAppDispatch();
  const { isUploadSuccessDialogOpen } = useAppSelector((state) => state.patientDialog);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      dispatch(closeUploadSuccessDialog());
      dispatch(setCurrentPatientId(null));
    }
  };

  const handleClose = () => {
    dispatch(closeUploadSuccessDialog());
    dispatch(setCurrentPatientId(null));
  };

  return (
    <Dialog open={isUploadSuccessDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[375px] md:max-w-[420px] p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            <h4>Medical records added successfully!</h4>
          </DialogTitle>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            type="button"
            className="w-fit hover:bg-primary/80 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleClose}
          >
            <span className="text-primary-foreground">Close</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


