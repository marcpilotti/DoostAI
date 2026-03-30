import React from "react";

import type { BlockConfig, LayoutDefinition, TemplateInput } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve a colour with a fallback chain. */
function color(input: TemplateInput, key: "primary" | "secondary" | "accent"): string {
  const c = input.brand.colors;
  if (key === "secondary") return c.secondary ?? c.primary;
  if (key === "accent") return c.accent ?? c.secondary ?? c.primary;
  return c.primary;
}

/** Heading font family, falling back to Inter. */
function headingFont(input: TemplateInput): string {
  return input.brand.fonts?.heading ?? "Inter";
}

/** Body font family, falling back to Inter. */
function bodyFont(input: TemplateInput): string {
  return input.brand.fonts?.body ?? "Inter";
}

/** Map aspect-ratio string to pixel dimensions for a preview container. */
function previewDimensions(layout: LayoutDefinition): {
  width: number;
  height: number;
} {
  return layout.dimensions;
}

// ---------------------------------------------------------------------------
// Block renderers
//
// Each block type maps to a self-contained rendering function that returns a
// styled <div> tree.  They receive the layout dimensions, input data, and the
// block's own configuration props so they can adapt.
// ---------------------------------------------------------------------------

type BlockRenderer = (
  input: TemplateInput,
  dims: { width: number; height: number },
  props: Record<string, unknown>,
) => React.ReactElement;

// ── Hero ────────────────────────────────────────────────────────────────────

