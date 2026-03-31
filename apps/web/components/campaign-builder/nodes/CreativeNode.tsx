"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ImageIcon, RefreshCw } from "lucide-react";

import { useCampaignBuilderStore } from "@/lib/stores/campaign-builder";
import type { CreativeNodeData } from "@/lib/stores/campaign-builder";
import { getAvailableModels } from "@/lib/providers/model-router";

const FORMATS = [
  { id: "1:1", label: "□" },
  { id: "4:5", label: "▯" },
  { id: "9:16", label: "▮" },
] as const;

export function CreativeNode({ id, data, selected }: NodeProps) {
  const d = data as CreativeNodeData;
  const { updateNodeData } = useCampaignBuilderStore();
  const models = getAvailableModels("growth");
  const currentModel = models.find((m) => m.id === d.model);

  return (
    <div className={`w-[280px] rounded-2xl bg-[var(--doost-bg)] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] ${selected ? "ring-2 ring-blue-500" : ""}`} style={{ border: `1px solid var(--doost-border)` }}>
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-blue-500"
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: "var(--doost-border)" }}>
        <div className="flex items-center gap-2">
          <ImageIcon className="h-3.5 w-3.5 text-[var(--doost-text-muted)]" />
          <span className="text-[12px] font-semibold text-[var(--doost-text)]">Creative</span>
        </div>
        {/* Format selector */}
        <div className="flex gap-0.5">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => updateNodeData(id, { format: f.id })}
              className={`flex h-6 w-6 items-center justify-center rounded text-[10px] ${d.format === f.id ? "bg-[var(--doost-bg-active)] text-white" : "text-[var(--doost-text-muted)] hover:bg-[var(--doost-bg-secondary)]"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Image area */}
      <div className="p-3">
        {d.imageUrl ? (
          <div className="group relative overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.imageUrl} alt="Creative" className="w-full rounded-lg object-cover" style={{ aspectRatio: d.format?.replace(":", "/") ?? "4/5" }} />
            <button className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-lg bg-[var(--doost-bg-secondary)]" style={{ aspectRatio: d.format?.replace(":", "/") ?? "4/5" }}>
            {d.isGenerating ? (
              <div className="flex flex-col items-center gap-1.5">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--doost-text-muted)] border-t-[var(--doost-text)]" />
                <span className="text-[10px] text-[var(--doost-text-muted)]">Generating...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-[var(--doost-text-muted)]">
                <ImageIcon className="h-6 w-6 opacity-30" />
                <span className="text-[10px]">Connect a prompt to generate</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Model badge */}
      <div className="flex items-center gap-1.5 border-t px-3 py-2" style={{ borderColor: "var(--doost-border)" }}>
        <span className="text-[10px] text-[var(--doost-text-muted)]">🤖</span>
        <select
          value={d.model ?? "flux_schnell"}
          onChange={(e) => updateNodeData(id, { model: e.target.value })}
          className="flex-1 appearance-none bg-transparent text-[10px] font-medium text-[var(--doost-text-secondary)] outline-none"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id} disabled={!m.available}>
              {m.label} ({m.cost} cr)
            </option>
          ))}
        </select>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-blue-500"
      />
    </div>
  );
}
