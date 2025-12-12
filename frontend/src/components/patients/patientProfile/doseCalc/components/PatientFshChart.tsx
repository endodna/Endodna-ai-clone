import { useMemo, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { GENDER } from "@/components/constants/patient";

interface PatientFshChartProps {
  patient?: PatientDetail | null;
  xAxisLabel?: string;
  yAxisLabel?: string;
  activeTab?: string;
}

interface ChartDataPoint {
  days: number;
  baselineFsh: number;
  selectedDoseFsh: number | null;
}

interface ChartCalculations {
  chartData: ChartDataPoint[];
  xAxisTicks: number[];
  yAxisTicks: number[];
  maxDays: number;
  maxDosage: number;
  rePelletWindowStartDays: number;
  rePelletWindowEndDays: number;
}

// Helper function to calculate re-pellet days for males
function calculateRePelletDays(patientGender?: string | null): number {
  const gender = patientGender?.toUpperCase();

  if (gender === GENDER.MALE) {
    // 5.5 months = 5 months + 15 days ≈ 165 days
    return 165;
  } else if (gender === GENDER.FEMALE) {
    // 3.5 months = 3 months + 15 days ≈ 105 days
    return 105;
  }
  // Default to 85 days if gender is not available
  return 85;
}

// Helper function to calculate re-pellet window
function calculateRePelletWindow(rePelletDays: number): {
  startDays: number;
  endDays: number;
} {
  // Window is 4 weeks (28 days) before re-pellet date
  const startDays = Math.max(0, rePelletDays - 28);
  const endDays = rePelletDays;
  return { startDays, endDays };
}

// Helper function to calculate FSH inversely from Estradiol
// When Estradiol is at baseline (low), FSH is at baseline (high)
// When Estradiol is at peak (high), FSH is at lowest (low)
function calculateInverseFsh(
  estradiolValue: number,
  estradiolBaseline: number,
  estradiolPeak: number,
  fshBaseline: number
): number {
  // Handle case where Estradiol is 0 or very low (at re-pellet)
  if (estradiolValue <= 0) {
    return fshBaseline;
  }

  // If Estradiol is at or below baseline, FSH is at baseline
  if (estradiolValue <= estradiolBaseline) {
    return fshBaseline;
  }

  // If Estradiol is at or above peak, FSH is at lowest
  if (estradiolValue >= estradiolPeak) {
    // Calculate lowest FSH based on the inverse relationship
    // Using a proportional decrease: when Estradiol increases, FSH decreases
    // The lowest FSH is typically around 45-50% of baseline (based on typical ranges)
    const fshLowest = fshBaseline * 0.467; // ~28/60 ratio from image
    return fshLowest;
  }

  // Linear interpolation for values between baseline and peak
  // As Estradiol increases from baseline to peak, FSH decreases from baseline to lowest
  const estradiolRange = estradiolPeak - estradiolBaseline;
  const estradiolProgress = (estradiolValue - estradiolBaseline) / estradiolRange;

  // FSH decreases as Estradiol increases (inverse relationship)
  const fshLowest = fshBaseline * 0.467; // ~28/60 ratio
  const fshRange = fshBaseline - fshLowest;

  return fshBaseline - (fshRange * estradiolProgress);
}

// Helper function to calculate FSH inversely from selected Estradiol values
// Based on lab data: Estradiol 26→72 (range 46), FSH 28→16 (range 12, inverse)
// Ratio: FSH change / Estradiol change = 12/46 ≈ 0.261
// The selected FSH should be proportional to baseline FSH, matching the ratio
// of difference between baseline Estradiol and selected Estradiol
function calculateInverseFshFromSelected(
  selectedEstradiolValue: number,
  selectedEstradiolBaseline: number,
  selectedEstradiolPeak: number,
  baselineEstradiol: number,
  baselinePeakEstradiol: number,
  baselineFsh: number,
  baselineFshLowest: number
): number {
  // Handle case where Estradiol is 0 or very low (at re-pellet)
  // Return the starting point (proportional to baseline) when Estradiol returns to 0
  if (selectedEstradiolValue <= 0) {
    const estradiolBaselineRatio = selectedEstradiolBaseline / baselineEstradiol;
    return baselineFsh * estradiolBaselineRatio;
  }

  // Calculate the ratio between baseline and selected Estradiol ranges
  const baselineEstradiolRange = baselinePeakEstradiol - baselineEstradiol;
  const selectedEstradiolRange = selectedEstradiolPeak - selectedEstradiolBaseline;

  if (baselineEstradiolRange <= 0 || selectedEstradiolRange <= 0) {
    // If no range, return baseline FSH
    return baselineFsh;
  }

  // Calculate the starting point of selected FSH based on the ratio
  // of difference between baseline Estradiol and selected Estradiol at day 0
  // This maintains the proportional relationship
  const estradiolBaselineRatio = selectedEstradiolBaseline / baselineEstradiol;
  const selectedFshStartingPoint = baselineFsh * estradiolBaselineRatio;

  // Calculate the FSH range based on the Estradiol range ratio
  // Using the relationship: FSH change = Estradiol change * (FSH range / Estradiol range)
  const baselineFshRange = baselineFsh - baselineFshLowest;
  const fshToEstradiolRatio = baselineFshRange / baselineEstradiolRange;

  // Apply the same ratio to selected Estradiol range to get selected FSH range
  const selectedFshRange = selectedEstradiolRange * fshToEstradiolRatio;

  // Calculate progress within selected Estradiol range (0 to 1)
  // When selectedEstradiolValue = selectedEstradiolBaseline, progress = 0 (FSH = starting point)
  // When selectedEstradiolValue = selectedEstradiolPeak, progress = 1 (FSH = lowest)
  const progress = (selectedEstradiolValue - selectedEstradiolBaseline) / selectedEstradiolRange;

  // FSH decreases as Estradiol increases (inverse relationship)
  // Starting point minus the proportional decrease
  return selectedFshStartingPoint - (selectedFshRange * progress);
}

// Helper function to create chart data points with inverse relationship to Estradiol
function createChartData(
  baselineFsh: number,
  baselineEstradiol: number,
  baselinePeakEstradiol: number,
  selectedDoseEstradiol: number | null,
  selectedPeakEstradiol: number | null,
  rePelletDays: number
): ChartDataPoint[] {
  const sixWeekDays = 42;
  const twelveWeekDays = 84;

  // Calculate FSH values inversely from Estradiol
  // Day 0: Estradiol at baseline, so FSH at baseline
  const fshDay0 = calculateInverseFsh(
    baselineEstradiol,
    baselineEstradiol,
    baselinePeakEstradiol,
    baselineFsh
  );

  // 6 Week: Estradiol at peak, so FSH at lowest
  const fshDay6 = calculateInverseFsh(
    baselinePeakEstradiol,
    baselineEstradiol,
    baselinePeakEstradiol,
    baselineFsh
  );

  // 12 Week: Estradiol still at peak, so FSH still at lowest
  const fshDay12 = fshDay6;

  // Re-pellet: Estradiol returns to baseline, so FSH returns to baseline
  const fshRePellet = fshDay0;

  // Calculate selected dose FSH values (if available)
  // The dotted FSH line should follow the inverse relationship with the dotted Estradiol line
  // and be proportional to baseline FSH
  let selectedFshDay0: number | null = null;
  let selectedFshDay6: number | null = null;
  let selectedFshDay12: number | null = null;
  let selectedFshRePellet: number | null = null;

  if (selectedDoseEstradiol !== null && selectedPeakEstradiol !== null) {
    // Calculate baseline FSH lowest value for reference
    const baselineFshLowest = calculateInverseFsh(
      baselinePeakEstradiol,
      baselineEstradiol,
      baselinePeakEstradiol,
      baselineFsh
    );

    // Calculate FSH inversely from selected Estradiol values
    // The dotted FSH should be inversely related to the dotted Estradiol line
    // and proportional to baseline FSH
    // Day 0: Selected Estradiol is at its baseline (low) -> FSH should be high (proportional to baseline)
    selectedFshDay0 = calculateInverseFshFromSelected(
      selectedDoseEstradiol,
      selectedDoseEstradiol,
      selectedPeakEstradiol,
      baselineEstradiol,
      baselinePeakEstradiol,
      baselineFsh,
      baselineFshLowest
    );
    // 6 Week: Selected Estradiol is at peak (high) -> FSH should be low (proportional)
    selectedFshDay6 = calculateInverseFshFromSelected(
      selectedPeakEstradiol,
      selectedDoseEstradiol,
      selectedPeakEstradiol,
      baselineEstradiol,
      baselinePeakEstradiol,
      baselineFsh,
      baselineFshLowest
    );
    // 12 Week: Selected Estradiol still at peak (high) -> FSH still at lowest
    selectedFshDay12 = selectedFshDay6;
    // Re-pellet: Selected Estradiol goes to 0 (very low) -> FSH should return to starting point
    selectedFshRePellet = calculateInverseFshFromSelected(
      0,
      selectedDoseEstradiol,
      selectedPeakEstradiol,
      baselineEstradiol,
      baselinePeakEstradiol,
      baselineFsh,
      baselineFshLowest
    );
  }

  return [
    // Day 0: Baseline Estradiol (low) -> Baseline FSH (high)
    {
      days: 0,
      baselineFsh: fshDay0,
      selectedDoseFsh: selectedFshDay0,
    },
    // 6 Week Lab Draw: Peak Estradiol (high) -> Lowest FSH (low)
    {
      days: sixWeekDays,
      baselineFsh: fshDay6,
      selectedDoseFsh: selectedFshDay6,
    },
    // 12 Week Lab Draw: Peak Estradiol (high) -> Lowest FSH (low)
    {
      days: twelveWeekDays,
      baselineFsh: fshDay12,
      selectedDoseFsh: selectedFshDay12,
    },
    // Estimated Re-pellet: Baseline Estradiol (low) -> Baseline FSH (high)
    {
      days: rePelletDays,
      baselineFsh: fshRePellet,
      selectedDoseFsh: selectedFshRePellet,
    },
  ];
}

// Helper function to calculate X-axis ticks
function calculateXAxisTicks(rePelletDays: number): {
  ticks: number[];
  maxDays: number;
} {
  const tickInterval = 25;
  const maxDaysValue = Math.ceil(rePelletDays / tickInterval) * tickInterval; // Round up to nearest 25
  const ticks: number[] = [];

  for (let i = 0; i <= maxDaysValue; i += tickInterval) {
    ticks.push(i);
  }

  return { ticks, maxDays: maxDaysValue };
}

// Helper function to calculate Y-axis ticks (same logic as DosingChart)
function calculateYAxisTicks(peakFsh: number): {
  ticks: number[];
  maxDosage: number;
} {
  const targetTicks = 5;
  // Calculate with 10% padding (same as DosingChart)
  const maxDosageValue = Math.ceil(peakFsh * 1.1);

  // Determine appropriate interval for uniform spacing
  let yTickInterval = Math.ceil(maxDosageValue / targetTicks);

  // Round to nice numbers (50, 100, 200, 500, 1000, etc.)
  const magnitude = Math.pow(10, Math.floor(Math.log10(yTickInterval)));
  const normalized = yTickInterval / magnitude;

  if (normalized <= 1) {
    yTickInterval = magnitude;
  } else if (normalized <= 2) {
    yTickInterval = 2 * magnitude;
  } else if (normalized <= 5) {
    yTickInterval = 5 * magnitude;
  } else {
    yTickInterval = 10 * magnitude;
  }

  const ticks: number[] = [];
  for (let i = 0; i <= maxDosageValue; i += yTickInterval) {
    ticks.push(i);
  }

  // Ensure the last tick includes max value
  if (ticks[ticks.length - 1] < maxDosageValue) {
    ticks.push(Math.ceil(maxDosageValue / yTickInterval) * yTickInterval);
  }

  return { ticks, maxDosage: maxDosageValue };
}

export function PatientFshChart({
  patient,
  xAxisLabel = "Weeks Since Pellet Insertion",
  yAxisLabel = "FSH, mIU/mL",
  activeTab,
}: Readonly<PatientFshChartProps>) {
  const { selectedDoses, insertionDate: insertionDateFromRedux } =
    useAppSelector((state) => state.dosingCalculator);

  const fshLevel = patient?.patientInfo?.clinicalData?.fshLevel;
  const baselineEstradiol =
    patient?.patientInfo?.clinicalData?.baselineEstradiol;
  const postInsertionEstradiol =
    patient?.patientInfo?.clinicalData?.postInsertionEstradiol;
  const insertionDate =
    patient?.patientInfo?.clinicalData?.insertionDate ||
    insertionDateFromRedux;

  // Get selected estradiol dose (only show if estradiol tab is active)
  const selectedDose =
    activeTab === "estradiol" ? selectedDoses.estradiol : null;

  const {
    chartData,
    xAxisTicks,
    yAxisTicks,
    maxDays,
    maxDosage,
    rePelletWindowStartDays,
    rePelletWindowEndDays,
  } = useMemo<ChartCalculations>(() => {
    if (!fshLevel || !baselineEstradiol || !insertionDate) {
      return {
        chartData: [],
        xAxisTicks: [],
        yAxisTicks: [],
        maxDays: 0,
        maxDosage: 0,
        rePelletWindowStartDays: 0,
        rePelletWindowEndDays: 0,
      };
    }

    // Calculate re-pellet date based on patient gender
    const rePelletDays = calculateRePelletDays(patient?.gender);

    // Calculate re-pellet window
    const { startDays, endDays } = calculateRePelletWindow(rePelletDays);

    // Calculate baseline Estradiol peak value: use postInsertionEstradiol if available,
    // otherwise calculate as 50% more than baseline
    const baselinePeakEstradiol = postInsertionEstradiol
      ? postInsertionEstradiol
      : baselineEstradiol * 1.5;

    // Calculate selected Estradiol dose values (if available)
    const selectedDoseEstradiol = selectedDose?.dosageMg || null;
    const selectedPeakEstradiol = selectedDoseEstradiol
      ? selectedDoseEstradiol * 1.5
      : null;

    // Calculate FSH values inversely from Estradiol
    // Baseline FSH: starts at fshLevel (high), drops to lowest when Estradiol peaks
    const fshBaseline = fshLevel;

    // Create chart data points with inverse relationship to Estradiol
    const data = createChartData(
      fshBaseline,
      baselineEstradiol,
      baselinePeakEstradiol,
      selectedDoseEstradiol,
      selectedPeakEstradiol,
      rePelletDays
    );

    // Calculate the maximum FSH value from all data points to determine y-axis range
    const allFshValues = data.flatMap((point) => [
      point.baselineFsh,
      point.selectedDoseFsh,
    ]).filter((val): val is number => val !== null);
    const maxFshValue = Math.max(...allFshValues, fshBaseline);

    // Calculate axis ticks
    const { ticks: xTicks, maxDays: maxDaysValue } =
      calculateXAxisTicks(rePelletDays);
    const { ticks: yTicks, maxDosage: maxDosageValue } =
      calculateYAxisTicks(maxFshValue);

    return {
      chartData: data,
      xAxisTicks: xTicks,
      yAxisTicks: yTicks,
      maxDays: maxDaysValue,
      maxDosage: maxDosageValue,
      rePelletWindowStartDays: startDays,
      rePelletWindowEndDays: endDays,
    };
  }, [
    fshLevel,
    baselineEstradiol,
    postInsertionEstradiol,
    insertionDate,
    patient?.gender,
    selectedDose,
    activeTab,
  ]);

  // Memoize tick formatter functions
  const formatTick = useCallback((value: number): string => {
    return `${value}`;
  }, []);

  const chartConfig = useMemo(
    () => ({
      baselineFsh: {
        label: "Baseline FSH (mIU/mL)",
        color: "hsl(var(--primary))",
      },
      selectedDoseFsh: {
        label: "Selected Dose FSH (mg)",
        color: "hsl(var(--primary))",
      },
    }),
    []
  );

  console.log("chartData", chartData);

  if (!fshLevel || !insertionDate || chartData.length === 0) {
    return (
      <div className="w-full flex items-center justify-center border border-muted-foreground/20 rounded-lg">
        <p className="typo-body-2 text-muted-foreground">
          FSH Level data not available
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ChartContainer
        config={chartConfig}
        className="w-full h-[180px] aspect-auto"
      >
        <ResponsiveContainer>
          <ComposedChart accessibilityLayer data={chartData}>
            <defs>
              <linearGradient id="colorBaselineFsh" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="days"
              type="number"
              scale="linear"
              domain={[0, maxDays]}
              ticks={xAxisTicks}
              tickFormatter={formatTick}
              label={{ value: xAxisLabel, position: "bottom", offset: -8 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              type="number"
              domain={[0, maxDosage]}
              ticks={yAxisTicks}
              tickFormatter={formatTick}
              label={{
                value: yAxisLabel,
                angle: -90,
                position: "left",
                offset: -10,
                dy: -50,
              }}
              stroke="hsl(var(--muted-foreground))"
            />
            {/* Re-pellet Window - Orange vertical band */}
            <ReferenceArea
              x1={rePelletWindowStartDays}
              x2={rePelletWindowEndDays}
              fill="#ffb38a"
              fillOpacity={0.3}
              stroke="none"
            />
            <ReferenceLine
              x={rePelletWindowStartDays}
              stroke="#FFA500"
              strokeDasharray="5 5"
              strokeWidth={1.5}
            />
            <ReferenceLine
              x={rePelletWindowEndDays}
              stroke="#FFA500"
              strokeDasharray="5 5"
              strokeWidth={1.5}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {/* Baseline line - solid */}
            <Area
              type="monotone"
              dataKey="baselineFsh"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorBaselineFsh)"
              dot={{ fill: "hsl(var(--primary))", r: 2 }}
              activeDot={{ r: 4 }}
            />
            {/* Selected dose line - dotted (only if selected dose exists) */}
            {/* {selectedDose && (
              <Line
                type="monotone"
                dataKey="selectedDoseFsh"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "hsl(var(--primary))", r: 2 }}
                activeDot={{ r: 4 }}
              />
            )} */}
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

