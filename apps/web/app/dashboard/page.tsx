"use client";

import { useState } from "react";

import { KPICards } from "@/components/dashboard/kpi-cards";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ChannelFilter } from "@/components/dashboard/channel-filter";
import {
  MOCK_KPIS,
  MOCK_CHART_DATA,
  MOCK_ACTIVITY,
} from "@/lib/mock-data";

export default function DashboardPage() {
  const [selectedKPI, setSelectedKPI] = useState("roas");
  const [timeRange, setTimeRange] = useState("6m");
  const [channel, setChannel] = useState("all");

  return (
    <div className="p-6">
      {/* Filter bar */}
      <div className="mb-6">
        <ChannelFilter
          timeRange={timeRange}
          channel={channel}
          onTimeRangeChange={setTimeRange}
          onChannelChange={setChannel}
        />
      </div>

      {/* KPI row */}
      <KPICards
        kpis={MOCK_KPIS}
        selectedId={selectedKPI}
        onSelect={setSelectedKPI}
      />

      {/* Chart */}
      <div className="mt-6">
        <PerformanceChart
          data={MOCK_CHART_DATA}
          metricSuffix="x"
        />
      </div>

      {/* Activity feed */}
      <div className="mt-8">
        <ActivityFeed items={MOCK_ACTIVITY} />
      </div>
    </div>
  );
}
