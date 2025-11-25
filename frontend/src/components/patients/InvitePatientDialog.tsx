import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  closeInvitePatientDialog,
} from "@/store/features/patient";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";

const VARIABLES = [
  { label: "Add Patient's Name", value: "{{ .PatientFirstName }}" },
  { label: "Add Doctor's Name", value: "{{ .DoctorName }}" },
  { label: "Add Clinic's Name", value: "{{ .ClinicName }}" },
];

export function InvitePatientDialog() {
  const dispatch = useAppDispatch();
  const {
    isInvitePatientDialogOpen,
  } = useAppSelector((state) => state.patientDialog);
  const [message, setMessage] = useState("");
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  
  const maxCharacters = 500;
  const minCharacters = 150;
  const characterCount = message.length;
  const contentEditableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isInvitePatientDialogOpen) {
      setMessage("");
      setHasAttemptedSubmit(false);
      if (contentEditableRef.current) {
        contentEditableRef.current.textContent = "";
        contentEditableRef.current.innerHTML = "";
      }
    }
  }, [isInvitePatientDialogOpen]);

  const handleClose = () => {
    dispatch(closeInvitePatientDialog());
    setHasAttemptedSubmit(false);
    setIsSubmitting(false);
    setMessage("");
  };

  const ensureCursorInsideInput = () => {
    const div = contentEditableRef.current;
    if (!div) return null;

    let selection = window.getSelection();
    const range =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    if (!range || !div.contains(range.startContainer)) {
      div.focus();
      selection = window.getSelection();
      selection?.removeAllRanges();
      const newRange = document.createRange();
      const textNode = div.childNodes.length
        ? div.childNodes[div.childNodes.length - 1]
        : div;
      if (textNode.nodeType === Node.TEXT_NODE) {
        newRange.setStart(textNode, textNode.textContent?.length ?? 0);
      } else {
        newRange.setStart(div, div.childNodes.length);
      }
      newRange.collapse(true);
      selection?.addRange(newRange);
      return selection?.getRangeAt(0) ?? null;
    }

    return range;
  };

  const insertVariable = (variableValue: string) => {
    const div = contentEditableRef.current;
    if (!div) return;

    const range = ensureCursorInsideInput();
    if (!range) {
      const text = div.textContent || "";
      const newText = text ? `${text} ${variableValue} ` : `${variableValue} `;
      div.textContent = newText;
      setMessage(newText);
      setTimeout(applyHighlighting, 0);
      return;
    }

    range.deleteContents();
    const text = div.textContent || "";
    const separator = text && !text.endsWith(" ") ? " " : "";
    const textNode = document.createTextNode(`${separator}${variableValue} `);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    const newText = div.textContent || "";
    setMessage(newText);
    setTimeout(applyHighlighting, 0);
  };

  const inlineError = useMemo(() => {
    if (characterCount > maxCharacters) {
      return `Maximum length is ${maxCharacters} characters - ${characterCount}/${maxCharacters}`;
    }
    if (hasAttemptedSubmit && characterCount < minCharacters) {
      return `Minimum length is ${minCharacters} characters - ${characterCount}/${maxCharacters}`;
    }
    return null;
  }, [characterCount, hasAttemptedSubmit]);

  const applyHighlighting = () => {
    const div = contentEditableRef.current;
    if (!div) return;
    
    const text = div.textContent || "";
    let html = text;
    
    VARIABLES.forEach((variable) => {
      // Escape special regex characters, but keep the token format
      const escaped = variable.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'g');
      html = html.replace(regex, '<span class="text-violet-600 font-semibold">$1</span>');
    });
    
    if (div.innerHTML !== html) {
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      div.innerHTML = html;
      
      if (range) {
        try {
          const newRange = document.createRange();
          const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT);
          let node = walker.nextNode();
          let offset = 0;
          
          while (node && offset + node.textContent!.length < range.startOffset) {
            offset += node.textContent!.length;
            node = walker.nextNode();
          }
          
          if (node) {
            newRange.setStart(node, Math.min(range.startOffset - offset, node.textContent!.length));
            newRange.setEnd(node, Math.min(range.endOffset - offset, node.textContent!.length));
            selection?.removeAllRanges();
            selection?.addRange(newRange);
          }
        } catch (e) {
        }
      }
    }
  };

  const handleInput = () => {
    const div = contentEditableRef.current;
    if (!div) return;
    let text = div.textContent || "";
    
    if (text.length > maxCharacters) {
      text = text.substring(0, maxCharacters);
      div.textContent = text;
    }
    
    setMessage(text);
    setTimeout(applyHighlighting, 0);
  };

  const mockSendInvite = async () =>
    new Promise((resolve) => setTimeout(resolve, 1200));

  const handleSendInvite = async () => {
    setHasAttemptedSubmit(true);
    const schema = z
      .string()
      .min(
        minCharacters,
        `Minimum length is ${minCharacters} characters - ${characterCount}/${maxCharacters}`,
      )
      .max(
        maxCharacters,
        `Maximum length is ${maxCharacters} characters - ${characterCount}/${maxCharacters}`,
      );

    const validation = schema.safeParse(message.trim());
    if (!validation.success) {
      return;
    }
    try {
      setIsSubmitting(true);
      await mockSendInvite();
      handleClose();
      setIsSuccessOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isInvitePatientDialogOpen} onOpenChange={handleClose}>
      <DialogContent className="p-4 md:p-6 max-w-[560px] w-full">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-semibold text-neutral-900">
            Invite your patient
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-600">
            Invite with a preformatted email or customize it to your needs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div
            ref={contentEditableRef}
            contentEditable
            onInput={handleInput}
            onBlur={applyHighlighting}
            data-placeholder="Write your invitation..."
            className={`w-full min-h-[220px] p-4 rounded-2xl border resize-none text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 whitespace-pre-wrap break-words ${
              inlineError ? "border-red-500" : "border-neutral-300"
            } text-neutral-900`}
            suppressContentEditableWarning
          />
          <style>{`
            [contenteditable][data-placeholder]:empty:before {
              content: attr(data-placeholder);
              color: #a3a3a3;
              pointer-events: none;
            }
          `}</style>
          <div
            className={`text-xs text-right ${
              inlineError ? "text-red-500" : "text-neutral-500"
            }`}
          >
            {inlineError ?? `${characterCount}/${maxCharacters}`}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-900">
            Email variables
          </p>
          <div className="flex flex-wrap gap-2">
            {VARIABLES.map((variable) => (
              <Button
                key={variable.value}
                type="button"
                variant="outline"
                className="text-xs font-medium text-neutral-700 border-dashed border-neutral-300"
                onClick={() => insertVariable(variable.value)}
              >
                + {variable.label}
              </Button>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="text-sm font-medium rounded-lg"
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-violet-700 hover:bg-violet-600 text-white rounded-lg"
            onClick={handleSendInvite}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send invite"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="max-w-[520px] w-full rounded-3xl shadow-xl p-0 overflow-hidden">
          <div className="flex items-start justify-between px-6 pt-6">
            <DialogTitle className="text-lg font-semibold text-neutral-900">
              Invite your patient
            </DialogTitle>
          </div>
          <DialogDescription className="px-6 text-sm text-neutral-500">
            Patient invited successfully!
          </DialogDescription>
          <div className="px-6 pb-6 pt-4 flex justify-end">
            <Button
              onClick={() => setIsSuccessOpen(false)}
              className="bg-violet-700 hover:bg-violet-600"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

