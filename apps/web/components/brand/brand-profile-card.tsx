"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  ExternalLink,
  FileText,
  Globe,
  ImageIcon,
  MapPin,
  Palette,
  Pencil,
  Sparkles,
  Type,
  Upload,
  X,
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

// ── Approvable Field ────────────────────────────────────────────
// Each field can be: pending (just scraped) → approved (green check) → editing
type FieldState = "pending" | "approved" | "editing";

function ApprovableField({
  icon: Icon,
  label,
  value,
  onApprove,
  onEdit,
  state,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onApprove: () => void;
  onEdit: () => void;
  state: FieldState;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`group relative rounded-xl border px-3 py-2.5 transition-all duration-300 ${
        state === "approved"
          ? "border-emerald-200 bg-emerald-50/30"
          : state === "editing"
            ? "border-indigo-300 bg-indigo-50/20 ring-1 ring-indigo-200"
            : "border-border/40 bg-white/50 hover:border-border/60"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${state === "approved" ? "text-emerald-500" : "text-muted-foreground/50"}`} />
        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/50">{label}</div>
          <div className="truncate text-sm font-medium text-foreground">{value}</div>
        </div>
        {state === "approved" ? (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </div>
        ) : state === "editing" ? (
          <button onClick={onApprove} className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white shadow-sm hover:bg-indigo-600">
            <Check className="h-3 w-3" strokeWidth={3} />
          </button>
        ) : (
          <div className="flex gap-1 opacity-100 sm:opacity-0 transition-opacity sm:group-hover:opacity-100">
            <button onClick={onApprove} className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100" title="Godkänn">
              <Check className="h-3 w-3" strokeWidth={2.5} />
            </button>
            <button onClick={onEdit} className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground transition-colors hover:bg-muted/60" title="Ändra">
              <Pencil className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
      {state === "editing" && children}
    </div>
  );
}

// ── Color Swatch with approve ───────────────────────────────────
function ColorSwatch({
  color,
  label,
  approved,
  onApprove,
  role,
  originalColor,
  onColorChange,
}: {
  color: string;
  label: string;
  approved: boolean;
  onApprove: () => void;
  role: string;
  originalColor: string;
  onColorChange: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => {
          if (approved) setOpen(!open);
          else onApprove();
        }}
        className="group flex flex-col items-center gap-1"
      >
        <div className="relative">
          <div
            className={`h-10 w-10 rounded-full border-2 shadow-sm transition-all ${
              approved ? "border-emerald-400 ring-2 ring-emerald-200" : "border-white hover:scale-105"
            }`}
            style={{ backgroundColor: color }}
          />
          {approved && (
            <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
            </div>
          )}
        </div>
        <span className="font-mono text-[9px] text-muted-foreground">{color}</span>
        <span className="text-[9px] text-muted-foreground/50">{label}</span>
      </button>
      {open && (
        <ColorEditor role={role} currentColor={color} originalColor={originalColor} onColorChange={onColorChange} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────
export function BrandProfileCard({
  data,
  onComplete,
}: {
  data: BrandProfileData;
  onComplete?: () => void;
}) {
  const [colors, setColors] = useState(data.colors);
  const [logoUrl, setLogoUrl] = useState<string | null>(data.logos?.primary ?? data.logos?.icon ?? null);
  const [fontFile, setFontFile] = useState<string | null>(null);
  const originalColors = data.colors;

  // Field approval states
  const [approved, setApproved] = useState<Record<string, FieldState>>({
    name: "pending",
    industry: "pending",
    location: "pending",
    logo: "pending",
    font: "pending",
    colors: "pending",
  });

  useEffect(() => {
    function handleLogo(e: Event) {
      const detail = (e as CustomEvent<{ url: string }>).detail;
      if (detail?.url) setLogoUrl(detail.url);
    }
    window.addEventListener("doost:logo-selected", handleLogo);
    return () => window.removeEventListener("doost:logo-selected", handleLogo);
  }, []);

  function approve(field: string) {
    setApproved((prev) => ({ ...prev, [field]: "approved" }));
  }

  function startEdit(field: string) {
    setApproved((prev) => ({ ...prev, [field]: "editing" }));
  }

  function updateColor(role: keyof typeof colors, c: string) {
    setColors((prev) => ({ ...prev, [role]: c }));
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      const u = URL.createObjectURL(f);
      setLogoUrl(u);
      window.dispatchEvent(new CustomEvent("doost:logo-selected", { detail: { url: u } }));
      approve("logo");
    }
  }

  const name = stripSuffix(data.name);
  const domain = data.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const approvedCount = Object.values(approved).filter((s) => s === "approved").length;
  const totalFields = Object.keys(approved).length;
  const allApproved = approvedCount === totalFields;

  return (
    <div className="animate-card-in mt-3 overflow-hidden rounded-2xl border border-border/30 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-sm">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold tracking-tight">Varumärkesprofil</div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Globe className="h-2.5 w-2.5" />
            {domain}
            {data._analysisMs && <span className="text-muted-foreground/30"> · {(data._analysisMs / 1000).toFixed(1)}s</span>}
          </div>
        </div>
        {/* Approval progress */}
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {Object.entries(approved).map(([key, state]) => (
              <div
                key={key}
                className={`h-1.5 w-3 rounded-full transition-all duration-500 ${
                  state === "approved" ? "bg-emerald-400" : "bg-muted/40"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">
            {approvedCount}/{totalFields}
          </span>
        </div>
      </div>

      {/* Divider with gradient accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

      {/* Logo + Name section */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-4">
          <label className="group relative shrink-0 cursor-pointer">
            {logoUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt={name}
                  className={`h-14 w-14 rounded-xl border-2 bg-white object-contain p-1.5 shadow-sm transition-all ${
                    approved.logo === "approved" ? "border-emerald-300" : "border-border/30"
                  }`}
                  onError={() => setLogoUrl(null)}
                />
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30 opacity-100 sm:opacity-0 transition-opacity sm:group-hover:opacity-100">
                  <Pencil className="h-3.5 w-3.5 text-white" />
                </div>
                {approved.logo === "approved" && (
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-dashed border-border/50 bg-muted/10 transition-all group-hover:border-indigo-300 group-hover:bg-indigo-50/20">
                <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                <span className="text-[7px] text-muted-foreground/40">Logga</span>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </label>

          <div className="min-w-0 flex-1 space-y-1">
            {/* Name field — approvable */}
            <div className="flex items-center gap-2">
              <h3 className="truncate text-lg font-semibold tracking-tight">{name}</h3>
              {approved.name === "approved" ? (
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
                  <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                </div>
              ) : (
                <button
                  onClick={() => approve("name")}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 opacity-0 transition-all hover:bg-emerald-100 group-hover:opacity-100"
                >
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                </button>
              )}
              <a href={data.url.startsWith("http") ? data.url : `https://${data.url}`} target="_blank" rel="noopener noreferrer" className="ml-auto shrink-0 text-muted-foreground/30 transition-colors hover:text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Approvable fields grid */}
      <div className="grid grid-cols-2 gap-2 px-5 pb-3">
        {data.industry && (
          <ApprovableField
            icon={Building2}
            label="Bransch"
            value={data.industry}
            state={approved.industry ?? "pending"}
            onApprove={() => approve("industry")}
            onEdit={() => startEdit("industry")}
          />
        )}
        {data.location && (
          <ApprovableField
            icon={MapPin}
            label="Plats"
            value={data.location}
            state={approved.location ?? "pending"}
            onApprove={() => approve("location")}
            onEdit={() => startEdit("location")}
          />
        )}
        {/* Logo field — with preview or upload prompt */}
        <label
          className={`group relative col-span-2 flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-300 ${
            approved.logo === "approved"
              ? "border-emerald-200 bg-emerald-50/30"
              : logoUrl
                ? "border-border/40 bg-white/50 hover:border-border/60"
                : "border-2 border-dashed border-border/50 bg-muted/5 hover:border-indigo-300 hover:bg-indigo-50/10"
          }`}
        >
          {logoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="Logo" className="h-9 w-9 rounded-lg border border-border/20 bg-white object-contain p-1" onError={() => setLogoUrl(null)} />
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/50">Logotyp</div>
                <div className="text-sm font-medium text-foreground">Hittad automatiskt</div>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50/50">
                <Upload className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground/80">Ladda upp din logga</div>
                <div className="text-[10px] text-muted-foreground/50">PNG, SVG eller JPG</div>
              </div>
            </>
          )}
          {approved.logo === "approved" ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
          ) : (
            <div className="flex gap-1 opacity-100 sm:opacity-0 transition-opacity sm:group-hover:opacity-100">
              {logoUrl && (
                <button onClick={(e) => { e.preventDefault(); approve("logo"); }} className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100">
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                </button>
              )}
              <div className="flex h-6 items-center justify-center rounded-lg bg-indigo-50 px-2 text-[9px] font-medium text-indigo-500">
                <Upload className="mr-1 h-2.5 w-2.5" />
                {logoUrl ? "Byt" : "Ladda upp"}
              </div>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </label>

        {/* Font field */}
        <div
          className={`group relative rounded-xl border px-3 py-2.5 transition-all duration-300 ${
            approved.font === "approved"
              ? "border-emerald-200 bg-emerald-50/30"
              : "border-border/40 bg-white/50 hover:border-border/60"
          }`}
        >
          <div className="flex items-center gap-2">
            <Type className={`h-3.5 w-3.5 shrink-0 ${approved.font === "approved" ? "text-emerald-500" : "text-muted-foreground/50"}`} />
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/50">Typsnitt</div>
              <div className="truncate text-sm font-medium text-foreground">
                {fontFile ?? data.fonts?.heading ?? "Ej valt"}
              </div>
            </div>
            {approved.font === "approved" ? (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
                <Check className="h-3 w-3 text-white" strokeWidth={3} />
              </div>
            ) : (
              <label className="flex cursor-pointer gap-1 opacity-100 sm:opacity-0 transition-opacity sm:group-hover:opacity-100">
                {(fontFile || data.fonts?.heading) && (
                  <button onClick={() => approve("font")} className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100">
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                  </button>
                )}
                <div className="flex h-6 items-center justify-center rounded-lg bg-muted/40 px-2 text-[9px] font-medium text-muted-foreground transition-colors hover:bg-muted/60">
                  <Upload className="mr-1 h-2.5 w-2.5" />
                  Ladda upp
                </div>
                <input type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setFontFile(e.target.files[0].name.replace(/\.(ttf|otf|woff2?)$/i, ""));
                    approve("font");
                  }
                }} />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Colors section — approvable */}
      <div className="px-5 pb-4">
        <div
          className={`rounded-xl border p-4 transition-all duration-300 ${
            approved.colors === "approved"
              ? "border-emerald-200 bg-emerald-50/20"
              : "border-border/30 bg-muted/5"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground/60">
              <Palette className="h-3.5 w-3.5" />
              Varumärkesfärger
            </div>
            {approved.colors !== "approved" ? (
              <button
                onClick={() => approve("colors")}
                className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-medium text-emerald-600 transition-colors hover:bg-emerald-100"
              >
                <Check className="h-2.5 w-2.5" />
                Godkänn
              </button>
            ) : (
              <div className="flex items-center gap-1 text-[9px] font-medium text-emerald-600">
                <Check className="h-2.5 w-2.5" />
                Godkänd
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-6">
            <ColorSwatch
              color={colors.primary} label="Primär" role="primary"
              approved={approved.colors === "approved"}
              onApprove={() => approve("colors")}
              originalColor={originalColors.primary}
              onColorChange={(c) => updateColor("primary", c)}
            />
            <ColorSwatch
              color={colors.secondary} label="Sekundär" role="secondary"
              approved={approved.colors === "approved"}
              onApprove={() => approve("colors")}
              originalColor={originalColors.secondary}
              onColorChange={(c) => updateColor("secondary", c)}
            />
            <ColorSwatch
              color={colors.accent} label="Accent" role="accent"
              approved={approved.colors === "approved"}
              onApprove={() => approve("colors")}
              originalColor={originalColors.accent}
              onColorChange={(c) => updateColor("accent", c)}
            />
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="flex items-center justify-between border-t border-border/20 px-5 py-3">
        <span className="text-[10px] text-muted-foreground/40">
          {allApproved ? "Alla fält godkända" : `Godkänn alla fält genom att hovra och klicka ✓`}
        </span>
        <button
          onClick={() => {
            // Auto-approve all remaining
            setApproved((prev) => {
              const next = { ...prev };
              for (const key of Object.keys(next)) {
                if (next[key] !== "approved") next[key] = "approved";
              }
              return next;
            });
            setTimeout(() => onComplete?.(), 400);
          }}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all ${
            allApproved
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 hover:shadow-md"
              : "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 hover:shadow-md"
          }`}
        >
          {allApproved ? "Allt ser bra ut" : "Godkänn alla & fortsätt"}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function BrandProfileLoading() {
  return (
    <div className="animate-card-in mt-3 overflow-hidden rounded-2xl border border-border/30 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] backdrop-blur-xl">
      <div className="flex items-center gap-3 px-5 py-3">
        <div className="h-9 w-9 animate-shimmer rounded-xl bg-gradient-to-r from-indigo-100 via-purple-50 to-indigo-100 bg-[length:200%_100%]" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-32 animate-shimmer rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
          <div className="h-2.5 w-24 animate-shimmer rounded-md bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60 bg-[length:200%_100%]" />
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      <div className="px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 animate-shimmer rounded-xl bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
          <div className="space-y-2">
            <div className="h-5 w-36 animate-shimmer rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
            <div className="h-3 w-28 animate-shimmer rounded bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60 bg-[length:200%_100%]" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-14 animate-shimmer rounded-xl bg-gradient-to-r from-muted/30 via-muted/15 to-muted/30 bg-[length:200%_100%]" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
        <div className="mt-3 h-24 animate-shimmer rounded-xl bg-gradient-to-r from-muted/20 via-muted/10 to-muted/20 bg-[length:200%_100%]" />
      </div>
    </div>
  );
}
