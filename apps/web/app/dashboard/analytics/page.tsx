"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { MOCK_CHART_DATA } from "@/lib/mock-data";

const channelData = [
  { name: "Meta", clicks: 48200, spend: 3200, roas: 4.2 },
  { name: "Google", clicks: 21400, spend: 1800, roas: 3.1 },
  { name: "LinkedIn", clicks: 3253, spend: 904, roas: 1.8 },
];

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-[var(--doost-text)]">Analytics</h2>
        <button className="rounded-lg bg-[var(--doost-bg)] px-3 py-2 text-[12px] font-medium text-[var(--doost-text)]" style={{ border: `1px solid var(--doost-border)` }}>
          Export CSV
        </button>
      </div>

      <div className="mb-6 rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] p-6" style={{ border: `1px solid var(--doost-border)` }}>
        <h3 className="mb-4 text-[14px] font-semibold text-[var(--doost-text)]">Performance over time</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={MOCK_CHART_DATA}>
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
