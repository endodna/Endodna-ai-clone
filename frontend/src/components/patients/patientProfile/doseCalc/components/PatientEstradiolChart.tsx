import { useMemo, useCallback } from "react";
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { isPatientExcluded } from "@/lib/excludePatient";

interface PatientEstradiolChartProps {
  patient?: PatientDetail | null;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

interface ChartDataPoint {
  weeks: number;
  estradiol: number;
}

export function PatientEstradiolChart({
  patient,
  xAxisLabel = "Weeks Since Pellet Insertion",
  yAxisLabel = "Estradiol (E2), pg/mL",
}: Readonly<PatientEstradiolChartProps>) {
  const baselineEstradiol =
    patient?.patientInfo?.clinicalData?.baselineEstradiol;
  const postInsertionEstradiol =
    patient?.patientInfo?.clinicalData?.postInsertionEstradiol;
  const postInsertionEstradiol12Weeks = (
    patient?.patientInfo?.clinicalData as any
  )?.postInsertionEstradiol12Weeks as number | undefined;

  const chartData = useMemo<ChartDataPoint[]>(() => {
    const data: ChartDataPoint[] = [];

    // Week 0: Baseline value (insertion date)
    if (baselineEstradiol != null) {
      data.push({
        weeks: 0,
        estradiol: baselineEstradiol,
      });
    }

    // Week 6: Post-insertion value
    if (postInsertionEstradiol != null) {
      data.push({
        weeks: 6,
        estradiol: postInsertionEstradiol,
      });
    }

    // Week 12: 12-week post-insertion value
    if (postInsertionEstradiol12Weeks != null) {
      data.push({
        weeks: 12,
        estradiol: postInsertionEstradiol12Weeks,
      });
    }

    return data;
  }, [
    baselineEstradiol,
    postInsertionEstradiol,
    postInsertionEstradiol12Weeks,
  ]);

  // Calculate Y-axis range based on max value (rounded)
  const maxValue = useMemo(() => {
    const values = [
      baselineEstradiol,
      postInsertionEstradiol,
      postInsertionEstradiol12Weeks,
    ].filter((v): v is number => v != null);
    if (values.length === 0) return 0;
    const calculatedMax = Math.max(...values) * 1.1;
    return Math.ceil(calculatedMax);
  }, [
    baselineEstradiol,
    postInsertionEstradiol,
    postInsertionEstradiol12Weeks,
  ]);

  const maxWeeks = 12;
  const xAxisTicks = Array.from({ length: 13 }, (_, i) => i); // [0, 1, 2, ..., 12]

  // Memoize tick formatter functions
  const formatTick = useCallback((value: number): string => {
    return `${value}`;
  }, []);

  const chartConfig = useMemo(
    () => ({
      estradiol: {
        label: "Estradiol (pg/mL)",
        color: "hsl(var(--primary))",
      },
    }),
    []
  );

  if (isPatientExcluded(patient?.id || "", "estradiol")) return null;

  if (chartData.length === 0) {
    return (
      <div className="w-full flex items-center justify-center border border-muted-foreground/20 rounded-lg">
        <p className="typo-body-2 text-muted-foreground">
          Estradiol data not available
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
              <linearGradient id="colorEstradiol" x1="0" y1="0" x2="0" y2="1">
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
              dataKey="weeks"
              type="number"
              scale="linear"
              domain={[0, maxWeeks]}
              ticks={xAxisTicks}
              tickFormatter={formatTick}
              label={{ value: xAxisLabel, position: "bottom", offset: -8 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              type="number"
              domain={[0, maxValue]}
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
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="estradiol"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorEstradiol)"
              dot={{ fill: "hsl(var(--primary))", r: 2 }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
