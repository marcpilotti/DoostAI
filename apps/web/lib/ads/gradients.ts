/**
 * Generate beautiful brand-matched gradients from brand colors.
 * Used as backgrounds in ad templates when no image is available.
 */

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;

  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return [h * 360, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h / 360 + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h / 360) * 255);
  const b = Math.round(hue2rgb(p, q, h / 360 - 1 / 3) * 255);

  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

export type BrandGradient = {
  css: string;
  colors: [string, string, string];
  angle: number;
  isDark: boolean;
};

export function generateBrandGradient(colors: {
  primary: string;
  secondary?: string;
  accent?: string;
}): BrandGradient {
  const [h, s, l] = hexToHsl(colors.primary);

  // Create a rich 3-stop gradient
  const c1 = colors.primary;
  const c2 = colors.secondary || hslToHex((h + 20) % 360, Math.min(s * 1.1, 1), Math.max(l - 0.1, 0.1));
  const c3 = colors.accent || hslToHex((h + 40) % 360, Math.min(s * 0.9, 1), Math.max(l - 0.2, 0.05));

  const angle = 135;
  const isDark = l < 0.5;

  return {
    css: `linear-gradient(${angle}deg, ${c1} 0%, ${c2} 50%, ${c3} 100%)`,
    colors: [c1, c2, c3],
    angle,
    isDark,
  };
}

export function getContrastColor(hex: string): string {
  const [, , l] = hexToHsl(hex);
  return l > 0.5 ? "#1A1A1A" : "#FFFFFF";
}

export function getDarkenedColor(hex: string, amount = 0.3): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.max(l - amount, 0));
}

export function getLightenedColor(hex: string, amount = 0.2): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.min(l + amount, 1));
}
