"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  MapPin,
  Megaphone,
  Pencil,
  Target,
  ToggleLeft,
  ToggleRight,
  Wallet,
  Zap,
} from "lucide-react";

type TrackingStatus = {
  hasMetaPixel?: boolean;
  hasGoogleTag?: boolean;
  hasLinkedinTag?: boolean;
};

type PublishCardData = {
  brandName: string;
  brandUrl: string;
  headline: string;
  bodyCopy: string;
  goal: string;
  audience: string;
  industryCategory?: string;
  suggestedBudgets: { daily: number; label: string; reach: string; recommended?: boolean }[];
  currency: string;
  defaultCity?: string;
  detectedLocations?: string[];
  tracking?: TrackingStatus | null;
};

const CHANNELS = [
  { id: "meta", label: "Meta", sub: "Facebook & Instagram" },
  { id: "google", label: "Google", sub: "Sök & Display" },
  { id: "linkedin", label: "LinkedIn", sub: "B2B" },
];

type RegionEntry = { id: string; label: string };
type RegionGroup = { group: string; regions: RegionEntry[] };

const REGION_GROUPS: RegionGroup[] = [
  {
    group: "Storstäder",
    regions: [
      { id: "stockholm", label: "Stockholm" },
      { id: "gothenburg", label: "Göteborg" },
      { id: "malmo", label: "Malmö" },
    ],
  },
  {
    group: "Mellansverige",
    regions: [
      { id: "uppsala", label: "Uppsala" },
      { id: "linkoping", label: "Linköping" },
      { id: "vasteras", label: "Västerås" },
      { id: "orebro", label: "Örebro" },
      { id: "helsingborg", label: "Helsingborg" },
      { id: "jonkoping", label: "Jönköping" },
      { id: "norrkoping", label: "Norrköping" },
      { id: "lund", label: "Lund" },
      { id: "boras", label: "Borås" },
    ],
  },
  {
    group: "Norrland",
    regions: [
      { id: "umea", label: "Umeå" },
      { id: "gavle", label: "Gävle" },
      { id: "sundsvall", label: "Sundsvall" },
    ],
  },
  {
    group: "Hela landet",
    regions: [
      { id: "sweden", label: "Hela Sverige" },
    ],
  },
];

// Flat list for lookups
const ALL_REGIONS: RegionEntry[] = REGION_GROUPS.flatMap((g) => g.regions);

/** Normalize a detected location string to a region id */
function normalizeLocationToRegionId(location: string): string | null {
  const lower = location.toLowerCase().trim();
  const map: Record<string, string> = {
    stockholm: "stockholm",
    göteborg: "gothenburg",
    goteborg: "gothenburg",
    gothenburg: "gothenburg",
    malmö: "malmo",
    malmo: "malmo",
    uppsala: "uppsala",
    linköping: "linkoping",
    linkoping: "linkoping",
    västerås: "vasteras",
    vasteras: "vasteras",
    örebro: "orebro",
    orebro: "orebro",
    helsingborg: "helsingborg",
    jönköping: "jonkoping",
    jonkoping: "jonkoping",
    norrköping: "norrkoping",
    norrkoping: "norrkoping",
    lund: "lund",
    borås: "boras",
    boras: "boras",
    umeå: "umea",
    umea: "umea",
    gävle: "gavle",
    gavle: "gavle",
    sundsvall: "sundsvall",
    sverige: "sweden",
    sweden: "sweden",
  };
  return map[lower] ?? null;
}

const DURATIONS = [
  { days: 7, label: "1 vecka" },
  { days: 14, label: "2 veckor" },
  { days: 30, label: "1 månad" },
];

function EditableRow({
  icon: Icon,
  label,
  value,
  onEdit,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <Icon className="h-3 w-3 shrink-0 text-muted-foreground/40" />
      <span className="text-[9px] font-medium text-muted-foreground/60 w-20 shrink-0">{label}</span>
      <span className="flex-1 truncate text-xs text-foreground">{value}</span>
      {onEdit && (
        <button onClick={onEdit} className="text-[9px] font-medium text-indigo-500 hover:text-indigo-700">
          Ändra
        </button>
      )}
    </div>
  );
}

