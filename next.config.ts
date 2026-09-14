import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow LAN development origins and Cloudflare Tunnel origins for WebSocket HMR and dev resources
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.*.*",
    "*.trycloudflare.com",
    "**.trycloudflare.com",
  ],
};

export default nextConfig;
