import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useConstants } from "@/contexts/ConstantsContext";
import { formatOrderTypeDisplay } from "@/utils/orderType.utils";

type OrderTestOptionsModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectOption: (option: string) => void;
};

export const OrderTestOptionsModal = ({ open, onOpenChange, onSelectOption }: OrderTestOptionsModalProps) => {
    const { constants } = useConstants();

    // Get order types directly from constants
    const orderTypes = useMemo(() => {
        if (!constants?.orderType || !Array.isArray(constants.orderType) || constants.orderType.length === 0) {
            return [];
        }
        return constants.orderType;
    }, [constants]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="typo-h4 text-foreground">Order Test</DialogTitle>
                    <DialogDescription className="typo-body-1 text-foreground pt-2">
                        Choose how you want to proceed with the DNA test.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 md:space-y-3 pt-4">
                    {orderTypes.length === 0 ? (
                        <p className="typo-body-2 text-foreground text-center py-4">No order types available</p>
                    ) : (
                        orderTypes.map((orderType) => (
                            <Button
                                key={orderType}
                                type="button"
                                className="w-full justify-start h-auto py-4 px-4 text-left"
                                onClick={() => onSelectOption(orderType)}
                            >
                                <span>{formatOrderTypeDisplay(orderType)}</span>
                            </Button>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

