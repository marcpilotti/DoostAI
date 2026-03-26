"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Linkedin,
  RefreshCw,
  Rocket,
} from "lucide-react";

type PlatformStatus = {
  platform: string;
  status: "deploying" | "live" | "failed" | "connect_required" | "queued";
  message: string;
  accountType?: "auto" | "oauth";
  oauthUrl?: string;
  startedAt?: string;
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

function ElapsedTimer({ startedAt }: { startedAt?: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  if (!startedAt || elapsed === 0) return null;
  return (
    <span className="ml-1 font-mono text-[9px] text-muted-foreground/50">
      ({elapsed}s)
    </span>
  );
}

function StatusIcon({ status }: { status: PlatformStatus["status"] }) {
  switch (status) {
    case "live":
      return (
        <div className="deploy-icon-enter">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        </div>
      );
    case "deploying":
    case "queued":
      return <Clock className="h-5 w-5 animate-spin text-amber-500 [animation-duration:2s]" />;
    case "failed":
      return (
        <div className="deploy-icon-enter">
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </div>
      );
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
      className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider transition-colors duration-300 ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="confetti-dot absolute left-1/2 top-1/2"
          style={{
            "--angle": `${i * 36}deg`,
            "--color": ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#3b82f6", "#8b5cf6", "#06b6d4", "#f97316", "#14b8a6", "#e11d48"][i],
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export function CampaignDeploymentStatus({
  data,
  onRetry,
}: {
  data: DeploymentData;
  onRetry?: (platform: string) => void;
}) {
  const allLive = data.platforms.every((p) => p.status === "live");
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (allLive) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [allLive]);

  return (
    <div className="relative mt-1 space-y-3">
      {showConfetti && <Confetti />}

      {/* Header */}
      <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 p-3">
        <Rocket className={`h-5 w-5 text-indigo-500 ${allLive ? "" : "animate-pulse"}`} />
        <div className="flex-1">
          <div className="text-sm font-semibold">
            {allLive ? "Alla kampanjer är live!" : "Kampanjdistribution"}
          </div>
          {data.budget && (
            <div className="text-xs text-muted-foreground">
              Budget: {data.budget.daily} {data.budget.currency}/dag
              {data.campaignName && ` — ${data.campaignName}`}
            </div>
          )}
        </div>
        {allLive && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-700">
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
              className="flex items-center gap-3 rounded-xl border border-border/40 bg-white/60 px-4 py-3 backdrop-blur-sm transition-all duration-300"
            >
              <StatusIcon status={p.status} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {meta?.label ?? p.platform}
                  </span>
                  <StatusBadge status={p.status} />
                  {p.status === "deploying" && (
                    <ElapsedTimer startedAt={p.startedAt} />
                  )}
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

              {p.status === "failed" && onRetry && (
                <button
                  onClick={() => onRetry(p.platform)}
                  className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                >
                  <RefreshCw className="h-3 w-3" />
                  Försök igen
                </button>
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
          <div className="h-3.5 w-32 animate-shimmer rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]/60" />
          <div className="h-2.5 w-20 animate-shimmer rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]/40" />
        </div>
      </div>
      {[1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-border/40 bg-white/60 px-4 py-3"
        >
          <div className="h-5 w-5 animate-pulse rounded-full bg-muted/50" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-24 animate-shimmer rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]/50" />
            <div className="h-2.5 w-40 animate-shimmer rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]/30" />
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
