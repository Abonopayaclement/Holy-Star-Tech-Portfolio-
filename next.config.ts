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
    const targetWebUrl = process.env.QUEUELLESS_WEB_URL;
    const queuelessApiUrl = process.env.QUEUELLESS_API_URL || (isDev ? "http://localhost:5000" : null);

    const rewritesList: any[] = [];

    if (targetWebUrl) {
      const rawUrl = targetWebUrl.replace(/\/$/, "");
      const baseUrl = rawUrl.endsWith("/queueless") ? rawUrl.slice(0, -"/queueless".length) : rawUrl;
      rewritesList.push(
        {
          source: "/queueless/live",
          destination: `${baseUrl}/queueless`,
        },
        {
          source: "/queueless/live/:path*",
          destination: `${baseUrl}/queueless/:path*`,
        }
      );
    }

    if (queuelessApiUrl) {
      rewritesList.unshift({
        source: "/queueless/api/:path*",
        destination: `${queuelessApiUrl.replace(/\/$/, "")}/api/:path*`,
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
