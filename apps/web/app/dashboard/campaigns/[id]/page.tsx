"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Pause, Play, TrendingUp } from "lucide-react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { MOCK_CAMPAIGNS } from "@/lib/mock-data";
import { useToast } from "@/components/ui/toast";

// Mock daily data for the detail chart
const DAILY_DATA = Array.from({ length: 14 }, (_, i) => ({
  day: `Day ${i + 1}`,
  spend: Math.round(80 + Math.random() * 120),
  clicks: Math.round(150 + Math.random() * 300),
  roas: Math.round((2 + Math.random() * 3) * 10) / 10,
}));

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const campaign = MOCK_CAMPAIGNS.find((c) => c.id === id);
  const toast = useToast();

  const [status, setStatus] = useState<string>(campaign?.status ?? "draft");

  if (!campaign) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[14px] text-[var(--doost-text-muted)]">Campaign not found</p>
      </div>
    );
  }

  const isLive = status === "live";
  const isPaused = status === "paused";

  function handlePause() {
    setStatus("paused");
    toast.success("Campaign paused", campaign!.name);
    try { (window as any).posthog?.capture("campaign_paused", { campaign_id: id, campaign_name: campaign!.name }); } catch {}
  }

  function handleResume() {
    setStatus("live");
    toast.success("Campaign resumed", campaign!.name);
    try { (window as any).posthog?.capture("campaign_resumed", { campaign_id: id, campaign_name: campaign!.name }); } catch {}
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/campaigns" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--doost-text-muted)] hover:bg-[var(--doost-bg)]">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-[18px] font-semibold text-[var(--doost-text)]">{campaign.name}</h1>
          <p className="text-[12px] capitalize text-[var(--doost-text-muted)]">
            {campaign.platform} · Started {campaign.startDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <button onClick={handlePause} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium text-[var(--doost-text-secondary)] hover:bg-[var(--doost-bg-secondary)]" style={{ border: "1px solid var(--doost-border)" }}>
              <Pause className="h-3.5 w-3.5" /> Pause
            </button>
          )}
          {isPaused && (
            <button onClick={handleResume} className="flex items-center gap-1.5 rounded-lg bg-[var(--doost-bg-active)] px-3 py-2 text-[12px] font-medium text-white hover:opacity-90">
              <Play className="h-3.5 w-3.5" /> Resume
            </button>
          )}
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${isLive ? "bg-[var(--doost-bg-badge-ready)] text-[var(--doost-text-positive)]" : "bg-[var(--doost-bg-secondary)] text-[var(--doost-text-secondary)]"}`}>
            {status}
          </span>
        </div>
      </div>

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-5 gap-3">
        {[
          { label: "Impressions", value: campaign.impressions.toLocaleString() },
          { label: "Clicks", value: campaign.clicks.toLocaleString() },
          { label: "CTR", value: `${campaign.ctr}%` },
          { label: "Total Spend", value: `$${campaign.totalSpend.toLocaleString()}` },
          { label: "ROAS", value: `${campaign.roas}x` },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] p-4" style={{ border: "1px solid var(--doost-border)" }}>
            <div className="text-[11px] text-[var(--doost-text-muted)]">{kpi.label}</div>
            <div className="mt-1 text-[20px] font-bold text-[var(--doost-text)]">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Daily performance chart */}
      <div className="mb-6 rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] p-6" style={{ border: "1px solid var(--doost-border)" }}>
        <h3 className="mb-4 text-[14px] font-semibold text-[var(--doost-text)]">Daily Performance</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={DAILY_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--doost-border)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--doost-text-muted)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--doost-text-muted)" }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="clicks" stroke="var(--doost-chart-current)" strokeWidth={2} dot={false} name="Clicks" />
            <Line type="monotone" dataKey="spend" stroke="var(--doost-bg-active)" strokeWidth={1.5} strokeDasharray="6 4" dot={false} name="Spend ($)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Campaign settings */}
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] p-5" style={{ border: "1px solid var(--doost-border)" }}>
          <h3 className="mb-3 text-[14px] font-semibold text-[var(--doost-text)]">Settings</h3>
          <div className="space-y-2.5 text-[13px]">
            <div className="flex justify-between"><span className="text-[var(--doost-text-muted)]">Platform</span><span className="capitalize text-[var(--doost-text)]">{campaign.platform}</span></div>
            <div className="flex justify-between"><span className="text-[var(--doost-text-muted)]">Daily budget</span><span className="text-[var(--doost-text)]">${campaign.dailyBudget}/day</span></div>
            <div className="flex justify-between"><span className="text-[var(--doost-text-muted)]">Start date</span><span className="text-[var(--doost-text)]">{campaign.startDate}</span></div>
            {campaign.endDate && <div className="flex justify-between"><span className="text-[var(--doost-text-muted)]">End date</span><span className="text-[var(--doost-text)]">{campaign.endDate}</span></div>}
          </div>
        </div>

        <div className="rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] p-5" style={{ border: "1px solid var(--doost-border)" }}>
          <h3 className="mb-3 text-[14px] font-semibold text-[var(--doost-text)]">AI Insights</h3>
          <div className="space-y-2 text-[12px] text-[var(--doost-text-secondary)]">
            {campaign.roas >= 3 ? (
              <>
                <div className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--doost-text-positive)]" />
                  <p>Strong ROAS at {campaign.roas}x — this campaign is profitable and can be scaled.</p>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--doost-text-positive)]" />
                  <p>Consider increasing budget by 20-30% to capture more conversions.</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--doost-text-muted)]" />
                  <p>ROAS at {campaign.roas}x is below target. Consider refreshing creative or adjusting targeting.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
