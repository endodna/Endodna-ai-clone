import { DosingChart } from "./DosingChart";
import { KineticSlope } from "./KineticSlope";

interface CalculatorProps {
    patient?: PatientDetail | null;
}

export function Calculator({ patient }: Readonly<CalculatorProps>) {
    return (
        <div className="w-full space-y-4 md:space-y-6">
            <h3 className="typo-h4 text-foreground">Calculator</h3>
            <div className="w-full flex flex-col md:flex-row md:justify-between gap-4 md:gap-6">
                <DosingChart patient={patient} />
                <KineticSlope patient={patient} />
            </div>
        </div>
    );
}