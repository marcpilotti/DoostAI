/**
 * Hero Ad Template — image background with gradient overlay + headline + CTA
 * Rendered via Satori to 1080x1080 PNG
 */

import { type BrandGradient } from "../gradients";

export type HeroTemplateProps = {
  headline: string;
  bodyCopy: string;
  cta: string;
  brandName: string;
  logoUrl?: string;
  imageUrl?: string;
  gradient: BrandGradient;
  primaryColor: string;
};

export function HeroTemplate({
  headline,
  bodyCopy,
  cta,
  brandName,
  logoUrl,
  imageUrl,
  gradient,
  primaryColor,
}: HeroTemplateProps) {
  const textColor = gradient.isDark ? "#FFFFFF" : "#1A1A1A";
  const ctaBg = gradient.isDark ? "#FFFFFF" : primaryColor;
  const ctaText = gradient.isDark ? primaryColor : "#FFFFFF";

  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        fontFamily: "Inter, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background image or gradient */}
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt=""
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 1080,
              height: 1080,
              objectFit: "cover",
            }}
          />
          {/* Dark gradient overlay for text readability */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 700,
              background: `linear-gradient(to top, ${primaryColor}F0 0%, ${primaryColor}90 40%, transparent 100%)`,
            }}
          />
        </>
      ) : (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1080,
            height: 1080,
            background: gradient.css,
          }}
        />
      )}

      {/* Content */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          padding: "60px 64px",
          gap: 24,
        }}
      >
        {/* Logo */}
        {logoUrl && (
          <img
            src={logoUrl}
            alt=""
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              objectFit: "contain",
              backgroundColor: "rgba(255,255,255,0.15)",
            }}
          />
        )}

        {/* Headline */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: imageUrl ? "#FFFFFF" : textColor,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            textShadow: imageUrl ? "0 2px 12px rgba(0,0,0,0.3)" : "none",
            maxWidth: 800,
          }}
        >
          {headline}
        </div>

        {/* Body */}
        <div
          style={{
            fontSize: 28,
            color: imageUrl ? "rgba(255,255,255,0.85)" : `${textColor}CC`,
            lineHeight: 1.4,
            maxWidth: 700,
          }}
        >
          {bodyCopy}
        </div>

        {/* CTA Button */}
        <div
          style={{
            display: "flex",
            marginTop: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "18px 40px",
              borderRadius: 12,
              background: ctaBg,
              color: ctaText,
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            {cta}
            <span style={{ fontSize: 20 }}>→</span>
          </div>
        </div>

        {/* Brand name watermark */}
        <div
          style={{
            fontSize: 16,
            color: imageUrl ? "rgba(255,255,255,0.4)" : `${textColor}40`,
            fontWeight: 500,
            marginTop: 8,
          }}
        >
          {brandName}
        </div>
      </div>
    </div>
  );
}
