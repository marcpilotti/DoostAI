"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  ExternalLink,
  FileText,
  Globe,
  Image,
  MapPin,
  Pencil,
  Type,
  Upload,
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
        className="flex items-center gap-2 rounded-lg px-1 py-0.5 transition-colors hover:bg-muted/40"
        title="Klicka för att ändra"
      >
        <div
          className="h-5 w-5 rounded-full border border-black/5 shadow-sm"
          style={{ backgroundColor: color }}
        />
        <div className="text-left">
          <div className="text-[10px] text-muted-foreground/70">{label}</div>
          <div className="font-mono text-xs text-foreground/80">{color}</div>
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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
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

  return (
    <div className="brand-card-glow relative mt-1 overflow-hidden rounded-2xl border border-white/30 bg-white/50 shadow-sm backdrop-blur-xl">
      {/* Header with logo + name */}
      <div className="flex items-start gap-3 p-5 pb-3">
        {/* Logo area — always visible */}
        <label className="group relative shrink-0 cursor-pointer">
          {logoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={displayName}
                className="h-14 w-14 rounded-xl border border-border/30 bg-white object-contain p-1.5 shadow-sm"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Pencil className="h-3.5 w-3.5 text-white" />
              </div>
            </>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed border-border/40 bg-muted/20 transition-colors group-hover:border-indigo-300 group-hover:bg-indigo-50/30">
              <Image className="h-5 w-5 text-muted-foreground/30" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setLogoUrl(URL.createObjectURL(file));
            }}
          />
        </label>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-xl font-semibold">{displayName}</h3>
          <a
            href={data.url.startsWith("http") ? data.url : `https://${data.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {data.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>

      {/* Info fields */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-5 pb-3">
        {data.industry && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span className="font-medium text-foreground/80">{data.industry}</span>
          </div>
        )}
        {data.location && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="font-medium text-foreground/80">{data.location}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border/20" />

      {/* Brand colors */}
      <div className="px-5 py-3">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
          <Globe className="h-3 w-3" />
          Varumärkesfärger
          <span className="ml-auto text-[9px] font-normal normal-case">Klicka för att ändra</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <ColorSwatch color={colors.primary} label="Primär" role="primary" originalColor={originalColors.primary} onColorChange={(c) => updateColor("primary", c)} />
          <ColorSwatch color={colors.secondary} label="Sekundär" role="secondary" originalColor={originalColors.secondary} onColorChange={(c) => updateColor("secondary", c)} />
          <ColorSwatch color={colors.accent} label="Accent" role="accent" originalColor={originalColors.accent} onColorChange={(c) => updateColor("accent", c)} />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/20" />

      {/* Upload section */}
      <div className="flex flex-wrap gap-2 px-5 py-3">
        {/* Logo upload */}
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/40 bg-white/60 px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-600">
          <Image className="h-3 w-3" />
          {logoUrl ? "Byt logga" : "Ladda upp logga"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setLogoUrl(URL.createObjectURL(file));
                window.dispatchEvent(new CustomEvent("doost:logo-selected", { detail: { url: URL.createObjectURL(file) } }));
              }
            }}
          />
        </label>

        {/* Font upload */}
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/40 bg-white/60 px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-purple-300 hover:bg-purple-50/30 hover:text-purple-600">
          <Type className="h-3 w-3" />
          {fontFile ? "Font uppladdad" : "Ladda upp font"}
          <input
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) setFontFile(e.target.files[0].name);
            }}
          />
        </label>

        {/* Brand guide PDF */}
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/40 bg-white/60 px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-amber-300 hover:bg-amber-50/30 hover:text-amber-600">
          <FileText className="h-3 w-3" />
          {pdfFile ? "Varumärkesguide uppladdad" : "Varumärkesguide (PDF)"}
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) setPdfFile(e.target.files[0].name);
            }}
          />
        </label>
      </div>

      {/* Analysis timing */}
      {data._analysisMs && (
        <div className="border-t border-border/20 px-5 py-2 text-[10px] text-muted-foreground/40">
          Analyserad på {(data._analysisMs / 1000).toFixed(1)}s
          {data._enrichmentStatus === "partial" && " (utan företagsdata)"}
        </div>
      )}
    </div>
  );
}

export function BrandProfileLoading() {
  return (
    <div className="mt-1 overflow-hidden rounded-2xl border border-white/30 bg-white/50 shadow-sm backdrop-blur-xl">
      <div className="flex items-start gap-3 p-5 pb-3">
        <div className="h-14 w-14 animate-shimmer rounded-xl bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
        <div>
          <div className="mb-1.5 h-6 w-40 animate-shimmer rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
          <div className="h-3.5 w-28 animate-shimmer rounded-md bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60 bg-[length:200%_100%]" />
        </div>
      </div>
      <div className="flex gap-4 px-5 pb-3">
        <div className="h-4 w-24 animate-shimmer rounded bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 bg-[length:200%_100%]" />
        <div className="h-4 w-20 animate-shimmer rounded bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 bg-[length:200%_100%]" />
      </div>
      <div className="border-t border-border/20 px-5 py-3">
        <div className="flex gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-5 w-5 animate-shimmer rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" style={{ animationDelay: `${i * 150}ms` }} />
              <div className="h-3 w-12 animate-shimmer rounded bg-gradient-to-r from-muted/50 via-muted/25 to-muted/50 bg-[length:200%_100%]" style={{ animationDelay: `${i * 150}ms` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
