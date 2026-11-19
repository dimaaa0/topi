import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-7e57e2fc40dc402e9a868499a6e03b18.r2.dev',
        port: '',
        pathname: '/**',
      },
      // Сюда же можно добавить другие домены, если понадобятся
    ],
  },
  /* config options here */
  experimental: {
    // agentFeedback: true,
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
