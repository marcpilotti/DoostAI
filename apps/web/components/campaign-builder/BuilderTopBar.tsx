"use client";

import { ArrowLeft, MessageSquare, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

import { useCampaignBuilderStore } from "@/lib/stores/campaign-builder";

export function BuilderTopBar({
  onExecute,
  onToggleAI,
  aiOpen,
}: {
  onExecute: () => void;
  onToggleAI: () => void;
  aiOpen: boolean;
}) {
  const { campaignName, setCampaignName } = useCampaignBuilderStore();

  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b bg-[var(--doost-bg)] px-4" style={{ borderColor: "var(--doost-border)" }}>
      {/* Left: back + breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/campaigns" className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--doost-text-muted)] hover:bg-[var(--doost-bg-secondary)]">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-1.5 text-[13px]">
          <Zap className="h-3.5 w-3.5 text-[var(--doost-text-muted)]" />
          <Link href="/dashboard/campaigns" className="text-[var(--doost-text-muted)] hover:text-[var(--doost-text)]">Campaigns</Link>
          <span className="text-[var(--doost-text-muted)]">/</span>
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            className="bg-transparent font-semibold text-[var(--doost-text)] outline-none"
            style={{ width: `${Math.max(campaignName.length, 10)}ch` }}
          />
        </div>
      </div>

      {/* Right: AI toggle + execute */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleAI}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
            aiOpen
              ? "bg-[var(--doost-bg-active)] text-white"
              : "text-[var(--doost-text-secondary)] hover:bg-[var(--doost-bg-secondary)]"
          }`}
          style={!aiOpen ? { border: `1px solid var(--doost-border)` } : undefined}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          AI
        </button>
        <button
          onClick={onExecute}
          className="flex items-center gap-2 rounded-lg bg-[var(--doost-bg-active)] px-4 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 active:scale-95"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Execute plan
        </button>
      </div>
    </div>
  );
}
