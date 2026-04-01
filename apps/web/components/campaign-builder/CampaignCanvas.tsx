"use client";

import "@xyflow/react/dist/style.css";

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  ReactFlow,
} from "@xyflow/react";
import { ArrowUp, Sparkles } from "lucide-react";
import { useCallback, useState } from "react";

import { useCampaignBuilderStore } from "@/lib/stores/campaign-builder";

import { AnimatedEdge } from "./edges/AnimatedEdge";
import { AdPreviewNode } from "./nodes/AdPreviewNode";
import { CampaignSettingsNode } from "./nodes/CampaignSettingsNode";
import { CreativeNode } from "./nodes/CreativeNode";
import { PromptNode } from "./nodes/PromptNode";

const nodeTypes = {
  prompt: PromptNode,
  creative: CreativeNode,
  adPreview: AdPreviewNode,
  campaignSettings: CampaignSettingsNode,
};

const edgeTypes = {
  animated: AnimatedEdge,
};

// ── Floating bottom chat bar ─────────────────────────────────────

function FloatingChatBar() {
  const [input, setInput] = useState("");

  return (
    <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
      <div className="flex w-full max-w-xl items-center gap-2 rounded-2xl bg-[var(--doost-bg)] px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.06)]" style={{ border: `1px solid var(--doost-border)` }}>
        <Sparkles className="h-4 w-4 shrink-0 text-[var(--doost-text-muted)]" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI to edit your campaign..."
          className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--doost-text)] outline-none placeholder:text-[var(--doost-text-muted)]"
          onKeyDown={async (e) => {
            if (e.key === "Enter" && input.trim()) {
              const msg = input.trim();
              setInput("");
              // Send to AI chat endpoint with canvas context
              try {
                await fetch("/api/ai/chat", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ messages: [{ role: "user", content: msg }], model: "claude-sonnet-4-6" }),
                });
              } catch { /* non-blocking */ }
            }
          }}
        />
        <button
          disabled={!input.trim()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--doost-bg-active)] text-white disabled:opacity-30"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main canvas ──────────────────────────────────────────────────

export function CampaignCanvas() {
  const { nodes, edges, setNodes, setEdges, selectNode } = useCampaignBuilderStore();

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes(applyNodeChanges(changes, nodes)),
    [nodes, setNodes],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges(applyEdgeChanges(changes, edges)),
    [edges, setEdges],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges(addEdge({ ...connection, type: "animated" }, edges)),
    [edges, setEdges],
  );

  return (
    <div className="relative h-full w-full">
      {/* Faint Doost logo watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/symbol.svg" alt="" className="h-24 w-24 opacity-[0.03]" />
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: "animated" }}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        snapToGrid
        snapGrid={[16, 16]}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--doost-border)" />
      </ReactFlow>

      <FloatingChatBar />
    </div>
  );
}
