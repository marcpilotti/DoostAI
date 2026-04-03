"use client";

import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";

type BeforeAfterSplitProps = {
  websiteUrl: string;
  adContent: React.ReactNode;
};

export function BeforeAfterSplit({ websiteUrl, adContent }: BeforeAfterSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(50);
  const [dragging, setDragging] = useState(false);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setSplit(Math.max(10, Math.min(90, pct)));
    },
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="flex flex-col gap-2"
    >
      <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
        Transformation
      </span>

      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ height: 220, borderRadius: 14, cursor: "ew-resize" }}
        onMouseDown={() => setDragging(true)}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onMouseMove={(e) => dragging && handleMove(e.clientX)}
        onTouchMove={(e) => handleMove(e.touches[0]?.clientX ?? 0)}
      >
        {/* Before — website screenshot (iframe fallback to URL display) */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
          <div className="flex h-full w-full flex-col items-center justify-center" style={{ background: "#f5f5f5" }}>
            <div className="mb-2 flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: "#e0e0e0" }}>
              <div className="h-2 w-2 rounded-full" style={{ background: "#ccc" }} />
              <span className="text-[9px] font-mono" style={{ color: "#888" }}>{websiteUrl}</span>
            </div>
            <div className="flex flex-col gap-1 px-8">
              <div className="h-3 w-32 rounded" style={{ background: "#ddd" }} />
              <div className="h-2 w-48 rounded" style={{ background: "#e8e8e8" }} />
              <div className="h-2 w-40 rounded" style={{ background: "#e8e8e8" }} />
              <div className="mt-1 h-16 w-full rounded" style={{ background: "#eee" }} />
            </div>
            <span className="mt-3 text-[10px] font-medium" style={{ color: "#999" }}>Före</span>
          </div>
        </div>

        {/* After — the ad */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
          <div className="flex h-full w-full items-center justify-center p-4" style={{ background: "var(--color-bg-base)" }}>
            <div className="h-full w-full overflow-hidden" style={{ borderRadius: 10 }}>
              {adContent}
            </div>
          </div>
          <div className="absolute bottom-3 right-3">
            <span className="text-[10px] font-medium" style={{ color: "var(--color-text-muted)" }}>Efter</span>
          </div>
        </div>

        {/* Divider */}
        <div
          className="absolute top-0 bottom-0 z-10"
          style={{ left: `${split}%`, transform: "translateX(-50%)" }}
        >
          <div className="flex h-full w-6 items-center justify-center">
            <div className="h-full w-0.5" style={{ background: "var(--color-primary)" }} />
            <div
              className="absolute flex h-8 w-8 items-center justify-center rounded-full"
              style={{
                background: "var(--color-primary)",
                boxShadow: "0 0 12px var(--color-primary-glow)",
              }}
            >
              <span className="text-[12px] text-white">⟷</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-[11px]" style={{ color: "var(--color-text-muted)" }}>
        Från hemsida till kampanjklar annons på 2 minuter
      </p>
    </motion.div>
  );
}
