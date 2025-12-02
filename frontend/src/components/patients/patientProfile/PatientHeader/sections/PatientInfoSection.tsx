import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronDown, ChevronUp, Mail, Phone, User } from "lucide-react";
import { InfoRow } from "../components/InfoRow";
import { formatDate, calculateAge } from "@/utils/date.utils";

interface PatientInfoSectionProps {
    readonly fullName: string;
    readonly initials: string;
    readonly photo: string | null | undefined;
    readonly dateOfBirth: string | Date | null | undefined;
    readonly gender: string | null | undefined;
    readonly phoneNumber: string | null | undefined;
    readonly email: string | null | undefined;
    readonly isCollapsed: boolean;
    readonly onToggleCollapse: () => void;
}

export function PatientInfoSection({
    fullName,
    initials,
    photo,
    dateOfBirth,
    gender,
    phoneNumber,
    email,
    isCollapsed,
    onToggleCollapse,
}: Readonly<PatientInfoSectionProps>) {
    const dob = dateOfBirth ? formatDate(dateOfBirth, "MM/DD/YYYY") : "";
    const age = dateOfBirth ? calculateAge(dateOfBirth) : null;
    let dobDisplay: string | null = null;
    if (dob && age !== null) {
        const ageText = age === 1 ? 'year' : 'years';
        dobDisplay = `${dob} (${age} ${ageText})`;
    } else if (dob) {
        dobDisplay = dob;
    }

    const genderDisplay = gender
        ? gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase()
        : null;

    return (
        <div className="space-y-4 px-4 pb-4 pt-4 md:px-6 md:pt-6 md:pb-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 md:gap-4">
                    <Avatar className="h-12 w-12 rounded-full md:h-16 md:w-16">
                        <AvatarImage src={photo ?? undefined} className="rounded-full" alt={fullName} />
                        <AvatarFallback className="rounded-full bg-muted-foreground/30 typo-h4 text-foreground">
                            {initials || "P"}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-foreground">
                            {fullName || "Unnamed patient"}
                        </h2>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={isCollapsed ? "Show patient details" : "Hide patient details"}
                    className="rounded-full p-2"
                    onClick={onToggleCollapse}
                >
                    {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
            </div>

            {!isCollapsed && (
                <div className="space-y-4">
                    <InfoRow icon={Calendar} label="DOB:" value={dobDisplay} />
                    <InfoRow icon={User} label="Gender:" value={genderDisplay} />
                    <InfoRow icon={Phone} label="Phone:" value={phoneNumber} />
                    <InfoRow icon={Mail} label="Email:" value={email} />
                </div>
            )}
        </div>
    );
}

