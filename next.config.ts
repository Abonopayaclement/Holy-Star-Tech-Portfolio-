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
    const queuelessApiUrl = process.env.QUEUELLESS_API_URL || (isDev ? "http://localhost:5000" : null);

    const rewritesList: any[] = [];

    if (queuelessApiUrl) {
      rewritesList.push({
        source: "/queueless/api/:path*",
        destination: `${queuelessApiUrl.replace(/\/$/, "")}/api/:path*`,
      });
    } else {
      rewritesList.push({
        source: "/queueless/api/:path*",
        destination: "/api/queueless/:path*",
      });
    }

    // Rewrite all QueueLess SPA routes to the compiled React index.html
    rewritesList.push(
      {
        source: "/queueless",
        destination: "/queueless/index.html",
      },
      {
        source: "/queueless/:path((?!static|favicon|logo|manifest|robots|api).*)",
        destination: "/queueless/index.html",
      }
    );

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
