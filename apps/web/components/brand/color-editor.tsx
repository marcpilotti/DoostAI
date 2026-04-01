"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  primary: "Primär",
  secondary: "Sekundär",
  accent: "Accent",
  background: "Bakgrund",
  text: "Text",
};

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return [parseInt(m[1]!, 16), parseInt(m[2]!, 16), parseInt(m[3]!, 16)];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs! + 0.7152 * gs! + 0.0722 * bs!;
}

function contrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 21;
  const l1 = relativeLuminance(...rgb1);
  const l2 = relativeLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function isValidHex(s: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(s);
}

interface ColorEditorProps {
  role: string;
  currentColor: string;
  originalColor: string;
  onColorChange: (newColor: string) => void;
  onClose: () => void;
}

export function ColorEditor({
  role,
  currentColor,
  originalColor,
  onColorChange,
  onClose,
}: ColorEditorProps) {
  const [hex, setHex] = useState(currentColor);
  const [pickerColor, setPickerColor] = useState(currentColor);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isModified = hex.toLowerCase() !== originalColor.toLowerCase();
  const whiteContrast = contrastRatio(hex, "#ffffff");
  const darkContrast = contrastRatio(hex, "#1a1a1a");
  const lowContrast = whiteContrast < 4.5 && darkContrast < 4.5;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  function updateColor(newHex: string) {
    const clean = newHex.startsWith("#") ? newHex : `#${newHex}`;
    setHex(clean);
    setPickerColor(clean);
    if (isValidHex(clean)) {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onColorChange(clean);
      }, 300);
    }
  }

  return (
    <div
      ref={popoverRef}
      className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-border/60 bg-white p-3 shadow-lg"
    >
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {ROLE_LABELS[role] ?? role}
      </div>

      {/* Color picker + hex input */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={pickerColor}
          onChange={(e) => updateColor(e.target.value)}
          className="h-9 w-9 cursor-pointer rounded-lg border border-border/40"
        />
        <input
          type="text"
          value={hex}
          onChange={(e) => {
            const val = e.target.value.replace(/[^#0-9a-fA-F]/g, "");
            const clean = val.startsWith("#") ? val.slice(0, 7) : `#${val}`.slice(0, 7);
            updateColor(clean);
          }}
          maxLength={7}
          className={`flex-1 rounded-lg border px-2 py-1.5 font-mono text-xs outline-none focus:ring-1 ${
            hex.length === 7 && !isValidHex(hex)
              ? "border-[var(--color-error,#DC2626)] focus:border-[var(--color-error,#DC2626)] focus:ring-red-100"
              : "border-border/40 focus:border-indigo-300 focus:ring-indigo-100"
          }`}
          placeholder="#000000"
        />
      </div>

      {/* Preview: old → new */}
      {isModified && (
        <div className="mt-2 flex items-center gap-2">
          <div
            className="h-6 w-6 rounded-md border border-black/5"
            style={{ backgroundColor: originalColor }}
          />
          <span className="text-muted-foreground/40">→</span>
          <div
            className="h-6 w-6 rounded-md border border-black/5"
            style={{ backgroundColor: hex }}
          />
          <button
            onClick={() => updateColor(originalColor)}
            className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Återställ
          </button>
        </div>
      )}

      {/* Contrast warning */}
      {lowContrast && isValidHex(hex) && (
        <div className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-[10px] text-amber-700">
          Låg kontrast — kan vara svårläst mot vit eller mörk bakgrund
        </div>
      )}
    </div>
  );
}
