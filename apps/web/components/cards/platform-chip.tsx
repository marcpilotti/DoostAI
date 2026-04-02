"use client";

import { cn } from "@/lib/utils";

// ── Platform logos (28px square icons) ──────────────────────────

function MetaIcon() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-[#1877F2]">
      <span className="text-xs font-bold text-white">f</span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-[#4285F4]">
      <span className="text-xs font-bold text-white">G</span>
    </div>
  );
}

function LinkedInIcon() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-[#0A66C2]">
      <span className="text-[10px] font-bold text-white">in</span>
    </div>
  );
}

const PLATFORM_ICONS: Record<string, () => React.ReactElement> = {
  Meta: MetaIcon,
  Google: GoogleIcon,
  LinkedIn: LinkedInIcon,
};

// ── PlatformChip ───────────────────────────────────────────────

export function PlatformChip({ name, selected, onToggle }: {
  name: string;
  selected: boolean;
  onToggle: () => void;
}) {
  const Icon = PLATFORM_ICONS[name];

  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex h-[42px] w-[120px] items-center gap-2 rounded-[10px] px-2.5 transition-all",
        selected
          ? "border-[1.5px] border-[#3B82F6] bg-[#F0F7FF]"
          : "border border-[#e2e8f0] bg-white hover:border-[#cbd5e1]",
      )}
    >
      {Icon && <Icon />}
      <span className={cn(
        "text-[13px] font-medium",
        selected ? "text-[#3B82F6]" : "text-[#0f172a]",
      )}>
        {name}
      </span>
      {selected && <span className="ml-auto text-[13px] text-[#3B82F6]">✓</span>}
    </button>
  );
}
