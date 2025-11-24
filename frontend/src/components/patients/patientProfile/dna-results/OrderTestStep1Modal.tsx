import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn, formatAddress } from "@/lib/utils";
import { useGetPatientAddresses, useGetReports } from "@/hooks/useDoctor";
import { Step1Data } from '../tabs/DnaResultsTab';

type OrderTestStep1ModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: string;
    orderType: DnaOrderType;
    onSubmit: (data: Step1Data) => Promise<void>;
    patient?: PatientDetail | null;
    isSubmitting: boolean;
    errorMessage?: string | null;
};


const requiresAddress = (orderType: DnaOrderType) =>
    orderType === "SHIP_DIRECTLY_TO_PATIENT" || orderType === "PATIENT_SELF_PURCHASE";

export const OrderTestStep1Modal = ({
    open,
    onOpenChange,
    patientId,
    orderType,
    onSubmit,
    patient,
    isSubmitting,
    errorMessage,
}: OrderTestStep1ModalProps) => {
    const [barcode, setBarcode] = useState("");
    const [selectedReportId, setSelectedReportId] = useState<string>("");
    const [selectedAddressId, setSelectedAddressId] = useState<string>("");

    const {
        data: reportsResponse,
        isLoading: reportsLoading,
    } = useGetReports(
        { gender: patient?.gender ?? "ALL" },
        { enabled: open },
    );
    const reports = reportsResponse?.data ?? [];

    const {
        data: addressResponse,
        isLoading: addressesLoading,
    } = useGetPatientAddresses(patientId, {
        enabled: open && requiresAddress(orderType),
    });
    const addresses = addressResponse?.data ?? [];

    const patientSummary = useMemo(() => {
        if (!patient) return "Loading patient...";
        const fullName = `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim();
        const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "";
        return dob ? `${fullName} | ${dob}` : fullName;
    }, [patient]);

    const addressRequired = requiresAddress(orderType);
    const canProceed =
        barcode.trim().length > 0 &&
        Boolean(selectedReportId) &&
        (!addressRequired || Boolean(selectedAddressId));

    const renderAddressSelector = () => {
        if (!addressRequired) return null;
        if (addressesLoading) {
            return (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Spinner className="size-4" />
                    Loading addresses...
                </div>
            );
        }
        if (addresses.length === 0) {
            return (
                <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4 text-center">
                    <p className="text-sm text-neutral-600">
                        No addresses found. Please add an address before shipping directly.
                    </p>
                </div>
            );
        }
        return (
            <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
                <SelectTrigger>
                    <SelectValue placeholder="Select address" />
                </SelectTrigger>
                <SelectContent>
                    {addresses.map((address) => (
                        <SelectItem key={address.id} value={address.id}>
                            {formatAddress(address.address)}
                            {address.isPrimary ? " (Primary)" : ""}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    };

    const renderReportCards = () => {
        if (reportsLoading) {
            return (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Spinner className="size-4" />
                    <span className="text-sm font-medium">Loading reports...</span>
                </div>
            );
        }
        if (reports.length === 0) {
            return (
                <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-2 md:p-4 text-center">
                    <p className="text-sm text-neutral-600">No reports available for this patient.</p>
                </div>
            );
        }
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reports.map((report) => {
                    const isSelected = selectedReportId === report.id;
                    return (
                        <Card
                            key={report.id}
                            className={cn(
                                "p-4 cursor-pointer border-2 transition-colors",
                                isSelected
                                    ? "border-violet-700 bg-violet-50"
                                    : "border-neutral-200 hover:border-neutral-300",
                            )}
                            onClick={() => setSelectedReportId(report.id)}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                    <h4 className="font-medium text-sm">{report.title}</h4>
                                    {report.genders.length > 0 && (
                                        <p className="text-xs text-neutral-800 mt-1">
                                            {report.genders.map((gender) => gender).join(", ")}
                                        </p>
                                    )}
                                    {report.description && (
                                        <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                                            {report.description}
                                        </p>
                                    )}
                                    <p className="text-sm font-semibold text-violet-700 mt-2">
                                        ${report.price}
                                    </p>
                                </div>
                                {isSelected && (
                                    <div className="h-5 w-5 rounded-full bg-violet-700 flex items-center justify-center shrink-0">
                                        <div className="h-2 w-2 rounded-full bg-white" />
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>
        );
    };

    const handleSave = async () => {
        if (!canProceed || isSubmitting) return;
        await onSubmit({
            barcode: barcode.trim(),
            reportId: selectedReportId,
            addressId: addressRequired ? selectedAddressId : undefined,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Order DNA Test - Step 1</DialogTitle>
                    <DialogDescription className="text-base text-neutral-600 pt-2">
                        {orderType === "ACTIVATE_COLLECTION_KIT" && "Activate Collection Kit"}
                        {orderType === "SHIP_DIRECTLY_TO_PATIENT" && "Ship Direct to Patient"}
                        {orderType === "PATIENT_SELF_PURCHASE" && "Patient Self-Purchase"}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Patient Details</Label>
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                            <p className="text-sm text-neutral-700">{patientSummary}</p>
                        </div>
                    </div>

                    {addressRequired && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Address *</Label>
                            {renderAddressSelector()}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="barcode" className="text-sm font-medium">
                            Enter Barcode No. *
                        </Label>
                        <Input
                            id="barcode"
                            value={barcode}
                            onChange={(event) => setBarcode(event.target.value)}
                            placeholder="Enter barcode number"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Select Report *</Label>
                        {renderReportCards()}
                    </div>
                </div>

                <DialogFooter className="pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <div className="flex flex-1 items-center justify-end gap-3">
                        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
                        <Button
                            className="bg-violet-700 hover:bg-violet-800"
                            disabled={!canProceed || isSubmitting}
                            onClick={handleSave}
                        >
                            {isSubmitting ? (
                                <>
                                    <Spinner className="size-4" />
                                    <span className="text-sm font-medium">Submitting...</span>
                                </>
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

