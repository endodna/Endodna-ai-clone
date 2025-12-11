import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

interface DeleteConversationConfirmDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly conversationTitle?: string;
  readonly onConfirm: () => Promise<void>;
  readonly isDeleting?: boolean;
}

export function DeleteConversationConfirmDialog({
  open,
  onOpenChange,
  conversationTitle,
  onConfirm,
  isDeleting = false,
}: Readonly<DeleteConversationConfirmDialogProps>) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Conversation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="typo-body-2 text-foreground">
            Are you sure you want to delete this conversation?
          </p>
          {conversationTitle && (
            <div className="rounded-lg bg-muted p-3">
              <p className="typo-body-2 font-medium text-foreground">
                {conversationTitle}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4 animate-spin" />
                Deleting...
              </span>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

