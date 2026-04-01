"use client";

import { AnimatePresence,motion } from "framer-motion";
import { Eye, ImageIcon, Pencil, Settings, Trash2,X } from "lucide-react";

import { getAvailableModels } from "@/lib/providers/model-router";
import type {
  AdPreviewNodeData,
  CampaignSettingsNodeData,
  CreativeNodeData,
  PromptNodeData,
} from "@/lib/stores/campaign-builder";
import { useCampaignBuilderStore } from "@/lib/stores/campaign-builder";

const NODE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  prompt: Pencil,
  creative: ImageIcon,
  adPreview: Eye,
  campaignSettings: Settings,
};

const NODE_LABELS: Record<string, string> = {
  prompt: "Prompt",
  creative: "Creative",
  adPreview: "Ad Preview",
  campaignSettings: "Campaign Settings",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-[11px] font-medium text-[var(--doost-text-muted)]">{children}</label>;
}

function FieldInput({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg bg-[var(--doost-bg-secondary)] px-3 py-2 text-[12px] text-[var(--doost-text)] outline-none focus:ring-1 focus:ring-blue-300"
    />
  );
}

function FieldTextarea({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-none rounded-lg bg-[var(--doost-bg-secondary)] px-3 py-2 text-[12px] leading-relaxed text-[var(--doost-text)] outline-none focus:ring-1 focus:ring-blue-300"
    />
  );
}

function FieldSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string; disabled?: boolean }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none rounded-lg bg-[var(--doost-bg-secondary)] px-3 py-2 text-[12px] text-[var(--doost-text)] outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
      ))}
    </select>
  );
}

// ── Prompt editor ────────────────────────────────────────────────

function PromptProperties({ id, data }: { id: string; data: PromptNodeData }) {
  const { updateNodeData } = useCampaignBuilderStore();
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>AI Image Prompt</FieldLabel>
        <FieldTextarea value={data.prompt ?? ""} onChange={(v) => updateNodeData(id, { prompt: v })} placeholder="Describe the ad image..." rows={8} />
      </div>
    </div>
  );
}

// ── Creative editor ──────────────────────────────────────────────

