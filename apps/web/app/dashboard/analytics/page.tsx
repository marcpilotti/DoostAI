"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { MOCK_CHART_DATA, MOCK_KPIS } from "@/lib/mock-data";

type DateRange = "7d" | "30d" | "6m" | "1y";

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "7d", label: "Past week" },
  { value: "30d", label: "Past month" },
  { value: "6m", label: "Past 6 months" },
  { value: "1y", label: "Past year" },
];

const channelDataFull = [
  { name: "Meta", clicks: 48200, spend: 3200, roas: 4.2 },
  { name: "Google", clicks: 21400, spend: 1800, roas: 3.1 },
  { name: "LinkedIn", clicks: 3253, spend: 904, roas: 1.8 },
];

function getFilteredChartData(range: DateRange) {
  // Simulate different data ranges by slicing the mock data
  switch (range) {
    case "7d": return MOCK_CHART_DATA.slice(-1);
    case "30d": return MOCK_CHART_DATA.slice(-2);
    case "6m": return MOCK_CHART_DATA;
    case "1y": return MOCK_CHART_DATA;
    default: return MOCK_CHART_DATA;
  }
}

function getFilteredChannelData(range: DateRange) {
  // Scale channel data based on range to simulate filtering
  const scale = range === "7d" ? 0.05 : range === "30d" ? 0.2 : range === "6m" ? 0.6 : 1;
  return channelDataFull.map((c) => ({
    ...c,
    clicks: Math.round(c.clicks * scale),
    spend: Math.round(c.spend * scale),
  }));
}

function downloadCSV(filename: string, rows: Record<string, string | number>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]!);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => `"${r[h] ?? ""}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  useEffect(() => { document.title = "Analytics — Doost AI"; }, []);

  const [dateRange, setDateRange] = useState<DateRange>("6m");

  const chartData = getFilteredChartData(dateRange);
  const channelData = getFilteredChannelData(dateRange);

  const handleExport = useCallback(() => {
    const rows = [
      ...chartData.map((d) => ({ Month: d.month, "Current ROAS": d.current, "Previous ROAS": d.previous })),
    ];
    const channelRows = channelData.map((c) => ({ Channel: c.name, Clicks: c.clicks, Spend: c.spend, ROAS: c.roas }));
    downloadCSV("doost-analytics.csv", [...rows, {}, ...channelRows] as Record<string, string | number>[]);
  }, [chartData, channelData]);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-[var(--doost-text)]">Analytics</h2>
        <div className="flex items-center gap-2">
          {/* Date range picker */}
          <div className="relative inline-block">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="appearance-none rounded-lg bg-[var(--doost-bg)] py-2 pl-3 pr-8 text-[12px] font-medium text-[var(--doost-text)] transition-colors hover:bg-[var(--doost-bg-secondary)] focus:outline-none"
              style={{ border: "1px solid var(--doost-border)" }}
            >
              {DATE_RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--doost-text-muted)]" />
          </div>

          <button
            onClick={handleExport}
            className="rounded-lg bg-[var(--doost-bg)] px-3 py-2 text-[12px] font-medium text-[var(--doost-text)] transition-colors hover:bg-[var(--doost-bg-secondary)]"
            style={{ border: `1px solid var(--doost-border)` }}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] p-6" style={{ border: `1px solid var(--doost-border)` }}>
        <h3 className="mb-4 text-[14px] font-semibold text-[var(--doost-text)]">
          Performance over time
          <span className="ml-2 text-[11px] font-normal text-[var(--doost-text-muted)]">
            ({DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label})
          </span>
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--doost-border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--doost-text-muted)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "var(--doost-text-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}x`} />
            <Tooltip />
            <Line type="monotone" dataKey="current" stroke="var(--doost-chart-current)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="previous" stroke="var(--doost-chart-previous)" strokeWidth={1.5} strokeDasharray="6 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] p-6" style={{ border: `1px solid var(--doost-border)` }}>
          <h3 className="mb-4 text-[14px] font-semibold text-[var(--doost-text)]">Clicks by channel</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={channelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--doost-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--doost-text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "var(--doost-text-muted)" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="clicks" fill="var(--doost-bg-active)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] p-6" style={{ border: `1px solid var(--doost-border)` }}>
          <h3 className="mb-4 text-[14px] font-semibold text-[var(--doost-text)]">ROAS by channel</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={channelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--doost-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--doost-text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "var(--doost-text-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}x`} />
              <Tooltip />
              <Bar dataKey="roas" fill="var(--doost-chart-current)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
