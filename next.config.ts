import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  experimental: {
    // Payment receipts are accepted up to 2 MB; the server action default is
    // 1 MB, so leave headroom for the rest of the multipart form.
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
