import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-auth"],
  eslint: {
    ignoreDuringBuilds: true,
  },

  reactStrictMode: true,
  compress: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async rewrites() {
    const isDev = process.env.NODE_ENV !== "production";
    const defaultWebUrl = isDev ? "http://localhost:3001" : "https://queueless.vercel.app";
    const rawUrl = (process.env.QUEUELLESS_WEB_URL || defaultWebUrl).replace(/\/$/, "");
    const baseUrl = rawUrl.endsWith("/queueless") ? rawUrl.slice(0, -"/queueless".length) : rawUrl;
    const queuelessApiUrl = process.env.QUEUELLESS_API_URL ? process.env.QUEUELLESS_API_URL.replace(/\/$/, "") : null;

    const rewritesList = [
      {
        source: "/queueless",
        destination: `${baseUrl}/queueless`,
      },
      {
        source: "/queueless/:path*",
        destination: `${baseUrl}/queueless/:path*`,
      },
    ];

    if (queuelessApiUrl) {
      rewritesList.unshift({
        source: "/queueless/api/:path*",
        destination: `${queuelessApiUrl}/api/:path*`,
      });
    }

    return rewritesList;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;
