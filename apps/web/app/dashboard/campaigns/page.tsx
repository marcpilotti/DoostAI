"use client";

import { Copy, MoreHorizontal, Pause, Play, Plus } from "lucide-react";
import Link from "next/link";

import { MOCK_CAMPAIGNS } from "@/lib/mock-data";
import type { Campaign } from "@/lib/mock-data";

const STATUS_STYLES: Record<Campaign["status"], { bg: string; text: string; label: string }> = {
  live: { bg: "bg-[var(--doost-bg-badge-ready)]", text: "text-[var(--doost-text-positive)]", label: "Live" },
  paused: { bg: "bg-[var(--doost-bg-badge-review)]", text: "text-[#E65100]", label: "Paused" },
  review: { bg: "bg-[var(--doost-bg-badge-review)]", text: "text-[#E65100]", label: "In review" },
  draft: { bg: "bg-[var(--doost-bg-secondary)]", text: "text-[var(--doost-text-secondary)]", label: "Draft" },
  completed: { bg: "bg-[var(--doost-bg-secondary)]", text: "text-[var(--doost-text-secondary)]", label: "Completed" },
};

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "google") return <div className="h-4 w-4 rounded-full bg-[#4285F4]" />;
  if (platform === "linkedin") return <div className="h-4 w-4 rounded-sm bg-[#0A66C2]" />;
  return <div className="h-4 w-4 rounded-full bg-[#0081FB]" />;
}

export default function CampaignsPage() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-[var(--doost-text)]">Campaigns</h2>
        <Link href="/" className="flex items-center gap-1.5 rounded-lg bg-[var(--doost-bg-active)] px-3 py-2 text-[12px] font-medium text-white hover:opacity-90">
          <Plus className="h-3.5 w-3.5" /> New campaign
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)]" style={{ border: `1px solid var(--doost-border)` }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b text-left text-[11px] font-medium uppercase tracking-wider text-[var(--doost-text-muted)]" style={{ borderColor: "var(--doost-border)" }}>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Budget</th>
              <th className="px-4 py-3 text-right">Spend</th>
              <th className="px-4 py-3 text-right">ROAS</th>
              <th className="px-4 py-3 text-right">Clicks</th>
              <th className="px-4 py-3 text-right">CTR</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {MOCK_CAMPAIGNS.map((c) => {
              const s = STATUS_STYLES[c.status];
              return (
                <tr key={c.id} className="border-b last:border-0 transition-colors hover:bg-[var(--doost-bg-secondary)]" style={{ borderColor: "var(--doost-border)" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={c.platform} />
                      <span className="font-medium text-[var(--doost-text)]">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.text}`}>{s.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--doost-text)]">${c.dailyBudget}/d</td>
                  <td className="px-4 py-3 text-right text-[var(--doost-text)]">${c.totalSpend.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[var(--doost-text)]">{c.roas > 0 ? `${c.roas}x` : "—"}</td>
                  <td className="px-4 py-3 text-right text-[var(--doost-text)]">{c.clicks > 0 ? c.clicks.toLocaleString() : "—"}</td>
                  <td className="px-4 py-3 text-right text-[var(--doost-text)]">{c.ctr > 0 ? `${c.ctr}%` : "—"}</td>
                  <td className="px-4 py-3">
                    <button className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--doost-text-muted)] hover:bg-[var(--doost-bg-secondary)]">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
