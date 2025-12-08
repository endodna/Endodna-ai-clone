import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { GENDER } from "@/components/constants/patient";

interface DosingChartProps {
    patient?: PatientDetail | null;
}

export function DosingChart({ patient }: Readonly<DosingChartProps>) {
    const { selectedDose, insertionDate } = useAppSelector(
        (state) => state.dosingCalculator
    );

    const { chartData, xAxisTicks, yAxisTicks, maxDays, maxDosage } = useMemo(() => {
        if (!selectedDose || !insertionDate) {
            return {
                chartData: [],
                xAxisTicks: [],
                yAxisTicks: [],
                maxDays: 0,
                maxDosage: 0,
            };
        }

        const dosageMg = selectedDose.dosageMg;
        const peakDosageMg = dosageMg * 1.5; // 50% more

        // Calculate 6 week and 12 week lab draw dates (6 weeks = 42 days, 12 weeks = 84 days)
        const sixWeekDays = 42;
        const twelveWeekDays = 84;

        // Calculate re-pellet date based on patient gender
        const patientGender = patient?.gender?.toUpperCase();
        let rePelletDays: number;

        if (patientGender === GENDER.MALE) {
            // 5.5 months = 5 months + 15 days ≈ 165 days
            rePelletDays = 165;
        } else if (patientGender === GENDER.FEMALE) {
            // 3.5 months = 3 months + 15 days ≈ 105 days
            rePelletDays = 105;
        } else {
            // Default to 85 days if gender is not available
            rePelletDays = 85;
        }

        // Create data points
        const data = [
            // Day 0: Initial dosage
            { days: 0, dosageMg },
            // 6 Week Lab Draw: 50% more
            { days: sixWeekDays, dosageMg: peakDosageMg },
            // 12 Week Lab Draw: 50% more
            { days: twelveWeekDays, dosageMg: peakDosageMg },
            // Estimated Re-pellet: goes to 0
            { days: rePelletDays, dosageMg: 0 },
        ];

        // Calculate uniform X-axis ticks (days)
        const maxDaysValue = Math.ceil(rePelletDays / 25) * 25; // Round up to nearest 25
        const xTicks: number[] = [];
        const tickInterval = 25;
        for (let i = 0; i <= maxDaysValue; i += tickInterval) {
            xTicks.push(i);
        }

        // Calculate uniform Y-axis ticks (dosageMg)
        const maxDosageValue = Math.ceil(peakDosageMg * 1.1); // Add 10% padding

        // Determine appropriate interval for uniform spacing (aim for 5-6 ticks)
        const targetTicks = 5;
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

        const yTicks: number[] = [];
        for (let i = 0; i <= maxDosageValue; i += yTickInterval) {
            yTicks.push(i);
        }

        // Ensure the last tick includes max value
        if (yTicks[yTicks.length - 1] < maxDosageValue) {
            yTicks.push(Math.ceil(maxDosageValue / yTickInterval) * yTickInterval);
        }

        return {
            chartData: data,
            xAxisTicks: xTicks,
            yAxisTicks: yTicks,
            maxDays: maxDaysValue,
            maxDosage: maxDosageValue,
        };
    }, [selectedDose, insertionDate, patient?.gender]);

    const chartConfig = {
        dosageMg: {
            label: "Dosage (mg)",
            color: "hsl(var(--primary))",
        },
    };

    if (!selectedDose || !insertionDate || chartData.length === 0) {
        return (
            <div className="w-full flex items-center justify-center border border-muted-foreground/20 rounded-lg">
                <p className="typo-body-2 text-muted-foreground">
                    Select a dose and insertion date to view chart
                </p>
            </div>
        );
    }

    return (
        <div className="w-1/2">
            <ChartContainer config={chartConfig} className="w-full">
                <ResponsiveContainer>
                    <AreaChart
                        accessibilityLayer
                        data={chartData}
                    >
                        <defs>
                            <linearGradient id="colorDosage" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="days"
                            type="number"
                            scale="linear"
                            domain={[0, maxDays]}
                            ticks={xAxisTicks}
                            tickFormatter={(value) => `${value}`}
                            label={{ value: "Days", position: "insideBottom" }}
                            stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis
                            dataKey="dosageMg"
                            type="number"
                            domain={[0, maxDosage]}
                            ticks={yAxisTicks}
                            tickFormatter={(value) => `${value}`}
                            label={{ value: "Dosage (mg)", angle: -90, position: "insideLeft" }}
                            stroke="hsl(var(--muted-foreground))"
                        />
                        <ChartTooltip
                            content={<ChartTooltipContent />}
                        />
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
