"use client";

/**
 * Brand Ad Preview — logo-centered, gradient background, clean typography
 * Pure CSS, no Satori needed. Used in AdViewSlide + EditOverlay.
 */

type AdPreviewBrandProps = {
  headline: string;
  bodyCopy: string;
  cta: string;
  brandName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
};

function lighten(hex: string, amount = 0.3): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function isDark(hex: string): boolean {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

export function AdPreviewBrand({
  headline,
  bodyCopy,
  cta,
  brandName,
  logoUrl,
  primaryColor,
  secondaryColor,
  accentColor,
}: AdPreviewBrandProps) {
  const dark = isDark(primaryColor);
  const textColor = dark ? "#FFFFFF" : "#1A1A1A";
  const subtleColor = dark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.5)";
  const ctaBg = dark ? "rgba(255,255,255,0.95)" : primaryColor;
  const ctaText = dark ? primaryColor : "#FFFFFF";
  const accentLine = accentColor || lighten(primaryColor, 0.15);
  const c2 = secondaryColor || lighten(primaryColor, -0.1);

  return (
    <div
      className="relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden text-center"
      style={{
        borderRadius: "inherit",
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${c2} 100%)`,
      }}
    >
      {/* Decorative circles */}
      <div
        className="absolute -right-10 -top-10 h-28 w-28 rounded-full"
        style={{ background: `${accentLine}18` }}
      />
      <div
        className="absolute -bottom-6 -left-6 h-16 w-16 rounded-full"
        style={{ background: `${accentLine}12` }}
      />
      <div
        className="absolute right-6 top-1/3 h-10 w-10 rounded-full"
        style={{ background: `${accentLine}0A` }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-2 px-6">
        {/* Logo */}
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="mb-1 h-11 w-11 rounded-xl object-contain"
            style={{
              backgroundColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
              padding: 4,
            }}
          />
        ) : (
          <div
            className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl text-lg font-extrabold"
            style={{
              backgroundColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
              color: textColor,
            }}
          >
            {brandName.charAt(0)}
          </div>
        )}

        {/* Brand name */}
        <span
          className="text-[9px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: subtleColor }}
        >
          {brandName}
        </span>

        {/* Accent line */}
        <div
          className="my-0.5 h-[2px] w-8 rounded-full"
          style={{ background: accentLine }}
        />

        {/* Headline */}
        <h3
          className="text-[14px] font-extrabold leading-tight"
          style={{ color: textColor }}
        >
          {headline}
        </h3>

        {/* Body */}
        <p
          className="text-[10px] leading-relaxed"
          style={{ color: subtleColor, maxWidth: 200 }}
        >
          {bodyCopy}
        </p>

        {/* CTA button */}
        <span
          className="mt-1.5 inline-flex items-center gap-1 rounded-lg px-4 py-1.5 text-[11px] font-bold shadow-sm"
          style={{ background: ctaBg, color: ctaText }}
        >
          {cta} <span className="text-[10px]">→</span>
        </span>
      </div>
    </div>
  );
}
