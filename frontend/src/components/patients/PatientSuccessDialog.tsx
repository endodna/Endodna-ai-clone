import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PatientSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onUploadRecords: () => void;
}

export function PatientSuccessDialog({
  open,
  onOpenChange,
  onClose,
  onUploadRecords,
}: Readonly<PatientSuccessDialogProps>) {
  const handleClose = () => {
    onClose();
    onOpenChange(false);
  };

  const handleUploadRecords = () => {
    onUploadRecords();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 md:p-8 max-w-[375px] md:max-w-[640px] w-full">
        <DialogHeader className="space-y-1 md:space-y-4">
          <DialogTitle>
            <h4 className="text-xl leading-[120%] font-semibold">
              Patient added successfully!
            </h4>
          </DialogTitle>
          <DialogDescription className="text-sm font-normal leading-normal text-neutral-500">
            If you have them, you can also upload this patient's medical records
            in the next step.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-row gap-3 sm:gap-0 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="px-4 py-[7.5px] text-sm font-medium leading-normal rounded-lg"
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handleUploadRecords}
            className="px-4 py-[7.5px] bg-violet-700 hover:bg-violet-400 text-neutral-50 rounded-lg"
          >
            <span className="text-sm font-medium leading-normal">
              Upload Records
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


