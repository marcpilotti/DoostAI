import type { Edge,Node } from "@xyflow/react";
import { create } from "zustand";

// ── Node data types ──────────────────────────────────────────────

export type PromptNodeData = {
  label: string;
  prompt: string;
};

export type CreativeNodeData = {
  label: string;
  imageUrl: string | null;
  model: string;
  format: "1:1" | "4:5" | "9:16" | "16:9";
  isGenerating: boolean;
};

export type AdPreviewNodeData = {
  label: string;
  platform: "instagram" | "facebook" | "google" | "snapchat" | "linkedin";
  headline: string;
  bodyText: string;
  cta: string;
  brandName: string;
  imageUrl: string | null;
};

export type CampaignSettingsNodeData = {
  label: string;
  platform: string;
  campaignType: string;
  startDate: string;
  schedule: string;
  budgetOptimization: string;
  dailyBudget: number;
  currency: string;
  status: "draft" | "ready" | "live" | "paused";
};

export type BuilderNodeData =
  | PromptNodeData
  | CreativeNodeData
  | AdPreviewNodeData
  | CampaignSettingsNodeData;

// ── Store ────────────────────────────────────────────────────────

type CampaignBuilderState = {
  // Canvas
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;

  // Campaign meta
  campaignName: string;
  campaignId: string | null;

  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  removeNode: (id: string) => void;
  updateNodeData: (id: string, data: Partial<BuilderNodeData>) => void;
  selectNode: (id: string | null) => void;
  connect: (sourceId: string, targetId: string) => void;
  disconnect: (edgeId: string) => void;
  setCampaignName: (name: string) => void;
  reset: () => void;
  loadTemplate: (template: "blank" | "quick-ad" | "full-campaign") => void;
};

let nodeIdCounter = 0;
function nextId() { return `node_${++nodeIdCounter}`; }
function edgeId(s: string, t: string) { return `edge_${s}_${t}`; }

// ── Templates ────────────────────────────────────────────────────

function quickAdTemplate(): { nodes: Node[]; edges: Edge[] } {
  const promptId = nextId();
  const creativeId = nextId();
  const adId = nextId();
  const campaignId = nextId();

  return {
    nodes: [
      { id: promptId, type: "prompt", position: { x: 0, y: 100 }, data: { label: "Prompt", prompt: "" } },
      { id: creativeId, type: "creative", position: { x: 350, y: 80 }, data: { label: "Creative", imageUrl: null, model: "flux_schnell", format: "4:5", isGenerating: false } },
      { id: adId, type: "adPreview", position: { x: 700, y: 50 }, data: { label: "Ad Preview", platform: "instagram", headline: "", bodyText: "", cta: "Shop Now", brandName: "My Brand", imageUrl: null } },
      { id: campaignId, type: "campaignSettings", position: { x: 1050, y: 80 }, data: { label: "Campaign", platform: "Meta", campaignType: "Standard campaign", startDate: new Date().toISOString().slice(0, 16), schedule: "Always on", budgetOptimization: "Auto-optimized spend", dailyBudget: 150, currency: "SEK", status: "draft" } },
    ],
    edges: [
      { id: edgeId(promptId, creativeId), source: promptId, target: creativeId, type: "animated" },
      { id: edgeId(creativeId, adId), source: creativeId, target: adId, type: "animated" },
      { id: edgeId(adId, campaignId), source: adId, target: campaignId, type: "animated" },
    ],
  };
}

export const useCampaignBuilderStore = create<CampaignBuilderState>((set, _get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  campaignName: "New Campaign",
  campaignId: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),

  removeNode: (id) => set((s) => ({
    nodes: s.nodes.filter((n) => n.id !== id),
    edges: s.edges.filter((e) => e.source !== id && e.target !== id),
    selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
  })),

  updateNodeData: (id, data) => set((s) => ({
    nodes: s.nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, ...data } } : n,
    ),
  })),

  selectNode: (id) => set({ selectedNodeId: id }),

  connect: (sourceId, targetId) => set((s) => ({
    edges: [...s.edges, { id: edgeId(sourceId, targetId), source: sourceId, target: targetId, type: "animated" }],
  })),

  disconnect: (eid) => set((s) => ({
    edges: s.edges.filter((e) => e.id !== eid),
  })),

  setCampaignName: (name) => set({ campaignName: name }),

  reset: () => set({ nodes: [], edges: [], selectedNodeId: null, campaignName: "New Campaign", campaignId: null }),

  loadTemplate: (template) => {
    if (template === "quick-ad" || template === "full-campaign") {
      const t = quickAdTemplate();
      set({ nodes: t.nodes, edges: t.edges, selectedNodeId: null });
    } else {
      set({ nodes: [], edges: [], selectedNodeId: null });
    }
  },
}));
