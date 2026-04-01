"use client";

import { useReactFlow } from "@xyflow/react";
import { Maximize2,Minus, Plus } from "lucide-react";

export function BuilderBottomBar() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="flex h-10 shrink-0 items-center justify-between border-t bg-[var(--doost-bg)] px-4" style={{ borderColor: "var(--doost-border)" }}>
      {/* Left: spacer */}
      <div />

      {/* Center: zoom controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => zoomOut()}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--doost-text-muted)] hover:bg-[var(--doost-bg-secondary)]"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-12 text-center text-[11px] font-medium tabular-nums text-[var(--doost-text-muted)]">
          100%
        </span>
        <button
          onClick={() => zoomIn()}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--doost-text-muted)] hover:bg-[var(--doost-bg-secondary)]"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => fitView({ padding: 0.2 })}
          className="ml-1 flex h-7 w-7 items-center justify-center rounded-md text-[var(--doost-text-muted)] hover:bg-[var(--doost-bg-secondary)]"
          title="Fit to view"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Right: spacer */}
      <div />
    </div>
  );
}
