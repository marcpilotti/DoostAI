import React from "react";

import type { AdContent, BrandInput } from "../types";

export function LinkedInInsight(brand: BrandInput, content: AdContent) {
  const badge = content.badge ?? "NEW REPORT";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 1200,
        height: 627,
        background: "#ffffff",
        fontFamily: brand.fonts.heading,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Colored accent bar at top */}
      <div
        style={{
          display: "flex",
          width: 1200,
          height: 6,
          background: `linear-gradient(90deg, ${brand.colors.primary} 0%, ${brand.colors.secondary} 50%, ${brand.colors.accent} 100%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flex: 1,
          padding: "0 80px",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            background: brand.colors.primary,
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 1.5,
            padding: "6px 16px",
            borderRadius: 4,
            marginBottom: 28,
          }}
        >
          {badge}
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: brand.colors.text,
            lineHeight: 1.2,
            display: "flex",
            maxWidth: 900,
          }}
        >
          {content.headline}
        </div>

        {/* Body */}
        {content.bodyCopy && (
          <div
            style={{
              fontSize: 20,
              color: "#6b7280",
              marginTop: 16,
              lineHeight: 1.5,
              fontFamily: brand.fonts.body,
              display: "flex",
              maxWidth: 750,
            }}
          >
            {content.bodyCopy}
          </div>
        )}

        {/* CTA + logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: 32, marginTop: 36 }}>
          {content.cta && (
            <div
              style={{
                display: "flex",
                background: brand.colors.primary,
                color: "#ffffff",
                fontSize: 18,
                fontWeight: 600,
                padding: "12px 36px",
                borderRadius: 6,
              }}
            >
              {content.cta}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {brand.logos.primary && (
              <img
                src={brand.logos.primary}
                width={28}
                height={28}
                style={{ borderRadius: 4 }}
              />
            )}
            <div
              style={{
                fontSize: 15,
                color: "#9ca3af",
                fontWeight: 500,
                display: "flex",
              }}
            >
              {brand.name}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
