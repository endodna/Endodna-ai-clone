import { AddMedicationModal } from "@/components/patients/patientProfile/AddMedicationModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

    const { data, isLoading, isError, error } = useGetPatientMedications(patientId ?? "", {
        enabled: Boolean(patientId),
    });

    const deleteMedicationMutation = useDeletePatientMedication({
        onSuccess: (response) => {
            if (response.error) {
                toast.error(response.message || "Failed to delete medication");
                return;
            }
            toast.success("Medication deleted");
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

        deleteMedicationMutation.mutate({
            patientId,
            medicationId: medication.id,
        });
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
                onSuccess={() => setSelectedMedication(null)}
            />
        </>
    );
}