import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useCreatePatientAddress, useUpdatePatientAddress } from "@/hooks/useDoctor";
import { cn } from "@/lib/utils";
import { addressSchema, type AddressFormValues } from "@/schemas/address.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

interface AddPatientAddressModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: string;
    address?: PatientAddress | null;
    onSuccess?: () => void;
}

const defaultValues: AddressFormValues = {
    street: "",
    street2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
};

export function AddPatientAddressModal({
    open,
    onOpenChange,
    patientId,
    address,
    onSuccess,
}: Readonly<AddPatientAddressModalProps>) {
    const isEditing = Boolean(address?.id);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AddressFormValues>({
        resolver: zodResolver(addressSchema),
        defaultValues,
    });

    useEffect(() => {
        if (open) {
            setSubmitError(null);
            reset({
                street: address?.address?.street ?? "",
                street2: address?.address?.street2 ?? "",
                city: address?.address?.city ?? "",
                state: address?.address?.state ?? "",
                zipCode: address?.address?.zipCode ?? "",
                country: address?.address?.country ?? "",
            });
        } else {
            reset(defaultValues);
            setSubmitError(null);
        }
    }, [open, address, reset]);

    const createAddressMutation = useCreatePatientAddress({
        onSuccess: (response) => {
            if (response.error) {
                const errorMessage = response.message || "Failed to add address";
                setSubmitError(errorMessage);
                toast.error(errorMessage);
                return;
            }
            toast.success(response.message ?? "Address added successfully");
            setSubmitError(null);
            onSuccess?.();
            onOpenChange(false);
        },
        onError: (error) => {
            const errorMessage = error.message || "Failed to add address";
            setSubmitError(errorMessage);
            toast.error(errorMessage);
        },
    });

    const updateAddressMutation = useUpdatePatientAddress({
        onSuccess: (response) => {
            if (response.error) {
                const errorMessage = response.message ?? "Failed to update address";
                setSubmitError(errorMessage);
                toast.error(errorMessage);
                return;
            }
            toast.success(response.message ?? "Address updated successfully");
            setSubmitError(null);
            onSuccess?.();
            onOpenChange(false);
        },
        onError: (error) => {
            const errorMessage = error.message || "Failed to update address";
            setSubmitError(errorMessage);
            toast.error(errorMessage);
        },
    });

    const isSubmitting = createAddressMutation.isPending || updateAddressMutation.isPending;

    const getSubmitButtonText = () => {
        if (isSubmitting) {
            return isEditing ? "Saving..." : "Adding...";
        }
        return isEditing ? "Save Changes" : "Add Address";
    };

    const onSubmit = (values: AddressFormValues) => {
        if (!patientId) {
            toast.error("Patient ID is missing");
            return;
        }

        const addressData: PatientAddressDetails = {
            street: values.street.trim(),
            street2: values.street2?.trim() || undefined,
            city: values.city.trim(),
            state: values.state.trim(),
            zipCode: values.zipCode.trim(),
            country: values.country.trim(),
        };

        if (isEditing && address?.id) {
            updateAddressMutation.mutate({
                patientId,
                addressId: address.id,
                data: {
                    address: addressData,
                },
            });
            return;
        }

        createAddressMutation.mutate({
            patientId,
            data: {
                address: addressData,
                isPrimary: false,
            },
        });
    };

    const handleClose = (nextOpen: boolean) => {
        if (!isSubmitting) {
            onOpenChange(nextOpen);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-[600px] w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="typo-h4 text-foreground">
                        {isEditing ? "Edit Address" : "Add Patient Address"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {submitError && (
                        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                                <p className="typo-body-2 text-destructive flex-1">{submitError}</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="street" className="typo-body-2 text-foreground">
                            Street Address *
                        </Label>
                        <Input
                            id="street"
                            placeholder="e.g: 123 Main Street"
                            {...register("street")}
                            className={cn(errors.street && "border-destructive")}
                        />
                        {errors.street && (
                            <p className="typo-body-2 text-destructive">{errors.street.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="street2" className="typo-body-2 text-foreground">
                            Apartment, Suite, etc. (Optional)
                        </Label>
                        <Input
                            id="street2"
                            placeholder="e.g: Apt 4B"
                            {...register("street2")}
                            className={cn(errors.street2 && "border-destructive")}
                        />
                        {errors.street2 && (
                            <p className="typo-body-2 text-destructive">{errors.street2.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city" className="typo-body-2 text-foreground">
                                City *
                            </Label>
                            <Input
                                id="city"
                                placeholder="e.g: New York"
                                {...register("city")}
                                className={cn(errors.city && "border-destructive")}
                            />
                            {errors.city && (
                                <p className="typo-body-2 text-destructive">{errors.city.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="state" className="typo-body-2 text-foreground">
                                State *
                            </Label>
                            <Input
                                id="state"
                                placeholder="e.g: NY"
                                {...register("state")}
                                className={cn(errors.state && "border-destructive")}
                            />
                            {errors.state && (
                                <p className="typo-body-2 text-destructive">{errors.state.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="zipCode" className="typo-body-2 text-foreground">
                                Zip Code *
                            </Label>
                            <Input
                                id="zipCode"
                                placeholder="e.g: 10001"
                                {...register("zipCode")}
                                className={cn(errors.zipCode && "border-destructive")}
                            />
                            {errors.zipCode && (
                                <p className="typo-body-2 text-destructive">{errors.zipCode.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="country" className="typo-body-2 text-foreground">
                                Country *
                            </Label>
                            <Input
                                id="country"
                                placeholder="e.g: United States"
                                {...register("country")}
                                className={cn(errors.country && "border-destructive")}
                            />
                            {errors.country && (
                                <p className="typo-body-2 text-destructive">{errors.country.message}</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-fit px-4 py-2"
                            onClick={() => handleClose(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="w-fit px-4 py-2"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <Spinner className="animate-spin h-4 w-4" />
                                    {getSubmitButtonText()}
                                </span>
                            ) : (
                                getSubmitButtonText()
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

