"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";

import { transitions } from "@/lib/motion";

type CreativePlaygroundProps = {
  headlines: string[];
  currentHeadline: string;
  onHeadlineChange: (h: string) => void;
  primaryColor: string;
  onColorChange: (color: string) => void;
  onNaturalLanguageEdit: (instruction: string) => void;
};

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function CreativePlayground({
  headlines,
  currentHeadline,
  onHeadlineChange,
  primaryColor,
  onColorChange,
  onNaturalLanguageEdit,
}: CreativePlaygroundProps) {
  const [nlInput, setNlInput] = useState("");
  const currentIndex = headlines.indexOf(currentHeadline);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;

  const palettes = useMemo(() => {
    const safeHex = primaryColor.startsWith("#") && primaryColor.length >= 7
      ? primaryColor
      : "#6366f1";
    const [h, s, l] = hexToHsl(safeHex);
    return [
      { label: "Original", color: safeHex },
      { label: "Komplement", color: hslToHex((h + 180) % 360, s, l) },
      { label: "Analog", color: hslToHex((h + 30) % 360, s, l) },
    ];
  }, [primaryColor]);

  const cycleHeadline = useCallback(
    (dir: 1 | -1) => {
      if (headlines.length === 0) return;
      const next = (safeIndex + dir + headlines.length) % headlines.length;
      const value = headlines[next];
      if (value !== undefined) onHeadlineChange(value);
    },
    [headlines, safeIndex, onHeadlineChange],
  );

  const handleNlSubmit = useCallback(() => {
    const trimmed = nlInput.trim();
    if (!trimmed) return;
    onNaturalLanguageEdit(trimmed);
    setNlInput("");
  }, [nlInput, onNaturalLanguageEdit]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={transitions.spring}
      className="flex flex-col gap-3 rounded-xl p-3"
      style={{
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-default)",
      }}
    >
      {/* Section: Headlines */}
      <div className="flex flex-col gap-1.5">
        <span
          className="text-[9px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--color-text-muted)" }}
        >
          Rubrik
        </span>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => cycleHeadline(-1)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={transitions.snappy}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[11px]"
            style={{
              background: "var(--color-bg-raised)",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-border-subtle)",
            }}
            aria-label="Föregående rubrik"
          >
            ‹
          </motion.button>
          <AnimatePresence mode="wait">
            <motion.p
              key={safeIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="min-h-[2rem] flex-1 text-[12px] font-medium leading-snug"
              style={{ color: "var(--color-text-primary)" }}
            >
              {headlines[safeIndex] || currentHeadline}
            </motion.p>
          </AnimatePresence>
          <motion.button
            onClick={() => cycleHeadline(1)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={transitions.snappy}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[11px]"
            style={{
              background: "var(--color-bg-raised)",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-border-subtle)",
            }}
            aria-label="Nästa rubrik"
          >
            ›
          </motion.button>
        </div>
        <span
          className="text-center text-[9px]"
          style={{ color: "var(--color-text-muted)" }}
        >
          {safeIndex + 1} / {headlines.length}
        </span>
      </div>

      {/* Section: Color palettes */}
      <div className="flex flex-col gap-1.5">
        <span
          className="text-[9px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--color-text-muted)" }}
        >
          Färgpalett
        </span>
        <div className="flex gap-2">
          {palettes.map((p) => {
            const isActive =
              primaryColor.toLowerCase() === p.color.toLowerCase();
            return (
              <motion.button
                key={p.label}
                onClick={() => onColorChange(p.color)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={transitions.snappy}
                className="flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5"
                style={{
                  background: isActive
                    ? "rgba(99,102,241,0.1)"
                    : "var(--color-bg-raised)",
                  border: isActive
                    ? "1px solid rgba(99,102,241,0.3)"
                    : "1px solid var(--color-border-subtle)",
                }}
              >
                <div
                  className="h-5 w-5 rounded-full"
                  style={{
                    background: p.color,
                    boxShadow: isActive
                      ? `0 0 0 2px var(--color-bg-elevated), 0 0 0 3px ${p.color}`
                      : "none",
                  }}
                />
                <span
                  className="text-[8px] font-medium"
                  style={{
                    color: isActive
                      ? "var(--color-primary-light)"
                      : "var(--color-text-muted)",
                  }}
                >
                  {p.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Section: Natural language input */}
      <div className="flex flex-col gap-1">
        <span
          className="text-[9px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--color-text-muted)" }}
        >
          Fritext
        </span>
        <div
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5"
          style={{
            background: "var(--color-bg-raised)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          <input
            type="text"
            value={nlInput}
            onChange={(e) => setNlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNlSubmit();
            }}
            placeholder="Beskriv en ändring..."
            className="min-w-0 flex-1 bg-transparent text-[11px] outline-none"
            style={{
              color: "var(--color-text-primary)",
            }}
          />
          <motion.button
            onClick={handleNlSubmit}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={transitions.snappy}
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[10px]"
            style={{
              background: nlInput.trim()
                ? "var(--color-primary-light)"
                : "var(--color-bg-raised)",
              color: nlInput.trim() ? "#fff" : "var(--color-text-muted)",
            }}
            aria-label="Skicka ändring"
          >
            ↑
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
