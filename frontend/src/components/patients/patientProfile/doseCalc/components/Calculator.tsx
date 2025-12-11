import { DosingChart } from "./DosingChart";
import { KineticSlope } from "./KineticSlope";

interface CalculatorProps {
  patient?: PatientDetail | null;
  historyData?: PatientDosageHistoryEntry[] | null;
}

export function Calculator({ patient, historyData }: Readonly<CalculatorProps>) {
  return (
    <div className="w-full space-y-4 md:space-y-6">
      <h3 className="typo-h4 text-foreground">Calculator</h3>
      <div className="w-full flex flex-col md:flex-row gap-4 md:gap-6">
        <div className="w-full md:w-1/2 flex flex-col gap-4 md:gap-6">
          <DosingChart
            patient={patient}
            xAxisLabel="Weeks Since Pellet Insertion"
            yAxisLabel="Estradiol (E2), pg/mL"
          />
          <DosingChart
            patient={patient}
            xAxisLabel="Weeks Since Pellet Insertion"
            yAxisLabel="FSH, mIU/mL"
          />
        </div>
        <div className="w-full md:w-1/2 flex items-center min-h-[384px]">
          <KineticSlope patient={patient} historyData={historyData} />
        </div>
      </div>
    </div>
  );
}
