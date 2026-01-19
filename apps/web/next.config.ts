import type { NextConfig } from "next";

const validateEnv = () => {
  if (process.env.SKIP_ENV_VALIDATION === "true") {
    return;
  }

  const requiredServerEnv = ["MCD_MCP_TOKEN"] as const;
  const requiredPublicEnv = ["NEXT_PUBLIC_MCP_BASE_URL"] as const;

  const missingKey = [...requiredServerEnv, ...requiredPublicEnv].find((key) => {
    const value = process.env[key];
    return !value || value.trim().length === 0;
  });

  if (missingKey) {
    throw new Error(
      `[next.config] Missing ${missingKey}. Copy web/.env.example -> web/.env.local and fill in the values.`
    );
  }
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
