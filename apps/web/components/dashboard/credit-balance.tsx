"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export function CreditBalance() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/credits/balance?orgId=demo")
      .then((r) => r.json())
      .then((d) => setBalance(d.balance))
      .catch(() => setBalance(2500)); // fallback
  }, []);

  if (balance === null) return null;

  const maxCredits = 2500; // plan max
  const pct = Math.min(100, (balance / maxCredits) * 100);

  return (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1 text-[var(--doost-text-muted)]">
          <Sparkles className="h-3 w-3" />
          Credits
        </div>
        <span className="font-semibold text-[var(--doost-text)]">{balance.toLocaleString()}</span>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--doost-border)]">
        <div
          className="h-full rounded-full bg-[var(--doost-bg-active)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
