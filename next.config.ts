import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["https://preview-chat-56ceb53d-77ec-4713-9d49-adde30a76de4.space-z.ai"],
};

export default nextConfig;
