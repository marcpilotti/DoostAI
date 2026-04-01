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
  useEffect(() => { document.title = "Hem — Doost AI"; }, []);
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
          <h1 className="mb-1 text-[16px] font-semibold text-[var(--doost-text)]">
            Kom igång med Doost AI
          </h1>
          <p className="mb-3 text-[13px] text-[var(--doost-text-muted)]">
            Följ stegen nedan för att lansera din första kampanj.
          </p>
          {/* Progress bar */}
          <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-[var(--doost-bg-secondary)]">
            <div
              className="h-1 rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.round((steps.filter((s) => s.done).length / steps.length) * 100)}%` }}
            />
          </div>
          <p className="mb-4 text-[11px] text-[var(--doost-text-muted)]">
            {steps.filter((s) => s.done).length} av {steps.length} steg klara
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
      <h1 className="text-lg sm:text-[22px] font-semibold text-[var(--doost-text)]">Hem</h1>

      {/* Welcome back quick actions */}
      <div className="mt-3 mb-2 flex flex-wrap gap-2">
        <Link
          href="/"
          className="rounded-full bg-primary px-3.5 py-1.5 text-[12px] font-medium text-primary-foreground hover:opacity-90"
        >
          Ny kampanj
        </Link>
        <Link
          href="/dashboard/analytics"
          className="rounded-full px-3.5 py-1.5 text-[12px] font-medium text-[var(--doost-text-secondary)] hover:bg-[var(--doost-bg)]"
          style={{ border: "1px solid var(--doost-border)" }}
        >
          Se resultat
        </Link>
        <Link
          href="/?new=true"
          className="rounded-full px-3.5 py-1.5 text-[12px] font-medium text-[var(--doost-text-secondary)] hover:bg-[var(--doost-bg)]"
          style={{ border: "1px solid var(--doost-border)" }}
        >
          Analysera ny URL
        </Link>
      </div>

      <div className="mt-4 mb-6">
        <ChannelFilter
          timeRange={timeRange}
          channel={channel}
          onTimeRangeChange={setTimeRange}
          onChannelChange={setChannel}
        />
      </div>

      <div>
        <p className="mb-3 text-[12px] font-medium text-[var(--doost-text-muted)]">Översikt</p>
        <KPICards
          kpis={kpis}
          selectedId={selectedKPI}
          onSelect={setSelectedKPI}
        />
      </div>

      <div className="mt-8">
        <PerformanceChart data={chartData} metricSuffix={metricSuffix} />
      </div>

      <div className="mt-8">
        <ActivityFeed items={activityItems} />
      </div>
    </div>
  );
}
