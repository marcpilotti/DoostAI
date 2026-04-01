import React from "react";

import type { AdContent, BrandInput } from "../types";

export function MetaMinimal(brand: BrandInput, content: AdContent) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: 1080,
        height: 1080,
        background: `linear-gradient(135deg, ${brand.colors.primary} 0%, ${brand.colors.secondary} 100%)`,
        padding: 80,
        fontFamily: brand.fonts.heading,
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          flex: 1,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.15,
            maxWidth: 800,
            display: "flex",
          }}
        >
          {content.headline}
        </div>
        {content.bodyCopy && (
          <div
            style={{
              fontSize: 28,
              color: "rgba(255,255,255,0.85)",
              marginTop: 24,
              maxWidth: 700,
              lineHeight: 1.4,
              display: "flex",
              fontFamily: brand.fonts.body,
            }}
          >
            {content.bodyCopy}
          </div>
        )}
        {content.cta && (
          <div
            style={{
              display: "flex",
              marginTop: 48,
              background: "#ffffff",
              color: brand.colors.primary,
              fontSize: 24,
              fontWeight: 600,
              padding: "16px 48px",
              borderRadius: 12,
            }}
          >
            {content.cta}
          </div>
        )}
      </div>

      {/* Logo bottom-right */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: 48,
          right: 48,
          alignItems: "center",
          gap: 12,
        }}
      >
        {brand.logos.primary && (
          <img
            src={brand.logos.primary}
            width={40}
            height={40}
            style={{ borderRadius: 8 }}
          />
        )}
        <div
          style={{
            fontSize: 20,
            color: "rgba(255,255,255,0.7)",
            fontWeight: 500,
            display: "flex",
          }}
        >
          {brand.name}
        </div>
      </div>
    </div>
  );
}
