import { ChatsHistory } from "@/components/sidebar/ChatsHistory";
import { useGetPatientById, useUpdatePatientInfo } from "@/hooks/useDoctor";
import { queryKeys } from "@/components/constants/QueryKeys";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Components
import { EmptyStateCard } from "./PatientHeader/components/EmptyStateCard";
import { ErrorState } from "./PatientHeader/components/ErrorState";
import { PatientHeaderSkeleton } from "./PatientHeader/components/PatientHeaderSkeleton";
import { AlertsAndAllergiesSection } from "./PatientHeader/sections/AlertsAndAllergiesSection";
import { HealthGoalsSection } from "./PatientHeader/sections/HealthGoalsSection";
import { PatientInfoSection } from "./PatientHeader/sections/PatientInfoSection";
import { PhysicalMeasurementsSection } from "./PatientHeader/sections/PhysicalMeasurementsSection";

// Dialogs
import { GoalEditDialog } from "./PatientHeader/dialogs/GoalEditDialog";
import { HeightEditDialog } from "./PatientHeader/dialogs/HeightEditDialog";
import { WeightEditDialog } from "./PatientHeader/dialogs/WeightEditDialog";

interface PatientHeaderProps {
    readonly patientId?: string;
    readonly className?: string;
}

export function PatientHeader({ patientId, className }: Readonly<PatientHeaderProps>) {
    const enabled = Boolean(patientId);
    const queryClient = useQueryClient();
    const {
        data,
        isLoading,
        isFetching,
        error,
        refetch,
    } = useGetPatientById(patientId ?? "", {
        enabled,
    });

    const responseError = data?.error ? data.message : null;
    const patient = data?.data ?? null;
    const shouldShowSkeleton = isLoading || (isFetching && !patient);

    // Derived patient details
    const derivedDetails = useMemo(() => {
        if (!patient) {
            return {
                fullName: "",
                initials: "",
            };
        }
        const fullName = `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim();
        const initials = fullName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

        return { fullName, initials };
    }, [patient]);

    // UI State
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [heightDialogOpen, setHeightDialogOpen] = useState(false);
    const [weightDialogOpen, setWeightDialogOpen] = useState(false);
    const [goalDialogOpen, setGoalDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<{ uuid: string; description: string } | null>(null);

    // Patient info data
    const patientInfo = patient?.patientInfo;
    const heightCm = patientInfo?.height ?? null;
    const weightKg = patientInfo?.weight ?? null;
    const bmi = patientInfo?.bmi ?? null;

    // Mutations
    const updatePatientInfoMutation = useUpdatePatientInfo({
        onSuccess: (response, variables) => {
            if (response.error) {
                toast.error(response.message || "Failed to update patient info");
                return;
            }
            toast.success("Patient info updated successfully");
            setHeightDialogOpen(false);
            setWeightDialogOpen(false);
            
            // Invalidate and refetch patient data to update UI immediately
            queryClient.invalidateQueries({
                queryKey: queryKeys.doctor.patients.detail(variables.patientId),
            });
        },
    });

    // Handlers
    const handleSaveHeight = async (heightCmValue: number) => {
        if (!patientId) return;
        updatePatientInfoMutation.mutate({
            patientId,
            data: { height: heightCmValue },
        });
    };

    const handleSaveWeight = async (weightKgValue: number) => {
        if (!patientId) return;
        updatePatientInfoMutation.mutate({
            patientId,
            data: { weight: weightKgValue },
        });
    };

    const handleOpenGoalDialog = (goal?: { uuid: string; description: string }) => {
        setEditingGoal(goal ?? null);
        setGoalDialogOpen(true);
    };

    const handleSaveGoal = () => {
        setGoalDialogOpen(false);
        setEditingGoal(null);
    };

    return (
        <div className={cn("w-full max-w-[378px]", className)}>
            {/* Empty State */}
            {!enabled && <EmptyStateCard message="Select a patient to view details." />}

            {/* Loading State */}
            {enabled && shouldShowSkeleton && <PatientHeaderSkeleton />}

            {/* Error State */}
            {enabled && !shouldShowSkeleton && (error || responseError) && (
                <ErrorState
                    message={responseError || error?.message || "Unable to load patient."}
                    onRetry={() => refetch()}
                />
            )}

            {/* Patient Content */}
            {enabled && !shouldShowSkeleton && !error && !responseError && patient && (
                <div className="rounded-3xl border border-muted-foreground bg-primary-foreground divide-y divide-muted-foreground/40">
                    <PatientInfoSection
                        fullName={derivedDetails.fullName}
                        initials={derivedDetails.initials}
                        photo={patient.photo}
                        dateOfBirth={patient.dateOfBirth}
                        gender={patient.gender}
                        phoneNumber={patient.phoneNumber}
                        email={patient.email}
                        isCollapsed={isCollapsed}
                        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
                    />

                    {!isCollapsed && (
                        <>
                            <PhysicalMeasurementsSection
                                heightCm={heightCm}
                                weightKg={weightKg}
                                bmi={bmi}
                                onEditHeight={() => setHeightDialogOpen(true)}
                                onEditWeight={() => setWeightDialogOpen(true)}
                            />

                            <HealthGoalsSection
                                goals={patient.patientGoals}
                                onAddGoal={() => handleOpenGoalDialog()}
                                onEditGoal={handleOpenGoalDialog}
                            />

                            <AlertsAndAllergiesSection
                                alerts={patient.patientAlerts}
                                allergies={patient.patientAllergies}
                            />
                        </>
                    )}
                </div>
            )}

            {/* Chats History */}
            {enabled && (
                <div className="mt-4">
                    <ChatsHistory patientId={patientId} />
                </div>
            )}

            {/* Dialogs */}
            <HeightEditDialog
                open={heightDialogOpen}
                onOpenChange={setHeightDialogOpen}
                initialHeightCm={heightCm}
                onSave={handleSaveHeight}
                isSaving={updatePatientInfoMutation.isPending}
            />

            <WeightEditDialog
                open={weightDialogOpen}
                onOpenChange={setWeightDialogOpen}
                initialWeightKg={weightKg}
                onSave={handleSaveWeight}
                isSaving={updatePatientInfoMutation.isPending}
            />

            <GoalEditDialog
                open={goalDialogOpen}
                onOpenChange={setGoalDialogOpen}
                goal={editingGoal}
                onSave={handleSaveGoal}
            />
        </div>
    );
}
