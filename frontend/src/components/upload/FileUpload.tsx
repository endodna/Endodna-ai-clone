import {
  ChangeEvent,
  DragEvent,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useId,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type UploadStatus = "idle" | "uploading" | "uploaded";

export interface FileUploadHandle {
  reset: () => void;
  getFiles: () => File[];
  getStatus: () => UploadStatus;
  setStatus: (status: UploadStatus) => void;
  setProgress: (value: number) => void;
}

export interface FileUploadProps {
  accept?: string[];
  allowMultiple?: boolean;
  supportedFileTypes?: string[];
  dropzoneText?: string;
  instructionSuffix?: string;
  dropzoneSubtext?: string;
  uploadButtonLabel?: string;
  onFilesChange?: (files: File[]) => void;
  onStatusChange?: (status: UploadStatus) => void;
}

export const FileUpload = forwardRef<FileUploadHandle, FileUploadProps>(function FileUpload(
  {
    accept,
    allowMultiple = true,
    supportedFileTypes,
    dropzoneText = "Drag and drop or",
    instructionSuffix = "your files to upload",
    dropzoneSubtext,
    uploadButtonLabel = "Upload files",
    onFilesChange,
    onStatusChange,
  },
  ref,
) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();

  const normalizedAccept = useMemo(
    () => accept?.map((type) => type.trim().toLowerCase()).filter(Boolean) ?? [],
    [accept],
  );

  const supportedTypesText = supportedFileTypes?.join(", ");

  useImperativeHandle(
    ref,
    () => ({
      reset: () => resetState(),
      getFiles: () => files,
      getStatus: () => uploadStatus,
      setStatus: (nextStatus: UploadStatus) => {
        setUploadProgress((prev) => (nextStatus === "idle" ? 0 : prev));
        setUploadStatus(nextStatus);
      },
      setProgress: (value: number) => {
        setUploadProgress(Math.max(0, Math.min(100, value)));
      },
    }),
    [files, uploadStatus],
  );

  const resetState = useCallback(() => {
    setUploadProgress(0);
    setIsDragging(false);
    setRejectionMessage(null);
    setUploadStatus("idle");
    setFiles([]);
  }, []);

  useEffect(() => {
    onStatusChange?.(uploadStatus);
  }, [uploadStatus, onStatusChange]);

  useEffect(() => {
    onFilesChange?.(files);
  }, [files, onFilesChange]);

  const isFileAccepted = useCallback(
    (file: File) => {
      if (!normalizedAccept.length) {
        return true;
      }
      const fileExtension = file.name.includes(".") ? `.${file.name.split(".").pop()?.toLowerCase()}` : "";
      const fileType = file.type?.toLowerCase() ?? "";

      return normalizedAccept.some((rule) => {
        if (rule === "*") {
          return true;
        }
        if (rule.startsWith(".")) {
          return fileExtension === rule;
        }
        if (rule.endsWith("/*")) {
          const prefix = rule.replace("/*", "");
          return fileType.startsWith(`${prefix}/`);
        }
        return fileType === rule;
      });
    },
    [normalizedAccept],
  );

  const handleFilesAdded = useCallback(
    (incomingFiles: File[]) => {
      if (!incomingFiles.length) {
        return;
      }

      const acceptedFiles: File[] = [];
      const rejectedFiles: string[] = [];

      for (const file of incomingFiles) {
        if (isFileAccepted(file)) {
          acceptedFiles.push(file);
        } else {
          rejectedFiles.push(file.name);
        }
      }

      if (rejectedFiles.length) {
        setRejectionMessage(`Unsupported file type: ${rejectedFiles.join(", ")}`);
      } else {
        setRejectionMessage(null);
      }

      if (!acceptedFiles.length) {
        return;
      }

      setFiles((prev) => {
        const updatedFiles = allowMultiple ? [...prev, ...acceptedFiles] : [acceptedFiles[0]];
        return updatedFiles;
      });
      setUploadStatus("idle");
      setUploadProgress(0);
    },
    [allowMultiple, isFileAccepted],
  );

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      handleFilesAdded(Array.from(selectedFiles));
      event.target.value = "";
    }
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(event.dataTransfer.files);
    handleFilesAdded(droppedFiles);
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (event.currentTarget.contains(event.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (fileName: string) => {
    setFiles((prev) => {
      const updatedFiles = prev.filter((file) => file.name !== fileName);
      if (!updatedFiles.length) {
        setUploadStatus("idle");
        setUploadProgress(0);
      }
      return updatedFiles;
    });
  };

  const showProgress = uploadStatus === "uploading";
  const showFileList = files.length > 0;

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border border-neutral-200">
        <CardContent className={cn("p-4 md:p-8 rounded-3xl",
          isDragging ? " border-violet-500 bg-violet-50/80" : "border-neutral-200 ",
          "focus-within:ring-2 focus-within:ring-violet-500 focus-within:ring-offset-2"
        )}>
          <label
            htmlFor={inputId}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-4 text-center transition-colors"
            )}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <UploadCloud className="h-6 w-6 text-neutral-600" aria-hidden />
            </span>

            <div className="flex flex-col gap-2">
              <span className="text-sm md:text-base font-semibold text-neutral-950 leading-normal">
                {dropzoneText}{" "}
                <span className="text-violet-600 underline-offset-2">choose</span>{" "}
                {instructionSuffix}
              </span>
              {dropzoneSubtext && <span className="text-xs md:text-sm font-normal text-neutral-500">{dropzoneSubtext}</span>}
              {supportedTypesText &&
                <span className="text-xs md:text-sm font-normal text-neutral-500">Supported file types: {supportedTypesText}</span>
              }
            </div>

            <Button
              type="button"
              variant="outline"
              className="px-4 py-[7.5px] text-neutral-950 font-medium text-sm leading-normal"
              onClick={(event) => {
                event.preventDefault();
                triggerFilePicker();
              }}
            >
              {uploadButtonLabel}
            </Button>
          </label>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        className="hidden"
        accept={normalizedAccept.join(",") || undefined}
        multiple={allowMultiple}
        onChange={handleFileInputChange}
      />

      <div className="space-y-1">
        {showProgress ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-800">Upload progress</p>
            <Progress value={uploadProgress} className="h-3" />
          </div>
        ) : null}

        {showFileList ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-800">Files</p>
            <div className="space-y-1">
              {files.map((file) => (
                <Card key={file.name} className="border border-neutral-200 shadow-none">
                  <CardContent className="flex items-center justify-between gap-3 px-1 md:px-2 py-0">
                    <div className="text-xs font-semibold leading-normal text-neutral-700">
                      {file.name}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-neutral-500 hover:text-red-600"
                      onClick={() => handleRemoveFile(file.name)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      <span className="sr-only">Remove file</span>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}

        {rejectionMessage && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-[10px] p-2 text-xs font-semibold text-red-500">
              <AlertCircle className="h-5 w-5" aria-hidden />
              <span>{rejectionMessage}</span>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
});

