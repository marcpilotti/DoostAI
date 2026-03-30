"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Globe,
  Grid2x2,
  GripVertical,
  Maximize2,
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Share2,
  Sparkles,
  Send,
  ImagePlus,
  Wand2,
  Pencil,
  Type,
  Palette,
  Zap,
  RotateCcw,
  Repeat2,
  AlignCenter,
  Columns2,
  MinusSquare,
  MousePointerClick,
  X,
} from "lucide-react";
import { PLATFORM_LIMITS, validateCopyLimits } from "@doost/ai/platform-limits";
import type { PlatformId } from "@doost/ai/platform-limits";

type CopyData = {
  id?: string;
  platform: string;
  variant?: string;
  label?: string;
  headline: string;
  bodyCopy: string;
  cta: string;
  headlines?: string[];
  descriptions?: string[];
};

type ColorHarmonyPalette = {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
  shadow: string;
  ctaBackground: string;
  ctaText: string;
};

type ColorHarmonySet = {
  original: ColorHarmonyPalette;
  complementary: ColorHarmonyPalette;
  analogous: ColorHarmonyPalette;
  triadic: ColorHarmonyPalette;
};

type BrandData = {
  name: string;
  url: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts?: { heading: string; body: string };
  industry?: string;
  _colorHarmony?: ColorHarmonySet;
};

type VariantStrategy = {
  concept: string;
  hook: string;
  angle: string;
  emotionalTrigger: string;
};

type CopyPreviewData = {
  copies: CopyData[];
  platforms: string[];
  brand?: BrandData;
  renderingImages?: boolean;
  /** AI-generated or Unsplash background URL (data URL or https URL) */
  backgroundUrl?: string | null;
  /** Different background for variant B */
  backgroundUrlB?: string;
  /** Ad strategy — creative brief for each variant */
  strategy?: {
    variantA: VariantStrategy;
    variantB: VariantStrategy;
    recommendation: string;
  } | null;
};

type LogoPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

type AdFormat = "meta-feed" | "meta-story" | "google" | "linkedin";
type EditMode = null | "ai" | "manual";
type LayoutStyle = "centered" | "split" | "minimal" | "bold-cta";

type EditableField = "headline" | "bodyCopy" | "cta";

type ColorOverrideKey = "primary" | "accent" | "ctaBackground" | "textColor" | "gradientStart" | "gradientEnd";

type ColorOverrides = Partial<Record<ColorOverrideKey, string>>;

// Shared props for all preview components
type PreviewProps = {
  copy: CopyData;
  brand: BrandData;
  bgImage?: string;
  isSelected: boolean;
  isLoser: boolean;
  onPick: () => void;
  layout: LayoutStyle;
  onEditField?: (field: EditableField, value: string) => void;
  charLimits?: { headline: number; bodyCopy: number; cta: number };
  colorOverrides?: ColorOverrides;
  onColorChange?: (key: ColorOverrideKey, value: string) => void;
  harmonyPalette: ColorHarmonyPalette;
  logoPosition: LogoPosition;
  onLogoPositionChange: (pos: LogoPosition) => void;
  diffs?: string[];
};

// ── Character limit badge for inline editing ───────────────────
function CharCountBadge({
  current,
  max,
  visible,
}: {
  current: number;
  max: number;
  visible: boolean;
}) {
  if (!visible) return null;
  const isOver = current > max;
  const isNear = current > max * 0.85 && !isOver;

  return (
    <span
      className={`pointer-events-none absolute -top-5 right-0 z-20 rounded px-1.5 py-0.5 text-[9px] font-mono font-semibold shadow-sm transition-opacity ${
        isOver
          ? "bg-red-500 text-white"
          : isNear
            ? "bg-amber-100 text-amber-700 border border-amber-300"
            : "bg-gray-800/80 text-white"
      }`}
    >
      {current}/{max}
    </span>
  );
}

// ── Editable text element ──────────────────────────────────────
function EditableText({
  value,
  field,
  onEditField,
  charLimit,
  className,
  tagName: Tag = "div",
}: {
  value: string;
  field: EditableField;
  onEditField?: (field: EditableField, value: string) => void;
  charLimit?: number;
  className?: string;
  tagName?: "div" | "span";
}) {
  const [focused, setFocused] = useState(false);
  const elRef = useRef<HTMLElement>(null);

  if (!onEditField) {
    return <Tag className={className}>{value}</Tag>;
  }

  const isOver = charLimit ? value.length > charLimit : false;

  return (
    <Tag
      ref={elRef as React.RefObject<HTMLDivElement>}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => setFocused(true)}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        setFocused(false);
        const text = e.currentTarget.textContent ?? "";
        if (text !== value) {
          onEditField(field, text);
        }
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      className={`${className} relative cursor-text outline-none transition-all ${
        focused
          ? `ring-2 ${isOver ? "ring-red-400/60" : "ring-blue-400/50"} rounded px-1 -mx-1`
          : "hover:ring-1 hover:ring-white/20 hover:rounded hover:px-1 hover:-mx-1"
      }`}
    >
      {value}
      {charLimit !== undefined && (
        <CharCountBadge current={value.length} max={charLimit} visible={focused} />
      )}
    </Tag>
  );
}

// ── Color Picker Components ──────────────────────────────────────

function ColorPickerPopover({
  color,
  onChange,
  onClose,
  label,
}: {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
  label: string;
}) {
  return (
    <div
      className="absolute z-50 rounded-lg border bg-white p-3 shadow-lg"
      data-color-picker
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
        <button
          onClick={onClose}
          className="flex h-4 w-4 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-muted/40 hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full cursor-pointer rounded border-0"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-[10px] text-muted-foreground">{color}</span>
        <button onClick={onClose} className="text-[10px] text-muted-foreground hover:text-foreground">
          St&#228;ng
        </button>
      </div>
    </div>
  );
}

function ColorDot({
  color,
  label,
  colorKey,
  onColorChange,
  position = "top-left",
}: {
  color: string;
  label: string;
  colorKey: ColorOverrideKey;
  onColorChange?: (key: ColorOverrideKey, value: string) => void;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center-right";
}) {
  const [open, setOpen] = useState(false);

  if (!onColorChange) return null;

  const positionClasses: Record<string, string> = {
    "top-left": "top-1.5 left-1.5",
    "top-right": "top-1.5 right-1.5",
    "bottom-left": "bottom-1.5 left-1.5",
    "bottom-right": "bottom-1.5 right-1.5",
    "center-right": "top-1/2 -translate-y-1/2 right-1.5",
  };

  const popoverPositionClasses: Record<string, string> = {
    "top-left": "top-6 left-0",
    "top-right": "top-6 right-0",
    "bottom-left": "bottom-6 left-0",
    "bottom-right": "bottom-6 right-0",
    "center-right": "top-0 right-6",
  };

  return (
    <div className={`absolute z-20 ${positionClasses[position]}`} data-color-picker>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white/90 opacity-0 shadow-md transition-all duration-200 hover:scale-110 group-hover:opacity-100"
        style={{ backgroundColor: color }}
        title={label}
      >
        <Palette className="h-2.5 w-2.5 text-white mix-blend-difference" />
      </button>
      {open && (
        <div className={`absolute ${popoverPositionClasses[position]} w-36`}>
          <ColorPickerPopover
            color={color}
            onChange={(v) => onColorChange(colorKey, v)}
            onClose={() => setOpen(false)}
            label={label}
          />
        </div>
      )}
    </div>
  );
}

// ── Utility functions ───────────────────────────────────────────

function getGradient(primary?: string, accent?: string): string {
  // Always produce a rich, visible gradient — never white/transparent
  if (!primary) return "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)";

  const c = primary.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const brightness = (r + g + b) / 3;

  // Very dark → use brand color but lightened, with white text overlay still works
  if (brightness < 40) {
    return `linear-gradient(135deg, #1e293b 0%, #334155 50%, ${primary} 100%)`;
  }
  // Very light → darken significantly so white text is readable
  if (brightness > 200) {
    return `linear-gradient(135deg, ${darken(primary, 60)} 0%, ${darken(primary, 30)} 50%, ${primary} 100%)`;
  }
  // Normal: rich multi-stop gradient
  if (accent && accent !== primary) {
    return `linear-gradient(135deg, ${primary} 0%, ${accent} 50%, ${darken(accent, 20)} 100%)`;
  }
  return `linear-gradient(135deg, ${primary} 0%, ${darken(primary, 20)} 50%, ${darken(primary, 40)} 100%)`;
}

