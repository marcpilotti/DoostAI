import React from "react";

import type { AdContent, BrandInput } from "../types";

export function GoogleStandard(brand: BrandInput, content: AdContent) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 600,
        padding: 32,
        background: "#ffffff",
        fontFamily: brand.fonts.body,
      }}
    >
      {/* Ad label */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div
          style={{
            display: "flex",
            fontSize: 11,
            fontWeight: 700,
            color: "#1a73e8",
            background: "#e8f0fe",
            padding: "2px 6px",
            borderRadius: 3,
          }}
        >
          Ad
        </div>
        <div style={{ fontSize: 13, color: "#202124", display: "flex" }}>
          {brand.name}
        </div>
      </div>

      {/* Headline */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 400,
          color: "#1a0dab",
          lineHeight: 1.3,
          display: "flex",
          fontFamily: brand.fonts.heading,
        }}
      >
        {content.headline}
      </div>

      {/* Description */}
      {content.bodyCopy && (
        <div
          style={{
            fontSize: 14,
            color: "#4d5156",
            lineHeight: 1.5,
            marginTop: 6,
            display: "flex",
          }}
        >
          {content.bodyCopy}
        </div>
      )}

      {/* Sitelinks */}
      {content.sitelinks && content.sitelinks.length > 0 && (
        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          {content.sitelinks.map((link, i) => (
            <div
              key={i}
              style={{
                fontSize: 13,
                color: "#1a0dab",
                display: "flex",
              }}
            >
              {link.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
