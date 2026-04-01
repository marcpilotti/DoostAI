"use client";

import { Handle, type NodeProps,Position } from "@xyflow/react";
import { Calendar, Clock, DollarSign, Globe, Settings, TrendingUp, Zap } from "lucide-react";

import type { CampaignSettingsNodeData } from "@/lib/stores/campaign-builder";


const STATUS_STYLES = {
  draft: { bg: "bg-[var(--doost-bg-secondary)]", text: "text-[var(--doost-text-muted)]", label: "Draft" },
  ready: { bg: "bg-[var(--doost-bg-badge-ready)]", text: "text-[var(--doost-text-positive)]", label: "Ready" },
  live: { bg: "bg-[var(--doost-bg-badge-ready)]", text: "text-[var(--doost-text-positive)]", label: "Live" },
  paused: { bg: "bg-[var(--doost-bg-badge-review)]", text: "text-[#E65100]", label: "Paused" },
};

function SettingRow({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <Icon className="h-3 w-3 shrink-0 text-[var(--doost-text-muted)]" />
      <span className="text-[11px] text-[var(--doost-text)]">{label}</span>
    </div>
  );
}

export function CampaignSettingsNode({ data, selected }: NodeProps) {
  const d = data as CampaignSettingsNodeData;
  const status = STATUS_STYLES[d.status ?? "draft"];

  return (
    <div className={`w-[220px] rounded-2xl bg-[var(--doost-bg)] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] ${selected ? "ring-2 ring-blue-500" : ""}`} style={{ border: `1px solid var(--doost-border)` }}>
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-blue-500"
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: "var(--doost-border)" }}>
        <div className="flex items-center gap-2">
          <Settings className="h-3.5 w-3.5 text-[var(--doost-text-muted)]" />
          <span className="text-[12px] font-semibold text-[var(--doost-text)]">Campaign</span>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${status.bg} ${status.text}`}>
          {status.label}
        </span>
      </div>

      {/* Settings list */}
      <div className="px-3 py-2">
        <SettingRow icon={Globe} label={d.platform ?? "Meta"} />
        <SettingRow icon={Zap} label={d.campaignType ?? "Standard campaign"} />
        <SettingRow icon={Calendar} label={d.startDate ? new Date(d.startDate).toLocaleDateString("sv-SE") : "Not set"} />
        <SettingRow icon={Clock} label={d.schedule ?? "Always on"} />
        <SettingRow icon={TrendingUp} label={d.budgetOptimization ?? "Auto-optimized"} />
        <SettingRow icon={DollarSign} label={`~${d.dailyBudget ?? 0} ${d.currency ?? "SEK"} / day`} />
      </div>
    </div>
  );
}
