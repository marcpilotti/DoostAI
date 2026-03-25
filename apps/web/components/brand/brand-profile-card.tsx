"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  ExternalLink,
  FileText,
  Image,
  MapPin,
  Pencil,
  Type,
} from "lucide-react";

import { ColorEditor } from "./color-editor";

type BrandColors = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
};

type BrandProfileData = {
  url: string;
  name: string;
  description?: string;
  industry?: string;
  employeeCount?: number;
  revenue?: string;
  location?: string;
  colors: BrandColors;
  fonts: { heading: string; body: string };
  logos?: { primary?: string; icon?: string; dark?: string };
  brandVoice: string;
  targetAudience: string;
  _analysisMs?: number;
  _enrichmentStatus?: string;
  valuePropositions: string[];
};

function stripCompanySuffix(name: string): string {
  return name
    .replace(/\s+(AB|HB|KB|Ek\.?\s*för\.?|Kommanditbolag|Handelsbolag|Inc\.?|Ltd\.?|LLC|GmbH|Corp\.?|Co\.?)$/i, "")
    .trim();
}

function ColorSwatch({
  color,
  label,
  role,
  originalColor,
  onColorChange,
}: {
  color: string;
  label: string;
  role: string;
  originalColor: string;
  onColorChange?: (newColor: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => onColorChange && setOpen(!open)}
        className="flex flex-col items-center gap-1 rounded-lg p-1.5 transition-colors hover:bg-white/60"
        title="Klicka för att ändra"
      >
        <div
          className="h-8 w-8 rounded-full border-2 border-white shadow-md"
          style={{ backgroundColor: color }}
        />
        <div className="text-center">
          <div className="text-[9px] font-medium text-white/70">{label}</div>
          <div className="font-mono text-[10px] text-white/90">{color}</div>
        </div>
      </button>
      {open && onColorChange && (
        <ColorEditor
          role={role}
          currentColor={color}
          originalColor={originalColor}
          onColorChange={onColorChange}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

export function BrandProfileCard({ data }: { data: BrandProfileData }) {
  const [colors, setColors] = useState(data.colors);
  const [logoUrl, setLogoUrl] = useState<string | null>(
    data.logos?.primary ?? data.logos?.icon ?? null,
  );
  const [fontFile, setFontFile] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const originalColors = data.colors;

  useEffect(() => {
    function handleLogoSelected(e: Event) {
      const detail = (e as CustomEvent<{ url: string }>).detail;
      if (detail?.url) setLogoUrl(detail.url);
    }
    window.addEventListener("doost:logo-selected", handleLogoSelected);
    return () => window.removeEventListener("doost:logo-selected", handleLogoSelected);
  }, []);

  function updateColor(role: keyof typeof colors, newColor: string) {
    setColors((prev) => ({ ...prev, [role]: newColor }));
  }

  const displayName = stripCompanySuffix(data.name);
  const domain = data.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="mt-1 overflow-hidden rounded-2xl border border-border/20 shadow-sm">
      {/* Branded gradient header */}
      <div
        className="relative px-5 pb-10 pt-5"
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent || colors.secondary} 100%)`,
        }}
      >
        {/* Color swatches floating in header */}
        <div className="flex items-center justify-end gap-2">
          <span className="mr-auto text-[9px] font-medium uppercase tracking-wider text-white/50">
            Klicka för att ändra
          </span>
          <ColorSwatch color={colors.primary} label="Primär" role="primary" originalColor={originalColors.primary} onColorChange={(c) => updateColor("primary", c)} />
          <ColorSwatch color={colors.secondary} label="Sekundär" role="secondary" originalColor={originalColors.secondary} onColorChange={(c) => updateColor("secondary", c)} />
          <ColorSwatch color={colors.accent} label="Accent" role="accent" originalColor={originalColors.accent} onColorChange={(c) => updateColor("accent", c)} />
        </div>
      </div>

      {/* Logo + name section overlapping gradient */}
      <div className="relative bg-white px-5 pb-4 pt-0">
        <div className="-mt-8 flex items-end gap-3">
          {/* Logo */}
          <label className="group relative shrink-0 cursor-pointer">
            {logoUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt={displayName}
                  className="h-16 w-16 rounded-xl border-2 border-white bg-white object-contain p-1.5 shadow-md"
                />
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Pencil className="h-3.5 w-3.5 text-white" />
                </div>
              </>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-white bg-gray-50 shadow-md transition-colors group-hover:bg-indigo-50">
                <Image className="h-6 w-6 text-muted-foreground/30" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  setLogoUrl(url);
                  window.dispatchEvent(new CustomEvent("doost:logo-selected", { detail: { url } }));
                }
              }}
            />
          </label>

          <div className="min-w-0 pb-1">
            <h3 className="truncate text-lg font-bold text-foreground">{displayName}</h3>
            <a
              href={data.url.startsWith("http") ? data.url : `https://${data.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {domain}
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>

        {/* Industry + Location tags */}
        <div className="mt-3 flex flex-wrap gap-2">
          {data.industry && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-foreground/70">
              <Building2 className="h-3 w-3" />
              {data.industry}
            </span>
          )}
          {data.location && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-foreground/70">
              <MapPin className="h-3 w-3" />
              {data.location}
            </span>
          )}
        </div>
      </div>

      {/* Upload actions */}
      <div className="flex gap-2 border-t border-border/20 bg-gray-50/50 px-5 py-2.5">
        <label className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-white hover:text-indigo-600 hover:shadow-sm">
          <Image className="h-3 w-3" />
          {logoUrl ? "Byt logga" : "Logga"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setLogoUrl(url);
                window.dispatchEvent(new CustomEvent("doost:logo-selected", { detail: { url } }));
              }
            }}
          />
        </label>
        <label className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-white hover:text-purple-600 hover:shadow-sm">
          <Type className="h-3 w-3" />
          {fontFile ?? "Font"}
          <input
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) setFontFile(e.target.files[0].name);
            }}
          />
        </label>
        <label className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-white hover:text-amber-600 hover:shadow-sm">
          <FileText className="h-3 w-3" />
          {pdfFile ?? "Varumärkesguide"}
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) setPdfFile(e.target.files[0].name);
            }}
          />
        </label>

        {data._analysisMs && (
          <span className="ml-auto text-[9px] text-muted-foreground/40">
            {(data._analysisMs / 1000).toFixed(1)}s
          </span>
        )}
      </div>
    </div>
  );
}

export function BrandProfileLoading() {
  return (
    <div className="mt-1 overflow-hidden rounded-2xl border border-border/20 shadow-sm">
      <div className="h-24 animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
      <div className="bg-white px-5 pb-4">
        <div className="-mt-8 flex items-end gap-3">
          <div className="h-16 w-16 animate-shimmer rounded-xl border-2 border-white bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] shadow-md" />
          <div className="space-y-1.5 pb-1">
            <div className="h-5 w-32 animate-shimmer rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
            <div className="h-3 w-24 animate-shimmer rounded bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60 bg-[length:200%_100%]" />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <div className="h-6 w-20 animate-shimmer rounded-full bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 bg-[length:200%_100%]" />
          <div className="h-6 w-24 animate-shimmer rounded-full bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 bg-[length:200%_100%]" />
        </div>
      </div>
    </div>
  );
}