function CreativeProperties({ id, data }: { id: string; data: CreativeNodeData }) {
  const { updateNodeData } = useCampaignBuilderStore();
  const models = getAvailableModels("growth");

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>AI Model</FieldLabel>
        <FieldSelect
          value={data.model ?? "flux_schnell"}
          onChange={(v) => updateNodeData(id, { model: v })}
          options={models.map((m) => ({ value: m.id, label: `${m.label} (${m.cost} cr)`, disabled: !m.available }))}
        />
      </div>
      <div>
        <FieldLabel>Format</FieldLabel>
        <div className="flex gap-1.5">
          {(["1:1", "4:5", "9:16", "16:9"] as const).map((f) => (
            <button
              key={f}
              onClick={() => updateNodeData(id, { format: f })}
              className={`flex-1 rounded-lg py-2 text-center text-[11px] font-medium ${data.format === f ? "bg-[var(--doost-bg-active)] text-white" : "bg-[var(--doost-bg-secondary)] text-[var(--doost-text-secondary)]"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <button className="w-full rounded-lg bg-blue-500 py-2 text-[12px] font-medium text-white hover:bg-blue-600">
        Generate image
      </button>
    </div>
  );
}

// ── Ad Preview editor ────────────────────────────────────────────

function AdPreviewProperties({ id, data }: { id: string; data: AdPreviewNodeData }) {
  const { updateNodeData } = useCampaignBuilderStore();

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Platform</FieldLabel>
        <FieldSelect
          value={data.platform ?? "instagram"}
          onChange={(v) => updateNodeData(id, { platform: v })}
          options={[
            { value: "instagram", label: "Instagram" },
            { value: "facebook", label: "Facebook" },
            { value: "google", label: "Google" },
            { value: "snapchat", label: "Snapchat" },
            { value: "linkedin", label: "LinkedIn" },
          ]}
        />
      </div>
      <div>
        <FieldLabel>Brand name</FieldLabel>
        <FieldInput value={data.brandName ?? ""} onChange={(v) => updateNodeData(id, { brandName: v })} placeholder="Your brand" />
      </div>
      <div>
        <FieldLabel>Headline</FieldLabel>
        <FieldInput value={data.headline ?? ""} onChange={(v) => updateNodeData(id, { headline: v })} placeholder="Ad headline" />
      </div>
      <div>
        <FieldLabel>Body text</FieldLabel>
        <FieldTextarea value={data.bodyText ?? ""} onChange={(v) => updateNodeData(id, { bodyText: v })} placeholder="Ad copy..." rows={3} />
      </div>
      <div>
        <FieldLabel>Call to action</FieldLabel>
        <FieldSelect
          value={data.cta ?? "Shop Now"}
          onChange={(v) => updateNodeData(id, { cta: v })}
          options={[
            { value: "Shop Now", label: "Shop Now" },
            { value: "Learn More", label: "Learn More" },
            { value: "Sign Up", label: "Sign Up" },
            { value: "Book Now", label: "Book Now" },
            { value: "Contact Us", label: "Contact Us" },
            { value: "Download", label: "Download" },
          ]}
        />
      </div>
    </div>
  );
}

// ── Campaign Settings editor ─────────────────────────────────────

function CampaignSettingsProperties({ id, data }: { id: string; data: CampaignSettingsNodeData }) {
  const { updateNodeData } = useCampaignBuilderStore();

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Platform</FieldLabel>
        <FieldSelect value={data.platform ?? "Meta"} onChange={(v) => updateNodeData(id, { platform: v })} options={[
          { value: "Meta", label: "Meta (Facebook + Instagram)" },
          { value: "Google", label: "Google Ads" },
          { value: "Snapchat", label: "Snapchat Ads" },
          { value: "LinkedIn", label: "LinkedIn Ads" },
        ]} />
      </div>
      <div>
        <FieldLabel>Campaign type</FieldLabel>
        <FieldSelect value={data.campaignType ?? "Standard campaign"} onChange={(v) => updateNodeData(id, { campaignType: v })} options={[
          { value: "Standard campaign", label: "Standard campaign" },
          { value: "Advantage+", label: "Advantage+ (automated)" },
          { value: "Reach", label: "Reach campaign" },
          { value: "Conversions", label: "Conversions" },
        ]} />
      </div>
      <div>
        <FieldLabel>Start date</FieldLabel>
        <FieldInput type="datetime-local" value={data.startDate ?? ""} onChange={(v) => updateNodeData(id, { startDate: v })} />
      </div>
      <div>
        <FieldLabel>Schedule</FieldLabel>
        <FieldSelect value={data.schedule ?? "Always on"} onChange={(v) => updateNodeData(id, { schedule: v })} options={[
          { value: "Always on", label: "Always on" },
          { value: "2 weeks", label: "2 weeks" },
          { value: "1 month", label: "1 month" },
          { value: "Custom", label: "Custom end date" },
        ]} />
      </div>
      <div>
        <FieldLabel>Daily budget (SEK)</FieldLabel>
        <FieldInput type="number" value={String(data.dailyBudget ?? 150)} onChange={(v) => updateNodeData(id, { dailyBudget: Number(v) })} />
      </div>
      <div>
        <FieldLabel>Status</FieldLabel>
        <FieldSelect value={data.status ?? "draft"} onChange={(v) => updateNodeData(id, { status: v as CampaignSettingsNodeData["status"] })} options={[
          { value: "draft", label: "Draft" },
          { value: "ready", label: "Ready" },
        ]} />
      </div>
    </div>
  );
}

// ── Main Panel ───────────────────────────────────────────────────

export function NodePropertiesPanel() {
  const { nodes, selectedNodeId, selectNode, removeNode } = useCampaignBuilderStore();
  const node = nodes.find((n) => n.id === selectedNodeId);

  const Icon = node ? NODE_ICONS[node.type ?? ""] ?? Settings : Settings;
  const label = node ? NODE_LABELS[node.type ?? ""] ?? "Node" : "Node";

  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 300, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 overflow-hidden border-l bg-[var(--doost-bg)]"
          style={{ borderColor: "var(--doost-border)" }}
        >
          <div className="flex h-full w-[300px] flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--doost-border)" }}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[var(--doost-text-muted)]" />
                <span className="text-[13px] font-semibold text-[var(--doost-text)]">{label}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { removeNode(node.id); selectNode(null); }}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--doost-text-muted)] hover:bg-red-50 hover:text-red-500"
                  title="Delete node"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => selectNode(null)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--doost-text-muted)] hover:bg-[var(--doost-bg-secondary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {node.type === "prompt" && <PromptProperties id={node.id} data={node.data as PromptNodeData} />}
              {node.type === "creative" && <CreativeProperties id={node.id} data={node.data as CreativeNodeData} />}
              {node.type === "adPreview" && <AdPreviewProperties id={node.id} data={node.data as AdPreviewNodeData} />}
              {node.type === "campaignSettings" && <CampaignSettingsProperties id={node.id} data={node.data as CampaignSettingsNodeData} />}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
