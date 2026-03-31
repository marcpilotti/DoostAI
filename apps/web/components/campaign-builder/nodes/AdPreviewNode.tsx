"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Eye, Globe, Heart, MessageCircle, Send, Share2 } from "lucide-react";

import { useCampaignBuilderStore } from "@/lib/stores/campaign-builder";
import type { AdPreviewNodeData } from "@/lib/stores/campaign-builder";

const PLATFORMS = [
  { id: "instagram", label: "IG", icon: "📷" },
  { id: "facebook", label: "FB", icon: "📘" },
  { id: "google", label: "G", icon: "🔍" },
  { id: "snapchat", label: "SC", icon: "👻" },
  { id: "linkedin", label: "LI", icon: "💼" },
] as const;

export function AdPreviewNode({ id, data, selected }: NodeProps) {
  const d = data as AdPreviewNodeData;
  const { updateNodeData } = useCampaignBuilderStore();

  return (
    <div className={`w-[260px] rounded-xl bg-[var(--doost-bg)] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] ${selected ? "ring-2 ring-blue-500" : ""}`} style={{ border: `1px solid var(--doost-border)` }}>
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-blue-500"
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: "var(--doost-border)" }}>
        <div className="flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 text-[var(--doost-text-muted)]" />
          <span className="text-[12px] font-semibold text-[var(--doost-text)]">Ad Preview</span>
        </div>
      </div>

      {/* Platform tabs */}
      <div className="flex gap-0.5 border-b px-3 py-1.5" style={{ borderColor: "var(--doost-border)" }}>
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            onClick={() => updateNodeData(id, { platform: p.id })}
            className={`flex-1 rounded py-1 text-center text-[10px] font-medium transition-colors ${d.platform === p.id ? "bg-[var(--doost-bg-active)] text-white" : "text-[var(--doost-text-muted)] hover:bg-[var(--doost-bg-secondary)]"}`}
          >
            {p.icon}
          </button>
        ))}
      </div>

      {/* Mockup */}
      <div className="p-3">
        <div className="overflow-hidden rounded-lg" style={{ border: `1px solid var(--doost-border)` }}>
          {/* Brand header */}
          <div className="flex items-center gap-2 px-2.5 py-1.5">
            <div className="h-5 w-5 rounded-full bg-[var(--doost-bg-active)]" />
            <div>
              <div className="text-[9px] font-semibold text-[var(--doost-text)]">{d.brandName || "Brand"}</div>
              <div className="text-[7px] text-[var(--doost-text-muted)]">Sponsored</div>
            </div>
          </div>

          {/* Image placeholder */}
          {d.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.imageUrl} alt="Ad" className="aspect-square w-full object-cover" />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center bg-[var(--doost-bg-secondary)]">
              <span className="text-[10px] text-[var(--doost-text-muted)]">Creative image</span>
            </div>
          )}

          {/* CTA */}
          <div className="flex items-center justify-between border-t px-2.5 py-1.5" style={{ borderColor: "var(--doost-border)" }}>
            <span className="text-[8px] font-medium text-blue-600">{d.cta || "Shop Now"}</span>
            <span className="text-[8px] text-blue-600">→</span>
          </div>

          {/* Engagement */}
          <div className="flex items-center gap-3 px-2.5 py-1.5 text-[var(--doost-text-muted)]">
            <Heart className="h-3 w-3" />
            <MessageCircle className="h-3 w-3" />
            <Send className="h-3 w-3" />
          </div>
        </div>

        {/* Caption */}
        <div className="mt-2">
          <textarea
            value={d.bodyText ?? ""}
            onChange={(e) => updateNodeData(id, { bodyText: e.target.value })}
            placeholder="Ad copy text..."
            rows={2}
            className="w-full resize-none bg-transparent text-[10px] leading-relaxed text-[var(--doost-text-secondary)] outline-none placeholder:text-[var(--doost-text-muted)]"
          />
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-blue-500"
      />
    </div>
  );
}