export function PublishCard({
  data,
  onPublish,
}: {
  data: PublishCardData;
  onPublish?: (config: {
    channels: string[];
    dailyBudget: number;
    duration: number;
    regions: string[];
    email?: string;
    abTest?: boolean;
  }) => void;
}) {
  const [channels, setChannels] = useState<Set<string>>(new Set(["meta"]));
  const [budget, setBudget] = useState<number>(
    data.suggestedBudgets.find((b) => b.recommended)?.daily ?? data.suggestedBudgets[1]?.daily ?? 200,
  );
  const [duration, setDuration] = useState(14);
  // Compute initial region selection from detectedLocations + defaultCity
  const [regions, setRegions] = useState<Set<string>>(() => {
    const initial = new Set<string>();

    // First, resolve detectedLocations from brand intelligence
    if (data.detectedLocations && data.detectedLocations.length > 0) {
      for (const loc of data.detectedLocations) {
        const id = normalizeLocationToRegionId(loc);
        if (id) initial.add(id);
      }
    }

    // Fallback to defaultCity if no detected locations matched
    if (initial.size === 0 && data.defaultCity) {
      const id = normalizeLocationToRegionId(data.defaultCity);
      if (id) initial.add(id);
    }

    // Ultimate fallback: Stockholm
    if (initial.size === 0) {
      initial.add("stockholm");
    }

    return initial;
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);
  const [abTest, setAbTest] = useState(false);

  function toggleChannel(id: string) {
    setChannels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else next.add(id);
      return next;
    });
  }

  function toggleRegion(id: string) {
    setRegions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else next.add(id);
      return next;
    });
  }

  // Regions recommended by brand intelligence
  const recommendedRegionIds = new Set<string>(
    (data.detectedLocations ?? [])
      .map(normalizeLocationToRegionId)
      .filter((id): id is string => id !== null),
  );

  const [showAllRegions, setShowAllRegions] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const total = budget * duration;

  // Budget spend-pace validation
  const BUDGET_MIN = 50;   // kr/dag — below this, reach is negligible
  const BUDGET_MAX = 5000; // kr/dag — above this, risky for new accounts
  const budgetTooLow = budget < BUDGET_MIN;
  const budgetTooHigh = budget > BUDGET_MAX;
  const budgetWarning = budgetTooLow
    ? `Under ${BUDGET_MIN} kr/dag ger mycket begränsad räckvidd. Vi rekommenderar minst ${BUDGET_MIN} kr/dag.`
    : budgetTooHigh
      ? `Över ${BUDGET_MAX.toLocaleString("sv-SE")} kr/dag är riskabelt för nya konton. Plattformarna kan flagga kontot.`
      : null;

  return (
    <div className="animate-card-in mt-2 overflow-hidden rounded-2xl border border-border/30 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <div className="text-xs font-semibold">Publicera kampanj</div>
          <div className="text-[9px] text-muted-foreground">Allt du behöver i ett steg</div>
        </div>
      </div>

      <div className="divide-y divide-border/20">
        {/* Summary rows */}
        <div className="px-4 py-2">
          <EditableRow icon={Megaphone} label="Annonstext" value={`${data.headline} — ${data.bodyCopy.slice(0, 40)}...`} />
          <EditableRow icon={Target} label="Mål" value={data.goal} />
          <EditableRow icon={Target} label="Målgrupp" value={data.audience} />
          <EditableRow icon={Globe} label="Leder till" value={data.brandUrl.replace(/^https?:\/\//, "")} />
        </div>

        {/* Channels */}
        <div className="px-4 py-2">
          <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-foreground/50">Kanaler</div>
          <div className="flex gap-1.5">
            {CHANNELS.map((ch) => {
              const active = channels.has(ch.id);
              return (
                <button
                  key={ch.id}
                  onClick={() => toggleChannel(ch.id)}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-center text-[9px] font-medium transition-all ${
                    active
                      ? "border-indigo-400 bg-indigo-50/50 text-indigo-700 ring-1 ring-indigo-200"
                      : "border-border/40 bg-white text-muted-foreground hover:border-indigo-300"
                  }`}
                >
                  {ch.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* A/B Testing toggle */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider text-foreground/50">A/B-test</div>
              <div className="text-[9px] text-muted-foreground/60 mt-0.5">A/B-testa två varianter</div>
            </div>
            <button
              onClick={() => setAbTest(!abTest)}
              className="text-muted-foreground/60 transition-colors hover:text-foreground"
              aria-label="Toggle A/B testing"
            >
              {abTest ? (
                <ToggleRight className="h-6 w-6 text-indigo-500" />
              ) : (
                <ToggleLeft className="h-6 w-6" />
              )}
            </button>
          </div>
          {abTest && (
            <div className="mt-1.5 rounded-lg border border-indigo-200 bg-indigo-50/30 px-2.5 py-1.5 text-[9px] text-indigo-700 animate-message-in">
              {"Vi k\u00F6r b\u00E5da annonskopior parallellt och optimerar automatiskt."}
            </div>
          )}
        </div>

        {/* Budget */}
        <div className="px-4 py-2">
          <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-foreground/50">Budget</div>
          <div className="flex gap-1.5">
            {data.suggestedBudgets.map((b) => (
              <button
                key={b.daily}
                onClick={() => setBudget(b.daily)}
                className={`relative flex-1 rounded-lg border px-2 py-2 text-center transition-all ${
                  budget === b.daily
                    ? "border-indigo-400 bg-indigo-50/50 ring-1 ring-indigo-200"
                    : "border-border/40 bg-white hover:border-indigo-300"
                }`}
              >
                {b.recommended && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-1.5 py-px text-[9px] font-semibold text-white">★</span>
                )}
                <div className="text-xs font-bold">{b.daily} {data.currency}</div>
                <div className="text-[9px] text-muted-foreground">{b.label}</div>
              </button>
            ))}
          </div>
          {/* Budget spend-pace warnings — advisory only, does not block publish */}
          {budgetWarning && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50/50 px-2.5 py-1.5 animate-message-in">
              <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-[9px] font-medium text-amber-700">{budgetWarning}</div>
                <div className="text-[9px] text-amber-600/70">
                  Nya konton bör starta med 100–300 kr/dag för att värma upp kontot.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Duration */}
        <div className="px-4 py-2">
          <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-foreground/50">Tid</div>
          <div className="flex gap-1">
            {DURATIONS.map((d) => (
              <button
                key={d.days}
                onClick={() => setDuration(d.days)}
                className={`flex-1 rounded-md border px-1.5 py-1 text-[9px] font-medium transition-all ${
                  duration === d.days
                    ? "border-indigo-400 bg-indigo-50/50 text-indigo-700"
                    : "border-border/40 text-muted-foreground hover:border-indigo-300"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Region selector — grouped with intelligence badges */}
        <div className="px-4 py-2">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-muted-foreground/40" />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-foreground/50">Geografisk inriktning</span>
            </div>
            {regions.size > 0 && (
              <span className="text-[9px] text-muted-foreground/50">
                {regions.has("sweden") ? "Hela Sverige" : `${regions.size} ${regions.size === 1 ? "stad" : "städer"} valda`}
              </span>
            )}
          </div>

          {/* Recommended locations badge — only shown when intelligence found locations */}
          {recommendedRegionIds.size > 0 && (
            <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 px-2.5 py-1.5 animate-message-in">
              <MapPin className="h-3 w-3 shrink-0 text-emerald-600" />
              <span className="text-[9px] text-emerald-700">
                Rekommenderat baserat på företagsdata:{" "}
                <span className="font-semibold">
                  {[...recommendedRegionIds]
                    .map((id) => ALL_REGIONS.find((r) => r.id === id)?.label)
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </span>
            </div>
          )}

          {/* Always show Storstäder + Hela landet, expandable for the rest */}
          <div className="space-y-2">
            {REGION_GROUPS.map((group, gi) => {
              // Always show first group (Storstäder), last group (Hela landet), and expanded
              const alwaysVisible = gi === 0 || gi === REGION_GROUPS.length - 1;
              if (!alwaysVisible && !showAllRegions) return null;
              return (
                <div key={group.group}>
                  <div className="mb-1 text-[8px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                    {group.group}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {group.regions.map((r) => {
                      const isRecommended = recommendedRegionIds.has(r.id);
                      const isSelected = regions.has(r.id);
                      return (
                        <button
                          key={r.id}
                          onClick={() => toggleRegion(r.id)}
                          className={`relative rounded-md border px-1.5 py-1 text-[9px] font-medium transition-all ${
                            isSelected
                              ? "border-indigo-400 bg-indigo-50/50 text-indigo-700"
                              : "border-border/40 text-muted-foreground hover:border-indigo-300"
                          }`}
                        >
                          {r.label}
                          {isRecommended && (
                            <span className="ml-1 inline-flex items-center rounded-full bg-emerald-100 px-1 py-px text-[7px] font-bold uppercase text-emerald-700">
                              AI
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expand/collapse toggle for Mellansverige + Norrland */}
          {!showAllRegions ? (
            <button
              onClick={() => setShowAllRegions(true)}
              className="mt-1.5 text-[9px] font-medium text-indigo-500 transition-colors hover:text-indigo-700"
            >
              {"Visa fler städer (Mellansverige, Norrland) \u2193"}
            </button>
          ) : (
            <button
              onClick={() => setShowAllRegions(false)}
              className="mt-1.5 text-[9px] font-medium text-indigo-500 transition-colors hover:text-indigo-700"
            >
              {"Visa färre städer \u2191"}
            </button>
          )}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between bg-emerald-50/30 px-4 py-2">
          <div>
            <div className="text-[9px] text-muted-foreground">Total kostnad</div>
            <div className="text-sm font-bold text-foreground">{total.toLocaleString("sv-SE")} {data.currency}</div>
          </div>
          <div className="text-right text-[9px] text-muted-foreground">
            {budget} {data.currency}/dag × {duration} dagar
          </div>
        </div>

        {/* Conversion tracking status */}
        {data.tracking && (
          <div className="px-4 py-2">
            <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-foreground/50">
              Konverteringssp&aring;rning
            </div>
            <div className="space-y-1.5">
              {channels.has("meta") && (
                <div className="flex items-start gap-2">
                  {data.tracking.hasMetaPixel ? (
                    <Check className="mt-px h-3 w-3 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="mt-px h-3 w-3 shrink-0 text-amber-500" />
                  )}
                  <div className="flex-1">
                    <span className={`text-[10px] font-medium ${data.tracking.hasMetaPixel ? "text-emerald-700" : "text-amber-700"}`}>
                      Meta Pixel {data.tracking.hasMetaPixel ? "hittad" : "saknas"}
                    </span>
                    {!data.tracking.hasMetaPixel && (
                      <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                        Meta Pixel saknas &mdash; du kan l&auml;gga till den senare, men utan sp&aring;rning kan du inte m&auml;ta resultat.
                      </p>
                    )}
                  </div>
                </div>
              )}
              {channels.has("google") && (
                <div className="flex items-start gap-2">
                  {data.tracking.hasGoogleTag ? (
                    <Check className="mt-px h-3 w-3 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="mt-px h-3 w-3 shrink-0 text-amber-500" />
                  )}
                  <div className="flex-1">
                    <span className={`text-[10px] font-medium ${data.tracking.hasGoogleTag ? "text-emerald-700" : "text-amber-700"}`}>
                      Google Tag {data.tracking.hasGoogleTag ? "hittad" : "saknas"}
                    </span>
                    {!data.tracking.hasGoogleTag && (
                      <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                        Google Tag saknas &mdash; du kan l&auml;gga till den senare, men utan sp&aring;rning kan du inte m&auml;ta resultat.
                      </p>
                    )}
                  </div>
                </div>
              )}
              {channels.has("linkedin") && (
                <div className="flex items-start gap-2">
                  {data.tracking.hasLinkedinTag ? (
                    <Check className="mt-px h-3 w-3 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="mt-px h-3 w-3 shrink-0 text-amber-500" />
                  )}
                  <div className="flex-1">
                    <span className={`text-[10px] font-medium ${data.tracking.hasLinkedinTag ? "text-emerald-700" : "text-amber-700"}`}>
                      LinkedIn Insight Tag {data.tracking.hasLinkedinTag ? "hittad" : "saknas"}
                    </span>
                    {!data.tracking.hasLinkedinTag && (
                      <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                        LinkedIn Insight Tag saknas &mdash; du kan l&auml;gga till den senare, men utan sp&aring;rning kan du inte m&auml;ta resultat.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Account creation + Connectors + Publish */}
        <div className="px-4 py-3 space-y-3">
          {/* Account fields */}
          <div>
            <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-foreground/50">
              Skapa konto för att publicera
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-white px-3 py-2 transition-all focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-200">
                <Mail className="h-3.5 w-3.5 text-muted-foreground/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@email.se"
                  className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/40"
                  required
                />
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-white px-3 py-2 transition-all focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-200">
                <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Välj lösenord (minst 8 tecken)"
                  minLength={8}
                  className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/40"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground/30 hover:text-muted-foreground">
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Existing ad accounts? */}
          <div>
            <button
              onClick={() => setShowConnectors(!showConnectors)}
              className="text-[9px] font-medium text-indigo-500 transition-colors hover:text-indigo-700"
            >
              {showConnectors ? "Dölj kopplingar ↑" : "Har du redan annonskonton? Koppla dem →"}
            </button>
            {showConnectors && (
              <div className="mt-2 space-y-1 animate-message-in">
                {[
                  { id: "meta", label: "Meta Business", icon: "f" },
                  { id: "google", label: "Google Ads", icon: "G" },
                  { id: "linkedin", label: "LinkedIn", icon: "in" },
                ].map((p) => (
                  <button key={p.id} className="flex w-full items-center gap-2 rounded-lg border border-border/40 bg-white px-3 py-1.5 text-[9px] text-muted-foreground transition-all hover:border-indigo-300 hover:text-indigo-600">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-muted/30 text-[9px] font-bold">{p.icon}</span>
                    <span className="flex-1 text-left font-medium">{p.label}</span>
                    <span className="text-indigo-500">Koppla</span>
                  </button>
                ))}
                <div className="text-[9px] text-muted-foreground/40">
                  Valfritt — vi skapar konton åt dig om du hoppar över
                </div>
              </div>
            )}
          </div>

          {/* Publish button */}
          <button
            onClick={() => {
              if (!emailValid || !password || password.length < 8) return;
              window.dispatchEvent(new CustomEvent("doost:signup-complete"));
              onPublish?.({
                channels: [...channels],
                dailyBudget: budget,
                duration,
                regions: [...regions],
                email,
                abTest,
              });
            }}
            disabled={!emailValid || !password || password.length < 8}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:from-emerald-600 hover:to-teal-600 hover:shadow-md disabled:opacity-40"
          >
            Skapa konto & publicera
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-center justify-center gap-3 text-[9px] text-muted-foreground/40">
            <span>🔒 Krypterad</span>
            <span>·</span>
            <span>Pausa när som helst</span>
          </div>
        </div>
      </div>
    </div>
  );
}
