"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";

type Variant = {
  id: string;
  label: string;
  headline: string;
  bodyCopy: string;
  cta: string;
  imageUrl?: string;
};

export function VariantPicker({
  variants,
  onSelect,
}: {
  variants: Variant[];
  onSelect: (winnerId: string) => void;
}) {
  const [winnerId, setWinnerId] = useState<string | null>(null);

  function pick(id: string) {
    setWinnerId(id);
    onSelect(id);
  }

  if (variants.length < 2) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {variants.map((v) => {
        const isWinner = winnerId === v.id;
        const isLoser = winnerId !== null && !isWinner;

        return (
          <motion.div
            key={v.id}
            animate={{ opacity: isLoser ? 0.5 : 1, scale: isLoser ? 0.97 : 1 }}
            transition={{ duration: 0.3 }}
            className={`relative overflow-hidden rounded-xl transition-shadow ${
              isWinner
                ? "ring-2 ring-[var(--doost-text-positive)] shadow-md"
                : "ring-1 ring-[var(--doost-border)]"
            }`}
          >
            {/* Winner badge */}
            {isWinner && (
              <div className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--doost-text-positive)] text-white">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </div>
            )}

            {/* Image preview */}
            {v.imageUrl && (
              <div className="aspect-[4/3] w-full overflow-hidden bg-[var(--doost-bg-secondary)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.imageUrl}
                  alt={v.headline}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* Copy preview */}
            <div className="p-4">
              <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--doost-text-muted)]">
                {v.label}
              </p>
              <h3 className="text-[14px] font-semibold text-[var(--doost-text)]">
                {v.headline}
              </h3>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--doost-text-secondary)]">
                {v.bodyCopy}
              </p>
              <span className="mt-2 inline-block rounded-full bg-[var(--doost-bg-secondary)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--doost-text)]">
                {v.cta}
              </span>
            </div>

            {/* Pick button */}
            {!winnerId && (
              <div className="border-t px-4 py-3" style={{ borderColor: "var(--doost-border)" }}>
                <button
                  onClick={() => pick(v.id)}
                  className="w-full rounded-lg bg-[var(--doost-bg-active)] py-2 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
                >
                  Välj denna
                </button>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
