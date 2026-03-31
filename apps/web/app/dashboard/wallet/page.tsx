"use client";

import { ArrowDown, ArrowUp, Plus, Sparkles } from "lucide-react";
import { MOCK_TRANSACTIONS } from "@/lib/mock-data";

export default function WalletPage() {
  const balance = 2496;
  const maxCredits = 2500;

  return (
    <div className="p-6">
      <h2 className="mb-6 text-[18px] font-semibold text-[var(--doost-text)]">Wallet</h2>

      {/* Balance card */}
      <div className="mb-6 rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] p-6" style={{ border: `1px solid var(--doost-border)` }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12px] text-[var(--doost-text-muted)]">Credit balance</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-[32px] font-bold text-[var(--doost-text)]">{balance.toLocaleString()}</span>
              <span className="text-[14px] text-[var(--doost-text-muted)]">/ {maxCredits.toLocaleString()}</span>
            </div>
            <div className="mt-2 h-2 w-64 overflow-hidden rounded-full bg-[var(--doost-border)]">
              <div className="h-full rounded-full bg-[var(--doost-bg-active)]" style={{ width: `${(balance / maxCredits) * 100}%` }} />
            </div>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg bg-[var(--doost-bg-active)] px-4 py-2.5 text-[13px] font-medium text-white hover:opacity-90">
            <Plus className="h-4 w-4" /> Add credits
          </button>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[12px] text-[var(--doost-text-muted)]">
          <Sparkles className="h-3 w-3" />
          Growth plan — 2,500 credits/month. Refills Mar 1.
        </div>
      </div>

      {/* Transaction history */}
      <h3 className="mb-3 text-[14px] font-semibold text-[var(--doost-text)]">Transaction history</h3>
      <div className="overflow-hidden rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)]" style={{ border: `1px solid var(--doost-border)` }}>
        {MOCK_TRANSACTIONS.map((t) => (
          <div key={t.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-0" style={{ borderColor: "var(--doost-border)" }}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${t.amount > 0 ? "bg-[var(--doost-bg-badge-ready)]" : "bg-[var(--doost-bg-secondary)]"}`}>
              {t.amount > 0 ? <ArrowDown className="h-3.5 w-3.5 text-[var(--doost-text-positive)]" /> : <ArrowUp className="h-3.5 w-3.5 text-[var(--doost-text-secondary)]" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-[var(--doost-text)]">{t.description}</div>
              <div className="text-[11px] text-[var(--doost-text-muted)]">{t.createdAt}</div>
            </div>
            <div className={`text-[14px] font-semibold ${t.amount > 0 ? "text-[var(--doost-text-positive)]" : "text-[var(--doost-text)]"}`}>
              {t.amount > 0 ? "+" : ""}{t.amount}
            </div>
            <div className="text-[12px] text-[var(--doost-text-muted)]">
              {t.balanceAfter.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
