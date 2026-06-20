import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Use the new proxy convention instead of middleware
  },
};

export default nextConfig;
