"use client";

import { useState } from "react";
import { Check, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    credits: 500,
    features: ["500 credits/month", "1 ad account", "5 campaigns", "FLUX Schnell", "Basic analytics"],
    highlighted: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: 149,
    credits: 2500,
    features: ["2,500 credits/month", "3 ad accounts", "25 campaigns", "FLUX Pro + GPT Image + Seedream", "Advanced analytics", "AI Actions"],
    highlighted: true,
  },
  {
    id: "scale",
    name: "Scale",
    price: 399,
    credits: 10000,
    features: ["10,000 credits/month", "Unlimited ad accounts", "Unlimited campaigns", "All models incl. Nano Banana Pro 4K", "Full analytics", "AI Actions", "API access"],
    highlighted: false,
  },
];

export function UpgradePrompt({
  open,
  onClose,
  currentPlan = "starter",
  reason,
}: {
  open: boolean;
  onClose: () => void;
  currentPlan?: string;
  reason?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-4 z-50 mx-auto my-auto flex max-h-[80vh] max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--doost-border)" }}>
              <div>
                <h2 className="text-[16px] font-semibold text-[var(--doost-text)]">Upgrade your plan</h2>
                {reason && <p className="mt-0.5 text-[13px] text-[var(--doost-text-muted)]">{reason}</p>}
              </div>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--doost-text-muted)] hover:bg-[var(--doost-bg-secondary)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Plans grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-3 gap-4">
                {PLANS.map((plan) => {
                  const isCurrent = plan.id === currentPlan;
                  return (
                    <div
                      key={plan.id}
                      className={`flex flex-col rounded-xl p-5 ${
                        plan.highlighted
                          ? "bg-[var(--doost-bg-active)] text-white ring-2 ring-[var(--doost-bg-active)]"
                          : "bg-[var(--doost-bg)]"
                      }`}
                      style={!plan.highlighted ? { border: `1px solid var(--doost-border)` } : undefined}
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <Sparkles className={`h-4 w-4 ${plan.highlighted ? "text-white/60" : "text-[var(--doost-text-muted)]"}`} />
                        <span className="text-[14px] font-semibold">{plan.name}</span>
                      </div>
                      <div className="mb-4">
                        <span className="text-[28px] font-bold">${plan.price}</span>
                        <span className={`text-[13px] ${plan.highlighted ? "text-white/50" : "text-[var(--doost-text-muted)]"}`}>/mo</span>
                      </div>
                      <div className="mb-4 flex-1 space-y-2">
                        {plan.features.map((f) => (
                          <div key={f} className="flex items-start gap-2 text-[12px]">
                            <Check className={`mt-0.5 h-3 w-3 shrink-0 ${plan.highlighted ? "text-white/60" : "text-[var(--doost-text-positive)]"}`} />
                            <span className={plan.highlighted ? "text-white/80" : "text-[var(--doost-text-secondary)]"}>{f}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        disabled={isCurrent}
                        className={`w-full rounded-lg py-2.5 text-[13px] font-semibold transition-opacity ${
                          isCurrent
                            ? "opacity-50 cursor-default"
                            : plan.highlighted
                              ? "bg-white text-[var(--doost-text)] hover:opacity-90"
                              : "bg-[var(--doost-bg-active)] text-white hover:opacity-90"
                        }`}
                      >
                        {isCurrent ? "Current plan" : `Upgrade to ${plan.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
