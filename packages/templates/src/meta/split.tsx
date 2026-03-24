import React from "react";

import type { AdContent, BrandInput } from "../types";

export function MetaSplit(brand: BrandInput, content: AdContent) {
  return (
    <div
      style={{
        display: "flex",
        width: 1080,
        height: 1080,
        fontFamily: brand.fonts.heading,
      }}
    >
      {/* Left half — gradient with headline */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: 540,
          height: 1080,
          background: `linear-gradient(180deg, ${brand.colors.primary} 0%, ${brand.colors.accent} 100%)`,
          padding: 60,
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.15,
            display: "flex",
          }}
        >
          {content.headline}
        </div>

        {brand.logos.primary && (
          <div style={{ display: "flex", marginTop: 40, alignItems: "center", gap: 10 }}>
            <img
              src={brand.logos.primary}
              width={32}
              height={32}
              style={{ borderRadius: 6 }}
            />
            <div
              style={{
                fontSize: 16,
                color: "rgba(255,255,255,0.7)",
                fontWeight: 500,
                display: "flex",
              }}
            >
              {brand.name}
            </div>
          </div>
        )}
      </div>

      {/* Right half — solid color with body + CTA */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: 540,
          height: 1080,
          background: brand.colors.background,
          padding: 60,
        }}
      >
        {content.bodyCopy && (
          <div
            style={{
              fontSize: 26,
              color: brand.colors.text,
              lineHeight: 1.5,
              fontFamily: brand.fonts.body,
              display: "flex",
            }}
          >
            {content.bodyCopy}
          </div>
        )}
        {content.cta && (
          <div
            style={{
              display: "flex",
              marginTop: 40,
              background: brand.colors.primary,
              color: "#ffffff",
              fontSize: 22,
              fontWeight: 600,
              padding: "14px 36px",
              borderRadius: 10,
              alignSelf: "flex-start",
            }}
          >
            {content.cta}
          </div>
        )}
      </div>
    </div>
  );
}
