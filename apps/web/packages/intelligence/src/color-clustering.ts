/**
 * CIELAB color clustering for perceptual brand palette extraction.
 *
 * Replaces naive brightness/saturation filtering with Delta-E distance-based
 * agglomerative clustering.  Groups visually identical colors, then classifies
 * each cluster by perceptual role (brand, background, text).
 *
 * Zero npm dependencies — pure math.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Lab = { L: number; a: number; b: number };
type Rgb = { r: number; g: number; b: number };

export type ClusteredColor = {
  hex: string;
  role: "brand" | "background" | "text";
  count: number;
};

// ---------------------------------------------------------------------------
// Hex <-> RGB helpers
// ---------------------------------------------------------------------------

/** Normalize any valid CSS hex (#abc or #aabbcc) to a 6-digit lowercase form. */
function normalizeHex(hex: string): string | null {
  const h = hex.replace("#", "").toLowerCase();
  if (h.length === 3) {
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  if (h.length === 6) {
    return `#${h}`;
  }
  return null; // invalid
}

function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(rgb: Rgb): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

// ---------------------------------------------------------------------------
// RGB -> CIELAB conversion (via XYZ, D65 illuminant)
// ---------------------------------------------------------------------------

/** sRGB channel (0-255) to linear (0-1). */
function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** Linear RGB -> CIE XYZ (D65 reference white). */
function rgbToXyz(rgb: Rgb): { x: number; y: number; z: number } {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  return {
    x: 0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
    y: 0.2126729 * r + 0.7151522 * g + 0.0721750 * b,
    z: 0.0193339 * r + 0.1191920 * g + 0.9503041 * b,
  };
}

// D65 reference white
const REF_X = 0.95047;
const REF_Y = 1.0;
const REF_Z = 1.08883;

function xyzToLab(x: number, y: number, z: number): Lab {
  const f = (t: number): number =>
    t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;

  const fx = f(x / REF_X);
  const fy = f(y / REF_Y);
  const fz = f(z / REF_Z);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

function rgbToLab(rgb: Rgb): Lab {
  const { x, y, z } = rgbToXyz(rgb);
  return xyzToLab(x, y, z);
}

// ---------------------------------------------------------------------------
// CIELAB -> RGB (reverse, for cluster centroids)
// ---------------------------------------------------------------------------

function labToXyz(lab: Lab): { x: number; y: number; z: number } {
  const fy = (lab.L + 16) / 116;
  const fx = lab.a / 500 + fy;
  const fz = fy - lab.b / 200;

  const fInv = (t: number): number =>
    t > 0.206893 ? t ** 3 : (t - 16 / 116) / 7.787;

  return {
    x: REF_X * fInv(fx),
    y: REF_Y * fInv(fy),
    z: REF_Z * fInv(fz),
  };
}

/** Linear (0-1) to sRGB channel (0-255). */
function linearToSrgb(c: number): number {
  const s = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(s * 255)));
}

function xyzToRgb(x: number, y: number, z: number): Rgb {
  return {
    r: linearToSrgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z),
    g: linearToSrgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
    b: linearToSrgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
  };
}

function labToRgb(lab: Lab): Rgb {
  const { x, y, z } = labToXyz(lab);
  return xyzToRgb(x, y, z);
}

// ---------------------------------------------------------------------------
// Delta-E (CIE76) — Euclidean distance in CIELAB
// ---------------------------------------------------------------------------

function deltaE(a: Lab, b: Lab): number {
  return Math.sqrt((a.L - b.L) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2);
}

// ---------------------------------------------------------------------------
// Role classification
// ---------------------------------------------------------------------------

/** Classify a color by its perceived brightness (L* channel in CIELAB). */
function classifyRole(lab: Lab): "brand" | "background" | "text" {
  // L* ranges 0 (black) to 100 (white).
  // We use the RGB brightness for the thresholds specified in the task
  // but L* maps directly: L*<15 is near-black text, L*>90 is near-white bg.
  const rgb = labToRgb(lab);
  const brightness = (rgb.r + rgb.g + rgb.b) / 3;

  if (brightness > 200) return "background";
  if (brightness < 30) return "text";
  return "brand";
}

// ---------------------------------------------------------------------------
// Agglomerative clustering
// ---------------------------------------------------------------------------

type Cluster = {
  centroid: Lab;
  members: { lab: Lab; hex: string }[];
};

/**
 * Cluster an array of hex colors using agglomerative clustering in CIELAB
 * space.  Colors within `threshold` Delta-E units are merged into one cluster.
 *
 * Returns cluster centroids sorted by descending member count.
 */
export function clusterColors(
  hexColors: string[],
  threshold = 15,
): ClusteredColor[] {
  // Normalize and deduplicate input, counting occurrences
  const counts = new Map<string, number>();
  for (const raw of hexColors) {
    const norm = normalizeHex(raw);
    if (!norm) continue;
    counts.set(norm, (counts.get(norm) ?? 0) + 1);
  }

  if (counts.size === 0) return [];

  // Initialize: one cluster per unique color
  const clusters: Cluster[] = [];
  for (const [hex, count] of counts) {
    const rgb = hexToRgb(hex);
    const lab = rgbToLab(rgb);
    const members = Array.from({ length: count }, () => ({ lab, hex }));
    clusters.push({ centroid: lab, members });
  }

  // Iteratively merge the closest pair until the minimum distance > threshold
  while (clusters.length > 1) {
    let minDist = Infinity;
    let mergeI = 0;
    let mergeJ = 1;

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const d = deltaE(clusters[i]!.centroid, clusters[j]!.centroid);
        if (d < minDist) {
          minDist = d;
          mergeI = i;
          mergeJ = j;
        }
      }
    }

    if (minDist >= threshold) break;

    // Merge j into i (weighted centroid)
    const ci = clusters[mergeI]!;
    const cj = clusters[mergeJ]!;
    const ni = ci.members.length;
    const nj = cj.members.length;
    const total = ni + nj;

    ci.centroid = {
      L: (ci.centroid.L * ni + cj.centroid.L * nj) / total,
      a: (ci.centroid.a * ni + cj.centroid.a * nj) / total,
      b: (ci.centroid.b * ni + cj.centroid.b * nj) / total,
    };
    ci.members.push(...cj.members);

    // Remove the merged cluster
    clusters.splice(mergeJ, 1);
  }

  // Sort by cluster size descending, map to output
  return clusters
    .sort((a, b) => b.members.length - a.members.length)
    .map((c) => ({
      hex: rgbToHex(labToRgb(c.centroid)),
      role: classifyRole(c.centroid),
      count: c.members.length,
    }));
}
