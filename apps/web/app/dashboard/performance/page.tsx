"use client";

import { MOCK_CAMPAIGNS } from "@/lib/mock-data";

export default function PerformancePage() {
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
          </div>
        ))}
      </div>
    </div>
  );
}
