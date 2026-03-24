"use client";

import { BarChart3, Copy, MoreHorizontal, Pause, Play, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type CampaignStatus = "draft" | "live" | "paused" | "completed" | "failed";

const STATUS_STYLES: Record<CampaignStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-gray-100", text: "text-gray-600", label: "Utkast" },
  live: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Live" },
  paused: { bg: "bg-amber-50", text: "text-amber-700", label: "Pausad" },
  completed: { bg: "bg-blue-50", text: "text-blue-700", label: "Avslutad" },
  failed: { bg: "bg-red-50", text: "text-red-700", label: "Misslyckad" },
};

const MOCK_CAMPAIGNS = [
  {
    id: "1",
    name: "Planacy - Lead Gen Q1",
    status: "live" as CampaignStatus,
    channels: ["meta", "google"],
    budget: "500 SEK/dag",
    impressions: 12_450,
    clicks: 340,
    ctr: 2.73,
    spend: "3 200 SEK",
    updatedAt: "2026-03-24",
  },
  {
    id: "2",
    name: "Planacy - Brand Awareness",
    status: "paused" as CampaignStatus,
    channels: ["linkedin"],
    budget: "300 SEK/dag",
    impressions: 5_800,
    clicks: 95,
    ctr: 1.64,
    spend: "1 400 SEK",
    updatedAt: "2026-03-22",
  },
  {
    id: "3",
    name: "Planacy - Retargeting",
    status: "draft" as CampaignStatus,
    channels: ["meta"],
    budget: "-",
    impressions: 0,
    clicks: 0,
    ctr: 0,
    spend: "-",
    updatedAt: "2026-03-20",
  },
];

const CHANNEL_LABELS: Record<string, string> = {
  meta: "Meta",
  google: "Google",
  linkedin: "LinkedIn",
};

function StatusBadge({ status }: { status: CampaignStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

export default function CampaignsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Kampanjer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hantera alla dina annonskampanjer.
          </p>
        </div>
        <Button asChild>
          <a href="/chat">Skapa ny kampanj</a>
        </Button>
      </div>

      <div className="space-y-3">
        {MOCK_CAMPAIGNS.map((campaign) => (
          <div
            key={campaign.id}
            className="group flex items-center gap-4 rounded-xl border border-border/60 bg-white/60 p-4 backdrop-blur-sm transition-colors hover:bg-white/80"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{campaign.name}</h3>
                <StatusBadge status={campaign.status} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{campaign.channels.map((c) => CHANNEL_LABELS[c] ?? c).join(", ")}</span>
                <span>Budget: {campaign.budget}</span>
                <span>Uppdaterad {campaign.updatedAt}</span>
              </div>
            </div>

            {/* Metrics */}
            {campaign.status !== "draft" && (
              <div className="hidden items-center gap-6 text-center sm:flex">
                <div>
                  <div className="text-sm font-semibold">
                    {campaign.impressions.toLocaleString("sv-SE")}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Visningar
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    {campaign.clicks.toLocaleString("sv-SE")}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Klick
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    {campaign.ctr.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-muted-foreground">CTR</div>
                </div>
                <div>
                  <div className="text-sm font-semibold">{campaign.spend}</div>
                  <div className="text-[10px] text-muted-foreground">Spend</div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {campaign.status === "live" && (
                <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" title="Pausa">
                  <Pause className="h-4 w-4" />
                </button>
              )}
              {campaign.status === "paused" && (
                <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" title="Återuppta">
                  <Play className="h-4 w-4" />
                </button>
              )}
              <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" title="Duplicera">
                <Copy className="h-4 w-4" />
              </button>
              <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Ta bort">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
