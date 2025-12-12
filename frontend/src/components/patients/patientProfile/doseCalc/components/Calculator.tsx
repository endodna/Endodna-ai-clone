import { PatientTestosteroneChart } from "./PatientTestosteroneChart";
import { PatientEstradiolChart } from "./PatientEstradiolChart";
// import { PatientFshChart } from "./PatientFshChart";
import { KineticSlope } from "./KineticSlope";
import { GENDER } from "@/components/constants/patient";

interface CalculatorProps {
  patient?: PatientDetail | null;
  historyData?: PatientDosageHistoryEntry[] | null;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export function Calculator({ patient, historyData, activeTab, onTabChange }: Readonly<CalculatorProps>) {
  const patientGender = patient?.gender?.toUpperCase();
  const isMale = patientGender === GENDER.MALE;

  return (
    <div className="w-full space-y-4 md:space-y-6">
      <h3 className="typo-h4 text-foreground">Calculator</h3>
      <div className="w-full flex flex-col md:flex-row gap-4 md:gap-6">
        <div className="w-full md:w-1/2 flex flex-col gap-4 md:gap-6">
          {isMale ? (
            // For males: Show PatientTestosteroneChart, PatientEstradiolChart, and PatientFshChart
            <>
              <PatientTestosteroneChart
                patient={patient}
                xAxisLabel="Weeks Since Pellet Insertion"
                yAxisLabel="Testosterone, ng/dL"
                activeTab={activeTab}
              />
            </>
          ) : (
            // For females: Show charts based on active tab
            <>
              {activeTab === "testosterone-t100" ? (
                // If Testosterone tab is selected, show only PatientTestosteroneChart
                <PatientTestosteroneChart
                  patient={patient}
                  xAxisLabel="Weeks Since Pellet Insertion"
                  yAxisLabel="Testosterone, ng/dL"
                  activeTab={activeTab}
                />
              ) : activeTab === "estradiol" ? (
                // If Estradiol tab is selected, show PatientEstradiolChart and PatientFshChart
                <>
                  <PatientEstradiolChart
                    patient={patient}
                    xAxisLabel="Weeks Since Pellet Insertion"
                    yAxisLabel="Estradiol (E2), pg/mL"
                    activeTab={activeTab}
                  />
                  {/* <PatientFshChart
                    patient={patient}
                    xAxisLabel="Weeks Since Pellet Insertion"
                    yAxisLabel="FSH, mIU/mL"
                    activeTab={activeTab}
                  /> */}
                </>
              ) : (
                // Default: Show PatientTestosteroneChart if no tab is selected
                <PatientTestosteroneChart
                  patient={patient}
                  xAxisLabel="Weeks Since Pellet Insertion"
                  yAxisLabel="Testosterone, ng/dL"
                  activeTab={activeTab}
                />
              )}
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
