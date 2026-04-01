"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ChartDataPoint } from "@/lib/mock-data";

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const current = payload.find((p) => p.dataKey === "current")?.value ?? 0;
  const previous = payload.find((p) => p.dataKey === "previous")?.value ?? 0;
  const change = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;

  return (
    <div className="rounded-lg bg-[var(--doost-bg)] px-3 py-2 shadow-lg" style={{ border: `1px solid var(--doost-border)` }}>
      <p className="mb-1 text-[12px] font-semibold text-[var(--doost-text)]">{label}</p>
      <div className="space-y-0.5 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="h-0.5 w-3 rounded-full bg-[var(--doost-chart-current)]" />
          <span className="text-[var(--doost-text-secondary)]">Denna period</span>
          <span className="font-semibold text-[var(--doost-text)]">{current.toFixed(1)}x</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-0.5 w-3 rounded-full bg-[var(--doost-chart-previous)]" />
          <span className="text-[var(--doost-text-secondary)]">Föregående period</span>
          <span className="font-medium text-[var(--doost-text-secondary)]">{previous.toFixed(1)}x</span>
        </div>
      </div>
      {change !== 0 && (
        <p className={`mt-1.5 text-[11px] font-semibold ${change >= 0 ? "text-[var(--doost-text-positive)]" : "text-[var(--doost-text-negative)]"}`}>
          {change >= 0 ? "+" : ""}{change}% mot föregående
        </p>
      )}
    </div>
  );
}

export function PerformanceChart({
  data,
  metricSuffix = "x",
}: {
  data: ChartDataPoint[];
  metricSuffix?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] p-6 text-[13px] text-[var(--doost-text-muted)]" style={{ border: `1px solid var(--doost-border)` }}>
        Ingen data att visa för vald period
      </div>
    );
  }

  return (
    <div className="rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] p-6" role="img" aria-label={`Prestandadiagram: nuvarande vs föregående period (${metricSuffix})`} style={{ border: `1px solid var(--doost-border)` }}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--doost-border)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "var(--doost-text-muted)" }}
            axisLine={{ stroke: "var(--doost-border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--doost-text-muted)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}${metricSuffix}`}
            domain={[0, "auto"]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="current"
            stroke="var(--doost-chart-current)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: "var(--doost-chart-current)", strokeWidth: 2, fill: "white" }}
          />
          <Line
            type="monotone"
            dataKey="previous"
            stroke="var(--doost-chart-previous)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            dot={false}
            activeDot={false}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            content={() => (
              <div className="flex items-center justify-center gap-6 pt-4 text-[12px] text-[var(--doost-text-secondary)]">
                <div className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded-full bg-[var(--doost-chart-current)]" />
                  Nuvarande period
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded-full bg-[var(--doost-chart-previous)] opacity-60" style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--doost-chart-previous) 0 4px, transparent 4px 8px)" }} />
                  Föregående period
                </div>
              </div>
            )}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
