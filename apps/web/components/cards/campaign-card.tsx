"use client";

import { Check, ClipboardList, Eye, LinkIcon, ShoppingCart } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { PlatformChip } from "./platform-chip";

// ── Helpers ─────────────────────────────────────────────────────

function Divider() {
  return <div className="my-6 h-px bg-[#F0F0F0]" />;
}

// ── Objectives ──────────────────────────────────────────────────

const OBJECTIVES = [
  { id: "awareness", label: "Synlighet", description: "Gör ditt varumärke känt för fler", icon: Eye },
  { id: "traffic", label: "Webbplatsbesök", description: "Driv besökare till din webbplats", icon: LinkIcon },
  { id: "sales", label: "Försäljning", description: "Få fler köp eller registreringar", icon: ShoppingCart },
  { id: "leads", label: "Leads", description: "Samla in kontaktinformation", icon: ClipboardList },
] as const;

type ObjectiveId = typeof OBJECTIVES[number]["id"];

// ── Component ───────────────────────────────────────────────────

export function CampaignCard({ brandName, aiRecommendedObjective, onConfirm, onBack }: {
  brandName: string;
  aiRecommendedObjective?: ObjectiveId;
  onConfirm: (data: { objective: string; campaignName: string; platforms: string[] }) => void;
  onBack?: () => void;
}) {
  const prefersReduced = useReducedMotion();
  const defaultObjective = aiRecommendedObjective ?? "sales";
  const [selected, setSelected] = useState<ObjectiveId>(defaultObjective);
  const [campaignName, setCampaignName] = useState(`${brandName} kampanj 2026`);
  const [platforms, setPlatforms] = useState<Record<string, boolean>>({
    Meta: true,
    Google: true,
    LinkedIn: false,
  });

  function handleConfirm() {
    onConfirm({
      objective: selected,
      campaignName,
      platforms: Object.entries(platforms).filter(([, v]) => v).map(([k]) => k),
    });
  }

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-[480px] rounded-2xl border border-[#EEEEEE] bg-white p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)]"
    >
      {/* 1. Header */}
      <h2 className="text-2xl font-bold text-[#111111]">Kampanjmål</h2>
      <p className="mt-1 text-sm text-[#666666]">Välj mål och namnge din kampanj</p>

      {/* 2. Divider */}
      <Divider />

      {/* 3. 2x2 objective grid */}
      <div className="grid grid-cols-2 gap-3">
        {OBJECTIVES.map((obj) => {
          const isSelected = selected === obj.id;
          const isRecommended = obj.id === aiRecommendedObjective;

          return (
            <button
              key={obj.id}
              onClick={() => setSelected(obj.id)}
              className={cn(
                "relative rounded-xl p-4 text-left transition-all",
                isSelected
                  ? "border-[1.5px] border-[#3B82F6] bg-[#F0F7FF]"
                  : "border border-[#E5E5E5] bg-white hover:border-[#CCCCCC]",
              )}
            >
              {/* AI recommended badge */}
              {isRecommended && (
                <span className="absolute -top-2.5 left-3 rounded-full bg-[#F0F7FF] border border-[#3B82F6] px-2 py-0.5 text-[9px] font-medium text-[#3B82F6]">
                  AI-rekommenderad
                </span>
              )}

              {/* Selection checkmark */}
              {isSelected && (
                <div className="absolute -right-1.5 -top-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#3B82F6] text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </div>
              )}

              <obj.icon className={cn("h-5 w-5 mb-2", isSelected ? "text-[#3B82F6]" : "text-[#AAAAAA]")} />
              <p className="text-sm font-semibold text-[#111111]">{obj.label}</p>
              <p className="mt-0.5 text-xs text-[#666666]">{obj.description}</p>
            </button>
          );
        })}
      </div>

      {/* 4. Divider */}
      <Divider />

      {/* 5. Campaign name */}
      <p className="mb-2 text-[13px] font-medium text-[#999999]">Kampanjnamn</p>
      <Input
        value={campaignName}
        onChange={(e) => setCampaignName(e.target.value)}
        className="h-auto rounded-xl border-[#E5E5E5] bg-white p-3 text-base font-semibold text-[#111111] focus-visible:ring-1 focus-visible:ring-[#3B82F6]"
      />

      {/* 6. Divider */}
      <Divider />

      {/* 7. Platforms */}
      <p className="mb-3 text-[13px] font-medium text-[#999999]">Annonskanaler</p>
      <div className="flex flex-wrap gap-2">
        {Object.entries(platforms).map(([name, active]) => (
          <PlatformChip
            key={name}
            name={name}
            selected={active}
            onToggle={() => setPlatforms((p) => ({ ...p, [name]: !p[name] }))}
          />
        ))}
      </div>

      {/* 8. Divider + CTA */}
      <Divider />

      <button
        onClick={handleConfirm}
        className="w-full rounded-xl bg-[#111111] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#222222]"
      >
        Fortsätt till budget →
      </button>

      {onBack && (
        <button
          onClick={onBack}
          className="mt-4 w-full text-center text-sm text-[#999999] hover:text-[#111111] transition-colors"
        >
          ← Tillbaka
        </button>
      )}
    </motion.div>
  );
}
