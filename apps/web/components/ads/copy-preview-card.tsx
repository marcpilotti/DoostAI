"use client";

import { useState } from "react";

type CopyData = {
  platform: string;
  headline: string;
  bodyCopy: string;
  cta: string;
  headlines?: string[];
  descriptions?: string[];
};

type CopyPreviewData = {
  copies: CopyData[];
  platforms: string[];
  renderingImages: boolean;
};

const PLATFORM_LABELS: Record<string, string> = {
  meta: "Meta / Instagram",
  google: "Google Search",
  linkedin: "LinkedIn",
};

const CHAR_LIMITS: Record<string, Record<string, number>> = {
  meta: { headline: 40, bodyCopy: 125, cta: 20 },
  google: { headline: 30, description: 90 },
  linkedin: { headline: 70, bodyCopy: 150, cta: 20 },
};

function CharCount({ current, max }: { current: number; max: number }) {
  const over = current > max;
  return (
    <span
      className={`ml-2 font-mono text-[10px] ${over ? "text-red-500" : "text-muted-foreground/40"}`}
    >
      {current}/{max}
    </span>
  );
}

export function CopyPreviewCard({ data }: { data: CopyPreviewData }) {
  const available = data.platforms.filter((p) =>
    data.copies.some((c) => c.platform === p),
  );
  const [activeTab, setActiveTab] = useState(available[0] ?? "meta");
  const activeCopy = data.copies.find((c) => c.platform === activeTab);
  const limits = CHAR_LIMITS[activeTab];

  return (
    <div className="mt-1 space-y-3">
      {/* Platform tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
        {available.map((platform) => (
          <button
            key={platform}
            onClick={() => setActiveTab(platform)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === platform
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {PLATFORM_LABELS[platform] ?? platform}
          </button>
        ))}
      </div>

      {/* Copy content */}
      {activeCopy && (
        <div className="rounded-xl border border-border/40 bg-white/60 p-4 backdrop-blur-sm">
          {activeTab === "google" && activeCopy.headlines ? (
            <>
              <div className="space-y-2">
                {activeCopy.headlines.map((h, i) => (
                  <div key={i} className="flex items-baseline">
                    <span className="text-xs text-muted-foreground/50 w-6">H{i + 1}</span>
                    <span className="text-sm font-semibold text-[#1a0dab]">{h}</span>
                    <CharCount current={h.length} max={limits?.headline ?? 30} />
                  </div>
                ))}
              </div>
              {activeCopy.descriptions && (
                <div className="mt-3 space-y-1.5">
                  {activeCopy.descriptions.map((d, i) => (
                    <div key={i} className="flex items-baseline">
                      <span className="text-xs text-muted-foreground/50 w-6">D{i + 1}</span>
                      <span className="text-sm text-foreground/70">{d}</span>
                      <CharCount current={d.length} max={limits?.description ?? 90} />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-baseline">
                <span className="text-sm font-semibold">{activeCopy.headline}</span>
                <CharCount
                  current={activeCopy.headline.length}
                  max={limits?.headline ?? 40}
                />
              </div>
              <div className="mt-2 flex items-baseline">
                <span className="text-sm text-foreground/70">{activeCopy.bodyCopy}</span>
                <CharCount
                  current={activeCopy.bodyCopy.length}
                  max={limits?.bodyCopy ?? 125}
                />
              </div>
              <div className="mt-3">
                <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {activeCopy.cta}
                </span>
                <CharCount
                  current={activeCopy.cta.length}
                  max={limits?.cta ?? 20}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Rendering status */}
      {data.renderingImages && (
        <div className="flex items-center gap-2 rounded-lg bg-indigo-50/50 px-3 py-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
          <span className="text-xs text-indigo-600">
            Genererar visuella förhandsvisningar...
          </span>
          <div className="ml-auto flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1 w-6 animate-pulse rounded-full bg-indigo-200"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