function darken(hex: string, amount: number): string {
  const c = hex.replace("#", "");
  const r = Math.max(0, parseInt(c.substring(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(c.substring(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(c.substring(4, 6), 16) - amount);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getContrastText(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1a1a1a" : "#ffffff";
}

/**
 * Resolve expanded palette from the harmony set.
 * Falls back to deriving CTA/shadow/background from brand colors if no harmony data.
 */
function resolveHarmonyPalette(brand: BrandData): ColorHarmonyPalette {
  const harmony = brand._colorHarmony?.original;
  if (harmony) return harmony;

  const ctaBg = brand.colors.accent || brand.colors.primary;
  return {
    primary: brand.colors.primary,
    secondary: brand.colors.secondary,
    accent: brand.colors.accent,
    text: brand.colors.text || getContrastText(brand.colors.background || "#ffffff"),
    background: brand.colors.background || "#ffffff",
    shadow: darken(brand.colors.primary, 40),
    ctaBackground: ctaBg,
    ctaText: getContrastText(ctaBg),
  };
}

// ── Variant diff detection ───────────────────────────────────────────────

function getVariantDiffs(variants: CopyData[]): Map<string, string[]> {
  const diffs = new Map<string, string[]>();
  const hero = variants[0];
  if (!hero) return diffs;

  variants.forEach((v, i) => {
    const variantId = v.id ?? `${v.platform}-${v.variant}`;
    if (i === 0) {
      diffs.set(variantId, ["Original"]);
      return;
    }
    const changes: string[] = [];
    if (v.headline.length < hero.headline.length * 0.8) changes.push("Kortare rubrik");
    else if (v.headline.length > hero.headline.length * 1.2) changes.push("L\u00e4ngre rubrik");
    if (v.cta !== hero.cta) changes.push("Annan CTA");
    if (v.bodyCopy.length < hero.bodyCopy.length * 0.7) changes.push("Kortare text");
    if (!changes.length) changes.push("Alternativ ton");
    diffs.set(variantId, changes);
  });

  return diffs;
}

// ── Shared sub-components ───────────────────────────────────────

function SelectedBadge() {
  return (
    <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
      <span className="flex items-center gap-1 rounded-b-lg bg-emerald-500 px-3 py-1 text-[9px] font-semibold text-white shadow-sm">
        <Check className="h-3 w-3" strokeWidth={3} /> Vald
      </span>
    </div>
  );
}

function DiffBadges({ diffs }: { diffs: string[] }) {
  if (!diffs.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {diffs.map((diff) => (
        <span
          key={diff}
          className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[8px] font-medium text-indigo-600"
        >
          {diff}
        </span>
      ))}
    </div>
  );
}

function VariantLabel({
  label,
  isSelected,
  isLoser,
  diffs,
}: {
  label: string;
  isSelected: boolean;
  isLoser: boolean;
  diffs?: string[];
}) {
  return (
    <div className="flex items-center justify-between bg-muted/30 px-3 py-1.5">
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          {label}
        </span>
        {diffs && <DiffBadges diffs={diffs} />}
      </div>
      {!isSelected && !isLoser && (
        <span className="text-[9px] font-medium text-indigo-400 opacity-0 transition-opacity group-hover:opacity-100">
          V&#228;lj denna
        </span>
      )}
    </div>
  );
}

function PreviewWrapper({ isSelected, isLoser, onPick, className, children }: { isSelected: boolean; isLoser: boolean; onPick: () => void; className?: string; children: React.ReactNode }) {
  return (
    <div
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.isContentEditable || target.closest("[contenteditable]")) return;
        if (target.closest("[data-color-picker]") || target.tagName === "INPUT") return;
        onPick();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onPick(); }}
      className={`group relative w-full overflow-hidden rounded-2xl border-2 text-left transition-all duration-300 ${isSelected ? "scale-[1.02] ring-2 ring-emerald-400 shadow-xl shadow-emerald-100 border-emerald-400" : isLoser ? "scale-[0.97] opacity-50 border-border/20" : "hover:scale-[1.01] hover:shadow-md border-border/40 hover:border-indigo-300"} ${className ?? ""}`}
    >
      {isSelected && <SelectedBadge />}
      {children}
    </div>
  );
}

// ── Draggable Logo ──────────────────────────────────────────────
const LOGO_POSITION_STYLES: Record<LogoPosition, string> = {
  "top-left": "top-2 left-2",
  "top-right": "top-2 right-2",
  "bottom-left": "bottom-2 left-2",
  "bottom-right": "bottom-2 right-2",
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
};

function snapToNearest(x: number, y: number, rect: DOMRect): LogoPosition {
  const relX = (x - rect.left) / rect.width;
  const relY = (y - rect.top) / rect.height;
  if (relX < 0.33 && relY < 0.33) return "top-left";
  if (relX > 0.66 && relY < 0.33) return "top-right";
  if (relX < 0.33 && relY > 0.66) return "bottom-left";
  if (relX > 0.66 && relY > 0.66) return "bottom-right";
  return "center";
}

function DraggableLogo({
  logoUrl,
  brandName,
  brandColor,
  position,
  onPositionChange,
  containerRef,
}: {
  logoUrl?: string;
  brandName: string;
  brandColor: string;
  position: LogoPosition;
  onPositionChange: (pos: LogoPosition) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const logoRef = useRef<HTMLDivElement>(null);
  const dragStartOffset = useRef({ x: 0, y: 0 });

  function getClientCoords(e: MouseEvent | TouchEvent): { clientX: number; clientY: number } | null {
    if ("touches" in e) {
      const touch = e.touches[0] ?? e.changedTouches[0];
      if (!touch) return null;
      return { clientX: touch.clientX, clientY: touch.clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  }

  function handleDragStart(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    const logo = logoRef.current;
    if (!container || !logo) return;

    const nativeEvent = e.nativeEvent as MouseEvent | TouchEvent;
    const coords = getClientCoords(nativeEvent);
    if (!coords) return;

    const logoRect = logo.getBoundingClientRect();
    dragStartOffset.current = {
      x: coords.clientX - logoRect.left,
      y: coords.clientY - logoRect.top,
    };

    const containerRect = container.getBoundingClientRect();
    setDragPos({
      x: logoRect.left - containerRect.left,
      y: logoRect.top - containerRect.top,
    });
    setIsDragging(true);
  }

  useEffect(() => {
    if (!isDragging) return;

    function handleMove(e: MouseEvent | TouchEvent) {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const coords = getClientCoords(e);
      if (!coords) return;

      const containerRect = container.getBoundingClientRect();
      const logoSize = 32;

      const newX = Math.max(0, Math.min(
        coords.clientX - containerRect.left - dragStartOffset.current.x,
        containerRect.width - logoSize,
      ));
      const newY = Math.max(0, Math.min(
        coords.clientY - containerRect.top - dragStartOffset.current.y,
        containerRect.height - logoSize,
      ));

      setDragPos({ x: newX, y: newY });
    }

    function handleEnd(e: MouseEvent | TouchEvent) {
      const container = containerRef.current;
      if (!container) {
        setIsDragging(false);
        return;
      }

      const coords = getClientCoords(e);
      if (coords) {
        const containerRect = container.getBoundingClientRect();
        const snapped = snapToNearest(coords.clientX, coords.clientY, containerRect);
        onPositionChange(snapped);
      }

      setIsDragging(false);
    }

    window.addEventListener("mousemove", handleMove, { passive: false });
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
    window.addEventListener("touchcancel", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchcancel", handleEnd);
    };
  }, [isDragging, containerRef, onPositionChange]);

  const logoContent = logoUrl ? (
    <img src={logoUrl} alt="" className="h-8 w-8 rounded object-contain drop-shadow-md" draggable={false} />
  ) : (
    <div
      className="flex h-8 w-8 items-center justify-center rounded text-[10px] font-bold text-white drop-shadow-md"
      style={{ backgroundColor: brandColor }}
    >
      {brandName[0]}
    </div>
  );

  return (
    <div
      ref={logoRef}
      className={`absolute z-10 select-none ${
        isDragging
          ? "cursor-grabbing"
          : `cursor-grab ${LOGO_POSITION_STYLES[position]}`
      } ${isDragging ? "" : "transition-all duration-300 ease-out"}`}
      style={
        isDragging
          ? { left: dragPos.x, top: dragPos.y, position: "absolute" }
          : undefined
      }
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      role="button"
      tabIndex={0}
      aria-label={`Logotyp position: ${position}. Dra eller anv\u00e4nd piltangenter.`}
      onKeyDown={(e) => {
        const posMap: Record<string, LogoPosition> = {
          ArrowUp: position.includes("bottom") ? (position.replace("bottom", "top") as LogoPosition) : position,
          ArrowDown: position.includes("top") ? (position.replace("top", "bottom") as LogoPosition) : position,
          ArrowLeft: position.includes("right") ? (position.replace("right", "left") as LogoPosition) : position,
          ArrowRight: position.includes("left") ? (position.replace("left", "right") as LogoPosition) : position,
        };
        if (e.key in posMap) {
          e.preventDefault();
          const newPos = posMap[e.key];
          if (newPos && newPos !== position) onPositionChange(newPos);
        }
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          const cycle: LogoPosition[] = ["top-left", "top-right", "bottom-right", "bottom-left", "center"];
          const idx = cycle.indexOf(position);
          onPositionChange(cycle[(idx + 1) % cycle.length]!);
        }
      }}
    >
      <div className={`relative rounded-lg ring-2 ring-transparent transition-all ${isDragging ? "scale-110 ring-white/60 shadow-lg" : "hover:ring-white/40 hover:shadow-md"}`}>
        {logoContent}
        <div className={`absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 ${isDragging ? "!opacity-100" : ""}`}>
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      </div>
    </div>
  );
}

// ── Logo Position Indicator ─────────────────────────────────────
function LogoPositionIndicator({
  position,
  onPositionChange,
}: {
  position: LogoPosition;
  onPositionChange: (pos: LogoPosition) => void;
}) {
  const positions: Array<{ id: LogoPosition; row: number; col: number }> = [
    { id: "top-left", row: 0, col: 0 },
    { id: "top-right", row: 0, col: 2 },
    { id: "center", row: 1, col: 1 },
    { id: "bottom-left", row: 2, col: 0 },
    { id: "bottom-right", row: 2, col: 2 },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-medium text-muted-foreground/50">Logotyp:</span>
      <div className="grid grid-cols-3 grid-rows-3 gap-[3px]" style={{ width: 24, height: 24 }}>
        {Array.from({ length: 9 }).map((_, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const pos = positions.find((p) => p.row === row && p.col === col);
          if (!pos) {
            return <div key={i} className="h-[6px] w-[6px]" />;
          }
          const isActive = position === pos.id;
          return (
            <button
              key={pos.id}
              onClick={() => onPositionChange(pos.id)}
              className={`h-[6px] w-[6px] rounded-full transition-all ${
                isActive
                  ? "bg-indigo-500 ring-1 ring-indigo-300 scale-125"
                  : "bg-border/60 hover:bg-indigo-300"
              }`}
              title={pos.id}
              aria-label={`Placera logotyp ${pos.id}`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Meta Feed Preview ───────────────────────────────────────────
function MetaFeedPreview({ copy, brand, bgImage, isSelected, isLoser, onPick, layout, onEditField, charLimits, colorOverrides, onColorChange, harmonyPalette, logoPosition, onLogoPositionChange, diffs }: PreviewProps) {
  const primary = colorOverrides?.primary ?? harmonyPalette.primary;
  const accent = colorOverrides?.accent ?? harmonyPalette.accent;
  const ctaBg = colorOverrides?.ctaBackground ?? harmonyPalette.ctaBackground;
  const ctaTextColor = getContrastText(ctaBg);
  const textColor = colorOverrides?.textColor ?? harmonyPalette.text;
  const creativeContainerRef = useRef<HTMLDivElement>(null);

  const gradient = getGradient(
    colorOverrides?.gradientStart ?? primary,
    colorOverrides?.gradientEnd ?? accent,
  );
  const cleanDomain = brand.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  // FIX 8: Dynamic headline sizing based on word count
  const wordCount = copy.headline.split(/\s+/).length;
  const headlineSize = wordCount <= 4 ? "text-xl" : wordCount <= 7 ? "text-lg" : "text-base";

  function renderCreativeContent() {
    const headlineEl = (
      <EditableText value={copy.headline} field="headline" onEditField={onEditField} charLimit={charLimits?.headline} className={`line-clamp-3 ${headlineSize} font-bold leading-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]`} tagName="div" />
    );
    const ctaEl = (
      <EditableText value={copy.cta} field="cta" onEditField={onEditField} charLimit={charLimits?.cta} className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[10px] font-semibold shadow-sm" tagName="div" />
    );

    switch (layout) {
      case "split":
        return (
          <div className="relative flex aspect-[1.91/1] overflow-hidden">
            <div className="flex w-1/2 flex-col justify-center gap-3 bg-white px-5 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: primary }}>{brand.name}</div>
              <div style={{ color: textColor }}>{headlineEl}</div>
              <div className="relative" style={{ backgroundColor: ctaBg, color: ctaTextColor, boxShadow: `0 4px 16px ${ctaBg}66, 0 0 0 1px ${ctaTextColor}15` }}>
                {ctaEl}
                <ColorDot color={ctaBg} label="CTA-f&#228;rg" colorKey="ctaBackground" onColorChange={onColorChange} position="center-right" />
              </div>
            </div>
            <div className="relative w-1/2" style={{ background: bgImage ? `url(${bgImage}) center/cover` : gradient }}>
              <ColorDot color={colorOverrides?.gradientStart ?? primary} label="Bakgrundsf&#228;rg" colorKey="gradientStart" onColorChange={onColorChange} position="top-right" />
            </div>
          </div>
        );

      case "minimal":
        return (
          <div className="relative flex aspect-[1.91/1] flex-col justify-center overflow-hidden bg-white px-8 py-6">
            <div className="mb-4 h-1 w-12 rounded-full" style={{ backgroundColor: primary }} />
            <div style={{ color: textColor }}>{headlineEl}</div>
            <div className="mt-3 text-xs text-gray-500">{brand.name}</div>
            <div className="relative mt-4 self-start" style={{ backgroundColor: ctaBg, color: ctaTextColor, boxShadow: `0 4px 16px ${ctaBg}66, 0 0 0 1px ${ctaTextColor}15` }}>
              {ctaEl}
              <ColorDot color={primary} label="Prim&#228;rf&#228;rg" colorKey="primary" onColorChange={onColorChange} position="center-right" />
            </div>
          </div>
        );

      case "bold-cta":
        return (
          <div className="relative flex aspect-[1.91/1] flex-col items-center justify-between overflow-hidden py-4 text-center" style={{ background: bgImage ? `url(${bgImage}) center/cover` : gradient }}>
            {<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />}
            <ColorDot color={colorOverrides?.gradientStart ?? primary} label="Bakgrundsf&#228;rg" colorKey="gradientStart" onColorChange={onColorChange} position="top-right" />
            <div className="relative z-[1] px-6">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">{brand.name}</div>
              <div className="mt-2 text-white">{headlineEl}</div>
            </div>
            <div className="relative z-[1] w-[70%] rounded-xl px-6 py-4 text-center" style={{ backgroundColor: ctaBg, color: ctaTextColor, boxShadow: `0 4px 16px ${ctaBg}66, 0 0 0 1px ${ctaTextColor}15` }}>
              <EditableText value={copy.cta} field="cta" onEditField={onEditField} charLimit={charLimits?.cta} className="text-base font-extrabold" tagName="div" />
              <ArrowRight className="mx-auto mt-1 h-4 w-4" />
              <ColorDot color={ctaBg} label="CTA-f&#228;rg" colorKey="ctaBackground" onColorChange={onColorChange} position="top-right" />
            </div>
          </div>
        );

      default: // "centered"
        return (
          <div className="relative flex aspect-[1.91/1] items-center justify-center overflow-hidden text-center" style={{ background: bgImage ? `url(${bgImage}) center/cover` : gradient }}>
            {<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />}
            <ColorDot color={colorOverrides?.gradientStart ?? primary} label="Bakgrundsf&#228;rg" colorKey="gradientStart" onColorChange={onColorChange} position="top-right" />
            <ColorDot color={colorOverrides?.gradientEnd ?? accent ?? darken(primary, 25)} label="Gradient slut" colorKey="gradientEnd" onColorChange={onColorChange} position="bottom-left" />
            <div className="relative z-[1] space-y-4 px-6">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">{brand.name}</div>
              <div className="text-white">{headlineEl}</div>
              <div className="relative" style={{ backgroundColor: ctaBg, color: ctaTextColor, boxShadow: `0 4px 16px ${ctaBg}66, 0 0 0 1px ${ctaTextColor}15` }}>
                {ctaEl}
                <ColorDot color={ctaBg} label="CTA-f&#228;rg" colorKey="ctaBackground" onColorChange={onColorChange} position="center-right" />
              </div>
            </div>
          </div>
        );
    }
  }

  return (
    <PreviewWrapper isSelected={isSelected} isLoser={isLoser} onPick={onPick}>
      <VariantLabel label={copy.label ?? "Variant"} isSelected={isSelected} isLoser={isLoser} diffs={diffs} />
      <div className="bg-white">
        <div className="flex items-center gap-2 px-2.5 py-1.5">
          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white shadow-sm" style={{ backgroundColor: primary }}>
            {brand.name[0]}
            <ColorDot color={primary} label="Primärfärg" colorKey="primary" onColorChange={onColorChange} position="bottom-right" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-gray-900">{brand.name}</div>
            <div className="flex items-center gap-1 text-[9px] text-gray-400">Sponsrad <Globe className="inline h-2 w-2" /></div>
          </div>
          <MoreHorizontal className="h-3.5 w-3.5 shrink-0 text-gray-300" />
        </div>
        <div className="px-2.5 pb-1.5">
          <EditableText value={copy.bodyCopy} field="bodyCopy" onEditField={onEditField} charLimit={charLimits?.bodyCopy} className="line-clamp-3 text-[11px] leading-snug text-gray-700" tagName="div" />
        </div>
        <div ref={creativeContainerRef} className="relative">
          {renderCreativeContent()}
          <DraggableLogo
            brandName={brand.name}
            brandColor={primary}
            position={logoPosition}
            onPositionChange={onLogoPositionChange}
            containerRef={creativeContainerRef}
          />
        </div>
        <div className="flex items-center justify-between bg-gray-50 px-2.5 py-1.5">
          <div className="min-w-0 flex-1">
            <div className="text-[8px] uppercase text-gray-400">{cleanDomain}</div>
            <div className="truncate text-[11px] font-semibold text-gray-800">{copy.headline.slice(0, 40)}</div>
          </div>
          <div className="shrink-0 rounded px-2.5 py-1 text-[9px] font-semibold" style={{ backgroundColor: ctaBg, color: ctaTextColor }}>
            {copy.cta}
          </div>
        </div>
        <div className="flex justify-around border-t px-2 py-1 text-[9px] text-gray-400">
          <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Gilla</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Kommentera</span>
          <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> Dela</span>
        </div>
      </div>
    </PreviewWrapper>
  );
}

// ── Meta Story / Reel Preview ───────────────────────────────────
function MetaStoryPreview({ copy, brand, bgImage, isSelected, isLoser, onPick, layout, onEditField, charLimits, colorOverrides, onColorChange, harmonyPalette, logoPosition, onLogoPositionChange, diffs }: PreviewProps) {
  const primary = colorOverrides?.primary ?? harmonyPalette.primary;
  const accent = colorOverrides?.accent ?? harmonyPalette.accent;
  const ctaBg = colorOverrides?.ctaBackground ?? harmonyPalette.ctaBackground;
  const ctaTextColor = getContrastText(ctaBg);
  const gradient = getGradient(colorOverrides?.gradientStart ?? primary, colorOverrides?.gradientEnd ?? accent);
  const storyContainerRef = useRef<HTMLDivElement>(null);

  // FIX 8: Dynamic headline sizing based on word count
  const wordCount = copy.headline.split(/\s+/).length;
  const storyHeadlineSize = wordCount <= 4 ? "text-xl" : wordCount <= 7 ? "text-lg" : "text-base";

  const storyBrandHeader = (
    <div className="flex w-full items-center gap-2">
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white/50 shadow-sm" style={{ backgroundColor: primary }}>
        {brand.name[0]}
        <ColorDot color={primary} label="Primärfärg" colorKey="primary" onColorChange={onColorChange} position="bottom-right" />
      </div>
      <div className="min-w-0 text-left">
        <div className="truncate text-[11px] font-semibold text-white drop-shadow">{brand.name}</div>
        <div className="text-[8px] text-white/60">Sponsrad</div>
      </div>
    </div>
  );

  function renderStoryContent() {
    const bodySnippet = copy.bodyCopy.slice(0, 60) + (copy.bodyCopy.length > 60 ? "..." : "");

    switch (layout) {
      case "split":
        return (
          <div className="relative flex aspect-[9/16] flex-col items-center justify-between p-4 text-center" style={{ background: bgImage ? `url(${bgImage}) center/cover` : gradient }}>
            <ColorDot color={colorOverrides?.gradientStart ?? primary} label="Bakgrundsf&#228;rg" colorKey="gradientStart" onColorChange={onColorChange} position="top-right" />
            {storyBrandHeader}
            <div className="flex-1" />
            <div className="w-full rounded-xl bg-white/95 p-3 text-left backdrop-blur-sm">
              <EditableText value={copy.headline} field="headline" onEditField={onEditField} charLimit={charLimits?.headline} className="text-sm font-extrabold leading-tight text-gray-900" tagName="div" />
              <EditableText value={bodySnippet} field="bodyCopy" onEditField={onEditField} charLimit={charLimits?.bodyCopy} className="mt-1 text-[9px] leading-snug text-gray-600" tagName="div" />
              <div className="relative mt-2 rounded-full px-4 py-1.5 text-center text-[10px] font-bold" style={{ backgroundColor: ctaBg, color: ctaTextColor }}>
                <EditableText value={copy.cta} field="cta" onEditField={onEditField} charLimit={charLimits?.cta} className="inline" tagName="span" />
                <ColorDot color={ctaBg} label="CTA-f&#228;rg" colorKey="ctaBackground" onColorChange={onColorChange} position="center-right" />
              </div>
            </div>
          </div>
        );

      case "minimal":
        return (
          <div className="relative flex aspect-[9/16] flex-col items-center justify-center bg-white p-5 text-center">
            <div className="mb-4 h-1 w-8 rounded-full" style={{ backgroundColor: primary }} />
            <EditableText value={copy.headline} field="headline" onEditField={onEditField} charLimit={charLimits?.headline} className="text-base font-extrabold leading-tight text-gray-900" tagName="div" />
            <EditableText value={bodySnippet} field="bodyCopy" onEditField={onEditField} charLimit={charLimits?.bodyCopy} className="mt-2 text-[10px] leading-snug text-gray-500" tagName="div" />
            <div className="relative mt-4 rounded-full px-5 py-2 text-[10px] font-bold" style={{ backgroundColor: primary, color: getContrastText(primary) }}>
              <EditableText value={copy.cta} field="cta" onEditField={onEditField} charLimit={charLimits?.cta} className="inline" tagName="span" />
              <ColorDot color={primary} label="Prim&#228;rf&#228;rg" colorKey="primary" onColorChange={onColorChange} position="center-right" />
            </div>
          </div>
        );

      case "bold-cta":
        return (
          <div className="relative flex aspect-[9/16] flex-col items-center justify-between p-4 text-center" style={{ background: bgImage ? `url(${bgImage}) center/cover` : gradient }}>
            <ColorDot color={colorOverrides?.gradientStart ?? primary} label="Bakgrundsf&#228;rg" colorKey="gradientStart" onColorChange={onColorChange} position="top-right" />
            {storyBrandHeader}
            <EditableText value={copy.headline} field="headline" onEditField={onEditField} charLimit={charLimits?.headline} className="px-2 text-sm font-extrabold leading-tight text-white drop-shadow-lg" tagName="div" />
            <div className="flex w-full flex-col items-center gap-2">
              <ChevronUp className="h-5 w-5 animate-bounce text-white/80" />
              <div className="relative w-full rounded-2xl px-4 py-4 text-center shadow-lg" style={{ backgroundColor: ctaBg, color: ctaTextColor, boxShadow: `0 4px 16px ${ctaBg}66, 0 0 0 1px ${ctaTextColor}15` }}>
                <EditableText value={copy.cta} field="cta" onEditField={onEditField} charLimit={charLimits?.cta} className="text-base font-extrabold" tagName="div" />
                <ColorDot color={ctaBg} label="CTA-f&#228;rg" colorKey="ctaBackground" onColorChange={onColorChange} position="top-right" />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="relative flex aspect-[9/16] flex-col items-center justify-between p-4 text-center" style={{ background: bgImage ? `url(${bgImage}) center/cover` : gradient }}>
            <ColorDot color={colorOverrides?.gradientStart ?? primary} label="Bakgrundsf&#228;rg" colorKey="gradientStart" onColorChange={onColorChange} position="top-right" />
            {storyBrandHeader}
            <div className="space-y-3 px-2">
              <EditableText value={copy.headline} field="headline" onEditField={onEditField} charLimit={charLimits?.headline} className={`${storyHeadlineSize} font-extrabold leading-tight text-white drop-shadow-lg`} tagName="div" />
              <EditableText value={bodySnippet} field="bodyCopy" onEditField={onEditField} charLimit={charLimits?.bodyCopy} className="text-[10px] leading-snug text-white/80 drop-shadow" tagName="div" />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <ChevronUp className="h-4 w-4 animate-bounce text-white/80" />
              <div className="relative rounded-full px-5 py-2 text-[10px] font-bold shadow-lg" style={{ backgroundColor: ctaBg, color: ctaTextColor, boxShadow: `0 4px 16px ${ctaBg}66, 0 0 0 1px ${ctaTextColor}15` }}>
                <EditableText value={copy.cta} field="cta" onEditField={onEditField} charLimit={charLimits?.cta} className="inline" tagName="span" />
                <ColorDot color={ctaBg} label="CTA-f&#228;rg" colorKey="ctaBackground" onColorChange={onColorChange} position="center-right" />
              </div>
            </div>
          </div>
        );
    }
  }

  return (
    <PreviewWrapper isSelected={isSelected} isLoser={isLoser} onPick={onPick} className="mx-auto w-[200px]">
      <div ref={storyContainerRef} className="relative">
        {renderStoryContent()}
        <DraggableLogo
          brandName={brand.name}
          brandColor={primary}
          position={logoPosition}
          onPositionChange={onLogoPositionChange}
          containerRef={storyContainerRef}
        />
      </div>
    </PreviewWrapper>
  );
}

// ── Google Search Ad Preview ────────────────────────────────────
function GoogleSearchPreview({ copy, brand, isSelected, isLoser, onPick, layout, onEditField, charLimits, colorOverrides, onColorChange, harmonyPalette, diffs }: PreviewProps) {
  const primary = colorOverrides?.primary ?? harmonyPalette.primary;
  const cleanDomain = brand.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const googleSearchBar = (
    <div className="mb-4 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      <span className="truncate text-sm text-gray-600">{brand.name.toLowerCase()}</span>
    </div>
  );

  const sponsoredLabel = (
    <div className="mb-1 flex items-center gap-1.5">
      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold text-gray-500">Sponsrad</span>
    </div>
  );

  const urlLine = (
    <div className="mb-1 flex items-center gap-1.5">
      <div className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white" style={{ backgroundColor: primary }}>
        {brand.name[0]}
        <ColorDot color={primary} label="Prim&#228;rf&#228;rg" colorKey="primary" onColorChange={onColorChange} position="bottom-right" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[11px] text-gray-800">{brand.name}</div>
        <div className="flex items-center gap-0.5 text-[10px] text-gray-500">
          {cleanDomain}
          <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>
    </div>
  );

  function renderGoogleContent() {
    switch (layout) {
      case "split":
        return (
          <div className="bg-white p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                {sponsoredLabel}
                {urlLine}
                <EditableText value={copy.headline} field="headline" onEditField={onEditField} charLimit={charLimits?.headline} className="mb-1.5 text-lg font-medium leading-tight text-[#1a0dab] sm:text-xl" tagName="div" />
              </div>
              <div className="flex w-2/5 flex-col justify-center rounded-lg bg-gray-50 p-3">
                <EditableText value={copy.bodyCopy} field="bodyCopy" onEditField={onEditField} charLimit={charLimits?.bodyCopy} className="text-[12px] leading-relaxed text-gray-600" tagName="div" />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 border-t border-gray-100 pt-3">
              <EditableText value={copy.cta} field="cta" onEditField={onEditField} charLimit={charLimits?.cta} className="text-[11px] font-medium text-[#1a0dab]" tagName="span" />
              <span className="text-[11px] font-medium text-[#1a0dab]">Om {brand.name}</span>
              <span className="text-[11px] font-medium text-[#1a0dab]">Priser</span>
              <span className="text-[11px] font-medium text-[#1a0dab]">Kontakt</span>
            </div>
          </div>
        );

      case "minimal":
        return (
          <div className="bg-white p-4">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold text-gray-500">Sponsrad</span>
              <span className="text-[10px] text-gray-500">{cleanDomain}</span>
            </div>
            <EditableText value={copy.headline} field="headline" onEditField={onEditField} charLimit={charLimits?.headline} className="mb-1 text-base font-medium leading-tight text-[#1a0dab]" tagName="div" />
            <EditableText value={copy.bodyCopy} field="bodyCopy" onEditField={onEditField} charLimit={charLimits?.bodyCopy} className="text-[11px] leading-relaxed text-gray-500" tagName="div" />
          </div>
        );

      case "bold-cta":
        return (
          <div className="bg-white p-4">
            {googleSearchBar}
            {sponsoredLabel}
            {urlLine}
            <EditableText value={copy.headline} field="headline" onEditField={onEditField} charLimit={charLimits?.headline} className="mb-1.5 text-lg font-medium leading-tight text-[#1a0dab] sm:text-xl" tagName="div" />
            <EditableText value={copy.bodyCopy} field="bodyCopy" onEditField={onEditField} charLimit={charLimits?.bodyCopy} className="text-[12px] leading-relaxed text-gray-600" tagName="div" />
            <div className="mt-3 border-t border-gray-100 pt-3">
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5">
                <EditableText value={copy.cta} field="cta" onEditField={onEditField} charLimit={charLimits?.cta} className="text-sm font-semibold text-[#1a0dab]" tagName="span" />
                <ArrowRight className="h-4 w-4 text-[#1a0dab]" />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white p-4">
            {googleSearchBar}
            {sponsoredLabel}
            {urlLine}
            <EditableText value={copy.headline} field="headline" onEditField={onEditField} charLimit={charLimits?.headline} className="mb-1.5 text-lg font-medium leading-tight text-[#1a0dab] sm:text-xl" tagName="div" />
            <EditableText value={copy.bodyCopy} field="bodyCopy" onEditField={onEditField} charLimit={charLimits?.bodyCopy} className="text-[12px] leading-relaxed text-gray-600" tagName="div" />
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 border-t border-gray-100 pt-3">
              <EditableText value={copy.cta} field="cta" onEditField={onEditField} charLimit={charLimits?.cta} className="text-[11px] font-medium text-[#1a0dab]" tagName="span" />
              <span className="text-[11px] font-medium text-[#1a0dab]">Om {brand.name}</span>
              <span className="text-[11px] font-medium text-[#1a0dab]">Priser</span>
              <span className="text-[11px] font-medium text-[#1a0dab]">Kontakt</span>
            </div>
          </div>
        );
    }
  }

  return (
    <PreviewWrapper isSelected={isSelected} isLoser={isLoser} onPick={onPick}>
      <VariantLabel label={copy.label ?? "Variant"} isSelected={isSelected} isLoser={isLoser} diffs={diffs} />
      {renderGoogleContent()}
    </PreviewWrapper>
  );
}

// ── LinkedIn Sponsored Post Preview ─────────────────────────────
function LinkedInPreview({ copy, brand, bgImage, isSelected, isLoser, onPick, layout, onEditField, charLimits, colorOverrides, onColorChange, harmonyPalette, diffs }: PreviewProps) {
  const primary = colorOverrides?.primary ?? harmonyPalette.primary;
  const accent = colorOverrides?.accent ?? harmonyPalette.accent;
  const ctaBg = colorOverrides?.ctaBackground ?? harmonyPalette.ctaBackground;
  const ctaTextColor = getContrastText(ctaBg);
  const textColor = colorOverrides?.textColor ?? harmonyPalette.text;
  const gradient = getGradient(colorOverrides?.gradientStart ?? primary, colorOverrides?.gradientEnd ?? accent);

  function renderCreativeContent() {
    const headlineEl = (
      <EditableText value={copy.headline} field="headline" onEditField={onEditField} charLimit={charLimits?.headline} className="text-2xl font-bold leading-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)] sm:text-3xl" tagName="div" />
    );
    const ctaEl = (
      <EditableText value={copy.cta} field="cta" onEditField={onEditField} charLimit={charLimits?.cta} className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[10px] font-semibold shadow-sm" tagName="div" />
    );

    switch (layout) {
      case "split":
        return (
          <div className="relative flex aspect-[1.91/1] overflow-hidden">
            <div className="flex w-1/2 flex-col justify-center gap-3 bg-white px-5 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: primary }}>{brand.name}</div>
              <div style={{ color: textColor }}>{headlineEl}</div>
              <div className="relative" style={{ backgroundColor: ctaBg, color: ctaTextColor }}>
                {ctaEl}
                <ColorDot color={ctaBg} label="CTA-f&#228;rg" colorKey="ctaBackground" onColorChange={onColorChange} position="center-right" />
              </div>
            </div>
            <div className="relative w-1/2" style={{ background: bgImage ? `url(${bgImage}) center/cover` : gradient }}>
              <ColorDot color={colorOverrides?.gradientStart ?? primary} label="Bakgrundsf&#228;rg" colorKey="gradientStart" onColorChange={onColorChange} position="top-right" />
            </div>
          </div>
        );

      case "minimal":
        return (
          <div className="relative flex aspect-[1.91/1] flex-col justify-center overflow-hidden bg-white px-8 py-6">
            <div className="mb-4 h-1 w-12 rounded-full" style={{ backgroundColor: primary }} />
            <div className="text-gray-900">{headlineEl}</div>
            <div className="mt-3 text-xs text-gray-500">{brand.name}</div>
            <div className="relative mt-4 self-start" style={{ backgroundColor: primary, color: getContrastText(primary) }}>
              {ctaEl}
              <ColorDot color={primary} label="Prim&#228;rf&#228;rg" colorKey="primary" onColorChange={onColorChange} position="center-right" />
            </div>
          </div>
        );

      case "bold-cta":
        return (
          <div className="relative flex aspect-[1.91/1] flex-col items-center justify-between overflow-hidden py-4 text-center" style={{ background: bgImage ? `url(${bgImage}) center/cover` : gradient }}>
            {<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />}
            <ColorDot color={colorOverrides?.gradientStart ?? primary} label="Bakgrundsf&#228;rg" colorKey="gradientStart" onColorChange={onColorChange} position="top-right" />
            <div className="relative z-[1] px-6">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">{brand.name}</div>
              <div className="mt-2 text-white">{headlineEl}</div>
            </div>
            <div className="relative z-[1] w-[70%] rounded-xl px-6 py-4 text-center shadow-lg" style={{ backgroundColor: ctaBg, color: ctaTextColor }}>
              <EditableText value={copy.cta} field="cta" onEditField={onEditField} charLimit={charLimits?.cta} className="text-base font-extrabold" tagName="div" />
              <ArrowRight className="mx-auto mt-1 h-4 w-4" />
              <ColorDot color={ctaBg} label="CTA-f&#228;rg" colorKey="ctaBackground" onColorChange={onColorChange} position="top-right" />
            </div>
          </div>
        );

      default:
        return (
          <div className="relative flex aspect-[1.91/1] items-center justify-center overflow-hidden text-center" style={{ background: bgImage ? `url(${bgImage}) center/cover` : gradient }}>
            {<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />}
            <ColorDot color={colorOverrides?.gradientStart ?? primary} label="Bakgrundsf&#228;rg" colorKey="gradientStart" onColorChange={onColorChange} position="top-right" />
            <div className="relative z-[1] space-y-4 px-6">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">{brand.name}</div>
              <div className="text-white">{headlineEl}</div>
              <div className="relative" style={{ backgroundColor: ctaBg, color: ctaTextColor }}>
                {ctaEl}
                <ColorDot color={ctaBg} label="CTA-f&#228;rg" colorKey="ctaBackground" onColorChange={onColorChange} position="center-right" />
              </div>
            </div>
          </div>
        );
    }
  }

  return (
    <PreviewWrapper isSelected={isSelected} isLoser={isLoser} onPick={onPick}>
      <VariantLabel label={copy.label ?? "Variant"} isSelected={isSelected} isLoser={isLoser} diffs={diffs} />
      <div className="bg-white">
        <div className="flex items-start gap-2.5 px-3 py-2.5">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded text-sm font-bold text-white" style={{ backgroundColor: primary }}>
            {brand.name[0]}
            <ColorDot color={primary} label="Prim&#228;rf&#228;rg" colorKey="primary" onColorChange={onColorChange} position="bottom-right" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-gray-900">{brand.name}</div>
            <div className="text-[10px] leading-snug text-gray-500">{brand.industry ? `${brand.industry.charAt(0).toUpperCase()}${brand.industry.slice(1)}` : "F\u00f6retag"}</div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">Sponsrad <Globe className="inline h-2.5 w-2.5" /></div>
          </div>
          <MoreHorizontal className="h-4 w-4 shrink-0 text-gray-300" />
        </div>
        <div className="px-3 pb-2.5">
          <EditableText value={copy.bodyCopy} field="bodyCopy" onEditField={onEditField} charLimit={charLimits?.bodyCopy} className="text-[12px] leading-snug text-gray-800" tagName="div" />
        </div>
        {renderCreativeContent()}
        <div className="border-t border-gray-100 bg-gray-50 px-3 py-2">
          <div className="text-[9px] text-gray-400">{brand.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</div>
          <div className="truncate text-xs font-semibold text-gray-800">{copy.headline.slice(0, 60)}</div>
        </div>
        <div className="flex justify-around border-t px-2 py-1.5 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> Gilla</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> Kommentera</span>
          <span className="flex items-center gap-1"><Repeat2 className="h-3.5 w-3.5" /> Dela</span>
          <span className="flex items-center gap-1"><Send className="h-3.5 w-3.5" /> Skicka</span>
        </div>
      </div>
    </PreviewWrapper>
  );
}

// ── Platform tab icon components ────────────────────────────────
function MetaIcon({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.563V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" /></svg>);
}
function GoogleIcon({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>);
}
function LinkedInIcon({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>);
}
function StoryIcon({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="3" /><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" /></svg>);
}

// ── Format / Layout / Preview maps ──────────────────────────────
const FORMAT_TABS: Array<{ id: AdFormat; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "meta-feed", label: "Meta Feed", icon: MetaIcon },
  { id: "meta-story", label: "Meta Story", icon: StoryIcon },
  { id: "google", label: "Google S\u00f6k", icon: GoogleIcon },
  { id: "linkedin", label: "LinkedIn", icon: LinkedInIcon },
];
const LAYOUT_OPTIONS: Array<{ id: LayoutStyle; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "centered", label: "Centrerad", icon: AlignCenter },
  { id: "split", label: "Delad", icon: Columns2 },
  { id: "minimal", label: "Minimal", icon: MinusSquare },
  { id: "bold-cta", label: "Tydlig CTA", icon: MousePointerClick },
];
const PREVIEW_COMPONENTS: Record<AdFormat, React.ComponentType<PreviewProps>> = {
  "meta-feed": MetaFeedPreview,
  "meta-story": MetaStoryPreview,
  google: GoogleSearchPreview,
  linkedin: LinkedInPreview,
};
const AI_PROMPTS = [
  { icon: Zap, label: "Kortare & punchigare", prompt: "G\u00f6r rubriken kortare och mer slagkraftig" },
  { icon: Palette, label: "Annan stil", prompt: "Prova en helt annan kreativ vinkel" },
  { icon: Type, label: "Mer professionell", prompt: "G\u00f6r texten mer professionell och aff\u00e4rsm\u00e4ssig" },
  { icon: RotateCcw, label: "Generera nya", prompt: "Generera helt nya annonsf\u00f6rslag" },
];

// ── Main Component ──────────────────────────────────────────────
export function CopyPreviewCard({ data, onSendMessage }: { data: CopyPreviewData; onSendMessage?: (text: string) => void }) {
  const [format, setFormat] = useState<AdFormat>("meta-feed");
  const [layout, setLayout] = useState<LayoutStyle>("centered");
  const [viewMode, setViewMode] = useState<"single" | "compare">("single");
  const [logoPosition, setLogoPosition] = useState<LogoPosition>("bottom-right");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [bgImages, setBgImages] = useState<Record<string, string>>({});
  const [bgInitialized, setBgInitialized] = useState(false);
  const [mobileIndex, setMobileIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { headline: string; bodyCopy: string; cta: string }>>({});
  const [colorOverrides, setColorOverrides] = useState<ColorOverrides>({});
  const [variantPreferences, setVariantPreferences] = useState<{
    preferredHeadlineLength: "short" | "medium" | "long";
    selectedCount: number;
  }>({ preferredHeadlineLength: "medium", selectedCount: 0 });

  const variants = data.copies.slice(0, 2);

  // Initialize bgImages from data.backgroundUrl (AI-generated or Unsplash) on first render.
  // Only runs once per component mount — user uploads take priority after initialization.
  useEffect(() => {
    if (bgInitialized || !data.backgroundUrl) return;
    const initial: Record<string, string> = {};
    for (const copy of data.copies.slice(0, 2)) {
      const copyId = copy.id ?? `${copy.platform}-${copy.variant}`;
      initial[copyId] = data.backgroundUrl;
    }
    setBgImages((prev) => {
      // Don't overwrite user-uploaded images
      const merged = { ...initial };
      for (const [key, val] of Object.entries(prev)) {
        if (val) merged[key] = val;
      }
      return merged;
    });
    setBgInitialized(true);
  }, [data.backgroundUrl, data.copies, bgInitialized]);

  const variantDiffs = useMemo(() => getVariantDiffs(variants), [variants]);

  const harmonyPalette = useMemo(
    () => (data.brand ? resolveHarmonyPalette(data.brand) : null),
    [data.brand],
  );

  const hasColorOverrides = Object.keys(colorOverrides).length > 0;

  const handleColorChange = useCallback((key: ColorOverrideKey, value: string) => {
    setColorOverrides((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetColorOverrides = useCallback(() => {
    setColorOverrides({});
  }, []);

  const trackVariantSelection = useCallback((selected: CopyData, all: CopyData[]) => {
    const avgLength = all.reduce((sum, v) => sum + v.headline.length, 0) / all.length;
    const preference = selected.headline.length < avgLength * 0.85
      ? "short"
      : selected.headline.length > avgLength * 1.15
        ? "long"
        : "medium";

    setVariantPreferences((prev) => ({
      preferredHeadlineLength: preference,
      selectedCount: prev.selectedCount + 1,
    }));
  }, []);

  function handleVariantPick(copyId: string) {
    setSelectedId(copyId);
    const selected = variants.find((c) => (c.id ?? `${c.platform}-${c.variant}`) === copyId);
    if (selected) {
      trackVariantSelection(selected, variants);
    }
  }

  function getEditedCopy(copy: CopyData): CopyData {
    const copyId = copy.id ?? `${copy.platform}-${copy.variant}`;
    const edit = edits[copyId];
    if (!edit) return copy;
    return { ...copy, headline: edit.headline, bodyCopy: edit.bodyCopy, cta: edit.cta };
  }

  const updateEdit = useCallback((copyId: string, field: EditableField, value: string, original: CopyData) => {
    setEdits((prev) => ({
      ...prev,
      [copyId]: {
        headline: prev[copyId]?.headline ?? original.headline,
        bodyCopy: prev[copyId]?.bodyCopy ?? original.bodyCopy,
        cta: prev[copyId]?.cta ?? original.cta,
        [field]: value,
      },
    }));
  }, []);

  function resolvePlatform(platformStr: string): PlatformId {
    const lower = platformStr.toLowerCase();
    if (lower === "meta" || lower === "facebook" || lower === "instagram") return "meta";
    if (lower === "google") return "google";
    if (lower === "linkedin") return "linkedin";
    return "meta";
  }

  function getLimit(platformStr: string, field: EditableField): number {
    const pid = resolvePlatform(platformStr);
    const limits = PLATFORM_LIMITS[pid];
    if (field === "headline") return limits.headline;
    if (field === "bodyCopy") return "bodyCopy" in limits ? (limits as { bodyCopy: number }).bodyCopy : 9999;
    if (field === "cta") return limits.cta;
    return 9999;
  }

  function getCharLimits(platformStr: string): { headline: number; bodyCopy: number; cta: number } {
    return { headline: getLimit(platformStr, "headline"), bodyCopy: getLimit(platformStr, "bodyCopy"), cta: getLimit(platformStr, "cta") };
  }

  const allViolations = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const copy of variants) {
      const copyId = copy.id ?? `${copy.platform}-${copy.variant}`;
      const edited = getEditedCopy(copy);
      const pid = resolvePlatform(copy.platform);
      const validation = validateCopyLimits(pid, { headline: edited.headline, bodyCopy: edited.bodyCopy, cta: edited.cta });
      if (!validation.valid) { result[copyId] = validation.violations; }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants, edits]);

  const hasAnyViolation = Object.keys(allViolations).length > 0;

  if (!data.brand || variants.length === 0 || !harmonyPalette) return null;

  const Preview = PREVIEW_COMPONENTS[format];

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    const url = URL.createObjectURL(file);
    setBgImages((prev) => ({ ...prev, [uploadTarget]: url }));
    setUploadTarget(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (e.target) e.target.value = "";
  }

  function colorOverrideString(): string {
    if (!hasColorOverrides) return "";
    const parts = Object.entries(colorOverrides).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}:${v}`);
    return ` [colors: ${parts.join(",")}]`;
  }

  const [showPro, setShowPro] = useState(false);

  // For publish: use selected variant or first
  const selectedCopy = selectedId
    ? variants.find((c) => (c.id ?? `${c.platform}-${c.variant}`) === selectedId) ?? variants[0]!
    : variants[0]!;

  return (
    <div className="animate-card-in mt-2 overflow-hidden rounded-2xl border border-border/30 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] backdrop-blur-xl">

      {/* ── Format + Layout bar ──────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border/20 px-4 py-2">
        {FORMAT_TABS.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button key={tab.id} onClick={() => { setFormat(tab.id); setSelectedId(null); setMobileIndex(0); }} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${format === tab.id ? "bg-white text-foreground shadow-sm ring-1 ring-border/30" : "text-muted-foreground hover:text-foreground"}`}>
              <TabIcon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
        <div className="mx-1 h-4 w-px bg-border/30" />
        {LAYOUT_OPTIONS.map((opt) => {
          const LayoutIcon = opt.icon;
          return (
            <button key={opt.id} onClick={() => setLayout(opt.id)} className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${layout === opt.id ? "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200" : "text-muted-foreground hover:bg-muted/30"}`}>
              <LayoutIcon className="h-3.5 w-3.5" />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* ── Strategy insight (if available) ────────────────────── */}
      {data.strategy && (
        <div className="flex items-center gap-2 border-b border-border/10 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 px-3 py-1.5">
          <Sparkles className="h-3 w-3 shrink-0 text-indigo-500" />
          <span className="text-[10px] font-medium text-indigo-700">{data.strategy.recommendation}</span>
        </div>
      )}

      {/* ── Two variants side by side (desktop) / carousel (mobile) */}
      <div>
        {/* Desktop: side by side */}
        <div className="hidden gap-4 p-4 sm:grid sm:grid-cols-2">
          {variants.map((copy, vi) => {
            const copyId = copy.id ?? `${copy.platform}-${copy.variant}`;
            // Use different background for variant B
            const variantBg = vi === 1 && data.backgroundUrlB ? data.backgroundUrlB : bgImages[copyId];
            return (
              <div key={`${format}-${layout}-${copyId}`} className="animate-card-in" style={{ animationDelay: `${vi * 150}ms`, animationFillMode: "both" }}>
              <Preview
                copy={getEditedCopy(copy)}
                brand={data.brand!}
                bgImage={variantBg}
                isSelected={selectedId === copyId}
                isLoser={selectedId !== null && selectedId !== copyId}
                onPick={() => handleVariantPick(copyId)}
                layout={layout}
                onEditField={(field, value) => updateEdit(copyId, field, value, copy)}
                charLimits={getCharLimits(copy.platform)}
                colorOverrides={colorOverrides}
                onColorChange={handleColorChange}
                harmonyPalette={harmonyPalette}
                logoPosition={logoPosition}
                onLogoPositionChange={setLogoPosition}
                diffs={variantDiffs.get(copyId)}
              />
              </div>
            );
          })}
        </div>

        {/* Mobile: swipeable single */}
        <div className="p-4 sm:hidden">
          {variants[mobileIndex] && (() => {
            const copy = variants[mobileIndex]!;
            const copyId = copy.id ?? `${copy.platform}-${copy.variant}`;
            return (
              <div className="relative">
                <Preview
                  copy={getEditedCopy(copy)}
                  brand={data.brand!}
                  bgImage={bgImages[copyId]}
                    isSelected={selectedId === copyId}
                  isLoser={selectedId !== null && selectedId !== copyId}
                  onPick={() => handleVariantPick(copyId)}
                  layout={layout}
                  onEditField={(field, value) => updateEdit(copyId, field, value, copy)}
                  charLimits={getCharLimits(copy.platform)}
                  colorOverrides={colorOverrides}
                  onColorChange={handleColorChange}
                  harmonyPalette={harmonyPalette}
                  logoPosition={logoPosition}
                  onLogoPositionChange={setLogoPosition}
                  diffs={variantDiffs.get(copyId)}
                />
                {mobileIndex > 0 && (
                  <button onClick={() => setMobileIndex((i) => i - 1)} className="absolute -left-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                )}
                {mobileIndex < variants.length - 1 && (
                  <button onClick={() => setMobileIndex((i) => i + 1)} className="absolute -right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })()}
          <div className="mt-2 flex justify-center gap-1.5">
            {variants.map((_, i) => (
              <button key={i} onClick={() => setMobileIndex(i)} className={`h-1.5 rounded-full transition-all ${i === mobileIndex ? "w-5 bg-indigo-500" : "w-1.5 bg-border/50"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Action Buttons ─────────────────────────────────────── */}
      <div className="border-t border-border/20 px-4 py-3">
        {/* Primary actions */}
        <div className="flex items-center gap-2">
          <button
            disabled={hasAnyViolation}
            onClick={() => {
              if (hasAnyViolation) return;
              const edited = getEditedCopy(selectedCopy);
              const colors = colorOverrideString();
              onSendMessage?.(`Ser bra ut, publicera! [headline: ${edited.headline}] [body: ${edited.bodyCopy}] [cta: ${edited.cta}]${colors}`);
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold shadow-sm transition-all ${
              hasAnyViolation
                ? "cursor-not-allowed bg-gray-200 text-gray-400"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 hover:shadow-md"
            }`}
          >
            Publicera
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {/* Retention quickpicks — drives iteration and engagement */}
        <div className="mt-1.5 flex gap-1.5 overflow-x-auto">
          {[
            { label: "Gör mer premium", prompt: "Gör annonsen mer premium och exklusiv" },
            { label: "Mer aggressiv", prompt: "Gör annonsen mer aggressiv med starkare CTA" },
            { label: "Kortare text", prompt: "Gör texten kortare och punchigare" },
            { label: "Fler varianter", prompt: "Visa fler varianter" },
          ].map((q) => (
            <button
              key={q.label}
              onClick={() => onSendMessage?.(q.prompt)}
              className="shrink-0 rounded-full border border-border/30 bg-muted/10 px-2.5 py-1 text-[9px] font-medium text-muted-foreground transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── PRO Section (collapsed) ──────────────────────────────── */}
      <div className="border-t border-border/20">
        <button
          onClick={() => setShowPro(!showPro)}
          className="flex w-full items-center gap-2 px-4 py-2 text-[10px] font-medium text-muted-foreground/50 transition-colors hover:bg-muted/10 hover:text-muted-foreground"
        >
          <ChevronUp className={`h-2.5 w-2.5 transition-transform duration-200 ${showPro ? "" : "rotate-180"}`} />
          Fler alternativ
          <span className="rounded bg-indigo-50 px-1 py-0.5 text-[7px] font-bold text-indigo-400">PRO</span>
        </button>

        {showPro && (
          <div className="space-y-2 border-t border-border/10 px-3 pb-2 pt-1.5">

            {/* Color overrides */}
            {hasColorOverrides && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {Object.entries(colorOverrides).map(([key, value]) => value ? (
                    <div key={key} className="h-4 w-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: value }} />
                  ) : null)}
                </div>
                <button onClick={resetColorOverrides} className="text-[9px] font-medium text-amber-600 hover:underline">
                  Återställ färger
                </button>
              </div>
            )}

            {/* Template chips */}
            <div>
              <div className="mb-1 text-[8px] font-semibold uppercase tracking-wider text-muted-foreground/40">Mall</div>
              <div className="flex gap-1">
                {[
                  { id: "logo-headline", label: "Logo + rubrik" },
                  { id: "stat-impact", label: "Siffra + impact" },
                  { id: "testimonial", label: "Kundreferens" },
                  { id: "minimal", label: "Minimalistisk" },
                ].map((t) => (
                  <button key={t.id} className="rounded-full border border-border/30 px-2 py-0.5 text-[9px] font-medium text-muted-foreground transition-all hover:border-indigo-300 hover:text-indigo-600" onClick={() => onSendMessage?.(`Byt till mall: ${t.label}`)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload background */}
            <button onClick={() => { const cid = selectedCopy.id ?? `${selectedCopy.platform}-${selectedCopy.variant}`; setUploadTarget(cid); fileInputRef.current?.click(); }} className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border/40 px-3 py-1.5 text-[10px] text-muted-foreground hover:border-indigo-300 hover:text-indigo-600">
              <ImagePlus className="h-3 w-3" />
              Ladda upp bakgrundsbild
            </button>
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
    </div>
  );
}
