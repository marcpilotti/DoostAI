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

export default nextConfig;
