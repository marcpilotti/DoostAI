"use client";

import { lazy, Suspense, useState } from "react";
import { Pencil, Palette, RectangleHorizontal, Rocket } from "lucide-react";

import { AdPreviewSkeleton } from "./ad-preview-skeleton";

// Lazy-load each preview as a separate chunk
const MetaAdPreview = lazy(
  () => import(/* webpackChunkName: "meta-preview" */ "./meta-ad-preview"),
);
const GoogleAdPreview = lazy(
  () => import(/* webpackChunkName: "google-preview" */ "./google-ad-preview"),
);
const LinkedInAdPreview = lazy(
  () => import(/* webpackChunkName: "linkedin-preview" */ "./linkedin-ad-preview"),
);

// Preload on hover
const preloaders: Record<string, () => void> = {
  meta: () => { import("./meta-ad-preview"); },
  google: () => { import("./google-ad-preview"); },
  linkedin: () => { import("./linkedin-ad-preview"); },
};

type AdData = {
  platform: string;
  headline: string;
  bodyCopy: string;
  cta: string;
  headlines?: string[];
  descriptions?: string[];
};

type BrandData = {
  name: string;
  url: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  industry?: string;
};

type AdPreviewData = {
  ads: AdData[];
  brand: BrandData;
  platforms: string[];
};

const PLATFORM_LABELS: Record<string, string> = {
  meta: "Meta / Instagram",
  google: "Google Search",
  linkedin: "LinkedIn",
};

export function AdPreviewTabs({ data }: { data: AdPreviewData }) {
  const available = data.platforms.filter((p) =>
    data.ads.some((a) => a.platform === p),
  );
  const [activeTab, setActiveTab] = useState(available[0] ?? "meta");

  const activeAd = data.ads.find((a) => a.platform === activeTab);

  return (
    <div className="mt-1 space-y-3">
      {/* Platform tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
        {available.map((platform) => (
          <button
            key={platform}
            onClick={() => setActiveTab(platform)}
            onMouseEnter={() => preloaders[platform]?.()}
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

      {/* Preview — lazy loaded with Suspense */}
      <div className="flex justify-center">
        <Suspense fallback={<AdPreviewSkeleton platform={activeTab} />}>
        {activeAd && activeTab === "meta" && (
          <MetaAdPreview
            data={{
              brandName: data.brand.name,
              brandUrl: data.brand.url,
              primaryColor: data.brand.colors.primary,
              headline: activeAd.headline,
              bodyCopy: activeAd.bodyCopy,
              cta: activeAd.cta,
            }}
          />
        )}
        {activeAd && activeTab === "google" && (
          <GoogleAdPreview
            data={{
              brandName: data.brand.name,
              brandUrl: data.brand.url,
              headline: activeAd.headline,
              bodyCopy: activeAd.bodyCopy,
              headlines: activeAd.headlines,
              descriptions: activeAd.descriptions,
            }}
          />
        )}
        {activeAd && activeTab === "linkedin" && (
          <LinkedInAdPreview
            data={{
              brandName: data.brand.name,
              brandUrl: data.brand.url,
              primaryColor: data.brand.colors.primary,
              headline: activeAd.headline,
              bodyCopy: activeAd.bodyCopy,
              cta: activeAd.cta,
            }}
          />
        )}
        </Suspense>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { icon: Pencil, label: "Redigera text" },
          { icon: Palette, label: "Ändra stil" },
          { icon: RectangleHorizontal, label: "Annat format" },
          { icon: Rocket, label: "Publicera" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-white/80 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AdPreviewLoading() {
  return (
    <div className="mt-1 space-y-3">
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
        {["Meta", "Google", "LinkedIn"].map((p) => (
          <div key={p} className="flex-1 rounded-lg bg-muted/30 px-3 py-1.5 text-center text-xs text-muted-foreground/50">
            {p}
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <AdPreviewSkeleton platform="meta" />
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        Genererar annonser...
      </div>
    </div>
  );
}
