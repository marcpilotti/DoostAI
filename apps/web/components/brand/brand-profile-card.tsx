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
  MapPin,
  Palette,
  Pencil,
  Sparkles,
  Type,
  Users,
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
  _intelligenceStatus?: string;
  _logoSource?: string;
  _logoTheme?: string;
  valuePropositions: string[];
  _intelligence?: {
    overallConfidence: number;
    logo: { source: string; confidence: number; status: string };
    colors: { source: string; confidence: number; status: string };
    font: { source: string; confidence: number; status: string };
    industry: { source: string; confidence: number; status: string };
    socialProfiles: { platform: string; url: string; confidence: number }[];
    visualStyle: string;
    audit?: {
      readinessScore: number;
      hasMetaPixel: boolean;
      hasGoogleTag: boolean;
      hasLinkedinTag: boolean;
      techStack: string[];
      issues: { severity: string; title: string; description: string }[];
    };
  };
};

function stripSuffix(name: string): string {
  return name.replace(/\s+(AB|HB|KB|Inc\.?|Ltd\.?|LLC|GmbH|Corp\.?|Co\.?)$/i, "").trim();
}

// ── Swedish industries (broad, top 20) ──────────────────────────
const INDUSTRIES = [
  "Bygg & Fastigheter",
  "Detaljhandel",
  "E-handel",
  "Finans & Försäkring",
  "Fordon & Transport",
  "Hälsa & Sjukvård",
  "Hotell & Restaurang",
  "IT & Tech",
  "Juridik & Redovisning",
  "Konsult & Rådgivning",
  "Livsmedel & Dagligvaror",
  "Marknadsföring & Media",
  "Mode & Skönhet",
  "Rekrytering & Bemanning",
  "Tillverkning & Industri",
  "Träning & Fritid",
  "Utbildning",
  "Energi & Miljö",
  "Kultur & Nöje",
  "SaaS & Molntjänster",
];

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
      className={`group relative h-[52px] rounded-lg border px-2 transition-all duration-300 flex items-center ${
        state === "approved"
          ? "border-emerald-200 bg-emerald-50/30"
          : state === "editing"
            ? "border-indigo-300 bg-indigo-50/20 ring-1 ring-indigo-200"
            : "border-border/40 bg-white/50 hover:border-border/60"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <Icon className={`h-2.5 w-2.5 shrink-0 ${state === "approved" ? "text-emerald-500" : "text-muted-foreground/40"}`} />
        <div className="min-w-0 flex-1">
          <div className="text-[7px] font-medium uppercase tracking-widest text-muted-foreground/40">{label}</div>
          {state === "editing" ? (
            <input
              type="text"
              defaultValue={value}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") onApprove(); }}
              onBlur={() => onApprove()}
              className="w-full border-b border-indigo-300 bg-transparent text-xs font-medium text-foreground outline-none"
            />
          ) : (
            <div className="truncate text-xs font-medium text-foreground">{value}</div>
          )}
        </div>
        {state === "approved" ? (
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
            <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
          </div>
        ) : state === "editing" ? (
          <button onClick={onApprove} className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-white hover:bg-indigo-600">
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </button>
        ) : (
          <div className="flex gap-0.5 opacity-100 sm:opacity-0 transition-opacity sm:group-hover:opacity-100">
            <button onClick={onApprove} className="flex h-5 w-5 items-center justify-center rounded bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100" title="Godkänn">
              <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
            </button>
            <button onClick={onEdit} className="flex h-5 w-5 items-center justify-center rounded bg-muted/40 text-muted-foreground transition-colors hover:bg-muted/60" title="Ändra">
              <Pencil className="h-2.5 w-2.5" />
            </button>
          </div>
        )}
      </div>
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
            className={`h-8 w-8 rounded-full border-2 shadow-sm transition-all ${
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
export type ApprovedBrandData = {
  name: string;
  industry: string;
  colors: { primary: string; secondary: string; accent: string };
  fonts: { heading: string; body: string };
  logoUrl: string | null;
  location: string;
  targetAudience: string;
  url: string;
  brandVoice: string;
  valuePropositions: string[];
  description: string;
};

export function BrandProfileCard({
  data,
  onComplete,
}: {
  data: BrandProfileData;
  onComplete?: (approved: ApprovedBrandData) => void;
}) {
  const [colors, setColors] = useState(data.colors);
  const [logoUrl, setLogoUrl] = useState<string | null>(data.logos?.primary ?? data.logos?.icon ?? null);
  const [industry, setIndustry] = useState(data.industry ?? "");
  const [fontFile, setFontFile] = useState<string | null>(null);
  const originalColors = data.colors;
  const logoDarkTheme = data._logoTheme === "dark";

  const [cascading, setCascading] = useState(false);

  // Animated confidence counter — counts up from 0 to final value over ~1.5s
  const [displayedConfidence, setDisplayedConfidence] = useState(0);
  const targetConfidence = data._intelligence?.overallConfidence ?? 0;

  useEffect(() => {
    if (targetConfidence === 0) return;
    let current = 0;
    const step = targetConfidence / 30; // 30 frames over ~1.5s
    const interval = setInterval(() => {
      current += step;
      if (current >= targetConfidence) {
        setDisplayedConfidence(targetConfidence);
        clearInterval(interval);
      } else {
        setDisplayedConfidence(Math.round(current));
      }
    }, 50);
    return () => clearInterval(interval);
  }, [targetConfidence]);

  // Field approval states
  const [approved, setApproved] = useState<Record<string, FieldState>>({
    name: "pending",
    industry: "pending",
    location: "pending",
    font: "pending",
    audience: "pending",
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
    try { navigator?.vibrate?.(10); } catch {}
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
      if (logoUrl && logoUrl.startsWith('blob:')) URL.revokeObjectURL(logoUrl);
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
    <div className="animate-card-in mt-2 max-h-[calc(100vh-200px)] overflow-hidden rounded-2xl border border-border/30 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold tracking-tight">Varumärkesprofil</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Globe className="h-2.5 w-2.5" />
            {domain}
            {data._intelligence ? (
              <span className={`ml-1 rounded px-1 py-0.5 text-[9px] font-semibold ${
                data._intelligence.overallConfidence >= 80 ? "bg-emerald-50 text-emerald-600" :
                data._intelligence.overallConfidence >= 50 ? "bg-amber-50 text-amber-600" :
                "bg-red-50 text-red-500"
              }`}>
                {displayedConfidence}% säker
              </span>
            ) : data._enrichmentStatus === "complete" ? (
              <span className="ml-1 rounded bg-emerald-50 px-1 py-0.5 text-[9px] font-semibold text-emerald-600">Berikad</span>
            ) : data._enrichmentStatus === "partial" ? (
              <span className="ml-1 rounded bg-amber-50 px-1 py-0.5 text-[9px] font-semibold text-amber-600">Grunddata</span>
            ) : null}
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
          <span className="text-[9px] font-medium text-muted-foreground">
            {approvedCount}/{totalFields}
          </span>
        </div>
      </div>

      {/* Divider with gradient accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

      {/* Status warnings */}
      {data._intelligenceStatus === "failed" && (
        <div className="mx-4 mt-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-1.5 text-xs text-amber-700">
          {"\u26A0\uFE0F"} Viss data kunde inte h\u00E4mtas. Profilen kan vara ofullst\u00E4ndig.
        </div>
      )}
      {data._enrichmentStatus === "partial" && data._intelligenceStatus !== "failed" && (
        <div className="mx-4 mt-2 rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-1.5 text-xs text-blue-700">
          {"\u2139\uFE0F"} F\u00F6retagsdata h\u00E5ller p\u00E5 att uppdateras.
        </div>
      )}

      {/* Logo + Name — side by side */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        {logoUrl && (
          <label className="group relative shrink-0 cursor-pointer block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt={name}
              className={`h-12 w-12 rounded-xl border-2 object-contain p-1.5 shadow-sm transition-all ${
                logoDarkTheme ? "bg-gray-800" : "bg-white"
              } border-border/30`}
              onError={() => setLogoUrl(null)}
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
              <Pencil className="h-3 w-3 text-white" />
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </label>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold tracking-tight">{name}</h3>
        </div>
        {approved.name === "approved" ? (
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </div>
        ) : (
          <button
            onClick={() => approve("name")}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 opacity-0 transition-all hover:bg-emerald-100 group-hover:opacity-100"
          >
            <Check className="h-3 w-3" strokeWidth={2.5} />
          </button>
        )}
        <a href={data.url.startsWith("http") ? data.url : `https://${data.url}`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground/30 transition-colors hover:text-muted-foreground">
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Approvable fields grid — 2 columns */}
      <div className="grid grid-cols-2 gap-1.5 px-4 pb-2">
        {/* Row 1: Bransch (dropdown) + Plats */}
        <div
          className={`group relative h-[52px] rounded-lg border px-2 transition-all duration-300 flex items-center ${
            approved.industry === "approved"
              ? "border-emerald-200 bg-emerald-50/30"
              : "border-border/40 bg-white/50 hover:border-border/60"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Building2 className={`h-2.5 w-2.5 shrink-0 ${approved.industry === "approved" ? "text-emerald-500" : "text-muted-foreground/40"}`} />
            <div className="min-w-0 flex-1">
              <div className="text-[7px] font-medium uppercase tracking-widest text-muted-foreground/40">Bransch</div>
              <select
                value={industry}
                onChange={(e) => {
                  setIndustry(e.target.value);
                  approve("industry");
                }}
                className="h-5 w-full appearance-none bg-transparent text-xs font-medium leading-tight text-foreground outline-none cursor-pointer truncate pr-4"
              >
                {industry && !INDUSTRIES.includes(industry) && (
                  <option value={industry}>{industry}</option>
                )}
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
            <ChevronDown className="h-2.5 w-2.5 shrink-0 text-muted-foreground/40" />
            {approved.industry === "approved" && (
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
                <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
              </div>
            )}
          </div>
        </div>
        <ApprovableField
          icon={MapPin}
          label="Plats"
          value={data.location ?? "Ej angiven"}
          state={approved.location ?? "pending"}
          onApprove={() => approve("location")}
          onEdit={() => startEdit("location")}
        />

        {/* Row 2: Målgrupp + Typsnitt */}
        {data.targetAudience && (
          <ApprovableField
            icon={Users}
            label="Målgrupp"
            value={data.targetAudience}
            state={approved.audience ?? "pending"}
            onApprove={() => approve("audience")}
            onEdit={() => startEdit("audience")}
          />
        )}
        <ApprovableField
          icon={Type}
          label="Typsnitt"
          value={fontFile ?? data.fonts?.heading ?? "Ej valt"}
          state={approved.font ?? "pending"}
          onApprove={() => approve("font")}
          onEdit={() => startEdit("font")}
        />
      </div>

      {/* Colors section */}
      <div className="px-4 pb-2">
        <div
          className={`rounded-lg border p-2 transition-all duration-300 ${
            approved.colors === "approved"
              ? "border-emerald-200 bg-emerald-50/20"
              : "border-border/30 bg-muted/5"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/60">
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

      {/* Intelligence: Social profiles */}
      {data._intelligence?.socialProfiles && data._intelligence.socialProfiles.filter((s) => s.confidence >= 50).length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {data._intelligence.socialProfiles
              .filter((s) => s.confidence >= 50)
              .map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-full border border-border/30 bg-white px-2 py-0.5 text-[9px] font-medium text-muted-foreground transition-colors hover:border-indigo-300 hover:text-indigo-600"
                >
                  <span className="capitalize">{s.platform}</span>
                  {s.confidence >= 80 && <span className="text-emerald-500">✓</span>}
                </a>
              ))}
          </div>
        </div>
      )}

      {/* Intelligence data shown as subtle tags, not a separate section */}

      {/* Footer CTA */}
      <div className="flex items-center justify-between border-t border-border/20 px-4 py-2">
        <span className="text-[9px] text-muted-foreground/40">
          {allApproved ? "Alla fält godkända" : `Godkänn alla fält genom att hovra och klicka ✓`}
        </span>
        <button
          onClick={() => {
            if (cascading) return;

            const approvedData = {
              name: stripSuffix(data.name),
              industry,
              colors: { primary: colors.primary, secondary: colors.secondary, accent: colors.accent },
              fonts: data.fonts ?? { heading: "Inter", body: "Inter" },
              logoUrl,
              location: data.location ?? "",
              targetAudience: data.targetAudience ?? "",
              url: data.url,
              brandVoice: data.brandVoice ?? "Professional and approachable",
              valuePropositions: data.valuePropositions ?? [],
              description: data.description ?? "",
            };

            const pending = Object.keys(approved).filter((k) => approved[k] !== "approved");

            if (pending.length === 0) {
              // All already approved — fire immediately, no setTimeout
              onComplete?.(approvedData);
              return;
            }

            // Cascade approve with stagger animation
            setCascading(true);
            pending.forEach((key, i) => {
              setTimeout(() => {
                setApproved((prev) => ({ ...prev, [key]: "approved" }));
                try { navigator?.vibrate?.(10); } catch {}
              }, i * 100);
            });
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("doost:profile-approved"));
              onComplete?.(approvedData);
              setCascading(false);
            }, pending.length * 100 + 300);
          }}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all ${
            allApproved
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 hover:shadow-md"
              : "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 hover:shadow-md"
          }`}
        >
          {allApproved ? "Allt ser bra ut" : `Godkänn ${approvedCount === 0 ? "alla" : `sista ${totalFields - approvedCount}`} & fortsätt`}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

const LOADING_STEPS = [
  "Analyserar hemsida...",
  "Extraherar färger och typsnitt...",
  "Hämtar företagsdata...",
  "Sätter ihop profilen...",
];

export function BrandProfileLoading() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => (s + 1) % LOADING_STEPS.length), 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="animate-card-in mt-3 overflow-hidden rounded-2xl border border-border/30 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] backdrop-blur-xl">
      <div className="flex items-center gap-3 px-5 py-3">
        <div className="h-9 w-9 animate-shimmer rounded-xl bg-gradient-to-r from-indigo-100 via-purple-50 to-indigo-100 bg-[length:200%_100%]" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-32 animate-shimmer rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
          <div className="text-xs text-indigo-500 transition-opacity duration-500">{LOADING_STEPS[step]}</div>
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
        {/* Progress bar */}
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted/30">
          <div className="h-full animate-shimmer rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-[length:200%_100%]" style={{ width: `${((step + 1) / LOADING_STEPS.length) * 100}%`, transition: "width 0.5s ease" }} />
        </div>
      </div>
    </div>
  );
}
