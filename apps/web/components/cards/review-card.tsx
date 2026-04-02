"use client";

import { Pencil } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

// ── Helpers ─────────────────────────────────────────────────────

function Divider() {
  return <div className="my-4 h-px bg-[#F0F0F0]" />;
}

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
        <p className="text-xs text-[#AAAAAA]">{label}</p>
        <p className="text-base font-semibold text-[#111111]">{value}</p>
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[#3B82F6] hover:bg-[#F0F7FF] transition-colors"
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
  const prefersReduced = useReducedMotion();
  const [confirmed, setConfirmed] = useState(false);
  const monthlyBudget = data.dailyBudget * 30;

  function handlePublish() {
    if (!confirmed) return;
    onPublish();
  }

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-[480px] rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)]"
    >
      {/* 1. Header */}
      <h2 className="text-2xl font-bold text-[#111111]">Granska och publicera</h2>
      <p className="mt-1 text-sm text-[#666666]">Kontrollera alla uppgifter innan du publicerar</p>

      {/* 2. Divider */}
      <Divider />

      {/* 3. Summary rows */}
      <div className="divide-y divide-[#F0F0F0]">
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

        {/* 4. Creative row with score pill */}
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-xs text-[#AAAAAA]">Kreativ</p>
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-[#111111]">{data.variantLabel}</p>
              <span className="inline-flex items-center rounded-full border border-[#86EFAC] bg-[#F0FDF4] px-2 py-0.5 text-xs font-medium text-[#059669]">
                {data.variantScore}/100
              </span>
            </div>
          </div>
          <button
            onClick={() => onEdit(4)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[#3B82F6] hover:bg-[#F0F7FF] transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Ändra
          </button>
        </div>
      </div>

      {/* 5. Divider */}
      <Divider />

      {/* 6. Budget warning */}
      <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4">
        <p className="text-sm font-medium text-[#92400E]">
          Du spenderar upp till {data.dailyBudget} kr/dag (max {monthlyBudget.toLocaleString("sv-SE")} kr/mån).
          Du kan pausa eller ändra din budget när som helst.
        </p>
        <label className="mt-3 flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="h-4 w-4 rounded accent-[#3B82F6]"
          />
          <span className="text-xs text-[#666666]">Jag förstår och godkänner</span>
        </label>
      </div>

      {/* 7. Divider */}
      <Divider />

      {/* 8. Publish CTA — BLUE */}
      <button
        onClick={handlePublish}
        disabled={!confirmed}
        className="w-full rounded-xl bg-[#3B82F6] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#2563EB] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Publicera kampanj 🚀
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
