"use client";

import { CheckCircle2, Clock, ExternalLink, Linkedin, AlertTriangle, Rocket } from "lucide-react";

type PlatformStatus = {
  platform: string;
  status: "deploying" | "live" | "failed" | "connect_required" | "queued";
  message: string;
  accountType?: "auto" | "oauth";
  oauthUrl?: string;
};

type DeploymentData = {
  platforms: PlatformStatus[];
  budget?: { daily: number; currency: string };
  campaignName?: string;
};

const PLATFORM_META: Record<string, { label: string; color: string }> = {
  meta: { label: "Meta / Instagram", color: "#1877F2" },
  google: { label: "Google Ads", color: "#4285F4" },
  linkedin: { label: "LinkedIn", color: "#0077B5" },
};

function StatusIcon({ status }: { status: PlatformStatus["status"] }) {
  switch (status) {
    case "live":
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case "deploying":
    case "queued":
      return <Clock className="h-5 w-5 animate-pulse text-amber-500" />;
    case "failed":
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case "connect_required":
      return <Linkedin className="h-5 w-5 text-[#0077B5]" />;
  }
}

function StatusBadge({ status }: { status: PlatformStatus["status"] }) {
  const styles: Record<string, string> = {
    live: "bg-emerald-50 text-emerald-700",
    deploying: "bg-amber-50 text-amber-700",
    queued: "bg-gray-50 text-gray-600",
    failed: "bg-red-50 text-red-700",
    connect_required: "bg-blue-50 text-blue-700",
  };

  const labels: Record<string, string> = {
    live: "Live",
    deploying: "Publicerar...",
    queued: "I kö",
    failed: "Misslyckades",
    connect_required: "Anslut konto",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function CampaignDeploymentStatus({ data }: { data: DeploymentData }) {
  const allLive = data.platforms.every((p) => p.status === "live");

  return (
    <div className="mt-1 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 p-3">
        <Rocket className="h-5 w-5 text-indigo-500" />
        <div className="flex-1">
          <div className="text-sm font-semibold">
            {allLive
              ? "Alla kampanjer är live!"
              : "Kampanjdistribution"}
          </div>
          {data.budget && (
            <div className="text-xs text-muted-foreground">
              Budget: {data.budget.daily} {data.budget.currency}/dag
              {data.campaignName && ` — ${data.campaignName}`}
            </div>
          )}
        </div>
        {allLive && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            Alla live
          </span>
        )}
      </div>

      {/* Platform list */}
      <div className="space-y-2">
        {data.platforms.map((p) => {
          const meta = PLATFORM_META[p.platform];
          return (
            <div
              key={p.platform}
              className="flex items-center gap-3 rounded-xl border border-border/40 bg-white/60 px-4 py-3 backdrop-blur-sm"
            >
              <StatusIcon status={p.status} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {meta?.label ?? p.platform}
                  </span>
                  <StatusBadge status={p.status} />
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {p.message}
                </div>
              </div>
              {p.status === "connect_required" && p.oauthUrl && (
                <a
                  href={p.oauthUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-lg bg-[#0077B5] px-3 py-1.5 text-xs font-medium text-white"
                >
                  Anslut
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CampaignDeploymentLoading() {
  return (
    <div className="mt-1 space-y-3">
      <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 p-3">
        <Rocket className="h-5 w-5 animate-pulse text-indigo-500" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-32 animate-pulse rounded bg-muted/60" />
          <div className="h-2.5 w-20 animate-pulse rounded bg-muted/40" />
        </div>
      </div>
      {[1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-border/40 bg-white/60 px-4 py-3"
        >
          <div className="h-5 w-5 animate-pulse rounded-full bg-muted/50" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-24 animate-pulse rounded bg-muted/50" />
            <div className="h-2.5 w-40 animate-pulse rounded bg-muted/30" />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        Förbereder distribution...
      </div>
    </div>
  );
}
