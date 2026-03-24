"use client";

import {
  Building2,
  ExternalLink,
  Globe,
  MapPin,
  TrendingUp,
  Users,
} from "lucide-react";

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
  valuePropositions: string[];
};

function DataField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/70 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-5 w-5 rounded-full border border-black/5 shadow-sm"
        style={{ backgroundColor: color }}
      />
      <div>
        <div className="text-[10px] text-muted-foreground/70">{label}</div>
        <div className="font-mono text-xs text-foreground/80">{color}</div>
      </div>
    </div>
  );
}

export function BrandProfileCard({ data }: { data: BrandProfileData }) {
  const colors = data.colors;

  return (
    <div className="brand-card-glow relative mt-1 overflow-hidden rounded-2xl border border-white/30 bg-white/50 p-5 shadow-sm backdrop-blur-xl">
      {/* Badge */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            Profil klar
          </span>
        </div>
      </div>

      {/* Company header */}
      <div className="mb-4">
        <h3 className="font-heading text-xl font-semibold">{data.name}</h3>
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {data.url.replace(/^https?:\/\//, "")}
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
        {data.description && (
          <p className="mt-2 text-sm leading-relaxed text-foreground/70">
            {data.description}
          </p>
        )}
      </div>

      {/* Data grid */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {data.industry && (
          <DataField icon={Building2} label="Bransch" value={data.industry} />
        )}
        {data.employeeCount != null && (
          <DataField
            icon={Users}
            label="Anst&auml;llda"
            value={data.employeeCount.toLocaleString("sv-SE")}
          />
        )}
        {data.revenue && (
          <DataField
            icon={TrendingUp}
            label="Oms&auml;ttning"
            value={data.revenue}
          />
        )}
        {data.location && (
          <DataField icon={MapPin} label="Plats" value={data.location} />
        )}
      </div>

      {/* Brand colors */}
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
          <Globe className="h-3 w-3" />
          Varum&auml;rkesf&auml;rger
        </div>
        <div className="grid grid-cols-3 gap-3">
          <ColorSwatch color={colors.primary} label="Prim&auml;r" />
          <ColorSwatch color={colors.secondary} label="Sekund&auml;r" />
          <ColorSwatch color={colors.accent} label="Accent" />
        </div>
      </div>

      {/* Fonts */}
      <div className="flex gap-4 text-xs text-muted-foreground/70">
        <span>
          Rubrik:{" "}
          <span className="font-medium text-foreground/80">
            {data.fonts.heading}
          </span>
        </span>
        <span>
          Br&ouml;dtext:{" "}
          <span className="font-medium text-foreground/80">
            {data.fonts.body}
          </span>
        </span>
      </div>
    </div>
  );
}

export function BrandProfileLoading() {
  return (
    <div className="mt-1 overflow-hidden rounded-2xl border border-white/30 bg-white/50 p-5 shadow-sm backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
            Analyserar
          </span>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-5 w-48 animate-pulse rounded-lg bg-muted/60" />
        <div className="h-4 w-64 animate-pulse rounded-lg bg-muted/40" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-14 animate-pulse rounded-xl bg-muted/30" />
          <div className="h-14 animate-pulse rounded-xl bg-muted/30" />
          <div className="h-14 animate-pulse rounded-xl bg-muted/30" />
          <div className="h-14 animate-pulse rounded-xl bg-muted/30" />
        </div>
      </div>
    </div>
  );
}
