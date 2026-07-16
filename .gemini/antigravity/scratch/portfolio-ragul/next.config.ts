import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vercel-optimized config */
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
