import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // External packages that must run in Node.js runtime (not Edge)
  serverExternalPackages: ["pg", "@xenova/transformers", "pdf2json", "pdf-parse"],

  // Images config for production
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
