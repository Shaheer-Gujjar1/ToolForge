import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow LAN development origins for WebSocket HMR
  allowedDevOrigins: ["localhost", "192.168.1.27", "127.0.0.1"],
};

export default nextConfig;
