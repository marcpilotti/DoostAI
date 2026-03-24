import React from "react";

import type { AdContent, BrandInput } from "../types";

export function LinkedInCorporate(brand: BrandInput, content: AdContent) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: 1200,
        height: 627,
        background: `linear-gradient(135deg, ${brand.colors.primary} 0%, ${brand.colors.accent} 60%, ${brand.colors.secondary} 100%)`,
        padding: 60,
        fontFamily: brand.fonts.heading,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Geometric accent shapes */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -80,
          right: -80,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: -40,
          right: 200,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
        }}
      />

      {/* Top — headline + subtext */}
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 800, zIndex: 1 }}>
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.2,
            display: "flex",
          }}
        >
          {content.headline}
        </div>
        {content.bodyCopy && (
          <div
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.8)",
              marginTop: 16,
              lineHeight: 1.4,
              fontFamily: brand.fonts.body,
              display: "flex",
              maxWidth: 650,
            }}
          >
            {content.bodyCopy}
          </div>
        )}
      </div>

      {/* Bottom — CTA + logo */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          zIndex: 1,
        }}
      >
        {content.cta && (
          <div
            style={{
              display: "flex",
              background: "#ffffff",
              color: brand.colors.primary,
              fontSize: 20,
              fontWeight: 600,
              padding: "14px 40px",
              borderRadius: 8,
            }}
          >
            {content.cta}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {brand.logos.primary && (
            <img
              src={brand.logos.primary}
              width={36}
              height={36}
              style={{ borderRadius: 6 }}
            />
          )}
          <div
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.7)",
              fontWeight: 500,
              display: "flex",
            }}
          >
            {brand.name}
          </div>
        </div>
      </div>
    </div>
  );
}
