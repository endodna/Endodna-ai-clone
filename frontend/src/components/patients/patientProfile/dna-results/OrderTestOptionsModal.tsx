import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const ORDER_OPTIONS: Array<{ id: DnaOrderType; title: string; description: string }> = [
    {
        id: "ACTIVATE_COLLECTION_KIT",
        title: "Activate Collection Kit",
        description: "Activate an existing collection kit for the patient.",
    },
    {
        id: "SHIP_DIRECTLY_TO_PATIENT",
        title: "Ship Direct to Patient",
        description: "Ship the collection kit directly to the patient's address.",
    },
    {
        id: "PATIENT_SELF_PURCHASE",
        title: "Patient Self-Purchase",
        description: "Notify the patient so they can complete the purchase.",
    },
];

type OrderTestOptionsModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectOption: (option: DnaOrderType) => void;
};

export const OrderTestOptionsModal = ({ open, onOpenChange, onSelectOption }: OrderTestOptionsModalProps) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Order Test</DialogTitle>
                <DialogDescription className="text-base text-neutral-600 pt-2">
                    Choose how you want to proceed with the DNA test.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 md:space-y-3 pt-4">
                {ORDER_OPTIONS.map((option) => (
                    <Button
                        key={option.id}
                        type="button"
                        variant="outline"
                        className="w-full justify-start h-auto py-4 px-4 text-left"
                        onClick={() => onSelectOption(option.id)}
                    >
                        <div className="flex flex-col items-start gap-1">
                            <span className="font-medium">{option.title}</span>
                            <span className="text-sm text-neutral-600 font-normal">{option.description}</span>
                        </div>
                    </Button>
                ))}
            </div>
        </DialogContent>
    </Dialog>
);

