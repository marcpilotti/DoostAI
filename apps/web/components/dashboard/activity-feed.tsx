"use client";

import { Clock } from "lucide-react";

import type { ActivityItem } from "@/lib/mock-data";

// ── Platform icons — match reference ─────────────────────────────

function PlatformIcon({ platform }: { platform: "meta" | "google" | "linkedin" }) {
  if (platform === "google") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    );
  }
  if (platform === "linkedin") {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-[var(--brand-linkedin)]">
        <span className="text-[9px] font-bold text-white">in</span>
      </div>
    );
  }
  // Meta — blue circle with infinity symbol
  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-meta)]">
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="white">
        <path d="M12 10.2c-1.3-1.8-2.6-3-4.2-3C5.4 7.2 4 9.6 4 12s1.4 4.8 3.8 4.8c1.6 0 2.9-1.2 4.2-3 1.3 1.8 2.6 3 4.2 3 2.4 0 3.8-2.4 3.8-4.8s-1.4-4.8-3.8-4.8c-1.6 0-2.9 1.2-4.2 3z" />
      </svg>
    </div>
  );
}

function StatusBadge({ text, variant }: { text: string; variant: "review" | "ready" | "default" }) {
  const styles = {
    review: "bg-[var(--doost-bg-badge-review)] text-[var(--color-warning,#E65100)]",
    ready: "bg-[var(--doost-bg-badge-ready)] text-[var(--doost-text-positive)]",
    default: "bg-[var(--doost-bg-secondary)] text-[var(--doost-text-secondary)]",
  };

  return (
    <span role="status" className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles[variant]}`}>
      {text}
    </span>
  );
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div>
      <h2 className="mb-4 text-[16px] font-semibold text-[var(--doost-text)]">Kampanjaktivitet</h2>
      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--doost-bg)]"
          >
            <PlatformIcon platform={item.platform} />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
                <span className="font-semibold text-[var(--doost-text)]">{item.campaignName}</span>
                <span className="text-[var(--doost-text-secondary)]">{item.action}</span>
                {item.statusFrom && (
                  <>
                    <StatusBadge text={item.statusFrom} variant="review" />
                    <span className="text-[var(--doost-text-muted)]">→</span>
                  </>
                )}
                {item.statusTo && (
                  <StatusBadge text={item.statusTo} variant="ready" />
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--doost-text-muted)]">
              <Clock className="h-3 w-3" />
              {item.timestamp}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
