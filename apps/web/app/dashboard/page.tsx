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
    const steps = [
      { label: "Konto skapat", done: true, href: "/dashboard/settings" },
      { label: "Skapa din första annons", done: false, href: "/" },
      { label: "Se dina resultat", done: false, href: "/dashboard" },
    ];

    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
          <h2 className="mb-1 text-[16px] font-semibold text-[var(--doost-text)]">
            Kom igång med Doost AI
          </h2>
          <p className="mb-5 text-[13px] text-[var(--doost-text-muted)]">
            Följ stegen nedan för att lansera din första kampanj.
          </p>
          <ul className="space-y-3">
            {steps.map((step) => (
              <li key={step.label}>
                <Link href={step.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--doost-bg-secondary)]">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] ${step.done ? "bg-[var(--doost-bg-active)] text-white" : "border border-[var(--doost-text-muted)]/20 text-[var(--doost-text-muted)]"}`}>
                    {step.done ? "\u2713" : "\u25CB"}
                  </span>
                  <span className={`text-[14px] font-medium ${step.done ? "text-[var(--doost-text-muted)] line-through" : "text-[var(--doost-text)]"}`}>
                    {step.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
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
