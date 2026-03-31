"use client";

import { useCallback } from "react";
import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";

import { useCampaignBuilderStore } from "@/lib/stores/campaign-builder";

const NODE_WIDTH = 280;
const NODE_HEIGHT = 350;

/**
 * Auto-layout nodes left→right using dagre.
 */
export function useAutoLayout() {
  const { nodes, edges, setNodes } = useCampaignBuilderStore();

  const autoLayout = useCallback(() => {
    if (nodes.length === 0) return;

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: "LR", nodesep: 60, ranksep: 120 });

    nodes.forEach((node) => {
      g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    const layouted = nodes.map((node) => {
      const pos = g.node(node.id);
      return {
        ...node,
        position: {
          x: pos.x - NODE_WIDTH / 2,
          y: pos.y - NODE_HEIGHT / 2,
        },
      };
    });

    setNodes(layouted);
  }, [nodes, edges, setNodes]);

  return { autoLayout };
}
