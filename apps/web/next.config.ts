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
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
