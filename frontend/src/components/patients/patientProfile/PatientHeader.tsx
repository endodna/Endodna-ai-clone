import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetPatientById } from "@/hooks/useDoctor";
import { cn } from "@/lib/utils";
import { formatDate, calculateAge } from "@/utils/date.utils";
import { Calendar, ChevronDown, ChevronUp, Droplet, Pencil, User } from "lucide-react";
import { useMemo, useState, type ComponentType } from "react";
import { ChatsHistory } from "@/components/sidebar/ChatsHistory";

interface PatientHeaderProps {
    readonly patientId?: string;
    readonly className?: string;
}

interface InfoRowProps {
    readonly icon: ComponentType<{ className?: string }>;
    readonly label: string;
    readonly value?: string | null;
}

function PatientHeaderSkeleton() {
    return (
        <div className="rounded-3xl border border-neutral-100 bg-white divide-y divide-neutral-100">
            {/* Info block */}
            <div className="space-y-6 px-4 pb-3 pt-4 md:px-6 md:pt-6 md:pb-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-[10px]" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
                <div className="space-y-4 pt-4">
                    {[0, 1, 2].map((index) => (
                        <div key={`info-${index}`} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-6 w-6 rounded-full" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Health goals */}
            <div className="space-y-3 px-4 pb-3 pt-4 md:px-6 md:pt-6 md:pb-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-4 w-16" />
                </div>
                <div className="space-y-2">
                    {[0, 1].map((index) => (
                        <Skeleton key={`goal-${index}`} className="h-4 w-full" />
                    ))}
                </div>
            </div>

            {/* Alerts */}
            <div className="space-y-3 px-4 pb-3 pt-4 md:px-6 md:pt-6 md:pb-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-12" />
                </div>
                <div className="space-y-2">
                    {[0, 1].map((index) => (
                        <Skeleton key={`alert-${index}`} className="h-4 w-full" />
                    ))}
                </div>
            </div>

            {/* Allergies */}
            <div className="space-y-2 px-4 pb-3 pt-4 md:px-6 md:pt-6 md:pb-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-32" />
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }: Readonly<InfoRowProps>) {
    return (
        <div className="flex items-center justify-between text-base font-normal leading-normal text-neutral-500">
            <div className="flex items-center gap-2 md:gap-4">
                <span className="flex items-center justify-center rounded-full text-violet-400">
                    <Icon className="h-4 w-4 md:h-6 md:w-6" />
                </span>
                <span>{label}</span>
            </div>
            <span>{value ?? '-'}</span>
        </div>
    );
}

function EmptyStateCard({ message }: { readonly message: string }) {
    return (
        <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-5 text-center text-sm text-neutral-500">
            {message}
        </div>
    );
}

function ErrorState({
    message,
    onRetry,
}: {
    readonly message: string;
    readonly onRetry: () => void;
}) {
    return (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-center">
            <p className="text-sm text-red-700">{message}</p>
            <Button size="sm" className="mt-4" onClick={onRetry}>
                Try again
            </Button>
        </div>
    );
}

function GoalRow({
    goal,
}: {
    readonly goal: PatientDetail["patientGoals"][number];
}) {
    return (
        <div className="flex items-center justify-between pb-1 md:pb-2">
            <span className="text-base font-normal leading-normal text-neutral-500">{goal.description}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#525252]">
                <Pencil className="h-4 md:h-6 w-4 md:w-6" />
            </Button>
        </div>
    );
}

export function PatientHeader({ patientId, className }: Readonly<PatientHeaderProps>) {
    const enabled = Boolean(patientId);
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
    const derivedDetails = useMemo(() => {
        if (!patient) {
            return {
                fullName: "",
                dobDisplay: "",
            };
        }
        const fullName = `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim();

        const dob = patient.dateOfBirth ? formatDate(patient.dateOfBirth) : "";
        const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : null;
        const dobDisplay = dob && age !== null ? `${dob} - Age ${age}` : dob;
        return { fullName, dobDisplay };
    }, [patient]);

    const [isCollapsed, setIsCollapsed] = useState(false);
    return (
        <div className={cn("w-full max-w-[378px]", className)}>
            {!enabled && <EmptyStateCard message="Select a patient to view details." />}
            {enabled && shouldShowSkeleton && <PatientHeaderSkeleton />}
            {enabled && !shouldShowSkeleton && (error || responseError) && (
                <ErrorState
                    message={responseError || error?.message || "Unable to load patient."}
                    onRetry={() => refetch()}
                />
            )}
            {enabled && !shouldShowSkeleton && !error && !responseError && patient && (
                <div className="rounded-3xl border border-neutral-100 bg-white divide-y divide-neutral-100">
                    {/* Patient Info */}
                    <div className="space-y-4 px-4 pb-4 pt-4 md:px-6 md:pt-6 md:pb-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 md:gap-4">
                                <Avatar className="h-12 w-12 rounded-[10px] md:h-16 md:w-16">
                                    <AvatarImage className="rounded-xl" alt={derivedDetails.fullName} />
                                    <AvatarFallback className="rounded-xl bg-neutral-100 text-xl font-semibold text-neutral-700">
                                        {derivedDetails.fullName?.[0] ?? "Patient"}
                                    </AvatarFallback>
                                </Avatar>

                                <div>
                                    <p className="text-3xl font-semibold leading-none text-neutral-900">
                                        {derivedDetails.fullName ?? "Unnamed patient"}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                aria-label={isCollapsed ? "Show patient details" : "Hide patient details"}
                                className="rounded-full  p-2 text-neutral-600 transition hover:bg-neutral-100"
                                onClick={() => setIsCollapsed((prev) => !prev)}
                            >
                                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                            </button>
                        </div>

                        {!isCollapsed && (
                            <div className="space-y-4">
                                <InfoRow icon={User} label="Biological sex:" value={patient.gender} />
                                <InfoRow icon={Calendar} label="Birthday:" value={derivedDetails.dobDisplay} />
                                <InfoRow icon={Droplet} label="Blood type:" value={patient.bloodType} />
                            </div>
                        )}
                    </div>

                    {/* Patient Health Goals */}
                    {!isCollapsed && (
                        <div className="space-y-3 px-4 pb-3 pt-4 md:px-6 md:pt-6 md:pb-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xl font-semibold leading-[120%] text-neutral-900">
                                    Health Goals
                                </h4>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 text-xs font-medium leading-normal text-neutral-700 hover:text-neutral-900"
                                >
                                    Add Goal
                                </Button>
                            </div>
                            {patient.patientGoals?.length ? (
                                <div className="space-y-1 md:space-y-2">
                                    {patient.patientGoals.map((goal) => (
                                        <GoalRow key={goal.uuid || goal.id} goal={goal} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-neutral-400">No health goals added</p>
                            )}
                        </div>
                    )}

                    {!isCollapsed && (
                        <Collapsible>
                            <CollapsibleTrigger asChild>
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between rounded-b-3xl bg-orange-50 px-4 py-4 text-left text-sm font-semibold text-amber-700 transition data-[state=open]:hidden P-4 md:p-6"
                                >
                                    <span>Alerts &amp; Allergies</span>
                                    <span className="text-xs font-medium text-neutral-700">Show</span>
                                </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="divide-y divide-neutral-100">
                                {/* Patient Alerts */}
                                <div className="space-y-3 px-4 pb-3 pt-4 md:px-6 md:pt-6 md:pb-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xl font-semibold leading-[120%] text-amber-700">Alerts</p>
                                        <CollapsibleTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-auto p-0 text-xs font-medium text-neutral-700 hover:text-neutral-700"
                                            >
                                                Hide
                                            </Button>
                                        </CollapsibleTrigger>
                                    </div>
                                    {patient.patientAlerts?.length ? (
                                        <div className="space-y-2">
                                            {patient.patientAlerts.map((alert) => (
                                                <p
                                                    key={alert.uuid || alert.id}
                                                    className="pb-1 text-base font-normal leading-normal text-neutral-500 md:pb-2"
                                                >
                                                    {alert.description}
                                                </p>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-neutral-400">No alerts</p>
                                    )}
                                </div>

                                {/* Patient Allergies */}
                                <div className="space-y-3 px-4 pb-3 pt-4 md:px-6 md:pt-6 md:pb-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xl font-semibold leading-[120%] text-amber-700">
                                            Allergies
                                        </p>
                                    </div>

                                    {patient.patientAllergies?.length ? (
                                        <div className="space-y-2">
                                            {patient.patientAllergies.map((allergy) => (
                                                <p
                                                    key={allergy.uuid || allergy.id}
                                                    className="pb-1 text-base font-normal leading-normal text-neutral-500 md:pb-2"
                                                >
                                                    {allergy.allergen}
                                                </p>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-neutral-400">No Allergies</p>
                                    )}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )}
                </div>
            )}
            {enabled && (
                <div className="mt-4">
                    <ChatsHistory />
                </div>
            )}
        </div>
    );
}
