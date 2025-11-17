import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileUpload, FileUploadHandle } from "@/components/upload/FileUpload";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeUploadDialog, openUploadSuccessDialog, setCurrentPatientId } from "@/store/features/patient";
import { useUploadMedicalRecords } from "@/hooks/useDoctor";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function PatientUploadRecordsDialog() {
  const dispatch = useAppDispatch();
  const { isUploadDialogOpen, currentPatientId } = useAppSelector((state) => state.patientDialog);
  const uploadRef = useRef<FileUploadHandle | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [sessionKey, setSessionKey] = useState(0);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const uploadMutation = useUploadMedicalRecords();

  useEffect(() => {
    if (!isUploadDialogOpen) {
      setFiles([]);
      uploadRef.current?.reset();
      setSessionKey((key) => key + 1);
      dispatch(setCurrentPatientId(null));
      setSubmissionError(null);
    }
  }, [dispatch, isUploadDialogOpen]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      dispatch(closeUploadDialog());
      dispatch(setCurrentPatientId(null));
    }
  };

  const handleUploadSuccess = () => {
    uploadRef.current?.reset();
    dispatch(closeUploadDialog());
    dispatch(openUploadSuccessDialog());
  };

  const handleFinish = async () => {
    if (!files.length || uploadMutation.isPending) {
      return;
    }

    if (currentPatientId === null) {
      setSubmissionError("Missing patient information. Please close and try again.");
      return;
    }

    try {
      uploadRef.current?.setStatus("uploading");
      uploadRef.current?.setProgress(0);
      setSubmissionError(null);

      const response = await uploadMutation.mutateAsync({
        patientId: currentPatientId,
        files,
        onUploadProgress: (event) => {
          if (!event.total) {
            return;
          }
          const progress = Math.round((event.loaded / event.total) * 100);
          uploadRef.current?.setProgress(progress);
        },
      });

      if (response.error) {
        throw new Error(response.message || "Failed to upload medical records.");
      }

      uploadRef.current?.setStatus("uploaded");
      uploadRef.current?.setProgress(100);
      handleUploadSuccess();
    } catch (error: any) {
      uploadRef.current?.setStatus("idle");
      uploadRef.current?.setProgress(0);
      setSubmissionError(
        error?.response?.data?.message || error?.message || "Failed to upload medical records. Please try again.",
      );
    }
  };

  const disableFinish = !files.length || uploadMutation.isPending || currentPatientId === null;

  return (
    <Dialog open={isUploadDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="p-4 md:p-8 max-w-[375px] md:max-w-[640px] w-full">
        <DialogHeader className="space-y-1 md:space-y-2 mb-4 md:mb-6">
          <DialogTitle className="text-xl md:text-2xl font-semibold text-neutral-900">Upload medical records</DialogTitle>
          <DialogDescription className="text-sm md:text-base text-neutral-500">
            Additionally, you can include medical history records if you have them.
          </DialogDescription>
        </DialogHeader>

        {currentPatientId === null ? (
          <p className="mb-4 text-sm text-red-500">Patient information is missing. Please close this dialog and try again.</p>
        ) : null}

        <FileUpload
          key={sessionKey}
          ref={uploadRef}
          dropzoneText="Drag and drop or"
          instructionSuffix="your patient's medical records to upload"
          supportedFileTypes={["PDF", "DOC", "JPEG", "PNG"]}
          accept={[".pdf", ".doc", ".docx", ".jpeg", ".jpg"]}
          uploadButtonLabel="Upload files"
          onFilesChange={setFiles}
        />

        {submissionError ? (
          <Card className="mt-4 border-red-200 bg-red-50">
            <CardContent className="flex items-start gap-2 p-3 text-sm font-medium text-red-600">
              {submissionError}
            </CardContent>
          </Card>
        ) : null}

        <DialogFooter className="mt-8">
          <Button
            type="button"
            className="w-full bg-violet-700 text-white hover:bg-violet-500 md:w-auto"
            disabled={disableFinish}
            onClick={handleFinish}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <span className="text-sm font-medium leading-normal">Finish</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
