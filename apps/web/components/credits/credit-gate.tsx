"use client";

import { Sparkles } from "lucide-react";

import { useCredits } from "@/hooks/use-credits";

/**
 * CreditGate — wraps an action and blocks if insufficient credits.
 * Shows the children normally when credits are sufficient.
 * Shows an "insufficient credits" message with upgrade CTA when not.
 */
export function CreditGate({
  cost,
  children,
  fallback,
}: {
  cost: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { balance, isLoading } = useCredits();

  if (isLoading) return <>{children}</>;

  if (balance < cost) {
    return (
      fallback ?? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] p-4 text-center" style={{ border: `1px solid var(--doost-border)` }}>
          <Sparkles className="h-5 w-5 text-[var(--doost-text-muted)]" />
          <p className="text-[13px] font-medium text-[var(--doost-text)]">Insufficient credits</p>
          <p className="text-[12px] text-[var(--doost-text-muted)]">
            This action costs {cost} credits. You have {balance}.
          </p>
          <a
            href="/dashboard/wallet"
            className="mt-1 rounded-lg bg-[var(--doost-bg-active)] px-4 py-2 text-[12px] font-medium text-white hover:opacity-90"
          >
            Add credits
          </a>
        </div>
      )
    );
  }

  return <>{children}</>;
}

/**
 * Inline credit check — returns whether the user can afford an action.
 * Use this for disabling buttons instead of blocking content.
 */
export function CreditCheck({
  cost,
  children,
}: {
  cost: number;
  children: (canAfford: boolean, balance: number) => React.ReactNode;
}) {
  const { balance, isLoading } = useCredits();
  return <>{children(!isLoading && balance >= cost, balance)}</>;
}
