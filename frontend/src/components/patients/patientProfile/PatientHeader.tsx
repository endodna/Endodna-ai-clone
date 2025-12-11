import { ChatsHistory } from "@/components/sidebar/ChatsHistory";
import { useGetPatientById, useUpdatePatientInfo } from "@/hooks/useDoctor";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
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
import { AddAlertDialog } from "./PatientHeader/dialogs/AddAlertDialog";
import { AddAllergyDialog } from "./PatientHeader/dialogs/AddAllergyDialog";
import { DeleteAlertConfirmDialog } from "./PatientHeader/dialogs/DeleteAlertConfirmDialog";
import { DeleteAllergyConfirmDialog } from "./PatientHeader/dialogs/DeleteAllergyConfirmDialog";
import { EditAlertDialog } from "./PatientHeader/dialogs/EditAlertDialog";
import { EditAllergyDialog } from "./PatientHeader/dialogs/EditAllergyDialog";
import { GoalEditDialog } from "./PatientHeader/dialogs/GoalEditDialog";
import { HeightEditDialog } from "./PatientHeader/dialogs/HeightEditDialog";
import { WeightEditDialog } from "./PatientHeader/dialogs/WeightEditDialog";
import {
  useDeletePatientAlert,
  useDeletePatientAllergy,
} from "@/hooks/useDoctor";

interface PatientHeaderProps {
  readonly patientId?: string;
  readonly className?: string;
}

