"use client";

import { motion } from "motion/react";

type SmartCropPreviewProps = {
  adContent: React.ReactNode;
};

const FORMATS = [
  { label: "Feed", ratio: "1/1", width: 80 },
  { label: "Story", ratio: "9/16", width: 50 },
  { label: "Banner", ratio: "728/90", width: 120 },
  { label: "Sidebar", ratio: "300/250", width: 60 },
  { label: "Reels", ratio: "9/16", width: 50 },
];

export function SmartCropPreview({ adContent }: SmartCropPreviewProps) {
  return (
    <div className="flex items-end gap-2 overflow-x-auto py-2 no-scrollbar">
      {FORMATS.map((fmt, i) => (
        <motion.div
          key={fmt.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, type: "spring", damping: 25, stiffness: 200 }}
          className="flex flex-shrink-0 flex-col items-center gap-1"
        >
          <div
            className="overflow-hidden"
            style={{
              width: fmt.width,
              aspectRatio: fmt.ratio,
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="h-full w-full" style={{ transform: "scale(0.3)", transformOrigin: "top left", width: "333%", height: "333%" }}>
              {adContent}
            </div>
          </div>
          <span className="text-[9px] font-medium" style={{ color: "var(--color-text-muted)" }}>
            {fmt.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
