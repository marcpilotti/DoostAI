"use client";

import { useState } from "react";

import { KPICards } from "@/components/dashboard/kpi-cards";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ChannelFilter } from "@/components/dashboard/channel-filter";
import { useKPIs } from "@/hooks/use-kpis";
import { useCampaignActivity } from "@/hooks/use-campaign-activity";
import { useROASChart } from "@/hooks/use-roas-chart";

export default function DashboardPage() {
  const [selectedKPI, setSelectedKPI] = useState("roas");
  const [timeRange, setTimeRange] = useState("6m");
  const [channel, setChannel] = useState("all");

  const { kpis } = useKPIs({ timeRange, channel });
  const { items: activityItems } = useCampaignActivity({ limit: 10 });
  const { data: chartData, metricSuffix } = useROASChart({ metric: selectedKPI, timeRange, channel });

  return (
    <div className="p-6">
      <div className="mb-6">
        <ChannelFilter
          timeRange={timeRange}
          channel={channel}
          onTimeRangeChange={setTimeRange}
          onChannelChange={setChannel}
        />
      </div>

      <KPICards
        kpis={kpis}
        selectedId={selectedKPI}
        onSelect={setSelectedKPI}
      />

      <div className="mt-6">
        <PerformanceChart data={chartData} metricSuffix={metricSuffix} />
      </div>

      <div className="mt-8">
        <ActivityFeed items={activityItems} />
      </div>
    </div>
  );
}
