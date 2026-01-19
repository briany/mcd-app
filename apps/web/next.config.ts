import type { NextConfig } from "next";

const validateEnv = () => {
  // Skip validation in CI or when explicitly disabled
  if (process.env.SKIP_ENV_VALIDATION === "true" || process.env.CI === "true") {
    return;
  }

  // Only validate public env vars during build (they're needed for client bundle)
  const requiredPublicEnv = ["NEXT_PUBLIC_MCP_BASE_URL"] as const;

  const missingKey = requiredPublicEnv.find((key) => {
    const value = process.env[key];
    return !value || value.trim().length === 0;
  });

  if (missingKey) {
    console.warn(
      `[next.config] Warning: Missing ${missingKey}. The app may not work correctly.`
    );
  }

  // Note: Server-only env vars (MCD_MCP_TOKEN) are validated at runtime in lib/config.ts
};

validateEnv();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mcd-portal-prod-cos1-1300270282.cos.ap-shanghai.myqcloud.com",
        pathname: "/campaign/prod/**",
      },
      {
        protocol: "https",
        hostname: "cms-cdn.mcd.cn",
        pathname: "/img/**",
      },
      {
        protocol: "https",
        hostname: "img.mcd.cn",
        pathname: "/cms/**",
      },
    ],
    // Disable image optimization to avoid private IP blocking in dev/VPN environments
    unoptimized: true,
  },
};

export default nextConfig;
