"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Check,
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

function stripSuffix(name: string): string {
  return name.replace(/\s+(AB|HB|KB|Inc\.?|Ltd\.?|LLC|GmbH|Corp\.?|Co\.?)$/i, "").trim();
}

function ColorDot({
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
  onColorChange?: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => onColorChange && setOpen(!open)}
        className="group flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:bg-muted/40"
      >
        <div className="h-4 w-4 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: color }} />
        <span className="font-mono text-[10px] text-muted-foreground group-hover:text-foreground">{color}</span>
      </button>
      {open && onColorChange && (
        <ColorEditor role={role} currentColor={color} originalColor={originalColor} onColorChange={onColorChange} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

export function BrandProfileCard({ data }: { data: BrandProfileData }) {
  const [colors, setColors] = useState(data.colors);
  const [logoUrl, setLogoUrl] = useState<string | null>(data.logos?.primary ?? data.logos?.icon ?? null);
  const [fontFile, setFontFile] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const originalColors = data.colors;

  useEffect(() => {
    function handleLogo(e: Event) {
      const detail = (e as CustomEvent<{ url: string }>).detail;
      if (detail?.url) setLogoUrl(detail.url);
    }
    window.addEventListener("doost:logo-selected", handleLogo);
    return () => window.removeEventListener("doost:logo-selected", handleLogo);
  }, []);

  function updateColor(role: keyof typeof colors, c: string) {
    setColors((prev) => ({ ...prev, [role]: c }));
  }

  const name = stripSuffix(data.name);
  const domain = data.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-border/30 bg-white shadow-sm">
      {/* Top row: logo + name + meta */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Logo */}
        <label className="group relative shrink-0 cursor-pointer">
          {logoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt={name} className="h-10 w-10 rounded-lg border border-border/20 bg-white object-contain p-1" />
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <Pencil className="h-3 w-3 text-white" />
              </div>
            </>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-border/40 bg-muted/20 group-hover:border-indigo-300">
              <Image className="h-4 w-4 text-muted-foreground/30" />
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { const u = URL.createObjectURL(f); setLogoUrl(u); window.dispatchEvent(new CustomEvent("doost:logo-selected", { detail: { url: u } })); }
          }} />
        </label>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{name}</h3>
            <a href={data.url.startsWith("http") ? data.url : `https://${data.url}`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground">
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>{domain}</span>
            {data.industry && (
              <span className="flex items-center gap-1">
                <Building2 className="h-2.5 w-2.5" />
                {data.industry}
              </span>
            )}
            {data.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5" />
                {data.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Color bar */}
      <div className="flex items-center gap-1 border-t border-border/20 px-4 py-2">
        <div
          className="mr-2 h-1.5 flex-1 overflow-hidden rounded-full"
          style={{
            background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.accent} 100%)`,
          }}
        />
        <ColorDot color={colors.primary} label="Primär" role="primary" originalColor={originalColors.primary} onColorChange={(c) => updateColor("primary", c)} />
        <ColorDot color={colors.secondary} label="Sekundär" role="secondary" originalColor={originalColors.secondary} onColorChange={(c) => updateColor("secondary", c)} />
        <ColorDot color={colors.accent} label="Accent" role="accent" originalColor={originalColors.accent} onColorChange={(c) => updateColor("accent", c)} />
      </div>

      {/* Bottom actions */}
      <div className="flex items-center gap-1 border-t border-border/20 bg-muted/20 px-4 py-1.5">
        <label className="flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-white hover:text-foreground hover:shadow-sm">
          <Image className="h-2.5 w-2.5" />
          {logoUrl ? "Byt logga" : "Logga"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { const u = URL.createObjectURL(f); setLogoUrl(u); window.dispatchEvent(new CustomEvent("doost:logo-selected", { detail: { url: u } })); }
          }} />
        </label>
        <label className="flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-white hover:text-foreground hover:shadow-sm">
          <Type className="h-2.5 w-2.5" />
          {fontFile ? <><Check className="h-2 w-2 text-emerald-500" />{fontFile}</> : "Font"}
          <input type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setFontFile(e.target.files[0].name); }} />
        </label>
        <label className="flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-white hover:text-foreground hover:shadow-sm">
          <FileText className="h-2.5 w-2.5" />
          {pdfFile ? <><Check className="h-2 w-2 text-emerald-500" />PDF</> : "Varumärkesguide"}
          <input type="file" accept=".pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setPdfFile(e.target.files[0].name); }} />
        </label>
        {data._analysisMs && (
          <span className="ml-auto text-[9px] text-muted-foreground/30">{(data._analysisMs / 1000).toFixed(1)}s</span>
        )}
      </div>
    </div>
  );
}

export function BrandProfileLoading() {
  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-border/30 bg-white shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="h-10 w-10 animate-shimmer rounded-lg bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
        <div className="space-y-1.5">
          <div className="h-4 w-32 animate-shimmer rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
          <div className="h-3 w-48 animate-shimmer rounded bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60 bg-[length:200%_100%]" />
        </div>
      </div>
      <div className="border-t border-border/20 px-4 py-2">
        <div className="h-1.5 w-full animate-shimmer rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
      </div>
    </div>
  );
}
