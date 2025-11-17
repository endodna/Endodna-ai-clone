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
          <DialogTitle className="text-lg md:text-xl font-semibold text-neutral-900">
            Medical records added successfully!
          </DialogTitle>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            type="button"
            className="w-full bg-violet-700 text-white hover:bg-violet-500 md:w-auto"
            onClick={handleClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


