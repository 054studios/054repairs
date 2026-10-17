import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return ["/documenten/:path*", "/boeking/:path*"].map((source) => ({
      source,
      headers: [
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
        { key: "Cache-Control", value: "private, no-store, max-age=0" },
      ],
    }));
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
