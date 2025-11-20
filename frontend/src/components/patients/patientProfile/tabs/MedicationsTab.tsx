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
                        <Skeleton key={`medication-skeleton-${key}`} className="h-12 w-full" />
                    ))}
                </div>
            );
        }

        if (isError) {
            return (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-700">
                        {error?.message || "Failed to load medications. Please try again later."}
                    </p>
                </div>
            );
        }

        if (!medications.length) {
            return (
                <div className="rounded-lg bg-neutral-100 w-full min-h-[120px] md:min-h-[230px] flex flex-col items-center justify-center gap-1 md:gap-3">
                    <p className="text-sm font-normal text-neutral-600 leading-normal">Add medications to track patient&apos;s plan.</p>
                    <Button
                        variant="ghost"
                        className="text-sm font-medium"
                        onClick={handleAddMedication}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        <span className="text-neutral-700">Add Medications</span>
                    </Button>
                </div>
            );
        }

        return (
            <div className="space-y-4 md:space-y-6" >
                <div className="flex justify-end mb-2">
                    <Button className="bg-violet-700 text-white hover:bg-primary/90 w-fit" onClick={handleAddMedication}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Medications
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="text-sm border-none">
                                <TableHead className="text-neutral-950 font-medium text-left">Name</TableHead>
                                <TableHead className="text-neutral-950 font-medium text-center ">Dosage</TableHead>
                                <TableHead className="text-neutral-950 font-medium text-center">Frequency</TableHead>
                                <TableHead className="text-neutral-950 font-medium text-center">Reason</TableHead>
                                <TableHead className="text-right text-neutral-950 font-medium">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {medications.map((medication) => (
                                <TableRow key={medication.id} className="text-sm border-none">
                                    <TableCell className="text-neutral-950 font-normal text-left">{medication.drugName}</TableCell>
                                    <TableCell className="text-neutral-950 font-normal text-center">{medication.dosage}</TableCell>
                                    <TableCell className="text-neutral-950 font-normal text-center">{medication.frequency}</TableCell>
                                    <TableCell className="text-neutral-950 font-normal text-center">{medication.reason}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1 md:gap-2">
                                            <Button
                                                variant="ghost"
                                                className="p-2 h-4 w-4 text-[#525252] hover:text-neutral-950"
                                                onClick={() => handleDeleteMedication(medication)}
                                                disabled={deleteMedicationMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4 stroke-[1.5px]" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="p-2 h-4 w-4 text-[#525252] hover:text-neutral-950"
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
            <div className="rounded-lg p-4 md:p-6 bg-white space-y-4 md:space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900">Current Medications</h3>
                    {lastUpdated && (
                        <span className="text-sm font-normal text-neutral-500">
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
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-600/90"
                            onClick={handleConfirmDeleteMedication}
                            disabled={deleteMedicationMutation.isPending}
                        >
                            {deleteMedicationMutation.isPending ? (
                                <span className="flex items-center gap-2">
                                    <Spinner className="h-4 w-4" />
                                    Deleting...
                                </span>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}