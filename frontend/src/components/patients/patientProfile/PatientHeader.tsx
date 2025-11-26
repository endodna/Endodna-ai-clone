import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetPatientById } from "@/hooks/useDoctor";
import { cn } from "@/lib/utils";
import { formatDate, calculateAge } from "@/utils/date.utils";
import { Calendar, ChevronDown, ChevronUp, Mail, Phone, User } from "lucide-react";
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
    const skeletonBg = "bg-neutral-200";
    const skeletonHighlight = "bg-neutral-100";

    return (
        <div className="rounded-3xl border border-neutral-100 bg-white divide-y divide-neutral-100">
            {/* Info block */}
            <div className="space-y-6 px-4 pb-3 pt-4 md:px-6 md:pt-6 md:pb-4">
                <div className="flex items-center gap-4">
                    <Skeleton className={`h-16 w-16 rounded-full ${skeletonBg} ${skeletonHighlight}`} />
                    <div className="flex-1 space-y-2">
                        <Skeleton className={`h-6 w-40 ${skeletonBg} ${skeletonHighlight}`} />
                        <Skeleton className={`h-4 w-24 ${skeletonBg} ${skeletonHighlight}`} />
                    </div>
                </div>
                <div className="space-y-4 pt-4">
                    {[0, 1, 2].map((index) => (
                        <div key={`info-${index}`} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Skeleton className={`h-6 w-6 rounded-full ${skeletonBg} ${skeletonHighlight}`} />
                                <Skeleton className={`h-4 w-24 ${skeletonBg} ${skeletonHighlight}`} />
                            </div>
                            <Skeleton className={`h-4 w-24 ${skeletonBg} ${skeletonHighlight}`} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Alerts */}
            <div className="space-y-3 px-4 pb-3 pt-4 md:px-6 md:pt-6 md:pb-4">
                <div className="flex items-center justify-between">
                    <Skeleton className={`h-5 w-24 ${skeletonBg} ${skeletonHighlight}`} />
                    <Skeleton className={`h-4 w-12 ${skeletonBg} ${skeletonHighlight}`} />
                </div>
                <div className="space-y-2">
                    {[0, 1].map((index) => (
                        <Skeleton key={`alert-${index}`} className={`h-4 w-full ${skeletonBg} ${skeletonHighlight}`} />
                    ))}
                </div>
            </div>

            {/* Allergies */}
            <div className="space-y-2 px-4 pb-3 pt-4 md:px-6 md:pt-6 md:pb-4">
                <Skeleton className={`h-5 w-24 ${skeletonBg} ${skeletonHighlight}`} />
                <Skeleton className={`h-4 w-32 ${skeletonBg} ${skeletonHighlight}`} />
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }: Readonly<InfoRowProps>) {
    return (
        <div className="flex items-center justify-between typo-body-1   text-neutral-500-old">
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
        <div className="rounded-3xl border border-dashed border-muted-foreground bg-primary-foreground p-5 text-center typo-body-2 text-foreground">
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
        <div className="rounded-3xl border border-destructive p-5 text-center">
            <p className="typo-body-2 text-destructive">{message}</p>
            <Button size="sm" className="mt-4" onClick={onRetry}>
                <span className="text-primary-foreground">Try again</span>
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
                initials: "",
                dobDisplay: "",
            };
        }
        const fullName = `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim();
        const initials = fullName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

        const dob = patient.dateOfBirth ? formatDate(patient.dateOfBirth, "MM/DD/YYYY") : "";
        const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : null;
        // Format: DOB: MM/DD/YYYY (age years)
        let dobDisplay: string | null = null;
        if (dob && age !== null) {
            const ageText = age === 1 ? 'year' : 'years';
            dobDisplay = `${dob} (${age} ${ageText})`;
        } else if (dob) {
            dobDisplay = dob;
        }
        return { fullName, initials, dobDisplay };
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
                <div className="rounded-3xl border border-muted-foreground bg-primary-foreground divide-y divide-muted-foreground/40">
                    {/* Patient Info */}
                    <div className="space-y-4 px-4 pb-4 pt-4 md:px-6 md:pt-6 md:pb-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 md:gap-4">
                                <Avatar className="h-12 w-12 rounded-full md:h-16 md:w-16">
                                    <AvatarImage src={patient.photo ?? undefined} className="rounded-full" alt={derivedDetails.fullName} />
                                    <AvatarFallback className="rounded-full bg-muted-foreground/30 typo-h4 text-foreground">
                                        {derivedDetails.initials || "P"}
                                    </AvatarFallback>
                                </Avatar>

                                <div>
                                    <p className="typo-h2  leading-none text-foreground">
                                        {derivedDetails.fullName ?? "Unnamed patient"}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={isCollapsed ? "Show patient details" : "Hide patient details"}
                                className="rounded-full p-2"
                                onClick={() => setIsCollapsed((prev) => !prev)}
                            >
                                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                            </Button>
                        </div>

                        {!isCollapsed && (
                            <div className="space-y-4">
                                <InfoRow icon={Calendar} label="DOB:" value={derivedDetails.dobDisplay} />
                                <InfoRow
                                    icon={User}
                                    label="Gender:"
                                    value={patient.gender
                                        ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1).toLowerCase()
                                        : null
                                    }
                                />
                                <InfoRow icon={Phone} label="Phone:" value={patient.phoneNumber} />
                                <InfoRow icon={Mail} label="Email:" value={patient.email} />
                            </div>
                        )}
                    </div>

                    {!isCollapsed && (
                        <Collapsible>
                            <CollapsibleTrigger asChild>
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between rounded-b-3xl bg-orange-50 px-4 py-4 text-left typo-body-2  text-amber-700 transition data-[state=open]:hidden P-4 md:p-6"
                                >
                                    <span>Alerts &amp; Allergies</span>
                                    <span className="typo-body-3  text-foreground hover:text-primary">Show</span>
                                </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="divide-y divide-muted-foreground/40">
                                {/* Patient Alerts */}
                                <div className="space-y-3 px-4 pb-3 pt-4 md:px-6 md:pt-6 md:pb-4">
                                    <div className="flex items-center justify-between">
                                        <p className="typo-h4  leading-[120%] text-amber-700">Alerts</p>
                                        <CollapsibleTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-auto p-0 typo-body-3  text-foreground hover:text-primary"
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
                                                    className="pb-1 typo-body-1   text-foreground md:pb-2"
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
                                        <p className="typo-h4  leading-[120%] text-amber-700">
                                            Allergies
                                        </p>
                                    </div>

                                    {patient.patientAllergies?.length ? (
                                        <div className="space-y-2">
                                            {patient.patientAllergies.map((allergy) => (
                                                <p
                                                    key={allergy.uuid || allergy.id}
                                                    className="pb-1 typo-body-1   text-foreground md:pb-2"
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
                    )}
                </div>
            )}
            {enabled && (
                <div className="mt-4">
                    <ChatsHistory patientId={patientId} />
                </div>
            )}
        </div>
    );
}
