import { useMemo } from "react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { useGetPatientAddresses, useGetReports } from "@/hooks/useDoctor";

import { formatAddress } from "@/lib/utils";
import { Step1Data } from '../tabs/DnaResultsTab';

type OrderTestStep2ModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: string;
    orderType: DnaOrderType;
    step1Data: Step1Data;
    onConfirm: () => void;
    onCancel: () => void;
    isSubmitting: boolean;
    patient?: PatientDetail | null;
};

export const OrderTestStep2Modal = ({
    open,
    onOpenChange,
    patientId,
    orderType,
    step1Data,
    onConfirm,
    onCancel,
    isSubmitting,
    patient,
}: OrderTestStep2ModalProps) => {
    const { data: reportsResponse } = useGetReports({ gender: patient?.gender ?? "ALL" }, { enabled: open });
    const reports = reportsResponse?.data ?? [];
    const selectedReport = reports.find((report) => report.id === step1Data.reportId);

    const { data: addressResponse } = useGetPatientAddresses(patientId, {
        enabled: open && Boolean(step1Data.addressId),
    });
    const addresses = addressResponse?.data ?? [];
    const selectedAddress = addresses.find((address) => address.id === step1Data.addressId);

    const patientName = useMemo(() => {
        if (!patient) return "N/A";
        return `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim();
    }, [patient]);

    const addressDisplay = useMemo(() => {
        if (!selectedAddress?.address) return "N/A";
        return formatAddress(selectedAddress.address);
    }, [selectedAddress]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Confirm Order</DialogTitle>
                    <DialogDescription className="text-base text-neutral-600 pt-2">
                        Review the order before confirming.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Patient Details</Label>
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                            <p className="text-sm text-neutral-700">{patientName}</p>
                        </div>
                    </div>

                    {orderType === "SHIP_DIRECTLY_TO_PATIENT" && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Shipping Address</Label>
                            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                                <p className="text-sm text-neutral-700">{addressDisplay}</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Barcode</Label>
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                            <p className="text-sm text-neutral-700">{step1Data.barcode}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Selected Report</Label>
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                            <p className="text-sm font-medium text-neutral-900">{selectedReport?.title ?? "N/A"}</p>
                            {selectedReport?.description && (
                                <p className="text-xs text-neutral-600 mt-1">{selectedReport.description}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Amount to pay</Label>
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-neutral-900">
                                    ${selectedReport?.price ?? "0.00"}
                                </span>
                            </div>
                            <div className="pt-3 border-t border-neutral-200 space-y-1 text-sm text-neutral-600">
                                <div className="flex justify-between">
                                    <span>Net Amount:</span>
                                    <span>${selectedReport?.price ?? "0.00"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax:</span>
                                    <span>$0.00</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-4">
                    <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-violet-700 hover:bg-violet-800"
                        disabled={isSubmitting}
                        onClick={onConfirm}
                    >
                        {isSubmitting ? (
                            <>
                                <Spinner className="size-4" />
                                <span className="text-sm font-medium">Confirming order...</span>
                            </>
                        ) : (
                            <span className="text-sm font-medium">Confirm</span>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

