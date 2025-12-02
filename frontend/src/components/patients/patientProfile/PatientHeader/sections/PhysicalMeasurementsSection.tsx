import { User, Ruler, Scale } from "lucide-react";
import { InfoRow } from "../components/InfoRow";
import { formatHeight, formatWeight, formatBMI } from "@/utils/patient.utils";

interface PhysicalMeasurementsSectionProps {
    readonly heightCm: number | null | undefined;
    readonly weightKg: number | null | undefined;
    readonly bmi: number | null | undefined;
    readonly onEditHeight: () => void;
    readonly onEditWeight: () => void;
}

export function PhysicalMeasurementsSection({
    heightCm,
    weightKg,
    bmi,
    onEditHeight,
    onEditWeight,
}: Readonly<PhysicalMeasurementsSectionProps>) {
    const formattedHeight = formatHeight(heightCm);
    const formattedWeight = formatWeight(weightKg);
    const formattedBMI = formatBMI(bmi);

    return (
        <div className="space-y-4 px-4 pb-4 pt-4 md:px-6 md:pt-6 md:pb-4">
            <InfoRow
                icon={Ruler}
                label="Height"
                value={formattedHeight}
                onEdit={onEditHeight}
                showEdit={true}
            />
            <InfoRow
                icon={Scale}
                label="Weight"
                value={formattedWeight}
                onEdit={onEditWeight}
                showEdit={true}
            />
            <InfoRow
                icon={User}
                label="BMI"
                value={formattedBMI}
                showEdit={false}
            />
        </div>
    );
}

