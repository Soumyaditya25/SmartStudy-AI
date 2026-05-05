import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Railway's external PostgreSQL connections
  serverExternalPackages: ["pg", "@xenova/transformers", "pdf2json", "pdf-parse"],

  // Images config for production
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
