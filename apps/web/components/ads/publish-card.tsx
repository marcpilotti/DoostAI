"use client";

import { useState } from "react";
import {
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
  Wallet,
  Zap,
} from "lucide-react";

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
};

const CHANNELS = [
  { id: "meta", label: "Meta", sub: "Facebook & Instagram" },
  { id: "google", label: "Google", sub: "Sök & Display" },
  { id: "linkedin", label: "LinkedIn", sub: "B2B" },
];

const REGIONS = [
  { id: "stockholm", label: "Stockholm" },
  { id: "gothenburg", label: "Göteborg" },
  { id: "malmo", label: "Malmö" },
  { id: "sweden", label: "Hela Sverige" },
];

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
  }) => void;
}) {
  const [channels, setChannels] = useState<Set<string>>(new Set(["meta"]));
  const [budget, setBudget] = useState<number>(
    data.suggestedBudgets.find((b) => b.recommended)?.daily ?? data.suggestedBudgets[1]?.daily ?? 200,
  );
  const [duration, setDuration] = useState(14);
  const [regions, setRegions] = useState<Set<string>>(
    new Set([data.defaultCity?.toLowerCase().trim() === "göteborg" ? "gothenburg" : data.defaultCity?.toLowerCase().trim() === "malmö" ? "malmo" : "stockholm"]),
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);

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

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const total = budget * duration;

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
        </div>

        {/* Duration + Region row */}
        <div className="flex gap-3 px-4 py-2">
          <div className="flex-1">
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
          <div className="flex-1">
            <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-foreground/50">Var</div>
            <div className="flex flex-wrap gap-1">
              {REGIONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => toggleRegion(r.id)}
                  className={`rounded-md border px-1.5 py-1 text-[9px] font-medium transition-all ${
                    regions.has(r.id)
                      ? "border-indigo-400 bg-indigo-50/50 text-indigo-700"
                      : "border-border/40 text-muted-foreground hover:border-indigo-300"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
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
