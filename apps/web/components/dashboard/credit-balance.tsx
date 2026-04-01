"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Sparkles } from "lucide-react";

const REFRESH_INTERVAL_MS = 30_000;

export function useCredits(orgId: string = "demo") {
  const [balance, setBalance] = useState<number | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch(`/api/credits/balance?orgId=${orgId}`);
      const data = await res.json();
      setBalance(data.balance ?? 2500);
    } catch {
      setBalance((prev) => prev ?? 2500); // fallback
    }
  }, [orgId]);

  return { balance, fetchBalance };
}

export function refreshCredits(orgId: string = "demo") {
  // Standalone helper callable from outside the hook
  return fetch(`/api/credits/balance?orgId=${orgId}`)
    .then((r) => r.json())
    .then((d) => d.balance as number)
    .catch(() => null);
}

export function CreditBalance() {
  const { balance, fetchBalance } = useCredits("demo");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initial fetch + 30s polling
  useEffect(() => {
    fetchBalance();

    intervalRef.current = setInterval(() => {
      fetchBalance();
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchBalance]);

  if (balance === null) return null;

  const maxCredits = 2500; // plan max
  const pct = Math.min(100, (balance / maxCredits) * 100);
  const isLow = pct < 15;

  return (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between text-[11px]">
        <div className={`flex items-center gap-1 ${isLow ? "text-[var(--color-error,#DC2626)]" : "text-[var(--doost-text-muted)]"}`}>
          <Sparkles className="h-4 w-4" />
          Credits
        </div>
        <span className={`font-semibold ${isLow ? "text-[var(--color-error,#DC2626)]" : "text-[var(--doost-text)]"}`}>{balance.toLocaleString()}</span>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--doost-border)]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isLow ? "bg-[var(--color-error,#DC2626)]" : "bg-[var(--doost-bg-active)]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isLow && (
        <p className="mt-1 text-[10px] text-[var(--color-error,#DC2626)]">Få credits kvar</p>
      )}
    </div>
  );
}
