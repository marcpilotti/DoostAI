"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { KPICards } from "@/components/dashboard/kpi-cards";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ChannelFilter } from "@/components/dashboard/channel-filter";
import { useKPIs } from "@/hooks/use-kpis";
import { useCampaignActivity } from "@/hooks/use-campaign-activity";
import { useROASChart } from "@/hooks/use-roas-chart";
import { MOCK_CAMPAIGNS } from "@/lib/mock-data";

export default function DashboardPage() {
  useEffect(() => { document.title = "Dashboard — Doost AI"; }, []);
  const [selectedKPI, setSelectedKPI] = useState("roas");
  const [timeRange, setTimeRange] = useState("6m");
  const [channel, setChannel] = useState("all");

  const { kpis } = useKPIs({ timeRange, channel });
  const { items: activityItems } = useCampaignActivity({ limit: 10 });
  const { data: chartData, metricSuffix } = useROASChart({ metric: selectedKPI, timeRange, channel });

  const hasCampaigns = MOCK_CAMPAIGNS.length > 0;

  if (!hasCampaigns) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--doost-bg-secondary)]">
          <Plus className="h-6 w-6 text-[var(--doost-text-muted)]" />
        </div>
        <h2 className="mt-4 text-[16px] font-semibold text-[var(--doost-text)]">
          Inga kampanjer ännu
        </h2>
        <p className="mt-1 text-[13px] text-[var(--doost-text-muted)]">
          Kom igång genom att skapa din första annons.
        </p>
        <Link
          href="/"
          className="mt-5 flex items-center gap-1.5 rounded-lg bg-[var(--doost-bg-active)] px-4 py-2.5 text-[13px] font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Skapa din första annons
        </Link>
      </div>
    );
  }

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
