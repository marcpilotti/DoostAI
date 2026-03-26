"use client";

import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Globe,
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
      <span className="text-[10px] font-medium text-muted-foreground/60 w-20 shrink-0">{label}</span>
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
    new Set([data.defaultCity?.toLowerCase() === "göteborg" ? "gothenburg" : data.defaultCity?.toLowerCase() === "malmö" ? "malmo" : "stockholm"]),
  );
  const [email, setEmail] = useState("");

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
          <div className="text-[10px] text-muted-foreground">Allt du behöver i ett steg</div>
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
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-center text-[10px] font-medium transition-all ${
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
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-1.5 py-px text-[7px] font-semibold text-white">★</span>
                )}
                <div className="text-xs font-bold">{b.daily} {data.currency}</div>
                <div className="text-[8px] text-muted-foreground">{b.label}</div>
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
            <div className="text-[10px] text-muted-foreground">Total kostnad</div>
            <div className="text-sm font-bold text-foreground">{total.toLocaleString("sv-SE")} {data.currency}</div>
          </div>
          <div className="text-right text-[9px] text-muted-foreground">
            {budget} {data.currency}/dag × {duration} dagar
          </div>
        </div>

        {/* Email + Publish */}
        <div className="px-4 py-3">
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-border/40 bg-white px-3 py-2 transition-all focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-200">
            <span className="text-[10px] text-muted-foreground/50">✉</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="din@email.se (valfritt)"
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/40"
            />
          </div>
          <button
            onClick={() => onPublish?.({
              channels: [...channels],
              dailyBudget: budget,
              duration,
              regions: [...regions],
              email: email || undefined,
            })}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:from-emerald-600 hover:to-teal-600 hover:shadow-md"
          >
            Publicera kampanj
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <div className="mt-1.5 text-center text-[9px] text-muted-foreground/40">
            Du kan pausa eller ändra när som helst
          </div>
        </div>
      </div>
    </div>
  );
}
