import { useMemo, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { GENDER } from "@/components/constants/patient";
import type { HormoneTypeKey } from "@/store/features/dosing";

interface DosingChartProps {
  patient?: PatientDetail | null;
  xAxisLabel?: string;
  yAxisLabel?: string;
  hormoneTypeKey?: HormoneTypeKey;
  maxYAxis?: number;
}

interface ChartDataPoint {
  days: number;
  dosageMg: number;
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

// Helper function to create chart data points
function createChartData(
  dosageMg: number,
  peakDosageMg: number,
  rePelletDays: number
): ChartDataPoint[] {
  const sixWeekDays = 42;
  const twelveWeekDays = 84;

  return [
    // Day 0: Initial dosage
    { days: 0, dosageMg },
    // 6 Week Lab Draw: 50% more
    { days: sixWeekDays, dosageMg: peakDosageMg },
    // 12 Week Lab Draw: 50% more
    { days: twelveWeekDays, dosageMg: peakDosageMg },
    // Estimated Re-pellet: goes to 0
    { days: rePelletDays, dosageMg: 0 },
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

// Helper function to calculate Y-axis ticks
function calculateYAxisTicks(peakDosageMg: number, maxYAxis?: number): {
  ticks: number[];
  maxDosage: number;
} {
  const targetTicks = 5;
  // Use provided maxYAxis if available, otherwise calculate with 10% padding
  const maxDosageValue = maxYAxis !== undefined ? maxYAxis : Math.ceil(peakDosageMg * 1.1);

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

export function DosingChart({
  patient,
  xAxisLabel = "Days",
  yAxisLabel = "Dosage (mg)",
  hormoneTypeKey,
  maxYAxis,
}: Readonly<DosingChartProps>) {
  const { selectedDoses, selectedDose, insertionDate } = useAppSelector(
    (state) => state.dosingCalculator
  );

  // Use the specific hormoneTypeKey's selectedDose if provided, otherwise fall back to selectedDose
  const activeSelectedDose = hormoneTypeKey
    ? selectedDoses[hormoneTypeKey] || null
    : selectedDose;

  const {
    chartData,
    xAxisTicks,
    yAxisTicks,
    maxDays,
    maxDosage,
    rePelletWindowStartDays,
    rePelletWindowEndDays,
  } = useMemo<ChartCalculations>(() => {
    if (!activeSelectedDose || !insertionDate) {
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

    const dosageMg = activeSelectedDose.dosageMg;
    const peakDosageMg = dosageMg * 1.5; // 50% more

    // Calculate re-pellet date based on patient gender
    const rePelletDays = calculateRePelletDays(patient?.gender);

    // Calculate re-pellet window
    const { startDays, endDays } = calculateRePelletWindow(rePelletDays);

    // Create chart data points
    const data = createChartData(dosageMg, peakDosageMg, rePelletDays);

    // Calculate axis ticks
    const { ticks: xTicks, maxDays: maxDaysValue } =
      calculateXAxisTicks(rePelletDays);
    const { ticks: yTicks, maxDosage: maxDosageValue } =
      calculateYAxisTicks(peakDosageMg, maxYAxis);

    return {
      chartData: data,
      xAxisTicks: xTicks,
      yAxisTicks: yTicks,
      maxDays: maxDaysValue,
      maxDosage: maxDosageValue,
      rePelletWindowStartDays: startDays,
      rePelletWindowEndDays: endDays,
    };
  }, [activeSelectedDose, insertionDate, patient?.gender, maxYAxis]);

  // Memoize tick formatter functions
  const formatTick = useCallback((value: number): string => {
    return `${value}`;
  }, []);

  const chartConfig = useMemo(
    () => ({
      dosageMg: {
        label: "Dosage (mg)",
        color: "hsl(var(--primary))",
      },
    }),
    []
  );

  if (!activeSelectedDose || !insertionDate || chartData.length === 0) {
    return (
      <div className="w-full flex items-center justify-center border border-muted-foreground/20 rounded-lg">
        <p className="typo-body-2 text-muted-foreground">
          Select a dose and insertion date to view chart
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
          <AreaChart accessibilityLayer data={chartData}>
            <defs>
              <linearGradient id="colorDosage" x1="0" y1="0" x2="0" y2="1">
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
              dataKey="dosageMg"
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
            <Area
              type="monotone"
              dataKey="dosageMg"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#colorDosage)"
              dot={{ fill: "hsl(var(--primary))", r: 2 }}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
