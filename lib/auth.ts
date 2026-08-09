import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET || "holystar_tech_secure_auth_secret_key_2026",
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  trustedOrigins: async (request?: Request) => {
    const allowed = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://localhost:3000",
    ];
    if (!request) return allowed;

    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host") || request.headers.get("x-forwarded-host");

    [origin, referer].forEach((headerVal) => {
      if (headerVal) {
        try {
          const url = new URL(headerVal);
          allowed.push(url.origin);
        } catch {
          // ignore invalid URL
        }
      }
    });

    if (host) {
      const cleanHost = host.split(",")[0].trim();
      allowed.push(`http://${cleanHost}`, `https://${cleanHost}`);
    }

    return Array.from(new Set(allowed.filter(Boolean)));
  },
});

