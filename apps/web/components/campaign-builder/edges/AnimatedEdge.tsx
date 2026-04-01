"use client";

import { BaseEdge, type EdgeProps,getSmoothStepPath } from "@xyflow/react";

export function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 16,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke: "#3B82F6",
        strokeWidth: 2,
        strokeDasharray: "6 4",
        animation: "dashmove 0.5s linear infinite",
      }}
    />
  );
}
