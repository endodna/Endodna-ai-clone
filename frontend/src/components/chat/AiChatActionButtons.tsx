import { useState } from "react";
import { Copy, ThumbsUp, ThumbsDown, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AddToPatientNotesDialog } from "./AddToPatientNotesDialog";

interface AiChatActionButtonsProps {
  readonly messageId: string;
  readonly messageContent: string;
  readonly patientId?: string | null;
  readonly className?: string;
  readonly onThumbsUp?: () => void;
  readonly onThumbsDown?: () => void;
}

export function AiChatActionButtons({
  messageId,
  messageContent,
  patientId,
  className,
  onThumbsUp,
  onThumbsDown,
}: Readonly<AiChatActionButtonsProps>) {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isAddToNotesDialogOpen, setIsAddToNotesDialogOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopiedMessageId(messageId);
      toast.success("Copied to clipboard");
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy");
    }
  };

  const handlePrintToPDF = () => {
    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print");
      return;
    }

    // Convert markdown to HTML (basic conversion)
    const markdownToHtml = (md: string) => {
      return md
        .replace(/^# (.*$)/gim, "<h1>$1</h1>")
        .replace(/^## (.*$)/gim, "<h2>$1</h2>")
        .replace(/^### (.*$)/gim, "<h3>$1</h3>")
        .replace(/^\* (.*$)/gim, "<li>$1</li>")
        .replace(/^- (.*$)/gim, "<li>$1</li>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/\n\n/g, "</p><p>")
        .replace(/\n/g, "<br>");
    };

    const htmlContent = markdownToHtml(messageContent);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AI Chat Response</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              line-height: 1.6;
              color: #333;
            }
            h1, h2, h3 {
              margin-top: 1.5em;
              margin-bottom: 0.5em;
              font-weight: 600;
            }
            h1 { font-size: 1.75em; }
            h2 { font-size: 1.5em; }
            h3 { font-size: 1.25em; }
            ul, ol {
              margin: 1em 0;
              padding-left: 2em;
            }
            li {
              margin: 0.5em 0;
            }
            p {
              margin: 1em 0;
            }
            strong {
              font-weight: 600;
            }
            em {
              font-style: italic;
            }
            @media print {
              body {
                padding: 20px;
              }
              @page {
                margin: 1cm;
              }
            }
          </style>
        </head>
        <body>
          <p>${htmlContent}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      // Close window after a delay to allow print dialog to appear
      setTimeout(() => {
        printWindow.close();
      }, 500);
    }, 250);
  };

  const handleThumbsUp = () => {
    onThumbsUp?.();
    // TODO: Implement feedback API call
  };

  const handleThumbsDown = () => {
    onThumbsDown?.();
    // TODO: Implement feedback API call
  };

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2 mt-4 pt-4 border-t border-muted-foreground",
          className
        )}
      >
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center h-8 w-8 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
          aria-label="Copy"
        >
          <Copy className="h-4 w-4" />
        </button>
        {copiedMessageId === messageId && (
          <span className="text-xs text-muted-foreground">Copied</span>
        )}

        {patientId && (
          <button
            type="button"
            onClick={() => setIsAddToNotesDialogOpen(true)}
            className="flex items-center justify-center h-8 w-8 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            aria-label="Add to patient's notes"
          >
            <FileText className="h-4 w-4" />
          </button>
        )}

        <button
          type="button"
          onClick={handlePrintToPDF}
          className="flex items-center justify-center h-8 w-8 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
          aria-label="Print to PDF"
        >
          <Printer className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleThumbsUp}
          className="flex items-center justify-center h-8 w-8 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
          aria-label="Thumbs up"
        >
          <ThumbsUp className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleThumbsDown}
          className="flex items-center justify-center h-8 w-8 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
          aria-label="Thumbs down"
        >
          <ThumbsDown className="h-4 w-4" />
        </button>
      </div>

      {patientId && (
        <AddToPatientNotesDialog
          open={isAddToNotesDialogOpen}
          onOpenChange={setIsAddToNotesDialogOpen}
          patientId={patientId}
          content={messageContent}
        />
      )}
    </>
  );
}
