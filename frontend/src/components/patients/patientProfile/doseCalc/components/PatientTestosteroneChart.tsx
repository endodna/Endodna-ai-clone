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

interface PatientTestosteroneChartProps {
  patient?: PatientDetail | null;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

interface ChartDataPoint {
  weeks: number;
  testosterone: number;
}

export function PatientTestosteroneChart({
  patient,
  xAxisLabel = "Weeks Since Pellet Insertion",
  yAxisLabel = "Testosterone, ng/dL",
}: Readonly<PatientTestosteroneChartProps>) {
  const baselineTotalTestosterone =
    patient?.patientInfo?.clinicalData?.baselineTotalTestosterone;
  const postInsertionTotalTestosterone =
    patient?.patientInfo?.clinicalData?.postInsertionTotalTestosterone;
  const postInsertionTotalTestosterone12Weeks = (
    patient?.patientInfo?.clinicalData as any
  )?.postInsertionTotalTestosterone12Weeks as number | undefined;

  const chartData = useMemo<ChartDataPoint[]>(() => {
    const data: ChartDataPoint[] = [];

    // Week 0: Baseline value (insertion date)
    if (baselineTotalTestosterone != null) {
      data.push({
        weeks: 0,
        testosterone: baselineTotalTestosterone,
      });
    }

    // Week 6: Post-insertion value
    if (postInsertionTotalTestosterone != null) {
      data.push({
        weeks: 6,
        testosterone: postInsertionTotalTestosterone,
      });
    }

    // Week 12: 12-week post-insertion value
    if (postInsertionTotalTestosterone12Weeks != null) {
      data.push({
        weeks: 12,
        testosterone: postInsertionTotalTestosterone12Weeks,
      });
    }

    return data;
  }, [
    baselineTotalTestosterone,
    postInsertionTotalTestosterone,
    postInsertionTotalTestosterone12Weeks,
  ]);

  // Calculate Y-axis range based on max value (rounded)
  const maxValue = useMemo(() => {
    const values = [
      baselineTotalTestosterone,
      postInsertionTotalTestosterone,
      postInsertionTotalTestosterone12Weeks,
    ].filter((v): v is number => v != null);
    if (values.length === 0) return 0;
    const calculatedMax = Math.max(...values) * 1.1;
    return Math.ceil(calculatedMax);
  }, [
    baselineTotalTestosterone,
    postInsertionTotalTestosterone,
    postInsertionTotalTestosterone12Weeks,
  ]);

  const maxWeeks = 12;
  const xAxisTicks = Array.from({ length: 13 }, (_, i) => i); // [0, 1, 2, ..., 12]

  // Memoize tick formatter functions
  const formatTick = useCallback((value: number): string => {
    return `${value}`;
  }, []);

  const chartConfig = useMemo(
    () => ({
      testosterone: {
        label: "Testosterone (ng/dL)",
        color: "hsl(var(--primary))",
      },
    }),
    []
  );

  if (chartData.length === 0) {
    return (
      <div className="w-full flex items-center justify-center border border-muted-foreground/20 rounded-lg">
        <p className="typo-body-2 text-muted-foreground">
          Testosterone data not available
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
              <linearGradient
                id="colorTestosterone"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
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
              dataKey="testosterone"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorTestosterone)"
              dot={{ fill: "hsl(var(--primary))", r: 2 }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
