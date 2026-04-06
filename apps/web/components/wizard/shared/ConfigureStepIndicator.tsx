"use client";

import { Check } from "lucide-react";

export function ConfigureStepIndicator({ activeStep }: { activeStep: "configure" | "review" }) {
  const isReview = activeStep === "review";

  return (
    <div className="flex items-center justify-center gap-0 mb-4">
      {/* Step 1: Konfigurera */}
      <div className="flex items-center gap-2">
        <div
          className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[10px] font-bold"
          style={{
            background: isReview ? "var(--color-success)" : "var(--color-primary)",
            color: "#fff",
          }}
        >
          {isReview ? <Check className="h-3 w-3" /> : "1"}
        </div>
        <span
          className="text-[12px] font-medium"
          style={{ color: isReview ? "var(--color-text-muted)" : "var(--color-text-primary)" }}
        >
          Konfigurera
        </span>
      </div>

      {/* Connecting line */}
      <div
        className="mx-3 h-px w-12"
        style={{ background: isReview ? "var(--color-primary)" : "var(--color-border-default)" }}
      />

      {/* Step 2: Granska */}
      <div className="flex items-center gap-2">
        <div
          className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[10px] font-bold"
          style={{
            background: isReview ? "var(--color-primary)" : "transparent",
            border: isReview ? "none" : "1.5px solid var(--color-border-default)",
            color: isReview ? "#fff" : "var(--color-text-muted)",
          }}
        >
          2
        </div>
        <span
          className="text-[12px] font-medium"
          style={{ color: isReview ? "var(--color-text-primary)" : "var(--color-text-muted)" }}
        >
          Granska
        </span>
      </div>
    </div>
  );
}
