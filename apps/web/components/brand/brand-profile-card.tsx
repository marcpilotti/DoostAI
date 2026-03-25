"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Check,
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
        className="group flex flex-col items-center gap-1"
      >
        <div
          className="h-8 w-8 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-110"
          style={{ backgroundColor: color }}
        />
        <span className="text-[9px] text-muted-foreground">{label}</span>
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

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      const u = URL.createObjectURL(f);
      setLogoUrl(u);
      window.dispatchEvent(new CustomEvent("doost:logo-selected", { detail: { url: u } }));
    }
  }

  const name = stripSuffix(data.name);
  const domain = data.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="animate-message-in mt-3 overflow-hidden rounded-2xl border border-border/40 bg-white/70 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/30 px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
          <Globe className="h-4 w-4 text-emerald-500" />
        </div>
        <div>
          <div className="text-sm font-semibold">Varumärkesprofil</div>
          <div className="text-[11px] text-muted-foreground">
            Analyserad från {domain}
          </div>
        </div>
        {data._analysisMs && (
          <span className="ml-auto text-[10px] text-muted-foreground/40">
            {(data._analysisMs / 1000).toFixed(1)}s
          </span>
        )}
      </div>

      {/* Company info */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <label className="group relative shrink-0 cursor-pointer">
            {logoUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt={name} className="h-12 w-12 rounded-xl border border-border/30 bg-white object-contain p-1.5" />
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                  <Pencil className="h-3 w-3 text-white" />
                </div>
              </>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-dashed border-border/40 bg-muted/10 transition-colors group-hover:border-indigo-300 group-hover:bg-indigo-50/30">
                <Image className="h-5 w-5 text-muted-foreground/30" />
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </label>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold">{name}</h3>
              <a href={data.url.startsWith("http") ? data.url : `https://${data.url}`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
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

        {/* Brand colors */}
        <div className="mt-4">
          <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
            Varumärkesfärger
          </div>
          <div className="flex items-end gap-4">
            <ColorDot color={colors.primary} label="Primär" role="primary" originalColor={originalColors.primary} onColorChange={(c) => updateColor("primary", c)} />
            <ColorDot color={colors.secondary} label="Sekundär" role="secondary" originalColor={originalColors.secondary} onColorChange={(c) => updateColor("secondary", c)} />
            <ColorDot color={colors.accent} label="Accent" role="accent" originalColor={originalColors.accent} onColorChange={(c) => updateColor("accent", c)} />
            <span className="mb-1 ml-auto text-[9px] text-muted-foreground/40">Klicka för att ändra</span>
          </div>
        </div>
      </div>

      {/* Upload actions */}
      <div className="flex items-center gap-2 border-t border-border/30 px-5 py-2.5">
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/40 bg-white px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground transition-all hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-600">
          <Upload className="h-3 w-3" />
          {logoUrl ? "Byt logga" : "Ladda upp logga"}
          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/40 bg-white px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground transition-all hover:border-purple-300 hover:bg-purple-50/30 hover:text-purple-600">
          <Type className="h-3 w-3" />
          {fontFile ? <><Check className="h-2.5 w-2.5 text-emerald-500" />{fontFile}</> : "Ladda upp font"}
          <input type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setFontFile(e.target.files[0].name); }} />
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/40 bg-white px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground transition-all hover:border-amber-300 hover:bg-amber-50/30 hover:text-amber-600">
          <FileText className="h-3 w-3" />
          {pdfFile ? <><Check className="h-2.5 w-2.5 text-emerald-500" />PDF</> : "Varumärkesguide"}
          <input type="file" accept=".pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setPdfFile(e.target.files[0].name); }} />
        </label>
      </div>
    </div>
  );
}

export function BrandProfileLoading() {
  return (
    <div className="animate-message-in mt-3 overflow-hidden rounded-2xl border border-border/40 bg-white/70 backdrop-blur-sm">
      <div className="flex items-center gap-2 border-b border-border/30 px-5 py-3">
        <div className="h-8 w-8 animate-shimmer rounded-lg bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
        <div className="space-y-1">
          <div className="h-3.5 w-28 animate-shimmer rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
          <div className="h-2.5 w-40 animate-shimmer rounded bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60 bg-[length:200%_100%]" />
        </div>
      </div>
      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-shimmer rounded-xl bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 animate-shimmer rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
            <div className="h-3 w-40 animate-shimmer rounded bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60 bg-[length:200%_100%]" />
          </div>
        </div>
        <div className="mt-4 flex gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="h-8 w-8 animate-shimmer rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" style={{ animationDelay: `${i * 150}ms` }} />
              <div className="h-2 w-8 animate-shimmer rounded bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 bg-[length:200%_100%]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
