"use client";

import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useCampaignBuilderStore } from "@/lib/stores/campaign-builder";
import { PromptNode } from "./nodes/PromptNode";
import { CreativeNode } from "./nodes/CreativeNode";
import { AdPreviewNode } from "./nodes/AdPreviewNode";
import { CampaignSettingsNode } from "./nodes/CampaignSettingsNode";
import { AnimatedEdge } from "./edges/AnimatedEdge";
import { BuilderTopBar } from "./BuilderTopBar";
import { BuilderBottomBar } from "./BuilderBottomBar";

// ── Node + Edge type registries ──────────────────────────────────

const nodeTypes = {
  prompt: PromptNode,
  creative: CreativeNode,
  adPreview: AdPreviewNode,
  campaignSettings: CampaignSettingsNode,
};

const edgeTypes = {
  animated: AnimatedEdge,
};

// ── Canvas ───────────────────────────────────────────────────────

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

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => selectNode(node.id),
    [selectNode],
  );

  const onPaneClick = useCallback(() => selectNode(null), [selectNode]);

  return (
    <div className="flex h-full flex-col">
      <BuilderTopBar onExecute={() => { /* Phase 5 */ }} />

      <div className="flex-1 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
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
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="var(--doost-border)"
          />
        </ReactFlow>
      </div>

      <BuilderBottomBar />
    </div>
  );
}
