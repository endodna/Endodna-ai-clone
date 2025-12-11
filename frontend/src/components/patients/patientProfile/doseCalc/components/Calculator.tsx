import { DosingChart } from "./DosingChart";
import { KineticSlope } from "./KineticSlope";
import { GENDER } from "@/components/constants/patient";
import type { HormoneTypeKey } from "@/store/features/dosing";

interface CalculatorProps {
  patient?: PatientDetail | null;
  historyData?: PatientDosageHistoryEntry[] | null;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export function Calculator({ patient, historyData, activeTab, onTabChange }: Readonly<CalculatorProps>) {
  const patientGender = patient?.gender?.toUpperCase();
  const isMale = patientGender === GENDER.MALE;

  // Map tab ID to hormone type key for males
  const getHormoneTypeKey = (tabId: string): HormoneTypeKey | null => {
    switch (tabId) {
      case "testosterone-t100":
        return "testosterone_100";
      case "testosterone-t200":
        return "testosterone_200";
      case "estradiol":
        return "estradiol";
      default:
        return null;
    }
  };

  const hormoneTypeKey = activeTab ? getHormoneTypeKey(activeTab) : null;

  return (
    <div className="w-full space-y-4 md:space-y-6">
      <h3 className="typo-h4 text-foreground">Calculator</h3>
      <div className="w-full flex flex-col md:flex-row gap-4 md:gap-6">
        <div className="w-full md:w-1/2 flex flex-col gap-4 md:gap-6">
          {isMale ? (
            // For males: Show only one Testosterone chart based on active tab
            <DosingChart
              patient={patient}
              xAxisLabel="Weeks Since Pellet Insertion"
              yAxisLabel="Testosterone, ng/dL"
              hormoneTypeKey={hormoneTypeKey || undefined}
              maxYAxis={1200}
            />
          ) : (
            // For females: Show Estradiol and FSH charts
            <>
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
            </>
          )}
        </div>
        <div className="w-full md:w-1/2 flex items-start">
          <KineticSlope
            patient={patient}
            historyData={historyData}
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
        </div>
      </div>
    </div>
  );
}
