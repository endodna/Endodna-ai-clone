import { useMemo, useState, useEffect } from "react";

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
import { formatOrderTypeDisplay, requiresAddress } from "@/utils/orderType.utils";
import { Step1Data } from '../tabs/DnaResultsTab';
import { AddPatientAddressModal } from "@/components/patients/patientProfile/AddPatientAddressModal";
import { Plus, AlertCircle } from "lucide-react";

type OrderTestStep1ModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: string;
    orderType: string;
    onSubmit: (data: Step1Data) => Promise<void>;
    patient?: PatientDetail | null;
    isSubmitting: boolean;
    errorMessage?: string | null;
};


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
    const [showAddressModal, setShowAddressModal] = useState(false);

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
        isError: addressesError,
        error: addressesErrorDetails,
        refetch: refetchAddresses,
    } = useGetPatientAddresses(patientId, {
        enabled: open && requiresAddress(orderType),
    });
    const addresses = addressResponse?.data ?? [];

    // Auto-select primary address or first address when addresses load
    useEffect(() => {
        if (addresses.length > 0 && !selectedAddressId) {
            const primaryAddress = addresses.find((addr) => addr.isPrimary) ?? addresses[0];
            if (primaryAddress) {
                setSelectedAddressId(primaryAddress.id);
            }
        }
    }, [addresses, selectedAddressId]);

    const patientInfo = useMemo(() => {
        if (!patient) {
            return {
                fullName: "Loading patient...",
                dob: null,
            };
        }
        const fullName = `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim();
        const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : null;
        return {
            fullName,
            dob,
        };
    }, [patient]);

    const addressRequired = requiresAddress(orderType);
    const canProceed =
        barcode.trim().length > 0 &&
        Boolean(selectedReportId) &&
        (!addressRequired || Boolean(selectedAddressId));

    const handleAddressAdded = async () => {
        setShowAddressModal(false);
        const result = await refetchAddresses();
        // Auto-select the newly added address
        if (result.data?.data && result.data.data.length > 0) {
            const newAddress = result.data.data[result.data.data.length - 1];
            setSelectedAddressId(newAddress.id);
        }
    };

    const renderAddressSelector = () => {
        if (!addressRequired) return null;
        if (addressesLoading) {
            return (
                <div className="flex items-center gap-2 typo-body-2 text-muted-foreground">
                    <Spinner className="size-4" />
                    <span>Loading addresses...</span>
                </div>
            );
        }

        if (addressesError) {
            return (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                        <div className="flex-1">
                            <p className="typo-body-2 text-destructive">
                                Failed to load addresses
                            </p>
                            <p className="typo-body-3 text-destructive mt-1">
                                {addressesErrorDetails?.message || addressResponse?.message || "Please try again"}
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => refetchAddresses()}
                                className="mt-2"
                            >
                                Retry
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        if (addresses.length === 0) {
            return (
                <div className="rounded-lg border border-dashed border-muted-foreground p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                            <p className="typo-body-2 text-muted-foreground">
                                No addresses found. Please add an address before shipping directly.
                            </p>
                        </div>
                        <Button
                            size="icon"
                            onClick={() => setShowAddressModal(true)}
                            className="shrink-0"
                            title="Add address"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-2">
                <div className="flex items-start gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                        <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
                            <SelectTrigger className="w-full min-w-0 whitespace-normal py-2 typo-body-2">
                                <SelectValue placeholder="Select address" />
                            </SelectTrigger>
                            <SelectContent className="max-w-[var(--radix-select-trigger-width)]">
                                {addresses.map((address) => (
                                    <SelectItem key={address.id} value={address.id}>
                                        <span className="block break-words max-w-full typo-body-2">
                                            {formatAddress(address.address)}
                                            {address.isPrimary ? " (Primary)" : ""}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowAddressModal(true)}
                        className="shrink-0 mt-0.5"
                        title="Add new address"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    };

    const renderReportCards = () => {
        if (reportsLoading) {
            return (
                <div className="flex items-center gap-2 typo-body-2 text-muted-foreground">
                    <Spinner className="size-4" />
                    <span className="typo-body-2 ">Loading reports...</span>
                </div>
            );
        }
        if (reports.length === 0) {
            return (
                <div className="rounded-lg border border-dashed border-muted-foreground bg-primary-foreground p-2 md:p-4 text-center">
                    <p className="typo-body-2 text-muted-foreground">No reports available for this patient.</p>
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
                                "p-4 cursor-pointer border-2 transition-all duration-300",
                                isSelected
                                    ? "border-primary-brand-teal-1/40 bg-primary/70"
                                    : "border-muted-foreground hover:scale-105 hover:border-primary-brand-teal-1/70",
                            )}
                            onClick={() => setSelectedReportId(report.id)}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                    <h4 className=" typo-body-2">{report.title}</h4>
                                    {report.genders.length > 0 && (
                                        <p className="typo-body-3 text-foreground mt-1">
                                            {report.genders.map((gender) => gender).join(", ")}
                                        </p>
                                    )}
                                    {report.description && (
                                        <p className="typo-body-3 text-muted-foreground mt-1 line-clamp-2">
                                            {report.description}
                                        </p>
                                    )}
                                    <p className="typo-body-2  text-primary-brand-teal-1 mt-2">
                                        ${report.price}
                                    </p>
                                </div>
                                {isSelected && (
                                    <div className="h-5 w-5 rounded-full bg-primary-brand-teal-1 flex items-center justify-center shrink-0">
                                        <div className="h-2 w-2 rounded-full bg-primary-foreground" />
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
            <DialogContent className="max-w-2xl overflow-y-auto overflow-x-hidden">
                <DialogHeader>
                    <DialogTitle className="typo-h4 text-foreground">Order DNA Test - Step 1</DialogTitle>
                    <DialogDescription className="typo-body-1 text-foreground pt-2">
                        {formatOrderTypeDisplay(orderType)}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label className="typo-body-2 ">Patient Details</Label>
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-3 min-w-0">
                            <div className="min-w-0">
                                <p className="typo-body-3 text-neutral-500-old mb-1">Name</p>
                                <p className="typo-body-2 text-neutral-900-old font-medium break-words">
                                    {patientInfo.fullName}
                                </p>
                            </div>
                            {patientInfo.dob && (
                                <div className="min-w-0">
                                    <p className="typo-body-3 text-neutral-500-old mb-1">Date of Birth</p>
                                    <p className="typo-body-2 text-neutral-900-old break-words">{patientInfo.dob}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {addressRequired && (
                        <div className="space-y-2">
                            <Label className="typo-body-2 ">Address *</Label>
                            {renderAddressSelector()}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="barcode" className="typo-body-2 ">
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
                        <Label className="typo-body-2 ">Select Report *</Label>
                        {renderReportCards()}
                    </div>
                </div>

                <DialogFooter className="pt-4">
                    {errorMessage && <p className="typo-body-2 text-red-600">* {errorMessage}</p>}
                    <div className="flex flex-1 items-center justify-end gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            disabled={!canProceed || isSubmitting}
                            onClick={handleSave}
                        >
                            {isSubmitting ? (
                                <>
                                    <Spinner className="size-4" />
                                    <span className="typo-body-2 ">Submitting...</span>
                                </>
                            ) : (
                                <span className="typo-body-2 ">Save</span>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>

            {addressRequired && (
                <AddPatientAddressModal
                    open={showAddressModal}
                    onOpenChange={setShowAddressModal}
                    patientId={patientId}
                    onSuccess={handleAddressAdded}
                />
            )}
        </Dialog>

    );
};

