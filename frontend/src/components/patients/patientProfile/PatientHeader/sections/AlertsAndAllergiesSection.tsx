import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";

interface PatientAlert {
  readonly uuid: string;
  readonly id: string;
  readonly description: string;
  readonly severity?: string | null;
  readonly notes?: string | null;
}

interface PatientAllergy {
  readonly uuid: string;
  readonly id: string;
  readonly allergen: string;
  readonly reactionType?: string | null;
  readonly notes?: string | null;
}

interface AlertsAndAllergiesSectionProps {
  readonly alerts: PatientAlert[] | null | undefined;
  readonly allergies: PatientAllergy[] | null | undefined;
  readonly onAddAlert: () => void;
  readonly onAddAllergy: () => void;
  readonly onEditAlert: (alert: PatientAlert) => void;
  readonly onDeleteAlert: (alert: PatientAlert) => void;
  readonly onEditAllergy: (allergy: PatientAllergy) => void;
  readonly onDeleteAllergy: (allergy: PatientAllergy) => void;
}

export function AlertsAndAllergiesSection({
  alerts,
  allergies,
  onAddAlert,
  onAddAllergy,
  onEditAlert,
  onDeleteAlert,
  onEditAllergy,
  onDeleteAllergy,
}: Readonly<AlertsAndAllergiesSectionProps>) {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="flex w-full items-center justify-between rounded-b-3xl bg-amber/10 px-4 py-4 text-left typo-body-2 text-amber transition data-[state=open]:hidden P-4 md:p-6 hover:text-primary-brand-teal-1"
        >
          <span>Alerts &amp; Allergies</span>
          <span>Show</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="divide-y divide-muted-foreground/40">
        {/* Patient Alerts */}
        <div className="space-y-3 px-4 pb-3 pt-4 md:px-6 md:pt-6 md:pb-4">
          <div className="flex items-center justify-between">
            <h4 className="text-primary-brand-teal-1">Alerts</h4>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 typo-body-3 text-muted-foreground hover:text-foreground"
                onClick={onAddAlert}
              >
                Add Alert
              </Button>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 typo-body-3 text-primary-brand-teal-1"
                >
                  Hide
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
          {alerts && alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.uuid || alert.id}
                  className="flex items-center justify-between gap-2"
                >
                  <p className="pb-1 typo-body-1 typo-body-1-regular text-amber md:pb-2 flex-1">
                    {alert.description}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 rounded-full p-0 text-muted-foreground hover:text-foreground"
                        aria-label={`Options for alert: ${alert.description}`}
                      >
                        <Ellipsis className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => onEditAlert(alert)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                        <span>Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDeleteAlert(alert)}
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
            <p className="typo-body-2 text-foreground">No alerts</p>
          )}
        </div>

        {/* Patient Allergies */}
        <div className="space-y-3 px-4 pb-3 pt-4 md:px-6 md:pt-6 md:pb-4">
          <div className="flex items-center justify-between">
            <h4 className="text-primary-brand-teal-1">Allergies</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 typo-body-3 text-muted-foreground hover:text-foreground"
              onClick={onAddAllergy}
            >
              Add Allergy
            </Button>
          </div>

          {allergies && allergies.length > 0 ? (
            <div className="space-y-2">
              {allergies.map((allergy) => (
                <div
                  key={allergy.uuid || allergy.id}
                  className="flex items-center justify-between gap-2"
                >
                  <p className="pb-1 typo-body-1 typo-body-1-regular text-foreground md:pb-2 flex-1">
                    {allergy.allergen}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 rounded-full p-0 text-muted-foreground hover:text-foreground"
                        aria-label={`Options for allergy: ${allergy.allergen}`}
                      >
                        <Ellipsis className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => onEditAllergy(allergy)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                        <span>Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDeleteAllergy(allergy)}
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
            <p className="typo-body-2 text-foreground">No Allergies</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