export function PatientHeader({
  patientId,
  className,
}: Readonly<PatientHeaderProps>) {
  const enabled = Boolean(patientId);
  const { data, isLoading, isFetching, error, refetch } = useGetPatientById(
    patientId ?? "",
    {
      enabled,
    }
  );

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
    const fullName =
      `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim();
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
  const [editingGoal, setEditingGoal] = useState<{
    uuid: string;
    description: string;
  } | null>(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [allergyDialogOpen, setAllergyDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<{
    uuid: string;
    description: string;
    severity?: string | null;
    notes?: string | null;
  } | null>(null);
  const [editingAllergy, setEditingAllergy] = useState<{
    uuid: string;
    allergen: string;
    reactionType?: string | null;
    notes?: string | null;
  } | null>(null);
  const [deleteAlertDialogOpen, setDeleteAlertDialogOpen] = useState(false);
  const [deleteAllergyDialogOpen, setDeleteAllergyDialogOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<{
    id: string;
    description: string;
  } | null>(null);
  const [allergyToDelete, setAllergyToDelete] = useState<{
    id: string;
    allergen: string;
  } | null>(null);

  // Patient info data
  const patientInfo = patient?.patientInfo;
  const heightCm = patientInfo?.height ?? null;
  const weightKg = patientInfo?.weight ?? null;
  const bmi = patientInfo?.bmi ?? null;

  // Mutations
  const updatePatientInfoMutation = useUpdatePatientInfo({
    onError: (error) => {
      toast.error(error.message || "Failed to update patient info");
    },
  });

  const deleteAlertMutation = useDeletePatientAlert({
    onSuccess: () => {
      toast.success("Alert deleted successfully");
      setDeleteAlertDialogOpen(false);
      setAlertToDelete(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete alert");
    },
  });

  const deleteAllergyMutation = useDeletePatientAllergy({
    onSuccess: () => {
      toast.success("Allergy deleted successfully");
      setDeleteAllergyDialogOpen(false);
      setAllergyToDelete(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete allergy");
    },
  });

  // Handlers
  const handleSaveHeight = async (heightCmValue: number) => {
    if (!patientId) return;
    try {
      const response = await updatePatientInfoMutation.mutateAsync({
        patientId,
        data: { height: heightCmValue },
      });

      if (response.error) {
        toast.error(response.message || "Failed to update patient info");
      } else {
        toast.success("Patient info updated successfully");
        setHeightDialogOpen(false);
      }
    } catch {
      // Error is already handled by onError callback
    }
  };

  const handleSaveWeight = async (weightKgValue: number) => {
    if (!patientId) return;
    try {
      const response = await updatePatientInfoMutation.mutateAsync({
        patientId,
        data: { weight: weightKgValue },
      });

      if (response.error) {
        toast.error(response.message || "Failed to update patient info");
      } else {
        toast.success("Patient info updated successfully");
        setWeightDialogOpen(false);
      }
    } catch {
      // Error is already handled by onError callback
    }
  };

  const handleOpenGoalDialog = (goal?: {
    uuid: string;
    description: string;
  }) => {
    setEditingGoal(goal ?? null);
    setGoalDialogOpen(true);
  };

  const handleSaveGoal = () => {
    setGoalDialogOpen(false);
    setEditingGoal(null);
  };

  const handleEditAlert = (alert: {
    uuid: string;
    description: string;
    severity?: string | null;
    notes?: string | null;
  }) => {
    setEditingAlert(alert);
  };

  const handleDeleteAlert = (alert: { uuid: string; description: string }) => {
    setAlertToDelete({ id: alert.uuid, description: alert.description });
    setDeleteAlertDialogOpen(true);
  };

  const handleConfirmDeleteAlert = async () => {
    if (!patientId || !alertToDelete) {
      return;
    }
    try {
      await deleteAlertMutation.mutateAsync({
        patientId,
        alertId: alertToDelete.id,
      });
    } catch (error) {
      // Error is handled by onError callback
    }
  };

  const handleEditAllergy = (allergy: {
    uuid: string;
    allergen: string;
    reactionType?: string | null;
    notes?: string | null;
  }) => {
    setEditingAllergy(allergy);
  };

  const handleDeleteAllergy = (allergy: { uuid: string; allergen: string }) => {
    setAllergyToDelete({ id: allergy.uuid, allergen: allergy.allergen });
    setDeleteAllergyDialogOpen(true);
  };

  const handleConfirmDeleteAllergy = async () => {
    if (!patientId || !allergyToDelete) {
      return;
    }
    try {
      await deleteAllergyMutation.mutateAsync({
        patientId,
        allergyId: allergyToDelete.id,
      });
    } catch (error) {
      // Error is handled by onError callback
    }
  };

  return (
    <div className={cn("w-full max-w-[378px]", className)}>
      {/* Empty State */}
      {!enabled && (
        <EmptyStateCard message="Select a patient to view details." />
      )}

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
      {enabled &&
        !shouldShowSkeleton &&
        !error &&
        !responseError &&
        patient && (
          <div className="rounded-3xl border border-muted-foreground bg-primary-foreground divide-y divide-muted-foreground/40">
            <PatientInfoSection
              fullName={derivedDetails.fullName}
              initials={derivedDetails.initials}
              photo={patient.photo}
              dateOfBirth={patient.dateOfBirth}
              gender={patient.gender}
              phoneNumber={patient.phoneNumber}
              email={patient.email}
              patientId={patientId}
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
                  onAddGoal={() => handleOpenGoalDialog()}
                  onEditGoal={handleOpenGoalDialog}
                  patientId={patientId}
                />

                <AlertsAndAllergiesSection
                  alerts={patient.patientAlerts}
                  allergies={patient.patientAllergies}
                  onAddAlert={() => setAlertDialogOpen(true)}
                  onAddAllergy={() => setAllergyDialogOpen(true)}
                  onEditAlert={handleEditAlert}
                  onDeleteAlert={handleDeleteAlert}
                  onEditAllergy={handleEditAllergy}
                  onDeleteAllergy={handleDeleteAllergy}
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
        patientId={patientId ?? ""}
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        goal={editingGoal}
        onSave={handleSaveGoal}
      />

      <AddAlertDialog
        patientId={patientId ?? ""}
        open={alertDialogOpen}
        onOpenChange={setAlertDialogOpen}
        onSave={() => {
          refetch();
        }}
      />

      <AddAllergyDialog
        patientId={patientId ?? ""}
        open={allergyDialogOpen}
        onOpenChange={setAllergyDialogOpen}
        onSave={() => {
          refetch();
        }}
      />

      <EditAlertDialog
        patientId={patientId ?? ""}
        open={!!editingAlert}
        onOpenChange={(open) => {
          if (!open) setEditingAlert(null);
        }}
        alert={editingAlert}
        onSave={() => {
          refetch();
        }}
      />

      <EditAllergyDialog
        patientId={patientId ?? ""}
        open={!!editingAllergy}
        onOpenChange={(open) => {
          if (!open) setEditingAllergy(null);
        }}
        allergy={editingAllergy}
        onSave={() => {
          refetch();
        }}
      />

      <DeleteAlertConfirmDialog
        open={deleteAlertDialogOpen}
        onOpenChange={setDeleteAlertDialogOpen}
        alertDescription={alertToDelete?.description}
        onConfirm={handleConfirmDeleteAlert}
        isDeleting={deleteAlertMutation.isPending}
      />

      <DeleteAllergyConfirmDialog
        open={deleteAllergyDialogOpen}
        onOpenChange={setDeleteAllergyDialogOpen}
        allergen={allergyToDelete?.allergen}
        onConfirm={handleConfirmDeleteAllergy}
        isDeleting={deleteAllergyMutation.isPending}
      />
    </div>
  );
}
