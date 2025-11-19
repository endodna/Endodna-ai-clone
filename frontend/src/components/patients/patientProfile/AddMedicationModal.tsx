import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { useCreatePatientMedication, useUpdatePatientMedication } from "@/hooks/useDoctor";
import { toast } from "sonner";
import { medicationSchema, type MedicationFormValues } from "@/schemas/medication.schema";

interface AddMedicationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId?: string;
    medication?: PatientMedication | null;
    onSuccess?: () => void;
}

const defaultValues: MedicationFormValues = {
    drugName: "",
    dosage: "",
    frequency: "",
    reason: "",
    notes: ""
};

export function AddMedicationModal({
    open,
    onOpenChange,
    patientId,
    medication,
    onSuccess,
}: Readonly<AddMedicationModalProps>) {
    const isEditing = Boolean(medication?.id);
    const getSubmitLabel = (pending: boolean, editing: boolean) => {
        if (pending) return "Saving...";
        return editing ? "Save changes" : "Add Medication";
    };

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<MedicationFormValues>({
        resolver: zodResolver(medicationSchema),
        defaultValues,
    });

    useEffect(() => {
        if (open) {
            reset({
                drugName: medication?.drugName ?? "",
                dosage: medication?.dosage ?? "",
                frequency: medication?.frequency ?? "",
                reason: medication?.reason ?? "",
                notes: medication?.notes ?? "",
            });
        } else {
            reset(defaultValues);
        }
    }, [open, medication, reset]);

    const createMedicationMutation = useCreatePatientMedication({
        onSuccess: (response) => {
            if (response.error) {
                toast.error(response.message || "Failed to add medication");
                return;
            }
            toast.success("Medication added");
            onSuccess?.();
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(error.message || "Failed to add medication");
        },
    });

    const updateMedicationMutation = useUpdatePatientMedication({
        onSuccess: (response) => {
            if (response.error) {
                toast.error(response.message || "Failed to update medication");
                return;
            }
            toast.success("Medication updated");
            onSuccess?.();
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update medication");
        },
    });

    const isSubmitting = createMedicationMutation.isPending || updateMedicationMutation.isPending;

    const onSubmit = (values: MedicationFormValues) => {
        if (!patientId) {
            toast.error("Patient ID is missing");
            return;
        }

        const payload: CreatePatientMedicationPayload = {
            ...values,
            notes: values.notes?.trim() ? values.notes : undefined,
        };

        if (isEditing && medication?.id) {
            updateMedicationMutation.mutate({
                patientId,
                medicationId: medication.id,
                payload,
            });
            return;
        }

        createMedicationMutation.mutate({
            patientId,
            payload,
        });
    };

    const handleClose = (nextOpen: boolean) => {
        if (!isSubmitting) {
            onOpenChange(nextOpen);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-[375px] md:max-w-[640px] w-full p-4 md:p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-neutral-900">
                        {isEditing ? "Edit Medication" : "Add Medication"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 md:space-y-4">
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label htmlFor="drugName" className="text-sm font-medium text-neutral-950">Name *</label>
                            <Input
                                id="drugName"
                                placeholder="e.g: Ibuprofen"
                                {...register("drugName")}
                                className={cn(errors.drugName && "border-red-500", "max-w-[484px] w-full")}
                            />
                        </div>
                        {errors.drugName && (
                            <p className="text-sm text-red-500 ml-auto">{errors.drugName.message}</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label htmlFor="dosage" className="text-sm font-medium text-neutral-950">Dosage *</label>
                            <Input
                                id="dosage"
                                placeholder="e.g: 200-400 mg"
                                {...register("dosage")}
                                className={cn(errors.dosage && "border-red-500", "max-w-[484px] w-full")}
                            />
                        </div>
                        {errors.dosage && <p className="text-sm text-red-500 mt-1 md:mt-0">{errors.dosage.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label htmlFor="frequency" className="text-sm font-medium text-neutral-950">Frequency *</label>
                            <Input
                                id="frequency"
                                placeholder="e.g: Every 4 to 6 hours"
                                {...register("frequency")}
                                className={cn(errors.frequency && "border-red-500", "max-w-[484px] w-full")}
                            />
                        </div>
                        {errors.frequency && <p className="text-sm text-red-500 mt-1 md:mt-0 ml-auto">{errors.frequency.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label htmlFor="reason" className="text-sm font-medium text-neutral-950">Reason *</label>
                            <Input
                                id="reason"
                                placeholder="e.g: Pain management"
                                {...register("reason")}
                                className={cn(errors.reason && "border-red-500", "max-w-[484px] w-full")}
                            />
                        </div>
                        {errors.reason && <p className="text-sm text-red-500 mt-1 md:mt-0 ml-auto">{errors.reason.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                        <label htmlFor="notes" className="text-sm font-medium text-neutral-950">Notes</label>
                        <Textarea
                            id="notes"
                            placeholder="Add optional notes"
                            rows={3}
                            {...register("notes")}
                            className="resize-none max-w-[484px] w-full"
                        />
                        </div>
                        {errors.notes && <p className="text-sm text-red-500 mt-1 md:mt-0">{errors.notes.message}</p>}
                    </div>

                    <DialogFooter className="flex flex-end gap-1 md:gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-fit px-2 md:px-4 py-1 md:py-[7.5px]"
                            onClick={() => handleClose(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="w-fit px-2 md:px-4 py-1 md:py-[7.5px] bg-violet-700" disabled={isSubmitting}>
                            {getSubmitLabel(isSubmitting, isEditing)}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