const renderHero: BlockRenderer = (input, dims, props) => {
  const alignment = (props.alignment as string) ?? "center";
  const textSize = (props.textSize as string) ?? "lg";
  const style = (props.style as string) ?? "default";

  const defaultSize = Math.round(dims.width * 0.065);
  const headlineSizes: Record<string, number> = {
    sm: Math.round(dims.width * 0.045),
    md: Math.round(dims.width * 0.055),
    lg: defaultSize,
    xl: Math.round(dims.width * 0.075),
  };
  const fontSize: number = headlineSizes[textSize] ?? defaultSize;
  const bodySize = Math.round(fontSize * 0.45);
  const ctaSize = Math.round(fontSize * 0.38);

  const isCorporate = style === "corporate";
  const bgGradient = isCorporate
    ? `linear-gradient(160deg, ${color(input, "primary")} 0%, ${color(input, "secondary")} 100%)`
    : `linear-gradient(135deg, ${color(input, "primary")} 0%, ${color(input, "accent")} 100%)`;

  const alignItems: Record<string, string> = {
    center: "center",
    left: "flex-start",
    right: "flex-end",
    bottom: "center",
  };
  const justifyContent: Record<string, string> = {
    center: "center",
    left: "center",
    right: "center",
    bottom: "flex-end",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: alignItems[alignment] ?? "center",
        justifyContent: justifyContent[alignment] ?? "center",
        width: dims.width,
        height: dims.height,
        background: input.backgroundUrl
          ? `url(${input.backgroundUrl})`
          : bgGradient,
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: Math.round(dims.width * 0.07),
        fontFamily: headingFont(input),
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Optional overlay for background images */}
      {input.backgroundUrl && (
        <div
          style={{
            display: "flex",
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, rgba(0,0,0,0.3) 0%, ${color(input, "primary")}cc 100%)`,
          }}
        />
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: alignItems[alignment] ?? "center",
          textAlign: alignment === "center" ? "center" : "left",
          zIndex: 1,
          maxWidth: Math.round(dims.width * 0.85),
        }}
      >
        <div
          style={{
            fontSize,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.15,
            display: "flex",
          }}
        >
          {input.headline}
        </div>

        {input.bodyCopy && (
          <div
            style={{
              fontSize: bodySize,
              color: "rgba(255,255,255,0.85)",
              marginTop: Math.round(fontSize * 0.35),
              lineHeight: 1.4,
              display: "flex",
              fontFamily: bodyFont(input),
              maxWidth: Math.round(dims.width * 0.75),
            }}
          >
            {input.bodyCopy}
          </div>
        )}

        {input.cta && (
          <div
            style={{
              display: "flex",
              marginTop: Math.round(fontSize * 0.65),
              background: "#ffffff",
              color: color(input, "primary"),
              fontSize: ctaSize,
              fontWeight: 600,
              padding: `${Math.round(ctaSize * 0.6)}px ${Math.round(ctaSize * 1.8)}px`,
              borderRadius: Math.round(ctaSize * 0.45),
            }}
          >
            {input.cta}
          </div>
        )}
      </div>

      {/* Logo watermark */}
      {input.brand.logoUrl && (
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: Math.round(dims.height * 0.04),
            right: Math.round(dims.width * 0.04),
            alignItems: "center",
            gap: Math.round(dims.width * 0.01),
            zIndex: 1,
          }}
        >
          <img
            src={input.brand.logoUrl}
            width={Math.round(dims.width * 0.035)}
            height={Math.round(dims.width * 0.035)}
            style={{ borderRadius: Math.round(dims.width * 0.007) }}
          />
          <div
            style={{
              fontSize: Math.round(dims.width * 0.018),
              color: "rgba(255,255,255,0.7)",
              fontWeight: 500,
              display: "flex",
            }}
          >
            {input.brand.name}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Split ───────────────────────────────────────────────────────────────────

const renderSplit: BlockRenderer = (input, dims, props) => {
  const imagePosition = (props.imagePosition as string) ?? "right";
  const halfW = Math.round(dims.width / 2);
  const pad = Math.round(dims.width * 0.055);
  const headlineSize = Math.round(dims.width * 0.048);
  const bodySize = Math.round(headlineSize * 0.5);
  const ctaSize = Math.round(headlineSize * 0.42);

  const gradientPanel = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: halfW,
        height: dims.height,
        background: `linear-gradient(180deg, ${color(input, "primary")} 0%, ${color(input, "accent")} 100%)`,
        padding: pad,
      }}
    >
      <div
        style={{
          fontSize: headlineSize,
          fontWeight: 700,
          color: "#ffffff",
          lineHeight: 1.15,
          display: "flex",
          fontFamily: headingFont(input),
        }}
      >
        {input.headline}
      </div>

      {input.brand.logoUrl && (
        <div
          style={{
            display: "flex",
            marginTop: Math.round(pad * 0.7),
            alignItems: "center",
            gap: Math.round(pad * 0.2),
          }}
        >
          <img
            src={input.brand.logoUrl}
            width={Math.round(dims.width * 0.03)}
            height={Math.round(dims.width * 0.03)}
            style={{ borderRadius: Math.round(dims.width * 0.005) }}
          />
          <div
            style={{
              fontSize: Math.round(dims.width * 0.015),
              color: "rgba(255,255,255,0.7)",
              fontWeight: 500,
              display: "flex",
            }}
          >
            {input.brand.name}
          </div>
        </div>
      )}
    </div>
  );

  const contentPanel = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: halfW,
        height: dims.height,
        background: input.backgroundUrl
          ? `url(${input.backgroundUrl})`
          : "#f9fafb",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: pad,
      }}
    >
      {input.bodyCopy && (
        <div
          style={{
            fontSize: bodySize,
            color: "#374151",
            lineHeight: 1.5,
            fontFamily: bodyFont(input),
            display: "flex",
          }}
        >
          {input.bodyCopy}
        </div>
      )}
      {input.cta && (
        <div
          style={{
            display: "flex",
            marginTop: Math.round(pad * 0.7),
            background: color(input, "primary"),
            color: "#ffffff",
            fontSize: ctaSize,
            fontWeight: 600,
            padding: `${Math.round(ctaSize * 0.6)}px ${Math.round(ctaSize * 1.6)}px`,
            borderRadius: Math.round(ctaSize * 0.45),
            alignSelf: "flex-start",
          }}
        >
          {input.cta}
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        width: dims.width,
        height: dims.height,
        fontFamily: headingFont(input),
      }}
    >
      {imagePosition === "left" ? (
        <>
          {contentPanel}
          {gradientPanel}
        </>
      ) : (
        <>
          {gradientPanel}
          {contentPanel}
        </>
      )}
    </div>
  );
};

// ── Minimal ─────────────────────────────────────────────────────────────────

const renderMinimal: BlockRenderer = (input, dims, props) => {
  const style = (props.style as string) ?? "default";
  const logoPosition = (props.logoPosition as string) ?? "bottom";

  // Google search-result style
  if (style === "search-result") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: dims.width,
          height: dims.height,
          padding: Math.round(dims.width * 0.053),
          background: "#ffffff",
          fontFamily: bodyFont(input),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: Math.round(dims.width * 0.013),
            marginBottom: Math.round(dims.height * 0.04),
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: Math.round(dims.width * 0.018),
              fontWeight: 700,
              color: "#1a73e8",
              background: "#e8f0fe",
              padding: `${Math.round(dims.width * 0.003)}px ${Math.round(dims.width * 0.01)}px`,
              borderRadius: 3,
            }}
          >
            Ad
          </div>
          <div
            style={{
              fontSize: Math.round(dims.width * 0.022),
              color: "#202124",
              display: "flex",
            }}
          >
            {input.brand.name}
          </div>
        </div>

        <div
          style={{
            fontSize: Math.round(dims.width * 0.033),
            fontWeight: 400,
            color: "#1a0dab",
            lineHeight: 1.3,
            display: "flex",
            fontFamily: headingFont(input),
          }}
        >
          {input.headline}
        </div>

        {input.bodyCopy && (
          <div
            style={{
              fontSize: Math.round(dims.width * 0.023),
              color: "#4d5156",
              lineHeight: 1.5,
              marginTop: Math.round(dims.height * 0.03),
              display: "flex",
            }}
          >
            {input.bodyCopy}
          </div>
        )}
      </div>
    );
  }

  // Default minimal style — gradient bg, centered text, clean
  const pad = Math.round(dims.width * 0.07);
  const headlineSize = Math.round(dims.width * 0.055);
  const bodySize = Math.round(headlineSize * 0.45);
  const ctaSize = Math.round(headlineSize * 0.38);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: dims.width,
        height: dims.height,
        background: `linear-gradient(135deg, ${color(input, "primary")} 0%, ${color(input, "secondary")} 100%)`,
        padding: pad,
        fontFamily: headingFont(input),
        position: "relative",
      }}
    >
      {/* Logo at top if requested */}
      {logoPosition === "top" && input.brand.logoUrl && (
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: Math.round(dims.height * 0.04),
            left: 0,
            right: 0,
            justifyContent: "center",
            alignItems: "center",
            gap: Math.round(dims.width * 0.015),
          }}
        >
          <img
            src={input.brand.logoUrl}
            width={Math.round(dims.width * 0.04)}
            height={Math.round(dims.width * 0.04)}
            style={{ borderRadius: Math.round(dims.width * 0.008) }}
          />
          <div
            style={{
              fontSize: Math.round(dims.width * 0.022),
              color: "rgba(255,255,255,0.8)",
              fontWeight: 600,
              display: "flex",
            }}
          >
            {input.brand.name}
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          maxWidth: Math.round(dims.width * 0.8),
        }}
      >
        <div
          style={{
            fontSize: headlineSize,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.15,
            display: "flex",
          }}
        >
          {input.headline}
        </div>
        {input.bodyCopy && (
          <div
            style={{
              fontSize: bodySize,
              color: "rgba(255,255,255,0.85)",
              marginTop: Math.round(headlineSize * 0.35),
              lineHeight: 1.4,
              display: "flex",
              fontFamily: bodyFont(input),
            }}
          >
            {input.bodyCopy}
          </div>
        )}
        {input.cta && (
          <div
            style={{
              display: "flex",
              marginTop: Math.round(headlineSize * 0.65),
              background: "#ffffff",
              color: color(input, "primary"),
              fontSize: ctaSize,
              fontWeight: 600,
              padding: `${Math.round(ctaSize * 0.6)}px ${Math.round(ctaSize * 1.8)}px`,
              borderRadius: Math.round(ctaSize * 0.45),
            }}
          >
            {input.cta}
          </div>
        )}
      </div>

      {/* Logo at bottom (default) */}
      {logoPosition !== "top" && input.brand.logoUrl && (
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: Math.round(dims.height * 0.04),
            right: Math.round(dims.width * 0.04),
            alignItems: "center",
            gap: Math.round(dims.width * 0.01),
          }}
        >
          <img
            src={input.brand.logoUrl}
            width={Math.round(dims.width * 0.035)}
            height={Math.round(dims.width * 0.035)}
            style={{ borderRadius: Math.round(dims.width * 0.007) }}
          />
          <div
            style={{
              fontSize: Math.round(dims.width * 0.018),
              color: "rgba(255,255,255,0.7)",
              fontWeight: 500,
              display: "flex",
            }}
          >
            {input.brand.name}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Bold ────────────────────────────────────────────────────────────────────

const renderBold: BlockRenderer = (input, dims, props) => {
  const ctaStyle = (props.ctaStyle as string) ?? "full-width";
  const style = (props.style as string) ?? "default";
  const pad = Math.round(dims.width * 0.07);
  const headlineSize = Math.round(dims.width * 0.07);
  const bodySize = Math.round(headlineSize * 0.38);
  const ctaSize = Math.round(headlineSize * 0.32);

  const isCorporate = style === "corporate";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: dims.width,
        height: dims.height,
        background: isCorporate
          ? `linear-gradient(160deg, ${color(input, "primary")} 0%, ${color(input, "secondary")} 100%)`
          : color(input, "primary"),
        padding: pad,
        fontFamily: headingFont(input),
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative accent circle */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: Math.round(dims.height * -0.1),
          right: Math.round(dims.width * -0.08),
          width: Math.round(dims.width * 0.4),
          height: Math.round(dims.width * 0.4),
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
        }}
      />

      {/* Top section — headline */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          maxWidth: Math.round(dims.width * 0.85),
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: headlineSize,
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.1,
            display: "flex",
            letterSpacing: "-0.02em",
          }}
        >
          {input.headline}
        </div>
        {input.bodyCopy && (
          <div
            style={{
              fontSize: bodySize,
              color: "rgba(255,255,255,0.8)",
              marginTop: Math.round(headlineSize * 0.3),
              lineHeight: 1.4,
              fontFamily: bodyFont(input),
              display: "flex",
              maxWidth: Math.round(dims.width * 0.7),
            }}
          >
            {input.bodyCopy}
          </div>
        )}
      </div>

      {/* Bottom section — CTA + logo */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: Math.round(pad * 0.5),
          zIndex: 1,
        }}
      >
        {input.cta && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              background: "#ffffff",
              color: color(input, "primary"),
              fontSize: ctaSize,
              fontWeight: 700,
              padding: `${Math.round(ctaSize * 0.7)}px ${Math.round(ctaSize * 2)}px`,
              borderRadius: ctaStyle === "pill"
                ? Math.round(ctaSize * 1.5)
                : Math.round(ctaSize * 0.35),
              ...(ctaStyle === "full-width" ? { width: "100%" } : { alignSelf: "flex-start" }),
            }}
          >
            {input.cta}
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: Math.round(dims.width * 0.01),
            }}
          >
            {input.brand.logoUrl && (
              <img
                src={input.brand.logoUrl}
                width={Math.round(dims.width * 0.03)}
                height={Math.round(dims.width * 0.03)}
                style={{ borderRadius: Math.round(dims.width * 0.005) }}
              />
            )}
            <div
              style={{
                fontSize: Math.round(dims.width * 0.016),
                color: "rgba(255,255,255,0.6)",
                fontWeight: 500,
                display: "flex",
              }}
            >
              {input.brand.name}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Sidebar ─────────────────────────────────────────────────────────────────

const renderSidebar: BlockRenderer = (input, dims, props) => {
  const _position = (props.position as string) ?? "left";
  const sideW = Math.round(dims.width * 0.35);
  const mainW = dims.width - sideW;
  const pad = Math.round(dims.width * 0.04);
  const headlineSize = Math.round(dims.width * 0.04);
  const bodySize = Math.round(headlineSize * 0.5);
  const ctaSize = Math.round(headlineSize * 0.45);

  const sidePanel = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: sideW,
        height: dims.height,
        background: color(input, "primary"),
        padding: pad,
      }}
    >
      {input.brand.logoUrl && (
        <img
          src={input.brand.logoUrl}
          width={Math.round(sideW * 0.35)}
          height={Math.round(sideW * 0.35)}
          style={{ borderRadius: Math.round(sideW * 0.04) }}
        />
      )}
      <div
        style={{
          fontSize: Math.round(sideW * 0.08),
          color: "#ffffff",
          fontWeight: 600,
          marginTop: Math.round(sideW * 0.06),
          display: "flex",
          textAlign: "center",
          fontFamily: headingFont(input),
        }}
      >
        {input.brand.name}
      </div>
    </div>
  );

  const mainPanel = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: mainW,
        height: dims.height,
        background: "#ffffff",
        padding: Math.round(pad * 1.5),
      }}
    >
      <div
        style={{
          fontSize: headlineSize,
          fontWeight: 700,
          color: "#111827",
          lineHeight: 1.2,
          display: "flex",
          fontFamily: headingFont(input),
        }}
      >
        {input.headline}
      </div>
      {input.bodyCopy && (
        <div
          style={{
            fontSize: bodySize,
            color: "#6b7280",
            lineHeight: 1.5,
            marginTop: Math.round(headlineSize * 0.4),
            fontFamily: bodyFont(input),
            display: "flex",
          }}
        >
          {input.bodyCopy}
        </div>
      )}
      {input.cta && (
        <div
          style={{
            display: "flex",
            marginTop: Math.round(headlineSize * 0.7),
            background: color(input, "primary"),
            color: "#ffffff",
            fontSize: ctaSize,
            fontWeight: 600,
            padding: `${Math.round(ctaSize * 0.55)}px ${Math.round(ctaSize * 1.5)}px`,
            borderRadius: Math.round(ctaSize * 0.4),
            alignSelf: "flex-start",
          }}
        >
          {input.cta}
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        width: dims.width,
        height: dims.height,
      }}
    >
      {sidePanel}
      {mainPanel}
    </div>
  );
};

// ── CTA Bar ─────────────────────────────────────────────────────────────────

const renderCtaBar: BlockRenderer = (input, dims, props) => {
  const _position = (props.position as string) ?? "bottom";
  const barH = Math.round(dims.height * 0.2);
  const fontSize = Math.round(barH * 0.4);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: dims.width,
        height: barH,
        background: color(input, "primary"),
        padding: `0 ${Math.round(dims.width * 0.05)}px`,
      }}
    >
      {input.cta && (
        <div
          style={{
            display: "flex",
            background: "#ffffff",
            color: color(input, "primary"),
            fontSize,
            fontWeight: 700,
            padding: `${Math.round(fontSize * 0.4)}px ${Math.round(fontSize * 1.5)}px`,
            borderRadius: Math.round(fontSize * 0.35),
            fontFamily: headingFont(input),
          }}
        >
          {input.cta}
        </div>
      )}
    </div>
  );
};

// ── Logo Strip ──────────────────────────────────────────────────────────────

const renderLogoStrip: BlockRenderer = (input, dims, props) => {
  const _position = (props.position as string) ?? "top";
  const stripH = Math.round(dims.height * 0.1);
  const logoSize = Math.round(stripH * 0.5);
  const fontSize = Math.round(stripH * 0.3);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: dims.width,
        height: stripH,
        background: "rgba(0,0,0,0.15)",
        gap: Math.round(dims.width * 0.015),
      }}
    >
      {input.brand.logoUrl && (
        <img
          src={input.brand.logoUrl}
          width={logoSize}
          height={logoSize}
          style={{ borderRadius: Math.round(logoSize * 0.15) }}
        />
      )}
      <div
        style={{
          fontSize,
          color: "#ffffff",
          fontWeight: 600,
          display: "flex",
          fontFamily: headingFont(input),
        }}
      >
        {input.brand.name}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Block-type dispatch map
// ---------------------------------------------------------------------------

const BLOCK_RENDERERS: Record<string, BlockRenderer> = {
  hero: renderHero,
  split: renderSplit,
  minimal: renderMinimal,
  bold: renderBold,
  sidebar: renderSidebar,
  "cta-bar": renderCtaBar,
  "logo-strip": renderLogoStrip,
};

// ---------------------------------------------------------------------------
// Render a single block by its config
// ---------------------------------------------------------------------------

function renderBlock(
  block: BlockConfig,
  input: TemplateInput,
  dims: { width: number; height: number },
): React.ReactElement {
  const renderer = BLOCK_RENDERERS[block.type];
  if (!renderer) {
    throw new Error(`Unknown block type: ${block.type}`);
  }
  return renderer(input, dims, block.props ?? {});
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Render a layout definition + template input into a React element tree.
 *
 * For single-block layouts the block occupies the full canvas.
 * For multi-block layouts the blocks are stacked vertically and the
 * available height is divided proportionally (the first block that is a
 * "primary" content block like hero/split/bold/minimal/sidebar gets the
 * majority of the space; supplementary blocks like cta-bar and logo-strip
 * receive a fixed proportion).
 */
export function renderLayout(
  layout: LayoutDefinition,
  input: TemplateInput,
): React.ReactElement {
  const dims = previewDimensions(layout);

  // Fast path: single block gets the whole canvas
  const firstBlock = layout.blocks[0];
  if (layout.blocks.length === 1 && firstBlock) {
    return renderBlock(firstBlock, input, dims);
  }

  // Multi-block: stack vertically.  Supplementary blocks (cta-bar,
  // logo-strip) take a small fixed fraction; the remaining space goes to
  // the primary block(s).
  const SUPPLEMENTARY: Set<string> = new Set(["cta-bar", "logo-strip"]);
  const supplementaryFraction = 0.15; // each supplementary block gets 15%

  const supplementaryCount = layout.blocks.filter((b) =>
    SUPPLEMENTARY.has(b.type),
  ).length;
  const primaryCount = layout.blocks.length - supplementaryCount;
  const totalSupplementaryH = supplementaryCount * supplementaryFraction;
  const primaryH =
    primaryCount > 0 ? (1 - totalSupplementaryH) / primaryCount : 1;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: dims.width,
        height: dims.height,
        overflow: "hidden",
      }}
    >
      {layout.blocks.map((block, idx) => {
        const isSupplementary = SUPPLEMENTARY.has(block.type);
        const fraction = isSupplementary ? supplementaryFraction : primaryH;
        const blockH = Math.round(dims.height * fraction);
        return (
          <div key={idx} style={{ display: "flex", width: dims.width, height: blockH }}>
            {renderBlock(block, input, { width: dims.width, height: blockH })}
          </div>
        );
      })}
    </div>
  );
}
