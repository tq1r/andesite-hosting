import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output is only needed for local production runs — Vercel has
  // its own build pipeline and ignores/overrides this anyway.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  // Make sure the bundled SQLite snapshot ships with the API routes so the
  // serverless runtime can bootstrap /tmp/andesite.db from it.
  outputFileTracingIncludes: {
    "/api/**/*": ["./db/custom.db"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["https://preview-chat-56ceb53d-77ec-4713-9d49-adde30a76de4.space-z.ai"],
};

export default nextConfig;
