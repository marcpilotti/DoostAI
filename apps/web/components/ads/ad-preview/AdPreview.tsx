"use client";

/**
 * AdPreview — main entry point.
 *
 * Container with:
 * - Dynamic scaling (never overflows viewport)
 * - A/B variant toggle with crossfade
 * - Format switcher (header)
 * - Action bar (publish, etc.)
 *
 * RULES:
 * - No scroll — ever
 * - max-height: calc(100vh - header - input)
 * - overflow: hidden on container
 * - Preview scales down via CSS if too large
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowRight, Check } from "lucide-react";
import { AdPreviewSwitcher } from "./AdPreviewSwitcher";
import { AdPreviewMeta } from "./AdPreviewMeta";
import { AdPreviewGoogle } from "./AdPreviewGoogle";
import { AdPreviewLinkedIn } from "./AdPreviewLinkedIn";
import type { AdData, AdFormat, AdPreviewProps } from "./types";

// ── Main Component ───────────────────────────────────────────────

export function AdPreview({
  variantA,
  variantB,
  format: initialFormat,
  strategy,
  onFormatChange,
  onWinnerSelected,
  onPublish,
  editable = true,
  autoGenerateImage = true,
  defaultCompareMode = "sidebyside",
}: AdPreviewProps) {
  const [format, setFormat] = useState<AdFormat>(initialFormat ?? "meta-feed");
  const [activeVariant, setActiveVariant] = useState<"A" | "B">("A");
  const [winner, setWinner] = useState<"A" | "B" | null>(null);
  const [compareMode, setCompareMode] = useState<"toggle" | "sidebyside">(
    variantB ? defaultCompareMode : "toggle",
  );

  // Image cache per format+variant — avoids regenerating on format switch
  const [imageCache, setImageCache] = useState<Record<string, string>>({});

  const getImageCacheKey = (f: AdFormat, v: "A" | "B") => `${f}:${v}`;

  const handleImageGenerated = (imageUrl: string, f: AdFormat, v: "A" | "B") => {
    setImageCache((prev) => ({ ...prev, [getImageCacheKey(f, v)]: imageUrl }));
  };

  // Get cached image for current format (passed to sub-components)
  const cachedImageA = imageCache[getImageCacheKey(format, "A")] ?? null;
  const cachedImageB = imageCache[getImageCacheKey(format, "B")] ?? null;

  // Container ref for dynamic scaling
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Calculate scale factor so preview fits container
  useEffect(() => {
    if (!containerRef.current || !previewRef.current) return;

    const observer = new ResizeObserver(() => {
      const container = containerRef.current;
      const preview = previewRef.current;
      if (!container || !preview) return;

      const containerH = container.clientHeight;
      const previewH = preview.scrollHeight;

      if (previewH > containerH && containerH > 0) {
        setScale(Math.max(0.6, containerH / previewH));
      } else {
        setScale(1);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [format, compareMode]);

  // Handle format change
  const handleFormatChange = useCallback((f: AdFormat) => {
    setFormat(f);
    onFormatChange?.(f);
  }, [onFormatChange]);

  // Handle winner selection
  function handleWinnerSelect(v: "A" | "B") {
    setWinner(v);
    onWinnerSelected?.(v);
  }

  // Handle publish
  function handlePublish() {
    const selectedData = winner === "B" && variantB ? variantB : variantA;
    onPublish?.(selectedData);
  }

  // Determine which data to show
  const showBothVariants = variantB && compareMode === "sidebyside";
  const currentData = activeVariant === "B" && variantB ? variantB : variantA;

  return (
    <div
      className="animate-card-in flex flex-col overflow-hidden rounded-[20px] border border-border/30 bg-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl"
      style={{ maxHeight: "calc(100vh - 150px)" }}
    >
      {/* Header + format tabs */}
      <AdPreviewSwitcher
        activeFormat={format}
        onFormatChange={handleFormatChange}
      />

      {/* A/B toggle (if variant B exists) */}
      {variantB && (
        <div className="flex items-center justify-center gap-1 border-b border-border/10 py-1.5">
          {/* Variant pills */}
          <div className="flex rounded-full bg-muted/30 p-0.5">
            <button
              onClick={() => { setActiveVariant("A"); if (compareMode === "toggle") setCompareMode("toggle"); }}
              className={`relative rounded-full px-3 py-1 text-[10px] font-semibold transition-all ${
                activeVariant === "A" || compareMode === "sidebyside"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              A
              {winner === "A" && <Check className="ml-1 inline h-2.5 w-2.5 text-emerald-500" />}
            </button>
            <button
              onClick={() => { setActiveVariant("B"); if (compareMode === "toggle") setCompareMode("toggle"); }}
              className={`relative rounded-full px-3 py-1 text-[10px] font-semibold transition-all ${
                activeVariant === "B" || compareMode === "sidebyside"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              B
              {winner === "B" && <Check className="ml-1 inline h-2.5 w-2.5 text-emerald-500" />}
            </button>
          </div>

          {/* Side-by-side toggle */}
          <button
            onClick={() => setCompareMode(compareMode === "sidebyside" ? "toggle" : "sidebyside")}
            className={`ml-2 rounded-full px-2.5 py-1 text-[9px] font-medium transition-all ${
              compareMode === "sidebyside"
                ? "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200"
                : "text-muted-foreground hover:bg-muted/30"
            }`}
          >
            {compareMode === "sidebyside" ? "Enkel vy" : "Jämför"}
          </button>
        </div>
      )}

      {/* Preview area — scales down if too large */}
      <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden">
        <div
          ref={previewRef}
          className="origin-top transition-transform duration-200"
          style={{ transform: scale < 1 ? `scale(${scale})` : undefined }}
        >
          {showBothVariants ? (
            /* Side-by-side: both variants at ~50% */
            <div className="grid grid-cols-2 gap-2 p-3">
              <div className="relative">
                <FormatRenderer data={variantA} format={format} autoGenerateImage={autoGenerateImage} imageDelay={0} cachedImage={cachedImageA} onImageReady={(url) => handleImageGenerated(url, format, "A")} />
                {/* Winner select */}
                <button
                  onClick={() => handleWinnerSelect("A")}
                  className={`absolute -top-1 left-1/2 z-10 -translate-x-1/2 rounded-full px-2 py-0.5 text-[8px] font-bold shadow transition-all ${
                    winner === "A"
                      ? "bg-emerald-500 text-white"
                      : "bg-white/80 text-muted-foreground backdrop-blur-sm hover:bg-emerald-50 hover:text-emerald-600"
                  }`}
                >
                  {winner === "A" ? "✓ Vald" : "Välj A"}
                </button>
              </div>
              <div className="relative">
                <FormatRenderer data={variantB!} format={format} autoGenerateImage={autoGenerateImage} imageDelay={3000} cachedImage={cachedImageB} onImageReady={(url) => handleImageGenerated(url, format, "B")} />
                <button
                  onClick={() => handleWinnerSelect("B")}
                  className={`absolute -top-1 left-1/2 z-10 -translate-x-1/2 rounded-full px-2 py-0.5 text-[8px] font-bold shadow transition-all ${
                    winner === "B"
                      ? "bg-emerald-500 text-white"
                      : "bg-white/80 text-muted-foreground backdrop-blur-sm hover:bg-emerald-50 hover:text-emerald-600"
                  }`}
                >
                  {winner === "B" ? "✓ Vald" : "Välj B"}
                </button>
              </div>
            </div>
          ) : (
            /* Single variant (toggle mode) */
            <div className="p-3">
              <FormatRenderer
                data={currentData}
                format={format}
                autoGenerateImage={autoGenerateImage}
                cachedImage={activeVariant === "B" ? cachedImageB : cachedImageA}
                onImageReady={(url) => handleImageGenerated(url, format, activeVariant)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Action bar — only shown when onPublish is provided */}
      {onPublish && (
        <div className="shrink-0 border-t border-border/20 px-3 py-2">
          <button
            onClick={handlePublish}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:from-emerald-600 hover:to-teal-600 hover:shadow-md active:scale-[0.98]"
          >
            Publicera
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Format renderer — picks the right preview component ──────────

function FormatRenderer({
  data,
  format,
  autoGenerateImage,
  imageDelay = 0,
  cachedImage,
  onImageReady,
}: {
  data: AdData;
  format: AdFormat;
  autoGenerateImage: boolean;
  imageDelay?: number;
  cachedImage?: string | null;
  onImageReady?: (url: string) => void;
}) {
  // Pass cached image as initial imageUrl in data (overrides broken pipeline URLs)
  const dataWithImage = cachedImage ? { ...data, imageUrl: cachedImage } : data;

  switch (format) {
    case "meta-feed":
    case "meta-stories":
      return <AdPreviewMeta data={dataWithImage} format={format} autoGenerateImage={autoGenerateImage} imageDelay={imageDelay} onImageReady={onImageReady} />;
    case "google-search":
      return <AdPreviewGoogle data={dataWithImage} />;
    case "linkedin":
      return <AdPreviewLinkedIn data={dataWithImage} autoGenerateImage={autoGenerateImage} imageDelay={imageDelay} onImageReady={onImageReady} />;
    default:
      return <AdPreviewMeta data={dataWithImage} format="meta-feed" autoGenerateImage={autoGenerateImage} imageDelay={imageDelay} onImageReady={onImageReady} />;
  }
}

// ── Re-export types for convenience ──────────────────────────────

export type { AdData, AdFormat, AdPreviewProps } from "./types";
