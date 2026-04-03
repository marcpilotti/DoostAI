/**
 * Brand Ad Template — logo-focused, gradient background, clean typography
 * Rendered via Satori to 1080x1080 PNG
 */

import { type BrandGradient, getLightenedColor } from "../gradients";

export type BrandTemplateProps = {
  headline: string;
  bodyCopy: string;
  cta: string;
  brandName: string;
  logoUrl?: string;
  gradient: BrandGradient;
  primaryColor: string;
};

export function BrandTemplate({
  headline,
  bodyCopy,
  cta,
  brandName,
  logoUrl,
  gradient,
  primaryColor,
}: BrandTemplateProps) {
  const textColor = gradient.isDark ? "#FFFFFF" : "#1A1A1A";
  const subtleColor = gradient.isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)";
  const ctaBg = gradient.isDark ? "#FFFFFF" : primaryColor;
  const ctaText = gradient.isDark ? primaryColor : "#FFFFFF";
  const logoBg = gradient.isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)";
  const accentLine = getLightenedColor(primaryColor, 0.2);

  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        background: gradient.css,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          top: -200,
          right: -200,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `${accentLine}15`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -150,
          left: -150,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `${accentLine}10`,
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "80px 80px",
          gap: 32,
          position: "relative",
        }}
      >
        {/* Logo */}
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            style={{
              width: 88,
              height: 88,
              borderRadius: 20,
              objectFit: "contain",
              backgroundColor: logoBg,
              padding: 12,
            }}
          />
        ) : (
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 20,
              backgroundColor: logoBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 800,
              color: textColor,
            }}
          >
            {brandName.charAt(0)}
          </div>
        )}

        {/* Brand name */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: subtleColor,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {brandName}
        </div>

        {/* Accent line */}
        <div
          style={{
            width: 60,
            height: 3,
            borderRadius: 2,
            background: accentLine,
          }}
        />

        {/* Headline */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: textColor,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            maxWidth: 750,
          }}
        >
          {headline}
        </div>

        {/* Body */}
        <div
          style={{
            fontSize: 26,
            color: subtleColor,
            lineHeight: 1.5,
            maxWidth: 650,
          }}
        >
          {bodyCopy}
        </div>

        {/* CTA Button */}
        <div
          style={{
            display: "flex",
            marginTop: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "20px 48px",
              borderRadius: 14,
              background: ctaBg,
              color: ctaText,
              fontSize: 24,
              fontWeight: 700,
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            }}
          >
            {cta}
            <span style={{ fontSize: 20 }}>→</span>
          </div>
        </div>
      </div>
    </div>
  );
}
