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
import type { HormoneTypeKey } from "@/store/features/dosing";

interface PatientTestosteroneChartProps {
  patient?: PatientDetail | null;
  xAxisLabel?: string;
  yAxisLabel?: string;
  activeTab?: string;
}

interface ChartDataPoint {
  days: number;
  baselineTestosterone: number;
  selectedDoseTestosterone: number | null;
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

// Helper function to calculate re-pellet days based on patient gender
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

// Helper function to create chart data points with curve similar to DosingChart
function createChartData(
  baselineValue: number,
  baselinePeakValue: number,
  selectedDoseMg: number | null,
  selectedPeakMg: number | null,
  rePelletDays: number
): ChartDataPoint[] {
  const sixWeekDays = 42;
  const twelveWeekDays = 84;

  return [
    // Day 0: Baseline value and selected dose (if available)
    {
      days: 0,
      baselineTestosterone: baselineValue,
      selectedDoseTestosterone: selectedDoseMg,
    },
    // 6 Week Lab Draw: Peak values
    {
      days: sixWeekDays,
      baselineTestosterone: baselinePeakValue,
      selectedDoseTestosterone: selectedPeakMg,
    },
    // 12 Week Lab Draw: Still at peak
    {
      days: twelveWeekDays,
      baselineTestosterone: baselinePeakValue,
      selectedDoseTestosterone: selectedPeakMg,
    },
    // Estimated Re-pellet: goes to 0
    {
      days: rePelletDays,
      baselineTestosterone: 0,
      selectedDoseTestosterone: 0,
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
function calculateYAxisTicks(peakValue: number): {
  ticks: number[];
  maxDosage: number;
} {
  const targetTicks = 5;
  // Calculate with 10% padding (same as DosingChart)
  const maxDosageValue = Math.ceil(peakValue * 1.1);

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

export function PatientTestosteroneChart({
  patient,
  xAxisLabel = "Weeks Since Pellet Insertion",
  yAxisLabel = "Testosterone, ng/dL",
  activeTab,
}: Readonly<PatientTestosteroneChartProps>) {
  const { selectedDoses, insertionDate: insertionDateFromRedux } =
    useAppSelector((state) => state.dosingCalculator);

  const baselineFreeTestosterone =
    patient?.patientInfo?.clinicalData?.baselineFreeTestosterone;
  const postInsertionTotalTestosterone =
    patient?.patientInfo?.clinicalData?.postInsertionTotalTestosterone;
  const insertionDate =
    patient?.patientInfo?.clinicalData?.insertionDate ||
    insertionDateFromRedux;

  // Map tab ID to hormone type key to get selected dose
  const getHormoneTypeKey = (tabId: string): HormoneTypeKey | null => {
    switch (tabId) {
      case "testosterone-t100":
        return "testosterone_100";
      case "testosterone-t200":
        return "testosterone_200";
      default:
        return null;
    }
  };

  const hormoneTypeKey = activeTab ? getHormoneTypeKey(activeTab) : null;
  const selectedDose = hormoneTypeKey ? selectedDoses[hormoneTypeKey] : null;

  const {
    chartData,
    xAxisTicks,
    yAxisTicks,
    maxDays,
    maxDosage,
    rePelletWindowStartDays,
    rePelletWindowEndDays,
  } = useMemo<ChartCalculations>(() => {
    if (!baselineFreeTestosterone || !insertionDate) {
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

    // Calculate baseline peak value: use postInsertionTotalTestosterone if available,
    // otherwise calculate as 50% more than baseline (similar to DosingChart logic)
    const baselinePeakTestosterone = postInsertionTotalTestosterone
      ? postInsertionTotalTestosterone
      : baselineFreeTestosterone * 1.5;

    // Calculate selected dose values (if available)
    // The selected dose is in mg, we'll use it directly for the curve
    const selectedDoseMg = selectedDose?.dosageMg || null;
    const selectedPeakMg = selectedDoseMg ? selectedDoseMg * 1.5 : null; // Same 50% increase logic

    // Calculate the maximum peak value to determine y-axis range
    // Use the higher of baseline peak or selected dose peak
    const maxPeakValue = Math.max(
      baselinePeakTestosterone,
      selectedPeakMg || 0
    );

    // Create chart data points with both baseline and selected dose curves
    const data = createChartData(
      baselineFreeTestosterone,
      baselinePeakTestosterone,
      selectedDoseMg,
      selectedPeakMg,
      rePelletDays
    );

    // Calculate axis ticks
    const { ticks: xTicks, maxDays: maxDaysValue } =
      calculateXAxisTicks(rePelletDays);
    const { ticks: yTicks, maxDosage: maxDosageValue } =
      calculateYAxisTicks(maxPeakValue);

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
    baselineFreeTestosterone,
    postInsertionTotalTestosterone,
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
      baselineTestosterone: {
        label: "Baseline Testosterone (ng/dL)",
        color: "hsl(var(--primary))",
      },
      selectedDoseTestosterone: {
        label: "Selected Dose Testosterone (mg)",
        color: "hsl(var(--primary))",
      },
    }),
    []
  );

  if (!baselineFreeTestosterone || !insertionDate || chartData.length === 0) {
    return (
      <div className="w-full flex items-center justify-center border border-muted-foreground/20 rounded-lg">
        <p className="typo-body-2 text-muted-foreground">
          Baseline Free Testosterone data not available
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
              <linearGradient id="colorBaselineTestosterone" x1="0" y1="0" x2="0" y2="1">
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
              dataKey="baselineTestosterone"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorBaselineTestosterone)"
              dot={{ fill: "hsl(var(--primary))", r: 2 }}
              activeDot={{ r: 4 }}
            />
            {/* Selected dose line - dotted (only if selected dose exists) */}
            {/* {selectedDose && (
              <Line
                type="monotone"
                dataKey="selectedDoseTestosterone"
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
