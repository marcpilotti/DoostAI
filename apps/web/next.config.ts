import { join } from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: join(__dirname, "../../"),
  transpilePackages: [
    "@doost/db",
    "@doost/ai",
    "@doost/platforms",
    "@doost/brand",
    "@doost/templates",
    "@doost/intelligence",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "creatives.doost.tech" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  serverExternalPackages: [
    "postgres",
    "@resvg/resvg-js",
    "@resvg/resvg-js-darwin-arm64",
    "@resvg/resvg-js-linux-x64-gnu",
    "satori",
    "@mendable/firecrawl-js",
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.node$/,
      use: "node-loader",
      type: "javascript/auto",
    });
    return config;
  },
};

// Wrap with Sentry if DSN is configured
let exportedConfig = nextConfig;
try {
  if (process.env.SENTRY_DSN && !process.env.SENTRY_DSN.startsWith("https://...")) {
    const { withSentryConfig } = require("@sentry/nextjs");
    exportedConfig = withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    });
  }
} catch {
  // @sentry/nextjs not available — skip
}

export default exportedConfig;
