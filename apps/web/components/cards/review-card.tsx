"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";

import { CardShell } from "@/components/ui/card-shell";
import { Pill } from "@/components/ui/pill";
import { PulsatingButton } from "@/components/ui/pulsating-button";
import { Separator } from "@/components/ui/separator";

// ── Types ───────────────────────────────────────────────────────

type ReviewData = {
  brandName: string;
  brandUrl: string;
  objective: string;
  platforms: string[];
  dailyBudget: number;
  variantLabel: string;
  variantScore: number;
};

// ── Summary row ─────────────────────────────────────────────────

function SummaryRow({ label, value, onEdit }: {
  label: string;
  value: string;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-xs text-d-text-hint">{label}</p>
        <p className="text-[15px] font-semibold text-d-text-primary">{value}</p>
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="flex items-center gap-1 rounded-btn px-2 py-1 text-xs text-accent hover:bg-accent-light transition-colors"
        >
          <Pencil className="h-3 w-3" />
          Ändra
        </button>
      )}
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────

export function ReviewCard({ data, onPublish, onEdit, onBack }: {
  data: ReviewData;
  onPublish: () => void;
  onEdit: (step: number) => void;
  onBack?: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const monthlyBudget = data.dailyBudget * 30;

  const scorePill = data.variantScore >= 75
    ? { variant: "green" as const, label: `${data.variantScore}/100` }
    : data.variantScore >= 50
      ? { variant: "amber" as const, label: `${data.variantScore}/100` }
      : { variant: "amber" as const, label: `${data.variantScore}/100` };

  return (
    <CardShell noPadding>
      {/* ── Header ──────────────────────────────────────── */}
      <div className="p-card-p sm:p-card-p-lg">
        <h2 className="text-card-title text-d-text-primary">Granska och publicera</h2>
        <p className="mt-1 text-small text-d-text-secondary">Kontrollera alla uppgifter innan du publicerar</p>
      </div>

      <Separator className="bg-d-border-light" />

      {/* ── Summary rows ────────────────────────────────── */}
      <div className="divide-y divide-d-border-light px-card-p sm:px-card-p-lg">
        <SummaryRow
          label="Varumärke"
          value={`${data.brandName} — ${data.brandUrl}`}
          onEdit={() => onEdit(1)}
        />
        <SummaryRow
          label="Kampanjmål"
          value={data.objective}
          onEdit={() => onEdit(2)}
        />
        <SummaryRow
          label="Plattformar"
          value={data.platforms.join(", ")}
          onEdit={() => onEdit(2)}
        />
        <SummaryRow
          label="Budget"
          value={`${data.dailyBudget} kr/dag (${monthlyBudget.toLocaleString("sv-SE")} kr/mån)`}
          onEdit={() => onEdit(3)}
        />
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-xs text-d-text-hint">Kreativ</p>
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-semibold text-d-text-primary">{data.variantLabel}</p>
              <Pill variant={scorePill.variant}>{scorePill.label}</Pill>
            </div>
          </div>
          <button
            onClick={() => onEdit(4)}
            className="flex items-center gap-1 rounded-btn px-2 py-1 text-xs text-accent hover:bg-accent-light transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Ändra
          </button>
        </div>
      </div>

      <Separator className="bg-d-border-light" />

      {/* ── Budget confirmation banner ──────────────────── */}
      <div className="mx-card-p sm:mx-card-p-lg my-4 rounded-cell bg-d-warning-light border border-d-warning-border p-4">
        <p className="text-sm text-d-warning font-medium">
          Du spenderar upp till {data.dailyBudget} kr/dag (max {monthlyBudget.toLocaleString("sv-SE")} kr/mån).
          Du kan pausa eller ändra din budget när som helst.
        </p>
        <label className="mt-3 flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="h-4 w-4 rounded accent-accent"
          />
          <span className="text-xs text-d-text-secondary">Jag förstår och godkänner</span>
        </label>
      </div>

      <Separator className="bg-d-border-light" />

      {/* ── CTA ─────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 p-card-p sm:p-card-p-lg">
        <PulsatingButton
          onClick={handlePublish}
          disabled={!confirmed}
          className="w-full rounded-btn text-[15px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          pulseColor="#2563EB"
        >
          Publicera kampanj 🚀
        </PulsatingButton>
        {onBack && (
          <button onClick={onBack} className="text-xs text-d-text-hint hover:text-d-text-primary">
            ← Tillbaka
          </button>
        )}
      </div>
    </CardShell>
  );

  function handlePublish() {
    if (!confirmed) return;
    onPublish();
  }
}
