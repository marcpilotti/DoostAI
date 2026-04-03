"use client";

/**
 * Hero Ad Preview — image/gradient background with dark overlay, headline + CTA
 * Pure CSS, no Satori needed. Used in AdViewSlide + EditOverlay.
 */

type AdPreviewHeroProps = {
  headline: string;
  bodyCopy: string;
  cta: string;
  brandName: string;
  logoUrl?: string;
  imageUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
};

export function AdPreviewHero({
  headline,
  bodyCopy,
  cta,
  brandName,
  logoUrl,
  imageUrl,
  primaryColor,
  secondaryColor,
}: AdPreviewHeroProps) {
  const gradientBg = secondaryColor
    ? `linear-gradient(145deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
    : `linear-gradient(145deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`;

  return (
    <div
      className="relative flex aspect-square w-full flex-col justify-end overflow-hidden"
      style={{ borderRadius: "inherit" }}
    >
      {/* Background: image or gradient */}
      {imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {/* Dark gradient overlay from bottom */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${primaryColor}F0 0%, ${primaryColor}80 45%, transparent 100%)`,
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: gradientBg }}>
          {/* Decorative elements on gradient */}
          <div
            className="absolute -right-8 -top-8 h-32 w-32 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          <div
            className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full"
            style={{ background: "rgba(255,255,255,0.04)" }}
          />
        </div>
      )}

      {/* Logo top-left */}
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className="absolute left-3 top-3 z-10 h-7 w-7 rounded-md object-contain"
          style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: 3 }}
        />
      )}

      {/* Content — bottom aligned */}
      <div className="relative z-10 flex flex-col gap-2 p-5">
        <h3
          className="text-[15px] font-extrabold leading-tight drop-shadow-md"
          style={{ color: "#FFFFFF" }}
        >
          {headline}
        </h3>
        <p
          className="text-[11px] leading-relaxed drop-shadow-md"
          style={{ color: "rgba(255,255,255,0.8)" }}
        >
          {bodyCopy}
        </p>

        {/* CTA button */}
        <div className="mt-1 flex">
          <span
            className="inline-flex items-center gap-1 rounded-lg px-4 py-1.5 text-[11px] font-bold"
            style={{
              background: "rgba(255,255,255,0.95)",
              color: primaryColor,
            }}
          >
            {cta} <span className="text-[10px]">→</span>
          </span>
        </div>

        {/* Brand watermark */}
        <span
          className="mt-0.5 text-[9px] font-medium"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          {brandName}
        </span>
      </div>
    </div>
  );
}
