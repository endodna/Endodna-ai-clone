import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PatientAlert {
    readonly uuid: string;
    readonly id: string;
    readonly description: string;
}

interface PatientAllergy {
    readonly uuid: string;
    readonly id: string;
    readonly allergen: string;
}

interface AlertsAndAllergiesSectionProps {
    readonly alerts: PatientAlert[] | null | undefined;
    readonly allergies: PatientAllergy[] | null | undefined;
}

export function AlertsAndAllergiesSection({
    alerts,
    allergies,
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
                    {alerts && alerts.length > 0 ? (
                        <div className="space-y-2">
                            {alerts.map((alert) => (
                                <p
                                    key={alert.uuid || alert.id}
                                    className="pb-1 typo-body-1 typo-body-1-regular text-amber md:pb-2"
                                >
                                    {alert.description}
                                </p>
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
                    </div>

                    {allergies && allergies.length > 0 ? (
                        <div className="space-y-2">
                            {allergies.map((allergy) => (
                                <p
                                    key={allergy.uuid || allergy.id}
                                    className="pb-1 typo-body-1 typo-body-1-regular text-foreground md:pb-2"
                                >
                                    {allergy.allergen}
                                </p>
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

