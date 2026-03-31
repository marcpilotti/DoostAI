"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Pencil } from "lucide-react";

import { useCampaignBuilderStore } from "@/lib/stores/campaign-builder";
import type { PromptNodeData } from "@/lib/stores/campaign-builder";

export function PromptNode({ id, data, selected }: NodeProps) {
  const d = data as PromptNodeData;
  const { updateNodeData } = useCampaignBuilderStore();

  return (
    <div className={`w-[260px] rounded-xl bg-[var(--doost-bg)] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] ${selected ? "ring-2 ring-blue-500" : ""}`} style={{ border: `1px solid var(--doost-border)` }}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: "var(--doost-border)" }}>
        <Pencil className="h-3.5 w-3.5 text-[var(--doost-text-muted)]" />
        <span className="text-[12px] font-semibold text-[var(--doost-text)]">Prompt</span>
      </div>

      {/* Body */}
      <div className="p-3">
        <textarea
          value={d.prompt ?? ""}
          onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
          placeholder="Describe the ad image you want to create..."
          rows={5}
          className="w-full resize-none rounded-lg bg-[var(--doost-bg-secondary)] px-2.5 py-2 text-[11px] leading-relaxed text-[var(--doost-text)] outline-none placeholder:text-[var(--doost-text-muted)] focus:ring-1 focus:ring-blue-300"
        />
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-blue-500"
      />
    </div>
  );
}
