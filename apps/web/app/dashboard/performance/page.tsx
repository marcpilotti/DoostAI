"use client";

import { useEffect } from "react";

import type { Campaign } from "@/lib/mock-data";
import { MOCK_CAMPAIGNS } from "@/lib/mock-data";

// ── Funnel visualization ─────────────────────────────────────────

function Funnel({ campaign }: { campaign: Campaign }) {
  const steps = [
    { label: "Impressions", value: campaign.impressions, color: "var(--doost-bg-active)" },
    { label: "Clicks", value: campaign.clicks, color: "var(--doost-chart-current)" },
    { label: "Conversions", value: Math.round(campaign.clicks * 0.08), color: "#7C3AED" },
  ];

  const maxValue = steps[0]?.value ?? 1;

  return (
    <div className="mt-4 space-y-2">
      {steps.map((step, i) => {
        const pct = maxValue > 0 ? (step.value / maxValue) * 100 : 0;
        const dropoff = i > 0 ? Math.round((1 - step.value / (steps[i - 1]?.value ?? 1)) * 100) : 0;
        return (
          <div key={step.label}>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="text-[var(--doost-text-secondary)]">{step.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--doost-text)]">{step.value.toLocaleString()}</span>
                {i > 0 && dropoff > 0 && (
                  <span className="text-[var(--doost-text-negative)]">-{dropoff}%</span>
                )}
              </div>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--doost-bg-secondary)]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: step.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────

export default function PerformancePage() {
  useEffect(() => { document.title = "Performance — Doost AI"; }, []);
  const liveCampaigns = MOCK_CAMPAIGNS.filter((c) => c.status === "live" || c.status === "completed");

  return (
    <div className="p-6">
      <h2 className="mb-6 text-[18px] font-semibold text-[var(--doost-text)]">Performance</h2>

      <div className="space-y-4">
        {liveCampaigns.map((c) => (
          <div key={c.id} className="rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] p-5" style={{ border: `1px solid var(--doost-border)` }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--doost-text)]">{c.name}</h3>
                <p className="text-[12px] capitalize text-[var(--doost-text-muted)]">{c.platform} · {c.startDate}{c.endDate ? ` — ${c.endDate}` : ""}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${c.status === "live" ? "bg-[var(--doost-bg-badge-ready)] text-[var(--doost-text-positive)]" : "bg-[var(--doost-bg-secondary)] text-[var(--doost-text-secondary)]"}`}>
                {c.status === "live" ? "Live" : "Completed"}
              </span>
            </div>

            {/* KPI row */}
            <div className="mt-4 grid grid-cols-5 gap-4">
              {[
                { label: "Impressions", value: c.impressions.toLocaleString() },
                { label: "Clicks", value: c.clicks.toLocaleString() },
                { label: "CTR", value: `${c.ctr}%` },
                { label: "Spend", value: `$${c.totalSpend.toLocaleString()}` },
                { label: "ROAS", value: `${c.roas}x` },
              ].map((m) => (
                <div key={m.label}>
                  <div className="text-[11px] text-[var(--doost-text-muted)]">{m.label}</div>
                  <div className="mt-0.5 text-[16px] font-bold text-[var(--doost-text)]">{m.value}</div>
                </div>
              ))}
            </div>

            {/* Funnel */}
            {c.impressions > 0 && <Funnel campaign={c} />}
          </div>
        ))}
      </div>
    </div>
  );
}
