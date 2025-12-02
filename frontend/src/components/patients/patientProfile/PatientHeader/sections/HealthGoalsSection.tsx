import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface PatientGoal {
    readonly uuid: string;
    readonly id: string;
    readonly description: string;
}

interface HealthGoalsSectionProps {
    readonly goals: PatientGoal[] | null | undefined;
    readonly onAddGoal: () => void;
    readonly onEditGoal: (goal: { uuid: string; description: string }) => void;
}

export function HealthGoalsSection({
    goals,
    onAddGoal,
    onEditGoal,
}: Readonly<HealthGoalsSectionProps>) {
    return (
        <div className="space-y-3 px-4 pb-4 pt-4 md:px-6 md:pt-6 md:pb-4">
            <div className="flex items-center justify-between">
                <h4 className="typo-body-1 font-semibold text-foreground">Health Goals</h4>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 typo-body-3 text-muted-foreground hover:text-foreground"
                    onClick={onAddGoal}
                >
                    Add Goal
                </Button>
            </div>
            {goals && goals.length > 0 ? (
                <div className="space-y-2">
                    {goals.map((goal) => (
                        <div key={goal.uuid || goal.id} className="flex items-center justify-between">
                            <p className="typo-body-1 typo-body-1-regular text-foreground">
                                {goal.description}
                            </p>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 rounded-full p-0"
                                onClick={() => onEditGoal({ uuid: goal.uuid, description: goal.description })}
                                aria-label={`Edit goal: ${goal.description}`}
                            >
                                <Pencil className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="typo-body-2 typo-body-2-regular text-foreground">No health goals</p>
            )}
        </div>
    );
}

