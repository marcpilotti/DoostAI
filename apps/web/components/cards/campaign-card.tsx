"use client";

import { Check, ClipboardList, Eye, LinkIcon, ShoppingCart } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { FieldLabel } from "@/components/ui/field-label";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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

  const cellVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <CardShell noPadding>
      {/* ── Header ──────────────────────────────────────── */}
      <div className="p-card-p sm:p-card-p-lg">
        <h2 className="text-card-title text-d-text-primary">Kampanjinställningar</h2>
        <p className="mt-1 text-small text-d-text-secondary">Välj mål och namnge din kampanj</p>
      </div>

      <Separator className="bg-d-border-light" />

      {/* ── Objective grid ──────────────────────────────── */}
      <div className="p-card-p sm:p-card-p-lg">
        <FieldLabel className="mb-3">Kampanjmål</FieldLabel>
        <motion.div
          className="grid grid-cols-2 gap-grid-gap"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          initial={prefersReduced ? false : "hidden"}
          animate="show"
        >
          {OBJECTIVES.map((obj) => {
            const isSelected = selected === obj.id;
            const isRecommended = obj.id === aiRecommendedObjective;

            return (
              <motion.button
                key={obj.id}
                variants={cellVariants}
                onClick={() => setSelected(obj.id)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative rounded-cell p-cell-p text-left transition-all",
                  isSelected
                    ? "bg-accent-light border-[1.5px] border-accent shadow-card-active"
                    : "bg-surface border border-transparent hover:border-d-border",
                )}
              >
                {/* AI recommended pill */}
                {isRecommended && (
                  <Pill variant="blue" className="absolute -top-2.5 left-3 text-[9px]">
                    AI-rekommenderad
                  </Pill>
                )}

                {/* Selection checkmark */}
                {isSelected && (
                  <div className="absolute -right-1.5 -top-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-accent text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                )}

                <obj.icon className={cn("h-5 w-5 mb-2", isSelected ? "text-accent" : "text-d-text-hint")} />
                <p className="text-[14px] font-semibold text-d-text-primary">{obj.label}</p>
                <p className="mt-0.5 text-xs text-d-text-secondary">{obj.description}</p>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      <Separator className="bg-d-border-light" />

      {/* ── Campaign name ───────────────────────────────── */}
      <div className="p-card-p sm:p-card-p-lg">
        <FieldLabel className="mb-2">Kampanjnamn</FieldLabel>
        <Input
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          className="bg-surface rounded-cell text-[15px] font-semibold border-0 h-auto p-3"
        />
      </div>

      <Separator className="bg-d-border-light" />

      {/* ── Platform select ─────────────────────────────── */}
      <div className="p-card-p sm:p-card-p-lg">
        <FieldLabel className="mb-3">Plattformar</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {Object.entries(platforms).map(([name, active]) => (
            <button
              key={name}
              onClick={() => setPlatforms((p) => ({ ...p, [name]: !p[name] }))}
              className={cn(
                "rounded-pill px-4 py-2 text-small font-medium transition-all border",
                active
                  ? "bg-accent-light text-accent border-accent-border"
                  : "bg-surface text-d-text-secondary border-d-border-light hover:border-d-border",
              )}
            >
              {name} {active && "✓"}
            </button>
          ))}
        </div>
      </div>

      <Separator className="bg-d-border-light" />

      {/* ── CTA ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 p-card-p sm:p-card-p-lg">
        <Button
          onClick={handleConfirm}
          className="flex-1 rounded-btn bg-d-text-primary text-white hover:bg-d-text-primary/90"
          size="lg"
        >
          Fortsätt till budget →
        </Button>
        {onBack && (
          <Button variant="outline" onClick={onBack} className="rounded-btn border-d-border" size="lg">
            ← Tillbaka
          </Button>
        )}
      </div>
    </CardShell>
  );
}
