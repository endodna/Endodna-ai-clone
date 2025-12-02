import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { type ComponentType } from "react";

interface InfoRowProps {
    readonly icon: ComponentType<{ className?: string }>;
    readonly label: string;
    readonly value?: string | null;
    readonly onEdit?: () => void;
    readonly showEdit?: boolean;
}

export function InfoRow({ icon: Icon, label, value, onEdit, showEdit }: Readonly<InfoRowProps>) {
    return (
        <div className="flex items-center justify-between typo-body-1 typo-body-1-regular text-foreground">
            <div className="flex items-center gap-2 md:gap-4">
                <span className="flex items-center justify-center rounded-full text-primary">
                    <Icon className="h-4 w-4 md:h-6 md:w-6" />
                </span>
                <span>{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span>{value ?? '-'}</span>
                {showEdit && onEdit && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 rounded-full p-0"
                        onClick={onEdit}
                        aria-label={`Edit ${label}`}
                    >
                        <Pencil className="h-3 w-3" />
                    </Button>
                )}
            </div>
        </div>
    );
}

