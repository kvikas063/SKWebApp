import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // lucide-react is imported icon-by-icon across many components.
  // Bundling the whole package per import blows up the client bundle; this
  // tells Next to trace and emit only the used icons.
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
};

export default nextConfig;
