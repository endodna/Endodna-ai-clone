import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetPatientGoals, useDeletePatientGoal } from "@/hooks/useDoctor";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/components/constants/QueryKeys";
import { DeleteGoalConfirmDialog } from "../dialogs/DeleteGoalConfirmDialog";

interface PatientGoal {
  readonly uuid: string;
  readonly id: string;
  readonly description: string;
}

interface HealthGoalsSectionProps {
  readonly onAddGoal: () => void;
  readonly onEditGoal: (goal: { uuid: string; description: string }) => void;
  readonly patientId?: string;
}

export function HealthGoalsSection({
  onAddGoal,
  onEditGoal,
  patientId,
}: Readonly<HealthGoalsSectionProps>) {
  const queryClient = useQueryClient();
  const { data: healthGoals, isLoading } = useGetPatientGoals(patientId);
  const goals = useMemo(() => healthGoals?.data, [healthGoals]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<{
    id: string;
    description: string;
  } | null>(null);

  const deleteGoalMutation = useDeletePatientGoal({
    onSuccess: () => {
      toast.success("Health goal deleted successfully");
      setDeleteDialogOpen(false);
      setGoalToDelete(null);
      // Invalidate and refetch the goals list
      if (patientId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.patients.goals.list(patientId),
        });
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete health goal");
    },
  });

  const handleDeleteClick = (goalId: string, goalDescription: string) => {
    if (!patientId) {
      toast.error("Patient ID is required");
      return;
    }
    setGoalToDelete({ id: goalId, description: goalDescription });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!patientId || !goalToDelete) {
      return;
    }

    try {
      await deleteGoalMutation.mutateAsync({
        patientId,
        goalId: goalToDelete.id,
      });
    } catch (error) {
      // Error is handled by onError callback
    }
  };

  if (isLoading) return null;

  return (
    <div className="space-y-3 px-4 pb-4 pt-4 md:px-6 md:pt-6 md:pb-4">
      <div className="flex items-center justify-between">
        <h4 className="typo-body-1 font-semibold text-foreground">
          Health Goals
        </h4>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 typo-body-3 text-muted-foreground hover:text-foreground"
          onClick={onAddGoal}
        >
          Add Goal
        </Button>
      </div>
      {Array.isArray(goals) && goals.length > 0 ? (
        <div className="space-y-2">
          {goals.map((goal: PatientGoal) => (
            <div
              key={goal.uuid || goal.id}
              className="flex items-center justify-between gap-2"
            >
              <p className="typo-body-1 typo-body-1-regular text-foreground flex-1">
                {goal.description}
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 rounded-full p-0 text-muted-foreground hover:text-foreground"
                    aria-label={`Options for goal: ${goal.description}`}
                  >
                    <Ellipsis className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() =>
                      onEditGoal({
                        uuid: goal.uuid,
                        description: goal.description,
                      })
                    }
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                    <span>Rename</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleDeleteClick(goal.uuid || goal.id, goal.description)
                    }
                    disabled={deleteGoalMutation.isPending}
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      ) : (
        <p className="typo-body-2 typo-body-2-regular text-foreground">
          No health goals
        </p>
      )}

      <DeleteGoalConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        goalDescription={goalToDelete?.description}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteGoalMutation.isPending}
      />
    </div>
  );
}
