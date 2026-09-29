import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image.
  output: "standalone",
  // Playwright resolves its browser at runtime; keep it out of the bundle.
  serverExternalPackages: ["playwright-core"],
  // It also reads data files (browsers.json, protocol) at runtime, which file tracing can't see.
  outputFileTracingIncludes: { "/**": ["./node_modules/playwright-core/**/*"] },
  // Uploads (payment slips, 50 Tawi scans) go through server actions.
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
};

export default nextConfig;
