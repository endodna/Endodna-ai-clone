import { AddMedicationModal } from "@/components/patients/patientProfile/AddMedicationModal";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { useDeletePatientMedication, useGetPatientMedications } from "@/hooks/useDoctor";
import { formatDate } from "@/utils/date.utils";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface MedicationsTabProps {
    readonly patientId?: string;
}

export function MedicationsTab({ patientId }: Readonly<MedicationsTabProps>) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMedication, setSelectedMedication] = useState<PatientMedication | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [medicationToDelete, setMedicationToDelete] = useState<PatientMedication | null>(null);

    const { data, isLoading, isError, error, refetch } = useGetPatientMedications(patientId ?? "", {
        enabled: Boolean(patientId),
    });

    const deleteMedicationMutation = useDeletePatientMedication({
        onSuccess: (response) => {
            if (response.error) {
                toast.error(response.message || "Failed to delete medication");
                return;
            }
            void refetch();
            toast.success(response.message ?? "Medication deleted successfully");
            setIsDeleteDialogOpen(false);
            setMedicationToDelete(null);
        },
        onError: (err) => {
            toast.error(err.message || "Failed to delete medication");
        },
    });

    const medications = data?.data ?? [];

    const lastUpdated = useMemo(() => {
        if (!medications.length) return undefined;
        const latest = [...medications].sort((a, b) => {
            const dateA = new Date(a.createdAt ?? a.startDate ?? 0).getTime();
            const dateB = new Date(b.createdAt ?? b.startDate ?? 0).getTime();
            return dateB - dateA;
        })[0];
        return latest?.createdAt || latest?.startDate;
    }, [medications]);

    const handleAddMedication = () => {
        setSelectedMedication(null);
        setIsModalOpen(true);
    };

    const handleEditMedication = (medication: PatientMedication) => {
        setSelectedMedication(medication);
        setIsModalOpen(true);
    };

    const handleDeleteMedication = (medication: PatientMedication) => {
        if (!patientId || !medication.id) {
            toast.error("Unable to delete medication");
            return;
        }

        setMedicationToDelete(medication);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDeleteMedication = () => {
        if (!patientId || !medicationToDelete?.id) {
            toast.error("Unable to delete medication");
            return;
        }

        deleteMedicationMutation.mutate({
            patientId,
            medicationId: medicationToDelete.id,
        });
    };

    const handleModalSuccess = () => {
        setSelectedMedication(null);
        void refetch();
    };

    const handleDeleteDialogChange = (open: boolean) => {
        if (!deleteMedicationMutation.isPending) {
            setIsDeleteDialogOpen(open);
        }

        if (!open) {
            setMedicationToDelete(null);
        }
    };

    const renderContent = () => {
        const skeletonPlaceholders = ["first", "second", "third"];

        if (isLoading) {
            return (
                <div className="space-y-4">
                    {skeletonPlaceholders.map((key) => (
                        <Skeleton key={`medication-skeleton-${key}`} className="h-12 w-full bg-muted-foreground/20" />
                    ))}
                </div>
            );
        }

        if (isError) {
            return (
                <div className="rounded-xl border border-destructive bg-destructive/5 p-4">
                    <p className="typo-body-2 text-destructive">
                        {error?.message || "Failed to load medications. Please try again later."}
                    </p>
                </div>
            );
        }

        if (!medications.length) {
            return (
                <div className="rounded-lg bg-muted-foreground/20 w-full min-h-[120px] md:min-h-[230px] flex flex-col items-center justify-center gap-1 md:gap-3">
                    <p className="typo-body-2  text-foreground ">Add medications to track patient&apos;s plan.</p>
                    <Button
                        variant="ghost"
                        className="typo-body-2 "
                        onClick={handleAddMedication}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        <span className="text-foreground">Add Medications</span>
                    </Button>
                </div>
            );
        }

        return (
            <div className="space-y-4 md:space-y-6" >
                <div className="flex justify-end mb-2">
                    <Button className="w-fit" onClick={handleAddMedication}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Medications
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="typo-body-2 border-none">
                                <TableHead className="text-foreground text-left">Name</TableHead>
                                <TableHead className="text-foreground text-center ">Dosage</TableHead>
                                <TableHead className="text-foreground text-center">Frequency</TableHead>
                                <TableHead className="text-foreground text-center">Reason</TableHead>
                                <TableHead className="text-right text-foreground ">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {medications.map((medication) => (
                                <TableRow key={medication.id} className="typo-body-2 border-none">
                                    <TableCell className="text-foreground text-left">{medication.drugName}</TableCell>
                                    <TableCell className="text-foreground text-center">{medication.dosage}</TableCell>
                                    <TableCell className="text-foreground text-center">{medication.frequency}</TableCell>
                                    <TableCell className="text-foreground text-center">{medication.reason}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1 md:gap-2">
                                            <Button
                                                variant="ghost"
                                                className="p-2 h-4 w-4"
                                                onClick={() => handleDeleteMedication(medication)}
                                                disabled={deleteMedicationMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4 stroke-[1.5px]" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="p-2 h-4 w-4"
                                                onClick={() => handleEditMedication(medication)}
                                            >
                                                <Pencil className="h-4 w-4 stroke-[1.5px]" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="rounded-lg p-4 md:p-6 bg-primary-foreground space-y-4 md:space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="typo-h5  text-foreground">Current Medications</h3>
                    {lastUpdated && (
                        <span className="typo-body-2  text-muted-foreground">
                            Updated in: {formatDate(lastUpdated)}
                        </span>
                    )}
                </div>

                {renderContent()}

            </div>

            {/* Medication Edit/Add Modal */}
            <AddMedicationModal
                open={isModalOpen}
                onOpenChange={(open) => setIsModalOpen(open)}
                patientId={patientId}
                medication={selectedMedication}
                onSuccess={handleModalSuccess}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogChange}>
                <AlertDialogContent className="max-w-[420px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete medication?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {medicationToDelete
                                ? `You are about to delete ${medicationToDelete.drugName}. This action cannot be undone.`
                                : "This action cannot be undone."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMedicationMutation.isPending}>
                            <span className="typo-body-2 text-foreground">Cancel</span>
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={handleConfirmDeleteMedication}
                            disabled={deleteMedicationMutation.isPending}
                        >
                            {deleteMedicationMutation.isPending ? (
                                <span className="flex items-center gap-2 typo-body-2 text-primary-foreground">
                                    <Spinner className="h-4 w-4" />
                                    <span className="typo-body-2 text-primary-foreground">Deleting...</span>
                                </span>
                            ) : (
                                <span className="typo-body-2 text-primary-foreground">Delete</span>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}