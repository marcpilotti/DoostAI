import React from "react";

import type { AdContent, BrandInput } from "../types";

export function GoogleExtended(brand: BrandInput, content: AdContent) {
  const descriptions = content.descriptions ?? [content.bodyCopy ?? ""];

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

      {/* Descriptions */}
      {descriptions.map((desc, i) => (
        <div
          key={i}
          style={{
            fontSize: 14,
            color: "#4d5156",
            lineHeight: 1.5,
            marginTop: i === 0 ? 6 : 2,
            display: "flex",
          }}
        >
          {desc}
        </div>
      ))}

      {/* Callout extensions */}
      {content.callouts && content.callouts.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {content.callouts.map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                fontSize: 12,
                color: "#4d5156",
                background: "#f1f3f4",
                padding: "3px 8px",
                borderRadius: 4,
              }}
            >
              {c}
            </div>
          ))}
        </div>
      )}

      {/* Sitelinks */}
      {content.sitelinks && content.sitelinks.length > 0 && (
        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          {content.sitelinks.map((link, i) => (
            <div key={i} style={{ fontSize: 13, color: "#1a0dab", display: "flex" }}>
              {link.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
