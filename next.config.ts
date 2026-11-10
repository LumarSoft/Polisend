import type { NextConfig } from "next";

// The own domain. Vercel's default one (polisend.vercel.app) sends every page there, the panel included.
// Temporary redirect (307): browsers don't cache it, so going back is just reverting this change.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://polisend.com.ar").replace(/\/$/, "");

const nextConfig: NextConfig = {
  /* config options here */
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
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "polisend.vercel.app" }],
        destination: `${SITE_URL}/:path*`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
